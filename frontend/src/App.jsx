import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const handleLogout = () => {
    setUser(null);
  };

  const switchToRegister = () => setIsLogin(false);
  const switchToLogin = () => setIsLogin(true);

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  }

  if (user) {
    return <Home user={user} onLogout={handleLogout} />;
  }

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
