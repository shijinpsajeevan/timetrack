// DOTENV
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
