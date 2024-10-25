const router = require('express').Router();
const { sql, poolPromise } = require('../db');
const authorization = require ('../middleware/authorization')

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
    } finally{
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