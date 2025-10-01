import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader } from './components/ui/Card';
import Button from './components/ui/Button';
import DashboardButton from './components/ui/DashboardButton';
import { Badge, StatusBadge } from './components/ui/Badge';

function ApprovalQueue() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [groupByEmployee, setGroupByEmployee] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [processingEntries, setProcessingEntries] = useState(new Set());

  useEffect(() => {
    fetchPendingEntries();
  }, []);

  const fetchPendingEntries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/pending-entries', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const pendingEntries = await response.json();
        setEntries(pendingEntries);
        setMessage('');
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || 'Failed to load entries');
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
      setMessage('Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (entryId) => {
    setProcessingEntries(prev => new Set([...prev, entryId]));
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/time-entry/${entryId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        setEntries(prevEntries => prevEntries.filter(entry => entry._id !== entryId));
        setMessage('Entry approved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setMessage(`Failed to approve entry: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error approving entry:', error);
      setMessage('Failed to approve entry. Please try again.');
    } finally {
      setProcessingEntries(prev => {
        const newSet = new Set(prev);
        newSet.delete(entryId);
        return newSet;
      });
    }
  };

  const handleReject = async (entryId) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    
    setProcessingEntries(prev => new Set([...prev, entryId]));
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/time-entry/${entryId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: reason || 'No reason provided' })
      });

      if (response.ok) {
        setEntries(prevEntries => prevEntries.filter(entry => entry._id !== entryId));
        setMessage('Entry rejected successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setMessage(`Failed to reject entry: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error rejecting entry:', error);
      setMessage('Failed to reject entry. Please try again.');
    } finally {
      setProcessingEntries(prev => {
        const newSet = new Set(prev);
        newSet.delete(entryId);
        return newSet;
      });
    }
  };

  // Helper functions
  const getUniqueEmployees = () => {
    const employees = entries.reduce((acc, entry) => {
      const employeeId = entry.userId?._id;
      const employeeName = entry.userId?.name || 'Unknown User';
      if (employeeId && !acc.find(emp => emp.id === employeeId)) {
        acc.push({ id: employeeId, name: employeeName });
      }
      return acc;
    }, []);
    return employees.sort((a, b) => a.name.localeCompare(b.name));
  };

  const getFilteredEntries = () => {
    if (selectedEmployee === 'all') {
      return entries;
    }
    return entries.filter(entry => entry.userId?._id === selectedEmployee);
  };

  const getGroupedEntries = () => {
    const filtered = getFilteredEntries();
    if (!groupByEmployee) {
      return { 'All Entries': filtered };
    }

    return filtered.reduce((groups, entry) => {
      const employeeName = entry.userId?.name || 'Unknown User';
      if (!groups[employeeName]) {
        groups[employeeName] = [];
      }
      groups[employeeName].push(entry);
      return groups;
    }, {});
  };

  const getMessageVariant = (message) => {
    if (message.includes('successfully')) return 'success';
    if (message.includes('Failed')) return 'danger';
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
            <p className="text-muted">Loading approval queue...</p>
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
                    Approval Queue
                  </li>
                </ol>
              </nav>
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-clipboard-check text-primary me-2 fs-3"></i>
                <h1 className="text-dark mb-0" id="supervisor-approvals">Approval Queue</h1>
              </div>
              <p className="text-muted mb-0">Review and approve pending time entries from your team</p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <DashboardButton />
              <Button 
                variant="danger" 
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  window.location.href = "/login";
                }}
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
            <div className={`alert alert-${getMessageVariant(message)} d-flex align-items-center`} role="alert">
              <i className={`bi ${
                getMessageVariant(message) === 'success' ? 'bi-check-circle-fill' :
                getMessageVariant(message) === 'danger' ? 'bi-exclamation-triangle-fill' :
                'bi-info-circle-fill'
              } me-2`}></i>
              {message}
            </div>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      {entries.length > 0 && (
        <Card className="mb-4 border-0 shadow-sm">
          <CardBody className="py-3">
            <div className="row align-items-center">
              <div className="col-md-4">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="groupByEmployee"
                    checked={groupByEmployee}
                    onChange={(e) => setGroupByEmployee(e.target.checked)}
                  />
                  <label className="form-check-label fw-medium" htmlFor="groupByEmployee">
                    <i className="bi bi-people me-1"></i>
                    Group by Employee
                  </label>
                </div>
              </div>
              <div className="col-md-4">
                <div className="d-flex align-items-center">
                  <i className="bi bi-funnel text-muted me-2"></i>
                  <select
                    className="form-select form-select-sm"
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                  >
                    <option value="all">All Employees</option>
                    {getUniqueEmployees().map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-4 text-end">
                <Badge variant="light" className="fs-6">
                  <i className="bi bi-list-ul me-1"></i>
                  {getFilteredEntries().length} of {entries.length} entries
                </Badge>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Entries Display */}
      <div className="row">
        <div className="col-12">
          {Object.entries(getGroupedEntries()).map(([groupName, groupEntries]) => (
            <Card key={groupName} className="mb-4 border-0 shadow-sm">
              <CardHeader className="bg-light border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 d-flex align-items-center">
                    {groupByEmployee && groupName !== 'All Entries' ? (
                      <>
                        <i className="bi bi-person-circle text-primary me-2"></i>
                        <span className="text-dark">{groupName}</span>
                        <Badge variant="warning" className="ms-2">
                          {groupEntries.length} entries
                        </Badge>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-clock-history text-primary me-2"></i>
                        <span className="text-dark">Pending Time Entries</span>
                        <Badge variant="primary" className="ms-2">
                          {groupEntries.length}
                        </Badge>
                      </>
                    )}
                  </h5>
                  {groupEntries.length > 0 && (
                    <Badge variant="info" className="fs-6">
                      <i className="bi bi-stopwatch me-1"></i>
                      Total: {groupEntries
                        .reduce((total, entry) => total + (entry.minutes || 0) / 60, 0)
                        .toFixed(1)}h
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardBody className="p-0">
                {groupEntries.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-check-circle text-success mb-3" style={{ fontSize: '3rem' }}></i>
                    <h5 className="text-muted">No pending entries</h5>
                    <p className="text-muted mb-0">All time entries have been reviewed.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="border-0 fw-semibold text-muted">
                            <i className="bi bi-calendar3 me-1"></i>Date
                          </th>
                          {!groupByEmployee && (
                            <th className="border-0 fw-semibold text-muted">
                              <i className="bi bi-person me-1"></i>Employee
                            </th>
                          )}
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
                            <i className="bi bi-gear me-1"></i>Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupEntries.map((entry) => (
                          <tr key={entry._id} className="align-middle">
                            <td className="border-0">
                              <span className="fw-medium">
                                {new Date(entry.date).toLocaleDateString()}
                              </span>
                            </td>
                            {!groupByEmployee && (
                              <td className="border-0">
                                <div>
                                  <div className="fw-semibold text-dark">
                                    {entry.userId?.name || 'Unknown User'}
                                  </div>
                                  <small className="text-muted">{entry.userId?.email}</small>
                                </div>
                              </td>
                            )}
                            <td className="border-0">
                              <Badge 
                                variant={entry.project === 'No Project' ? 'secondary' : 'info'}
                                className="fw-normal"
                              >
                                {entry.project || 'No Project'}
                              </Badge>
                            </td>
                            <td className="border-0">
                              <span className="fw-bold text-primary fs-6">
                                {((entry.minutes || 0) / 60).toFixed(1)}h
                              </span>
                            </td>
                            <td className="border-0">
                              <div className="text-muted" style={{ maxWidth: '200px' }}>
                                {Array.isArray(entry.task)
                                  ? entry.task.join(', ')
                                  : entry.task || 'No description'}
                              </div>
                            </td>
                            <td className="border-0 text-center">
                              <div className="btn-group" role="group">
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleApprove(entry._id)}
                                  disabled={processingEntries.has(entry._id)}
                                  loading={processingEntries.has(entry._id)}
                                  title="Approve this time entry"
                                  className="d-flex align-items-center"
                                >
                                  <i className="bi bi-check-lg me-1"></i>
                                  Approve
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleReject(entry._id)}
                                  disabled={processingEntries.has(entry._id)}
                                  loading={processingEntries.has(entry._id)}
                                  title="Reject this time entry"
                                  className="d-flex align-items-center"
                                >
                                  <i className="bi bi-x-lg me-1"></i>
                                  Reject
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
          ))}
        </div>
      </div>
    </div>
  );
}

export default ApprovalQueue;
