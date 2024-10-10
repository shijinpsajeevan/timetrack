// DOTENV
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();


// Middleware
app.use(cors());
app.use(express.json());


//Router
app.use("/api/auth",require('./routes/jwtAuth'))

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
