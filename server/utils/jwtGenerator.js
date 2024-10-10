const jwt = require('jsonwebtoken');
require('dotenv').config();

function jwtGenerator(userId, isAdmin) {
  const payload = {
    user: {
      id: userId,
      isAdmin: isAdmin
    }
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

module.exports = jwtGenerator;
