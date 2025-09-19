import { getRoleColor } from '../utils/roleUtils';

const UserProfile = ({ profile, permissions }) => {
  if (!profile) {
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
        <p style={{ marginTop: '16px', color: '#64748b' }}>Loading profile...</p>
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
        Profile Information
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        <UserInfoCard profile={profile} />
        <AccountDetailsCard profile={profile} />
      </div>

      <PermissionsSection permissions={permissions} />
    </div>
  );
};

const UserInfoCard = ({ profile }) => (
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
        {profile.username.charAt(0).toUpperCase()}
      </div>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: 'black' }}>
        {profile.username}
      </h3>
      <p style={{ margin: '0 0 16px 0', opacity: '0.9', color: 'black' }}>
        {profile.email}
      </p>
      <span style={{
        backgroundColor: getRoleColor(profile.role),
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {profile.role}
      </span>
    </div>
  </div>
);

const AccountDetailsCard = ({ profile }) => (
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
        {profile.id}
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
        {new Date(profile.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </p>
    </div>
  </div>
);

const PermissionsSection = ({ permissions }) => (
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
      {permissions.map(permission => (
        <span key={permission} style={{
          backgroundColor: '#adb5bd',
          color: 'black',
          padding: '8px 16px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'capitalize'
        }}>
          {permission.replace('_', ' ')}
        </span>
      ))}
    </div>

    {permissions.length === 0 && (
      <p style={{ color: '#64748b', fontStyle: 'italic', margin: 0 }}>
        No permissions loaded yet...
      </p>
    )}
  </div>
);

export default UserProfile;