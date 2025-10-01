import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * ProtectedRoute component for role-based access control
 * Protects routes based on user authentication and role requirements
 * Redirects unauthenticated users to login page
 * Redirects unauthorized users to appropriate dashboard
 */

/**
 * ProtectedRoute component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string|string[]} props.requiredRole - Required role(s) to access the route
 * @returns {JSX.Element} Protected route component
 */
function ProtectedRoute({ children, requiredRole }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    // Show loading while checking authentication
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If no role requirement, just check authentication
    if (!requiredRole) {
        return children;
    }

    /**
     * Check if user has required role
     * @param {string} userRole - User's current role
     * @param {string|string[]} required - Required role(s)
     * @returns {boolean} Whether user has required role
     */
    function hasRequiredRole(userRole, required) {
        if (!userRole) return false;
        
        if (Array.isArray(required)) {
            return required.includes(userRole);
        }
        
        return userRole === required;
    }

    // Check if user has required role
    if (!hasRequiredRole(user.role, requiredRole)) {
        // Redirect to appropriate dashboard based on user role
        const redirectPath = user.role === 'superadmin' ? '/superadmindashboard' :
                           user.role === 'supervisor' ? '/supervisor/dashboard' :
                           '/dashboard';
        
        return <Navigate to={redirectPath} replace />;
    }

    // User is authenticated and has required role
    return children;
}

export default ProtectedRoute;