const ErrorMessage = ({ message }) => {
  if (!message) return null;

  return (
    <div style={{
      color: '#721c24',
      backgroundColor: '#f8d7da',
      border: '1px solid #f5c6cb',
      borderRadius: '6px',
      padding: '16px',
      marginBottom: '24px',
      fontSize: '14px',
      fontWeight: '500'
    }}>
      {message}
    </div>
  );
};

export default ErrorMessage;