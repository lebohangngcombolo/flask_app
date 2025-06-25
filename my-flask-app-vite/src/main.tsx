// import { GoogleOAuthProvider } from '@react-oauth/google'
// const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// If you had this:
// ReactDOM.createRoot(document.getElementById('root')!).render(
//   <GoogleOAuthProvider clientId={clientId}>
//     <App />
//   </GoogleOAuthProvider>
// )

// Replace with just:
ReactDOM.createRoot(document.getElementById('root')!).render(
      <App />
)
