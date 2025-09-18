// ========================================
// AUTHENTICATION ROUTES - User Login & Registration
// ========================================
// This file handles user authentication: registering new users and logging in existing users
// It creates JWT tokens for authenticated sessions

// IMPORT REQUIRED LIBRARIES
const express = require('express');    // Web framework for creating routes
const jwt = require('jsonwebtoken');   // Library for creating and verifying JSON Web Tokens
const User = require('../models/User'); // Our User model from the database
const router = express.Router();       // Express router to define route handlers

// JWT TOKEN GENERATION FUNCTION
// JWT (JSON Web Token) = secure way to transmit information between parties
// It's like a digital ID card that proves a user is authenticated
const generateToken = (userId) => {
  // jwt.sign() creates a new token
  // { userId } = payload (data stored in the token)
  // process.env.JWT_SECRET = secret key used to sign the token (from .env file)
  // expiresIn: '7d' = token expires after 7 days (for security)
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// ========================================
// USER REGISTRATION ROUTE
// ========================================
// POST /api/auth/register - Creates a new user account
router.post('/register', async (req, res) => {
  try {
    // EXTRACT DATA FROM REQUEST BODY
    // Destructuring: extracts username, email, password, role from req.body object
    // req.body contains the JSON data sent by the frontend
    const { username, email, password, role } = req.body;

    // INPUT VALIDATION
    // Check if all required fields are provided
    if (!username || !email || !password) {
      // Return HTTP 400 (Bad Request) with error message
      return res.status(400).json({ 
        message: 'All fields are required' 
      });
    }

    // CHECK FOR DUPLICATE USERS
    // Search database for existing user with same email OR username
    // $or is MongoDB operator that checks multiple conditions
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    // If user already exists, return error
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }

    // VALIDATE ROLE IF PROVIDED
    // If role is provided, validate it against allowed values
    const validRoles = ['user', 'admin', 'moderator'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        message: 'Invalid role. Allowed roles are: user, admin, moderator'
      });
    }

    // CREATE NEW USER
    // Create new User instance with provided data
    // Password will be automatically hashed by the User model's pre-save middleware
    // Role defaults to 'user' if not provided (as defined in User model)
    const user = new User({
      username,
      email,
      password,
      role: role || 'user' // Use provided role or default to 'user'
    });
    
    // Save user to database
    // await pauses execution until database operation completes
    await user.save();

    // GENERATE JWT TOKEN
    // Create a token for the newly registered user
    // user._id is the MongoDB ObjectId assigned to the new user
    const token = generateToken(user._id);

    // SEND SUCCESS RESPONSE
    // HTTP 201 (Created) indicates successful resource creation
    res.status(201).json({
      message: 'User registered successfully',
      token,    // JWT token for authentication
      user: {   // User data (excluding sensitive password)
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role // Include role in response
      }
    });
    
  } catch (error) {
    // ERROR HANDLING
    // If any unexpected error occurs, return HTTP 500 (Server Error)
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// ========================================
// USER LOGIN ROUTE  
// ========================================
// POST /api/auth/login - Authenticates existing user
router.post('/login', async (req, res) => {
  try {
    // EXTRACT LOGIN CREDENTIALS
    // Get email and password from request body
    const { email, password } = req.body;

    // INPUT VALIDATION
    // Ensure both email and password are provided
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    // FIND USER BY EMAIL
    // Search database for user with the provided email
    const user = await User.findOne({ email });
    
    // If no user found with that email
    if (!user) {
      // Return HTTP 401 (Unauthorized) 
      // We use generic message "Invalid credentials" for security
      // (Don't reveal whether email exists or not)
      return res.status(401).json({ 
        message: 'Invalid credentials' 
      });
    }

    // VERIFY PASSWORD
    // Use the comparePassword method we defined in User model
    // This safely compares provided password with hashed password in database
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      // Wrong password - return same generic error message
      return res.status(401).json({ 
        message: 'Invalid credentials' 
      });
    }

    // SUCCESSFUL LOGIN
    // Generate JWT token for authenticated user
    const token = generateToken(user._id);

    // SEND SUCCESS RESPONSE
    // HTTP 200 (OK) with token and user data
    res.json({
      message: 'Login successful',
      token,    // JWT token for future authenticated requests
      user: {   // User data (excluding password)
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role // Include role in login response
      }
    });
    
  } catch (error) {
    // ERROR HANDLING
    // Handle any unexpected server errors
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// EXPORT ROUTER
// Make these routes available to be imported by server.js
module.exports = router;