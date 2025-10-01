/**
 * Onboarding Steps Configuration
 * Defines guided tour steps for different user roles
 * 
 * Each step contains:
 * - target: CSS selector for the element to highlight
 * - content: Descriptive text explaining the feature
 * - title: Optional title for the step
 * - placement: Preferred tooltip placement (top, bottom, left, right)
 * - disableBeacon: Whether to disable the pulsing beacon
 *
 * Optional (now supported everywhere by the component):
 * - highlightSelector: CSS selector for a nested element to emphasize (falls back to target)
 */

/**
 * Employee onboarding steps
 */
const employeeSteps = [
    {
        target: '[data-tour="time-entry"]',
        content: 'Start by logging your time entries here. Click to add new time entries for your projects.',
        title: 'Time Entry',
        placement: 'bottom',
        disableBeacon: false
    },
    {
        target: '[data-tour="project-selector"]',
        content: 'Select the project you are working on from this dropdown.',
        title: 'Project Selection',
        placement: 'bottom',
        disableBeacon: false
    },
    {
        target: '[data-tour="time-tracker"]',
        content: 'Use the timer to track your work hours in real-time.',
        title: 'Time Tracker',
        placement: 'top',
        disableBeacon: false
    },
    {
        target: '[data-tour="submit-entry"]',
        content: 'Submit your time entries for supervisor approval.',
        title: 'Submit Entry',
        placement: 'top',
        disableBeacon: false
    }
];

/**
 * Supervisor onboarding steps
 */
const supervisorSteps = [
    {
        target: '[data-tour="team-overview"]',
        content: 'View and manage your team members from this dashboard.',
        title: 'Team Overview',
        placement: 'bottom',
        disableBeacon: false
    },
    {
        target: '[data-tour="pending-approvals"]',
        content: 'Review and approve time entries submitted by your team members.',
        title: 'Pending Approvals',
        placement: 'bottom',
        disableBeacon: false
    },
    {
        target: '[data-tour="team-reports"]',
        content: 'Generate reports to track your team\'s productivity and hours.',
        title: 'Team Reports',
        placement: 'top',
        disableBeacon: false
    },
    {
        target: '[data-tour="add-team-member"]',
        content: 'Add new team members to your supervision.',
        title: 'Add Team Member',
        placement: 'left',
        disableBeacon: false
    }
];

/**
 * Role switcher
 */
export function getStepsForRole(role) {
    switch (role) {
        case 'employee':
            return employeeSteps;
        case 'supervisor':
        case 'superadmin':
            return supervisorSteps;
        default:
            return employeeSteps;
    }
}

/**
 * Get tour configuration options
 * (Unified z-index layering, overlay strength, spotlight halo)
 */
export function getTourConfig(role) {
    return {
        continuous: true,
        run: true,
        scrollToFirstStep: true,
        showProgress: true,
        showSkipButton: true,
        styles: {
            spotlightRadius: 8, // used by Coachmarks spotlight border radius
            options: {
                primaryColor: '#0d6efd',
                textColor: '#212529',
                backgroundColor: '#ffffff',
                overlayColor: 'rgba(0, 0, 0, 0.6)',
                // Unified: cutout + white edge + drop shadow for 3D lift
                spotlightShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 0 2px #fff, 0 12px 30px rgba(0,0,0,0.35)',
                beaconSize: 36,
                zIndex: 13000
            },
            tooltip: {
                // you can keep any existing tooltip styling here
            },
            buttonNext: {
                // next button style tokens if any
            },
            buttonBack: {
                // back/skip style tokens if any
            }
        },
        locale: {
            back: 'Back',
            next: 'Next',
            last: 'Finish',
            skip: 'Skip Tour',
            step: 'Step'
        }
    };
}

/**
 * Validate that all targets exist in DOM (debug helper)
 */
export function validateStepTargets(steps) {
    const missingTargets = [];
    
    steps.forEach((step, index) => {
        if (step.target !== 'body' && !document.querySelector(step.target)) {
            missingTargets.push({
                stepIndex: index,
                target: step.target,
                title: step.title
            });
        }
    });
    
    return missingTargets;
}
