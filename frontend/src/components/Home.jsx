import { useState, useEffect } from 'react';
import axios from 'axios';
import { useKeycloak } from '../context/KeycloakContext.jsx';

const Home = () => {
  const { userProfile, userRoles, authenticated, logout, getToken, hasRole, hasAnyRole } = useKeycloak();

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const getPermissionsFromRoles = (roles) => {
    const permissions = [];

    // If no custom roles, assume basic user permissions
    if (!roles || roles.length === 0) {
      permissions.push('read profile', 'update own profile');
    }

    if (roles.includes('user')) {
      permissions.push('read profile', 'update own profile');
    }

    if (roles.includes('moderator')) {
      permissions.push('view stats', 'moderate content', 'view user list');
    }

    if (roles.includes('admin')) {
      permissions.push('manage users', 'delete users', 'system config', 'view admin panel');
    }

    return permissions;
  };

  const hasBackendRole = (rolesToCheck) => {
    const rolesArray = Array.isArray(rolesToCheck) ? rolesToCheck : [rolesToCheck];
    return rolesArray.some(role => userRoles.includes(role));
  };

  // API functions
  const refreshAllData = async () => {
    try {
      await fetchUsers();
      await fetchStats();
    } catch (error) {
      console.error('❌ Failed to refresh data:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await axios.get('http://localhost:5000/api/user/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await axios.get('http://localhost:5000/api/user/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    setIsUpdatingUser(true);
    try {
      const token = getToken();
      if (!token) return;

      await axios.put(`http://localhost:5000/api/user/admin/users/${userId}/role`,
        { role: newRole },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      await refreshAllData();
      alert('User role updated successfully');
    } catch (error) {
      console.error('❌ Failed to update user role:', error);
      alert('Failed to update user role: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = getToken();
      if (!token) return;

      await axios.delete(`http://localhost:5000/api/user/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Refresh all data after deletion
      await refreshAllData();

      alert('User deleted successfully');
    } catch (error) {
      alert('Failed to delete user: ' + (error.response?.data?.message || error.message));
    }
  };


  const handleLogout = () => {
    // Use Keycloak logout which handles everything
    logout();
  };



  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>

        <div style={{
          backgroundColor: '#adb5bd',
          borderRadius: '8px',
          padding: '32px',
          marginBottom: '32px',
          color: 'white'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <h1 style={{
                margin: '0 0 8px 0',
                fontSize: '28px',
                fontWeight: '600',
                color: 'black'
              }}>
                Welcome back, {userProfile?.username || userProfile?.firstName || 'User'}!
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {userRoles.filter(role =>
                  ['user', 'moderator', 'admin'].includes(role)
                ).map(role => (
                  <span key={role} style={{
                    backgroundColor: getRoleColor(role),
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {role}
                  </span>
                ))}
                <span style={{
                  fontSize: '14px',
                  opacity: '0.9'
                }}>
                  • {getPermissionsFromRoles(userRoles).length} permissions
                </span>
              </div>
            </div>

            <button onClick={handleLogout} style={{
              padding: '12px 24px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'black',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.15s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}>
              Logout
            </button>
          </div>
        </div>


        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '32px',
          padding: '8px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <TabButton
            active={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
            label="Profile"
          />

          {hasBackendRole(['moderator', 'admin']) && (
            <TabButton
              active={activeTab === 'stats'}
              onClick={() => {
                setActiveTab('stats');
                if (!stats) fetchStats();
              }}
              label="Statistics"
            />
          )}

          {hasRole('admin') && (
            <TabButton
              active={activeTab === 'users'}
              onClick={() => {
                setActiveTab('users');
                if (users.length === 0) fetchUsers();
              }}
              label="Manage Users"
            />
          )}
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '32px',
          border: '1px solid #e9ecef',
          minHeight: '400px'
        }}>
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'stats' && renderStatsTab()}
          {activeTab === 'users' && renderUsersTab()}
        </div>
      </div>
    </div>
  );

  function TabButton({ active, onClick, icon, label }) {
    return (
      <button
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 20px',
          backgroundColor: active ? '#adb5bd' : 'transparent',
          color: active ? 'white' : '#6c757d',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.15s ease',
          minWidth: '120px',
          justifyContent: 'center'
        }}
        onMouseOver={(e) => {
          if (!active) {
            e.target.style.backgroundColor = '#e9ecef';
            e.target.style.color = '#495057';
          }
        }}
        onMouseOut={(e) => {
          if (!active) {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#6c757d';
          }
        }}
      >
        <span style={{ fontSize: '16px' }}>{icon}</span>
        {label}
      </button>
    );
  }

  // Helper functions
  function getRoleColor(role) {
    switch (role) {
      case 'admin': return '#dc3545';
      case 'moderator': return '#fd7e14';
      case 'user': return '#198754';
      default: return '#6c757d';
    }
  }

  function renderProfileTab() {

    return (
      <div>
        <h2 style={{
          margin: '0 0 32px 0',
          fontSize: '24px',
          fontWeight: '700',
          color: '#1e293b'
        }}>
          Profile Information
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* USER INFO CARD */}
          <div style={{
            backgroundColor: '#adb5bd',
            padding: '24px',
            borderRadius: '8px',
            color: 'white',
            border: '1px solid #adb5bd'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '24px',
                fontWeight: '600',
                color: 'black'
              }}>
                {(userProfile?.username || userProfile?.firstName || 'U').charAt(0).toUpperCase()}
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: 'black' }}>
                {userProfile?.username || userProfile?.fullName || 'User'}
              </h3>
              <p style={{ margin: '0 0 16px 0', opacity: '0.9', color: 'black' }}>
                {userProfile?.email || 'No email'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', minHeight: '40px' }}>
                {/* Use roles from Keycloak */}
                {userRoles.filter(role =>
                  ['user', 'moderator', 'admin'].includes(role)
                ).map(role => (
                  <span key={role} style={{
                    backgroundColor: getRoleColor(role),
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ACCOUNT DETAILS CARD */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#1e293b' }}>
              Account Details
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '4px'
              }}>
                User ID
              </label>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#1e293b',
                fontFamily: 'monospace',
                backgroundColor: '#e9ecef',
                padding: '8px 12px',
                borderRadius: '4px'
              }}>
                {userProfile?.id || 'Not available'}
              </p>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '4px'
              }}>
                Member Since
              </label>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#1e293b'
              }}>
                Not available
              </p>
            </div>
          </div>
        </div>

        {/* PERMISSIONS SECTION */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '24px',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '18px',
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            Your Permissions
          </h3>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            {getPermissionsFromRoles(userRoles).map(permission => (
              <span key={permission} style={{
                backgroundColor: '#adb5bd',
                color: 'black',
                padding: '8px 16px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'capitalize'
              }}>
                {permission}
              </span>
            ))}
          </div>

          {getPermissionsFromRoles(userRoles).length === 0 && (
            <p style={{ color: '#64748b', fontStyle: 'italic', margin: 0 }}>
              No permissions available
            </p>
          )}
        </div>
      </div>
    );
  }

  // RENDER STATISTICS TAB WITH ENHANCED DESIGN
  function renderStatsTab() {
    if (!stats) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #adb5bd',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginTop: '16px', color: '#64748b' }}>Loading statistics...</p>
        </div>
      );
    }

    return (
      <div>
        <h2 style={{
          margin: '0 0 32px 0',
          fontSize: '24px',
          fontWeight: '700',
          color: '#1e293b'
        }}>
          Statistics
        </h2>

        {/* STATISTICS CARDS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            color="#adb5bd"
            bgColor="#f8f9fa"
          />

          <StatCard
            title="New Users (7 days)"
            value={stats.recentUsers}
            color="#198754"
            bgColor="#f8f9fa"
          />

          <StatCard
            title="Growth Rate"
            value={`${Math.round((stats.recentUsers / stats.totalUsers) * 100)}%`}
            color="#fd7e14"
            bgColor="#f8f9fa"
          />
        </div>

        {/* ROLE DISTRIBUTION CHART */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '32px',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{
            margin: '0 0 24px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: '#1e293b'
          }}>
            Role Distribution
          </h3>

          <div style={{ display: 'grid', gap: '16px' }}>
            {stats.roleDistribution.map(roleData => (
              <div key={roleData._id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '6px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: getRoleColor(roleData._id),
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'white'
                  }}>
                    {roleData._id.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{
                      margin: '0 0 4px 0',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1e293b',
                      textTransform: 'capitalize'
                    }}>
                      {roleData._id}s
                    </h4>
                    <p style={{
                      margin: 0,
                      fontSize: '14px',
                      color: '#64748b'
                    }}>
                      {Math.round((roleData.count / stats.totalUsers) * 100)}% of total users
                    </p>
                  </div>
                </div>

                <div style={{
                  backgroundColor: getRoleColor(roleData._id),
                  color: 'white',
                  padding: '12px 20px',
                  borderRadius: '4px',
                  fontSize: '18px',
                  fontWeight: '700'
                }}>
                  {roleData.count}
                </div>
              </div>
            ))}
          </div>

          {/* REQUEST INFO */}
          <div style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: '#e9ecef',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#495057'
          }}>
            <strong>Report generated by:</strong> {stats.requestedBy.username} ({stats.requestedBy.role})
          </div>
        </div>
      </div>
    );
  }

  // STAT CARD COMPONENT
  function StatCard({ title, value, color, bgColor }) {
    return (
      <div style={{
        backgroundColor: bgColor,
        padding: '24px',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        textAlign: 'center'
      }}>
        <h3 style={{
          margin: '0 0 8px 0',
          fontSize: '32px',
          fontWeight: '700',
          color: color
        }}>
          {value}
        </h3>
        <p style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: '600',
          color: '#6c757d'
        }}>
          {title}
        </p>
      </div>
    );
  }

  // RENDER USER MANAGEMENT TAB WITH ENHANCED DESIGN
  function renderUsersTab() {

    return (
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '700',
            color: '#1e293b'
          }}>
            User Management
          </h2>

          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '12px 16px',
            borderRadius: '6px',
            border: '1px solid #e9ecef'
          }}>
            <span style={{ fontSize: '14px', color: '#64748b' }}>
              Total Users: <strong style={{ color: '#1e293b' }}>{users.length}</strong>
            </span>
          </div>
        </div>

        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '32px',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          {users.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#64748b'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', fontWeight: '600', color: '#6c757d' }}>No Users</div>
              <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>No users found</h3>
              <p style={{ margin: 0 }}>Users will appear here once they register.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {users.map(userItem => (
                <UserCard
                  key={userItem._id || userItem.id || userItem.email}
                  user={userItem}
                  onRoleUpdate={updateUserRole}
                  onDelete={deleteUser}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // USER CARD COMPONENT
  function UserCard({ user, onRoleUpdate, onDelete }) {
    // Match by email since IDs are different between Keycloak and database
    const isCurrentUser = user.email === userProfile?.email;

    // Use Keycloak roles for current user, database role for others
    const displayRole = isCurrentUser && userRoles.length > 0
      ? userRoles.find(role => ['user', 'moderator', 'admin'].includes(role)) || user.role
      : user.role;


    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px',
        backgroundColor: isCurrentUser ? '#e7f1ff' : 'white',
        borderRadius: '8px',
        border: isCurrentUser ? '2px solid #adb5bd' : '1px solid #e9ecef'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          {/* USER AVATAR */}
          <div style={{
            width: '56px',
            height: '56px',
            backgroundColor: getRoleColor(displayRole),
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            color: 'white',
            fontWeight: '600'
          }}>
            {user.username.charAt(0).toUpperCase()}
          </div>

          {/* USER INFO */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <h4 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '600',
                color: '#1e293b'
              }}>
                {user.username}
                {isCurrentUser && (
                  <span style={{
                    fontSize: '12px',
                    color: '#adb5bd',
                    fontWeight: '600',
                    marginLeft: '8px'
                  }}>
                    (You)
                  </span>
                )}
              </h4>
            </div>

            <p style={{
              margin: '0 0 8px 0',
              fontSize: '14px',
              color: '#64748b'
            }}>
              {user.email}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                backgroundColor: getRoleColor(displayRole),
                color: 'white',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>
                {displayRole}
              </span>

              <span style={{
                fontSize: '12px',
                color: '#64748b'
              }}>
                Joined {user.createdAt && !isNaN(new Date(user.createdAt))
                  ? new Date(user.createdAt).toLocaleDateString()
                  : user.createdTimestamp && !isNaN(new Date(user.createdTimestamp))
                  ? new Date(user.createdTimestamp).toLocaleDateString()
                  : 'Unknown Date'}
              </span>
            </div>
          </div>
        </div>

        {/* USER ACTIONS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* ROLE SELECTOR */}
          <select
            value={displayRole}
            onChange={(e) => onRoleUpdate(user._id, e.target.value)}
            disabled={isCurrentUser}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              backgroundColor: isCurrentUser ? '#e9ecef' : 'white',
              color: isCurrentUser ? '#6c757d' : '#212529',
              fontSize: '14px',
              cursor: isCurrentUser ? 'not-allowed' : 'pointer'
            }}
          >
            <option value="user">User</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
          </select>

          {/* DELETE BUTTON */}
          <button
            onClick={() => onDelete(user._id)}
            disabled={isCurrentUser}
            style={{
              padding: '8px 16px',
              backgroundColor: isCurrentUser ? '#e9ecef' : '#dc3545',
              color: isCurrentUser ? '#6c757d' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isCurrentUser ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              if (!isCurrentUser) {
                e.target.style.backgroundColor = '#bb2d3b';
              }
            }}
            onMouseOut={(e) => {
              if (!isCurrentUser) {
                e.target.style.backgroundColor = '#dc3545';
              }
            }}
          >
            {isCurrentUser ? 'Protected' : 'Delete'}
          </button>
        </div>
      </div>
    );
  }
};

// EXPORT COMPONENT
export default Home;