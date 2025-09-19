import React from 'react';
import { useKeycloak } from '../context/KeycloakContext';

const KeycloakLogin = () => {
  const { login, register } = useKeycloak();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '28px',
            fontWeight: '600',
            color: '#212529'
          }}>
            Welcome to MERN Auth
          </h1>
          <p style={{
            margin: 0,
            color: '#6c757d',
            fontSize: '16px'
          }}>
            Secure authentication powered by Keycloak
          </p>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <button
            onClick={login}
            style={{
              width: '100%',
              padding: '14px 24px',
              backgroundColor: '#adb5bd',
              color: 'black',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#98a2ac';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#adb5bd';
            }}
          >
            Sign In with Keycloak
          </button>

          <button
            onClick={register}
            style={{
              width: '100%',
              padding: '14px 24px',
              backgroundColor: 'transparent',
              color: '#adb5bd',
              border: '1px solid #adb5bd',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#adb5bd';
              e.target.style.color = 'black';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#adb5bd';
            }}
          >
            Create New Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeycloakLogin;