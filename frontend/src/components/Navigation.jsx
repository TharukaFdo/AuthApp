const Navigation = ({ activeTab, setActiveTab, hasPermission, stats, users, fetchStats, fetchUsers }) => {
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

      {hasPermission('view_stats') && (
        <TabButton
          active={activeTab === 'stats'}
          onClick={() => {
            setActiveTab('stats');
            if (!stats) fetchStats();
          }}
          label="Statistics"
        />
      )}

      {hasPermission('manage_users') && (
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

const TabButton = ({ active, onClick, label }) => {
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
      {label}
    </button>
  );
};

export default Navigation;