import React from "react";
import { useState } from "react";
import { Link } from 'react-router-dom';
import axios from 'axios'
import { useNavigate } from "react-router-dom"
import { Card, CardBody, CardTitle } from './components/ui/Card';
import Button from './components/ui/Button';
import { Badge } from './components/ui/Badge';

function Signup() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        try {
            const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
            const { data } = await axios.post(`${API_BASE}/register`, {
                name,
                email,
                password,
                role: 'employee', // All new registrations are employees
            });

            if (data.status === 'Success') {
                alert('Account created successfully! Please login with your credentials.');
                navigate('/login');
            } else {
                setErrors({ general: data.message || 'Registration failed. Please try again.' });
            }
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'Registration failed. Please try again.';
            setErrors({ general: msg });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center py-4">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-11 col-sm-8 col-md-6 col-lg-5 col-xl-4">
                        <Card className="shadow-lg border-0">
                            {/* Header */}
                            <div className="bg-primary text-white text-center py-4 rounded-top">
                                <div className="mb-2">
                                    <i className="bi bi-person-plus-fill fs-1"></i>
                                </div>
                                <CardTitle className="h3 mb-1 text-white">Hack the Gap</CardTitle>
                                <p className="mb-0 opacity-75">Create Your Account</p>
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
                                    {/* Name Field */}
                                    <div className="mb-3">
                                        <label htmlFor="name" className="form-label fw-medium text-dark">
                                            <i className="bi bi-person me-2 text-muted"></i>
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control form-control-lg border-2 ${errors.name ? 'border-danger' : 'border-light'}`}
                                            id="name"
                                            placeholder="Enter your full name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                        {errors.name && (
                                            <div className="text-danger small mt-1">
                                                <i className="bi bi-exclamation-circle me-1"></i>
                                                {errors.name}
                                            </div>
                                        )}
                                    </div>

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
                                            placeholder="Create a password"
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

                                    {/* Account Type Information */}
                                    <div className="mb-4">
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-info-circle text-primary me-2"></i>
                                            <p className="mb-0 text-muted small">
                                                You are registering as an employee. Supervisor accounts are created by system administrators.
                                            </p>
                                        </div>
                                        <div className="mt-2">
                                            <Badge variant="info" size="sm">
                                                👤 Employee Account
                                            </Badge>
                                        </div>
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
                                            {isLoading ? 'Creating account...' : 'Create Account'}
                                        </Button>
                                    </div>
                                </form>
                                
                                {/* Login Link */}
                                <div className="text-center pt-3 border-top border-light">
                                    <p className="mb-2 text-muted small">Already have an account?</p>
                                    <Link to="/login" className="text-decoration-none">
                                        <Button variant="outline-primary" className="fw-medium">
                                            <i className="bi bi-box-arrow-in-right me-2"></i>
                                            Login
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

export default Signup;
