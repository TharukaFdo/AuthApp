import { useState } from 'react';
import axios from 'axios';

const Register = ({ onLogin, switchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      onLogin(response.data.user);

    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');

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
      padding: '20px',
      margin: 0,
      boxSizing: 'border-box',
      overflowY: 'auto'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        boxSizing: 'border-box',
        marginTop: 'auto',
        marginBottom: 'auto'
      }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '28px',
            fontWeight: '600',
            color: '#212529'
          }}>
            Create Account
          </h2>
          <p style={{
            margin: 0,
            color: '#6c757d',
            fontSize: '16px'
          }}>
            Join us today
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
        
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#495057',
              marginBottom: '8px'
            }}>
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '16px',
                backgroundColor: '#ffffff',
                color: '#212529',
                outline: 'none',
                transition: 'border-color 0.15s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6c757d';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#ced4da';
              }}
              placeholder="Enter your username"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#495057',
              marginBottom: '8px'
            }}>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '16px',
                backgroundColor: '#ffffff',
                color: '#212529',
                outline: 'none',
                transition: 'border-color 0.15s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6c757d';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#ced4da';
              }}
              placeholder="Enter your email"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#495057',
              marginBottom: '8px'
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '16px',
                backgroundColor: '#ffffff',
                color: '#212529',
                outline: 'none',
                transition: 'border-color 0.15s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6c757d';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#ced4da';
              }}
              placeholder="Enter your password"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#495057',
              marginBottom: '8px'
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '16px',
                backgroundColor: '#ffffff',
                color: '#212529',
                outline: 'none',
                transition: 'border-color 0.15s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6c757d';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#ced4da';
              }}
              placeholder="Confirm your password"
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#495057',
              marginBottom: '8px'
            }}>
              Account Type
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '16px',
                backgroundColor: '#ffffff',
                color: '#212529',
                outline: 'none',
                transition: 'border-color 0.15s ease',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6c757d';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#ced4da';
              }}
            >
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
            <small style={{
              display: 'block',
              marginTop: '8px',
              color: '#6c757d',
              fontSize: '12px'
            }}>
              Note: Admin approval may be required for elevated roles
            </small>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 24px',
              backgroundColor: loading ? '#6c757d' : '#6c757d',
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
                e.target.style.backgroundColor = '#5a6268';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#6c757d';
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
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '32px',
          padding: '24px 0',
          borderTop: '1px solid #e2e8f0'
        }}>
          <p style={{
            margin: '0 0 16px 0',
            color: '#6c757d',
            fontSize: '14px'
          }}>
            Already have an account?
          </p>
          <button
            onClick={switchToLogin}
            style={{
              background: 'none',
              border: '1px solid #6c757d',
              color: '#6c757d',
              padding: '8px 24px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#6c757d';
              e.target.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#6c757d';
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;