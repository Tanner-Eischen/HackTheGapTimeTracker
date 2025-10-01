import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Card, CardBody, CardHeader } from './components/ui/Card';
import Button from './components/ui/Button';
import { Badge } from './components/ui/Badge';

function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalSupervisors: 0,
    totalEmployees: 0,
    pendingApprovals: 0,
    totalHours: 0
  });
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch supervisors list
      const supervisorsRes = await fetch('/api/supervisors', {
        headers: { Authorization: `Bearer ${token}` }
      });

      let supervisorsWithTeamSize = [];
      if (supervisorsRes.ok) {
        const supervisorsData = await supervisorsRes.json();
        
        // Fetch team size for each supervisor
        supervisorsWithTeamSize = await Promise.all(
          supervisorsData.map(async (supervisor) => {
            const teamRes = await fetch(`/api/supervisors/${supervisor._id}/team`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (teamRes.ok) {
              const teamData = await teamRes.json();
              return { ...supervisor, teamSize: teamData.length };
            }
            
            return { ...supervisor, teamSize: 0 };
          })
        );
        
        setSupervisors(supervisorsWithTeamSize);
        setStats(prev => ({
          ...prev,
          totalSupervisors: supervisorsWithTeamSize.length
        }));
      }

      // Calculate total employees from all supervisors
      const totalEmployees = supervisorsWithTeamSize.reduce((total, supervisor) => total + (supervisor.teamSize || 0), 0);
      
      // Fetch pending approvals count (all entries with status 'pending')
      const pendingApprovalsRes = await fetch('/api/time?status=pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let pendingApprovals = 0;
      if (pendingApprovalsRes.ok) {
        const pendingApprovalsData = await pendingApprovalsRes.json();
        pendingApprovals = pendingApprovalsData.length;
      }
      
      // Fetch all time entries to calculate total hours
      const timeEntriesRes = await fetch('/api/time', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let totalHours = 0;
      if (timeEntriesRes.ok) {
        const timeEntriesData = await timeEntriesRes.json();
        // Calculate total hours from minutes
        totalHours = Math.round(timeEntriesData.reduce((total, entry) => total + (entry.minutes || 0), 0) / 60);
      }
      
      // Update stats with all values
      setStats(prev => ({
        ...prev,
        totalEmployees,
        pendingApprovals,
        totalHours
      }));

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };
  
  const handleRemoveSupervisor = async (supervisorId, supervisorName) => {
    if (!confirm(`Are you sure you want to remove supervisor ${supervisorName}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`/api/supervisors/${supervisorId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Remove the supervisor from the state
        setSupervisors(supervisors.filter(s => s._id !== supervisorId));
        setStats(prev => ({
          ...prev,
          totalSupervisors: prev.totalSupervisors - 1
        }));
        setSuccess(`Supervisor ${supervisorName} removed successfully`);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to remove supervisor');
        // Clear error message after 3 seconds
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error removing supervisor:', error);
      setError('An error occurred while removing the supervisor');
      // Clear error message after 3 seconds
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <div className="d-flex align-items-center mb-2" id="superadmindashboard">
                <i className="bi bi-shield-lock-fill text-primary me-2 fs-3"></i>
                <h1 className="text-dark mb-0">Super Admin Dashboard</h1>
              </div>
              <p className="text-muted mb-0">Manage supervisors and system-wide settings</p>
            </div>
            <div className="d-flex align-items-center gap-2">
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
      
      {/* Alert messages */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <Card className="h-100" variant="primary" style={{borderWidth: '2px', outline: '2px solid rgba(13, 110, 253, 0.5)'}}>
            <CardBody className="d-flex flex-column align-items-center justify-content-center py-4">
              <i className="bi bi-people text-primary fs-2"></i>
              <div className="display-4 text-primary mb-2">{stats.totalSupervisors}</div>
              <h5 className="text-center mb-0">Total Supervisors</h5>
            </CardBody>
          </Card>
        </div>
        <div className="col-md-3">
          <Card className="h-100" variant="success" style={{borderWidth: '2px', outline: '2px solid rgba(25, 135, 84, 0.5)'}}>
            <CardBody className="d-flex flex-column align-items-center justify-content-center py-4">
              <i className="bi bi-people-fill text-success fs-2"></i>
              <div className="display-4 text-success mb-2">{stats.totalEmployees || 0}</div>
              <h5 className="text-center mb-0">Total Employees</h5>
            </CardBody>
          </Card>
        </div>
        <div className="col-md-3" data-tour="pending-approvals">
          <Card className="h-100" variant="warning" style={{borderWidth: '2px', outline: '2px solid rgba(255, 193, 7, 0.5)'}}>
            <CardBody className="d-flex flex-column align-items-center justify-content-center py-4">
              <i className="bi bi-clock-history text-warning fs-2"></i>
              <div className="display-4 text-warning mb-2">{stats.pendingApprovals || 0}</div>
              <h5 className="text-center mb-0">Pending Approvals</h5>
            </CardBody>
          </Card>
        </div>
        <div className="col-md-3">
          <Card className="h-100" variant="info" style={{borderWidth: '2px', outline: '2px solid rgba(13, 202, 240, 0.5)'}}>
            <CardBody className="d-flex flex-column align-items-center justify-content-center py-4">
               <i className="bi bi-graph-up text-info fs-2"></i>
              <div className="display-4 text-info mb-2">{stats.totalHours || 0}</div>
              <h5 className="text-center mb-0">Total Hours</h5>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Supervisor Management */}
      <div className="row mb-4">
        <div className="col-12">
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-primary text-black border-bottom">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 d-flex align-items-center text-black" id="supervisor-management" data-tour="team-overview">
                  <div className="bg-white bg-opacity-20 rounded-circle p-1 me-2">
                    <i className="bi bi-people-fill text-black"></i>{/*  */}
                  </div>
                  Supervisor Management
                
                </h5>
                <Button 
                  variant="light" 
                  size="sm"
                  onClick={() => navigate('/superadmin/add-supervisor')}
                  data-tour="add-team-member"
                >
                  <i className="bi bi-person-plus me-1"></i>
                  Add New Supervisor
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {supervisors.length === 0 ? (
                <div className="text-center py-5">
                  <div className="bg-primary bg-opacity-10 rounded-circle p-3 mx-auto mb-3" style={{width: 'fit-content'}}>
                    <i className="bi bi-people text-primary" style={{ fontSize: '4rem' }}></i>
                  </div>
                  <h4 className="text-muted">No supervisors found</h4>
                  <p className="text-muted mb-4">
                    Add your first supervisor to get started.
                  </p>
                  <Button variant="outline-primary" onClick={() => navigate('/superadmin/add-supervisor')}>
                    <i className="bi bi-person-plus me-2"></i>
                    Add Your First Supervisor
                  </Button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="border-0 fw-semibold text-muted">Name</th>
                        <th className="border-0 fw-semibold text-muted">Email</th>
                        <th className="border-0 fw-semibold text-muted">Team Size</th>
                        <th className="border-0 fw-semibold text-muted">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supervisors.map(supervisor => (
                        <tr key={supervisor._id}>
                          <td>{supervisor.name}</td>
                          <td>{supervisor.email}</td>
                          <td>{supervisor.teamSize || 0}</td>
                          <td>
                            <div className="btn-group" role="group">
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => navigate(`/superadmin/supervisor/${supervisor._id}`)}
                              >
                                <i className="bi bi-eye me-1"></i>
                                View
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleRemoveSupervisor(supervisor._id, supervisor.name)}
                              >
                                <i className="bi bi-trash me-1"></i>
                                Remove
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row">
        <div className="col-12">
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-primary text-black border-bottom">
              <h5 className="mb-0 text-black">Actions</h5>
            </CardHeader>
            <CardBody>
              <div className="row g-3">
                <div className="col-md-3">
                  <Button 
                    variant="outline-primary" 
                    className="w-100 py-3"
                    onClick={() => navigate('/superadmin/add-supervisor')}
                  >
                    <div className="bg-primary bg-opacity-10 rounded-circle p-2 mx-auto mb-2" style={{width: 'fit-content'}}>
                      <i className="bi bi-person-plus-fill fs-4 d-block"></i>
                    </div>
                    Add New Supervisor
                  </Button>
                </div>
                <div className="col-md-3">
                  <Button 
                    variant="outline-success" 
                    className="w-100 py-3"
                    onClick={() => navigate('/supervisor/team')}
                  >
                    <div className="bg-success bg-opacity-10 rounded-circle p-2 mx-auto mb-2" style={{width: 'fit-content'}}>
                      <i className="bi bi-people-fill fs-4 d-block"></i>
                    </div>
                    Manage Team Members
                  </Button>
                </div>
                <div className="col-md-3">
                  <Button 
                    variant="outline-warning" 
                    className="w-100 py-3"
                    onClick={() => navigate('/supervisor/approvals')}
                  >
                    <div className="bg-warning bg-opacity-10 rounded-circle p-2 mx-auto mb-2" style={{width: 'fit-content'}}>
                      <i className="bi bi-check-circle-fill fs-4 d-block"></i>
                    </div>
                    Review Approvals
                  </Button>
                </div>
                <div className="col-md-3">
                  <Button 
                    variant="outline-info" 
                    className="w-100 py-3"
                    onClick={() => navigate('/superadmin/reports')}
                    id="system-reports"
                    data-tour="team-reports"
                  >
                    <div className="bg-info bg-opacity-10 rounded-circle p-2 mx-auto mb-2" style={{width: 'fit-content'}}>
                      <i className="bi bi-file-earmark-bar-graph-fill fs-4 d-block"></i>
                    </div>
                    View Reports
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminDashboard;