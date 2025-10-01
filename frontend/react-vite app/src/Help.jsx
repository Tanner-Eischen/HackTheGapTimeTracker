import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardBody, CardHeader, CardTitle } from './components/ui/Card';
import Button from './components/ui/Button';
import { Badge } from './components/ui/Badge';
import NotiComponent from './Notification';
import DashboardButton from './components/ui/DashboardButton';
import { useAuth } from './AuthContext';
import { getTourTypeForRole, startManualTour } from './store/useOnboardingStore';

function Help() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [expandedFAQ, setExpandedFAQ] = useState(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    async function handleFormSubmit(e) {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage("");

        try {
            const token = localStorage.getItem("token");
            const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
            await axios.post(`${API_BASE}/send-email`, {
                subject: `Help Request: ${title}`,
                text: description,
            },
            {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessage("Issue sent successfully!");
            setTitle("");
            setDescription("");
        } catch (err) {
            console.error(err);
            setMessage("Failed to send issue. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    /**
     * Handle starting the onboarding tour
     * Navigates to appropriate dashboard before starting tour
     */
    function handleStartTour() {
        if (!user) return;
        
        const tourType = getTourTypeForRole(user.role);
        if (tourType) {
            // Navigate to the appropriate dashboard based on user role
            let dashboardPath = '/dashboard';
            if (user.role === 'superadmin') {
                dashboardPath = '/superadmin/dashboard';
            } else if (user.role === 'supervisor') {
                dashboardPath = '/supervisor/dashboard';
            }
            
            // Navigate to dashboard first
            navigate(dashboardPath);
            
            // Start manual tour after navigation
            setTimeout(() => {
                startManualTour(tourType);
            }, 100);
        }
    }

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    /**
     * Toggle FAQ accordion item
     * @param {number} index - Index of the FAQ item to toggle
     */
    function toggleFAQ(index) {
        setExpandedFAQ(expandedFAQ === index ? null : index);
    }

    /**
     * Get FAQ questions based on user role
     * @param {string} role - User role ('employee', 'supervisor', 'superadmin')
     * @returns {Array} Array of FAQ objects with question and answer
     */
    function getFAQsForRole(role) {
        const commonFAQs = {
            employee: [
                {
                    question: "How do I track my time?",
                    answer: "Click the 'Start Timer' button on your dashboard to begin tracking time. You can also manually add time entries by clicking 'Add Time Entry' and filling in the details including project, task, and duration."
                },
                {
                    question: "How do I view my timesheet?",
                    answer: "Navigate to the 'Reports' section from your dashboard to view your personal timesheet. You can filter by date range and export your data as needed."
                },
                {
                    question: "How do I edit a time entry?",
                    answer: "Go to your Reports page, find the time entry you want to edit, and click the edit icon. You can modify the project, task, duration, or description. Note that entries may require supervisor approval after editing."
                },
                {
                    question: "What happens when I submit my timesheet?",
                    answer: "When you submit time entries, they are sent to your supervisor for approval. You'll receive notifications about the approval status, and approved entries will be reflected in your final timesheet."
                },
                {
                    question: "How do I request time off or report issues?",
                    answer: "Use the 'Report an Issue' form on this Help page to communicate with your supervisor about time off requests, technical issues, or other concerns. You can also email support directly."
                }
            ],
            supervisor: [
                {
                    question: "How do I manage my team's time entries?",
                    answer: "Access the 'Team Management' section to view all team members' time entries. You can approve or reject pending entries, view team reports, and monitor productivity across your team."
                },
                {
                    question: "How do I approve timesheet entries?",
                    answer: "Navigate to 'Team Management' where you'll see pending time entries requiring approval. Review each entry and click 'Approve' or 'Reject' with optional comments for your team members."
                },
                {
                    question: "How do I add employees to my team?",
                    answer: "In the 'Team Management' section, use the 'Add Team Member' feature. Enter the employee's email address (they must already have an account) to add them to your supervision."
                },
                {
                    question: "How do I generate team reports?",
                    answer: "Go to the 'Reports' section and select 'Team View' to see comprehensive reports for all your team members. You can filter by date ranges, specific employees, and export data for payroll or analysis."
                },
                {
                    question: "How do I create projects for my team?",
                    answer: "Access the 'Goals/Projects' section to create new projects and tasks. Assign these to team members so they can track time against specific work items and maintain organized project tracking."
                },
                {
                    question: "What notifications will I receive?",
                    answer: "You'll receive notifications for pending timesheet approvals, team member requests, project updates, and system alerts. Manage your notification preferences in your account settings."
                }
            ],
            superadmin: [
                {
                    question: "How do I manage supervisors and their teams?",
                    answer: "Use the 'Team Management' section to view all supervisors and their teams. You can reassign employees between supervisors, create new supervisor accounts, and monitor organization-wide activity."
                },
                {
                    question: "How do I create supervisor accounts?",
                    answer: "Navigate to 'Team Management' and use the 'Create Supervisor' feature. Enter the supervisor's details to create their account - they'll receive login credentials and can immediately start managing their assigned teams."
                },
                {
                    question: "How do I access organization-wide reports?",
                    answer: "The 'Reports' section provides comprehensive organization-wide analytics. Switch between supervisor views to see different teams, generate company-wide reports, and export data for executive analysis."
                },
                {
                    question: "How do I monitor system usage and performance?",
                    answer: "Access advanced analytics through the Reports section to monitor user activity, system performance, and organizational productivity metrics. Use these insights for strategic planning and resource allocation."
                },
                {
                    question: "How do I handle escalated issues?",
                    answer: "Review escalated issues from the Help requests submitted by employees and supervisors. You have full access to all team communications and can intervene in approval processes when necessary."
                },
                {
                    question: "How do I manage organizational projects?",
                    answer: "Create and oversee company-wide projects in the Goals/Projects section. You can assign projects across different supervisors and teams, monitor progress, and ensure alignment with business objectives."
                }
            ]
        };

        return commonFAQs[role] || commonFAQs.employee;
    }

    return (
        <div className="min-vh-100 bg-light py-4">
            <div className="container">
                {/* Header */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb mb-2">
                                        <li className="breadcrumb-item">
                                            <Link to="/dashboard" className="text-decoration-none text-primary">
                                                <i className="bi bi-speedometer2 me-1"></i>
                                                Dashboard
                                            </Link>
                                        </li>
                                        <li className="breadcrumb-item active text-muted" aria-current="page">
                                            Help & Support
                                        </li>
                                    </ol>
                                </nav>
                                <div className="d-flex align-items-center mb-2">
                                    <i className="bi bi-question-circle text-primary me-2 fs-3"></i>
                                    <h1 className="text-dark mb-0">Help & Support</h1>
                                </div>
                                <p className="text-muted mb-0">Get assistance and access tutorials</p>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <DashboardButton />
                                <Button 
                                    variant="danger" 
                                    onClick={handleLogout}
                                    className="d-flex align-items-center"
                                >
                                    <i className="bi bi-box-arrow-right me-2"></i>
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Message Display */}
                {message && (
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className={`alert alert-${message.includes('Failed') ? 'danger' : 'success'} d-flex align-items-center`} role="alert">
                                <i className={`bi ${message.includes('Failed') ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} me-2`}></i>
                                {message}
                            </div>
                        </div>
                    </div>
                )}

                <div className="row">
                    {/* Submit Issue Form */}
                    <div className="col-lg-8 mb-4">
                        <Card className="border-0 shadow-sm">
                            <CardHeader className="bg-light border-bottom">
                                <CardTitle className="mb-0 d-flex align-items-center">
                                    <i className="bi bi-bug text-primary me-2"></i>
                                    Report an Issue
                                </CardTitle>
                            </CardHeader>
                            <CardBody>
                                <form onSubmit={handleFormSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label fw-medium text-dark">
                                            <i className="bi bi-card-heading me-2 text-muted"></i>
                                            Issue Title
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Brief description of the issue"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                            className="form-control form-control-lg border-2"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label fw-medium text-dark">
                                            <i className="bi bi-card-text me-2 text-muted"></i>
                                            Detailed Description
                                        </label>
                                        <textarea
                                            placeholder="Please provide detailed information about the issue, including steps to reproduce it..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            required
                                            className="form-control border-2"
                                            rows="6"
                                        />
                                    </div>

                                    <div className="d-grid">
                                        <Button 
                                            type="submit" 
                                            variant="primary" 
                                            size="lg"
                                            loading={isSubmitting}
                                            disabled={isSubmitting || !title.trim() || !description.trim()}
                                        >
                                            <i className="bi bi-send me-2"></i>
                                            {isSubmitting ? 'Sending...' : 'Send Issue Report'}
                                        </Button>
                                    </div>
                                </form>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <div className="col-lg-4 mb-4">
                        <Card className="border-0 shadow-sm mb-4">
                            <CardHeader className="bg-light border-bottom">
                                <CardTitle className="mb-0 d-flex align-items-center">
                                    <i className="bi bi-play-circle text-primary me-2"></i>
                                    Quick Actions
                                </CardTitle>
                            </CardHeader>
                            <CardBody>
                                <div className="d-grid gap-3">
                                    <Button 
                                        variant="success" 
                                        onClick={handleStartTour}
                                        className="d-flex align-items-center justify-content-center"
                                    >
                                        <i className="bi bi-compass me-2"></i>
                                        User Flow Tutorial
                                    </Button>
                                    
                                    <Button 
                                        variant="outline-info" 
                                        as="a"
                                        href="mailto:support@hacktthegap.com"
                                        className="d-flex align-items-center justify-content-center"
                                    >
                                        <i className="bi bi-envelope me-2"></i>
                                        Email Support
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>

                        {/* FAQ Section */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader className="bg-light border-bottom">
                                <CardTitle className="mb-0 d-flex align-items-center">
                                    <i className="bi bi-question-circle text-primary me-2"></i>
                                    Common Questions
                                    {user && (
                                        <Badge variant="outline-primary" className="ms-2 text-capitalize">
                                            {user.role === 'superadmin' ? 'Admin' : user.role}
                                        </Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardBody>
                                <div className="faq-container">
                                    {user && getFAQsForRole(user.role).map((faq, index) => (
                                        <div key={index} className="faq-item border-bottom pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
                                            <button 
                                                className="btn btn-link text-start p-0 w-100 text-decoration-none d-flex justify-content-between align-items-center" 
                                                type="button" 
                                                onClick={() => toggleFAQ(index)}
                                                aria-expanded={expandedFAQ === index}
                                            >
                                                <small className="fw-medium text-dark">{faq.question}</small>
                                                <i className={`bi ${expandedFAQ === index ? 'bi-chevron-up' : 'bi-chevron-down'} text-muted ms-2`}></i>
                                            </button>
                                            {expandedFAQ === index && (
                                                <div className="mt-2 ps-0">
                                                    <small className="text-muted">{faq.answer}</small>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Help;