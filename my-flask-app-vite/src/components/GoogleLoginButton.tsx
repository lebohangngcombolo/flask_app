// import { GoogleLogin } from '@react-oauth/google';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import { toast } from 'react-toastify';
// import { GoogleOAuthProvider } from '@react-oauth/google';

// const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// const GoogleLoginButton = () => {
//   const navigate = useNavigate();

//   const handleLogin = async (credentialResponse: any) => {
//     try {
//       const res = await axios.post("http://localhost:5001/api/auth/google", {
//         token: credentialResponse.credential,
//       });

//       if (res.data.token) {
//         localStorage.setItem("jwt", res.data.token);
//         toast.success("Login successful!");
//         navigate("/profile");
//       }
//     } catch (err) {
//       toast.error("Login failed. Try again.");
//     }
//   };

//   return (
//     <GoogleOAuthProvider clientId={clientId}>
//       <GoogleLogin
//         onSuccess={handleLogin}
//         onError={() => toast.error("Google login error")}
//       />
//     </GoogleOAuthProvider>
//   );
// };

// export default GoogleLoginButton;

// For now, export an empty component:
const GoogleLoginButton = () => <></>;
export default GoogleLoginButton;
