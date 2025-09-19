const jwt = require('jsonwebtoken');
const User = require('../models/User');
const supabase = require('../config/supabase');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return res.status(401).json({ message: 'Access token is required' });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Get user profile from your MongoDB (for role info)
    const userProfile = await User.findOne({ supabase_id: user.id }).select('-password');

    if (!userProfile) {
      return res.status(401).json({ message: 'User profile not found' });
    }

    // Combine Supabase user data with your profile data
    req.user = {
      ...userProfile.toObject(),
      supabase_user: user
    };

    next();

  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const authorize = (roles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: 'Authentication required'
        });
      }

      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({
          message: `Access denied. Required role: ${roles.join(' or ')}`
        });
      }

      next();

    } catch (error) {
      res.status(500).json({
        message: 'Authorization error',
        error: error.message
      });
    }
  };
};

const requireAdmin = authorize(['admin']);
const requireModerator = authorize(['moderator', 'admin']);
const requireAuth = authorize([]);

module.exports = {
  authenticateToken,
  authorize,
  requireAdmin,
  requireModerator,
  requireAuth
};