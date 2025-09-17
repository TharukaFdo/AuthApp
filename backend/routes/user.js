// ========================================
// USER ROUTES - Protected User Data Endpoints
// ========================================
// This file contains routes that require user authentication
// These routes can only be accessed with a valid JWT token

// IMPORT REQUIRED LIBRARIES AND MIDDLEWARE
const express = require('express');                    // Web framework for creating routes
const { authenticateToken } = require('../middleware/auth'); // Our authentication middleware
const router = express.Router();                      // Express router for organizing routes

// ========================================
// GET USER PROFILE ROUTE (PROTECTED)
// ========================================
// GET /api/user/profile - Returns current user's profile information
// This route demonstrates how protected routes work in our application

router.get('/profile', authenticateToken, async (req, res) => {
  // ROUTE PARAMETERS EXPLAINED:
  // '/profile' = the URL path (will be /api/user/profile when mounted)
  // authenticateToken = middleware that runs FIRST to verify authentication
  // async (req, res) => {...} = the actual route handler function

  // HOW THIS WORKS:
  // 1. User makes GET request to /api/user/profile with Authorization header
  // 2. authenticateToken middleware runs first:
  //    - Extracts and verifies JWT token
  //    - Fetches user from database
  //    - Adds user data to req.user
  //    - Calls next() to proceed
  // 3. This route handler function runs:
  //    - Can access req.user (added by middleware)
  //    - Returns user profile data

  try {
    // SEND USER PROFILE DATA
    // req.user was populated by the authenticateToken middleware
    // We know req.user exists because middleware would have blocked request if not authenticated
    res.json({
      message: 'Profile data retrieved successfully',
      user: {
        // Send user data (password already excluded by middleware)
        id: req.user._id,           // MongoDB ObjectId
        username: req.user.username,  // User's chosen username
        email: req.user.email,        // User's email address
        createdAt: req.user.createdAt // When user account was created
      }
    });
  } catch (error) {
    // ERROR HANDLING
    // Handle any unexpected errors (like database issues)
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// FUTURE PROTECTED ROUTES CAN BE ADDED HERE:
// router.put('/profile', authenticateToken, updateProfile);
// router.delete('/account', authenticateToken, deleteAccount);
// router.get('/dashboard', authenticateToken, getDashboard);

// EXPORT ROUTER
// Make these routes available to be imported by server.js
module.exports = router;