import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  allowedRoles = [] 
}) => {
  const { currentUser, userRole, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth state is being determined
  if (loading) {
    return <LoadingSpinner fullScreen message="Verifying access..." />;
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for specific required role
  if (requiredRole && userRole !== requiredRole) {
    // Redirect to role-specific dashboard
    switch (userRole) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'port':
        return <Navigate to="/port-dashboard" replace />;
      case 'hod':
        return <Navigate to="/hod-dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  // Check for allowed roles if specified
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole || '')) {
    // Redirect to default dashboard based on role
    switch (userRole) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'port':
        return <Navigate to="/port-dashboard" replace />;
      case 'hod':
        return <Navigate to="/hod-dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;