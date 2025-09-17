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
    confirmPassword: '' // Password confirmation for validation
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
        password: formData.password
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
  // COMPONENT RENDER (USER INTERFACE)
  // ========================================
  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      {/* PAGE TITLE */}
      <h2>Register</h2>
      
      {/* ERROR MESSAGE DISPLAY */}
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      
      {/* REGISTRATION FORM */}
      <form onSubmit={handleSubmit}>
        
        {/* USERNAME INPUT FIELD */}
        <div style={{ marginBottom: '15px' }}>
          <label>Username:</label>
          <input
            type="text"               // Plain text input
            name="username"           // Field identifier
            value={formData.username} // Controlled component
            onChange={handleChange}   // Update state when user types
            required                  // HTML5 validation
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        
        {/* EMAIL INPUT FIELD */}
        <div style={{ marginBottom: '15px' }}>
          <label>Email:</label>
          <input
            type="email"              // HTML5 email validation
            name="email"              // Field identifier
            value={formData.email}    // Controlled component
            onChange={handleChange}   // Update state when user types
            required                  // HTML5 validation
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        
        {/* PASSWORD INPUT FIELD */}
        <div style={{ marginBottom: '15px' }}>
          <label>Password:</label>
          <input
            type="password"           // Hide password with dots
            name="password"           // Field identifier
            value={formData.password} // Controlled component
            onChange={handleChange}   // Update state when user types
            required                  // HTML5 validation
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        
        {/* PASSWORD CONFIRMATION FIELD */}
        {/* This field is unique to registration - not needed for login */}
        <div style={{ marginBottom: '15px' }}>
          <label>Confirm Password:</label>
          <input
            type="password"                    // Hide password with dots
            name="confirmPassword"             // Field identifier
            value={formData.confirmPassword}   // Controlled component
            onChange={handleChange}           // Update state when user types
            required                          // HTML5 validation
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        
        {/* SUBMIT BUTTON */}
        <button 
          type="submit"
          disabled={loading}  // Disable while processing registration
          style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: '#28a745',  // Green color (different from login)
            color: 'white', 
            border: 'none', 
            cursor: 'pointer' 
          }}
        >
          {/* CONDITIONAL BUTTON TEXT */}
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      
      {/* SWITCH TO LOGIN LINK */}
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        Already have an account?{' '}
        <button 
          onClick={switchToLogin}  // Function passed from parent to switch forms
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

// EXPORT COMPONENT
export default Register;