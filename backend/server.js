const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));

app.get('/', (req, res) => {
  res.json({ message: 'MERN Auth API is running!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});