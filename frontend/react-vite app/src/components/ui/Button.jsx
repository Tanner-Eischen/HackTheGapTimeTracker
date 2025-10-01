/**
 * Enhanced Button component with consistent styling and variants
 * Reduces repetitive Bootstrap button classes
 */
import React from 'react';

function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  outline = false,
  loading = false,
  disabled = false,
  className = '',
  as: Component = 'button',
  ...props 
}) {
  const getVariantClass = () => {
    const prefix = outline ? 'btn-outline' : 'btn';
    return `${prefix}-${variant}`;
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'btn-sm';
      case 'lg':
        return 'btn-lg';
      default:
        return '';
    }
  };

  return (
    <Component
      className={`btn ${getVariantClass()} ${getSizeClass()} fw-medium ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
      )}
      {children}
    </Component>
  );
}

export default Button;