const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return res.status(401).json({ message: 'Access token is required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user;
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