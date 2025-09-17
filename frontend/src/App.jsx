// ========================================
// APP COMPONENT - Main Application Root
// ========================================
// This is the top-level React component that manages the entire application
// It handles: authentication state, routing between pages, and session persistence

// IMPORT REACT HOOKS AND COMPONENTS
import { useState, useEffect } from 'react'; // React hooks for state and lifecycle
import Login from './components/Login';      // Login form component
import Register from './components/Register'; // Registration form component
import Home from './components/Home';        // Protected dashboard component
import './App.css';                         // Application styles

// ========================================
// MAIN APP COMPONENT
// ========================================
// This is the "root" component - all other components are rendered inside this one
// Think of it as the main container that decides what the user sees
function App() {
  
  // ========================================
  // APPLICATION STATE MANAGEMENT
  // ========================================
  // These state variables control the entire app's behavior
  
  // USER STATE - stores currently logged-in user information
  // null = no user logged in, object = user is logged in
  const [user, setUser] = useState(null);
  
  // LOGIN/REGISTER TOGGLE STATE - controls which form to show
  // true = show login form, false = show registration form
  const [isLogin, setIsLogin] = useState(true);
  
  // LOADING STATE - tracks initial app loading
  // We need to check localStorage for existing user session
  const [loading, setLoading] = useState(true);

  // ========================================
  // APP INITIALIZATION - CHECK FOR EXISTING SESSION
  // ========================================
  // useEffect runs when the app first loads
  // This is where we check if user is already logged in
  useEffect(() => {
    // CHECK BROWSER STORAGE FOR EXISTING SESSION
    // These were saved during login/registration
    const token = localStorage.getItem('token');      // JWT authentication token
    const userData = localStorage.getItem('user');    // User information (JSON string)
    
    // RESTORE USER SESSION IF DATA EXISTS
    if (token && userData) {
      // Both token and user data exist, so user was previously logged in
      // JSON.parse() converts JSON string back to JavaScript object
      setUser(JSON.parse(userData));
    }
    
    // FINISHED LOADING - show the appropriate screen
    setLoading(false);
  }, []); // Empty dependency array = run only once when app starts

  // ========================================
  // EVENT HANDLER FUNCTIONS
  // ========================================
  // These functions are passed to child components as props
  // They allow child components to communicate with the main App

  // HANDLE SUCCESSFUL LOGIN/REGISTRATION
  // Called by Login.jsx or Register.jsx when authentication succeeds
  const handleLogin = (userData) => {
    // Update app state to show user is logged in
    // This will cause the app to render the Home component
    setUser(userData);
  };

  // HANDLE USER LOGOUT
  // Called by Home.jsx when user clicks logout button
  const handleLogout = () => {
    // Clear user state - this will show login/register forms again
    setUser(null);
  };

  // FORM SWITCHING FUNCTIONS
  // These allow users to switch between login and registration forms
  
  // Switch from login form to registration form
  const switchToRegister = () => setIsLogin(false);
  
  // Switch from registration form to login form
  const switchToLogin = () => setIsLogin(true);

  // ========================================
  // CONDITIONAL RENDERING - APP ROUTER
  // ========================================
  // Based on application state, show different components
  // This is like a simple router system

  // LOADING STATE - show loading spinner while checking session
  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  }

  // USER LOGGED IN - show protected dashboard
  if (user) {
    // Pass user data and logout function to Home component
    return <Home user={user} onLogout={handleLogout} />;
  }

  // USER NOT LOGGED IN - show authentication forms
  // Conditional rendering: show either login or register form
  return (
    <div>
      {/* TERNARY OPERATOR FOR CONDITIONAL RENDERING */}
      {/* condition ? ifTrue : ifFalse */}
      {isLogin ? (
        // SHOW LOGIN FORM
        // Pass functions as props so Login can communicate back to App
        <Login 
          onLogin={handleLogin}           // Function to call when login succeeds
          switchToRegister={switchToRegister} // Function to switch to registration
        />
      ) : (
        // SHOW REGISTRATION FORM
        // Pass functions as props so Register can communicate back to App
        <Register 
          onLogin={handleLogin}         // Function to call when registration succeeds
          switchToLogin={switchToLogin} // Function to switch to login
        />
      )}
    </div>
  );
}

// EXPORT APP COMPONENT
// This makes the App component available to be rendered by main.jsx
export default App
