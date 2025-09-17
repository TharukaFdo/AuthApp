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
  // COMPONENT RENDER (USER INTERFACE)
  // ========================================
  // JSX = JavaScript XML - lets us write HTML-like syntax in JavaScript
  // Everything inside return() becomes the visual interface

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      {/* PAGE TITLE */}
      <h2>Login</h2>
      
      {/* CONDITIONAL ERROR DISPLAY */}
      {/* {error && ...} = only show error div if error exists */}
      {/* && = logical AND operator for conditional rendering */}
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      
      {/* LOGIN FORM */}
      {/* onSubmit={handleSubmit} = when form submitted, call our handleSubmit function */}
      <form onSubmit={handleSubmit}>
        
        {/* EMAIL INPUT FIELD */}
        <div style={{ marginBottom: '15px' }}>
          <label>Email:</label>
          <input
            type="email"              // HTML5 email validation
            name="email"              // Identifies this field (used in handleChange)
            value={formData.email}    // Controlled component - React controls the value
            onChange={handleChange}   // Function to call when user types
            required                  // HTML5 required validation
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        
        {/* PASSWORD INPUT FIELD */}
        <div style={{ marginBottom: '15px' }}>
          <label>Password:</label>
          <input
            type="password"           // Hides password text with dots
            name="password"           // Identifies this field
            value={formData.password} // Controlled component
            onChange={handleChange}   // Function to call when user types
            required                  // HTML5 required validation
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        
        {/* SUBMIT BUTTON */}
        <button 
          type="submit"               // Makes this button submit the form
          disabled={loading}          // Disable button while login is in progress
          style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            cursor: 'pointer' 
          }}
        >
          {/* CONDITIONAL BUTTON TEXT */}
          {/* Show different text based on loading state */}
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      {/* SWITCH TO REGISTER LINK */}
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        Don't have an account?{' '}
        {/* BUTTON TO SWITCH TO REGISTRATION FORM */}
        <button 
          onClick={switchToRegister}  // Call function passed from parent
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

// EXPORT COMPONENT
// Makes this component available for import in other files
// App.jsx can now import and use this Login component
export default Login;