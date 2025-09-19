// ========================================
// APP COMPONENT - Main Application Root (Keycloak Version)
// ========================================
// This is the top-level React component that manages the entire application
// Now powered by Keycloak for enterprise-grade authentication

// IMPORT REACT COMPONENTS AND KEYCLOAK
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { KeycloakProvider } from './context/KeycloakContext.jsx';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute.jsx';
import KeycloakLogin from './components/KeycloakLogin.jsx';
import Home from './components/Home';
import './App.css';

// ========================================
// MAIN APP COMPONENT - KEYCLOAK VERSION
// ========================================
// Now using Keycloak for authentication instead of local JWT
// This provides enterprise-grade security features

function App() {
  return (
    <KeycloakProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* PUBLIC ROUTES - Redirect to home if already authenticated */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <KeycloakLogin />
                </PublicRoute>
              }
            />

            {/* PROTECTED ROUTES - Require authentication */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />

            {/* CATCH-ALL ROUTE - Redirect unknown paths to home */}
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </KeycloakProvider>
  );
}

// EXPORT APP COMPONENT
// This makes the App component available to be rendered by main.jsx
export default App
