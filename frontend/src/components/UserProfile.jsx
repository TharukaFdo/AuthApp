import { useState } from 'react';
import { getRoleColor } from '../utils/roleUtils';
import PhoneLinking from './PhoneLinking';

const UserProfile = ({ profile, permissions }) => {
  const [showPhoneLinking, setShowPhoneLinking] = useState(false);
  const [userProfile, setUserProfile] = useState(profile);

  const handlePhoneLinked = (phone) => {
    // Update the profile with the new phone
    setUserProfile({
      ...userProfile,
      phone: phone,
      phone_verified: true
    });
    setShowPhoneLinking(false);
  };

  if (!userProfile) {
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
        <UserInfoCard profile={userProfile} />
        <AccountDetailsCard profile={userProfile} />
      </div>

      <PhoneManagementSection
        profile={userProfile}
        showPhoneLinking={showPhoneLinking}
        setShowPhoneLinking={setShowPhoneLinking}
        onPhoneLinked={handlePhoneLinked}
      />

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

const PhoneManagementSection = ({ profile, showPhoneLinking, setShowPhoneLinking, onPhoneLinked }) => (
  <div style={{
    backgroundColor: '#f8f9fa',
    padding: '24px',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
    marginBottom: '32px'
  }}>
    <h3 style={{
      margin: '0 0 20px 0',
      fontSize: '18px',
      color: '#1e293b'
    }}>
      Phone Number Management
    </h3>

    {profile.phone ? (
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <span style={{
            fontSize: '16px',
            color: '#1e293b',
            fontWeight: '500'
          }}>
            {profile.phone}
          </span>
          <span style={{
            backgroundColor: profile.phone_verified ? '#28a745' : '#ffc107',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {profile.phone_verified ? 'Verified' : 'Unverified'}
          </span>
        </div>
        <p style={{
          color: '#64748b',
          fontSize: '14px',
          margin: '0 0 16px 0'
        }}>
          Your phone number is linked to your account and stored in the primary phone field.
        </p>
        {!profile.phone_verified && (
          <button
            onClick={() => setShowPhoneLinking(true)}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Verify Phone Number
          </button>
        )}
      </div>
    ) : (
      <div>
        <p style={{
          color: '#64748b',
          fontSize: '14px',
          margin: '0 0 16px 0'
        }}>
          No phone number linked to your account. Link a phone number to enable SMS features and add it as a primary authentication method.
        </p>
        <button
          onClick={() => setShowPhoneLinking(true)}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Link Phone Number
        </button>
      </div>
    )}

    {showPhoneLinking && (
      <div style={{ marginTop: '24px' }}>
        <PhoneLinking
          user={profile}
          onPhoneLinked={onPhoneLinked}
        />
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            onClick={() => setShowPhoneLinking(false)}
            style={{
              backgroundColor: 'transparent',
              color: '#6c757d',
              border: '1px solid #ced4da',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    )}
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