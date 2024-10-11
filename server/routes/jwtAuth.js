const router = require('express').Router();
const { sql, poolPromise } = require('../db'); // Ensure poolPromise is correctly imported
const bcrypt = require('bcrypt');
const jwtGenerator = require('../utils/jwtGenerator'); // Assuming you have a custom JWT generator
const validinfo = require('../middleware/validinfo');
const authorization = require('../middleware/authorization');

router.post("/login", validinfo, async (req, res) => {
  try {
    // 1. Destructure the req.body
    const { email, password } = req.body;
    console.log(email,password);

    // 2. Check if user exists
    const pool = await poolPromise; // Using the correct pool promise to handle connection
    const userResult = await pool.request()
      .input('userMail', sql.VarChar, email) // Assuming you want to query by email
      .query('SELECT * FROM userLogin WHERE userMail = @userMail and ApprovedUser=1');

    const user = userResult.recordset[0]; // Get the first record from the result

    console.log(userResult,"result");

    if (!user) {
      return res.status(401).json("Email/Password is incorrect");
    }

    // 3. Check if incoming password matches the hashed password in the database
    const validPassword = await bcrypt.compare(password, user.UserPassword);

    if (!validPassword) {
      return res.status(401).json("Password or Email is incorrect");
    }

    // 4. Generate JWT token
    const token = jwtGenerator(user.UserId, user.UserMail); // Ensure the jwtGenerator function handles this correctly

    res.json({ token, isAdmin: user.IsAdmin , isSuperAdmin: user.IsSuperAdmin, userType: user.UserType, firstName: user.FirstName, userID:user.UserId});

  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

router.get("/is-verify", authorization, async (req, res) => {
  try {
    res.json(true); // If authorized, return true
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
