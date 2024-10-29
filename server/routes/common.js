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

router.get("/getContractCount",authorization,async(req,res)=>{
    try {
        console.log("GetContract count");
    } catch (error) {
        
    }
})


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


  module.exports = router;