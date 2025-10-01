/**
 * DashboardButton component
 * Standardized button for navigating back to the dashboard
 * Ensures consistent styling and behavior across the application
 */
import React from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import { useAuth } from '../../AuthContext';

function DashboardButton({ className = '', ...props }) {
  const { user } = useAuth();
  
  // Determine the correct dashboard path based on user role
  let dashboardPath = '/dashboard';
  
  if (user?.role === 'superadmin') {
    dashboardPath = '/superadmin/dashboard';
  } else if (user?.role === 'supervisor') {
    dashboardPath = '/supervisor/dashboard';
  }
  
  return (
    <Button
      as={Link}
      to={dashboardPath}
      variant="outline-secondary"
      className={`d-flex align-items-center ${className}`}
      {...props}
    >
      <i className="bi bi-arrow-left me-2"></i>
      Back to Dashboard
    </Button>
  );
}

export default DashboardButton;