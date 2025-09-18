// ========================================
// LOGIN COMPONENT - User Authentication Form
// ========================================
// This React component renders a login form that allows existing users to sign in
// It handles form validation, API calls, and user feedback

// IMPORT REACT HOOKS AND LIBRARIES
// useState = React hook for managing component state (data that can change)
// axios = HTTP client library for making API requests to our backend
import { useState } from 'react';
import axios from 'axios';

// ========================================
// MAIN LOGIN COMPONENT
// ========================================
// React component = JavaScript function that returns JSX (HTML-like syntax)
// Props = data passed from parent component
const Login = ({ onLogin, switchToRegister }) => {
  // PROPS EXPLANATION:
  // onLogin: function to call when login succeeds (passed from App.jsx)
  // switchToRegister: function to switch to registration form

  // ========================================
  // COMPONENT STATE MANAGEMENT
  // ========================================
  // useState hook manages component's local state (data that can change over time)
  // Returns [currentValue, functionToUpdateValue]

  // FORM DATA STATE - stores user input
  const [formData, setFormData] = useState({
    email: '',      // User's email address
    password: ''    // User's password
  });

  // ERROR STATE - stores error messages to display to user
  const [error, setError] = useState('');

  // LOADING STATE - tracks if login request is in progress
  // Used to disable button and show loading text during API call
  const [loading, setLoading] = useState(false);

  // ========================================
  // EVENT HANDLER FUNCTIONS
  // ========================================

  // HANDLE INPUT CHANGES
  // This function runs every time user types in an input field
  const handleChange = (e) => {
    // e = event object containing information about what happened
    // e.target = the specific input element that was changed
    // e.target.name = the 'name' attribute of the input ("email" or "password")
    // e.target.value = what the user typed

    // UPDATE FORM DATA STATE
    setFormData({
      ...formData,  // Spread operator: keeps existing data
      [e.target.name]: e.target.value  // Update only the changed field
      // If user typed in email field: { email: "new value", password: "old value" }
    });

    // CLEAR ANY EXISTING ERROR
    // When user starts typing, hide previous error messages
    setError('');
  };

  // HANDLE FORM SUBMISSION
  // This function runs when user clicks the "Login" button
  const handleSubmit = async (e) => {
    // PREVENT DEFAULT FORM BEHAVIOR
    // By default, forms refresh the page when submitted
    // preventDefault() stops this and lets us handle it with JavaScript
    e.preventDefault();

    // SET LOADING STATE
    setLoading(true);  // Show "Logging in..." text and disable button
    setError('');      // Clear any previous error messages

    try {
      // MAKE API REQUEST TO BACKEND
      // axios.post() sends HTTP POST request with user's login data
      // URL: http://localhost:5000/api/auth/login
      // Data: { email: "user@example.com", password: "userpassword" }
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);

      // LOGIN SUCCESSFUL - response.data contains:
      // - token: JWT authentication token
      // - user: user information (id, username, email)

      // STORE TOKEN IN BROWSER
      // localStorage = browser storage that persists even after page refresh
      // We store the JWT token so user stays logged in
      localStorage.setItem('token', response.data.token);
      
      // STORE USER DATA IN BROWSER
      // Convert user object to JSON string for storage
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // NOTIFY PARENT COMPONENT OF SUCCESSFUL LOGIN
      // Calls the onLogin function passed from App.jsx
      // This will update the app's state and redirect to home page
      onLogin(response.data.user);

    } catch (error) {
      // LOGIN FAILED - handle errors
      // error.response?.data?.message gets error message from backend
      // ?. = optional chaining (safe navigation - won't crash if property doesn't exist)
      // || = logical OR (use backup message if backend message doesn't exist)
      setError(error.response?.data?.message || 'Login failed');
      
    } finally {
      // CLEANUP - runs whether login succeeded or failed
      // Stop showing loading state
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
      boxSizing: 'border-box'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        boxSizing: 'border-box'
      }}>

        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '28px',
            fontWeight: '600',
            color: '#212529'
          }}>
            Welcome Back
          </h2>
          <p style={{
            margin: 0,
            color: '#6c757d',
            fontSize: '16px'
          }}>
            Sign in to your account
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

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit}>

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
          <div style={{ marginBottom: '32px' }}>
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
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* SWITCH TO REGISTER */}
        <div style={{
          textAlign: 'center',
          marginTop: '32px',
          padding: '24px 0',
          borderTop: '1px solid #e2e8f0'
        }}>
          <p style={{
            margin: '0 0 16px 0',
            color: '#64748b',
            fontSize: '14px'
          }}>
            Don't have an account?
          </p>
          <button
            onClick={switchToRegister}
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
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
};

// EXPORT COMPONENT
// Makes this component available for import in other files
// App.jsx can now import and use this Login component
export default Login;