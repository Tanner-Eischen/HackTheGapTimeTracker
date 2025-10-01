import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader } from './components/ui/Card';
import Button from './components/ui/Button';
import DashboardButton from './components/ui/DashboardButton';
import { Badge, StatusBadge } from './components/ui/Badge';
import { useAuth } from './AuthContext';

function TeamManagement() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [pendingEntries, setPendingEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingMember, setAddingMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [message, setMessage] = useState('');
  const [removingMember, setRemovingMember] = useState(null);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('');
  const [allEmployees, setAllEmployees] = useState([]);

  useEffect(() => {
    fetchTeamData();
    
    // If user is superadmin, fetch the list of supervisors
    if (user && user.role === 'superadmin') {
      fetchSupervisors();
    }
    
    // Fetch all employees with 'employee' role
    fetchAllEmployees();
  }, [user]);

  const fetchTeamData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [teamResponse, pendingResponse] = await Promise.all([
        fetch('/api/team', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/pending-entries', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        setTeamMembers(teamData);
      } else {
        setMessage('Failed to fetch team members');
      }

      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingEntries(pendingData);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
      setMessage('Error fetching team data');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAllEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch('/api/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const employeesData = await response.json();
        setAllEmployees(employeesData);
      } else {
        console.error('Failed to fetch employees');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Helper function to get pending entries count for a team member
  const getPendingEntriesForMember = (memberId) => {
    return pendingEntries.filter(entry => entry.userId?._id === memberId);
  };

  const getTotalHoursForMember = (memberId) => {
    const memberEntries = getPendingEntriesForMember(memberId);
    return memberEntries.reduce((total, entry) => total + ((entry.minutes || 0) / 60), 0);
  };

  const fetchSupervisors = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch('/api/supervisors', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const supervisorsData = await response.json();
        setSupervisors(supervisorsData);
      } else {
        console.error('Failed to fetch supervisors');
      }
    } catch (error) {
      console.error('Error fetching supervisors:', error);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) {
      setMessage('Please enter an email address');
      return;
    }

    setAddingMember(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage('Authentication token not found. Please log in again.');
        setAddingMember(false);
        return;
      }

      // Prepare request body based on role
      const requestBody = { employeeEmail: newMemberEmail.trim() };
      
      // If superadmin and a supervisor is selected, add the supervisorId
      if (user.role === 'superadmin' && selectedSupervisorId) {
        requestBody.supervisorId = selectedSupervisorId;
      }

      const response = await fetch('/api/team/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Employee added successfully!');
        setNewMemberEmail('');
        setSelectedSupervisorId('');
        fetchTeamData();
      } else {
        setMessage(data.message || `Failed to add employee (${response.status})`);
      }
    } catch (error) {
      console.error('Error adding team member:', error);
      setMessage(`Error adding team member: ${error.message}`);
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (employeeId, employeeName) => {
    if (!confirm(`Are you sure you want to remove ${employeeName} from your team?`)) {
      return;
    }

    setRemovingMember(employeeId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/team/${employeeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Employee removed successfully!');
        fetchTeamData();
      } else {
        setMessage(data.message || 'Failed to remove employee');
      }
    } catch (error) {
      console.error('Error removing team member:', error);
      setMessage('Error removing team member');
    } finally {
      setRemovingMember(null);
    }
  };

  const getMessageVariant = (message) => {
    if (message.includes('successfully')) return 'success';
    if (message.includes('Failed') || message.includes('Error')) return 'danger';
    return 'info';
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Loading team management...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "64px 24px 24px 24px" }}>
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-2">
                  <li className="breadcrumb-item">
                    <Link to="/superadmin/dashboard" className="text-decoration-none text-primary">
                      <i className="bi bi-speedometer2 me-1"></i>
                      Superadmin Dashboard
                    </Link>
                  </li>
                  <li className="breadcrumb-item active text-muted" aria-current="page">
                    Team Management
                  </li>
                </ol>
              </nav>
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-people-fill text-primary me-2 fs-3"></i>
                <h1 className="text-dark mb-0">Team Management</h1>
              </div>
              <p className="text-muted mb-0">Manage your team members and monitor their activity</p>
            </div>
            <DashboardButton />
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className="row mb-4">
          <div className="col-12">
            <div className={`alert alert-${getMessageVariant(message)} d-flex align-items-center alert-dismissible fade show`} role="alert">
              <i className={`bi ${
                getMessageVariant(message) === 'success' ? 'bi-check-circle-fill' :
                getMessageVariant(message) === 'danger' ? 'bi-exclamation-triangle-fill' :
                'bi-info-circle-fill'
              } me-2`}></i>
              {message}
              <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Team Member */}
      <div className="row mb-4">
        <div className="col-12">
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-light border-bottom">
              <h5 className="mb-0 d-flex align-items-center">
                <i className="bi bi-person-plus-fill text-primary me-2"></i>
                Add New Team Member
              </h5>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleAddMember}>
                <div className="row g-3 align-items-end">
                  <div className={user && user.role === 'superadmin' ? "col-md-4" : "col-md-8"}>
                    <label htmlFor="memberEmail" className="form-label fw-medium">
                      <i className="bi bi-envelope me-1"></i>
                      Employee Email Address
                    </label>
                    <select
                      id="memberEmail"
                      className="form-select"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      required
                    >
                      <option value="">Select an employee</option>
                      {allEmployees
                        .filter(emp => !emp.supervisorId) // Only show employees without a supervisor
                        .map(employee => (
                          <option key={employee._id} value={employee.email}>
                            {employee.name} ({employee.email})
                          </option>
                        ))
                      }
                    </select>
                    <small className="text-muted mt-1">
                      <i className="bi bi-info-circle me-1"></i>
                      Only employees without a supervisor are shown.
                    </small>
                  </div>
                  
                  {/* Only show supervisor selection for superadmin */}
                  {user && user.role === 'superadmin' && (
                    <div className="col-md-4">
                      <label htmlFor="supervisorSelect" className="form-label">Assign to Supervisor (Optional)</label>
                      <select
                        className="form-select"
                        id="supervisorSelect"
                        value={selectedSupervisorId}
                        onChange={(e) => setSelectedSupervisorId(e.target.value)}
                      >
                        <option value="">Add to my team</option>
                        {supervisors.map(supervisor => (
                          <option key={supervisor._id} value={supervisor._id}>
                            {supervisor.name} ({supervisor.email})
                          </option>
                        ))}
                      </select>
                      <small className="text-muted mt-1">
                        <i className="bi bi-info-circle me-1"></i>
                        Leave empty to add to your own team.
                      </small>
                    </div>
                  )}
                  
                  <div className="col-md-4">
                    <Button 
                      type="submit" 
                      variant="primary"
                      className="w-100 d-flex align-items-center justify-content-center"
                      disabled={addingMember}
                      loading={addingMember}
                    >
                      <i className="bi bi-person-plus me-2"></i>
                      {addingMember ? 'Adding...' : 'Add to Team'}
                    </Button>
                  </div>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
      
      {/* Team Members List */}
      <div className="row mb-4">
        <div className="col-12">
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-light border-bottom">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 d-flex align-items-center">
                  <i className="bi bi-people text-primary me-2"></i>
                  Team Members
                  <Badge variant="primary" className="ms-2">
                    {teamMembers.length}
                  </Badge>
                </h5>
                {teamMembers.length > 0 && (
                  <Badge variant="info" className="fs-6">
                    <i className="bi bi-clock me-1"></i>
                    {pendingEntries.length} pending entries
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {teamMembers.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-people text-muted mb-3" style={{ fontSize: '4rem' }}></i>
                  <h4 className="text-muted">No team members yet</h4>
                  <p className="text-muted mb-4">
                    Add employees to your team using their email addresses above.
                  </p>
                  <Button variant="outline-primary" onClick={() => document.getElementById('memberEmail')?.focus()}>
                    <i className="bi bi-person-plus me-2"></i>
                    Add Your First Team Member
                  </Button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="border-0 fw-semibold text-muted">
                          <i className="bi bi-person me-1"></i>Name
                        </th>
                        <th className="border-0 fw-semibold text-muted">
                          <i className="bi bi-envelope me-1"></i>Email
                        </th>
                        <th className="border-0 fw-semibold text-muted">
                          <i className="bi bi-shield me-1"></i>Role
                        </th>
                        <th className="border-0 fw-semibold text-muted">
                          <i className="bi bi-clock-history me-1"></i>Pending
                        </th>
                        <th className="border-0 fw-semibold text-muted">
                          <i className="bi bi-stopwatch me-1"></i>Hours
                        </th>
                        <th className="border-0 fw-semibold text-muted">
                          <i className="bi bi-calendar-plus me-1"></i>Joined
                        </th>
                        <th className="border-0 fw-semibold text-muted text-center">
                          <i className="bi bi-gear me-1"></i>Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.map((member) => {
                        const pendingCount = getPendingEntriesForMember(member._id).length;
                        const pendingHours = getTotalHoursForMember(member._id);
                        
                        return (
                          <tr key={member._id} className="align-middle">
                            <td className="border-0">
                              <div className="d-flex align-items-center">
                                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" 
                                     style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                                  {member.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <span className="fw-semibold text-dark">{member.name}</span>
                              </div>
                            </td>
                            <td className="border-0">
                              <span className="text-muted">{member.email}</span>
                            </td>
                            <td className="border-0">
                              <Badge variant="info" className="fw-normal">
                                {member.role}
                              </Badge>
                            </td>
                            <td className="border-0">
                              {pendingCount > 0 ? (
                                <Badge variant="warning">
                                  <i className="bi bi-clock me-1"></i>
                                  {pendingCount} pending
                                </Badge>
                              ) : (
                                <span className="text-muted">No pending</span>
                              )}
                            </td>
                            <td className="border-0">
                              {pendingHours > 0 ? (
                                <span className="fw-bold text-warning">
                                  {pendingHours.toFixed(1)}h
                                </span>
                              ) : (
                                <span className="text-muted">0h</span>
                              )}
                            </td>
                            <td className="border-0">
                              <small className="text-muted">
                                {new Date(member.createdAt).toLocaleDateString()}
                              </small>
                            </td>
                            <td className="border-0 text-center">
                              <div className="btn-group" role="group">
                                {pendingCount > 0 && (
                                  <Button
                                    variant="outline-warning"
                                    size="sm"
                                    as={Link}
                                    to="/supervisor/approvals"
                                    title="Review pending entries"
                                    className="d-flex align-items-center"
                                  >
                                    <i className="bi bi-clock me-1"></i>
                                    Review
                                  </Button>
                                )}
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleRemoveMember(member._id, member.name)}
                                  disabled={removingMember === member._id}
                                  loading={removingMember === member._id}
                                  title="Remove from team"
                                  className="d-flex align-items-center"
                                >
                                  <i className="bi bi-person-dash me-1"></i>
                                  Remove
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Pending Entries Summary */}
      {pendingEntries.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <Card className="border-warning shadow-sm">
              <CardHeader className="bg-warning text-dark border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 d-flex align-items-center">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    Team Pending Time Entries
                    <Badge variant="dark" className="ms-2">
                      {pendingEntries.length}
                    </Badge>
                  </h5>
                  <Button 
                    variant="dark" 
                    size="sm" 
                    as={Link} 
                    to="/supervisor/approvals"
                    className="d-flex align-items-center"
                  >
                    <i className="bi bi-check-all me-1"></i>
                    Review All
                  </Button>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="border-0 fw-semibold text-muted">
                          <i className="bi bi-person me-1"></i>Employee
                        </th>
                        <th className="border-0 fw-semibold text-muted">
                          <i className="bi bi-calendar3 me-1"></i>Date
                        </th>
                        <th className="border-0 fw-semibold text-muted">
                          <i className="bi bi-folder me-1"></i>Project
                        </th>
                        <th className="border-0 fw-semibold text-muted">
                          <i className="bi bi-clock me-1"></i>Hours
                        </th>
                        <th className="border-0 fw-semibold text-muted">
                          <i className="bi bi-card-text me-1"></i>Description
                        </th>
                        <th className="border-0 fw-semibold text-muted text-center">
                          <i className="bi bi-gear me-1"></i>Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingEntries.slice(0, 5).map((entry) => (
                        <tr key={entry._id} className="align-middle">
                          <td className="border-0">
                            <div className="d-flex align-items-center">
                              <div className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center me-2" 
                                   style={{ width: '28px', height: '28px', fontSize: '12px' }}>
                                {entry.userId?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <span className="fw-semibold">{entry.userId?.name || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="border-0">
                            <span className="fw-medium">
                              {new Date(entry.date).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="border-0">
                            <Badge variant="info" className="fw-normal">
                              {entry.project || 'No Project'}
                            </Badge>
                          </td>
                          <td className="border-0">
                            <span className="fw-bold text-primary">
                              {((entry.minutes || 0) / 60).toFixed(1)}h
                            </span>
                          </td>
                          <td className="border-0">
                            <div className="text-muted" style={{ maxWidth: '200px' }}>
                              {Array.isArray(entry.task) ? entry.task.join(', ') : (entry.task || 'No description')}
                            </div>
                          </td>
                          <td className="border-0 text-center">
                            <Button
                              variant="outline-warning"
                              size="sm"
                              as={Link}
                              to="/supervisor/approvals"
                              className="d-flex align-items-center"
                            >
                              <i className="bi bi-eye me-1"></i>
                              Review
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {pendingEntries.length > 5 && (
                  <div className="card-footer bg-light text-center border-top">
                    <Button 
                      variant="warning" 
                      as={Link} 
                      to="/supervisor/approvals"
                      className="d-flex align-items-center justify-content-center"
                    >
                      <i className="bi bi-list-check me-2"></i>
                      View All {pendingEntries.length} Pending Entries
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Team Stats */}
      {teamMembers.length > 0 && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card bg-light">
              <div className="card-body">
                <div className="row text-center">
                  <div className="col-md-3">
                    <strong>Total Team Members:</strong> {teamMembers.length}
                  </div>
                  <div className="col-md-3">
                    <strong>Active Employees:</strong> {teamMembers.filter(m => m.role === 'employee').length}
                  </div>
                  <div className="col-md-3">
                    <strong>Pending Entries:</strong> {pendingEntries.length}
                  </div>
                  <div className="col-md-3">
                    <strong>Pending Hours:</strong> {pendingEntries.reduce((total, entry) => total + ((entry.minutes || 0) / 60), 0).toFixed(1)}h
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamManagement;