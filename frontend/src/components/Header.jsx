import { getRoleColor } from '../utils/roleUtils';

const Header = ({ user, permissions, onLogout }) => {
  return (
    <div style={{
      backgroundColor: '#adb5bd',
      borderRadius: '8px',
      padding: '32px',
      marginBottom: '32px',
      color: 'white'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '28px',
            fontWeight: '600',
            color: 'black'
          }}>
            Welcome back, {user.username}!
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              backgroundColor: getRoleColor(user.role),
              color: 'white',
              padding: '6px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {user.role}
            </span>
            <span style={{
              fontSize: '14px',
              opacity: '0.9'
            }}>
              • {permissions.length} permissions
            </span>
          </div>
        </div>

        <button onClick={onLogout} style={{
          padding: '12px 24px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          color: 'black',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'background-color 0.15s ease'
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        }}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Header;