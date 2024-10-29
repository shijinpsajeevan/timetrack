const router = require('express').Router();
const { sql, poolPromise } = require('../db');
const authorization = require ('../middleware/authorization')


router.get("/getEmployeeList",authorization,async(req,res)=>{
    try{
        const pool = await poolPromise; // Using the correct pool promise to handle connection
        const result = await pool.request().query(`SELECT EmployeeCode, EmployeeName FROM employees WHERE status = 'Working' AND RecordStatus = 1`);
        const employeelist = result.recordset;
        res.json(employeelist);
    }
    catch (error) {
        console.error("Error fetching Employee list:", error);
        res.status(500).send("Server Error");
    } finally{
        sql.close();
    }
})


// Attendance Regularization
router.post("/regularize-attendance", authorization, async (req, res) => {
    try {
        const { locationId: DeviceId, 
                employeeIds, 
                startDate: LogDate, 
                endDate: EndDate, 
                remarks: Remarks, 
                direction: Direction } = req.body;

        // Current date for DownloadDate
        const DownloadDate = new Date().toISOString();
        const AttDirection = Direction;
        const IsApproved = 1;
        const AttenndanceMarkingType = 'ME';

        // Validate required fields
        if (!DeviceId || !employeeIds || !LogDate || !EndDate || !Remarks || !Direction) {
            return res.status(400).json({ 
                success: false, 
                message: "All fields are required" 
            });
        }

        const pool = await poolPromise;
        const regularizedRecords = [];

        // Convert dates to Date objects
        let currentDate = new Date(LogDate);
        const endDate = new Date(EndDate);

        // Check if dates are in same month
        if (currentDate.getMonth() !== endDate.getMonth() || 
            currentDate.getFullYear() !== endDate.getFullYear()) {
            return res.status(400).json({ 
                success: false,
                message: 'The date range should be within the same month.'
            });
        }

        // Get month and year for table name
        const month = String(currentDate.getMonth() + 1).toString(); // Pad with leading zero
        const year = currentDate.getFullYear();
        const tableName = `DeviceLogs_${month}_${year}`;

        // Get device information
        const deviceResult = await pool.request()
            .input('DeviceId', sql.Int, DeviceId)
            .query('SELECT DeviceFName FROM Devices WHERE DeviceId = @DeviceId');

        if (deviceResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Device not found"
            });
        }

        const deviceName = deviceResult.recordset[0].DeviceFName;

        // Process each employee
        for (const UserId of employeeIds) {
            // Get employee name
            const employeeResult = await pool.request()
                .input('UserId', sql.VarChar(50), UserId)
                .query('SELECT EmployeeName FROM Employees WHERE EmployeeCode = @UserId');

            if (employeeResult.recordset.length === 0) {
                continue; // Skip if employee not found
            }

            const employeeName = employeeResult.recordset[0].EmployeeName;
            currentDate = new Date(LogDate); // Reset currentDate for each employee

            // Insert records for each date
            while (currentDate <= endDate) {
                const currentLogDate = currentDate.toISOString().slice(0, 19).replace('T', ' ');

                const result = await pool.request()
                    .input('DownloadDate', sql.DateTime, DownloadDate)
                    .input('DeviceId', sql.Int, DeviceId)
                    .input('UserId', sql.VarChar(50), UserId)
                    .input('Direction', sql.VarChar(10), Direction)
                    .input('AttDirection', sql.VarChar(10), AttDirection)
                    .input('LogDate', sql.DateTime, currentLogDate)
                    .input('IsApproved', sql.Bit, IsApproved)
                    .input('AttenndanceMarkingType', sql.VarChar(50), AttenndanceMarkingType)
                    .input('Remarks', sql.VarChar(500), Remarks)
                    .query(`
                        INSERT INTO ${tableName} 
                        (DownloadDate, DeviceId, UserId, Direction, AttDirection, 
                         LogDate, IsApproved, AttenndanceMarkingType, Remarks)
                        OUTPUT INSERTED.DeviceLogId
                        VALUES 
                        (@DownloadDate, @DeviceId, @UserId, @Direction, @AttDirection,
                         @LogDate, @IsApproved, @AttenndanceMarkingType, @Remarks)
                    `);

                    console.log(result,"from s");
                    

                const logId = result.recordset[0].DeviceLogId;

                // Add to response array
                regularizedRecords.push({
                    id: logId,
                    employeeId: UserId,
                    employeeName: employeeName,
                    locationName: deviceName,
                    Date: currentLogDate,
                    direction: Direction,
                    remarks: Remarks,
                    tableName: tableName
                });

                // Move to next day
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        res.status(200).json({
            success: true,
            message: `Logs inserted for the date range: ${LogDate} to ${EndDate}`,
            records: regularizedRecords
        });

    } catch (error) {
        console.error("Error in regularizing attendance:", error);
        res.status(500).json({
            success: false,
            message: "Failed to regularize attendance",
            error: error.message
        });
    }
});
//


//Get regualrized attendnace
    // Add this endpoint to your Express router (common.js)

router.post("/regularize-attendance/report", authorization, async (req, res) => {
    try {
        const { locationId, tableName } = req.body;
        
        if (!locationId || !tableName) {
            return res.status(400).json({
                success: false,
                message: "Location ID and table name are required"
            });
        }

        const pool = await poolPromise;
        
        // Query to fetch regularized attendance records
        const query = `
            SELECT 
                dl.DeviceLogId as id,
                e.EmployeeCode as employeeId,
                e.EmployeeName as employeeName,
                d.DeviceFName as locationName,
                dl.LogDate as Date,
                dl.Direction as direction,
                dl.Remarks as remarks,
                '${tableName}' as tableName
            FROM ${tableName} dl
            JOIN Employees e ON dl.UserId = e.EmployeeCode
            JOIN Devices d ON dl.DeviceId = d.DeviceId
            WHERE dl.DeviceId = @locationId
            AND dl.AttenndanceMarkingType = 'ME'
            ORDER BY dl.LogDate DESC`;

        const result = await pool.request()
            .input('locationId', sql.Int, locationId)
            .query(query);

        res.status(200).json({
            success: true,
            records: result.recordset
        });

    } catch (error) {
        console.error("Error fetching regularization report:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch report",
            error: error.message
        });
    }
});
//

//Delete the regularized record.
router.delete("/regularize-attendance/:id", authorization, async (req, res) => {
    try {
        const { id } = req.params;
        const { tableName } = req.query; // You'll need to pass the table name
        
        const pool = await poolPromise;
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`DELETE FROM ${tableName} WHERE DeviceLogId = @id`);
            
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Record not found"
            });
        }
        
        res.json({
            success: true,
            message: "Record deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting record:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete record",
            error: error.message
        });
    }
});
//

router.post("/getDeviceList",authorization,async (req, res) => {
    try {
    console.log("Getting Request from client");
        // 2. Check if user exists
    const pool = await poolPromise; // Using the correct pool promise to handle connection
    const result = await pool.request()
      .query('select DeviceId,DeviceFName,SerialNumber,LastLogDownloadDate,DeviceLocation from dbo.Devices where IsRealTime=1');


            // Extract the recordset from the query result
        const locationList = result.recordset;

        console.log(locationList,"Location list of devices")

        // Return the location list as a JSON response
        res.json(locationList);
        
  
    } catch (error) {
        console.error("Error fetching location list:", error);
        res.status(500).send("Server Error");
    }
  });

  //For getting Location name - Type1 - Device location, Type2- Location Based, Type3- Device groupBased

  router.get("/getLocation", authorization, async(req, res) => {
    try {
        console.log("Getting request for location");
        const { locationId, locationType } = req.query;

        const pool = await poolPromise;
        
        if (!locationId || !locationType) {
            return res.status(400).json({
                success: false,
                message: "Location ID and location type are required"
            });
        }

        // Query to get location name based on location type
        let query;
        if (locationType === '1') {
            query = `select dev.DeviceFName AS LocationName from Devices dev JOIN Locations loc ON loc.LocationId = dev.DeviceLocation where DeviceId = @locationId`;
        } else {
            // Add queries for other location types if needed
            return res.status(400).json({
                success: false,
                message: "Invalid location type"
            });
        }

        const results = await pool.request()
        .input('locationId', sql.Int, locationId)  // Securely pass locationId to prevent SQL injection
        .query(query);

        if (!results || results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Location not found"
            });
        }

        console.log("Location result , results",results)

        res.status(200).json({
            success: true,
            locationName: results.recordset[0].LocationName
        });

    } catch (error) {
        console.error("Error fetching location:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch location",
            error: error.message
        });
    }
});


// Get Contract Count / staff count

// router.get("/getContractCount", authorization, async (req, res) => {
//     try {
//         const { locationId, date, contractType } = req.query;

//         if (!locationId || !date) {
//             return res.status(400).json({
//                 success: false,
//                 message: "LocationId and date are required"
//             });
//         }

//         const pool = await poolPromise;

//         // Parse the date to extract year and month
//         const parsedDate = new Date(date);
//         const year = parsedDate.getFullYear();
//         const month = parsedDate.getMonth() + 1; // JavaScript months are 0-based
        

//         // Base query
//         let query = `
//             SELECT StaffCount as contractCount
//             FROM LocationContracts
//             WHERE LocationID = @locationId
//             AND Year = @year
//             AND Month = @month
//         `;

//         const request = pool.request()
//             .input('locationId', sql.Int, locationId)
//             .input('year', sql.Int, year)
//             .input('month', sql.Int, month);

//         // Add contractType filter if provided
//         if (contractType) {
//             query += ` AND ContractType = @contractType`;
//             request.input('contractType', sql.VarChar(10), contractType);
//         }

//         const result = await request.query(query);

//         console.log(query,"query");
        
//         console.log("Log result from count",result);
        

//         res.status(200).json({
//             success: true,
//             count: result.recordset[0].contractCount
//         });

//     } catch (error) {
//         console.error("Error fetching contract count:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to fetch contract count",
//             error: error.message
//         });
//     }
// });


router.get("/getContractCount", authorization, async (req, res) => {
    try {
        const { locationId, date, contractType } = req.query;
        
        if (!locationId || !date) {
            return res.status(400).json({ 
                success: false, 
                message: "LocationId and date are required" 
            });
        }

        const pool = await poolPromise;
        const parsedDate = new Date(date);
        const year = parsedDate.getFullYear();
        const month = parsedDate.getMonth() + 1;

        let query = `
            SELECT StaffCount as contractCount 
            FROM LocationContracts 
            WHERE LocationID = @locationId 
            AND Year = @year 
            AND Month = @month
        `;

        const request = pool.request()
            .input('locationId', sql.Int, locationId)
            .input('year', sql.Int, year)
            .input('month', sql.Int, month);

        if (contractType) {
            query += ` AND ContractType = @contractType`;
            request.input('contractType', sql.VarChar(10), contractType);
        }

        const result = await request.query(query);
        console.log("Query:", query);
        console.log("Result:", result);

        // Check if any records were found
        if (result.recordset.length === 0) {
            return res.status(200).json({
                success: true,
                count: 0,  // Return 0 if no contract found
                message: "No contract found for the specified criteria"
            });
        }

        // If records were found, return the count
        res.status(200).json({
            success: true,
            count: result.recordset[0].contractCount
        });

    } catch (error) {
        console.error("Error fetching contract count:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch contract count",
            error: error.message
        });
    }
});


//Get Holiday List

router.get("/getHolidays", authorization, async (req, res) => {
    try {
        console.log("Get Holiday List from the database");
        const { month, year } = req.query;
        
        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: "Month and year are required parameters"
            });
        }

        const pool = await poolPromise;
        
        // Create date range for the specified month
        const startDate = new Date(year, month - 1, 1); // Month is 0-based in JavaScript
        const endDate = new Date(year, month, 0); // Last day of the month

        const query = `
            SELECT 
                HolidayId,
                HolidayDate as date,
                HolidayName as name
            FROM dbo.Holidays 
            WHERE RecordStatus = 1 
            AND MONTH(HolidayDate) = @month 
            AND YEAR(HolidayDate) = @year
            ORDER BY HolidayDate`;

        const result = await pool.request()
            .input('month', sql.Int, month)
            .input('year', sql.Int, year)
            .query(query);

        console.log("result from holiday",result);
        

        res.status(200).json({
            success: true,
            holidays: result.recordset
        });

    } catch (error) {
        console.error("Error fetching holidays:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch holidays"
        });
    } finally {
        sql.close();
    }
});


  //For taking the logs based on month - TYPE3
  router.post("/getDeviceLogs", authorization, async (req, res) => {
    try {
        console.log("Getting Log request type 3 -month basis");
        const { locationId, tableName, type } = req.body;
        console.log("Request from ", locationId, tableName, type);

        const pool = await poolPromise; 
        let query = '';

        switch (type) {
            case 1:
                query = `SELECT * FROM ${tableName} WHERE DeviceId = @locationId`;
                break;
            case 2:
                query = `SELECT * FROM ${tableName} WHERE DeviceId = @locationId`;
                break;
            case 3:
                query = `SELECT 
    emp.EmployeeCode,
    emp.EmployeeCodeInDevice,
    emp.EmployeeName,
    emp.Gender,
    emp.CompanyId,
	empLoc.LocationName AS EmployeeLocation,
	desg.DesignationsName AS Designation,
    cat.CategoryName,
    cat.CategoryId,
    cat.IsWeeklyOff1,
    cat.IsWeeklyOff2,
    cat.WeeklyOff1Day,
    cat.WeeklyOff2Day,
	comp.CompanyFName,
    dept.DepartmentFName AS Department,
    loc.LocationName AS DeviceLocation,
    dev.DeviceFName AS DeviceName,
    dev.SerialNumber AS DeviceSerialNumber,
    logs.AttenndanceMarkingType AS AttendanceMarkingType,
    logs.LogDate AS LogDate
FROM 
    ${tableName} logs
JOIN 
    dbo.Employees emp ON logs.UserId = emp.EmployeeCode
JOIN 
    dbo.Departments dept ON emp.DepartmentId = dept.DepartmentId
JOIN 
    dbo.Devices dev ON logs.DeviceId = dev.DeviceId
JOIN 
    dbo.Locations loc ON dev.DeviceLocation = loc.LocationId
JOIN 
	dbo.Companies comp ON emp.CompanyId = comp.CompanyId
JOIN 
    dbo.Locations empLoc ON emp.Location = empLoc.LocationId
JOIN 
	dbo.Designations desg ON emp.Designation = desg.DesignationId
JOIN
    dbo.Categories cat on emp.CategoryId=cat.CategoryId
WHERE  
    dev.DeviceId = @locationId`;
                break;
            default:
                return res.status(400).json("Invalid type");
        }

        console.log("Received locationId:", locationId);

        const result = await pool.request()
            .input('locationId', sql.Int, locationId)  // Securely pass locationId to prevent SQL injection
            .query(query);  // Use the dynamically created query

        if (result.recordset.length === 0) {
            return res.json(0);
        } else {
            // If record found, return the RequiredCount
            return res.json(result.recordset);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});



// Add this to your existing router file

// Get location contracts
router.get("/getLocationContracts", authorization, async (req, res) => {
    try {
        const { 
            locationId, 
            startYear, 
            startMonth, 
            endYear, 
            endMonth, 
            contractType 
        } = req.query;
        
        if (!locationId || !startYear || !startMonth || !endYear || !endMonth) {
            return res.status(400).json({
                success: false,
                message: "LocationId and date range are required"
            });
        }

        const pool = await poolPromise;
        
        const query = `
            SELECT 
                lc.ContractID as contractId,
                lc.LocationID as locationId,
                lc.Year as year,
                lc.Month as month,
                lc.ContractType as contractType,
                lc.StaffCount as staffCount,
                d.DeviceFName as locationName
            FROM LocationContracts lc
            JOIN Devices d ON lc.LocationID = d.DeviceId
            WHERE lc.LocationID = @locationId
            AND (
                (lc.Year = @startYear AND lc.Month >= @startMonth)
                OR (lc.Year = @endYear AND lc.Month <= @endMonth)
                OR (lc.Year > @startYear AND lc.Year < @endYear)
            )
            ORDER BY lc.Year DESC, lc.Month DESC`;

        const request = pool.request()
            .input('locationId', sql.Int, locationId)
            .input('startYear', sql.Int, parseInt(startYear))
            .input('startMonth', sql.Int, parseInt(startMonth))
            .input('endYear', sql.Int, parseInt(endYear))
            .input('endMonth', sql.Int, parseInt(endMonth));

        if (contractType) {
            request.input('contractType', sql.VarChar(10), contractType);
        }

        const result = await request.query(query);

        res.status(200).json({
            success: true,
            contracts: result.recordset
        });

    } catch (error) {
        console.error("Error fetching location contracts:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch contracts",
            error: error.message
        });
    }
});

//

// Get location contracts
router.get("/locationContracts", authorization, async (req, res) => {
    try {
        const { 
            locationId, 
            startYear, 
            startMonth, 
            endYear, 
            endMonth, 
            contractType 
        } = req.query;
        
        if (!locationId || !startYear || !startMonth || !endYear || !endMonth) {
            return res.status(400).json({
                success: false,
                message: "LocationId and date range are required"
            });
        }

        const pool = await poolPromise;
        
        const query = `
            SELECT 
                lc.ContractID as contractId,
                lc.LocationID as locationId,
                lc.Year as year,
                lc.Month as month,
                lc.ContractType as contractType,
                lc.StaffCount as staffCount,
                d.DeviceFName as locationName
            FROM LocationContracts lc
            JOIN Devices d ON lc.LocationID = d.DeviceId
            WHERE lc.LocationID = @locationId
            AND (
                (lc.Year = @startYear AND lc.Month >= @startMonth)
                OR (lc.Year = @endYear AND lc.Month <= @endMonth)
                OR (lc.Year > @startYear AND lc.Year < @endYear)
            )
            ${contractType ? "AND lc.ContractType = @contractType" : ""}
            ORDER BY lc.Year DESC, lc.Month DESC`;

        const request = pool.request()
            .input('locationId', sql.Int, locationId)
            .input('startYear', sql.Int, parseInt(startYear))
            .input('startMonth', sql.Int, parseInt(startMonth))
            .input('endYear', sql.Int, parseInt(endYear))
            .input('endMonth', sql.Int, parseInt(endMonth));

        if (contractType) {
            request.input('contractType', sql.VarChar(10), contractType);
        }

        const result = await request.query(query);

        res.status(200).json({
            success: true,
            contracts: result.recordset
        });

    } catch (error) {
        console.error("Error fetching location contracts:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch contracts",
            error: error.message
        });
    }
});

// Create new contracts
// router.post("/locationContracts", authorization, async (req, res) => {
//     const pool = await poolPromise;
//     const transaction = pool.transaction();

//     try {
//         const {
//             locationId,
//             startYear,
//             startMonth,
//             endYear,
//             endMonth,
//             staffCount,
//             contractType,
//             overwrite = false
//         } = req.body;

//         // Input validation
//         if (!locationId || !startYear || !startMonth || !endYear || !endMonth || !staffCount || !contractType) {
//             return res.status(400).json({
//                 success: false,
//                 message: "All fields are required"
//             });
//         }

//         await transaction.begin();

//         // If overwrite is true, delete existing contracts in the date range
//         if (overwrite) {
//             const deleteQuery = `
//                 DELETE FROM LocationContracts 
//                 WHERE LocationID = @locationId
//                 AND ContractType = @contractType
//                 AND (
//                     (Year = @startYear AND Month >= @startMonth)
//                     OR (Year = @endYear AND Month <= @endMonth)
//                     OR (Year > @startYear AND Year < @endYear)
//                 )`;

//             await transaction.request()
//                 .input('locationId', sql.Int, locationId)
//                 .input('startYear', sql.Int, startYear)
//                 .input('startMonth', sql.Int, startMonth)
//                 .input('endYear', sql.Int, endYear)
//                 .input('endMonth', sql.Int, endMonth)
//                 .input('contractType', sql.VarChar(10), contractType)
//                 .query(deleteQuery);
//         }

//         // Insert new contracts
//         const insertedContracts = [];
//         let currentYear = startYear;
//         let currentMonth = startMonth;

//         while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
//             const insertQuery = `
//                 INSERT INTO LocationContracts (
//                     LocationID, Year, Month, StaffCount, ContractType
//                 )
//                 OUTPUT INSERTED.ContractID
//                 VALUES (
//                     @locationId, @year, @month, @staffCount, @contractType
//                 )`;

//             const result = await transaction.request()
//                 .input('locationId', sql.Int, locationId)
//                 .input('year', sql.Int, currentYear)
//                 .input('month', sql.Int, currentMonth)
//                 .input('staffCount', sql.Int, staffCount)
//                 .input('contractType', sql.VarChar(10), contractType)
//                 .query(insertQuery);

//             insertedContracts.push({
//                 contractId: result.recordset[0].ContractID,
//                 year: currentYear,
//                 month: currentMonth
//             });

//             // Move to next month
//             currentMonth++;
//             if (currentMonth > 12) {
//                 currentMonth = 1;
//                 currentYear++;
//             }
//         }

//         await transaction.commit();

//         res.status(200).json({
//             success: true,
//             message: "Contracts created successfully",
//             contracts: insertedContracts
//         });

//     } catch (error) {
//         await transaction.rollback();
//         console.error("Error creating contracts:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to create contracts",
//             error: error.message
//         });
//     }
// });

router.post("/locationContracts", authorization, async (req, res) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
        const {
            locationId,
            startYear,
            startMonth,
            endYear,
            endMonth,
            staffCount,
            contractType,
            overwrite = false
        } = req.body;

        // Input validation
        if (!locationId || !startYear || !startMonth || !endYear || !endMonth || !staffCount || !contractType) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Validate date range
        if (startYear > endYear || (startYear === endYear && startMonth > endMonth)) {
            return res.status(400).json({
                success: false,
                message: "End date must be after start date"
            });
        }

        // Begin transaction
        await transaction.begin();

        // Check for existing contracts in the date range
        const checkRequest = new sql.Request(transaction);
        checkRequest.input('locationId', sql.Int, locationId);
        checkRequest.input('startYear', sql.Int, startYear);
        checkRequest.input('startMonth', sql.Int, startMonth);
        checkRequest.input('endYear', sql.Int, endYear);
        checkRequest.input('endMonth', sql.Int, endMonth);
        checkRequest.input('contractType', sql.VarChar(10), contractType);

        const checkQuery = `
            SELECT Year, Month
            FROM LocationContracts
            WHERE LocationID = @locationId
            AND ContractType = @contractType
            AND (
                (Year = @startYear AND Month >= @startMonth)
                OR (Year = @endYear AND Month <= @endMonth)
                OR (Year > @startYear AND Year < @endYear)
            )`;

        const existingContracts = await checkRequest.query(checkQuery);

        if (existingContracts.recordset.length > 0 && !overwrite) {
            await transaction.rollback();
            return res.status(409).json({
                success: false,
                message: "Contracts already exist for some months in this date range",
                conflicts: existingContracts.recordset
            });
        }

        // If overwrite is true and contracts exist, delete them
        if (existingContracts.recordset.length > 0 && overwrite) {
            const deleteRequest = new sql.Request(transaction);
            deleteRequest.input('locationId', sql.Int, locationId);
            deleteRequest.input('startYear', sql.Int, startYear);
            deleteRequest.input('startMonth', sql.Int, startMonth);
            deleteRequest.input('endYear', sql.Int, endYear);
            deleteRequest.input('endMonth', sql.Int, endMonth);
            deleteRequest.input('contractType', sql.VarChar(10), contractType);

            const deleteQuery = `
                DELETE FROM LocationContracts 
                WHERE LocationID = @locationId
                AND ContractType = @contractType
                AND (
                    (Year = @startYear AND Month >= @startMonth)
                    OR (Year = @endYear AND Month <= @endMonth)
                    OR (Year > @startYear AND Year < @endYear)
                )`;
            
            await deleteRequest.query(deleteQuery);
        }

        // Insert new contracts
        const insertedContracts = [];
        let currentYear = startYear;
        let currentMonth = startMonth;

        while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
            const insertRequest = new sql.Request(transaction);
            insertRequest.input('locationId', sql.Int, locationId);
            insertRequest.input('year', sql.Int, currentYear);
            insertRequest.input('month', sql.Int, currentMonth);
            insertRequest.input('staffCount', sql.Int, staffCount);
            insertRequest.input('contractType', sql.VarChar(10), contractType);

            const insertQuery = `
                INSERT INTO LocationContracts (
                    LocationID, Year, Month, StaffCount, ContractType
                )
                OUTPUT INSERTED.*
                VALUES (
                    @locationId, @year, @month, @staffCount, @contractType
                )`;

            const result = await insertRequest.query(insertQuery);
            
            insertedContracts.push({
                contractId: result.recordset[0].ContractID,
                locationId: result.recordset[0].LocationID,
                year: currentYear,
                month: currentMonth,
                staffCount: staffCount,
                contractType: contractType
            });

            // Move to next month
            currentMonth++;
            if (currentMonth > 12) {
                currentMonth = 1;
                currentYear++;
            }
        }

        // Commit transaction
        await transaction.commit();

        res.status(200).json({
            success: true,
            message: "Contracts created successfully",
            contracts: insertedContracts
        });

    } catch (error) {
        console.error("Error creating contracts:", error);
        
        try {
            await transaction.rollback();
        } catch (rollbackError) {
            console.error("Error rolling back transaction:", rollbackError);
        }

        // Handle specific errors
        if (error.number === 2627) {
            return res.status(409).json({
                success: false,
                message: "Duplicate contract entries found. Please use overwrite=true to replace existing contracts.",
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create contracts",
            error: error.message
        });
    }
});



// Update contract
router.put("/locationContracts/:contractId", authorization, async (req, res) => {
    try {
        const { contractId } = req.params;
        const { staffCount, contractType } = req.body;
        
        if (!staffCount && !contractType) {
            return res.status(400).json({
                success: false,
                message: "At least one field (staffCount or contractType) must be provided"
            });
        }

        const pool = await poolPromise;
        
        // Build the SET clause dynamically without trailing comma
        const setClause = [];
        if (staffCount) setClause.push('StaffCount = @staffCount');
        if (contractType) setClause.push('ContractType = @contractType');
        
        const updateQuery = `
            UPDATE LocationContracts
            SET ${setClause.join(', ')}
            OUTPUT INSERTED.*
            WHERE ContractID = @contractId`;
            
        const request = pool.request()
            .input('contractId', sql.Int, contractId);
        
        if (staffCount) request.input('staffCount', sql.Int, staffCount);
        if (contractType) request.input('contractType', sql.VarChar(10), contractType);
        
        const result = await request.query(updateQuery);
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Contract not found"
            });
        }
        
        res.status(200).json({
            success: true,
            message: "Contract updated successfully",
            contract: result.recordset[0]
        });
    } catch (error) {
        console.error("Error updating contract:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update contract",
            error: error.message
        });
    }
});

// Delete contract
// router.delete("/locationContracts/:contractId", authorization, async (req, res) => {
//     const pool = await poolPromise;
//     const transaction = new sql.Transaction(pool);

//     try {
//         const { contractId } = req.params;
        
//         // Begin transaction
//         await transaction.begin();
        
//         // Create a request object linked to the transaction
//         const request = new sql.Request(transaction);
//         request.input('contractId', sql.Int, contractId);
        
//         // First check if the contract exists
//         const checkQuery = `
//             SELECT ContractID 
//             FROM LocationContracts 
//             WHERE ContractID = @contractId`;
            
//         const checkResult = await request.query(checkQuery);
        
//         if (checkResult.recordset.length === 0) {
//             await transaction.rollback();
//             return res.status(404).json({
//                 success: false,
//                 message: "Contract not found"
//             });
//         }
        
//         // Proceed with deletion
//         const deleteQuery = `
//             DELETE FROM LocationContracts 
//             WHERE ContractID = @contractId`;
            
//         await request.query(deleteQuery);
        
//         // Commit the transaction
//         await transaction.commit();
        
//         res.status(200).json({
//             success: true,
//             message: "Contract deleted successfully"
//         });
        
//     } catch (error) {
//         console.error("Error deleting contract:", error);
        
//         // Attempt to rollback the transaction
//         try {
//             await transaction.rollback();
//         } catch (rollbackError) {
//             console.error("Error rolling back transaction:", rollbackError);
//         }
        
//         // Check for specific database errors
//         if (error.code === 'EREQUEST') {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid database request",
//                 error: error.message
//             });
//         }
        
//         res.status(500).json({
//             success: false,
//             message: "Failed to delete contract",
//             error: error.message
//         });
//     }
// });

router.delete("/locationContracts/:contractId", authorization, async (req, res) => {
    try {
        const { contractId } = req.params;
        
        const pool = await poolPromise;
        const request = pool.request();
        request.input('contractId', sql.Int, contractId);
        
        // Delete the contract and return the deleted row count
        const deleteQuery = `
            DELETE FROM LocationContracts 
            OUTPUT DELETED.*
            WHERE ContractID = @contractId`;
            
        const result = await request.query(deleteQuery);
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Contract not found"
            });
        }
        
        res.status(200).json({
            success: true,
            message: "Contract deleted successfully",
            deletedContract: result.recordset[0]
        });
        
    } catch (error) {
        console.error("Error deleting contract:", error);
        
        // Handle foreign key constraint violations
        if (error.number === 547) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete this contract as it is referenced by other records",
                error: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: "Failed to delete contract",
            error: error.message
        });
    }
});


  module.exports = router;