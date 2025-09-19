const axios = require('axios');
const verifyKeycloakToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        message: 'Access denied. No token provided.'
      });
    }

    const introspectResponse = await axios.post(
      'http://localhost:8081/realms/mern-auth-realm/protocol/openid-connect/token/introspect',
      new URLSearchParams({
        token: token,
        client_id: 'mern-backend-api',
        client_secret: 'uczsUKqFHT11NOHkHAUomDvSbTUJgLS0'
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    if (!introspectResponse.data.active) {
      throw new Error('Token is not active or invalid');
    }

    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

    req.user = {
      id: decoded.sub,
      username: decoded.preferred_username,
      email: decoded.email,
      firstName: decoded.given_name,
      lastName: decoded.family_name,
      roles: decoded.realm_access?.roles || [],
      clientRoles: decoded.resource_access || {},
      fullName: `${decoded.given_name || ''} ${decoded.family_name || ''}`.trim(),
      selectedRole: decoded.role || decoded.selected_role
    };

    req.token = token;

    await autoAssignRole(req.user, token);

    next();
  } catch (error) {
    console.error('Keycloak token verification failed:', {
      error: error.response?.data || error.message,
      status: error.response?.status
    });

    if (error.response?.status === 401) {
      return res.status(401).json({
        message: 'Invalid or expired token.'
      });
    }

    return res.status(401).json({
      message: 'Token verification failed.'
    });
  }
};

const requireRole = (roles) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required.'
      });
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({
        message: `Access denied. Required roles: ${roles.join(', ')}. Your roles: ${userRoles.join(', ')}`
      });
    }

    next();
  };
};

const getPermissionsFromRoles = (roles) => {
  const permissions = new Set();

  if (roles.includes('user')) {
    permissions.add('read_profile');
    permissions.add('update_own_profile');
  }

  if (roles.includes('moderator')) {
    permissions.add('view_stats');
    permissions.add('moderate_content');
    permissions.add('view_user_list');
  }

  if (roles.includes('admin')) {
    permissions.add('manage_users');
    permissions.add('delete_users');
    permissions.add('system_config');
    permissions.add('view_admin_panel');
  }

  return Array.from(permissions);
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required.'
      });
    }

    const userPermissions = getPermissionsFromRoles(req.user.roles);

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        message: `Access denied. Required permission: ${permission}`
      });
    }

    next();
  };
};

const autoAssignRole = async (user, token) => {
  try {
    const customRoles = user.roles.filter(role =>
      ['user', 'moderator', 'admin'].includes(role)
    );

    if (customRoles.length > 0) {
      return;
    }

    let roleToAssign = user.selectedRole;

    if (!roleToAssign) {
      const adminToken = await getKeycloakAdminToken();

      try {
        const userResponse = await axios.get(
          `http://localhost:8081/admin/realms/mern-auth-realm/users/${user.id}`,
          {
            headers: { Authorization: `Bearer ${adminToken}` }
          }
        );

        const userAttributes = userResponse.data.attributes || {};
        roleToAssign = userAttributes.role ? userAttributes.role[0] : null;
      } catch (error) {
        // Silent fail, use default role
      }
    }

    if (!roleToAssign) {
      roleToAssign = 'user';
    }

    if (user.roles.includes(roleToAssign)) {
      return;
    }

    const adminToken = await getKeycloakAdminToken();
    await assignRoleToUser(user.id, roleToAssign, adminToken);
    user.roles.push(roleToAssign);

  } catch (error) {
    console.error('❌ Failed to auto-assign role:', error.message);
    console.error('Error details:', error.response?.data || error);
  }
};

const getKeycloakAdminToken = async () => {
  const response = await axios.post(
    'http://localhost:8081/realms/mern-auth-realm/protocol/openid-connect/token',
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: 'mern-backend-api',
      client_secret: 'uczsUKqFHT11NOHkHAUomDvSbTUJgLS0'
    }),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
  );

  return response.data.access_token;
};

const setUserAttribute = async (userId, attributeName, attributeValue, adminToken) => {
  try {
    await axios.put(
      `http://localhost:8081/admin/realms/mern-auth-realm/users/${userId}`,
      {
        attributes: {
          [attributeName]: [attributeValue]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`✅ User attribute set: ${attributeName} = ${attributeValue}`);
  } catch (error) {
    console.error(`❌ Failed to set user attribute: ${attributeName}`, error.response?.data || error.message);
    throw error;
  }
};

const assignRoleToUser = async (userId, roleName, adminToken) => {
  try {
    let role;
    try {
      const roleResponse = await axios.get(
        `http://localhost:8081/admin/realms/mern-auth-realm/roles/${roleName}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      role = roleResponse.data;
    } catch (roleError) {
      if (roleError.response?.status === 404) {
        await axios.post(
          `http://localhost:8081/admin/realms/mern-auth-realm/roles`,
          {
            name: roleName,
            description: `${roleName.charAt(0).toUpperCase() + roleName.slice(1)} role`
          },
          {
            headers: {
              Authorization: `Bearer ${adminToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const newRoleResponse = await axios.get(
          `http://localhost:8081/admin/realms/mern-auth-realm/roles/${roleName}`,
          {
            headers: { Authorization: `Bearer ${adminToken}` }
          }
        );
        role = newRoleResponse.data;
      } else {
        throw roleError;
      }
    }

    await axios.post(
      `http://localhost:8081/admin/realms/mern-auth-realm/users/${userId}/role-mappings/realm`,
      [role],
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('❌ Failed to assign role:', { userId, roleName, error: error.response?.data || error.message });
    throw error;
  }
};


// Utility functions
const hasRole = (user, role) => {
  return user.roles && user.roles.includes(role);
};

const hasAnyRole = (user, roles) => {
  if (!user.roles) return false;
  return roles.some(role => user.roles.includes(role));
};

const getUserPermissions = (user) => {
  return getPermissionsFromRoles(user.roles || []);
};

module.exports = {
  verifyKeycloakToken,
  requireRole,
  requirePermission,
  hasRole,
  hasAnyRole,
  getUserPermissions,
  getPermissionsFromRoles,
  autoAssignRole,
  getKeycloakAdminToken
};