import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, userData } = useAuth();

  if (!user || (userData?.admin !== true && userData?.admin !== "true")) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;