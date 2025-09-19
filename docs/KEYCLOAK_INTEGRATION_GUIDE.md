# Keycloak Integration Guide for MERN Applications

## Table of Contents
1. [Overview](#overview)
2. [Keycloak Setup](#keycloak-setup)
3. [Backend Integration](#backend-integration)
4. [Frontend Integration](#frontend-integration)
5. [Advanced Features](#advanced-features)
6. [Migration Strategy](#migration-strategy)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

## Overview

Keycloak is an open-source Identity and Access Management solution that provides:
- Single Sign-On (SSO)
- Identity Federation
- User Management
- Role-Based Access Control
- Social Login
- Multi-tenancy
- Security protocols (OAuth 2.0, OpenID Connect, SAML)

### Architecture
```
Frontend App ←→ Keycloak Server ←→ Backend API
```

## Keycloak Setup

### Step 1: Install Keycloak with Docker

Create a `docker-compose.keycloak.yml` file:

```yaml
version: '3.8'

services:
  keycloak-db:
    image: postgres:13
    container_name: keycloak-postgres
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: keycloak_password
    volumes:
      - keycloak_postgres_data:/var/lib/postgresql/data
    networks:
      - keycloak-network

  keycloak:
    image: quay.io/keycloak/keycloak:23.0.0
    container_name: keycloak-server
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://keycloak-db:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: keycloak_password
      KC_HOSTNAME: localhost
      KC_HOSTNAME_PORT: 8080
      KC_HOSTNAME_STRICT: false
      KC_HOSTNAME_STRICT_HTTPS: false
      KC_LOG_LEVEL: info
      KC_METRICS_ENABLED: true
      KC_HEALTH_ENABLED: true
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin_password
    command: start-dev
    ports:
      - "8080:8080"
    depends_on:
      - keycloak-db
    networks:
      - keycloak-network

volumes:
  keycloak_postgres_data:

networks:
  keycloak-network:
    driver: bridge
```

Start Keycloak:
```bash
docker-compose -f docker-compose.keycloak.yml up -d
```

### Step 2: Initial Keycloak Configuration

1. **Access Admin Console**: http://localhost:8080/admin
   - Username: `admin`
   - Password: `admin_password`

2. **Create a Realm**:
   - Click "Create Realm"
   - Name: `mern-auth-realm`
   - Display name: `MERN Authentication`

3. **Create Client for Backend API**:
   - Clients → Create client
   - Client ID: `mern-backend-api`
   - Client type: `OpenID Connect`
   - Client authentication: `On` (confidential)
   - Valid redirect URIs: `http://localhost:5000/*`
   - Web origins: `http://localhost:5000`

4. **Create Client for Frontend**:
   - Clients → Create client
   - Client ID: `mern-frontend-app`
   - Client type: `OpenID Connect`
   - Client authentication: `Off` (public)
   - Valid redirect URIs: `http://localhost:3000/*`
   - Web origins: `http://localhost:3000`

5. **Configure Roles**:
   - Realm roles → Create role:
     - `user` (default role)
     - `moderator`
     - `admin`

6. **Create Test Users**:
   - Users → Add user
   - Username: `testuser`
   - Email: `test@example.com`
   - Set password in Credentials tab
   - Assign roles in Role mapping tab

## Backend Integration

### Step 1: Install Dependencies

```bash
npm install axios dotenv
```

Note: This implementation uses direct token introspection with Keycloak instead of the keycloak-connect adapter for better control and flexibility.

### Step 2: Environment Configuration

Create `.env` file:

```env
# Keycloak Configuration
KEYCLOAK_BASE_URL=http://localhost:8081
KEYCLOAK_REALM=mern-auth-realm
KEYCLOAK_CLIENT_ID=mern-backend-api
KEYCLOAK_CLIENT_SECRET=uczsUKqFHT11NOHkHAUomDvSbTUJgLS0

# Admin Configuration (for user management)
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=admin123

# Database
MONGODB_URI=your_mongodb_connection_string

# Server
PORT=5000
```

### Step 3: Express Server Setup

Update `server.js`:

```javascript
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use('/api/user', require('./routes/user'));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'MERN Auth API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to test the API`);
});
```

### Step 4: Authentication Middleware

Create `middleware/keycloakAuth.js`:

```javascript
const axios = require('axios');

// Verify Keycloak token using introspection endpoint
const verifyKeycloakToken = async (req, res, next) => {
  try {
    console.log('🔑 TOKEN VERIFICATION STARTED');

    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token with Keycloak introspection endpoint
    const introspectResponse = await axios.post(
      `${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token/introspect`,
      new URLSearchParams({
        token: token,
        client_id: process.env.KEYCLOAK_CLIENT_ID,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    // Check if token is active
    if (!introspectResponse.data.active) {
      throw new Error('Token is not active or invalid');
    }

    // Decode JWT token to get additional claims
    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

    console.log('🔍 DECODED TOKEN CONTENT:', {
      sub: decoded.sub,
      preferred_username: decoded.preferred_username,
      realm_access: decoded.realm_access,
      role: decoded.role,
      selected_role: decoded.selected_role
    });

    // Extract user information from token
    req.user = {
      id: decoded.sub,
      username: decoded.preferred_username,
      email: decoded.email,
      firstName: decoded.given_name,
      lastName: decoded.family_name,
      roles: decoded.realm_access?.roles || [],
      clientRoles: decoded.resource_access || {},
      fullName: `${decoded.given_name || ''} ${decoded.family_name || ''}`.trim(),
      selectedRole: decoded.role || decoded.selected_role
    };

    req.token = token;

    // Auto-assign role if user has selected_role but no realm roles assigned
    await autoAssignRole(req.user, token);

    next();
  } catch (error) {
    console.error('Keycloak token verification failed:', {
      error: error.response?.data || error.message,
      status: error.response?.status
    });

    if (error.response?.status === 401) {
      return res.status(401).json({
        message: 'Invalid or expired token.'
      });
    }

    return res.status(401).json({
      message: 'Token verification failed.'
    });
  }
};

// Role-based authorization middleware
const requireRole = (roles) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required.'
      });
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({
        message: `Access denied. Required roles: ${roles.join(', ')}. Your roles: ${userRoles.join(', ')}`
      });
    }

    next();
  };
};

// Permission-based authorization
const getPermissionsFromRoles = (roles) => {
  const permissions = new Set();

  if (roles.includes('user')) {
    permissions.add('read_profile');
    permissions.add('update_own_profile');
  }

  if (roles.includes('moderator')) {
    permissions.add('view_stats');
    permissions.add('moderate_content');
    permissions.add('view_user_list');
  }

  if (roles.includes('admin')) {
    permissions.add('manage_users');
    permissions.add('delete_users');
    permissions.add('system_config');
    permissions.add('view_admin_panel');
  }

  return Array.from(permissions);
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required.'
      });
    }

    const userPermissions = getPermissionsFromRoles(req.user.roles);

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        message: `Access denied. Required permission: ${permission}`
      });
    }

    next();
  };
};

// Automatic role assignment based on registration selection
const autoAssignRole = async (user, token) => {
  try {
    console.log('🔍 Auto-assign role check for user:', {
      userId: user.id,
      username: user.username,
      selectedRole: user.selectedRole,
      currentRoles: user.roles
    });

    // Check if user has any custom roles (excluding system roles)
    const customRoles = user.roles.filter(role =>
      ['user', 'moderator', 'admin'].includes(role)
    );

    if (customRoles.length > 0) {
      console.log('✅ User already has custom roles assigned:', customRoles);
      return;
    }

    let roleToAssign = user.selectedRole;

    if (!roleToAssign) {
      console.log('⚠️ No selectedRole found in token - fetching from user attributes');

      const adminToken = await getKeycloakAdminToken();

      try {
        const userResponse = await axios.get(
          `${process.env.KEYCLOAK_BASE_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${user.id}`,
          {
            headers: { Authorization: `Bearer ${adminToken}` }
          }
        );

        const userAttributes = userResponse.data.attributes || {};
        roleToAssign = userAttributes.role ? userAttributes.role[0] : null;

        console.log('🔍 Found role in user attributes:', roleToAssign);
      } catch (error) {
        console.log('⚠️ Could not fetch user attributes:', error.message);
      }
    }

    if (!roleToAssign) {
      console.log('⚠️ No role found in token or attributes - skipping auto-assignment');
      return;
    }

    if (user.roles.includes(roleToAssign)) {
      console.log('✅ User already has the role:', roleToAssign);
      return;
    }

    console.log('🚀 Assigning role:', roleToAssign, 'to user:', user.username);

    const adminToken = await getKeycloakAdminToken();
    await assignRoleToUser(user.id, roleToAssign, adminToken);

    console.log('✅ Role assigned successfully:', roleToAssign);
    user.roles.push(roleToAssign);

  } catch (error) {
    console.error('❌ Failed to auto-assign role:', error.message);
  }
};

// Get admin access token for Keycloak Admin API
const getKeycloakAdminToken = async () => {
  const response = await axios.post(
    `${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.KEYCLOAK_CLIENT_ID,
      client_secret: process.env.KEYCLOAK_CLIENT_SECRET
    }),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
  );

  return response.data.access_token;
};

// Assign a specific role to a user via Keycloak Admin API
const assignRoleToUser = async (userId, roleName, adminToken) => {
  try {
    // First, check if the role exists, if not create it
    let role;
    try {
      const roleResponse = await axios.get(
        `${process.env.KEYCLOAK_BASE_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/roles/${roleName}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      role = roleResponse.data;
    } catch (roleError) {
      if (roleError.response?.status === 404) {
        // Role doesn't exist, create it
        await axios.post(
          `${process.env.KEYCLOAK_BASE_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/roles`,
          {
            name: roleName,
            description: `${roleName.charAt(0).toUpperCase() + roleName.slice(1)} role`
          },
          {
            headers: {
              Authorization: `Bearer ${adminToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // Get the newly created role
        const newRoleResponse = await axios.get(
          `${process.env.KEYCLOAK_BASE_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/roles/${roleName}`,
          {
            headers: { Authorization: `Bearer ${adminToken}` }
          }
        );
        role = newRoleResponse.data;
      } else {
        throw roleError;
      }
    }

    // Assign the role to the user
    await axios.post(
      `${process.env.KEYCLOAK_BASE_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}/role-mappings/realm`,
      [role],
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('❌ Failed to assign role:', { userId, roleName, error: error.response?.data || error.message });
    throw error;
  }
};

// Utility functions
const hasRole = (user, role) => {
  return user.roles && user.roles.includes(role);
};

const hasAnyRole = (user, roles) => {
  if (!user.roles) return false;
  return roles.some(role => user.roles.includes(role));
};

const getUserPermissions = (user) => {
  return getPermissionsFromRoles(user.roles || []);
};

module.exports = {
  verifyKeycloakToken,
  requireRole,
  requirePermission,
  hasRole,
  hasAnyRole,
  getUserPermissions,
  getPermissionsFromRoles
};
```

### Step 5: User Routes Implementation

Create comprehensive `routes/user.js`:

```javascript
const express = require('express');
const { verifyKeycloakToken, requireRole, getUserPermissions } = require('../middleware/keycloakAuth');
const axios = require('axios');
const router = express.Router();

// Get user profile (protected route)
router.get('/profile', verifyKeycloakToken, async (req, res) => {
  try {
    const userPermissions = getUserPermissions(req.user);

    res.json({
      message: 'Profile data retrieved successfully',
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        fullName: req.user.fullName,
        roles: req.user.roles,
        permissions: userPermissions
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// Get all users (admin only)
router.get('/admin/users', verifyKeycloakToken, requireRole(['admin']), async (req, res) => {
  try {
    const adminToken = await getKeycloakAdminToken();

    // Fetch users from Keycloak Admin API
    const response = await axios.get(
      `${process.env.KEYCLOAK_BASE_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    // Transform user data and fetch roles for each user
    const users = [];
    for (const user of response.data) {
      try {
        // Fetch roles for each user
        const rolesResponse = await axios.get(
          `${process.env.KEYCLOAK_BASE_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${user.id}/role-mappings/realm`,
          {
            headers: { Authorization: `Bearer ${adminToken}` }
          }
        );

        const userRoles = rolesResponse.data.map(role => role.name);
        const role = userRoles.includes('admin') ? 'admin' :
                    userRoles.includes('moderator') ? 'moderator' : 'user';

        users.push({
          _id: user.id,
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          enabled: user.enabled,
          createdTimestamp: user.createdTimestamp,
          emailVerified: user.emailVerified,
          role: role,
          roles: userRoles
        });
      } catch (roleError) {
        // If role fetch fails, default to user role
        users.push({
          _id: user.id,
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          enabled: user.enabled,
          createdTimestamp: user.createdTimestamp,
          emailVerified: user.emailVerified,
          role: 'user',
          roles: ['user']
        });
      }
    }

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

// Update user role (admin only)
router.put('/admin/users/:userId/role', verifyKeycloakToken, requireRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({
        message: 'Invalid role. Must be user, moderator, or admin.'
      });
    }

    const adminToken = await getKeycloakAdminToken();

    // Get current roles and remove existing custom roles
    const currentRolesResponse = await axios.get(
      `${process.env.KEYCLOAK_BASE_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}/role-mappings/realm`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    const customRolesToRemove = currentRolesResponse.data.filter(roleObj =>
      ['user', 'moderator', 'admin'].includes(roleObj.name)
    );

    // Remove existing custom roles
    if (customRolesToRemove.length > 0) {
      await axios.delete(
        `${process.env.KEYCLOAK_BASE_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}/role-mappings/realm`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          data: customRolesToRemove
        }
      );
    }

    // Get the new role details
    const roleResponse = await axios.get(
      `${process.env.KEYCLOAK_BASE_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/roles/${role}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    // Assign the new role
    await axios.post(
      `${process.env.KEYCLOAK_BASE_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}/role-mappings/realm`,
      [roleResponse.data],
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      message: `User role updated to ${role} successfully`,
      userId: userId,
      newRole: role
    });

  } catch (error) {
    console.error('Role update error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Error updating user role',
      error: error.response?.data?.error || error.message
    });
  }
});

// Delete user (admin only)
router.delete('/admin/users/:userId', verifyKeycloakToken, requireRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const adminToken = await getKeycloakAdminToken();

    // Delete user from Keycloak
    await axios.delete(
      `${process.env.KEYCLOAK_BASE_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    res.json({
      message: 'User deleted successfully',
      userId: userId
    });

  } catch (error) {
    console.error('User deletion error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Error deleting user',
      error: error.response?.data?.error || error.message
    });
  }
});

// Get user statistics (moderator and admin)
router.get('/stats', verifyKeycloakToken, requireRole(['moderator', 'admin']), async (req, res) => {
  try {
    const adminToken = await getKeycloakAdminToken();

    // Fetch all users from Keycloak
    const usersResponse = await axios.get(
      `${process.env.KEYCLOAK_BASE_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    const users = usersResponse.data;
    const totalUsers = users.length;

    // Count recent users (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentUsers = users.filter(user =>
      user.createdTimestamp && user.createdTimestamp > sevenDaysAgo
    ).length;

    // Get role distribution
    const roleDistribution = { user: 0, moderator: 0, admin: 0 };

    // For better performance, limit to first 50 users for demo
    for (const user of users.slice(0, 50)) {
      try {
        const rolesResponse = await axios.get(
          `${process.env.KEYCLOAK_BASE_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${user.id}/role-mappings/realm`,
          {
            headers: { Authorization: `Bearer ${adminToken}` }
          }
        );

        const userRoles = rolesResponse.data.map(role => role.name);
        if (userRoles.includes('admin')) roleDistribution.admin++;
        else if (userRoles.includes('moderator')) roleDistribution.moderator++;
        else roleDistribution.user++;
      } catch (error) {
        // If role fetch fails, assume user role
        roleDistribution.user++;
      }
    }

    // Convert to array format expected by frontend
    const roleDistributionArray = [
      { _id: 'user', count: roleDistribution.user },
      { _id: 'moderator', count: roleDistribution.moderator },
      { _id: 'admin', count: roleDistribution.admin }
    ];

    res.json({
      message: 'User statistics retrieved successfully',
      stats: {
        totalUsers,
        recentUsers,
        roleDistribution: roleDistributionArray,
        requestedBy: {
          id: req.user.id,
          username: req.user.username,
          role: req.user.roles[0] || 'user'
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

// Get current user's permissions
router.get('/permissions', verifyKeycloakToken, async (req, res) => {
  try {
    const userPermissions = getUserPermissions(req.user);

    res.json({
      message: 'User permissions retrieved successfully',
      user: {
        id: req.user.id,
        username: req.user.username,
        roles: req.user.roles
      },
      permissions: userPermissions
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching permissions',
      error: error.message
    });
  }
});

// Helper function to get Keycloak admin token
const getKeycloakAdminToken = async () => {
  try {
    const response = await axios.post(
      `${process.env.KEYCLOAK_BASE_URL}/realms/master/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username: process.env.KEYCLOAK_ADMIN_USERNAME,
        password: process.env.KEYCLOAK_ADMIN_PASSWORD
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('Failed to get Keycloak admin token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Keycloak admin API');
  }
};

module.exports = router;
```

## Frontend Integration

### Step 1: Install Keycloak JS Adapter

```bash
npm install keycloak-js
```

### Step 2: Keycloak Configuration

Create `src/config/keycloak.js`:

```javascript
import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: 'http://localhost:8081/',
  realm: 'mern-auth-realm',
  clientId: 'mern-frontend-app'
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;
```

### Step 3: Keycloak Provider

Create `src/context/KeycloakContext.js`:

```javascript
import React, { createContext, useContext, useEffect, useState } from 'react';
import keycloak from '../config/keycloak';

const KeycloakContext = createContext();

export const KeycloakProvider = ({ children }) => {
  const [keycloakInstance, setKeycloakInstance] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    initKeycloak();
  }, []);

  const initKeycloak = async () => {
    try {
      const authenticated = await keycloak.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        pkceMethod: 'S256'
      });

      setKeycloakInstance(keycloak);
      setAuthenticated(authenticated);

      if (authenticated) {
        await loadUserProfile();
        setupTokenRefresh();
      }

      setLoading(false);
    } catch (error) {
      console.error('Keycloak initialization failed:', error);
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const profile = await keycloak.loadUserProfile();
      setUserProfile({
        id: keycloak.subject,
        username: profile.username,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        roles: keycloak.realmAccess?.roles || [],
        token: keycloak.token
      });
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const setupTokenRefresh = () => {
    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30)
        .then((refreshed) => {
          if (refreshed) {
            console.log('Token refreshed');
          }
        })
        .catch(() => {
          console.log('Failed to refresh token');
          logout();
        });
    };
  };

  const login = () => {
    keycloak.login({
      redirectUri: window.location.origin
    });
  };

  const logout = () => {
    keycloak.logout({
      redirectUri: window.location.origin
    });
  };

  const register = () => {
    keycloak.register({
      redirectUri: window.location.origin
    });
  };

  const hasRole = (role) => {
    return keycloak.hasRealmRole(role);
  };

  const hasAnyRole = (roles) => {
    return roles.some(role => keycloak.hasRealmRole(role));
  };

  const getToken = () => {
    return keycloak.token;
  };

  const updateToken = async () => {
    try {
      await keycloak.updateToken(5);
      return keycloak.token;
    } catch (error) {
      console.error('Failed to update token:', error);
      logout();
      return null;
    }
  };

  const value = {
    keycloak: keycloakInstance,
    authenticated,
    loading,
    userProfile,
    login,
    logout,
    register,
    hasRole,
    hasAnyRole,
    getToken,
    updateToken
  };

  return (
    <KeycloakContext.Provider value={value}>
      {children}
    </KeycloakContext.Provider>
  );
};

export const useKeycloak = () => {
  const context = useContext(KeycloakContext);
  if (!context) {
    throw new Error('useKeycloak must be used within KeycloakProvider');
  }
  return context;
};
```

### Step 4: Update App Component

Update `src/App.js`:

```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { KeycloakProvider } from './context/KeycloakContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Home from './components/Home';
import Login from './components/Login';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css';

function App() {
  return (
    <KeycloakProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          </Routes>
        </div>
      </Router>
    </KeycloakProvider>
  );
}

export default App;
```

### Step 5: Update Components

Create `src/components/ProtectedRoute.js`:

```javascript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useKeycloak } from '../context/KeycloakContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, roles = [] }) => {
  const { authenticated, loading, hasAnyRole } = useKeycloak();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!authenticated) {
    return <Navigate to="/login" />;
  }

  if (roles.length > 0 && !hasAnyRole(roles)) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
```

Create `src/components/PublicRoute.js`:

```javascript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useKeycloak } from '../context/KeycloakContext';
import LoadingSpinner from './LoadingSpinner';

const PublicRoute = ({ children }) => {
  const { authenticated, loading } = useKeycloak();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (authenticated) {
    return <Navigate to="/" />;
  }

  return children;
};

export default PublicRoute;
```

Update `src/components/Login.js`:

```javascript
import React from 'react';
import { useKeycloak } from '../context/KeycloakContext';

const Login = () => {
  const { login, register } = useKeycloak();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h2 style={{ marginBottom: '32px', color: '#212529' }}>
          Welcome to MERN Auth
        </h2>

        <p style={{ marginBottom: '32px', color: '#6c757d' }}>
          Please sign in to continue
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button
            onClick={login}
            style={{
              width: '100%',
              padding: '14px 24px',
              backgroundColor: '#0d6efd',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>

          <button
            onClick={register}
            style={{
              width: '100%',
              padding: '14px 24px',
              backgroundColor: 'transparent',
              color: '#0d6efd',
              border: '1px solid #0d6efd',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
```

### Step 6: Update Home Component

Update `src/components/Home.js`:

```javascript
import React, { useState, useEffect } from 'react';
import { useKeycloak } from '../context/KeycloakContext';
import axios from 'axios';

const Home = () => {
  const { userProfile, logout, hasRole, getToken } = useKeycloak();
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = getToken();

      const response = await axios.get('http://localhost:5000/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUserData(response.data);
    } catch (error) {
      setError('Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!hasRole('moderator') && !hasRole('admin')) return;

    try {
      const token = getToken();
      const response = await axios.get('http://localhost:5000/api/user/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats);
    } catch (error) {
      setError('Failed to fetch statistics');
    }
  };

  const fetchUsers = async () => {
    if (!hasRole('admin')) return;

    try {
      const token = getToken();
      const response = await axios.get('http://localhost:5000/api/user/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users);
    } catch (error) {
      setError('Failed to fetch users');
    }
  };

  if (loading && !userData) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#adb5bd',
        padding: '32px',
        borderRadius: '8px',
        marginBottom: '32px',
        color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', color: 'black' }}>
              Welcome back, {userProfile?.username}!
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                backgroundColor: getRoleColor(userProfile?.roles[0]),
                color: 'white',
                padding: '6px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500',
                textTransform: 'uppercase'
              }}>
                {userProfile?.roles[0] || 'user'}
              </span>
              <span style={{ fontSize: '14px', opacity: '0.9' }}>
                • {userProfile?.roles?.length || 0} roles
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              padding: '12px 24px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'black',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '16px',
          borderRadius: '6px',
          marginBottom: '24px'
        }}>
          {error}
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '32px',
        backgroundColor: 'white',
        padding: '8px',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <TabButton
          active={activeTab === 'profile'}
          onClick={() => setActiveTab('profile')}
          label="Profile"
        />

        {(hasRole('moderator') || hasRole('admin')) && (
          <TabButton
            active={activeTab === 'stats'}
            onClick={() => {
              setActiveTab('stats');
              if (!stats) fetchStats();
            }}
            label="Statistics"
          />
        )}

        {hasRole('admin') && (
          <TabButton
            active={activeTab === 'users'}
            onClick={() => {
              setActiveTab('users');
              if (users.length === 0) fetchUsers();
            }}
            label="Manage Users"
          />
        )}
      </div>

      {/* Tab Content */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '32px',
        border: '1px solid #e9ecef'
      }}>
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'stats' && renderStatsTab()}
        {activeTab === 'users' && renderUsersTab()}
      </div>
    </div>
  );

  function TabButton({ active, onClick, label }) {
    return (
      <button
        onClick={onClick}
        style={{
          padding: '12px 20px',
          backgroundColor: active ? '#adb5bd' : 'transparent',
          color: active ? 'white' : '#6c757d',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          minWidth: '120px'
        }}
      >
        {label}
      </button>
    );
  }

  function renderProfileTab() {
    return (
      <div>
        <h2 style={{ marginBottom: '32px', color: '#212529' }}>
          Profile Information
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {/* User Info Card */}
          <div style={{
            backgroundColor: '#adb5bd',
            padding: '24px',
            borderRadius: '8px',
            color: 'white'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '24px',
                fontWeight: '600',
                color: 'black'
              }}>
                {userProfile?.username?.charAt(0).toUpperCase()}
              </div>
              <h3 style={{ margin: '0 0 8px 0', color: 'black' }}>
                {userProfile?.username}
              </h3>
              <p style={{ margin: '0 0 16px 0', color: 'black' }}>
                {userProfile?.email}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                {userProfile?.roles?.map(role => (
                  <span key={role} style={{
                    backgroundColor: getRoleColor(role),
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#212529' }}>
              Account Details
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6c757d',
                textTransform: 'uppercase',
                marginBottom: '4px'
              }}>
                User ID
              </label>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#212529',
                fontFamily: 'monospace',
                backgroundColor: '#e9ecef',
                padding: '8px 12px',
                borderRadius: '4px'
              }}>
                {userProfile?.id}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderStatsTab() {
    if (!stats) {
      return <div>Loading statistics...</div>;
    }

    return (
      <div>
        <h2 style={{ marginBottom: '32px', color: '#212529' }}>
          Statistics
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px'
        }}>
          <StatCard title="Total Users" value={stats.totalUsers} color="#adb5bd" />
          <StatCard title="Active Users" value={stats.activeUsers} color="#198754" />
        </div>
      </div>
    );
  }

  function renderUsersTab() {
    return (
      <div>
        <h2 style={{ marginBottom: '32px', color: '#212529' }}>
          User Management
        </h2>
        {users.length === 0 ? (
          <div>Loading users...</div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {users.map(user => (
              <div key={user.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '24px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: '#212529' }}>
                    {user.username}
                  </h4>
                  <p style={{ margin: 0, color: '#6c757d' }}>
                    {user.email}
                  </p>
                </div>
                <span style={{
                  backgroundColor: user.enabled ? '#198754' : '#dc3545',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {user.enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function StatCard({ title, value, color }) {
    return (
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '24px',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        textAlign: 'center'
      }}>
        <h3 style={{
          margin: '0 0 8px 0',
          fontSize: '32px',
          fontWeight: '700',
          color: color
        }}>
          {value}
        </h3>
        <p style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: '600',
          color: '#6c757d'
        }}>
          {title}
        </p>
      </div>
    );
  }

  function getRoleColor(role) {
    switch (role) {
      case 'admin': return '#dc3545';
      case 'moderator': return '#fd7e14';
      case 'user': return '#198754';
      default: return '#6c757d';
    }
  }
};

export default Home;
```

### Step 7: Create Silent SSO Check File

Create `public/silent-check-sso.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Silent SSO Check</title>
</head>
<body>
    <script>
        parent.postMessage(location.href, location.origin);
    </script>
</body>
</html>
```

## Advanced Features

### 1. **Custom Themes**

Create a custom Keycloak theme:

```bash
mkdir -p keycloak-themes/mytheme/login
```

Create `keycloak-themes/mytheme/theme.properties`:
```properties
parent=keycloak
import=common/keycloak
```

### 2. **Social Login Integration**

In Keycloak Admin Console:
1. Identity Providers → Add provider
2. Choose GitHub, Google, Facebook, etc.
3. Configure client ID and secret
4. Map user attributes

### 3. **Custom User Attributes**

Add custom attributes in Keycloak:
1. User attributes → Add attribute
2. Map to token claims
3. Access in frontend via token

### 4. **Event Listeners**

Create custom event listeners for audit logging:

```javascript
// Custom event listener
const logUserEvents = (event) => {
  console.log('User event:', {
    type: event.type,
    userId: event.userId,
    timestamp: event.time,
    ipAddress: event.ipAddress
  });
};
```

## Migration Strategy

### Step 1: **Gradual Migration**

1. **Phase 1**: Set up Keycloak alongside existing auth
2. **Phase 2**: Migrate new users to Keycloak
3. **Phase 3**: Migrate existing users
4. **Phase 4**: Remove old auth system

### Step 2: **User Data Migration**

```javascript
// Migration script
const migrateUsersToKeycloak = async () => {
  const users = await User.find();

  for (const user of users) {
    try {
      await createKeycloakUser({
        username: user.username,
        email: user.email,
        // Don't migrate passwords - users will reset
        enabled: user.isActive,
        attributes: {
          legacyId: user._id.toString()
        }
      });
    } catch (error) {
      console.error(`Failed to migrate user ${user.username}:`, error);
    }
  }
};
```

### Step 3: **Dual Authentication Support**

```javascript
// Support both auth methods during migration
const authenticate = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Try Keycloak first
  try {
    await verifyKeycloakToken(req, res, next);
    return;
  } catch (keycloakError) {
    // Fallback to legacy auth
    try {
      await verifyLegacyToken(req, res, next);
    } catch (legacyError) {
      res.status(401).json({ message: 'Authentication failed' });
    }
  }
};
```

## Production Deployment

### Step 1: **Docker Compose for Production**

```yaml
version: '3.8'

services:
  keycloak-db:
    image: postgres:13
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - keycloak_postgres_data:/var/lib/postgresql/data
    networks:
      - keycloak-network

  keycloak:
    image: quay.io/keycloak/keycloak:23.0.0
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://keycloak-db:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: ${POSTGRES_PASSWORD}
      KC_HOSTNAME: ${KEYCLOAK_HOSTNAME}
      KC_HOSTNAME_STRICT: true
      KC_HOSTNAME_STRICT_HTTPS: true
      KC_PROXY: edge
      KEYCLOAK_ADMIN: ${KEYCLOAK_ADMIN}
      KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD}
    command: start
    ports:
      - "8080:8080"
    depends_on:
      - keycloak-db
    networks:
      - keycloak-network

volumes:
  keycloak_postgres_data:

networks:
  keycloak-network:
```

### Step 2: **Environment Configuration**

Create `.env.production`:
```env
KEYCLOAK_HOSTNAME=auth.yourdomain.com
POSTGRES_PASSWORD=your_secure_password
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=your_admin_password
```

### Step 3: **Nginx Configuration**

```nginx
server {
    listen 443 ssl;
    server_name auth.yourdomain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Key Implementation Details

### Critical Role Assignment Fix

The implementation includes automatic role assignment based on user registration choices. This was achieved through:

1. **Protocol Mappers**: Configured in Keycloak to include the selected role in JWT tokens
2. **Token Introspection**: Uses Keycloak's introspection endpoint for secure token validation
3. **Auto-Assignment Logic**: Middleware automatically assigns roles from registration form selections
4. **Error Handling**: Comprehensive logging and error handling for debugging role assignment issues

### Important Configuration Notes

- **Port Configuration**: Keycloak runs on port 8081 (not 8080 as in basic examples)
- **Client Secret**: Use the actual client secret from your Keycloak configuration
- **Environment Variables**: All sensitive data is properly configured via environment variables
- **Admin API**: Uses both client credentials and admin CLI for different operations

### Solved Issues

1. **Empty Roles Array**: Fixed by implementing proper protocol mappers and auto-assignment logic
2. **404 Endpoint Errors**: Resolved duplicate function definitions that prevented route loading
3. **Token Claims**: Properly extracts role information from both `role` and `selected_role` claims
4. **Backend Logging**: Comprehensive logging shows authentication flow and role assignment process

## Troubleshooting

### Common Issues

1. **CORS Issues**
   - Configure CORS in Keycloak admin console
   - Add frontend URL to Web Origins

2. **Token Expiration**
   - Implement automatic token refresh
   - Handle refresh failures gracefully

3. **Role Mapping Issues**
   - Check realm role assignments
   - Verify client role mappings
   - Ensure protocol mappers are configured correctly

4. **SSL Certificate Issues**
   - Use proper SSL certificates in production
   - Configure KC_HOSTNAME_STRICT correctly

5. **Empty Roles Array**
   - Verify protocol mappers include role claims
   - Check auto-assignment middleware is functioning
   - Review backend logs for role assignment process

6. **Route Loading Issues**
   - Ensure no duplicate function definitions in route files
   - Check for JavaScript syntax errors in route handlers
   - Verify all required middleware is imported correctly

### Debug Mode

Enable debug logging:
```javascript
// Frontend
window.localStorage.setItem('keycloak-debug', 'true');

// Backend
process.env.KEYCLOAK_LOG_LEVEL = 'debug';
console.log('🔑 TOKEN VERIFICATION STARTED'); // Built into middleware
```

### Testing Role Assignment

1. Register a new user with a specific role selection
2. Check backend logs for role assignment process:
   - `🔑 TOKEN VERIFICATION STARTED`
   - `🔍 DECODED TOKEN CONTENT`
   - `🚀 Assigning role: [role] to user: [username]`
   - `✅ Role assigned successfully`
3. Verify user has correct roles in frontend

This comprehensive guide reflects the actual implementation with all fixes and optimizations that resolved the role assignment issues in your MERN application.