import React from 'react';
import { useAuth } from '../hooks/useAuth';

const AuthDebug: React.FC = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const token = localStorage.getItem('token');
  const cachedUser = localStorage.getItem('user');

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Auth Debug:</h3>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>Has Token: {token ? 'Yes' : 'No'}</div>
      <div>Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
      <div>User: {user ? 'Yes' : 'No'}</div>
      <div>User Verified: {user?.is_verified ? 'Yes' : 'No'}</div>
      <div>Cached User: {cachedUser ? 'Yes' : 'No'}</div>
    </div>
  );
};

export default AuthDebug; 