import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import AuthCallback from './components/AuthCallback';
import { supabase } from './lib/supabase';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('App mounted. Current URL:', window.location.href);
    console.log('Pathname:', window.location.pathname);
    console.log('Hash:', window.location.hash);

    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setUser(JSON.parse(userData));
    }

    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const switchToRegister = () => setIsLogin(false);
  const switchToLogin = () => setIsLogin(true);

  // Check if this is an OAuth callback (handle both path and hash)
  const isAuthCallback = window.location.pathname === '/auth/callback';

  console.log('isAuthCallback:', isAuthCallback);
  console.log('Current pathname:', window.location.pathname);

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  }

  if (isAuthCallback) {
    console.log('✅ Rendering AuthCallback component');
    return <AuthCallback onLogin={handleLogin} />;
  }

  if (user) {
    console.log('✅ User logged in, rendering Home');
    return <Home user={user} onLogout={handleLogout} />;
  }

  console.log('✅ Rendering login/register forms');
  return (
    <div>
      {isLogin ? (
        <Login
          onLogin={handleLogin}
          switchToRegister={switchToRegister}
        />
      ) : (
        <Register
          onLogin={handleLogin}
          switchToLogin={switchToLogin}
        />
      )}
    </div>
  );
}

export default App
