/**
 * Enhanced Modal component for displaying dialogs and confirmation prompts
 * Built on Bootstrap's modal classes with additional customization options
 * 
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Function to call when modal should close
 * @param {string|React.Component} title - Modal title (string or custom component)
 * @param {React.ReactNode} children - Modal body content
 * @param {React.ReactNode|React.Component} footer - Modal footer (content or custom component)
 * @param {string} size - Modal size ('sm', 'md', 'lg', 'xl')
 * @param {boolean} centered - Whether to center the modal vertically
 * @param {boolean} backdrop - Whether to show backdrop
 * @param {boolean} closeOnClickOutside - Whether clicking outside closes modal
 * @param {boolean} showCloseButton - Whether to show close button
 * @param {string} borderRadius - Custom border radius (CSS value)
 * @param {string} padding - Custom padding for modal body (CSS value)
 * @param {string} maxWidth - Custom max width (CSS value)
 * @param {React.Component} customHeader - Custom header component
 * @param {React.Component} customFooter - Custom footer component
 * @param {boolean} animated - Whether to show animations
 * @param {string} animationType - Animation type ('fade', 'slide', 'zoom')
 * @param {number} animationDuration - Animation duration in ms
 * @param {string} emphasizeSelector - CSS selector for element to emphasize
 * @param {boolean} emphasizeFeature - Whether to emphasize a feature
 * @param {string} emphasizeColor - Color for emphasis highlight (CSS value)
 * @param {string} emphasizePosition - Position adjustment for modal relative to emphasized element ('auto', 'above', 'below', 'left', 'right')
 */
import React, { useEffect } from 'react';
import Button from './Button';

function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'md',
  centered = true,
  backdrop = true,
  closeOnClickOutside = true,
  showCloseButton = true,
  borderRadius = '0.375rem',
  padding = '1rem',
  maxWidth = null,
  customHeader = null,
  customFooter = null,
  animated = true,
  animationType = 'fade',
  animationDuration = 300,
  emphasizeSelector = null,
  emphasizeFeature = false,
  emphasizeColor = 'rgba(13, 110, 253, 0.5)', // Bootstrap primary with transparency
  emphasizePosition = 'auto'
}) {
  /**
   * Get animation styles based on animation type
   * @param {string} type - Animation type
   * @param {boolean} isVisible - Whether modal is visible
   * @returns {object} CSS styles for animation
   */
  function getAnimationStyles(type, isVisible) {
    const baseStyles = {
      transition: `all ${animationDuration}ms ease-in-out`,
    };

    switch (type) {
      case 'slide':
        return {
          ...baseStyles,
          transform: isVisible ? 'translateY(0)' : 'translateY(-50px)',
          opacity: isVisible ? 1 : 0,
        };
      case 'zoom':
        return {
          ...baseStyles,
          transform: isVisible ? 'scale(1)' : 'scale(0.8)',
          opacity: isVisible ? 1 : 0,
        };
      case 'fade':
      default:
        return {
          ...baseStyles,
          opacity: isVisible ? 1 : 0,
        };
    }
  }

  // State to track emphasized element position
  const [emphasizedElementPosition, setEmphasizedElementPosition] = React.useState(null);
  const [modalPosition, setModalPosition] = React.useState({});

  // Handle feature emphasis
  useEffect(() => {
    if (isOpen && emphasizeFeature && emphasizeSelector) {
      const targetElement = document.querySelector(emphasizeSelector);
      
      if (targetElement) {
        // Get element position
        const rect = targetElement.getBoundingClientRect();
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        
        // Save element position
        const position = {
          top: rect.top + scrollY,
          left: rect.left + scrollX,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom + scrollY,
          right: rect.right + scrollX
        };
        
        setEmphasizedElementPosition(position);
        
        // Add highlight to the element
        targetElement.style.transition = 'all 0.3s ease-in-out';
        targetElement.style.boxShadow = `0 0 0 4px ${emphasizeColor}`;
        targetElement.style.zIndex = '10001';
        
        // Scroll to the element if not in view
        const isInView = (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= window.innerHeight &&
          rect.right <= window.innerWidth
        );
        
        if (!isInView) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
        
        // Calculate modal position based on emphasizePosition
        const modalPositionStyles = {};
        
        if (emphasizePosition === 'auto' || !emphasizePosition) {
          // Auto-position based on available space
          const viewportHeight = window.innerHeight;
          const viewportWidth = window.innerWidth;
          
          // Determine best position
          const spaceAbove = rect.top;
          const spaceBelow = viewportHeight - rect.bottom;
          const spaceLeft = rect.left;
          const spaceRight = viewportWidth - rect.right;
          
          const maxSpace = Math.max(spaceAbove, spaceBelow, spaceLeft, spaceRight);
          
          if (maxSpace === spaceBelow) {
            modalPositionStyles.marginTop = `${rect.bottom + 20}px`;
          } else if (maxSpace === spaceAbove) {
            modalPositionStyles.marginBottom = `${viewportHeight - rect.top + 20}px`;
          } else if (maxSpace === spaceRight) {
            modalPositionStyles.marginLeft = `${rect.right + 20}px`;
          } else if (maxSpace === spaceLeft) {
            modalPositionStyles.marginRight = `${viewportWidth - rect.left + 20}px`;
          }
        } else if (emphasizePosition === 'above') {
          modalPositionStyles.marginBottom = `${window.innerHeight - rect.top + 20}px`;
          modalPositionStyles.marginTop = 'auto';
        } else if (emphasizePosition === 'below') {
          modalPositionStyles.marginTop = `${rect.bottom + 20}px`;
          modalPositionStyles.marginBottom = 'auto';
        } else if (emphasizePosition === 'left') {
          modalPositionStyles.marginRight = `${window.innerWidth - rect.left + 20}px`;
          modalPositionStyles.marginLeft = 'auto';
        } else if (emphasizePosition === 'right') {
          modalPositionStyles.marginLeft = `${rect.right + 20}px`;
          modalPositionStyles.marginRight = 'auto';
        }
        
        setModalPosition(modalPositionStyles);
        
        return () => {
          // Remove highlight when modal closes
          targetElement.style.boxShadow = '';
          targetElement.style.zIndex = '';
        };
      }
    }
  }, [isOpen, emphasizeFeature, emphasizeSelector, emphasizeColor, emphasizePosition]);

  // Handle escape key press to close modal
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && isOpen && closeOnClickOutside) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Add class to body to prevent scrolling when modal is open
      document.body.classList.add('modal-open');
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      // Always remove class in cleanup to prevent memory leaks
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, onClose, closeOnClickOutside]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnClickOutside) {
      onClose();
    }
  };

  // Get size class
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'modal-sm';
      case 'lg':
        return 'modal-lg';
      case 'xl':
        return 'modal-xl';
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  // Custom styles for modal content
  const modalContentStyles = {
    borderRadius,
    ...(maxWidth && { maxWidth }),
    ...(animated && getAnimationStyles(animationType, isOpen)),
  };

  const modalBodyStyles = {
    padding,
  };

  // Add spotlight effect if emphasizing a feature
  const renderSpotlight = () => {
    if (emphasizeFeature && emphasizedElementPosition) {
      return (
        <div 
          className="position-absolute" 
          style={{
            top: emphasizedElementPosition.top,
            left: emphasizedElementPosition.left,
            width: emphasizedElementPosition.width,
            height: emphasizedElementPosition.height,
            backgroundColor: 'transparent',
            boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.7)`,
            border: `2px solid ${emphasizeColor}`,
            borderRadius: '4px',
            zIndex: 10001,
            pointerEvents: 'none',
            animation: 'spotlight-pulse 2s infinite'
          }}
        />
      );
    }
    return null;
  };

  return (
    <div 
      className="modal fade show" 
      style={{ 
        display: 'block', 
        backgroundColor: backdrop ? 'rgba(0,0,0,0.5)' : 'transparent' 
      }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      {/* Spotlight effect for emphasized feature */}
      {renderSpotlight()}
      
      {/* Add animation for spotlight pulse effect */}
      {emphasizeFeature && emphasizedElementPosition && (
        <style>
          {`
          @keyframes spotlight-pulse {
            0% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 0 0 ${emphasizeColor}; }
            70% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 0 10px rgba(13, 110, 253, 0); }
            100% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 0 0 rgba(13, 110, 253, 0); }
          }
          `}
        </style>
      )}
      
      <div 
        className={`modal-dialog ${getSizeClass()} ${centered && !emphasizeFeature ? 'modal-dialog-centered' : ''}`}
        role="document"
        style={emphasizeFeature ? modalPosition : {}}
      >
        <div className="modal-content shadow" style={modalContentStyles}>
          {/* Custom Header or Default Header */}
          {customHeader ? (
            customHeader
          ) : (
            <div className="modal-header">
              {typeof title === 'string' ? (
                <h5 className="modal-title">{title}</h5>
              ) : (
                title
              )}
              {showCloseButton && (
                <button 
                  type="button" 
                  className="btn-close" 
                  aria-label="Close"
                  onClick={onClose}
                ></button>
              )}
            </div>
          )}
          
          {/* Modal Body */}
          <div className="modal-body" style={modalBodyStyles}>
            {children}
          </div>
          
          {/* Custom Footer or Default Footer */}
          {customFooter ? (
            customFooter
          ) : (
            footer && (
              <div className="modal-footer">
                {footer}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default Modal;