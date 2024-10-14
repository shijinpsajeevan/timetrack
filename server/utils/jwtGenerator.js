const jwt = require('jsonwebtoken');
require('dotenv').config();

function jwtGenerator(userID, userEmail) {
    console.log("Generating tocken using ", userID, userEmail)
  const payload = {
    user: {
      id: userID,
      userEmail: userEmail
    }
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1min' });
}

module.exports = jwtGenerator;
