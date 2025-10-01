/**
 * ForgotPassword component for password reset functionality
 * Allows users to request a password reset link via email
 * Integrates with the existing UI design system
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './lib/api';
import { Card, CardBody, CardTitle } from './components/ui/Card';
import Button from './components/ui/Button';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [emailTouched, setEmailTouched] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Validates email format
     * @param {string} email - Email to validate
     * @returns {boolean} True if email is valid
     */
    const isValidEmail = (email) => {
        return /^\S+@\S+\.\S+$/.test(email);
    };

    /**
     * Handles email input change
     * @param {Event} e - Change event
     */
    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);
        
        if (emailTouched) {
            validateEmail(value);
        }
    };

    /**
     * Validates email and sets error message
     * @param {string} value - Email value to validate
     * @returns {boolean} True if email is valid
     */
    const validateEmail = (value) => {
        if (!value.trim()) {
            setEmailError('Email address is required');
            return false;
        } else if (!isValidEmail(value)) {
            setEmailError('Please enter a valid email address');
            return false;
        } else {
            setEmailError('');
            return true;
        }
    };

    /**
     * Handles email input blur
     */
    const handleEmailBlur = () => {
        setEmailTouched(true);
        validateEmail(email);
    };

    /**
     * Handle form submission for password reset request
     * @param {Event} e - Form submission event
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate email before submission
        if (!validateEmail(email)) {
            setEmailTouched(true);
            return;
        }
        
        setIsLoading(true);
        setMessage('');
        setError('');

        try {
            await api.post('/api/auth/forgot-password', {
                email: email
            }, { auth: false }); // No auth token needed for password reset

            setMessage('Password reset link has been sent to your email address.');
            setEmail('');
        } catch (err) {
            if (err.details && err.details.message) {
                setError(err.details.message);
            } else {
                setError(err.message || 'An error occurred. Please try again later.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center py-4">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-11 col-sm-10 col-md-8 col-lg-6 col-xl-5">
                        <Card className="shadow-lg border-0">
                            {/* Header */}
                            <div className="bg-primary text-white text-center py-4 rounded-top">
                                <div className="mb-2">
                                    <i className="bi bi-key fs-1"></i>
                                </div>
                                <CardTitle className="h3 mb-1 text-white">Forgot Password</CardTitle>
                                <p className="mb-0 opacity-75">Reset your account password</p>
                            </div>

                            <CardBody className="p-4">
                                {/* Success Message */}
                                {message && (
                                    <div className="alert alert-success border-0 bg-success bg-opacity-10 text-success" role="alert">
                                        <i className="bi bi-check-circle me-2"></i>
                                        {message}
                                    </div>
                                )}

                                {/* Error Message */}
                                {error && (
                                    <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger" role="alert">
                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                        {error}
                                    </div>
                                )}

                                {/* Instructions */}
                                <div className="mb-4">
                                    <p className="text-muted mb-0">
                                        Enter your email address and we'll send you a link to reset your password.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    {/* Email Field */}
                                    <div className="mb-4">
                                        <label htmlFor="email" className="form-label fw-medium text-dark">
                                            <i className="bi bi-envelope me-2 text-muted"></i>
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            className={`form-control form-control-lg border-2 ${emailTouched && emailError ? 'is-invalid border-danger' : 'border-light'}`}
                                            id="email"
                                            placeholder="Enter your email address"
                                            value={email}
                                            onChange={handleEmailChange}
                                            onBlur={handleEmailBlur}
                                            aria-invalid={emailTouched && emailError ? 'true' : 'false'}
                                            aria-describedby="email-error"
                                            required
                                        />
                                        {emailTouched && emailError && (
                                            <div id="email-error" className="invalid-feedback">
                                                {emailError}
                                            </div>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    <div className="d-grid mb-4">
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            size="lg"
                                            loading={isLoading}
                                            disabled={isLoading || !email}
                                            className="fw-medium"
                                        >
                                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                                        </Button>
                                    </div>
                                </form>

                                {/* Back to Login Link */}
                                <div className="text-center pt-3 border-top border-light">
                                    <p className="mb-2 text-muted small">Remember your password?</p>
                                    <Link to="/login" className="text-decoration-none">
                                        <Button variant="outline-primary" className="fw-medium">
                                            <i className="bi bi-arrow-left me-2"></i>
                                            Back to Login
                                        </Button>
                                    </Link>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;