// ========================================
// AUTHENTICATION MIDDLEWARE - Route Protection
// ========================================
// This file contains middleware functions that protect routes from unauthorized access
// Middleware = functions that run BEFORE the main route handler
// They can modify the request, response, or stop the request entirely

// IMPORT REQUIRED LIBRARIES
const jwt = require('jsonwebtoken'); // For verifying JWT tokens
const User = require('../models/User'); // User model to fetch user data

// ========================================
// TOKEN AUTHENTICATION MIDDLEWARE
// ========================================
// This function runs before protected routes to verify user authentication
// Parameters:
// - req: request object (contains headers, body, params, etc.)
// - res: response object (used to send responses back to client)
// - next: function to call to proceed to the next middleware or route handler
const authenticateToken = async (req, res, next) => {
  try {
    // EXTRACT TOKEN FROM AUTHORIZATION HEADER
    // HTTP headers contain metadata about the request
    // Authorization header format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    const authHeader = req.header('Authorization');
    
    // PARSE THE TOKEN
    // Check if Authorization header exists AND starts with "Bearer "
    // If yes, extract the token part (everything after "Bearer ")
    // substring(7) removes first 7 characters ("Bearer ")
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    // CHECK IF TOKEN EXISTS
    if (!token) {
      // No token provided = unauthorized access attempt
      // Return HTTP 401 (Unauthorized) and stop execution
      return res.status(401).json({ message: 'Access token is required' });
    }

    // VERIFY JWT TOKEN
    // jwt.verify() checks if token is:
    // 1. Valid (not tampered with)
    // 2. Not expired
    // 3. Signed with our secret key
    // Returns the payload (data) stored in the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // FETCH USER FROM DATABASE
    // decoded.userId contains the user ID we stored when creating the token
    // .select('-password') excludes password field for security
    // We need fresh user data in case user was deleted or modified
    const user = await User.findById(decoded.userId).select('-password');
    
    // CHECK IF USER STILL EXISTS
    if (!user) {
      // User was deleted but token still exists
      return res.status(401).json({ message: 'Invalid token' });
    }

    // ADD USER TO REQUEST OBJECT
    // Attach user data to req object so route handlers can access it
    // Now any protected route can access current user via req.user
    req.user = user;
    
    // PROCEED TO NEXT MIDDLEWARE/ROUTE HANDLER
    // next() tells Express to continue processing the request
    // Without calling next(), the request would hang forever
    next();
    
  } catch (error) {
    // ERROR HANDLING
    // This catches any errors from jwt.verify() or database operations
    // Common errors: invalid token format, expired token, database errors
    res.status(401).json({ message: 'Invalid token' });
  }
};

// EXPORT MIDDLEWARE FUNCTIONS
// Export as object so we can add more middleware functions later
// Usage: const { authenticateToken } = require('./middleware/auth')
module.exports = { authenticateToken };