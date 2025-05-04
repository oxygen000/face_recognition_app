import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
  adminOnly?: boolean;
}

/**
 * A route wrapper that protects access to child routes based on authentication and roles.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ adminOnly = false }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth(); // assuming isLoading exists

  // Optional: Show loading UI if auth status is still being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-700 text-lg">
        Loading...
      </div>
    );
  }

  // Redirect unauthenticated users to login, preserving the attempted path
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If route is admin-only but user is not admin, redirect to home
  if (adminOnly) {
    return <Navigate to="/" replace />;
  }

  // User is authorized; render child routes
  return <Outlet />;
};

export default ProtectedRoute;
