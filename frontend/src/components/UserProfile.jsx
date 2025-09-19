import React from 'react';

const UserProfile = ({ userProfile, userRoles, getPermissionsFromRoles }) => {
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#dc3545';
      case 'moderator': return '#fd7e14';
      default: return '#6c757d';
    }
  };

  const userPermissions = getPermissionsFromRoles(userRoles);

  return (
    <div>
      <h2 style={{
        margin: '0 0 32px 0',
        fontSize: '24px',
        fontWeight: '600',
        color: '#212529'
      }}>
        Your Profile
      </h2>

      <div style={{
        display: 'grid',
        gap: '24px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
      }}>
        <div style={{
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          padding: '24px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#212529'
          }}>
            Account Information
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <strong style={{ color: '#495057' }}>Username:</strong>{' '}
              <span style={{ color: '#212529' }}>{userProfile?.username || 'Not available'}</span>
            </div>
            <div>
              <strong style={{ color: '#495057' }}>Email:</strong>{' '}
              <span style={{ color: '#212529' }}>{userProfile?.email || 'Not available'}</span>
            </div>
            <div>
              <strong style={{ color: '#495057' }}>Full Name:</strong>{' '}
              <span style={{ color: '#212529' }}>{userProfile?.fullName || 'Not available'}</span>
            </div>
            <div>
              <strong style={{ color: '#495057' }}>User ID:</strong>{' '}
              <span style={{
                color: '#6c757d',
                fontFamily: 'monospace',
                fontSize: '14px'
              }}>
                {userProfile?.id || 'Not available'}
              </span>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          padding: '24px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#212529'
          }}>
            Your Roles
          </h3>
            {userRoles.filter(role => ['user', 'moderator', 'admin'].includes(role))
              .map(role => (
                <span key={role} style={{
                  backgroundColor: getRoleColor(role),
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500',
                  textTransform: 'uppercase'
                }}>
                  {role}
                </span>
              ))}

          <h4 style={{
            margin: '16px 0 8px 0',
            fontSize: '14px',
            fontWeight: '600',
            color: '#495057'
          }}>
            Your Permissions:
          </h4>
          <ul style={{
            margin: 0,
            paddingLeft: '20px',
            color: '#6c757d',
            fontSize: '14px'
          }}>
            {userPermissions.map((permission, index) => (
              <li key={index} style={{ marginBottom: '4px' }}>
                {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;