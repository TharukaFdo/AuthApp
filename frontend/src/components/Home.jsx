// ========================================
// HOME COMPONENT - Protected Dashboard Page
// ========================================
// This React component shows the main dashboard after user login
// It demonstrates: protected content, authenticated API calls, and automatic logout

// IMPORT REACT HOOKS AND LIBRARIES
import { useState, useEffect } from 'react'; // useState + useEffect hooks
import axios from 'axios';                    // HTTP client for API requests

// ========================================
// MAIN HOME COMPONENT
// ========================================
const Home = ({ user, onLogout }) => {
  // PROPS EXPLANATION:
  // user: basic user info passed from App.jsx (from localStorage)
  // onLogout: function to call when user logs out (updates App.jsx state)

  // ========================================
  // COMPONENT STATE MANAGEMENT
  // ========================================
  
  // PROFILE STATE - stores detailed user data fetched from server
  // Initially null, will be populated after API call
  const [profile, setProfile] = useState(null);
  
  // LOADING STATE - tracks if we're fetching profile data
  // Initially true because we start loading immediately
  const [loading, setLoading] = useState(true);
  
  // ERROR STATE - stores error messages for user feedback
  const [error, setError] = useState('');

  // ========================================
  // USEEFFECT HOOK - COMPONENT LIFECYCLE
  // ========================================
  // useEffect runs after component mounts (appears on screen)
  // It's like saying "when this component loads, do something"
  useEffect(() => {
    fetchProfile(); // Fetch user profile data when component loads
  }, []); // Empty dependency array [] = run only once when component mounts

  // ========================================
  // AUTHENTICATED API REQUEST FUNCTION
  // ========================================
  const fetchProfile = async () => {
    try {
      // GET JWT TOKEN FROM BROWSER STORAGE
      // This token was saved during login/registration
      const token = localStorage.getItem('token');
      
      // MAKE AUTHENTICATED API REQUEST
      // This demonstrates how to call protected endpoints
      const response = await axios.get('http://localhost:5000/api/user/profile', {
        headers: {
          // AUTHORIZATION HEADER
          // Format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          // This tells the server who we are and that we're logged in
          'Authorization': `Bearer ${token}`
        }
      });
      
      // SUCCESS - save profile data to state
      setProfile(response.data.user);
      
    } catch (error) {
      // HANDLE API ERRORS
      setError('Failed to fetch profile data');
      
      // AUTOMATIC LOGOUT ON AUTHENTICATION FAILURE
      // If server returns 401 (Unauthorized), it means token is invalid
      // This could happen if: token expired, token corrupted, user deleted
      if (error.response?.status === 401) {
        handleLogout(); // Automatically log user out
      }
    } finally {
      // CLEANUP - runs whether API call succeeded or failed
      setLoading(false); // Stop showing loading spinner
    }
  };

  // ========================================
  // LOGOUT HANDLER FUNCTION
  // ========================================
  const handleLogout = () => {
    // CLEAR BROWSER STORAGE
    // Remove all traces of user session from browser
    localStorage.removeItem('token');  // Remove JWT token
    localStorage.removeItem('user');   // Remove user data
    
    // NOTIFY PARENT COMPONENT
    // Tell App.jsx that user has logged out
    // This will hide the Home component and show Login/Register forms
    onLogout();
  };

  // ========================================
  // CONDITIONAL RENDERING - LOADING STATE
  // ========================================
  // If still loading profile data, show loading message
  // This prevents showing empty content while API call is in progress
  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  }

  // ========================================
  // MAIN COMPONENT RENDER
  // ========================================
  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
      
      {/* HEADER SECTION WITH LOGOUT BUTTON */}
      <div style={{ 
        display: 'flex',           // Flexbox layout
        justifyContent: 'space-between', // Space title and button apart
        alignItems: 'center',      // Vertically center items
        marginBottom: '30px' 
      }}>
        <h1>Welcome to Your Dashboard!</h1>
        
        {/* LOGOUT BUTTON */}
        <button 
          onClick={handleLogout}   // Call logout function when clicked
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#dc3545', // Red color for logout
            color: 'white', 
            border: 'none', 
            cursor: 'pointer' 
          }}
        >
          Logout
        </button>
      </div>

      {/* ERROR MESSAGE DISPLAY */}
      {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

      {/* PROFILE INFORMATION SECTION */}
      {/* Conditional rendering: only show if profile data exists */}
      {profile && (
        <div style={{ 
          backgroundColor: '#f8f9fa',  // Light gray background
          padding: '20px', 
          borderRadius: '8px'          // Rounded corners
        }}>
          <h2>Profile Information</h2>
          
          {/* USERNAME DISPLAY */}
          <div style={{ marginBottom: '10px' }}>
            <strong>Username:</strong> {profile.username}
          </div>
          
          {/* EMAIL DISPLAY */}
          <div style={{ marginBottom: '10px' }}>
            <strong>Email:</strong> {profile.email}
          </div>
          
          {/* ACCOUNT CREATION DATE */}
          <div style={{ marginBottom: '10px' }}>
            <strong>Member since:</strong> {
              // Convert ISO date string to readable format
              // profile.createdAt = "2024-01-15T10:30:00.000Z"
              // toLocaleDateString() = "1/15/2024" (US format)
              new Date(profile.createdAt).toLocaleDateString()
            }
          </div>
          
          {/* USER ID (for development/debugging) */}
          <div style={{ marginBottom: '10px' }}>
            <strong>User ID:</strong> {profile.id}
          </div>
        </div>
      )}

      {/* CONGRATULATIONS SECTION */}
      {/* Static content celebrating successful app completion */}
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#e7f3ff',  // Light blue background
        borderRadius: '8px' 
      }}>
        <h3>🎉 Congratulations!</h3>
        <p>You've successfully built a MERN stack application with authentication!</p>
        <p>This app includes:</p>
        <ul>
          <li>✅ User registration and login</li>
          <li>✅ JWT token authentication</li>
          <li>✅ Protected routes</li>
          <li>✅ MongoDB database integration</li>
          <li>✅ React frontend with Vite</li>
        </ul>
      </div>
    </div>
  );
};

// EXPORT COMPONENT
export default Home;