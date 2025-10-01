import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Card, CardBody, CardHeader, CardTitle } from './components/ui/Card';
import Button from './components/ui/Button';
import { Badge, StatusBadge } from './components/ui/Badge';
import DashboardButton from './components/ui/DashboardButton';

/**
 * SupervisorView component
 * Displays detailed information about a specific supervisor
 * Accessible only by superadmins
 */
function SupervisorView() {
  const { supervisorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [supervisor, setSupervisor] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSupervisorData();
  }, [supervisorId]);

  const fetchSupervisorData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch supervisor details
      const supervisorRes = await fetch(`/api/supervisors/${supervisorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!supervisorRes.ok) {
        throw new Error('Failed to fetch supervisor details');
      }

      const supervisorData = await supervisorRes.json();
      setSupervisor(supervisorData);

      // Fetch team members for this supervisor
      const teamRes = await fetch(`/api/supervisors/${supervisorId}/team`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setTeamMembers(teamData);
      }

      // Fetch recent time entries for this supervisor's team
      const entriesRes = await fetch(`/api/superadmin/supervisor/entries?supervisorId=${supervisorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (entriesRes.ok) {
        const entriesData = await entriesRes.json();
        setRecentEntries(entriesData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching supervisor data:', error);
      setError('Failed to load supervisor data');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading supervisor data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">{error}</div>
        <Button variant="primary" onClick={() => navigate('/superadmin/dashboard')}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  if (!supervisor) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">Supervisor not found</div>
        <Button variant="primary" onClick={() => navigate('/superadmin/dashboard')}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-person-badge-fill text-primary me-2 fs-3"></i>
                <h1 className="text-dark mb-0">Supervisor Profile</h1>
              </div>
              <p className="text-muted mb-0">Detailed information about {supervisor.name}</p>
            </div>
            <DashboardButton />
          </div>
        </div>
      </div>

      {/* Supervisor Profile Card */}
      <div className="row mb-4">
        <div className="col-12">
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-light border-bottom">
              <h5 className="mb-0 d-flex align-items-center">
                <i className="bi bi-person-fill text-primary me-2"></i>
                Supervisor Information
              </h5>
            </CardHeader>
            <CardBody>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <strong className="text-muted">Name:</strong>
                    <p className="mb-0">{supervisor.name}</p>
                  </div>
                  <div className="mb-3">
                    <strong className="text-muted">Email:</strong>
                    <p className="mb-0">{supervisor.email}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <strong className="text-muted">Team Size:</strong>
                    <p className="mb-0">{teamMembers.length} members</p>
                  </div>
                  <div className="mb-3">
                    <strong className="text-muted">Status:</strong>
                    <p className="mb-0">
                      <Badge variant="success">Active</Badge>
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => navigate(`/superadmin/reports?supervisor=${supervisorId}`)}
                >
                  <i className="bi bi-graph-up me-1"></i>
                  View Reports
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Team Members Card */}
      <div className="row mb-4">
        <div className="col-12">
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-light border-bottom">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 d-flex align-items-center">
                  <i className="bi bi-people-fill text-primary me-2"></i>
                  Team Members
                  <Badge variant="primary" className="ms-2">
                    {teamMembers.length}
                  </Badge>
                </h5>
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => navigate(`/supervisor/team?supervisor=${supervisorId}`)}
                >
                  <i className="bi bi-person-plus me-1"></i>
                  Manage Team
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {teamMembers.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-people text-muted mb-3" style={{ fontSize: '4rem' }}></i>
                  <h4 className="text-muted">No team members found</h4>
                  <p className="text-muted mb-4">
                    This supervisor hasn't added any team members yet.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="border-0 fw-semibold text-muted">Name</th>
                        <th className="border-0 fw-semibold text-muted">Email</th>
                        <th className="border-0 fw-semibold text-muted">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.map(member => (
                        <tr key={member._id}>
                          <td>{member.name}</td>
                          <td>{member.email}</td>
                          <td>
                            <StatusBadge status="active" />
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

      {/* Recent Time Entries */}
      {recentEntries.length > 0 && (
        <div className="row">
          <div className="col-12">
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-light border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 d-flex align-items-center">
                    <i className="bi bi-clock-history text-primary me-2"></i>
                    Recent Time Entries
                    <Badge variant="primary" className="ms-2">
                      {recentEntries.length}
                    </Badge>
                  </h5>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => navigate(`/superadmin/reports?supervisor=${supervisorId}`)}
                  >
                    <i className="bi bi-graph-up me-1"></i>
                    View All Reports
                  </Button>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="border-0 fw-semibold text-muted">Employee</th>
                        <th className="border-0 fw-semibold text-muted">Date</th>
                        <th className="border-0 fw-semibold text-muted">Project</th>
                        <th className="border-0 fw-semibold text-muted">Hours</th>
                        <th className="border-0 fw-semibold text-muted">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentEntries.map(entry => (
                        <tr key={entry._id}>
                          <td>{entry.userId?.name || 'Unknown'}</td>
                          <td>{new Date(entry.date).toLocaleDateString()}</td>
                          <td>{entry.project || 'No Project'}</td>
                          <td>{((entry.minutes || 0) / 60).toFixed(1)}h</td>
                          <td>
                            <StatusBadge status={entry.status || 'pending'} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupervisorView;