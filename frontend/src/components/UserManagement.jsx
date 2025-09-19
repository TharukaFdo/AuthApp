import React from 'react';

const UserManagement = ({ users, updateUserRole, deleteUser, isUpdatingUser }) => {
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#dc3545';
      case 'moderator': return '#fd7e14';
      default: return '#6c757d';
    }
  };

  if (users.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ color: '#6c757d' }}>Loading users...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{
        margin: '0 0 32px 0',
        fontSize: '24px',
        fontWeight: '600',
        color: '#212529'
      }}>
        Manage Users
      </h2>

      <div style={{
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        padding: '24px',
        border: '1px solid #e9ecef'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 2fr 1fr 1fr auto',
          gap: '16px',
          padding: '16px',
          backgroundColor: '#e9ecef',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '14px',
          fontWeight: '600',
          color: '#495057'
        }}>
          <div>Username</div>
          <div>Email</div>
          <div>Role</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        <div style={{ display: 'grid', gap: '8px' }}>
          {users.map((user) => (
            <div key={user._id} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 2fr 1fr 1fr auto',
              gap: '16px',
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid #e9ecef',
              alignItems: 'center'
            }}>
              <div style={{ fontWeight: '500', color: '#212529' }}>
                {user.username}
              </div>

              <div style={{ color: '#6c757d', fontSize: '14px' }}>
                {user.email}
              </div>

              <div>
                <select
                  value={user.role}
                  onChange={(e) => updateUserRole(user._id, e.target.value)}
                  disabled={isUpdatingUser}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: '1px solid #4a8dcfff',
                    fontSize: '14px',
                    backgroundColor: 'black',
                    cursor: isUpdatingUser ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <span style={{
                  backgroundColor: user.enabled ? '#1daf3fff' : '#f8d7da',
                  color: user.enabled ? '#155724' : '#721c24',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500' 
                }}>
                  {user.enabled ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => deleteUser(user._id)}
                  disabled={isUpdatingUser}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: isUpdatingUser ? 'not-allowed' : 'pointer',
                    opacity: isUpdatingUser ? 0.6 : 1
                  }}
                  onMouseOver={(e) => {
                    if (!isUpdatingUser) {
                      e.target.style.backgroundColor = '#c82333';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isUpdatingUser) {
                      e.target.style.backgroundColor = '#dc3545';
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {isUpdatingUser && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '6px',
            color: '#856404',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            Updating user... Please wait.
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;