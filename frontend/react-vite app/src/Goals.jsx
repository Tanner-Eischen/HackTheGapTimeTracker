import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardBody, CardHeader, CardTitle } from './components/ui/Card';
import Button from './components/ui/Button';
import { Badge } from './components/ui/Badge';
import NotiComponent from './Notification';
import DashboardButton from './components/ui/DashboardButton';

function Goals({addNotification}) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState("");
  const [hourInput, setHourInput] = useState("");
  const [message, setMessage] = useState("");

  // 🔒 Redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else {
      fetchProjects(token);
    }
  }, []);

  const fetchProjects = async (token) => {
    try {
      const res = await axios.get("/api/goals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(res.data);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/goals",
        {
          name: projectName,
          description,
          tasks,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      addNotification({ 
        id: Date.now(), 
        name: `Project Created: ${projectName}`, 
        description: description, 
        read: false
      });
      setMessage("Project created!");
      setProjectName("");
      setDescription("");
      setTasks([]);
      fetchProjects(token);
    } catch (err) {
      console.error(err);
      setMessage("Failed to create project.");
    }
  };

  function getRandomHexColor(usedColors = []) {
    let hexColor;

    do {
      hexColor = Math.floor(Math.random() * 16777215).toString(16);
      hexColor = "#" + ("000000" + hexColor).slice(-6);
    } while (
      hexColor.toLowerCase() === "#ffffff" || //  avoid white
      usedColors.includes(hexColor.toLowerCase()) //  avoid duplicates in same project
    );

    return hexColor;
  }

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    if (taskInput.trim() !== "") {
      const usedColors = tasks.map((t) => t.color.toLowerCase());
      const color = getRandomHexColor(usedColors);
      setTasks([...tasks, { id: Date.now(), name: taskInput, hour: hourInput, color }]);
      setTaskInput("");
      setHourInput("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const selectedProject = projects.find((p) => p._id === selectedProjectId);

  return (
    <div className="min-vh-100 bg-light" style={{ padding: "64px 24px 24px 24px" }}>
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
                      Goals
                    </li>
                  </ol>
                </nav>
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-bullseye text-primary me-2 fs-3"></i>
                  <h1 className="text-dark mb-0" id="tab-projects">Goals & Projects</h1>
                </div>
                <p className="text-muted mb-0">Create and manage your project goals and tasks</p>
              </div>
              <div className="d-flex align-items-center gap-2">
                <DashboardButton size="sm" />
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

        {/* Success Message */}
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
          {/* Create New Project */}
          <div className="col-lg-8 mb-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-light border-bottom">
                <CardTitle className="mb-0 d-flex align-items-center">
                  <i className="bi bi-plus-circle text-primary me-2"></i>
                  Create New Project
                </CardTitle>
              </CardHeader>
              <CardBody>
                <div className="alert alert-info mb-3 py-2">
                  Create a project and task on the Goals page to easily add descriptions.
                </div>
                <form onSubmit={handleProjectSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-medium text-dark">
                      <i className="bi bi-folder me-2 text-muted"></i>
                      Project Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter project name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      required
                      className="form-control form-control-lg border-2"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-medium text-dark">
                      <i className="bi bi-card-text me-2 text-muted"></i>
                      Description
                    </label>
                    <textarea
                      placeholder="Describe your project goals and objectives"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="form-control border-2"
                      rows="3"
                    />
                  </div>

                  {/* Task Input Section */}
                  <div className="mb-4">
                    <h5 className="fw-semibold text-dark mb-3">
                      <i className="bi bi-list-task me-2 text-primary"></i>
                      Add Tasks
                    </h5>
                    <div className="row g-2 align-items-end">
                      <div className="col-md-6">
                        <label className="form-label small text-muted">Task Name</label>
                        <input
                          type="text"
                          placeholder="Enter task name"
                          value={taskInput}
                          onChange={(e) => setTaskInput(e.target.value)}
                          className="form-control"
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small text-muted">Hours/Week</label>
                        <input
                          type="number"
                          placeholder="Hours"
                          value={hourInput}
                          onChange={(e) => setHourInput(e.target.value)}
                          className="form-control"
                          min="0"
                          step="0.5"
                        />
                      </div>
                      <div className="col-md-3">
                        <Button
                          type="button"
                          onClick={handleTaskSubmit}
                          variant="outline-primary"
                          className="w-100"
                        >
                          <i className="bi bi-plus me-1"></i>
                          Add Task
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Tasks List */}
                  {tasks.length > 0 && (
                    <div className="mb-4">
                      <h6 className="fw-semibold text-dark mb-3">Project Tasks</h6>
                      <div className="list-group">
                        {tasks.map((task) => (
                          <div
                            key={task.id}
                            className="list-group-item d-flex justify-content-between align-items-center border-0 bg-light mb-2 rounded"
                          >
                            <div className="d-flex align-items-center">
                              <div 
                                className="rounded-circle me-3" 
                                style={{ 
                                  width: '12px', 
                                  height: '12px', 
                                  backgroundColor: task.color 
                                }}
                              ></div>
                              <span className="fw-medium">{task.name}</span>
                            </div>
                            <Badge variant="primary">
                              {task.hour} hrs/week
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="d-grid">
                    <Button 
                      type="submit" 
                      variant="success" 
                      size="lg"
                      disabled={!projectName.trim()}
                    >
                      <i className="bi bi-check-lg me-2"></i>
                      Create Project
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </div>

          {/* Project Selection */}
          <div className="col-lg-4 mb-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-light border-bottom">
                <CardTitle className="mb-0 d-flex align-items-center">
                  <i className="bi bi-folder2-open text-primary me-2"></i>
                  Select Project
                </CardTitle>
              </CardHeader>
              <CardBody>
                <div className="mb-3">
                  <label className="form-label fw-medium text-dark">
                    <i className="bi bi-funnel me-2 text-muted"></i>
                    Choose Project
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="form-select form-select-lg border-2"
                  >
                    <option value="">-- Select Project --</option>
                    {projects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProject && (
                  <div className="mt-4">
                    <h6 className="fw-semibold text-dark mb-3">Project Details</h6>
                    <div className="bg-light rounded p-3">
                      <h6 className="text-primary mb-2">{selectedProject.name}</h6>
                      <p className="text-muted small mb-3">{selectedProject.description}</p>
                      
                      {selectedProject.tasks && selectedProject.tasks.length > 0 && (
                        <div>
                          <small className="text-muted fw-medium">Tasks:</small>
                          <div className="mt-2">
                            {selectedProject.tasks.map((task, index) => (
                              <div key={index} className="d-flex justify-content-between align-items-center mb-1">
                                <small className="text-dark">{task.name}</small>
                                <Badge variant="outline-primary" className="small">
                                  {task.hour}h
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Goals;
