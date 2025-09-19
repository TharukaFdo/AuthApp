# Role-Based Authentication Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Security Best Practices](#security-best-practices)
6. [Testing Strategies](#testing-strategies)
7. [Common Patterns](#common-patterns)
8. [Migration from Basic Auth](#migration-from-basic-auth)
9. [Troubleshooting](#troubleshooting)

## Overview

Role-Based Access Control (RBAC) is a security model that restricts system access based on user roles. Instead of granting permissions directly to users, permissions are assigned to roles, and users are assigned to roles.

### Benefits
- **Scalability**: Easy to manage permissions for large user bases
- **Security**: Principle of least privilege
- **Maintainability**: Centralized permission management
- **Flexibility**: Users can have multiple roles
- **Auditability**: Clear permission trails

### Core Architecture
```
User → Roles → Permissions → Resources
```

## Core Concepts

### 1. **Users**
Individual entities that authenticate with the system
```javascript
{
  id: "user123",
  username: "john_doe",
  email: "john@example.com",
  roles: ["user", "moderator"]
}
```

### 2. **Roles**
Named collections of permissions
```javascript
// Common role hierarchy
{
  "user": ["read_profile", "update_own_profile"],
  "moderator": ["user_permissions", "view_stats", "moderate_content"],
  "admin": ["moderator_permissions", "manage_users", "system_config"]
}
```

### 3. **Permissions**
Specific actions that can be performed
```javascript
[
  "read_profile",
  "update_profile",
  "delete_profile",
  "view_stats",
  "manage_users",
  "system_config"
]
```

### 4. **Resources**
Protected endpoints, data, or functionality

## Backend Implementation

### Step 1: Database Schema Design

#### User Model
```javascript
// models/User.js
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
```

#### Advanced: Multiple Roles Model
```javascript
// For more complex scenarios
const userSchema = new mongoose.Schema({
  // ... other fields
  roles: [{
    type: String,
    enum: ['user', 'moderator', 'admin', 'editor', 'viewer']
  }],
  permissions: [{
    type: String
  }] // Direct permissions (optional)
});
```

### Step 2: Permission Mapping

```javascript
// config/permissions.js
const PERMISSIONS = {
  // User permissions
  READ_PROFILE: 'read_profile',
  UPDATE_OWN_PROFILE: 'update_own_profile',
  DELETE_OWN_PROFILE: 'delete_own_profile',

  // Moderator permissions
  VIEW_STATS: 'view_stats',
  MODERATE_CONTENT: 'moderate_content',
  VIEW_USER_LIST: 'view_user_list',

  // Admin permissions
  MANAGE_USERS: 'manage_users',
  DELETE_USERS: 'delete_users',
  SYSTEM_CONFIG: 'system_config',
  VIEW_ADMIN_PANEL: 'view_admin_panel'
};

const ROLE_PERMISSIONS = {
  user: [
    PERMISSIONS.READ_PROFILE,
    PERMISSIONS.UPDATE_OWN_PROFILE,
    PERMISSIONS.DELETE_OWN_PROFILE
  ],
  moderator: [
    ...ROLE_PERMISSIONS.user, // Inherit user permissions
    PERMISSIONS.VIEW_STATS,
    PERMISSIONS.MODERATE_CONTENT,
    PERMISSIONS.VIEW_USER_LIST
  ],
  admin: [
    ...ROLE_PERMISSIONS.moderator, // Inherit moderator permissions
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.DELETE_USERS,
    PERMISSIONS.SYSTEM_CONFIG,
    PERMISSIONS.VIEW_ADMIN_PANEL
  ]
};

module.exports = { PERMISSIONS, ROLE_PERMISSIONS };
```

### Step 3: Authentication Middleware

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ROLE_PERMISSIONS } = require('../config/permissions');

// Basic authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token or user inactive.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Role-based authorization middleware
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Access denied. Not authenticated.' });
    }

    // Convert single role to array
    if (typeof roles === 'string') {
      roles = [roles];
    }

    // Check if user has any of the required roles
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
      });
    }

    next();
  };
};

// Permission-based authorization middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Access denied. Not authenticated.' });
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        message: `Access denied. Required permission: ${permission}`
      });
    }

    next();
  };
};

// Multiple roles support
const authorizeMultipleRoles = (user, requiredRoles) => {
  if (!user.roles || !Array.isArray(user.roles)) {
    return false;
  }

  return requiredRoles.some(role => user.roles.includes(role));
};

module.exports = {
  authenticate,
  authorize,
  requirePermission,
  authorizeMultipleRoles
};
```

### Step 4: Protected Routes Implementation

```javascript
// routes/user.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, authorize, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

// Public route - no authentication required
router.get('/public-info', (req, res) => {
  res.json({ message: 'This is public information' });
});

// Protected route - authentication required
router.get('/profile', authenticate, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Role-based protected route
router.get('/admin/users',
  authenticate,
  authorize(['admin']),
  async (req, res) => {
    try {
      const users = await User.find().select('-password');
      res.json({ users });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Permission-based protected route
router.get('/stats',
  authenticate,
  requirePermission(PERMISSIONS.VIEW_STATS),
  async (req, res) => {
    try {
      const stats = {
        totalUsers: await User.countDocuments(),
        activeUsers: await User.countDocuments({ isActive: true }),
        roleDistribution: await User.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ])
      };
      res.json({ stats });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Multiple permission levels
router.get('/mod/content',
  authenticate,
  authorize(['moderator', 'admin']),
  async (req, res) => {
    // Moderator and admin can access
    res.json({ message: 'Moderator content' });
  }
);

// User-specific resource access
router.put('/profile/:userId',
  authenticate,
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Users can only update their own profile, admins can update any
      if (req.user.id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          message: 'Access denied. You can only update your own profile.'
        });
      }

      // Update logic here
      res.json({ message: 'Profile updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
```

### Step 5: Registration and Role Assignment

```javascript
// routes/auth.js
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

    // Validate role
    const allowedRoles = ['user', 'moderator', 'admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Restrict who can create admin accounts
    if (role === 'admin') {
      // Only existing admins can create admin accounts
      // Or implement approval workflow
      return res.status(403).json({
        message: 'Admin accounts require approval'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
```

## Frontend Implementation

### Step 1: Authentication Context

```javascript
// context/AuthContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  permissions: []
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        permissions: action.payload.permissions || []
      };
    case 'LOGOUT':
      return {
        ...initialState,
        loading: false
      };
    case 'LOAD_USER_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        permissions: action.payload.permissions || [],
        loading: false
      };
    case 'AUTH_ERROR':
      return {
        ...initialState,
        loading: false
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUser(token);
    } else {
      dispatch({ type: 'AUTH_ERROR' });
    }
  }, []);

  const loadUser = async (token) => {
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get('/api/user/profile');

      dispatch({
        type: 'LOAD_USER_SUCCESS',
        payload: {
          user: response.data.user,
          permissions: response.data.permissions
        }
      });
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR' });
      localStorage.removeItem('token');
    }
  };

  const login = async (credentials) => {
    try {
      const response = await axios.post('/api/auth/login', credentials);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token }
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    dispatch({ type: 'LOGOUT' });
  };

  const hasRole = (role) => {
    return state.user?.role === role;
  };

  const hasAnyRole = (roles) => {
    return roles.includes(state.user?.role);
  };

  const hasPermission = (permission) => {
    return state.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      logout,
      hasRole,
      hasAnyRole,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Step 2: Route Protection Components

```javascript
// components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

export const RoleBasedRoute = ({ children, roles = [], fallback = null }) => {
  const { user, hasAnyRole, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (roles.length && !hasAnyRole(roles)) {
    return fallback || <div>Access Denied</div>;
  }

  return children;
};

export const PermissionBasedRoute = ({ children, permission, fallback = null }) => {
  const { user, hasPermission, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!hasPermission(permission)) {
    return fallback || <div>Access Denied</div>;
  }

  return children;
};
```

### Step 3: Conditional Rendering Components

```javascript
// components/ConditionalRender.js
import { useAuth } from '../context/AuthContext';

export const ShowForRole = ({ roles, children }) => {
  const { hasAnyRole } = useAuth();

  if (typeof roles === 'string') {
    roles = [roles];
  }

  return hasAnyRole(roles) ? children : null;
};

export const ShowForPermission = ({ permission, children }) => {
  const { hasPermission } = useAuth();
  return hasPermission(permission) ? children : null;
};

export const HideForRole = ({ roles, children }) => {
  const { hasAnyRole } = useAuth();

  if (typeof roles === 'string') {
    roles = [roles];
  }

  return !hasAnyRole(roles) ? children : null;
};

// Usage examples
const Dashboard = () => {
  return (
    <div>
      <h1>Dashboard</h1>

      <ShowForRole roles="admin">
        <AdminPanel />
      </ShowForRole>

      <ShowForRole roles={["moderator", "admin"]}>
        <ModeratorTools />
      </ShowForRole>

      <ShowForPermission permission="view_stats">
        <StatsWidget />
      </ShowForPermission>

      <HideForRole roles="user">
        <AdvancedFeatures />
      </HideForRole>
    </div>
  );
};
```

### Step 4: Role-Based Navigation

```javascript
// components/Navigation.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShowForRole, ShowForPermission } from './ConditionalRender';

const Navigation = () => {
  const { user, logout } = useAuth();

  return (
    <nav>
      <div>
        <Link to="/">Home</Link>
        <Link to="/profile">Profile</Link>

        <ShowForPermission permission="view_stats">
          <Link to="/stats">Statistics</Link>
        </ShowForPermission>

        <ShowForRole roles={["moderator", "admin"]}>
          <Link to="/moderation">Moderation</Link>
        </ShowForRole>

        <ShowForRole roles="admin">
          <Link to="/admin">Admin Panel</Link>
          <Link to="/users">Manage Users</Link>
        </ShowForRole>
      </div>

      <div>
        <span>Welcome, {user.username} ({user.role})</span>
        <button onClick={logout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navigation;
```

### Step 5: API Integration with Role Checking

```javascript
// hooks/useApi.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export const useProtectedApi = (url, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, token, ...dependencies]);

  return { data, loading, error };
};

// Usage in components
const AdminDashboard = () => {
  const { data: users, loading, error } = useProtectedApi('/api/admin/users');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>User Management</h2>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
};
```

## Security Best Practices

### 1. **Token Security**
```javascript
// Use secure token storage
const TokenStorage = {
  set: (token) => {
    // In production, consider httpOnly cookies
    localStorage.setItem('authToken', token);
  },

  get: () => {
    return localStorage.getItem('authToken');
  },

  remove: () => {
    localStorage.removeItem('authToken');
  }
};

// Token refresh implementation
const refreshToken = async () => {
  try {
    const response = await axios.post('/api/auth/refresh', {
      refreshToken: TokenStorage.get('refreshToken')
    });

    TokenStorage.set(response.data.token);
    return response.data.token;
  } catch (error) {
    // Redirect to login
    window.location.href = '/login';
  }
};
```

### 2. **Server-Side Validation**
```javascript
// Always validate on server side
const validateUserAccess = async (userId, requestingUserId, requestingUserRole) => {
  // Users can only access their own data
  if (userId === requestingUserId) {
    return true;
  }

  // Admins can access any user data
  if (requestingUserRole === 'admin') {
    return true;
  }

  // Moderators can access user data but not admin data
  if (requestingUserRole === 'moderator') {
    const targetUser = await User.findById(userId);
    return targetUser.role !== 'admin';
  }

  return false;
};
```

### 3. **Input Validation**
```javascript
// Validate role assignments
const validateRoleChange = (currentUserRole, targetUserRole, newRole) => {
  // Users cannot change roles
  if (currentUserRole === 'user') {
    return false;
  }

  // Moderators cannot promote to admin or modify admin accounts
  if (currentUserRole === 'moderator') {
    if (targetUserRole === 'admin' || newRole === 'admin') {
      return false;
    }
  }

  // Only admins can create/modify admin accounts
  if (newRole === 'admin' && currentUserRole !== 'admin') {
    return false;
  }

  return true;
};
```

### 4. **Rate Limiting**
```javascript
// Rate limit sensitive operations
const rateLimit = require('express-rate-limit');

const createAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many account creation attempts'
});

router.post('/register', createAccountLimiter, async (req, res) => {
  // Registration logic
});
```

## Testing Strategies

### 1. **Unit Tests for Authorization**
```javascript
// tests/auth.test.js
describe('Authorization Middleware', () => {
  test('should allow admin access to admin routes', async () => {
    const req = {
      user: { id: '1', role: 'admin' }
    };
    const res = {};
    const next = jest.fn();

    authorize(['admin'])(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('should deny user access to admin routes', async () => {
    const req = {
      user: { id: '1', role: 'user' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    authorize(['admin'])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
```

### 2. **Integration Tests**
```javascript
// tests/integration/auth.test.js
describe('Authentication Integration', () => {
  test('should create user with correct role', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('user');
  });

  test('should restrict admin route access', async () => {
    const userToken = await loginAsUser();

    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(403);
  });
});
```

### 3. **Frontend Testing**
```javascript
// tests/components/ProtectedRoute.test.js
import { render, screen } from '@testing-library/react';
import { AuthProvider } from '../context/AuthContext';
import { RoleBasedRoute } from '../components/ProtectedRoute';

const mockAuthContext = {
  user: { role: 'user' },
  hasAnyRole: (roles) => roles.includes('user'),
  loading: false
};

test('should render component for authorized role', () => {
  render(
    <AuthProvider value={mockAuthContext}>
      <RoleBasedRoute roles={['user', 'admin']}>
        <div>Protected Content</div>
      </RoleBasedRoute>
    </AuthProvider>
  );

  expect(screen.getByText('Protected Content')).toBeInTheDocument();
});
```

## Common Patterns

### 1. **Resource Ownership**
```javascript
// Check if user owns resource or has admin privileges
const checkResourceOwnership = (resource, user) => {
  return resource.userId === user.id || user.role === 'admin';
};

// Usage in route
router.delete('/posts/:id', authenticate, async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!checkResourceOwnership(post, req.user)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  await Post.findByIdAndDelete(req.params.id);
  res.json({ message: 'Post deleted' });
});
```

### 2. **Hierarchical Roles**
```javascript
// Role hierarchy system
const ROLE_HIERARCHY = {
  user: 0,
  moderator: 1,
  admin: 2
};

const hasMinimumRole = (userRole, requiredRole) => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

// Usage
const requireMinimumRole = (minRole) => {
  return (req, res, next) => {
    if (!hasMinimumRole(req.user.role, minRole)) {
      return res.status(403).json({ message: 'Insufficient privileges' });
    }
    next();
  };
};
```

### 3. **Dynamic Permissions**
```javascript
// Database-driven permissions
const Permission = mongoose.model('Permission', {
  name: String,
  resource: String,
  action: String
});

const RolePermission = mongoose.model('RolePermission', {
  roleId: mongoose.ObjectId,
  permissionId: mongoose.ObjectId
});

const getUserPermissions = async (userId) => {
  const user = await User.findById(userId).populate('roles');
  const permissions = await Permission.find({
    _id: { $in: user.roles.map(role => role.permissions).flat() }
  });

  return permissions.map(p => `${p.action}_${p.resource}`);
};
```

## Migration from Basic Auth

### Step 1: **Add Role Field**
```javascript
// Migration script
const addRoleToExistingUsers = async () => {
  try {
    // Add role field to existing users (default to 'user')
    await User.updateMany(
      { role: { $exists: false } },
      { $set: { role: 'user' } }
    );

    // Promote specific users to admin
    const adminEmails = ['admin@example.com'];
    await User.updateMany(
      { email: { $in: adminEmails } },
      { $set: { role: 'admin' } }
    );

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};
```

### Step 2: **Update Existing Routes**
```javascript
// Before: Basic auth only
router.get('/admin/stats', authenticate, async (req, res) => {
  // Any authenticated user could access
});

// After: Role-based auth
router.get('/admin/stats',
  authenticate,
  authorize(['admin']),
  async (req, res) => {
    // Only admins can access
  }
);
```

### Step 3: **Frontend Migration**
```javascript
// Before: Simple auth check
const Dashboard = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div>
      <AdminPanel /> {/* All users saw this */}
    </div>
  );
};

// After: Role-based rendering
const Dashboard = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div>
      <ShowForRole roles="admin">
        <AdminPanel />
      </ShowForRole>

      <ShowForRole roles={["moderator", "admin"]}>
        <ModeratorTools />
      </ShowForRole>
    </div>
  );
};
```

## Troubleshooting

### Common Issues and Solutions

1. **403 Errors on Valid Requests**
   - Check token expiration
   - Verify role assignments in database
   - Ensure middleware order is correct

2. **Frontend Shows Admin UI to Non-Admins**
   - Verify auth context is properly updated
   - Check conditional rendering logic
   - Ensure API calls validate permissions server-side

3. **Users Can't Access Their Own Resources**
   - Check resource ownership logic
   - Verify user ID matching
   - Ensure proper token decoding

4. **Performance Issues with Permission Checks**
   - Cache user permissions
   - Use database indexes on role fields
   - Consider Redis for session storage

### Debugging Tips

```javascript
// Add logging to auth middleware
const authenticate = async (req, res, next) => {
  console.log('Auth attempt:', {
    path: req.path,
    method: req.method,
    hasToken: !!req.header('Authorization'),
    timestamp: new Date().toISOString()
  });

  // ... rest of auth logic
};

// Frontend debugging
const useAuth = () => {
  const context = useContext(AuthContext);

  // Debug auth state
  useEffect(() => {
    console.log('Auth state updated:', {
      isAuthenticated: context.isAuthenticated,
      role: context.user?.role,
      permissions: context.permissions
    });
  }, [context]);

  return context;
};
```

This comprehensive guide provides the foundation for implementing role-based authentication in your application. The next step would be integrating with Keycloak, which will provide additional features like single sign-on, user federation, and advanced permission management.