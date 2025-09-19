const LoadingSpinner = ({ message = "Loading Dashboard..." }) => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f6fa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          display: 'inline-block',
          width: '60px',
          height: '60px',
          border: '6px solid #f3f3f3',
          borderTop: '6px solid #adb5bd',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '24px'
        }}></div>
        <h2 style={{
          margin: '0 0 8px 0',
          color: '#1e293b',
          fontSize: '24px',
          fontWeight: '600'
        }}>
          {message}
        </h2>
        <p style={{
          margin: 0,
          color: '#64748b',
          fontSize: '16px'
        }}>
          Please wait while we fetch your data
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;