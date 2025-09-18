// ========================================
// USER ROUTES - Protected User Data Endpoints
// ========================================
// This file contains routes that require user authentication
// These routes can only be accessed with a valid JWT token

// IMPORT REQUIRED LIBRARIES AND MIDDLEWARE
const express = require('express');                    // Web framework for creating routes
const { authenticateToken, requireAdmin, requireModerator, authorize } = require('../middleware/auth'); // Authentication and authorization middleware
const User = require('../models/User');               // User model for database operations
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
        role: req.user.role,          // User's role for frontend role-based rendering
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

// ========================================
// ROLE-BASED PROTECTED ROUTES
// ========================================

// ========================================
// ADMIN ONLY ROUTES
// ========================================

// GET ALL USERS (ADMIN ONLY)
// Only users with 'admin' role can access this route
router.get('/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // FETCH ALL USERS FROM DATABASE
    // .select('-password') excludes password field for security
    // .sort({ createdAt: -1 }) sorts by creation date (newest first)
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });

    res.json({
      message: 'All users retrieved successfully',
      users: users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// UPDATE USER ROLE (ADMIN ONLY)
// Allows admin to change user roles
router.put('/admin/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // VALIDATE ROLE
    const validRoles = ['user', 'admin', 'moderator'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: 'Invalid role. Allowed roles are: user, admin, moderator'
      });
    }

    // PREVENT ADMIN FROM DEMOTING THEMSELVES
    if (id === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({
        message: 'Cannot change your own admin role'
      });
    }

    // UPDATE USER ROLE
    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating user role',
      error: error.message
    });
  }
});

// DELETE USER (ADMIN ONLY)
router.delete('/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // PREVENT ADMIN FROM DELETING THEMSELVES
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        message: 'Cannot delete your own account'
      });
    }

    // DELETE USER
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting user',
      error: error.message
    });
  }
});

// ========================================
// MODERATOR AND ADMIN ROUTES
// ========================================

// GET USER STATISTICS (MODERATOR + ADMIN)
router.get('/mod/stats', authenticateToken, requireModerator, async (req, res) => {
  try {
    // COUNT USERS BY ROLE
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // TOTAL USER COUNT
    const totalUsers = await User.countDocuments();

    // RECENT USERS (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.json({
      message: 'User statistics retrieved successfully',
      stats: {
        totalUsers,
        recentUsers,
        roleDistribution: userStats,
        requestedBy: {
          id: req.user._id,
          username: req.user.username,
          role: req.user.role
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// ========================================
// USER ROLE CHECK ROUTE (ANY AUTHENTICATED USER)
// ========================================

// GET CURRENT USER'S PERMISSIONS
router.get('/permissions', authenticateToken, async (req, res) => {
  try {
    // DEFINE ROLE CAPABILITIES
    const roleCapabilities = {
      user: ['view_profile', 'edit_profile'],
      moderator: ['view_profile', 'edit_profile', 'view_stats', 'moderate_content'],
      admin: ['view_profile', 'edit_profile', 'view_stats', 'moderate_content', 'manage_users', 'manage_roles']
    };

    res.json({
      message: 'User permissions retrieved successfully',
      user: {
        id: req.user._id,
        username: req.user.username,
        role: req.user.role
      },
      permissions: roleCapabilities[req.user.role] || []
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching permissions',
      error: error.message
    });
  }
});

// EXPORT ROUTER
// Make these routes available to be imported by server.js
module.exports = router;