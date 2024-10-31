// DOTENV
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');

// Middleware
app.use(cors());
app.use(express.json());

// API routes should come BEFORE the catch-all route
app.use("/api/auth", require('./routes/jwtAuth'))
app.use("/api/common", require('./routes/common'))

// Serve static files
app.use(express.static(path.join(__dirname, 'build')));

// Catch-all route for index.html should be LAST
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});