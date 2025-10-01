/**
 * Onboarding Store Module
 * Manages user onboarding tour preferences with localStorage persistence
 * Provides simple read/write helpers for tracking tour completion status
 * 
 * This module is kept separate from AuthContext to avoid authentication churn
 * and provides a lightweight state management solution for onboarding preferences.
 */

const STORAGE_KEY = 'onboardingPrefs';
const MANUAL_TOUR_KEY = 'manualTourActive';

/**
 * Default onboarding preferences structure
 */
const DEFAULT_PREFERENCES = {
    hasSeenEmployeeTour: false,
    hasSeenSupervisorTour: false,
    lastTourDate: null,
    tourVersion: '1.0.0', // For future tour updates
    lastCompletedStep: {
        employee: 0,
        supervisor: 0
    },
    preferMiniTour: false
};

/**
 * Manual tour state management
 */
let manualTourState = {
    isActive: false,
    role: null,
    currentStep: 0,
    isMiniTour: false,
    listeners: []
};

/**
 * Subscribe to manual tour state changes
 * @param {Function} callback - Function to call when state changes
 * @returns {Function} Unsubscribe function
 */
export function subscribeToManualTour(callback) {
    manualTourState.listeners.push(callback);
    return () => {
        manualTourState.listeners = manualTourState.listeners.filter(l => l !== callback);
    };
}

/**
 * Start a manual tour
 * @param {string} role - Role for the tour ('employee' or 'supervisor')
 * @param {Object} options - Tour options
 * @param {boolean} options.mini - Whether to use mini tour (3 steps)
 * @param {boolean} options.resumeFromLastStep - Whether to resume from last completed step
 * @param {boolean} options.forceRestart - Whether to force restart the tour even if it's been seen before
 */
export function startManualTour(role, options = {}) {
    const { mini = false, resumeFromLastStep = true, forceRestart = true } = options;
    
    // Get last completed step for this role if resuming
    let startStep = 0;
    if (resumeFromLastStep) {
        const prefs = getOnboardingPrefs();
        const lastStep = prefs.lastCompletedStep?.[role] || 0;
        startStep = lastStep;
    }
    
    manualTourState.isActive = true;
    manualTourState.role = role;
    manualTourState.currentStep = startStep;
    manualTourState.isMiniTour = mini;
    
    // Update preferences
    const prefs = getOnboardingPrefs();
    
    // Reset the hasSeenTour flag when manually starting the tour if forceRestart is true
    if (forceRestart) {
        if (role === 'employee') {
            setOnboardingPrefs({ 
                preferMiniTour: mini,
                hasSeenEmployeeTour: false 
            });
        } else if (role === 'supervisor') {
            setOnboardingPrefs({ 
                preferMiniTour: mini,
                hasSeenSupervisorTour: false 
            });
        }
    } else if (prefs.preferMiniTour !== mini) {
        // Just update mini tour preference if not forcing restart
        setOnboardingPrefs({ preferMiniTour: mini });
    }
    
    manualTourState.listeners.forEach(callback => callback(manualTourState));
}

/**
 * Stop the manual tour
 */
export function stopManualTour() {
    manualTourState.isActive = false;
    manualTourState.role = null;
    manualTourState.listeners.forEach(callback => callback(manualTourState));
}

/**
 * Get current manual tour state
 * @returns {Object} Current manual tour state
 */
export function getManualTourState() {
    return { ...manualTourState };
}

/**
 * Get onboarding preferences from localStorage
 * @returns {Object} Onboarding preferences object
 */
export function getOnboardingPrefs() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return { ...DEFAULT_PREFERENCES };
        }
        
        const parsed = JSON.parse(raw);
        // Merge with defaults to handle missing properties in older versions
        return { ...DEFAULT_PREFERENCES, ...parsed };
    } catch (error) {
        console.warn('Failed to parse onboarding preferences from localStorage:', error);
        return { ...DEFAULT_PREFERENCES };
    }
}

/**
 * Set onboarding preferences in localStorage
 * @param {Object} preferences - New preferences to merge with existing ones
 */
export function setOnboardingPrefs(preferences) {
    try {
        const current = getOnboardingPrefs();
        const updated = { 
            ...current, 
            ...preferences,
            lastTourDate: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('Failed to save onboarding preferences to localStorage:', error);
    }
}

/**
 * Mark employee tour as completed
 */
export function markEmployeeTourCompleted() {
    setOnboardingPrefs({ hasSeenEmployeeTour: true });
}

/**
 * Mark supervisor tour as completed
 */
export function markSupervisorTourCompleted() {
    setOnboardingPrefs({ hasSeenSupervisorTour: true });
}

/**
 * Save the current step for a specific role
 * @param {string} role - User role ('employee' or 'supervisor')
 * @param {number} stepIndex - Current step index
 */
export function saveCurrentStep(role, stepIndex) {
    const prefs = getOnboardingPrefs();
    const lastCompletedStep = {
        ...prefs.lastCompletedStep,
        [role]: stepIndex
    };
    
    setOnboardingPrefs({ lastCompletedStep });
}

/**
 * Get the last completed step for a specific role
 * @param {string} role - User role ('employee' or 'supervisor')
 * @returns {number} Last completed step index
 */
export function getLastCompletedStep(role) {
    const prefs = getOnboardingPrefs();
    return prefs.lastCompletedStep?.[role] || 0;
}

/**
 * Set mini tour preference
 * @param {boolean} preferMini - Whether to prefer mini tour
 */
export function setMiniTourPreference(preferMini) {
    setOnboardingPrefs({ preferMiniTour: preferMini });
}

/**
 * Get mini tour preference
 * @returns {boolean} Whether mini tour is preferred
 */
export function getMiniTourPreference() {
    const prefs = getOnboardingPrefs();
    return prefs.preferMiniTour || false;
}

/**
 * Reset all onboarding preferences (useful for testing or re-onboarding)
 */
export function resetOnboardingPrefs() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to reset onboarding preferences:', error);
    }
}

/**
 * Check if user should see onboarding tour based on their role
 * @param {string} userRole - User's role ('employee', 'supervisor', 'superadmin')
 * @returns {boolean} Whether user should see the tour
 */
export function shouldShowOnboarding(userRole) {
    const prefs = getOnboardingPrefs();
    
    switch (userRole) {
        case 'employee':
            return !prefs.hasSeenEmployeeTour;
        case 'supervisor':
        case 'superadmin':
            return !prefs.hasSeenSupervisorTour;
        default:
            return false;
    }
}

/**
 * Get the appropriate tour type for a user role
 * @param {string} userRole - User's role ('employee', 'supervisor', 'superadmin')
 * @returns {string} Tour type ('employee' or 'supervisor')
 */
export function getTourTypeForRole(userRole) {
    switch (userRole) {
        case 'employee':
            return 'employee';
        case 'supervisor':
        case 'superadmin':
            return 'supervisor';
        default:
            return 'employee';
    }
}

/**
 * Optional: Future server sync function
 * This can be implemented later to sync preferences with the backend
 * @param {Object} preferences - Preferences to sync
 */
export async function syncPreferencesToServer(preferences) {
    try {
        // Future implementation for server sync will go here
        // when backend API is ready
        
        // Return success
        return true;
    } catch (error) {
        console.error('Error syncing preferences:', error);
        return false;
    }
}