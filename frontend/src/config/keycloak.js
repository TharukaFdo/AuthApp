// ========================================
// KEYCLOAK FRONTEND CONFIGURATION
// ========================================
// This file configures the Keycloak JavaScript adapter for React
// It connects to our Keycloak server and realm

import Keycloak from 'keycloak-js';

// Keycloak configuration object
const keycloakConfig = {
  // Keycloak server URL (port 8081 as we configured)
  url: 'http://localhost:8081/',

  // Our custom realm name
  realm: 'mern-auth-realm',

  // Frontend client ID (public client)
  clientId: 'mern-frontend-app'
};

// Create and configure Keycloak instance
const keycloak = new Keycloak(keycloakConfig);

// Export the configured instance
export default keycloak;