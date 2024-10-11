const jwt = require('jsonwebtoken');
require('dotenv').config();

function jwtGenerator(userId, userEmail) {
  const payload = {
    user: {
      id: userId,
      userEmail: userEmail
    }
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

module.exports = jwtGenerator;
