// src/components/auth/GoogleAuthButton.tsx
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const GoogleAuthButton = () => {
  const handleSuccess = async (credentialResponse: any) => {
    const token = credentialResponse.credential;

    try {
      const response = await axios.post('http://127.0.0.1:5001/api/auth/google', {
        token: token,
      });

      const { access_token, user } = response.data;
      console.log('Google login success:', user);

      // Store token in localStorage or context
      localStorage.setItem('accessToken', access_token);

      // Redirect or update auth context
      window.location.href = '/dashboard'; // or use navigate()
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => console.error('Google login failed')}
      />
    </div>
  );
};

export default GoogleAuthButton;
