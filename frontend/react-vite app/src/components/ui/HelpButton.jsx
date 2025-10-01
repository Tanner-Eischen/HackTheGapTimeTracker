/**
 * HelpButton component
 * 
 * A floating help button that appears on all pages to provide easy access to help and support.
 * Features:
 * - Fixed positioning at bottom-right of screen
 * - Responsive design that adapts to different screen sizes
 * - Smooth hover animations and transitions
 * - Accessible with proper ARIA labels
 * - Integrates with existing routing system
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import './HelpButton.css';

function HelpButton({ className = '', ...props }) {
  const navigate = useNavigate();

  /**
   * Handles navigation to the help page
   */
  const handleHelpClick = () => {
    navigate('/help');
  };

  return (
    <Button
      onClick={handleHelpClick}
      variant="primary"
      className={`help-button-floating ${className}`}
      aria-label="Need help? Click to access help and support"
      title="Need Help?"
      {...props}
    >
      <i className="bi bi-question-circle me-2"></i>
      Need Help?
    </Button>
  );
}

export default HelpButton;