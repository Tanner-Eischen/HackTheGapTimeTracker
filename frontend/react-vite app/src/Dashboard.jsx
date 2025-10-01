import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Card, CardBody, CardTitle, CardText, CardHeader } from './components/ui/Card';
import Button from './components/ui/Button';
import { Collapse } from 'react-bootstrap';

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Redirect supervisors, admins, and superadmins to their respective dashboards
  useEffect(() => {
    if (user) {
      if (user.role === 'superadmin') {
        navigate('/superadmin/dashboard');
      } else if (user.role === 'supervisor') {
        navigate('/supervisor/dashboard');
      }
    }
  }, [user, navigate]);

  const [stats, setStats] = useState({
    hoursThisWeek: 0,
    approvedEntries: 0,
    pendingEntries: 0,
    activeProjects: 0,
    totalHours: 0
  });
  const [loading, setLoading] = useState(true);
  const [supervisorInfo, setSupervisorInfo] = useState(null);
  const [showRecentEntries, setShowRecentEntries] = useState(false);
  const [recentEntries, setRecentEntries] = useState([]);
  const [currentPayPeriod, setCurrentPayPeriod] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getWeekNumber = (date) => {
    const d = new Date(date);
    const start = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - start) / 86400000) + start.getDay() + 1) / 7);
  };

  const getCurrentPayPeriod = () => {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    // First half: 1st-15th, Second half: 16th-end of month
    if (day <= 15) {
      return `${month}/1/${year} - ${month}/15/${year}`;
    } else {
      // Get last day of current month
      const lastDay = new Date(year, month, 0).getDate();
      return `${month}/16/${year} - ${month}/${lastDay}/${year}`;
    }
  };
  
  const toggleRecentEntries = () => {
    setShowRecentEntries(!showRecentEntries);
    if (!showRecentEntries && recentEntries.length === 0) {
      fetchRecentEntries();
    }
  };
  
  const fetchRecentEntries = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const response = await fetch('/api/time', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const allEntries = await response.json();
        const now = new Date();
        const day = now.getDate();
        const month = now.getMonth();
        const year = now.getFullYear();
        
        // Set start and end dates for current pay period
        let startDate, endDate;
        if (day <= 15) {
          startDate = new Date(year, month, 1);
          endDate = new Date(year, month, 15);
        } else {
          startDate = new Date(year, month, 16);
          endDate = new Date(year, month + 1, 0); // Last day of current month
        }
        
        // Filter entries for current pay period
        const filtered = allEntries.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= startDate && entryDate <= endDate;
        });
        
        setRecentEntries(filtered);
        setCurrentPayPeriod(getCurrentPayPeriod());
      }
    } catch (error) {
      console.error('Error fetching recent entries:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch time entries and projects
      const [timeRes, projectsRes] = await Promise.all([
        fetch('/api/time', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/goals', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (timeRes.ok && projectsRes.ok) {
        const timeEntries = await timeRes.json();
        const projects = await projectsRes.json();

        const now = new Date();
        const currentWeek = getWeekNumber(now);
        const today = now.toISOString().split('T')[0];

        // Calculate stats
        let hoursThisWeek = 0;
        let approvedEntries = 0;
        let pendingEntries = 0;
        let totalHours = 0;

        timeEntries.forEach(entry => {
          const entryDate = new Date(entry.date);
          const status = entry.status || 'pending';
          
          // Calculate total hours from all entries
          totalHours += (entry.minutes || 0) / 60;
          
          // Hours this week
          if (getWeekNumber(entryDate) === currentWeek) {
            hoursThisWeek += (entry.minutes || 0) / 60;
          }

          // Status counts
          if (status.toLowerCase() === 'approved') {
            approvedEntries++;
          } else if (status.toLowerCase() === 'pending') {
            pendingEntries++;
          }
        });

        setStats({
          hoursThisWeek: hoursThisWeek.toFixed(1),
          approvedEntries,
          pendingEntries,
          activeProjects: projects.length,
          totalHours: totalHours.toFixed(1)
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add this function to fetch supervisor info after the fetchStats function
  const fetchSupervisorInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
  
      const response = await fetch('/api/user/supervisor', {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      if (response.ok) {
        const data = await response.json();
        setSupervisorInfo(data.supervisor);
      }
    } catch (error) {
      console.error('Error fetching supervisor info:', error);
    }
  };
  
  // Update the useEffect to also fetch supervisor info (around line 103)
  useEffect(() => {
    fetchStats();
    if (user && user.role === 'employee') {
      fetchSupervisorInfo();
    }
    setCurrentPayPeriod(getCurrentPayPeriod());
  }, [user]);
  
  // Add the supervisor info display after the user welcome message (around line 123)
  {user && (
    <p className="text-muted mb-0">
      Welcome back, <span className="fw-semibold text-dark">{user.name}</span>! 
      <span className="badge bg-primary ms-2">{user.role}</span>
      {supervisorInfo && (
        <span className="ms-2">
          Supervisor: <span className="fw-semibold text-primary">{supervisorInfo.name}</span>
        </span>
      )}
    </p>
  )}

  return (
    <div className="min-vh-100 bg-light">
      <div className="container" style={{ padding: "64px 24px 24px 24px" }}>
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex align-items-center flex-wrap justify-content-between" id="nav-dashboard">
              <div className="d-flex align-items-center gap-3">
                <i className="bi bi-shield-lock-fill text-primary me-2 fs-1"></i>
                <div>
                  <h1 className="display-6 text-primary fw-bold mb-1">
                    Hack the Gap Time Tracker
                  </h1>
                  {user && (
                    <p className="text-muted mb-0">
                      Welcome back, <span className="fw-semibold text-dark">{user.name}</span>! 
                      <span className="fw-semibold text-dark"></span>
                      {supervisorInfo && (
                        <div className="d-inline">
                          <span className=" ms-2">Your Supervisor:</span>
                          <span className="fw-semibold text-dark"> {supervisorInfo.name}</span>
                        </div>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <Button variant="danger" onClick={handleLogout} className="d-flex align-items-center gap">
                <i className="bi bi-box-arrow-right me-2"></i>
                Logout
              </Button>
            </div>
          </div>
        </div>
 <div className="row g-4 mb-5">
          <div className="col-md-6 col-lg-3">
            <Card className="h-100" variant="primary" style={{borderWidth: '4px', borderColor: 'var(--bs-info)', borderStyle: 'solid'}}>
              <CardBody className="text-center">
                <div className="bg-primary bg-opacity-10 rounded-circle p-3 mx-auto mb-3" style={{width: 'fit-content'}}>
                  <i className="bi bi-people text-primary fs-2"></i>
                </div>
                <h3 className="display-4 text-primary mb-1">{stats.hoursThisWeek}</h3>
                <p className="text-muted small mb-0">Hours This Week</p>
              </CardBody>
            </Card>
          </div>

          <div className="col-md-6 col-lg-3">
            <Card className="h-100" variant="success" style={{borderWidth: '4px', borderColor: 'var(--bs-success)', borderStyle: 'solid'}}>
              <CardBody className="text-center">
                <div className="bg-success bg-opacity-10 rounded-circle p-3 mx-auto mb-3" style={{width: 'fit-content'}}>
                  <i className="bi bi-check-circle text-success fs-2"></i>
                </div>
                <h3 className="display-4 text-success mb-1">{stats.activeProjects}</h3>
                <p className="text-muted small mb-0">Active Projects</p>
              </CardBody>
            </Card>
          </div>

       
          <div className="col-md-6 col-lg-3">
            <Card className="h-100" variant="warning" style={{borderWidth: '4px', borderColor: 'var(--bs-warning)', borderStyle: 'solid'}}>
              <CardBody className="text-center">
                <div className="bg-warning bg-opacity-10 rounded-circle p-3 mx-auto mb-3" style={{width: 'fit-content'}}>
                  <i className="bi bi-clock-history text-warning fs-2"></i>
                </div>
                <h3 className="display-4 text-warning mb-1">{stats.pendingEntries}</h3>
                <p className="text- small mb-0">Pending Entries</p>
              </CardBody>
            </Card>
          </div>
          

          
          <div className="col-md-6 col-lg-3">
            <Card className="h-100" variant="info" style={{borderWidth: '4px', borderColor: 'var(--bs-primary)', borderStyle: 'solid'}}>
              <CardBody className="text-center">
                <div className="bg-info bg-opacity-10 rounded-circle p-3 mx-auto mb-3" style={{width: 'fit-content'}}>
                  <i className="bi bi-graph-up text-info fs-2"></i>
                </div>
                <h3 className="display-4 text-info mb-1">{stats.totalHours}</h3>
                <p className="text-muted small mb-0">Total Hours</p>
              </CardBody>
            </Card>
          </div>
          
          
        </div>
        {/* Action Cards */}
        <div className="row g-4 mb-5">
          <div className="col-12">
         <Card className="border-0 shadow-sm">
            <CardHeader className="bg-light border-bottom">
              <h5 className="mb-0">Actions</h5>
            </CardHeader>
            <CardBody>
              <div className="row mb-4">
            <div className="col-md-3">
              <Card className="h-100" variant="primary">
                <CardBody>
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                      <i className="bi bi-clock text-primary fs-4"></i>
                    </div>
                    <CardTitle className="mb-0">Time Tracker</CardTitle>
                  </div>
                  <CardText muted>
                    Log your work hours and track time spent on projects.
                  </CardText>
                     <Link to="/time" className="btn btn-primary fw-medium">
                    Track Time
                  </Link>
                </CardBody>
              </Card>
            </div>

            <div className="col-md-3">
              <Card className="h-100" variant="success">
                <CardBody>
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3">
                      <i className="bi bi-bullseye text-success fs-4"></i>
                    </div>
                    <CardTitle className="mb-0">Goals</CardTitle>
                  </div>
                  <CardText muted>
                    Set and track your weekly goals and milestones.  
    
                  </CardText>
                   <br />
                  <Link to="/Goals" className="btn btn-success fw-medium">
                    Manage Goals
                  </Link>
                </CardBody>
              </Card>
            </div>
            
            <div className="col-md-3">
              <Card className="h-100" variant="warning">
                <CardBody>
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-3">
                      <i className="bi bi-journal-check text-warning fs-4"></i>
                    </div>
                    <CardTitle className="mb-0">Recent Entries</CardTitle>
                  </div>
                  <CardText muted>
                    View your recent pending, approved, and rejected entries.
                  </CardText>
                  <button 
                    className="btn btn-warning fw-medium" 
                    id="view-recent-entries"
                    onClick={toggleRecentEntries}
                  >
                    View Entries
                  </button>
                </CardBody>
              </Card>
            </div>

            <div className="col-md-3">
              <Card className="h-100" variant="info">
                <CardBody>
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-info bg-opacity-10 rounded-circle p-2 me-3">
                      <i className="bi bi-graph-up text-info fs-4"></i>
                    </div>
                    <CardTitle className="mb-0">Reports</CardTitle>
                  </div>
                  <CardText muted>
                    View detailed reports and analytics of your time entries.
                  </CardText>
                  <Link to="/report" className="btn btn-info fw-medium">
                    View Reports
                  </Link>
                </CardBody>
              </Card>
            </div>
              </div>
              
              {/* Recent Entries Collapsible Card */}
              <Collapse in={showRecentEntries}>
                <div className="mt-4">
                  <Card>
                    <CardHeader>
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Recent Entries - {currentPayPeriod}</h5>
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          onClick={toggleRecentEntries}
                        >
                          <i className="bi bi-x-lg"></i>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardBody>
                      {recentEntries.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Project</th>
                                <th>Hours</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {recentEntries.map((entry, index) => (
                                <tr key={index}>
                                  <td>{new Date(entry.date).toLocaleDateString()}</td>
                                  <td>{entry.project?.name || 'N/A'}</td>
                                  <td>{((entry.minutes || 0) / 60).toFixed(1)}</td>
                                  <td>
                                    <span className={`badge bg-${entry.status === 'approved' ? 'success' : entry.status === 'rejected' ? 'danger' : 'warning'}`}>
                                      {entry.status || 'pending'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <i className="bi bi-inbox text-muted fs-1"></i>
                          <p className="mt-2 mb-0">No entries found for the current pay period.</p>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </div>
              </Collapse>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
    </div>
  );
}

export default Dashboard;
