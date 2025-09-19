import React from 'react';

const UserHeader = ({ userProfile, userRoles, handleLogout }) => {
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#dc3545';
      case 'moderator': return '#fd7e14';
      default: return '#6c757d';
    }
  };

  return (
    <div style={{
      backgroundColor: '#adb5bd',
      borderRadius: '8px',
      padding: '32px',
      marginBottom: '32px',
      color: 'black'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <h1 style={{
            margin: '0 0 12px 0',
            fontSize: '32px',
            fontWeight: '700',
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
                margin: '10px 0 0 0',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
                textTransform: 'uppercase'
              }}>
                {role}
              </span>
            ))}
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '12px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            fontSize: '14px',
            color: 'black',
            opacity: 0.8
          }}>
            <div><strong>Email:</strong> {userProfile?.email}</div>
            {userProfile?.fullName && (
              <div><strong>Name:</strong> {userProfile.fullName}</div>
            )}
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'black',
              border: '1px solid rgba(0, 0, 0, 0.2)',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserHeader;