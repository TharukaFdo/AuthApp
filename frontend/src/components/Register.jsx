// ========================================
// REGISTER COMPONENT - New User Registration Form
// ========================================
// This React component renders a registration form for creating new user accounts
// It includes form validation, password confirmation, and API communication

// IMPORT REACT HOOKS AND LIBRARIES
import { useState } from 'react'; // React hook for state management
import axios from 'axios';         // HTTP client for API requests

// ========================================
// MAIN REGISTER COMPONENT
// ========================================
const Register = ({ onLogin, switchToLogin }) => {
  // PROPS EXPLANATION:
  // onLogin: function to call when registration succeeds (from App.jsx)
  // switchToLogin: function to switch back to login form

  // ========================================
  // COMPONENT STATE MANAGEMENT
  // ========================================
  
  // FORM DATA STATE - stores all user input
  // Notice this has more fields than Login component
  const [formData, setFormData] = useState({
    username: '',        // User's chosen username
    email: '',          // User's email address
    password: '',       // User's password
    confirmPassword: '', // Password confirmation for validation
    role: 'user'        // User's role - defaults to 'user'
  });

  // ERROR STATE - stores validation and server error messages
  const [error, setError] = useState('');

  // LOADING STATE - tracks registration request progress
  const [loading, setLoading] = useState(false);

  // ========================================
  // EVENT HANDLER FUNCTIONS
  // ========================================

  // HANDLE INPUT CHANGES
  // Same logic as Login component but handles more fields
  const handleChange = (e) => {
    setFormData({
      ...formData,                    // Keep existing form data
      [e.target.name]: e.target.value // Update the specific field that changed
    });
    
    // Clear error when user starts typing (improves user experience)
    setError('');
  };

  // HANDLE FORM SUBMISSION WITH VALIDATION
  const handleSubmit = async (e) => {
    // Prevent default form submission behavior
    e.preventDefault();
    
    // ========================================
    // CLIENT-SIDE VALIDATION
    // ========================================
    // Validate form data BEFORE sending to server
    // This provides immediate feedback and reduces server load

    // PASSWORD MATCH VALIDATION
    // Check if password and confirmPassword fields match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return; // Stop execution if validation fails
    }

    // PASSWORD LENGTH VALIDATION
    // Ensure password meets minimum security requirements
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return; // Stop execution if validation fails
    }

    // If we reach here, validation passed
    setLoading(true); // Show loading state
    setError('');     // Clear any previous errors

    try {
      // ========================================
      // API REQUEST TO REGISTER NEW USER
      // ========================================
      
      // Send registration data to backend
      // Note: We don't send confirmPassword to server (only used for client validation)
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        username: formData.username,  // Send only the fields the server needs
        email: formData.email,
        password: formData.password,
        role: formData.role          // Include selected role
        // confirmPassword is NOT sent - it's only for frontend validation
      });

      // REGISTRATION SUCCESSFUL
      // Server returns same format as login: { token, user }
      
      // Store authentication token in browser
      localStorage.setItem('token', response.data.token);
      
      // Store user data in browser
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Notify parent component (App.jsx) that user is now logged in
      // This will automatically redirect to home page
      onLogin(response.data.user);

    } catch (error) {
      // REGISTRATION FAILED
      // Handle server errors (like "email already exists")
      setError(error.response?.data?.message || 'Registration failed');
      
    } finally {
      // CLEANUP - runs whether registration succeeded or failed
      setLoading(false);
    }
  };

  // ========================================
  // COMPONENT RENDER WITH ENHANCED UI
  // ========================================
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#f8f9fa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      padding: '20px',
      margin: 0,
      boxSizing: 'border-box',
      overflowY: 'auto'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        boxSizing: 'border-box',
        marginTop: 'auto',
        marginBottom: 'auto'
      }}>

        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '28px',
            fontWeight: '600',
            color: '#212529'
          }}>
            Create Account
          </h2>
          <p style={{
            margin: 0,
            color: '#6c757d',
            fontSize: '16px'
          }}>
            Join us today
          </p>
        </div>

        {/* ERROR DISPLAY */}
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            color: '#721c24',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '24px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* REGISTRATION FORM */}
        <form onSubmit={handleSubmit}>
        
          {/* USERNAME FIELD */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#495057',
              marginBottom: '8px'
            }}>
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '16px',
                backgroundColor: '#ffffff',
                color: '#212529',
                outline: 'none',
                transition: 'border-color 0.15s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6c757d';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#ced4da';
              }}
              placeholder="Enter your username"
            />
          </div>

          {/* EMAIL FIELD */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#495057',
              marginBottom: '8px'
            }}>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '16px',
                backgroundColor: '#ffffff',
                color: '#212529',
                outline: 'none',
                transition: 'border-color 0.15s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6c757d';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#ced4da';
              }}
              placeholder="Enter your email"
            />
          </div>

          {/* PASSWORD FIELD */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#495057',
              marginBottom: '8px'
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '16px',
                backgroundColor: '#ffffff',
                color: '#212529',
                outline: 'none',
                transition: 'border-color 0.15s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6c757d';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#ced4da';
              }}
              placeholder="Enter your password"
            />
          </div>

          {/* CONFIRM PASSWORD FIELD */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#495057',
              marginBottom: '8px'
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '16px',
                backgroundColor: '#ffffff',
                color: '#212529',
                outline: 'none',
                transition: 'border-color 0.15s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6c757d';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#ced4da';
              }}
              placeholder="Confirm your password"
            />
          </div>

          {/* ROLE SELECTION FIELD */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#495057',
              marginBottom: '8px'
            }}>
              Account Type
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '16px',
                backgroundColor: '#ffffff',
                color: '#212529',
                outline: 'none',
                transition: 'border-color 0.15s ease',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6c757d';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#ced4da';
              }}
            >
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
            <small style={{
              display: 'block',
              marginTop: '8px',
              color: '#6c757d',
              fontSize: '12px'
            }}>
              Note: Admin approval may be required for elevated roles
            </small>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 24px',
              backgroundColor: loading ? '#6c757d' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s ease'
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#5a6268';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#6c757d';
              }
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* SWITCH TO LOGIN */}
        <div style={{
          textAlign: 'center',
          marginTop: '32px',
          padding: '24px 0',
          borderTop: '1px solid #e2e8f0'
        }}>
          <p style={{
            margin: '0 0 16px 0',
            color: '#6c757d',
            fontSize: '14px'
          }}>
            Already have an account?
          </p>
          <button
            onClick={switchToLogin}
            style={{
              background: 'none',
              border: '1px solid #6c757d',
              color: '#6c757d',
              padding: '8px 24px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#6c757d';
              e.target.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#6c757d';
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

// EXPORT COMPONENT
export default Register;