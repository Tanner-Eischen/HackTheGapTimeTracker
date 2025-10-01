import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './lib/api';
import { Card, CardBody, CardHeader } from './components/ui/Card';
import Button from './components/ui/Button';
import DashboardButton from './components/ui/DashboardButton';

function AddSupervisorForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  /**
   * Validates a form field and returns an error message if invalid
   * @param {string} name - Field name
   * @param {string} value - Field value
   * @returns {string} Error message or empty string if valid
   */
  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        return value.trim() === '' ? 'Name is required' : '';
      case 'email':
        return !/^\S+@\S+\.\S+$/.test(value) ? 'Please enter a valid email address' : '';
      case 'password':
        return value.length < 6 ? 'Password must be at least 6 characters long' : '';
      default:
        return '';
    }
  };

  /**
   * Handles input changes, updates form data and validates input
   * @param {Event} e - Change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Mark field as touched
    if (!touched[name]) {
      setTouched({
        ...touched,
        [name]: true
      });
    }
    
    // Validate and set error
    setErrors({
      ...errors,
      [name]: validateField(name, value)
    });
  };
  
  /**
   * Handles blur events to validate fields when user leaves an input
   * @param {Event} e - Blur event
   */
  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    setTouched({
      ...touched,
      [name]: true
    });
    
    setErrors({
      ...errors,
      [name]: validateField(name, value)
    });
  };

  /**
   * Validates all form fields and returns whether the form is valid
   * @returns {boolean} True if all fields are valid, false otherwise
   */
  const validateForm = () => {
    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);
    
    // Validate all fields
    const newErrors = Object.keys(formData).reduce((acc, key) => {
      acc[key] = validateField(key, formData[key]);
      return acc;
    }, {});
    setErrors(newErrors);
    
    // Check if any errors exist
    return !Object.values(newErrors).some(error => error !== '');
  };

  /**
   * Handles form submission, validates all fields and submits data
   * @param {Event} e - Submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields before submission
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setMessage('');

    try {
      const data = await api.post('/api/supervisor/create', formData);
      
      setMessage('Supervisor created successfully!');
      setTimeout(() => {
        navigate('/superadmin/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error creating supervisor:', error);
      
      // Handle API validation errors
      if (error.details && error.details.errors) {
        const apiErrors = error.details.errors;
        const newErrors = { ...errors };
        
        Object.keys(apiErrors).forEach(key => {
          if (newErrors[key] !== undefined) {
            newErrors[key] = apiErrors[key];
          }
        });
        
        setErrors(newErrors);
      } else {
        setMessage(error.message || 'Failed to create supervisor');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-person-plus-fill text-primary me-2 fs-3"></i>
                <h1 className="text-dark mb-0">Add New Supervisor</h1>
              </div>
              <p className="text-muted mb-0">Create a new supervisor account</p>
            </div>
            <DashboardButton />
          </div>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-danger'} mb-4`}>
          {message}
        </div>
      )}

      <div className="row">
        <div className="col-md-8 mx-auto">
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-light border-bottom">
              <h5 className="mb-0">Supervisor Information</h5>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Full Name</label>
                  <input
                    type="text"
                    className={`form-control ${touched.name && errors.name ? 'is-invalid' : ''}`}
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={touched.name && errors.name ? 'true' : 'false'}
                    aria-describedby="name-error"
                    required
                  />
                  {touched.name && errors.name && (
                    <div id="name-error" className="invalid-feedback">
                      {errors.name}
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    type="email"
                    className={`form-control ${touched.email && errors.email ? 'is-invalid' : ''}`}
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={touched.email && errors.email ? 'true' : 'false'}
                    aria-describedby="email-error"
                    required
                  />
                  {touched.email && errors.email && (
                    <div id="email-error" className="invalid-feedback">
                      {errors.email}
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password"
                    className={`form-control ${touched.password && errors.password ? 'is-invalid' : ''}`}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={touched.password && errors.password ? 'true' : 'false'}
                    aria-describedby="password-help password-error"
                    required
                    minLength="6"
                  />
                  <div id="password-help" className="form-text">Password must be at least 6 characters long.</div>
                  {touched.password && errors.password && (
                    <div id="password-error" className="invalid-feedback">
                      {errors.password}
                    </div>
                  )}
                </div>
                <div className="d-flex justify-content-end">
                  <Button
                    type="button"
                    variant="outline-secondary"
                    className="me-2"
                    onClick={() => navigate('/superadmin/dashboard')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Supervisor'}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AddSupervisorForm;