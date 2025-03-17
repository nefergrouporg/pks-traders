import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleProtectedRoute: React.FC<{ 
  allowedRoles: string[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { role } = useAuth();

  if (!role) {
    return <Navigate to="/login" replace />;
  }

 // In RoleProtectedRoute.tsx
return allowedRoles.includes(role) ? (
    <>{children}</>
  ) : (
    <Navigate to="/pos" replace />  // Redirect to allowed route instead of /unauthorized
  );
};

export default RoleProtectedRoute;