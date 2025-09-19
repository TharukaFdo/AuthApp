// ========================================
// KEYCLOAK INTEGRATION TEST SCRIPT
// ========================================
// This script tests the Keycloak integration by:
// 1. Getting a token from Keycloak using username/password
// 2. Testing the token against our protected routes
// 3. Verifying role-based access control

const axios = require('axios');

// Test configuration
const KEYCLOAK_URL = 'http://localhost:8081';
const BACKEND_URL = 'http://localhost:5000';
const REALM = 'mern-auth-realm';
const CLIENT_ID = 'mern-frontend-app';

// Test user credentials (the user we created in Keycloak)
const TEST_USER = {
  username: 'tharu',
  password: '123123' // or whatever password you set
};

// ========================================
// HELPER FUNCTIONS
// ========================================

// Get token from Keycloak using username/password
async function getKeycloakToken(username, password) {
  try {
    console.log('🔑 Getting token from Keycloak...');

    const response = await axios.post(
      `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: 'password',
        client_id: CLIENT_ID,
        username: username,
        password: password
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    console.log('✅ Token obtained successfully');
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Failed to get token:', error.response?.data || error.message);
    throw error;
  }
}

// Test protected route
async function testProtectedRoute(endpoint, token, description) {
  try {
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`📍 Endpoint: ${endpoint}`);

    const response = await axios.get(`${BACKEND_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Success:', response.data.message);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// ========================================
// MAIN TEST FUNCTION
// ========================================
async function runTests() {
  console.log('🚀 Starting Keycloak Integration Tests');
  console.log('=====================================\n');

  try {
    // Step 1: Get token
    const token = await getKeycloakToken(TEST_USER.username, TEST_USER.password);

    if (!token) {
      console.log('❌ Cannot proceed without token');
      return;
    }

    // Display token info (first 50 characters)
    console.log(`🎫 Token: ${token.substring(0, 50)}...`);

    // Step 2: Test basic protected route
    await testProtectedRoute('/api/user/profile', token, 'User Profile (any authenticated user)');

    // Step 3: Test permissions route
    await testProtectedRoute('/api/user/permissions', token, 'User Permissions (any authenticated user)');

    // Step 4: Test moderator route (should fail if user doesn't have moderator role)
    await testProtectedRoute('/api/user/stats', token, 'Statistics (moderator/admin only)');

    // Step 5: Test admin route (should fail if user doesn't have admin role)
    await testProtectedRoute('/api/user/admin/users', token, 'Admin Users List (admin only)');

    console.log('\n🎉 Tests completed!');
    console.log('\nℹ️  Expected results:');
    console.log('  - Profile and Permissions should work ✅');
    console.log('  - Stats and Admin routes might fail ❌ (unless testuser has those roles)');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// ========================================
// ADDITIONAL HELPER FUNCTIONS
// ========================================

// Decode JWT token to see contents (for debugging)
function decodeToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    console.log('\n🔍 Token payload:');
    console.log('  User ID:', payload.sub);
    console.log('  Username:', payload.preferred_username);
    console.log('  Email:', payload.email);
    console.log('  Roles:', payload.realm_access?.roles || []);
    console.log('  Expires:', new Date(payload.exp * 1000));
  } catch (error) {
    console.error('Failed to decode token:', error.message);
  }
}

// Test Keycloak endpoints
async function testKeycloakEndpoints() {
  console.log('\n🔍 Testing Keycloak endpoints...');

  try {
    // Test realm info
    const realmResponse = await axios.get(`${KEYCLOAK_URL}/realms/${REALM}`);
    console.log('✅ Realm accessible');

    // Test well-known config
    const configResponse = await axios.get(`${KEYCLOAK_URL}/realms/${REALM}/.well-known/openid_configuration`);
    console.log('✅ OpenID configuration accessible');

  } catch (error) {
    console.error('❌ Keycloak endpoint test failed:', error.message);
  }
}

// ========================================
// RUN TESTS
// ========================================

// Check if we're running this script directly
if (require.main === module) {
  console.log('Make sure:');
  console.log('1. Keycloak is running on http://localhost:8081');
  console.log('2. Your backend server is running on http://localhost:5000');
  console.log('3. The testuser exists with the correct password\n');

  // Run the tests
  runTests();
}

// Export functions for use in other files
module.exports = {
  getKeycloakToken,
  testProtectedRoute,
  decodeToken,
  testKeycloakEndpoints
};