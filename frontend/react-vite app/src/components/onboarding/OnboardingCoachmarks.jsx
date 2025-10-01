/**
 * OnboardingCoachmarks Component
 * Provides guided tour functionality with spotlight tooltips
 * Built with accessibility features mirroring Modal.jsx patterns
 * 
 * @param {string} role - User role ('employee', 'supervisor', 'superadmin')
 * @param {boolean} open - Whether the tour is active
 * @param {function} onClose - Function to call when tour should close
 * @param {function} onComplete - Function to call when tour is completed
 * @param {Array} customSteps - Optional custom steps array (overrides role-based steps)
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getStepsForRole, getTourConfig, validateStepTargets } from '../../utils/onboardingSteps';
import Button from '../ui/Button';

function OnboardingCoachmarks({ 
    role = 'employee', 
    open = false, 
    onClose, 
    onComplete,
    customSteps = null 
}) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [steps, setSteps] = useState([]);
    const [tourConfig, setTourConfig] = useState({});
    const [isVisible, setIsVisible] = useState(false);
    const [targetElement, setTargetElement] = useState(null);
    const [highlightElement, setHighlightElement] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const [spotlightPosition, setSpotlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
    const overlayRef = useRef(null);
    const tooltipRef = useRef(null);

    useEffect(() => {
        if (open) {
            const tourSteps = customSteps || getStepsForRole(role);
            const config = getTourConfig(role);
            
            // Validate that step targets exist
            const missingTargets = validateStepTargets(tourSteps);
            if (missingTargets.length > 0) {
                console.warn('OnboardingCoachmarks: Missing step targets:', missingTargets);
            }
            
            setSteps(tourSteps);
            setTourConfig(config);
            setCurrentStepIndex(0);
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [open, role, customSteps]);

    const calculatePositions = useCallback((el, placement = 'bottom') => {
        if (!el) return;
        const tooltipEl = tooltipRef.current;
        if (!tooltipEl) return;

        const targetRect = el.getBoundingClientRect();
        const tooltipRect = tooltipEl.getBoundingClientRect();
        const scrollX = window.scrollX || document.documentElement.scrollLeft;
        const scrollY = window.scrollY || document.documentElement.scrollTop;

        // Spotlight rectangle (with padding for halo)
        const spotlightPos = {
            top: targetRect.top + scrollY - 8,
            left: targetRect.left + scrollX - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16
        };

        // Tooltip position with offset
        let tooltipPos = { top: 0, left: 0 };
        const offset = 20;

        switch (placement) {
            case 'top':
                tooltipPos = {
                    top: targetRect.top + scrollY - tooltipRect.height - offset,
                    left: targetRect.left + scrollX + (targetRect.width - tooltipRect.width) / 2
                };
                break;
            case 'left':
                tooltipPos = {
                    top: targetRect.top + scrollY + (targetRect.height - tooltipRect.height) / 2,
                    left: targetRect.left + scrollX - tooltipRect.width - offset
                };
                break;
            case 'right':
                tooltipPos = {
                    top: targetRect.top + scrollY + (targetRect.height - tooltipRect.height) / 2,
                    left: targetRect.right + scrollX + offset
                };
                break;
            case 'bottom':
            default:
                tooltipPos = {
                    top: targetRect.bottom + scrollY + offset,
                    left: targetRect.left + scrollX + (targetRect.width - tooltipRect.width) / 2
                };
                break;
        }

        setSpotlightPosition(spotlightPos);
        setTooltipPosition(tooltipPos);
    }, []);

    // Sync target/highlight when the current step changes
    useEffect(() => {
        if (!isVisible || steps.length === 0) return;
        const currentStep = steps[currentStepIndex];
        if (!currentStep) return;

        const target = document.querySelector(currentStep.target);
        const hi = currentStep.highlightSelector ? document.querySelector(currentStep.highlightSelector) : null;
        setTargetElement(target);
        setHighlightElement(hi || target);
        calculatePositions(hi || target, currentStep.placement);
    }, [currentStepIndex, steps, isVisible, calculatePositions]);

    // Recalculate on window resize
    useEffect(() => {
        const handleResize = () => {
            if (isVisible && (highlightElement || targetElement)) {
                calculatePositions(highlightElement || targetElement, steps[currentStepIndex]?.placement);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [isVisible, targetElement, highlightElement, currentStepIndex, steps, calculatePositions]);

    // Recalculate on scroll (debounced by browser’s event coalescing; capture true to track inner containers)
    useEffect(() => {
        const handleScroll = () => {
            if (isVisible && (highlightElement || targetElement)) {
                calculatePositions(highlightElement || targetElement, steps[currentStepIndex]?.placement);
            }
        };
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isVisible, targetElement, highlightElement, currentStepIndex, steps, calculatePositions]);

    // 3D lift effect on the highlighted element
    useEffect(() => {
        if (!highlightElement) return;
        const prev = {
            transform: highlightElement.style.transform,
            filter: highlightElement.style.filter
        };
        highlightElement.style.transform = 'translateZ(0) scale(1.02)';
        highlightElement.style.filter = 'drop-shadow(0 8px 20px rgba(0,0,0,.30))';
        return () => {
            highlightElement.style.transform = prev.transform;
            highlightElement.style.filter = prev.filter;
        };
    }, [highlightElement, currentStepIndex]);

    const handleNext = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(i => i + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(i => i - 1);
        }
    };

    const handleSkip = () => {
        setIsVisible(false);
        onClose?.();
    };

    const handleComplete = () => {
        setIsVisible(false);
        onComplete?.();
        onClose?.();
    };

    const handleKeyDown = (e) => {
        if (!isVisible) return;
        switch (e.key) {
            case 'ArrowRight':
            case 'Tab':
                e.preventDefault();
                handleNext();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                handlePrev();
                break;
            case 'Escape':
                e.preventDefault();
                handleSkip();
                break;
            default:
                break;
        }
    };

    useEffect(() => {
        if (!isVisible) return;
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isVisible, currentStepIndex, steps]);

    if (!isVisible || steps.length === 0) return null;

    const currentStep = steps[currentStepIndex];
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === steps.length - 1;

    return (
        <>
            {/* Full-screen overlay (modal-like) */}
            <div
                ref={overlayRef}
                className="position-fixed w-100 h-100"
                style={{
                    top: 0,
                    left: 0,
                    backgroundColor: tourConfig.styles?.options?.overlayColor || 'rgba(0, 0, 0, 0.6)',
                    zIndex: tourConfig.styles?.options?.zIndex || 13000,
                    pointerEvents: 'none'
                }}
                role="presentation"
            />

            {/* Spotlight */}
            {(highlightElement || targetElement) && currentStep.target !== 'body' && (
                <div
                    className="position-absolute"
                    style={{
                        top: spotlightPosition.top,
                        left: spotlightPosition.left,
                        width: spotlightPosition.width,
                        height: spotlightPosition.height,
                        backgroundColor: 'transparent',
                        boxShadow: tourConfig.styles?.options?.spotlightShadow || '0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 0 2px #fff, 0 12px 30px rgba(0,0,0,0.35)',
                        borderRadius: `${tourConfig.styles?.spotlightRadius || 8}px`,
                        zIndex: (tourConfig.styles?.options?.zIndex || 13000) + 1,
                        pointerEvents: 'none',
                        transition: 'all 0.3s ease'
                    }}
                    data-testid="onboarding-spotlight"
                />
            )}

            {/* Tooltip */}
            <div
                ref={tooltipRef}
                className="position-absolute bg-white rounded shadow-lg"
                style={{
                    top: tooltipPosition.top,
                    left: tooltipPosition.left,
                    maxWidth: '320px',
                    minWidth: '280px',
                    zIndex: (tourConfig.styles?.options?.zIndex || 13000) + 2,
                    ...(tourConfig.styles?.tooltip) // FIXED: spread with parentheses
                }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="tour-step-title"
                aria-describedby="tour-step-content"
                tabIndex={-1}
            >
                {/* Header */}
                <div className="px-3 py-2 border-bottom d-flex align-items-center justify-content-between">
                    <h6 id="tour-step-title" className="m-0">
                        {currentStep.title || tourConfig.locale?.step || `Step ${currentStepIndex + 1}`}
                    </h6>
                    <small className="text-muted">
                        {currentStepIndex + 1} / {steps.length}
                    </small>
                </div>

                {/* Body */}
                <div className="p-3" id="tour-step-content">
                    <p className="mb-2">{currentStep.content}</p>
                </div>

                {/* Footer */}
                <div className="px-3 pb-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex gap-2">
                            <Button
                                variant="light"
                                size="sm"
                                onClick={handleSkip}
                                style={tourConfig.styles?.buttonBack}
                            >
                                {tourConfig.locale?.skip || 'Skip Tour'}
                            </Button>
                        </div>

                        <div className="d-flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handlePrev}
                                disabled={isFirstStep}
                                style={tourConfig.styles?.buttonBack}
                            >
                                {tourConfig.locale?.back || 'Back'}
                            </Button>

                            <Button
                                variant="primary"
                                size="sm"
                                onClick={isLastStep ? handleComplete : handleNext}
                                style={tourConfig.styles?.buttonNext}
                            >
                                {isLastStep 
                                    ? (tourConfig.locale?.last || 'Finish')
                                    : (tourConfig.locale?.next || 'Next')
                                }
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Keyboard shortcuts hint */}
                <div className="px-3 pb-2 border-top pt-2">
                    <small className="text-muted d-block">
                        Use <kbd>←</kbd><kbd>→</kbd> or <kbd>Tab</kbd> to navigate, <kbd>Esc</kbd> to close
                    </small>
                </div>
            </div>
        </>
    );
}

export default OnboardingCoachmarks;
