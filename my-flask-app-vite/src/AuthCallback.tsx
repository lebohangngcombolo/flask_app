// src/AuthCallback.tsx
import { useEffect } from 'react';

const AuthCallback = () => {
  useEffect(() => {
    // Listen for token from Flask
    window.addEventListener('message', (event) => {
      if (event.data.token) {
        localStorage.setItem('token', event.data.token); // Save JWT
        window.location.href = '/dashboard'; // Redirect to app
      }
    });
  }, []);

  return <p>Logging you in with Google...</p>;
};

export default AuthCallback;
