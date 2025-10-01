/**
 * Reusable Card component with consistent styling
 * Replaces repetitive Bootstrap card patterns throughout the app
 */
import React from 'react';

function Card({ 
  children, 
  className = '', 
  variant = 'default',
  size = 'default',
  ...props 
}) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'border-primary bg-primary bg-opacity-10';
      case 'success':
        return 'border-success bg-success bg-opacity-10';
      case 'warning':
        return 'border-warning bg-warning bg-opacity-10';
      case 'danger':
        return 'border-danger bg-danger bg-opacity-10';
      case 'info':
        return 'border-info bg-info bg-opacity-10';
      default:
        return '';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'p-3';
      case 'lg':
        return 'p-4';
      default:
        return 'p-3';
    }
  };

  return (
    <div 
      className={`card shadow-sm border-0 ${getVariantClasses()} ${getSizeClasses()} ${className}`}
      style={{
        borderRadius: '8px',
        transition: 'all 0.2s ease-in-out'
      }}
      {...props}
    >
      {children}
    </div>
  );
}

function CardHeader({ children, className = '', ...props }) {
  return (
    <div 
      className={`card-header bg-light border-bottom pb-3 pt-3 ${className}`} 
      style={{
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px'
      }}
      {...props}
    >
      {children}
    </div>
  );
}

function CardBody({ children, className = '', ...props }) {
  return (
    <div 
      className={`card-body p-4 ${className}`} 
      style={{
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px'
      }}
      {...props}
    >
      {children}
    </div>
  );
}

function CardTitle({ children, className = '', size = 'h5', ...props }) {
  const Component = size;
  return (
    <Component className={`card-title mb-3 fw-bold ${className}`} {...props}>
      {children}
    </Component>
  );
}

function CardText({ children, className = '', muted = false, ...props }) {
  return (
    <p className={`card-text mb-3 ${muted ? 'text-muted' : 'text-dark'} ${className}`} {...props}>
      {children}
    </p>
  );
}

export { Card, CardHeader, CardBody, CardTitle, CardText };