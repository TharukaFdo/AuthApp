// ========================================
// PROTECTED ROUTE COMPONENTS
// ========================================
// These components handle route protection based on authentication and roles

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useKeycloak } from '../context/KeycloakContext';


// ========================================
// BASIC PROTECTED ROUTE
// ========================================
// Requires authentication only
export const ProtectedRoute = ({ children }) => {
  const { authenticated, loading } = useKeycloak();

  // Show loading screen while Keycloak initializes
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#6c757d'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e9ecef',
            borderTop: '4px solid #6c757d',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// ========================================
// ROLE-BASED PROTECTED ROUTE
// ========================================
// Requires specific roles
export const RoleBasedRoute = ({
  children,
  roles = [],
  requireAll = false,
  fallback = null
}) => {
  const { authenticated, hasAnyRole, hasAllRoles } = useKeycloak();

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role requirements
  const hasRequiredRoles = requireAll
    ? hasAllRoles(roles)
    : hasAnyRole(roles);

  if (roles.length > 0 && !hasRequiredRoles) {
    return fallback || (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <h2 style={{ color: '#dc3545', marginBottom: '16px' }}>
            Access Denied
          </h2>
          <p style={{ color: '#6c757d', marginBottom: '24px' }}>
            You don't have permission to access this page.
          </p>
          <p style={{ color: '#6c757d', fontSize: '14px' }}>
            Required roles: {roles.join(', ')}
          </p>
          <button
            onClick={() => window.history.back()}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};

// ========================================
// PUBLIC ROUTE (REDIRECT IF AUTHENTICATED)
// ========================================
// Redirects to home if user is already logged in
export const PublicRoute = ({ children }) => {
  const { authenticated } = useKeycloak();

  if (authenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;