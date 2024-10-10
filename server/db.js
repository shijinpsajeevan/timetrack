const sql = require('mssql');

const config = {
  user: 'biomax',
  password: 'biomax',
  server: 'localhost',
  database: 'SmartOfficedb',
  options: {
    encrypt: false, // For security reasons
    enableArithAbort: true, // For handling arithmetic errors
  },
};

// Create a connection pool
const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

module.exports = {
  sql,        // Export sql for use in other modules
  poolPromise: poolConnect // Export poolPromise for querying the database
};
