import React from 'react';

const UserStats = ({ stats }) => {
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#dc3545';
      case 'moderator': return '#fd7e14';
      default: return '#6c757d';
    }
  };

  if (!stats) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ color: '#6c757d' }}>Loading statistics...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{
        margin: '0 0 32px 0',
        fontSize: '24px',
        fontWeight: '600',
        color: '#212529'
      }}>
        User Statistics
      </h2>

      <div style={{
        display: 'grid',
        gap: '24px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        marginBottom: '32px'
      }}>
        <div style={{
          backgroundColor: '#e7f3ff',
          borderRadius: '8px',
          padding: '24px',
          border: '1px solid #b3d7ff',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '36px',
            fontWeight: '700',
            color: '#0066cc',
            marginBottom: '8px'
          }}>
            {stats.totalUsers}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#495057',
            fontWeight: '500'
          }}>
            Total Users
          </div>
        </div>

        <div style={{
          backgroundColor: '#e8f5e8',
          borderRadius: '8px',
          padding: '24px',
          border: '1px solid #b3e5b3',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '36px',
            fontWeight: '700',
            color: '#28a745',
            marginBottom: '8px'
          }}>
            {stats.recentUsers}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#495057',
            fontWeight: '500'
          }}>
            New Users (7 days)
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        padding: '24px',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '18px',
          fontWeight: '600',
          color: '#212529'
        }}>
          Role Distribution
        </h3>

        <div style={{ display: 'grid', gap: '16px' }}>
          {stats.roleDistribution.map((roleData) => (
            <div key={roleData._id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: getRoleColor(roleData._id)
                }}></div>
                <span style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#212529',
                  textTransform: 'capitalize'
                }}>
                  {roleData._id}
                </span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: getRoleColor(roleData._id)
                }}>
                  {roleData.count} users
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6c757d'
                }}>
                  {stats.totalUsers > 0
                    ? `${Math.round((roleData.count / stats.totalUsers) * 100)}%`
                    : '0%'
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserStats;