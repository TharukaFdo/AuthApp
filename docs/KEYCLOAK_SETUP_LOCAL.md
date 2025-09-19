# Keycloak Local Setup Guide (Without Docker)

## Step 1: Install Java (Required for Keycloak)

### Windows:
1. Download OpenJDK 11 or higher from https://adoptium.net/
2. Install the MSI package
3. Verify installation:
```bash
java -version
```

### Alternative (Using Chocolatey):
```bash
choco install openjdk11
```

## Step 2: Download and Setup Keycloak

### Download Keycloak:
1. Go to https://www.keycloak.org/downloads
2. Download "Server" - Keycloak 23.0.0 (ZIP distribution)
3. Extract to a folder like `C:\keycloak` or `F:\keycloak`

### Setup Environment Variables (Optional):
```bash
# Add to your PATH or create a batch file
set KEYCLOAK_HOME=F:\keycloak\keycloak-23.0.0
set PATH=%PATH%;%KEYCLOAK_HOME%\bin
```

## Step 3: Start Keycloak in Development Mode

Open Command Prompt/PowerShell and navigate to Keycloak folder:

```bash
cd F:\keycloak\keycloak-23.0.0\bin

# Windows
kc.bat start-dev --http-port=8080

# Or with admin user setup
kc.bat start-dev --http-port=8080
```

### Create Admin User (First Time):
When prompted or visit: http://localhost:8080
- Username: `admin`
- Password: `admin123`

## Step 4: Access Keycloak Admin Console

1. Open browser: http://localhost:8080/admin
2. Login with admin credentials
3. You should see the Keycloak Admin Console

## Step 5: Configure Keycloak for MERN App

### Create Realm:
1. Click "Create Realm" (or dropdown next to "Master")
2. Realm name: `mern-auth-realm`
3. Display name: `MERN Authentication`
4. Click "Create"

### Create Client for Backend API:
1. Go to Clients → "Create client"
2. Client ID: `mern-backend-api`
3. Client type: `OpenID Connect`
4. Next → Client authentication: `On`
5. Valid redirect URIs: `http://localhost:5000/*`
6. Web origins: `http://localhost:5000`
7. Save

### Get Client Secret:
1. Go to Clients → `mern-backend-api` → Credentials tab
2. Copy the "Client secret" (you'll need this for backend)

### Create Client for Frontend:
1. Go to Clients → "Create client"
2. Client ID: `mern-frontend-app`
3. Client type: `OpenID Connect`
4. Next → Client authentication: `Off` (public client)
5. Valid redirect URIs: `http://localhost:3000/*`
6. Web origins: `http://localhost:3000`
7. Save

### Create Roles:
1. Go to Realm roles → "Create role"
2. Create these roles:
   - `user` (set as default role)
   - `moderator`
   - `admin`

### Set Default Role:
1. Go to Realm settings → User registration
2. Default roles → Add `user` role

### Create Test Users:
1. Go to Users → "Add user"
2. Username: `testuser`
3. Email: `test@example.com`
4. Save
5. Go to Credentials tab → Set password
6. Go to Role mapping tab → Assign roles

## Step 6: Keycloak Configuration for Development

Create a batch file for easy startup (`start-keycloak.bat`):

```batch
@echo off
echo Starting Keycloak...
cd /d F:\keycloak\keycloak-23.0.0\bin
kc.bat start-dev --http-port=8080
pause
```

## Step 7: Backend Integration (Node.js)

### Install Dependencies:
```bash
npm install keycloak-connect express-session axios jsonwebtoken
```

### Create Keycloak Config (`config/keycloak.js`):
```javascript
const keycloakConfig = {
  realm: 'mern-auth-realm',
  'auth-server-url': 'http://localhost:8080/',
  'ssl-required': 'external',
  resource: 'mern-backend-api',
  'bearer-only': true,
  'confidential-port': 0,
  credentials: {
    secret: 'YOUR_CLIENT_SECRET_HERE' // Replace with actual secret from Keycloak
  }
};

module.exports = keycloakConfig;
```

### Create Auth Middleware (`middleware/keycloakAuth.js`):
```javascript
const jwt = require('jsonwebtoken');
const axios = require('axios');

const verifyKeycloakToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Verify token with Keycloak userinfo endpoint
    const response = await axios.get(
      'http://localhost:8080/realms/mern-auth-realm/protocol/openid-connect/userinfo',
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    // Decode token to get additional info
    const decoded = jwt.decode(token);

    req.user = {
      id: decoded.sub,
      username: decoded.preferred_username,
      email: decoded.email,
      roles: decoded.realm_access?.roles || [],
      firstName: decoded.given_name,
      lastName: decoded.family_name
    };

    next();
  } catch (error) {
    console.error('Token verification failed:', error.response?.data || error.message);
    res.status(401).json({ message: 'Invalid token.' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userRoles = req.user.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

module.exports = {
  verifyKeycloakToken,
  requireRole
};
```

## Step 8: Frontend Integration (React)

### Install Dependencies:
```bash
npm install keycloak-js
```

### Create Keycloak Config (`src/config/keycloak.js`):
```javascript
import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: 'http://localhost:8080/',
  realm: 'mern-auth-realm',
  clientId: 'mern-frontend-app'
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;
```

## Step 9: Test the Setup

### Start Keycloak:
```bash
# Run your batch file or
cd F:\keycloak\keycloak-23.0.0\bin
kc.bat start-dev --http-port=8080
```

### Test URLs:
- Keycloak Admin: http://localhost:8080/admin
- Realm: http://localhost:8080/realms/mern-auth-realm
- UserInfo endpoint: http://localhost:8080/realms/mern-auth-realm/protocol/openid-connect/userinfo

## Step 10: Integration Points

### Backend Route Example:
```javascript
// routes/user.js
const express = require('express');
const { verifyKeycloakToken, requireRole } = require('../middleware/keycloakAuth');

const router = express.Router();

// Protected route
router.get('/profile', verifyKeycloakToken, (req, res) => {
  res.json({
    user: req.user,
    message: 'Profile data from Keycloak'
  });
});

// Admin only route
router.get('/admin/users', verifyKeycloakToken, requireRole(['admin']), (req, res) => {
  res.json({
    message: 'Admin users data',
    user: req.user
  });
});

module.exports = router;
```

### Frontend Login Component:
```javascript
import React, { useEffect, useState } from 'react';
import keycloak from '../config/keycloak';

const Login = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    keycloak.init({ onLoad: 'check-sso' })
      .then(authenticated => {
        setAuthenticated(authenticated);
        setLoading(false);
      });
  }, []);

  const login = () => {
    keycloak.login();
  };

  const logout = () => {
    keycloak.logout();
  };

  if (loading) return <div>Loading...</div>;

  if (!authenticated) {
    return (
      <div>
        <h2>Please Login</h2>
        <button onClick={login}>Login with Keycloak</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Welcome, {keycloak.tokenParsed?.preferred_username}!</h2>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default Login;
```

## Troubleshooting

### Common Issues:

1. **Java not found**:
   - Ensure Java 11+ is installed
   - Check PATH variable

2. **Port 8080 in use**:
   ```bash
   kc.bat start-dev --http-port=8081
   ```

3. **CORS issues**:
   - Add your frontend URL to Web Origins in Keycloak client settings

4. **Token verification fails**:
   - Check realm name spelling
   - Verify client configuration
   - Ensure Keycloak is running

### Useful Keycloak Endpoints:
- Well-known config: http://localhost:8080/realms/mern-auth-realm/.well-known/openid_configuration
- Token endpoint: http://localhost:8080/realms/mern-auth-realm/protocol/openid-connect/token
- UserInfo: http://localhost:8080/realms/mern-auth-realm/protocol/openid-connect/userinfo

## Next Steps

1. Configure your backend to use the Keycloak middleware
2. Update your frontend to use Keycloak authentication
3. Test user login/logout flows
4. Configure role-based access control
5. Migrate existing users (optional)

This setup gives you a full Keycloak installation running locally without Docker!