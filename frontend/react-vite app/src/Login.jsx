import React from 'react'
import { useState } from "react";
import { Link } from 'react-router-dom';
import axios from 'axios'
import { useNavigate } from "react-router-dom"
import { useAuth } from './AuthContext';
import { Card, CardBody, CardTitle } from './components/ui/Card';
import Button from './components/ui/Button';

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrors({})

        try {
            const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
            const result = await axios.post(`${API_BASE}/login`, { email, password })

            if (result.data.status === "Success") {
                // Store user data in context
                const userData = {
                    id: result.data.id,
                    name: result.data.name,
                    email: result.data.email,
                    role: result.data.role
                };
                login(userData, result.data.token);
                
                // Check if this is a first login (new user)
                if (result.data.isFirstLogin) {
                    // Set flag for onboarding to detect
                    localStorage.setItem('isNewUser', 'true');
                }

                // Redirect based on role
                if (result.data.role === 'supervisor') {
                    navigate('/supervisor/dashboard')
                } else if (result.data.role === 'superadmin') {
                    navigate('/superadmin/dashboard')
                } else {
                    navigate('/dashboard')
                }
            } else {
                setErrors({ general: result.data })
            }
        } catch (err) {
            if (err.response) {
                // Server responded with a status outside 2xx
                console.error("Server error response:", err.response.data);
                setErrors({ general: err.response.data.message || "Login failed." });
            } else if (err.request) {
                // Request was made but no response received
                console.error("No response from server:", err.request);
                setErrors({ general: "No response from server." });
            } else {
                // Something else happened
                console.error("Error setting up request:", err.message);
                setErrors({ general: err.message });
            }
            setIsLoading(false);
            setErrors({ general: "Login failed. Please try again." })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center py-4">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-11 col-sm-10 col-md-8 col-lg-6 col-xl-5">
                        <Card className="shadow-lg border-0">
                            {/* Header */}
                            <div className="bg-primary text-white text-center py-4 rounded-top">
                                <div className="mb-2">
                                    <i className="bi bi-clock-history fs-1"></i>
                                </div>
                                <CardTitle className="h3 mb-1 text-white">Hack the Gap</CardTitle>
                                <p className="mb-0 opacity-75">Time Tracker Login</p>
                            </div>

                            <CardBody className="p-4">
                                {/* Error Alert */}
                                {errors.general && (
                                    <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger" role="alert">
                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                        {errors.general}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    {/* Email Field */}
                                    <div className="mb-3">
                                        <label htmlFor="email" className="form-label fw-medium text-dark">
                                            <i className="bi bi-envelope me-2 text-muted"></i>
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            className={`form-control form-control-lg border-2 ${errors.email ? 'border-danger' : 'border-light'}`}
                                            id="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                        {errors.email && (
                                            <div className="text-danger small mt-1">
                                                <i className="bi bi-exclamation-circle me-1"></i>
                                                {errors.email}
                                            </div>
                                        )}
                                    </div>

                                    {/* Password Field */}
                                    <div className="mb-3">
                                        <label htmlFor="password" className="form-label fw-medium text-dark">
                                            <i className="bi bi-lock me-2 text-muted"></i>
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            className={`form-control form-control-lg border-2 ${errors.password ? 'border-danger' : 'border-light'}`}
                                            id="password"
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        {errors.password && (
                                            <div className="text-danger small mt-1">
                                                <i className="bi bi-exclamation-circle me-1"></i>
                                                {errors.password}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Forgot Password Link */}
                                    <div className="mb-4 text-end">
                                        <Link to="/forgot-password" className="text-decoration-none small text-primary">
                                            <i className="bi bi-key me-1"></i>
                                            Forgot Password?
                                        </Link>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="d-grid mb-4">
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            size="lg"
                                            loading={isLoading}
                                            disabled={isLoading}
                                            className="fw-medium"
                                        >
                                            {isLoading ? 'Logging in...' : 'Login'}
                                        </Button>
                                    </div>
                                </form>

                                {/* Sign Up Link */}
                                <div className="text-center pt-3 border-top border-light">
                                    <p className="mb-2 text-muted small">Don't have an account?</p>
                                    <Link to="/register" className="text-decoration-none">
                                        <Button variant="outline-primary" className="fw-medium">
                                            <i className="bi bi-person-plus me-2"></i>
                                            Create Account
                                        </Button>
                                    </Link>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login;
