import React from 'react';

const TabButton = ({ active, onClick, label }) => {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '12px 24px',
        backgroundColor: active ? '#adb5bd' : 'transparent',
        color: active ? 'black' : '#6c757d',
        border: 'none',
        borderRadius: '6px',
        fontSize: '16px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.15s ease'
      }}
      onMouseOver={(e) => {
        if (!active) {
          e.target.style.backgroundColor = '#f8f9fa';
          e.target.style.color = '#495057';
        }
      }}
      onMouseOut={(e) => {
        if (!active) {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = '#6c757d';
        }
      }}
    >
      {label}
    </button>
  );
};

export default TabButton;