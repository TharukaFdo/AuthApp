import React from 'react';
import TabButton from './TabButton';

const TabNavigation = ({
  activeTab,
  setActiveTab,
  hasBackendRole,
  hasRole,
  stats,
  fetchStats,
  users,
  fetchUsers
}) => {
  return (
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
  );
};

export default TabNavigation;