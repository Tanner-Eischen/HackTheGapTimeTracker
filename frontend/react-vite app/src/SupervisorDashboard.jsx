import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Card, CardBody, CardTitle, CardText } from './components/ui/Card';
import Button from './components/ui/Button';
import { Badge, StatusBadge } from './components/ui/Badge';


function SupervisorDashboard() {
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    totalInterns: 0,
    thisWeekHours: 0,
    totalApproved: 0
  });
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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

      // Fetch pending entries and team data
      const [pendingRes, teamRes] = await Promise.all([
        fetch('/api/pending-entries', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/team', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (pendingRes.ok && teamRes.ok) {
        const pendingEntries = await pendingRes.json();
        const teamMembers = await teamRes.json();

        // Calculate stats
        const totalHours = pendingEntries.reduce((sum, e) => sum + ((e.minutes || 0) / 60), 0);

        setStats({
          pendingApprovals: pendingEntries.length,
          totalInterns: teamMembers.length,
          thisWeekHours: totalHours,
          totalApproved: 0 // We'll need another API call for this if needed
        });

        // Get recent entries (last 5)
        setRecentEntries(pendingEntries.slice(-5).reverse());
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{width: '3rem', height: '3rem'}}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading supervisor dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      <div className="container" style={{ padding: "64px 24px 24px 24px" }}>
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <h1 className="display-6 text-primary fw-bold mb-1">
                  <i className="bi bi-shield-check me-2"></i>
                  Supervisor Dashboard
                </h1>
                <p className="text-muted mb-1">Manage intern time entries and approvals</p>
                {user && (
                  <p className="text-muted mb-0">
                    Welcome back, <span className="fw-semibold text-dark">{user.name}</span>!
                    <Badge variant="primary" className="ms-2">Supervisor</Badge>
                  </p>
                )}
              </div>
              <Button variant="danger" onClick={handleLogout} className="d-flex align-items-center">
                <i className="bi bi-box-arrow-right me-2"></i>
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
         <div className="row g-4 mb-5">
          <div className="col-md-6 col-lg-3" data-tour="team-overview">
            <Card className="h-100" variant="primary" style={{borderWidth: '4px', borderColor: 'var(--bs-info)', borderStyle: 'solid'}}>
              <CardBody className="text-center">
                <div className="bg-primary bg-opacity-10 rounded-circle p-3 mx-auto mb-3" style={{width: 'fit-content'}}>
                  <i className="bi bi-people text-primary fs-2"></i>
                </div>
                <h3 className="display-4 text-primary mb-1">{stats.totalInterns}</h3>
                <p className="text-muted small mb-0">Active Interns</p>
              </CardBody>
            </Card>
          </div>

          <div className="col-md-6 col-lg-3">
            <Card className="h-100" variant="success" style={{borderWidth: '4px', borderColor: 'var(--bs-success)', borderStyle: 'solid'}}>
              <CardBody className="text-center">
                <div className="bg-success bg-opacity-10 rounded-circle p-3 mx-auto mb-3" style={{width: 'fit-content'}}>
                  <i className="bi bi-check-circle text-success fs-2"></i>
                </div>
                <h3 className="display-4 text-success mb-1">{stats.totalApproved}</h3>
                <p className="text-muted small mb-0">Approved Entries</p>
              </CardBody>
            </Card>
          </div>

       
          <div className="col-md-6 col-lg-3" data-tour="pending-approvals">
            <Card className="h-100" variant="warning" style={{borderWidth: '4px', borderColor: 'var(--bs-warning)', borderStyle: 'solid'}}>
              <CardBody className="text-center">
                <div className="bg-warning bg-opacity-10 rounded-circle p-3 mx-auto mb-3" style={{width: 'fit-content'}}>
                  <i className="bi bi-clock-history text-warning fs-2"></i>
                </div>
                <h3 className="display-4 text-warning mb-1">{stats.pendingApprovals}</h3>
                <p className="text- small mb-0">Pending Approvals</p>
              </CardBody>
            </Card>
          </div>
          

          
          <div className="col-md-6 col-lg-3">
            <Card className="h-100" variant="info" style={{borderWidth: '4px', borderColor: 'var(--bs-primary)', borderStyle: 'solid'}}>
              <CardBody className="text-center">
                <div className="bg-info bg-opacity-10 rounded-circle p-3 mx-auto mb-3" style={{width: 'fit-content'}}>
                  <i className="bi bi-graph-up text-info fs-2"></i>
                </div>
                <h3 className="display-4 text-info mb-1">{stats.thisWeekHours.toFixed(1)}</h3>
                <p className="mb-0">Total Hours</p>
              </CardBody>
            </Card>
          </div>
          
          
        </div>
{/* Recent Activity */}
        <div className="row mb-4">
          <div className="col-12">
            <Card className="border-primary" style={{borderWidth: '4px', borderColor: 'var(--bs-primary)', borderStyle: 'solid'}}>
              <div className="bg-light p-3 border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <CardTitle className="mb-0">
                    <i className="bi bi-clock-history me-2 text-primary"></i>
                    Recent Time Entries
                  </CardTitle>
                  <Link to="/supervisor/approvals" className="text-decoration-none">
                    <Button variant="outline-primary" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
              </div>
              <CardBody className="p-0">
                {recentEntries.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="bg-light rounded-circle p-3 mx-auto mb-3" style={{width: 'fit-content'}}>
                      <i className="bi bi-inbox text-muted fs-1"></i>
                    </div>
                    <h5 className="text-muted">No recent entries</h5>
                    <p className="text-muted">Time entries will appear here as interns submit them.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="fw-semibold">Intern</th>
                          <th className="fw-semibold">Date</th>
                          <th className="fw-semibold">Project</th>
                          <th className="fw-semibold">Hours</th>
                          <th className="fw-semibold">Status</th>
                          <th className="fw-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentEntries.map((entry, index) => (
                          <tr key={entry._id || index}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="bg-primary bg-opacity-10 rounded-circle p-1 me-2">
                                  <i className="bi bi-person text-primary"></i>
                                </div>
                                <span className="fw-medium">{entry.userId?.name || 'Unknown User'}</span>
                              </div>
                            </td>
                            <td className="text-muted">
                              {new Date(entry.date).toLocaleDateString()}
                            </td>
                            <td>
                              <Badge variant="primary">
                                {entry.project || 'No Project'}
                              </Badge>
                            </td>
                            <td>
                              <span className="fw-bold text-primary">{((entry.minutes || 0) / 60).toFixed(1)}h</span>
                            </td>
                            <td>
                              <StatusBadge status={entry.status || 'pending'} />
                            </td>
                            <td>
                              {entry.status && entry.status.toLowerCase() === 'pending' ? (
                                <Link to="/supervisor/approvals" className="text-decoration-none">
                                  <Button variant="outline-primary" size="sm">
                                    Review
                                  </Button>
                                </Link>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
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

        {/* Action Cards */}
        <div className="row mb-5">
          <div className="col-12">
            <Card className="border-0 shadow-sm bg-white p-4">
              <div className="row g-4">
                <div className="col-md-6 col-lg-4" data-tour="add-team-member">
                  <Card className="h-100 border-primary" variant="primary" style={{borderWidth: '4px', borderColor: 'var(--bs-primary)', borderStyle: 'solid'}}>
                    <CardBody>
                      <div className="d-flex align-items-center mb-3">
                        <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                          <i className="bi bi-people text-primary fs-4"></i>
                        </div>
                        <CardTitle className="mb-0">Team Management</CardTitle>
                      </div>
                      <CardText muted>
                        View and manage your team members and their progress.
                      </CardText>
                      <Link to="/supervisor/team" className="text-decoration-none">
                        <Button variant="primary" className="fw-medium">
                          Manage Team
                        </Button>
                      </Link>
                    </CardBody>
                  </Card>
                </div>

                <div className="col-md-6 col-lg-4">
                  <Card className="h-100 border-warning" variant="warning" style={{borderWidth: '4px', borderColor: 'var(--bs-warning)', borderStyle: 'solid'}}>
                    <CardBody>
                      <div className="d-flex align-items-center mb-3">
                        <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-3">
                          <i className="bi bi-clipboard-check text-warning fs-4"></i>
                        </div>
                        <CardTitle className="mb-0">Approval Queue</CardTitle>
                      </div>
                      <CardText muted>
                        Review and approve pending time entries from interns.
                      </CardText>
                      <div className="d-flex justify-content-between align-items-center">
                        <Link to="/supervisor/approvals" className="text-decoration-none">
                          <Button variant="warning" className="fw-medium">
                            Review Entries
                          </Button>
                        </Link>
                        {stats.pendingApprovals > 0 && (
                          <Badge variant="warning">
                            {stats.pendingApprovals} pending
                          </Badge>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                </div>

                
                <div className="col-md-6 col-lg-4" data-tour="team-reports">
                  <Card className="h-100 border-success" variant="success" style={{borderWidth: '4px', borderColor: 'var(--bs-success)', borderStyle: 'solid'}}>
                    <CardBody>
                      <div className="d-flex align-items-center mb-3">
                        <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3">
                          <i className="bi bi-bar-chart text-success fs-4"></i>
                        </div>
                        <CardTitle className="mb-0">Reports</CardTitle>
                      </div>
                      <CardText muted>
                        Generate reports and view analytics for your team.
                      </CardText>
                      <Link to="/report" className="text-decoration-none">
                        <Button variant="success" className="fw-medium">
                          View Reports
                        </Button>
                      </Link>
                    </CardBody>
                  </Card>
                </div>
              </div>
            </Card>
          </div>
        </div>

      {/*   Team Pending Entries Overview
        {recentEntries.length > 0 && (
          <div className="row mb-5">
            <div className="col-12">
              <Card className="border-warning" style={{borderWidth: '4px', borderColor: 'var(--bs-warning)', borderStyle: 'solid'}}>
                <div className="bg-warning bg-opacity-10 p-3 border-bottom">
                  <div className="d-flex justify-content-between align-items-center">
                    <CardTitle className="mb-0 text-warning">
                      <i className="bi bi-people-fill me-2"></i>
                      Team Members with Pending Entries
                    </CardTitle>
                    <Link to="/supervisor/team" className="text-decoration-none">
                      <Button variant="dark" size="sm">
                        View Team Details
                      </Button>
                    </Link>
                  </div>
                </div>
                <CardBody>
                  <div className="row g-3">
                    {(() => {
                      // Group entries by employee
                      const employeeEntries = {};
                      recentEntries.forEach(entry => {
                        const employeeId = entry.userId?._id;
                        const employeeName = entry.userId?.name || 'Unknown User';
                        if (!employeeEntries[employeeId]) {
                          employeeEntries[employeeId] = {
                            name: employeeName,
                            entries: [],
                            totalHours: 0
                          };
                        }
                        employeeEntries[employeeId].entries.push(entry);
                        employeeEntries[employeeId].totalHours += (entry.minutes || 0) / 60;
                      });

                      return Object.entries(employeeEntries).map(([employeeId, data]) => (
                        <div key={employeeId} className="col-md-6 col-lg-4">
                          <Card className="h-100 border-warning" style={{borderWidth: '4px', borderColor: 'var(--bs-warning)', borderStyle: 'solid'}}>
                            <CardBody>
                              <div className="d-flex align-items-center mb-3">
                                <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-2">
                                  <i className="bi bi-person-circle text-warning"></i>
                                </div>
                                <CardTitle className="mb-0 text-warning">{data.name}</CardTitle>
                              </div>
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <Badge variant="warning">
                                  {data.entries.length} entries
                                </Badge>
                                <span className="fw-bold text-warning">
                                  {data.totalHours.toFixed(1)}h
                                </span>
                              </div>
                              <div className="d-grid">
                                <Link to="/supervisor/approvals" className="text-decoration-none">
                                  <Button variant="outline-warning" size="sm" className="fw-medium">
                                    Review Entries
                                  </Button>
                                </Link>
                              </div>
                            </CardBody>
                          </Card>
                        </div>
                      ));
                    })()
                    }
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        )} */}

        

        {/* Quick Actions */}
       
           
      </div>
    </div>
  );
}

export default SupervisorDashboard;