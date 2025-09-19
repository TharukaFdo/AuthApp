import React, { createContext, useContext, useEffect, useState } from 'react';
import keycloak from '../config/keycloak';

const KeycloakContext = createContext();

let isKeycloakInitialized = false;

export const KeycloakProvider = ({ children }) => {
  const [keycloakInstance, setKeycloakInstance] = useState(isKeycloakInitialized ? keycloak : null);
  const [authenticated, setAuthenticated] = useState(isKeycloakInitialized ? (keycloak.authenticated || false) : false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [userRoles, setUserRoles] = useState([]);

  useEffect(() => {
    initKeycloak();
  }, []);
  const initKeycloak = async () => {
    try {
      if (isKeycloakInitialized) {
        setKeycloakInstance(keycloak);
        setAuthenticated(keycloak.authenticated || false);
        setLoading(false);
        if (keycloak.authenticated) {
          await loadUserProfile();
          await loadUserRoles();
        }
        return;
      }

      isKeycloakInitialized = true;

      const authenticated = await keycloak.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        pkceMethod: 'S256',
        flow: 'standard'
      });

      setKeycloakInstance(keycloak);
      setAuthenticated(authenticated);

      if (authenticated) {
        await loadUserProfile();
        await loadUserRoles();
        setupTokenRefresh();
        await triggerRoleAssignment();
      }

      setLoading(false);

    } catch (error) {
      console.error('❌ Keycloak initialization failed:', error);
      setAuthenticated(false);
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      if (!keycloak || !keycloak.authenticated) {
        console.warn('Keycloak not ready for profile loading');
        return;
      }

      const profilePromise = keycloak.loadUserProfile();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile load timeout')), 5000)
      );

      const profile = await Promise.race([profilePromise, timeoutPromise]);
      const tokenParsed = keycloak.tokenParsed;

      setUserProfile({
        id: keycloak.subject,
        username: tokenParsed.preferred_username,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        fullName: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
        emailVerified: tokenParsed.email_verified,
        token: keycloak.token
      });

    } catch (error) {
      console.error('❌ Failed to load user profile:', error);
      if (keycloak?.tokenParsed) {
        const tokenParsed = keycloak.tokenParsed;
        setUserProfile({
          id: keycloak.subject,
          username: tokenParsed.preferred_username,
          email: tokenParsed.email,
          firstName: tokenParsed.given_name,
          lastName: tokenParsed.family_name,
          fullName: `${tokenParsed.given_name || ''} ${tokenParsed.family_name || ''}`.trim(),
          emailVerified: tokenParsed.email_verified,
          token: keycloak.token
        });
      }
    }
  };

  const loadUserRoles = async (retryCount = 0) => {
    try {
      // Use the global keycloak instance directly
      if (!keycloak || !keycloak.authenticated) {
        console.warn('Keycloak not ready for roles loading');
        return;
      }

      // Get realm roles from token
      const realmRoles = keycloak.realmAccess?.roles || [];

      // Filter out Keycloak default roles to get only our custom roles
      const customRoles = realmRoles.filter(role =>
        ['user', 'moderator', 'admin'].includes(role)
      );

      setUserRoles(customRoles);

      if (customRoles.length === 0 && retryCount < 3) {
        try {
          const updatePromise = keycloak.updateToken(-1);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Token update timeout')), 5000)
          );

          await Promise.race([updatePromise, timeoutPromise]);
          setTimeout(() => loadUserRoles(retryCount + 1), 1000);
        } catch (refreshError) {
          console.warn('Token refresh failed:', refreshError);
          if (retryCount >= 2) {
            await callAssignRoleEndpoint();
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to load user roles:', error);
    }
  };

  const callAssignRoleEndpoint = async () => {
    try {
      const token = keycloak.token;
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/user/assign-role', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await keycloak.updateToken(-1);
        await loadUserRoles();
      }
    } catch (error) {
      console.error('❌ Fallback assign-role call failed:', error);
    }
  };

  const triggerRoleAssignment = async () => {
    try {
      const token = keycloak.token;
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        try {
          const refreshed = await keycloak.updateToken(-1);
          if (refreshed) {
            await loadUserProfile();
            await loadUserRoles();
          }
        } catch (refreshError) {
          console.warn('⚠️ Token refresh failed, retrying roles load:', refreshError);
          setTimeout(() => loadUserRoles(), 2000);
        }
      }
    } catch (error) {
      console.error('❌ Failed to trigger role assignment:', error);
    }
  };

  const setupTokenRefresh = () => {
    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30)
        .then((refreshed) => {
          if (refreshed && userProfile) {
            setUserProfile(prev => ({
              ...prev,
              token: keycloak.token
            }));
          }
        })
        .catch((error) => {
          console.error('❌ Failed to refresh token:', error);
          logout();
        });
    };
  };

  // Authentication functions
  const login = () => {
    keycloak.login({
      redirectUri: window.location.origin
    });
  };

  const logout = () => {
    keycloak.logout({
      redirectUri: window.location.origin
    });
  };

  const register = () => {
    keycloak.register({
      redirectUri: window.location.origin
    });
  };

  // Role checking functions
  const hasRole = (role) => {
    return userRoles.includes(role);
  };

  const hasAnyRole = (roles) => {
    return roles.some(role => userRoles.includes(role));
  };

  const hasAllRoles = (roles) => {
    return roles.every(role => userRoles.includes(role));
  };

  // Token management
  const getToken = () => {
    return keycloak.token;
  };

  const updateToken = async (minValidity = 5) => {
    try {
      const refreshed = await keycloak.updateToken(minValidity);
      if (refreshed && userProfile) {
        setUserProfile(prev => ({
          ...prev,
          token: keycloak.token
        }));
      }
      return keycloak.token;
    } catch (error) {
      console.error('❌ Failed to update token:', error);
      logout();
      return null;
    }
  };

  const isTokenExpired = () => {
    return keycloak.isTokenExpired();
  };

  const contextValue = {
    keycloak: keycloakInstance,
    authenticated,
    loading,
    userProfile,
    userRoles,
    login,
    logout,
    register,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    getToken,
    updateToken,
    isTokenExpired
  };

  return (
    <KeycloakContext.Provider value={contextValue}>
      {children}
    </KeycloakContext.Provider>
  );
};

// Custom hook to use Keycloak context
export const useKeycloak = () => {
  const context = useContext(KeycloakContext);

  if (!context) {
    throw new Error('useKeycloak must be used within KeycloakProvider');
  }

  return context;
};