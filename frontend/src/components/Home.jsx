import { useState, useEffect } from 'react';
import axios from 'axios';
import { useKeycloak } from '../context/KeycloakContext.jsx';
import UserHeader from './UserHeader';
import TabNavigation from './TabNavigation';
import UserProfile from './UserProfile';
import UserStats from './UserStats';
import UserManagement from './UserManagement';

const Home = () => {
  const { userProfile, userRoles, authenticated, logout, getToken, hasRole, hasAnyRole } = useKeycloak();

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  const getPermissionsFromRoles = (roles) => {
    const permissions = [];

    if (!roles || roles.length === 0) {
      return ['read_profile'];
    }

    if (roles.includes('user')) {
      permissions.push('read_profile', 'update_own_profile');
    }

    if (roles.includes('moderator')) {
      permissions.push('view_stats', 'moderate_content', 'view_user_list');
    }

    if (roles.includes('admin')) {
      permissions.push('manage_users', 'delete_users', 'system_config', 'view_admin_panel');
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

      await refreshAllData();
      alert('User deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete user:', error);
      alert('Failed to delete user: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleLogout = () => {
    logout();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <UserProfile
            userProfile={userProfile}
            userRoles={userRoles}
            getPermissionsFromRoles={getPermissionsFromRoles}
          />
        );
      case 'stats':
        return <UserStats stats={stats} />;
      case 'users':
        return (
          <UserManagement
            users={users}
            updateUserRole={updateUserRole}
            deleteUser={deleteUser}
            isUpdatingUser={isUpdatingUser}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <UserHeader
          userProfile={userProfile}
          userRoles={userRoles}
          handleLogout={handleLogout}
        />

        <TabNavigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          hasBackendRole={hasBackendRole}
          hasRole={hasRole}
          stats={stats}
          fetchStats={fetchStats}
          users={users}
          fetchUsers={fetchUsers}
        />

        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '32px',
          border: '1px solid #e9ecef',
          minHeight: '400px'
        }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Home;