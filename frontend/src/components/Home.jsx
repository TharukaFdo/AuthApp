import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';
import Navigation from './Navigation';
import UserProfile from './UserProfile';
import Statistics from './Statistics';
import UserManagement from './UserManagement';
import ErrorMessage from './ErrorMessage';
import LoadingSpinner from './LoadingSpinner';

const Home = ({ user, onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [permissions, setPermissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    fetchProfile();
    fetchPermissions();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setProfile(response.data.user);
    } catch (error) {
      setError('Failed to fetch profile data');
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/user/permissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setPermissions(response.data.permissions);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/user/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUsers(response.data.users);
    } catch (error) {
      setError('Failed to fetch users. You may not have permission.');
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/user/mod/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStats(response.data.stats);
    } catch (error) {
      setError('Failed to fetch statistics. You may not have permission.');
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/user/admin/users/${userId}/role`,
        { role: newRole },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      fetchUsers();
      if (stats) {
        fetchStats();
      }
      alert('User role updated successfully');
    } catch (error) {
      alert('Failed to update user role: ' + (error.response?.data?.message || error.message));
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/user/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchUsers();
      if (stats) {
        fetchStats();
      }
      alert('User deleted successfully');
    } catch (error) {
      alert('Failed to delete user: ' + (error.response?.data?.message || error.message));
    }
  };

  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <UserProfile profile={profile} permissions={permissions} />;
      case 'stats':
        return <Statistics stats={stats} />;
      case 'users':
        return (
          <UserManagement
            users={users}
            profile={profile}
            updateUserRole={updateUserRole}
            deleteUser={deleteUser}
          />
        );
      default:
        return <UserProfile profile={profile} permissions={permissions} />;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <Header user={user} permissions={permissions} onLogout={handleLogout} />

        <ErrorMessage message={error} />

        <Navigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          hasPermission={hasPermission}
          stats={stats}
          users={users}
          fetchStats={fetchStats}
          fetchUsers={fetchUsers}
        />

        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '32px',
          border: '1px solid #e9ecef',
          minHeight: '400px'
        }}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Home;