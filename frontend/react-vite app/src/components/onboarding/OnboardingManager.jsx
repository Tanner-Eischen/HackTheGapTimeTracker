import React, { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { 
    shouldShowOnboarding, 
    getTourTypeForRole, 
    getOnboardingPrefs, 
    setOnboardingPrefs,
    subscribeToManualTour,
    stopManualTour,
    getManualTourState,
    saveCurrentStep,
    getLastCompletedStep,
    getMiniTourPreference
} from '../../store/useOnboardingStore';
import OnboardingCoachmarks from './OnboardingCoachmarks';

/**
 * OnboardingManager Component
 * 
 * Manages the global onboarding tour state and renders the OnboardingCoachmarks
 * component when appropriate. This component is rendered at the App level to
 * ensure the tutorial persists across navigation.
 * 
 * Features:
 * - Automatic onboarding for new users based on role
 * - Manual tour triggering from Help page
 * - Global ESC key handler for closing tours
 * - Persistent state across navigation
 */
function OnboardingManager() {
    const { user, isAuthLoaded } = useAuth();
    const [onboardingOpen, setOnboardingOpen] = useState(false);
    const [tourRole, setTourRole] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [isMiniTour, setIsMiniTour] = useState(false);

    // Check for automatic onboarding when auth loads
    useEffect(() => {
        if (!isAuthLoaded || !user?.role) return;

        // Get mini tour preference
        const preferMiniTour = getMiniTourPreference();
        setIsMiniTour(preferMiniTour);

        // Check if user is marked as new (from login flow)
        const isNewUser = localStorage.getItem('isNewUser') === 'true';
        
        // Force show for new users or check normal onboarding conditions
        const shouldShow = isNewUser || shouldShowOnboarding(user.role);
        
        if (shouldShow) {
            const role = getTourTypeForRole(user.role);
            const lastStep = isNewUser ? 0 : getLastCompletedStep(role);
            
            setOnboardingOpen(true);
            setTourRole(role);
            setCurrentStep(lastStep);
            
            // Clear the new user flag after showing onboarding
            if (isNewUser) {
                localStorage.removeItem('isNewUser');
            }
        }
    }, [isAuthLoaded, user?.role]);

    // Subscribe to manual tour state changes
    useEffect(() => {
        const unsubscribe = subscribeToManualTour((manualState) => {
            if (manualState.isActive) {
                setOnboardingOpen(true);
                setTourRole(manualState.role);
                setCurrentStep(manualState.currentStep || 0);
                setIsMiniTour(manualState.isMiniTour || false);
            } else {
                setOnboardingOpen(false);
                setTourRole(null);
            }
        });

        // Check initial manual tour state
        const initialState = getManualTourState();
        if (initialState.isActive) {
            setOnboardingOpen(true);
            setTourRole(initialState.role);
            setCurrentStep(initialState.currentStep || 0);
            setIsMiniTour(initialState.isMiniTour || false);
        }

        return unsubscribe;
    }, []);

    // Global ESC key handler
    useEffect(() => {
        function handleGlobalEscape(event) {
            if (event.key === 'Escape' && onboardingOpen) {
                handleOnboardingClose();
            }
        }

        document.addEventListener('keydown', handleGlobalEscape);
        return () => document.removeEventListener('keydown', handleGlobalEscape);
    }, [onboardingOpen]);

    /**
     * Handle onboarding tour close
     * Updates preferences and stops any manual tours
     */
    function handleOnboardingClose() {
        if (tourRole && user?.role) {
            // Update preferences based on tour type
            const prefKey = tourRole === 'employee' ? 'hasSeenEmployeeTour' : 'hasSeenSupervisorTour';
            setOnboardingPrefs({ [prefKey]: true });
            
            // Save current step for resuming later
            saveCurrentStep(tourRole, currentStep);
        }

        // Stop manual tour if active
        stopManualTour();
        
        setOnboardingOpen(false);
        setTourRole(null);
    }
    
    /**
     * Handle step change in the tour
     * @param {number} stepIndex - New step index
     */
    function handleStepChange(stepIndex) {
        setCurrentStep(stepIndex);
        
        // Save progress if we have a valid role
        if (tourRole) {
            saveCurrentStep(tourRole, stepIndex);
        }
    }

    // Don't render if no tour is active
    if (!onboardingOpen || !tourRole) {
        return null;
    }

    return (
        <OnboardingCoachmarks
            role={tourRole}
            open={onboardingOpen}
            onClose={handleOnboardingClose}
            mini={isMiniTour}
            initialStep={currentStep}
            onStepChange={handleStepChange}
        />
    );
}

export default OnboardingManager;