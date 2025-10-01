/**
 * Consistent Badge component for status indicators
 * Standardizes status colors across the application
 */
import React from 'react';

function Badge({ 
  children, 
  variant = 'secondary', 
  size = 'default',
  className = '',
  ...props 
}) {
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'fs-6';
      case 'lg':
        return 'fs-5';
      default:
        return '';
    }
  };

  return (
    <span 
      className={`badge bg-${variant} ${getSizeClass()} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

// Status-specific badge variants
function StatusBadge({ status, ...props }) {
  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'danger';
      case 'active':
        return 'info';
      default:
        return 'secondary';
    }
  };

  return (
    <Badge variant={getStatusVariant(status)} {...props}>
      {status || 'Unknown'}
    </Badge>
  );
}

export { Badge, StatusBadge };