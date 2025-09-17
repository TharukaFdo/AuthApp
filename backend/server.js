// ========================================
// BACKEND SERVER - Main Entry Point
// ========================================
// This is the main server file for our backend API
// It sets up an Express.js server that handles HTTP requests from the frontend

// IMPORTING REQUIRED PACKAGES (Dependencies)
// require() is how Node.js imports external libraries and our own files
const express = require('express'); // Express.js - web framework for Node.js that makes creating APIs easy
const cors = require('cors'); // CORS - allows our frontend (different port) to communicate with backend
const connectDB = require('./config/db'); // Our custom database connection function
require('dotenv').config(); // Loads environment variables from .env file (like passwords, secrets)

// CREATE THE EXPRESS APPLICATION
// Think of this as creating our web server instance
const app = express();

// SET THE PORT NUMBER
// PORT is where our server will listen for requests
// process.env.PORT gets the port from environment variables, if not found uses 5000
const PORT = process.env.PORT || 5000;

// CONNECT TO DATABASE
// This establishes connection to MongoDB before starting the server
connectDB();

// MIDDLEWARE SETUP
// Middleware are functions that run before our route handlers
// They process incoming requests and modify them as needed

// 1. CORS Middleware - Cross-Origin Resource Sharing
// Allows requests from frontend (localhost:5173) to backend (localhost:5000)
// Without this, browsers block requests between different ports for security
app.use(cors());

// 2. JSON Parser Middleware
// Automatically converts JSON data in request body to JavaScript objects
// So when frontend sends JSON data, we can access it as req.body
app.use(express.json());

// ROUTE SETUP
// Routes define what happens when someone visits specific URLs
// app.use() mounts these routes at specific paths

// Authentication routes - handles login, register
// Any request to /api/auth/* will be handled by routes/auth.js
app.use('/api/auth', require('./routes/auth'));

// User routes - handles user profile, protected data
// Any request to /api/user/* will be handled by routes/user.js  
app.use('/api/user', require('./routes/user'));

// ROOT ROUTE - Basic endpoint to test if server is running
// GET request to http://localhost:5000/ returns a JSON message
app.get('/', (req, res) => {
  // req = request object (data from client)
  // res = response object (what we send back)
  res.json({ message: 'MERN Auth API is running!' });
});

// START THE SERVER
// app.listen() starts the server and makes it listen for incoming requests
app.listen(PORT, () => {
  // This callback function runs once the server successfully starts
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to test the API`);
});