const express = require('express');
const { authenticateToken, requireAdmin, requireModerator, authorize } = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      message: 'Profile data retrieved successfully',
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

router.get('/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
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

router.put('/admin/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['user', 'admin', 'moderator'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: 'Invalid role. Allowed roles are: user, admin, moderator'
      });
    }

    if (id === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({
        message: 'Cannot change your own admin role'
      });
    }

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

router.delete('/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(400).json({
        message: 'Cannot delete your own account'
      });
    }

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

router.get('/mod/stats', authenticateToken, requireModerator, async (req, res) => {
  try {
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalUsers = await User.countDocuments();

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

router.get('/permissions', authenticateToken, async (req, res) => {
  try {
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

module.exports = router;