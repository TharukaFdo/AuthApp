// ========================================
// KEYCLOAK CONFIGURATION
// ========================================
// This file contains the configuration for connecting to Keycloak server
// It includes realm details, client credentials, and connection settings

const keycloakConfig = {
  // Realm name we created in Keycloak
  realm: 'mern-auth-realm',

  // Keycloak server URL (note: port 8081 since we changed it)
  'auth-server-url': 'http://localhost:8081/',

  // SSL requirement - 'external' means SSL only for external requests
  'ssl-required': 'external',

  // Client ID for our backend API
  resource: 'mern-backend-api',

  // This is a bearer-only client (doesn't handle login redirects)
  'bearer-only': true,

  // Not using a confidential port
  'confidential-port': 0,

  // Client credentials (the secret we got from Keycloak)
  credentials: {
    secret: 'uczsUKqFHT11NOHkHAUomDvSbTUJgLS0'
  }
};

// Export the configuration for use in other files
module.exports = keycloakConfig;