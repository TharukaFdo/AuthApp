import { getRoleColor } from '../utils/roleUtils';

const UserManagement = ({ users, profile, updateUserRole, deleteUser }) => {
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
          <EmptyUsersState />
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {users.map(userItem => (
              <UserCard
                key={userItem._id}
                user={userItem}
                currentUserId={profile?.id}
                onRoleUpdate={updateUserRole}
                onDelete={deleteUser}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyUsersState = () => (
  <div style={{
    textAlign: 'center',
    padding: '40px',
    color: '#64748b'
  }}>
    <div style={{ fontSize: '48px', marginBottom: '16px', fontWeight: '600', color: '#6c757d' }}>
      No Users
    </div>
    <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>No users found</h3>
    <p style={{ margin: 0 }}>Users will appear here once they register.</p>
  </div>
);

const UserCard = ({ user, currentUserId, onRoleUpdate, onDelete }) => {
  const isCurrentUser = user._id === currentUserId;

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
        <UserAvatar user={user} />
        <UserInfo user={user} isCurrentUser={isCurrentUser} />
      </div>

      <UserActions
        user={user}
        isCurrentUser={isCurrentUser}
        onRoleUpdate={onRoleUpdate}
        onDelete={onDelete}
      />
    </div>
  );
};

const UserAvatar = ({ user }) => (
  <div style={{
    width: '56px',
    height: '56px',
    backgroundColor: getRoleColor(user.role),
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
);

const UserInfo = ({ user, isCurrentUser }) => (
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
        backgroundColor: getRoleColor(user.role),
        color: 'white',
        padding: '4px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'uppercase'
      }}>
        {user.role}
      </span>

      <span style={{
        fontSize: '12px',
        color: '#64748b'
      }}>
        Joined {new Date(user.createdAt).toLocaleDateString()}
      </span>
    </div>
  </div>
);

const UserActions = ({ user, isCurrentUser, onRoleUpdate, onDelete }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <select
      value={user.role}
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
);

export default UserManagement;