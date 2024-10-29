// const router = require('express').Router();
// const { sql, poolPromise } = require('../db'); // Ensure poolPromise is correctly imported
// const bcrypt = require('bcrypt');
// const jwtGenerator = require('../utils/jwtGenerator'); // Assuming you have a custom JWT generator
// const validinfo = require('../middleware/validinfo');
// const authorization = require('../middleware/authorization');

// router.post("/login", validinfo, async (req, res) => {
//   try {
//     // 1. Destructure the req.body
//     const { email, password } = req.body;
//     console.log(email,password);

//     // 2. Check if user exists
//     const pool = await poolPromise; // Using the correct pool promise to handle connection
//     const userResult = await pool.request()
//       .input('userMail', sql.VarChar, email) // Assuming you want to query by email
//       .query('SELECT * FROM userLogin WHERE userMail = @userMail and ApprovedUser=1');

//     const user = userResult.recordset[0]; // Get the first record from the result

    

//     if (!user) {
//       return res.status(401).json("Email/Password is incorrect");
//     }

//     // 3. Check if incoming password matches the hashed password in the database
//     const validPassword = await bcrypt.compare(password, user.UserPassword);

//     if (!validPassword) {
//       return res.status(401).json("Password or Email is incorrect");
//     }

//     // 4. Generate JWT token
//     const token = jwtGenerator(user.UserID, user.UserMail); // Ensure the jwtGenerator function handles this correctly

//     res.json({ token, isAdmin: user.IsAdmin , isSuperAdmin: user.IsSuperAdmin, userType: user.UserType, firstName: user.FirstName, lastName:user.LastName, userID:user.UserId, designation:user.Designation});

//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Server Error");
//   }
// });

// router.get("/is-verify", authorization, async (req, res) => {
    
    
//   try {
//     res.json(true); // If authorized, return true
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Server Error");
//   }
// });


// // Get all users
// router.get('/users', authorization, async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     const result = await pool.request()
//       .query(`
//         SELECT 
//           UserID, FirstName, LastName, Company, UserType, 
//           IsAdmin, IsSuperAdmin, UserName, UserMail, 
//           ApprovedUser, Active, Permissions 
//         FROM UserLogin 
//         ORDER BY FirstName, LastName
//       `);
    
//     res.json(result.recordset);
//   } catch (error) {
//     console.error('Error fetching users:', error);
//     res.status(500).json('Server error');
//   }
// });


// // Create a new user
// router.post("/users", authorization, async (req, res) => {
//   const { firstName, lastName, userMail, userName, company, userType, password, isAdmin, isSuperAdmin } = req.body;
//   try {
//     const pool = await poolPromise;
//     const salt = await bcrypt.genSalt(10);
//     const bcryptPassword = await bcrypt.hash(password, salt);

//     await pool.request()
//       .input('firstName', sql.VarChar, firstName)
//       .input('lastName', sql.VarChar, lastName)
//       .input('userMail', sql.VarChar, userMail)
//       .input('userName', sql.VarChar, userName)
//       .input('company', sql.VarChar, company)
//       .input('userType', sql.VarChar, userType)
//       .input('password', sql.VarChar, bcryptPassword)
//       .input('isAdmin', sql.Bit, isAdmin)
//       .input('isSuperAdmin', sql.Bit, isSuperAdmin)
//       .query(`INSERT INTO userLogin (FirstName, LastName, UserMail, UserName, Company, UserType, UserPassword, IsAdmin, IsSuperAdmin, Active) 
//               VALUES (@firstName, @lastName, @userMail, @userName, @company, @userType, @password, @isAdmin, @isSuperAdmin, 1)`);

//     res.status(201).json("User created successfully");
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json("Server error");
//   }
// });

// // Update user details
// router.put("/users/:userId", authorization, async (req, res) => {
//   const { FirstName, LastName, UserMail, UserName, Company, UserType, IsAdmin, IsSuperAdmin } = req.body;
//   const { userId } = req.params;

//   try {
//     const pool = await poolPromise;
//     await pool.request()
//       .input('firstName', sql.VarChar, FirstName)
//       .input('lastName', sql.VarChar, LastName)
//       .input('userMail', sql.VarChar, UserMail)
//       .input('userName', sql.VarChar, FirstName)
//       .input('company', sql.VarChar, Company)
//       .input('userType', sql.VarChar, UserType)
//       .input('isAdmin', sql.Bit, IsAdmin)
//       .input('isSuperAdmin', sql.Bit, IsSuperAdmin)
//       .input('userId', sql.Int, userId)
//       .query(`UPDATE userLogin SET FirstName = @firstName, LastName = @lastName, UserMail = @userMail, UserName = @userName, 
//               Company = @company, UserType = @userType, IsAdmin = @isAdmin, IsSuperAdmin = @isSuperAdmin 
//               WHERE UserID = @userId`);

//     res.json("User updated successfully");
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json("Server error");
//   }
// });

// // Reset user password
// router.put("/users/:userId/password", authorization, async (req, res) => {
//   const { newPassword, currentPassword } = req.body;
//   const { userId } = req.params;

//   try {
//     const pool = await poolPromise;
//     const userResult = await pool.request()
//       .input('userId', sql.Int, userId)
//       .query('SELECT UserPassword FROM userLogin WHERE UserID = @userId');

//     const user = userResult.recordset[0];
//     if (!user) return res.status(404).json("User not found");

//     const salt = await bcrypt.genSalt(10);
//     const bcryptPassword = await bcrypt.hash(newPassword, salt);

//     await pool.request()
//       .input('userId', sql.Int, userId)
//       .input('password', sql.VarChar, bcryptPassword)
//       .query('UPDATE userLogin SET UserPassword = @password WHERE UserID = @userId');

//     res.json("Password updated successfully");
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json("Server error");
//   }
// });






// module.exports = router;






const router = require('express').Router();
const { sql, poolPromise } = require('../db');
const bcrypt = require('bcrypt');
const jwtGenerator = require('../utils/jwtGenerator');
const validinfo = require('../middleware/validinfo');
const authorization = require('../middleware/authorization');

// Existing routes remain the same...
router.post("/login", validinfo, async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email,password);

    const pool = await poolPromise;
    const userResult = await pool.request()
      .input('userMail', sql.VarChar, email)
      .query('SELECT * FROM userLogin WHERE userMail = @userMail and ApprovedUser=1');

    const user = userResult.recordset[0];

    if (!user) {
      return res.status(401).json("Email/Password is incorrect");
    }

    const validPassword = await bcrypt.compare(password, user.UserPassword);

    if (!validPassword) {
      return res.status(401).json("Password or Email is incorrect");
    }

    const token = jwtGenerator(user.UserID, user.UserMail);

    res.json({ token, isAdmin: user.IsAdmin , isSuperAdmin: user.IsSuperAdmin, userType: user.UserType, firstName: user.FirstName, lastName:user.LastName, userID:user.UserId, designation:user.Designation});

  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

router.get("/is-verify", authorization, async (req, res) => {
  try {
    res.json(true);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

router.get('/users', authorization, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT 
          UserID, FirstName, LastName, Company, UserType, 
          IsAdmin, IsSuperAdmin, UserName, UserMail, 
          ApprovedUser, Active, Permissions 
        FROM UserLogin 
        ORDER BY FirstName, LastName
      `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json('Server error');
  }
});

router.post("/users", authorization, async (req, res) => {
  const { FirstName, LastName, UserMail, Company, UserType, password, IsAdmin, IsSuperAdmin } = req.body;
  
  try {
    // Input validation
    if (!FirstName || !LastName || !UserMail || !password) {
      return res.status(400).json("Missing required fields");
    }

    const pool = await poolPromise;

    // Check if user already exists
    const existingUser = await pool.request()
      .input('userMail', sql.VarChar, UserMail)
      .query('SELECT UserID FROM userLogin WHERE UserMail = @userMail');

    if (existingUser.recordset.length > 0) {
      return res.status(409).json("User with this email already exists");
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    if (!salt) {
      throw new Error("Failed to generate salt");
    }

    const bcryptPassword = await bcrypt.hash(password, salt);
    if (!bcryptPassword) {
      throw new Error("Failed to hash password");
    }

    // Insert new user
    await pool.request()
      .input('firstName', sql.VarChar, FirstName)
      .input('lastName', sql.VarChar, LastName)
      .input('userMail', sql.VarChar, UserMail)
      .input('userName', sql.VarChar, FirstName)
      .input('company', sql.VarChar, Company || '')
      .input('userType', sql.VarChar, UserType || 'User')
      .input('password', sql.VarChar, bcryptPassword)
      .input('isAdmin', sql.Bit, IsAdmin || false)
      .input('isSuperAdmin', sql.Bit, IsSuperAdmin || false)
      .query(`INSERT INTO userLogin (FirstName, LastName, UserMail, UserName, Company, UserType, UserPassword, IsAdmin, IsSuperAdmin, Active) 
              VALUES (@firstName, @lastName, @userMail, @userName, @company, @userType, @password, @isAdmin, @isSuperAdmin, 1)`);

    res.status(201).json("User created successfully");
  } catch (err) {
    console.error('Error creating user:', err);
    if (err.message.includes('salt') || err.message.includes('hash')) {
      return res.status(500).json("Error processing password");
    }
    res.status(500).json("Server error");
  }
});

router.put("/users/:userId", authorization, async (req, res) => {
  const { FirstName, LastName, UserMail, Company, UserType, IsAdmin, IsSuperAdmin } = req.body;
  const { userId } = req.params;

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('firstName', sql.VarChar, FirstName)
      .input('lastName', sql.VarChar, LastName)
      .input('userMail', sql.VarChar, UserMail)
      .input('userName', sql.VarChar, FirstName)
      .input('company', sql.VarChar, Company)
      .input('userType', sql.VarChar, UserType)
      .input('isAdmin', sql.Bit, IsAdmin)
      .input('isSuperAdmin', sql.Bit, IsSuperAdmin)
      .input('userId', sql.Int, userId)
      .query(`UPDATE userLogin SET FirstName = @firstName, LastName = @lastName, UserMail = @userMail, UserName = @userName, 
              Company = @company, UserType = @userType, IsAdmin = @isAdmin, IsSuperAdmin = @isSuperAdmin 
              WHERE UserID = @userId`);

    res.json("User updated successfully");
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

router.put("/users/:userId/password", authorization, async (req, res) => {
  const { newPassword } = req.body;
  const { userId } = req.params;

  try {
    const pool = await poolPromise;
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT UserPassword FROM userLogin WHERE UserID = @userId');

    const user = userResult.recordset[0];
    if (!user) return res.status(404).json("User not found");

    const salt = await bcrypt.genSalt(10);
    const bcryptPassword = await bcrypt.hash(newPassword, salt);

    await pool.request()
      .input('userId', sql.Int, userId)
      .input('password', sql.VarChar, bcryptPassword)
      .query('UPDATE userLogin SET UserPassword = @password WHERE UserID = @userId');

    res.json("Password updated successfully");
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

// New route to handle user activation/deactivation
router.put("/users/:userId/active", authorization, async (req, res) => {
  const { active } = req.body;
  const { userId } = req.params;

  try {
    const pool = await poolPromise;
    
    // First check if user exists
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT UserID FROM userLogin WHERE UserID = @userId');

    const user = userResult.recordset[0];
    if (!user) return res.status(404).json("User not found");

    // Update user active status
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('active', sql.Bit, active)
      .query('UPDATE userLogin SET Active = @active WHERE UserID = @userId');

    res.json(`User ${active ? 'activated' : 'deactivated'} successfully`);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server error");
  }
});

module.exports = router;