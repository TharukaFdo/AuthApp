# MERN Authentication Cheat Sheet

## 📋 Table of Contents
1. [Backend Setup](#backend-setup)
2. [Frontend Setup](#frontend-setup)
3. [Authentication Flow](#authentication-flow)
4. [API Endpoints](#api-endpoints)
5. [Request/Response Examples](#requestresponse-examples)
6. [Error Handling](#error-handling)
7. [Security Best Practices](#security-best-practices)
8. [Common Patterns](#common-patterns)

---

## 🔧 Backend Setup

### 1. Dependencies Installation
```bash
npm install express mongoose bcryptjs jsonwebtoken cors dotenv
```

### 2. Environment Variables (.env)
```env
MONGODB_URI=mongodb://localhost:27017/mern-auth
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
NODE_ENV=development
```

### 3. Database Connection (config/db.js)
```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### 4. User Model (models/User.js)
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

### 5. JWT Utilities (utils/jwt.js)
```javascript
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// Verify JWT Token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

module.exports = { generateToken, verifyToken };
```

### 6. Authentication Middleware (middleware/auth.js)
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from token
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
```

### 7. Auth Routes (routes/auth.js)
```javascript
const express = require('express');
const { generateToken } = require('../utils/jwt');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email or username already exists'
      });
    }

    // Create user
    const user = new User({ username, email, password });
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authMiddleware, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
```

### 8. Protected Routes Example (routes/user.js)
```javascript
const express = require('express');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { username, email } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { username, email },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
```

### 9. Server Setup (server.js)
```javascript
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'MERN Auth API is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## 🎨 Frontend Setup

### 1. Dependencies Installation
```bash
npm install axios react-router-dom
```

### 2. API Service (services/api.js)
```javascript
import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 3. Auth Context (context/AuthContext.js)
```javascript
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  // Register function
  const register = async (username, email, password) => {
    try {
      const response = await api.post('/auth/register', {
        username,
        email,
        password
      });
      
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 4. Login Component (components/Login.jsx)
```javascript
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = ({ onSuccess, switchToRegister }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      onSuccess && onSuccess(result.user);
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>Login</h2>
      
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        
        <button 
          type="submit"
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: '#007bff',
            color: 'white', 
            border: 'none', 
            cursor: 'pointer' 
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        Don't have an account?{' '}
        <button 
          onClick={switchToRegister}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#007bff', 
            cursor: 'pointer' 
          }}
        >
          Register here
        </button>
      </p>
    </div>
  );
};

export default Login;
```

### 5. Register Component (components/Register.jsx)
```javascript
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Register = ({ onSuccess, switchToLogin }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    const result = await register(
      formData.username, 
      formData.email, 
      formData.password
    );
    
    if (result.success) {
      onSuccess && onSuccess(result.user);
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>Register</h2>
      
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Username:</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Confirm Password:</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        
        <button 
          type="submit"
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: '#28a745',
            color: 'white', 
            border: 'none', 
            cursor: 'pointer' 
          }}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        Already have an account?{' '}
        <button 
          onClick={switchToLogin}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#007bff', 
            cursor: 'pointer' 
          }}
        >
          Login here
        </button>
      </p>
    </div>
  );
};

export default Register;
```

### 6. Protected Route Component (components/ProtectedRoute.jsx)
```javascript
import React from 'react';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please login to access this page.</div>;
  }

  return children;
};

export default ProtectedRoute;
```

---

## 🔄 Authentication Flow

### Complete Request/Response Cycle

#### Registration Flow:
```
Frontend → POST /api/auth/register → Backend
{                                    ↓
  username: "john_doe",              Validation
  email: "john@example.com",         ↓
  password: "password123"            Check Duplicates
}                                    ↓
                                     Hash Password
                                     ↓
                                     Save to DB
                                     ↓
                                     Generate JWT
                                     ↓
Frontend ← HTTP 201 + Token ←        Send Response
{
  message: "User registered successfully",
  token: "eyJhbGciOiJIUzI1NiIs...",
  user: {
    id: "64abc123...",
    username: "john_doe",
    email: "john@example.com",
    role: "user"
  }
}
```

#### Login Flow:
```
Frontend → POST /api/auth/login → Backend
{                                  ↓
  email: "john@example.com",       Find User
  password: "password123"          ↓
}                                  Compare Password
                                   ↓
                                   Generate JWT
                                   ↓
Frontend ← HTTP 200 + Token ←      Send Response
{
  message: "Login successful",
  token: "eyJhbGciOiJIUzI1NiIs...",
  user: {
    id: "64abc123...",
    username: "john_doe",
    email: "john@example.com",
    role: "user"
  }
}
```

#### Authenticated Request Flow:
```
Frontend → GET /api/user/profile → Backend
Headers: {                          ↓
  Authorization: "Bearer eyJ..."     Extract Token
}                                   ↓
                                    Verify JWT
                                    ↓
                                    Get User from DB
                                    ↓
Frontend ← HTTP 200 + Data ←        Send Response
{
  user: {
    id: "64abc123...",
    username: "john_doe",
    email: "john@example.com",
    role: "user"
  }
}
```

---

## 📡 API Endpoints

### Public Endpoints
| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | `{username, email, password}` |
| POST | `/api/auth/login` | Login user | `{email, password}` |

### Protected Endpoints
| Method | Endpoint | Description | Headers | Body |
|--------|----------|-------------|---------|------|
| GET | `/api/auth/me` | Get current user | `Authorization: Bearer <token>` | - |
| POST | `/api/auth/logout` | Logout user | `Authorization: Bearer <token>` | - |
| GET | `/api/user/profile` | Get user profile | `Authorization: Bearer <token>` | - |
| PUT | `/api/user/profile` | Update profile | `Authorization: Bearer <token>` | `{username, email}` |

---

## 📨 Request/Response Examples

### 1. Register User
**Request:**
```javascript
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (201):**
```javascript
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64abc123def456789",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### 2. Login User
**Request:**
```javascript
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```javascript
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64abc123def456789",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### 3. Get Current User
**Request:**
```javascript
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```javascript
{
  "user": {
    "id": "64abc123def456789",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### 4. Update Profile
**Request:**
```javascript
PUT /api/user/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "username": "john_updated",
  "email": "john.updated@example.com"
}
```

**Success Response (200):**
```javascript
{
  "message": "Profile updated successfully",
  "user": {
    "id": "64abc123def456789",
    "username": "john_updated",
    "email": "john.updated@example.com",
    "role": "user"
  }
}
```

---

## ⚠️ Error Handling

### Common Error Responses

#### 400 Bad Request
```javascript
{
  "message": "All fields are required"
}

{
  "message": "User with this email or username already exists"
}

{
  "message": "Email and password are required"
}
```

#### 401 Unauthorized
```javascript
{
  "message": "Invalid credentials"
}

{
  "message": "No token, authorization denied"
}

{
  "message": "Token is not valid"
}
```

#### 500 Server Error
```javascript
{
  "message": "Server error",
  "error": "Detailed error message"
}
```

### Frontend Error Handling
```javascript
// Using try-catch with axios
try {
  const response = await api.post('/auth/login', { email, password });
  // Handle success
} catch (error) {
  const message = error.response?.data?.message || 'Something went wrong';
  setError(message);
}

// Using .catch()
api.post('/auth/register', userData)
  .then(response => {
    // Handle success
  })
  .catch(error => {
    const message = error.response?.data?.message || 'Registration failed';
    setError(message);
  });
```

---

## 🔒 Security Best Practices

### Backend Security
1. **Environment Variables**
   ```env
   JWT_SECRET=use_a_very_long_and_random_secret_key_here
   MONGODB_URI=mongodb://localhost:27017/your_db_name
   ```

2. **Password Hashing**
   ```javascript
   // Always hash passwords before storing
   const salt = await bcrypt.genSalt(10);
   const hashedPassword = await bcrypt.hash(password, salt);
   ```

3. **JWT Best Practices**
   ```javascript
   // Set reasonable expiration times
   const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
     expiresIn: '7d' // or '24h', '1h' depending on security needs
   });
   ```

4. **Input Validation**
   ```javascript
   // Always validate input
   if (!email || !password) {
     return res.status(400).json({ message: 'Required fields missing' });
   }
   
   // Use regex for email validation
   const emailRegex = /^\S+@\S+\.\S+$/;
   if (!emailRegex.test(email)) {
     return res.status(400).json({ message: 'Invalid email format' });
   }
   ```

### Frontend Security
1. **Token Storage**
   ```javascript
   // Store in localStorage (simple) or httpOnly cookies (more secure)
   localStorage.setItem('token', token);
   
   // Remove on logout
   localStorage.removeItem('token');
   ```

2. **Automatic Token Attachment**
   ```javascript
   // Add token to all requests
   axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
   ```

3. **Handle Token Expiration**
   ```javascript
   // Redirect to login on 401 responses
   api.interceptors.response.use(
     response => response,
     error => {
       if (error.response?.status === 401) {
         localStorage.removeItem('token');
         window.location.href = '/login';
       }
       return Promise.reject(error);
     }
   );
   ```

---

## 🎯 Common Patterns

### 1. Making Authenticated Requests
```javascript
// Method 1: Using Authorization header
const response = await axios.get('/api/user/profile', {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
});

// Method 2: Using configured axios instance (recommended)
import api from './services/api';
const response = await api.get('/user/profile');
```

### 2. Checking Authentication Status
```javascript
// In React component
const { isAuthenticated, user } = useAuth();

if (!isAuthenticated) {
  return <LoginComponent />;
}

return <DashboardComponent user={user} />;
```

### 3. Protecting Routes
```javascript
// Using React Router
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Usage
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

### 4. Role-Based Access
```javascript
// Backend middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

// Usage
router.get('/admin', authMiddleware, requireRole(['admin']), (req, res) => {
  // Admin-only route
});

// Frontend
const { user } = useAuth();
if (user.role === 'admin') {
  return <AdminPanel />;
}
```

### 5. Form Validation Patterns
```javascript
// Client-side validation
const validateForm = (formData) => {
  const errors = {};
  
  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    errors.email = 'Email is invalid';
  }
  
  if (!formData.password) {
    errors.password = 'Password is required';
  } else if (formData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  
  return errors;
};
```

---

## 🚀 Quick Start Commands

### Backend Setup
```bash
mkdir mern-auth-backend
cd mern-auth-backend
npm init -y
npm install express mongoose bcryptjs jsonwebtoken cors dotenv
mkdir config models routes middleware utils
touch server.js .env
```

### Frontend Setup
```bash
npx create-react-app mern-auth-frontend
cd mern-auth-frontend
npm install axios react-router-dom
mkdir src/components src/context src/services
```

### Environment Setup
```bash
# Backend .env
echo "MONGODB_URI=mongodb://localhost:27017/mern-auth" > .env
echo "JWT_SECRET=your_jwt_secret_key_here" >> .env
echo "PORT=5000" >> .env
```

---

This cheat sheet provides everything you need to implement MERN authentication with proper request/response handling, security measures, and common patterns. Copy and modify the code examples to fit your specific needs! 🎉