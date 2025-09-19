import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import axios from 'axios';
import RoleSelection from './RoleSelection';

const AuthCallback = ({ onLogin }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const handleAuthCallback = async () => {
      console.log('🔄 AuthCallback: Starting...');

      try {
        // Get session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        console.log('📱 Session from Supabase:', session ? 'Found' : 'Not found', sessionError);

        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          if (isMounted) {
            setError('Authentication failed');
            setLoading(false);
          }
          return;
        }

        if (!session) {
          console.log('⏳ No session yet, waiting for auth state change...');

          const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            console.log('🔄 Auth state change:', event);

            if (event === 'SIGNED_IN' && newSession && isMounted) {
              authListener.subscription.unsubscribe();
              await processSession(newSession);
            }
          });

          // Cleanup listener after 10 seconds if no session
          setTimeout(() => {
            if (isMounted && loading) {
              authListener.subscription.unsubscribe();
              setError('Authentication timeout');
              setLoading(false);
            }
          }, 10000);

          return () => {
            authListener.subscription.unsubscribe();
          };
        } else {
          await processSession(session);
        }

      } catch (error) {
        console.error('❌ Callback error:', error);
        if (isMounted) {
          setError('Login failed');
          setLoading(false);
        }
      }
    };

    const processSession = async (session) => {
      console.log('🔧 Processing session...');

      try {
        if (!session || !isMounted) return;

        // Store token
        localStorage.setItem('token', session.access_token);
        console.log('💾 Token stored');

        try {
          // Try to get existing user profile
          console.log('👤 Fetching user profile...');
          const response = await axios.get('http://localhost:5000/api/user/profile', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });

          console.log('✅ User profile found');
          localStorage.setItem('user', JSON.stringify(response.data.user));
          if (isMounted) {
            onLogin(response.data.user);
            // Redirect to home after successful login
            window.location.href = '/';
          }

        } catch (profileError) {
          console.log('👤 Profile not found, showing role selection...');
          // If profile doesn't exist, show role selection for Google OAuth users
          if (profileError.response?.status === 401) {
            if (isMounted) {
              setSession(session);
              setShowRoleSelection(true);
              setLoading(false);
            }
          } else {
            throw profileError;
          }
        }

      } catch (error) {
        console.error('❌ Process session error:', error);
        if (isMounted) {
          setError('Login failed: ' + error.message);
          setLoading(false);
        }
      }
    };

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [onLogin]);

  const handleRoleSelection = (userData) => {
    console.log('✅ Role selected, completing login');
    onLogin(userData);
    window.location.href = '/';
  };

  if (loading) {
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
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #6c757d',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6c757d', fontSize: '16px' }}>
            Completing Google sign in...
          </p>
          <p style={{ color: '#6c757d', fontSize: '14px', marginTop: '8px' }}>
            Please wait while we set up your account
          </p>
        </div>
      </div>
    );
  }

  if (showRoleSelection && session) {
    return <RoleSelection session={session} onComplete={handleRoleSelection} />;
  }

  if (error) {
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
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <h2 style={{ color: '#dc3545', marginBottom: '16px' }}>Authentication Error</h2>
          <p style={{ color: '#6c757d', marginBottom: '24px' }}>{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;