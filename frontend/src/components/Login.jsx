import { useState } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabase';

const Login = ({ onLogin, switchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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

    setLoading(true);
    setError('');

    try {
      // Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      await handleSuccessfulAuth(authData);

    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Login failed');

    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        setError(error.message);
      }
    } catch (error) {
      setError('Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessfulAuth = async (authData) => {
    // Store the access token
    localStorage.setItem('token', authData.session.access_token);

    try {
      // Try to get user profile from your backend
      const response = await axios.get('http://localhost:5000/api/user/profile', {
        headers: { 'Authorization': `Bearer ${authData.session.access_token}` }
      });

      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLogin(response.data.user);

    } catch (profileError) {
      // If profile doesn't exist, sync the user profile
      if (profileError.response?.status === 401 && profileError.response?.data?.message === 'User profile not found') {
        const syncResponse = await axios.post('http://localhost:5000/api/auth/sync-user', {
          supabase_id: authData.user.id,
          username: authData.user.user_metadata?.full_name || authData.user.email.split('@')[0],
          email: authData.user.email,
          role: 'user'
        });

        localStorage.setItem('user', JSON.stringify(syncResponse.data.user));
        onLogin(syncResponse.data.user);
      } else {
        throw profileError;
      }
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
      boxSizing: 'border-box'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        boxSizing: 'border-box'
      }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '28px',
            fontWeight: '600',
            color: '#212529'
          }}>
            Welcome Back
          </h2>
          <p style={{
            margin: 0,
            color: '#6c757d',
            fontSize: '16px'
          }}>
            Sign in to your account
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

          <div style={{ marginBottom: '32px' }}>
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
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '20px 0',
            fontSize: '14px',
            color: '#6c757d'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
            <span style={{ padding: '0 16px' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 24px',
              backgroundColor: 'white',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#f9fafb';
                e.target.style.borderColor = '#9ca3af';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = 'white';
                e.target.style.borderColor = '#d1d5db';
              }
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: '32px',
          padding: '24px 0',
          borderTop: '1px solid #e2e8f0'
        }}>
          <p style={{
            margin: '0 0 16px 0',
            color: '#64748b',
            fontSize: '14px'
          }}>
            Don't have an account?
          </p>
          <button
            onClick={switchToRegister}
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
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;