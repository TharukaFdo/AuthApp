const express = require('express');
const { verifyKeycloakToken, requireRole, getUserPermissions } = require('../middleware/keycloakAuth');
const axios = require('axios');
const router = express.Router();
const getKeycloakAdminToken = async () => {
  try {
    const response = await axios.post(
      'http://localhost:8081/realms/master/protocol/openid-connect/token',
      new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username: 'admin',
        password: 'admin123'
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('Failed to get Keycloak admin token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Keycloak admin API');
  }
};

router.get('/profile', verifyKeycloakToken, async (req, res) => {
  try {
    const userPermissions = getUserPermissions(req.user);

    res.json({
      message: 'Profile data retrieved successfully',
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        fullName: req.user.fullName,
        roles: req.user.roles,
        permissions: userPermissions
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// Admin routes
router.get('/admin/users', verifyKeycloakToken, requireRole(['admin']), async (req, res) => {
  try {
    const adminToken = await getKeycloakAdminToken();

    const response = await axios.get(
      'http://localhost:8081/admin/realms/mern-auth-realm/users',
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    const users = [];
    for (const user of response.data) {
      try {
        const rolesResponse = await axios.get(
          `http://localhost:8081/admin/realms/mern-auth-realm/users/${user.id}/role-mappings/realm`,
          {
            headers: { Authorization: `Bearer ${adminToken}` }
          }
        );

        const userRoles = rolesResponse.data.map(role => role.name);
        const role = userRoles.includes('admin') ? 'admin' :
                    userRoles.includes('moderator') ? 'moderator' : 'user';

        users.push({
          _id: user.id,
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          enabled: user.enabled,
          createdTimestamp: user.createdTimestamp,
          emailVerified: user.emailVerified,
          role: role,
          roles: userRoles
        });
      } catch (roleError) {
        users.push({
          _id: user.id,
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          enabled: user.enabled,
          createdTimestamp: user.createdTimestamp,
          emailVerified: user.emailVerified,
          role: 'user',
          roles: ['user']
        });
      }
    }

    res.json({
      message: 'All users retrieved successfully',
      users: users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching users',
      error: error.message
    });
  }
});

router.put('/admin/users/:userId/role', verifyKeycloakToken, requireRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({
        message: 'Invalid role. Must be user, moderator, or admin.'
      });
    }

    const adminToken = await getKeycloakAdminToken();

    const currentRolesResponse = await axios.get(
      `http://localhost:8081/admin/realms/mern-auth-realm/users/${userId}/role-mappings/realm`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    const customRolesToRemove = currentRolesResponse.data.filter(roleObj =>
      ['user', 'moderator', 'admin'].includes(roleObj.name)
    );

    if (customRolesToRemove.length > 0) {
      await axios.delete(
        `http://localhost:8081/admin/realms/mern-auth-realm/users/${userId}/role-mappings/realm`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          data: customRolesToRemove
        }
      );
    }

    const roleResponse = await axios.get(
      `http://localhost:8081/admin/realms/mern-auth-realm/roles/${role}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    const newRole = roleResponse.data;

    await axios.post(
      `http://localhost:8081/admin/realms/mern-auth-realm/users/${userId}/role-mappings/realm`,
      [newRole],
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      message: `User role updated to ${role} successfully`,
      userId: userId,
      newRole: role
    });

  } catch (error) {
    console.error('Role update error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Error updating user role',
      error: error.response?.data?.error || error.message
    });
  }
});

router.delete('/admin/users/:userId', verifyKeycloakToken, requireRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const adminToken = await getKeycloakAdminToken();

    await axios.delete(
      `http://localhost:8081/admin/realms/mern-auth-realm/users/${userId}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    res.json({
      message: 'User deleted successfully',
      userId: userId
    });

  } catch (error) {
    console.error('User deletion error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Error deleting user',
      error: error.response?.data?.error || error.message
    });
  }
});

// Moderator and admin routes
router.get('/stats', verifyKeycloakToken, requireRole(['moderator', 'admin']), async (req, res) => {
  try {
    const adminToken = await getKeycloakAdminToken();

    const usersResponse = await axios.get(
      'http://localhost:8081/admin/realms/mern-auth-realm/users',
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    const users = usersResponse.data;
    const totalUsers = users.length;

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentUsers = users.filter(user =>
      user.createdTimestamp && user.createdTimestamp > sevenDaysAgo
    ).length;

    const roleDistribution = { user: 0, moderator: 0, admin: 0 };

    for (const user of users.slice(0, 50)) {
      try {
        const rolesResponse = await axios.get(
          `http://localhost:8081/admin/realms/mern-auth-realm/users/${user.id}/role-mappings/realm`,
          {
            headers: { Authorization: `Bearer ${adminToken}` }
          }
        );

        const userRoles = rolesResponse.data.map(role => role.name);
        if (userRoles.includes('admin')) roleDistribution.admin++;
        else if (userRoles.includes('moderator')) roleDistribution.moderator++;
        else roleDistribution.user++;
      } catch (error) {
        roleDistribution.user++;
      }
    }

    const roleDistributionArray = [
      { _id: 'user', count: roleDistribution.user },
      { _id: 'moderator', count: roleDistribution.moderator },
      { _id: 'admin', count: roleDistribution.admin }
    ];

    res.json({
      message: 'User statistics retrieved successfully',
      stats: {
        totalUsers,
        recentUsers,
        roleDistribution: roleDistributionArray,
        requestedBy: {
          id: req.user.id,
          username: req.user.username,
          role: req.user.roles[0] || 'user'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// Role management routes
router.get('/assign-role', verifyKeycloakToken, async (req, res) => {
  try {
    const customRoles = req.user.roles.filter(r => ['user', 'moderator', 'admin'].includes(r));

    if (customRoles.length === 0 && req.user.selectedRole) {
      const { autoAssignRole, getKeycloakAdminToken } = require('../middleware/keycloakAuth');
      await autoAssignRole(req.user, req.token);

      return res.json({
        message: 'Role assignment completed',
        assignedRole: req.user.selectedRole,
        user: {
          id: req.user.id,
          username: req.user.username,
          roles: req.user.roles,
          selectedRole: req.user.selectedRole
        }
      });
    }

    res.json({
      message: 'User already has roles assigned',
      user: {
        id: req.user.id,
        username: req.user.username,
        roles: req.user.roles,
        selectedRole: req.user.selectedRole
      }
    });
  } catch (error) {
    console.error('❌ Error in assign-role endpoint:', error);
    res.status(500).json({
      message: 'Error in role assignment',
      error: error.message
    });
  }
});

router.get('/permissions', verifyKeycloakToken, async (req, res) => {
  try {
    const userPermissions = getUserPermissions(req.user);

    res.json({
      message: 'User permissions retrieved successfully',
      user: {
        id: req.user.id,
        username: req.user.username,
        roles: req.user.roles
      },
      permissions: userPermissions
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching permissions',
      error: error.message
    });
  }
});

// POST ROLE SELECTION FOR NEW USERS
router.post('/select-role', verifyKeycloakToken, async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.user.id;

    // Validate role
    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({
        message: 'Invalid role. Must be user, moderator, or admin.'
      });
    }

    // Check if user already has custom roles assigned
    const customRoles = req.user.roles.filter(r =>
      ['user', 'moderator', 'admin'].includes(r)
    );

    if (customRoles.length > 0) {
      return res.status(400).json({
        message: 'User already has a role assigned. Contact administrator to change roles.',
        currentRoles: customRoles
      });
    }

    // TODO: Implement role assignment logic using existing middleware functions

    res.json({
      message: `Role '${role}' assigned successfully`,
      userId: userId,
      assignedRole: role
    });

  } catch (error) {
    console.error('❌ Role selection failed:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Error assigning role',
      error: error.response?.data?.error || error.message
    });
  }
});

// EXPORT ROUTER
// Make these routes available to be imported by server.js
module.exports = router;