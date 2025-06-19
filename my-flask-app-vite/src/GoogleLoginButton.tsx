import React from 'react';

const GoogleLoginButton = () => {
  const handleLogin = () => {
    // Redirect to Flask backend to begin Google OAuth flow
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <button
      onClick={handleLogin}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 20px',
        backgroundColor: '#ffffff',
        border: '1px solid #ddd',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'background-color 0.3s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f7f7f7')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
    >
      <img
        src="https://developers.google.com/identity/images/g-logo.png"
        alt="Google logo"
        style={{ height: '20px', marginRight: '10px' }}
      />
      Continue with Google
    </button>
  );
};

export default GoogleLoginButton;
