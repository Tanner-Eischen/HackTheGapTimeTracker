/**
 * QuickEntryButton Component
 * 
 * A floating action button positioned in the bottom left corner that provides
 * quick access to time entry functionality. This button appears on all pages
 * to allow users to quickly log time without navigating away from their current context.
 * 
 * Features:
 * - Fixed positioning in bottom left corner
 * - Responsive design with proper spacing
 * - Accessible with proper ARIA labels
 * - Smooth hover animations
 * - Integration with routing for time tracking
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './QuickEntryButton.css';

function QuickEntryButton({ className = '', ...props }) {
    const navigate = useNavigate();

    /**
     * Handles navigation to the time tracking page
     */
    const handleQuickEntryClick = () => {
        navigate('/clock');
    };

    return (
        <button
            onClick={handleQuickEntryClick}
            type="button"
            className={`quick-entry-floating ${className}`}
            aria-label="Quick time entry - Click to start tracking time"
            title="Quick Time Entry"
            id="btn-quick-add"
            {...props}
        >
            <div className="quick-entry-icon">
                <i className="bi bi-plus-lg"></i>
            </div>
            <div className="quick-entry-text">
                <div className="quick-entry-label">Quick Entry</div>
                <div className="quick-entry-sublabel">Track Time</div>
            </div>
        </button>
    );
}

export default QuickEntryButton;