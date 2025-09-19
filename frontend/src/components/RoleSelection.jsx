import { useState } from 'react';
import axios from 'axios';

const RoleSelection = ({ session, onComplete }) => {
  const [selectedRole, setSelectedRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create user profile with selected role
      const response = await axios.post('http://localhost:5000/api/auth/sync-user', {
        supabase_id: session.user.id,
        username: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
        email: session.user.email,
        role: selectedRole
      });

      localStorage.setItem('user', JSON.stringify(response.data.user));
      onComplete(response.data.user);

    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#f8f9fa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#e8f5e8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <span style={{ fontSize: '24px' }}>✅</span>
          </div>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '24px',
            fontWeight: '600',
            color: '#212529'
          }}>
            Welcome, {session.user.user_metadata?.full_name || session.user.email}!
          </h2>
          <p style={{
            margin: 0,
            color: '#6c757d',
            fontSize: '16px'
          }}>
            Please select your account type to continue
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            color: '#721c24',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '24px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#495057',
              marginBottom: '12px'
            }}>
              Select Your Role
            </label>

            {[
              { value: 'user', label: 'User', description: 'Standard access to basic features' },
              { value: 'moderator', label: 'Moderator', description: 'Access to moderation tools and statistics' },
              { value: 'admin', label: 'Administrator', description: 'Full access to all features and user management' }
            ].map((role) => (
              <div key={role.value} style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '16px',
                  border: `2px solid ${selectedRole === role.value ? '#007bff' : '#e9ecef'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease',
                  backgroundColor: selectedRole === role.value ? '#f8f9ff' : 'white'
                }}>
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={selectedRole === role.value}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    style={{
                      marginRight: '12px',
                      marginTop: '2px'
                    }}
                  />
                  <div>
                    <div style={{
                      fontWeight: '500',
                      fontSize: '16px',
                      color: '#212529',
                      marginBottom: '4px'
                    }}>
                      {role.label}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#6c757d'
                    }}>
                      {role.description}
                    </div>
                  </div>
                </label>
              </div>
            ))}

            <small style={{
              display: 'block',
              marginTop: '16px',
              color: '#6c757d',
              fontSize: '12px',
              textAlign: 'center'
            }}>
              Note: Admin and Moderator roles may require approval
            </small>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 24px',
              backgroundColor: loading ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s ease'
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#0056b3';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#007bff';
              }
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Setting up account...
              </span>
            ) : (
              'Complete Setup'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RoleSelection;