import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { v4 as uuidv4 } from "uuid";
import { Card, CardBody, CardHeader, CardTitle } from './components/ui/Card';
import Button from './components/ui/Button';
import DashboardButton from './components/ui/DashboardButton';

import { Badge, StatusBadge } from './components/ui/Badge';
import Modal from './components/ui/Modal.jsx';

/** ---- Helpers (LOCAL time; single source of truth) ---- */
const toLocalISO = (d = new Date()) => {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10); // YYYY-MM-DD
};
const toLocalDate = (isoDate) => new Date(`${isoDate}T00:00:00`);
const sameLocalDay = (a, b) => toLocalISO(a) === toLocalISO(b);

function ClockPage() {
  const navigate = useNavigate();
  const [view, setView] = useState("manual");

  // Live "now" clock
  const [now, setNow] = useState(new Date());

  // Session state
  const [tasks, setTask] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);

  // Timer session
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [totalTime, setTotalTime] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [pausedTime, setPausedTime] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState(null);
  const [maxDurationReached, setMaxDurationReached] = useState(false);
  
  // Maximum timer duration in hours (8 hours = 28800000 ms)
  const MAX_TIMER_DURATION = 8 * 60 * 60 * 1000;
  
  // Confirmation dialog state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState({
    startTime: null,
    endTime: null,
    elapsedMs: 0,
    pausedTime: 0,
    project: "",
    tasks: [],
    adjustedMinutes: 0
  });

  // Manual form
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");
  const [manualDate, setManualDate] = useState(toLocalISO());
  const [manualTask, setManualTask] = useState([]);
  const [manualProject, setManualProject] = useState("");

  // If you use a Vite proxy, leave this as ''. Otherwise set to 'http://localhost:4000'
  const API_BASE = import.meta.env?.VITE_API_BASE_URL || "";

  const timerRef = useRef(null);
  const nowRef = useRef(null);

  /** Fetch projects and logs */
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const [projectsRes, logsRes] = await Promise.all([
          axios.get("/api/goals", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("/api/time", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (!isMounted) return;
        setProjects(projectsRes.data);
        setWorkLogs(logsRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  /** Start the session */
  const handleStart = () => {
    const now = new Date();
    setStartTime(now);
    setEndTime(null);
    setElapsedMs(0);
    setTotalTime("");
    setIsPaused(false);
    setPausedTime(0);
    setPauseStartTime(null);
    setMaxDurationReached(false);
  };

  /** Pause the timer */
  const handlePause = () => {
    if (!isPaused) {
      setIsPaused(true);
      setPauseStartTime(new Date());
    } else {
      // Calculate additional paused time
      const pauseDuration = new Date() - pauseStartTime;
      setPausedTime(prevPausedTime => prevPausedTime + pauseDuration);
      setIsPaused(false);
      setPauseStartTime(null);
    }
  };

  /** Stop the session and submit */
  const handleStop = async (e) => {
    e.preventDefault();
    const end = new Date();
    
    // If paused when stopping, add the current pause duration
    let totalPausedTime = pausedTime;
    if (isPaused && pauseStartTime) {
      totalPausedTime += (end - pauseStartTime);
    }
    
    // Calculate actual working duration (excluding paused time)
    const actualDuration = (end - startTime - totalPausedTime) / 60000;
    
    // Ensure minimum duration of 1 minute
    const minutes = Math.max(1, Math.round(actualDuration));
    
    // Use LOCAL date (fixes UTC drift)
    const entryDate = toLocalISO(startTime);
    
    // Open confirmation dialog with current data
    setConfirmationData({
      startTime: startTime,
      endTime: end,
      elapsedMs: end - startTime - totalPausedTime,
      pausedTime: totalPausedTime,
      project: selectedProject,
      tasks: [...selectedTasks],
      adjustedMinutes: minutes
    });
    
    setShowConfirmation(true);
  };
  
  /** Handle confirmation submission */
  const handleConfirmSubmit = async () => {
    // Format for display
    setEndTime(confirmationData.endTime);
    
    const hours = Math.floor(confirmationData.adjustedMinutes / 60);
    const remainingMinutes = confirmationData.adjustedMinutes % 60;
    setTotalTime(`${hours} hrs ${remainingMinutes} min`);

    // Use LOCAL date (fixes UTC drift)
    const entryDate = toLocalISO(confirmationData.startTime);
    
    try {
      const token = localStorage.getItem("token");
      
      await axios.post('/api/time', {
        date: entryDate,
        minutes: confirmationData.adjustedMinutes,
        tasks: confirmationData.tasks.map(t => ({
          id: t.id || t._id || uuidv4(),
          name: t.name || t,
          color: t.color,
          hour: t.hour
        })),
        project: confirmationData.project,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setWorkLogs(prev => [
        ...prev,
        {
          date: entryDate,
          minutes: confirmationData.adjustedMinutes,
          tasks: confirmationData.tasks.map(t => ({
            id: t.id || t._id,
            name: t.name,
            hour: t.hour,
            color: t.color
          })),
          project: confirmationData.project,
        }
      ]);
      setSelectedTasks([]);
      setSelectedProject('');
      setShowConfirmation(false);

      alert('Time entry submitted successfully!');
    } catch (err) {
      console.error("Error submitting time entry:", err);
      alert(`Failed to submit time entry: ${err.response?.data?.message || err.message}`);
    }
  };
  
  /** Cancel confirmation dialog */
  const handleCancelSubmit = () => {
    setShowConfirmation(false);
  };

  function handleManualTaskChange(task) {
    setManualTask((prev) => {
      const taskId = task.id || task._id;
      if (prev.some((t) => t.id === taskId)) {
        return prev.filter((t) => t.id !== taskId);
      } else {
        return [
          ...prev,
          { id: taskId, name: task.name, hour: task.hour, color: task.color },
        ];
      }
    });
  }

  function handleTaskChange(task) {
    setSelectedTasks((prev) => {
      const taskId = task.id || task._id;
      if (prev.some((t) => t.id === taskId)) {
        return prev.filter((t) => t.id !== taskId);
      } else {
        return [
          ...prev,
          { id: taskId, name: task.name, hour: task.hour, color: task.color },
        ];
      }
    });
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      // Only require time and date fields (tasks and projects are optional)
      if (!manualStart || !manualEnd || !manualDate) {
        alert('Please complete date, start time, and end time fields.');
        return;
      }
      
      const start = new Date(`1970-01-01T${manualStart}`);
      const end = new Date(`1970-01-01T${manualEnd}`);
      const duration = (end - start) / 60000;
      
      if (duration <= 0) {
        alert("End time must be after start time.");
        return;
      }
      
      const token = localStorage.getItem("token");

      await axios.post('/api/time', {
        date: manualDate, // already a local YYYY-MM-DD from <input type="date">
        minutes: Math.round(duration),
        tasks: manualTask, // Will be empty array if no tasks selected
        project: manualProject, // Will be empty string if no project selected
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setWorkLogs(prev => [
        ...prev,
        {
          date: manualDate,
          minutes: Math.round(duration),
          tasks: manualTask.map((t) => ({
            id: t.id || t._id || uuidv4(),
            name: t.name,
            color: t.color,
            hour: t.hour,
          })),
          project: manualProject,
        },
      ]);

      setManualTask([]);
      setManualStart("");
      setManualEnd("");
      setManualDate("");
      setManualProject("");
    } catch (err) {
      console.error(err);
    }
  };

  /** Tick for elapsed time */
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (startTime && !endTime) {
      // Don't update elapsed time if paused
      if (!isPaused) {
        // Calculate elapsed time excluding all paused time
        const elapsed = Date.now() - startTime.getTime() - pausedTime;
        setElapsedMs(elapsed);
        
        // Check if max duration reached
        if (elapsed >= MAX_TIMER_DURATION && !maxDurationReached) {
          setMaxDurationReached(true);
          alert('Maximum timer duration of 8 hours reached! The timer will stop automatically.');
          handleStop({ preventDefault: () => {} });
        }
        
        timerRef.current = setInterval(() => {
          if (!isPaused) {
            const currentElapsed = Date.now() - startTime.getTime() - pausedTime;
            setElapsedMs(currentElapsed);
            
            // Check max duration in the interval too
            if (currentElapsed >= MAX_TIMER_DURATION && !maxDurationReached) {
              setMaxDurationReached(true);
              alert('Maximum timer duration of 8 hours reached! The timer will stop automatically.');
              handleStop({ preventDefault: () => {} });
            }
          }
        }, 1000);
      }
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTime, endTime, isPaused, pausedTime]);

  /** Update live clock */
  useEffect(() => {
    if (nowRef.current) clearInterval(nowRef.current);
    nowRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(nowRef.current);
  }, []);

  const formatHMS = (ms) => {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const formatMinutes = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h} hrs ${m} min`;
  };

  const formatDate = (d) =>
    d?.toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    }) || "";

  const formatTime = (d) =>
    d?.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) || "";

  const getWeekNumber = (date) => {
    const d = toLocalDate(toLocalISO(date));
    const start = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - start) / 86400000) + start.getDay() + 1) / 7);
  };

  /** Totals calculation (LOCAL) */
  const getTotals = () => {
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let todayTotal = 0,
      weekTotal = 0,
      monthTotal = 0;

    workLogs.forEach((log) => {
      const d = toLocalDate(log.date);
      if (sameLocalDay(d, now)) todayTotal += log.minutes;
      if (getWeekNumber(d) === currentWeek) weekTotal += log.minutes;
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear)
        monthTotal += log.minutes;
    });

    return {
      today: formatMinutes(todayTotal),
      week: formatMinutes(weekTotal),
      month: formatMinutes(monthTotal),
    };
  };

  const totals = React.useMemo(() => getTotals(), [workLogs, elapsedMs, startTime, endTime, now]);
  const { today, week, month } = totals;

  return (
    <div className="min-vh-100 bg-light" style={{ padding: "64px 24px 24px 24px" }}>
      <div className="container">
        {/* Header */}
        <div className="row mb-3">
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
                    Time Tracking
                  </li>
                </ol>
              </nav>
              <div className="d-flex align-items-center mb-0">
                <i className="bi bi-clock text-primary me-2 fs-3"></i>
                <h1 className="text-dark mb-0">Track Your Hours</h1>
              </div>
              <p className="text-muted mb-0">Record and manage your work hours</p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <DashboardButton size="sm" />
              <Button 
                variant="outline-danger" 
                size="sm"
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  window.location.href = "/login";
                }}
                className="d-flex align-items-center"
              >
                <i className="bi bi-box-arrow-right me-1"></i>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Header date */}
      <div className="row mb-2">
        <div className="col-12">
          <div className="py-2">
            
            <h5 className="mb-0"><i className="bi bi-calendar text-primary me-2"></i>{formatDate(now)}</h5>
            <h7>Today's Date</h7>
          </div>
        </div>
      </div>
      
      <hr className="mb-4" />

      {/* View toggle */}
      <div className="row mb-4">
        <div className="col-12 d-flex justify-content-between align-items-center">
          <div className="fw-bold fs-4">{view === "clock" ? <><i className="bi bi-stopwatch me-2 text-primary"></i>Timer</> : <><i className="bi bi-pencil-square text-primary me-2"></i>Manual Time Entry</>}</div>
          <Button 
            variant="outline-primary"
            onClick={() => setView(view === "clock" ? "manual" : "clock")}
          >
            {view === "clock" ? <><i className="bi bi-pencil-square me-2"></i>Switch to Manual Entry</> : <><i className="bi bi-stopwatch me-2"></i>Switch to Timer</>}
          </Button>
        </div>
      </div>

      {/* Clock view */}
      {view === "clock" ? (
        <div className="row">
          <div className="col-lg-8">
            <Card className="shadow">

              <CardBody>
               <div className="alert alert-info mb-4">
                 
                  
                  Tip: use the Goals page to create reusable project and task descriptions.         
                </div>
                <div className="row mb-4">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold"><i className="bi bi-folder me-2 text-primary"></i>Project</label>
                    <select 
                      className="form-select"
                      value={selectedProject} 
                      onChange={(e) => setSelectedProject(e.target.value)}
                    >
                      <option value="">Select a project</option>
                      {projects.map((p) => (
                        <option key={p._id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold"><i className="bi bi-list-check me-2 text-primary"></i>Tasks</label>
                    <div className="border rounded p-3" style={{ maxHeight: "180px", overflowY: "auto" }}>
                      {selectedProject ? (
                        projects.find(p => p.name === selectedProject)?.tasks?.length > 0 ? (
                          projects.find(p => p.name === selectedProject)?.tasks?.map(t => (
                            <div key={t._id} className="form-check mb-2">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`task-${t._id}`}
                                checked={selectedTasks.some(task => task.id === (t.id || t._id))}
                                onChange={() => handleTaskChange(t)}
                              />
                              <label 
                                className="form-check-label"
                                htmlFor={`task-${t._id}`}
                              >
                                {t.name}
                                {t.color && <Badge variant="secondary" className="ms-2" style={{backgroundColor: t.color}}>&nbsp;</Badge>}
                              </label>
                            </div>
                          ))
                        ) : (
                          <div className="text-muted text-center py-2">
                            No tasks available for this project
                          </div>
                        )
                      ) : (
                        <div className="text-muted text-center py-2">
                          Select a project to see available tasks, or leave empty if no project applies
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-center mb-4">
                  <Card className="shadow-sm">
                    <CardHeader className="bg-primary">
                      <h5 className="mb-0"><i className="bi bi-alarm me-2 text-primary"></i>Elapsed Time</h5>
                    </CardHeader>
                    <CardBody>
                      <h1 className="display-4 mb-3 font-monospace">
                        {startTime ? (endTime ? formatHMS(endTime - startTime - pausedTime) : formatHMS(elapsedMs)) : "00:00:00"}
                      </h1>
                      {startTime && !endTime && (
                        <div className="mb-2">
                          <StatusBadge status={isPaused ? "warning" : "info"}>
                            {isPaused ? <><i className="bi bi-pause-circle me-2"></i>Timer Paused</> : <><i className="bi bi-stopwatch me-2"></i>Timer Running</>}
                          </StatusBadge>
                        </div>
                      )}
                      <div className="text-muted">
                        {startTime && (
                          <>
                            <strong>Started:</strong> {formatDate(startTime)} • {formatTime(startTime)}
                          </>
                        )}
                      </div>
                      {endTime && totalTime && (
                        <div className="mt-2">
                          <StatusBadge status="success">
                            <i className="bi bi-check-circle me-2"></i>Total hours: {totalTime}
                          </StatusBadge>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </div>

                <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                  <Button 
                    variant="outline-success"
                    className="me-md-2"
                    onClick={handleStart} 
                    disabled={!!startTime && !endTime}
                  >
                    <i className="bi bi-play-fill me-2"></i>Start
                  </Button>
                  {startTime && !endTime && (
                    <Button 
                      variant={isPaused ? "outline-warning" : "outline-secondary"}
                      className="me-md-2"
                      onClick={handlePause}
                    >
                      {isPaused ? <><i className="bi bi-play-fill me-2"></i>Resume</> : <><i className="bi bi-pause-fill me-2"></i>Pause</>}
                    </Button>
                  )}
                  <Button 
                    variant="outline-danger"
                    onClick={() => handleStop({ preventDefault: () => {} })} 
                    disabled={!startTime || !!endTime}
                    className="btn-hover-enabled"
                  >
                    <i className="bi bi-stop-fill me-2"></i>Stop
                  </Button>
                </div>
                <div className="mt-3 text-center text-muted small">
                  <i className="bi bi-info-circle me-1 text-primary"></i>
                  Timer will automatically stop after 8 hours to prevent accidental long recordings.
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      ) : (
        // Manual Entry Form
        <div className="row">
          <div className="col-lg-8">
            <Card className="shadow">

              <CardBody>
                <div className="alert alert-info mb-4">
                 
                  Tip: use the Goals page to create reusable project and task descriptions.               </div>
                <form onSubmit={handleManualSubmit}>
                  <div className="row mb-4">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold"><i className="bi bi-folder me-2 text-primary"></i>Project</label>
                      <select 
                        className="form-select"
                        value={manualProject} 
                        onChange={(e) => setManualProject(e.target.value)}
                      >
                        <option value="">Select a project</option>
                        {projects.map((p) => (
                          <option key={p._id} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold"><i className="bi bi-list-check me-2 text-primary"></i>Tasks</label>
                      <div className="border rounded p-3" style={{ maxHeight: "180px", overflowY: "auto" }}>
                        {manualProject ? (
                          projects.find(p => p.name === manualProject)?.tasks?.length > 0 ? (
                            projects.find(p => p.name === manualProject)?.tasks?.map(t => (
                              <div key={t._id} className="form-check mb-2">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id={`manual-task-${t._id}`}
                                  checked={manualTask.some(task => task.id === (t.id || t._id))}
                                  onChange={() => handleManualTaskChange(t)}
                                />
                                <label 
                                  className="form-check-label"
                                  htmlFor={`manual-task-${t._id}`}
                                >
                                  {t.name}
                                  {t.color && <Badge variant="secondary" className="ms-2" style={{backgroundColor: t.color}}>&nbsp;</Badge>}
                                </label>
                              </div>
                            ))
                          ) : (
                            <div className="text-muted text-center py-2">
                              No tasks available for this project
                            </div>
                          )
                        ) : (
                          <div className="text-muted text-center py-2">
                            Select a project to see available tasks, or leave empty if no project applies
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="row mb-4">
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold"><i className="bi bi-calendar text-primary me-2"></i>Date <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="form-control"
                        value={manualDate}
                        onChange={(e) => setManualDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold"><i className="bi bi-clock text-primary me-2"></i>Start <span className="text-danger">*</span></label>
                      <input
                        type="time"
                        className="form-control"
                        value={manualStart}
                        onChange={(e) => setManualStart(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold"><i className="bi bi-clock-history text-primary me-2"></i>End <span className="text-danger">*</span></label>
                      <input
                        type="time"
                        className="form-control"
                        value={manualEnd}
                        onChange={(e) => setManualEnd(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="d-grid">
                    <Button type="submit" variant="outline-primary">
                      <i className="bi bi-save me-2"></i>Submit
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
      
      {/* Totals Summary */}
      <div className="row mt-5">
        <div className="col-lg-8">
          <Card className="shadow">
            <CardHeader className="bg-primary">
              <CardTitle className="mb-0"><i className="bi bi-bar-chart me-2 text-primary"></i>Time Summary</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="row text-center">
                <div className="col-md-4">
                  <h6 className="text-muted mb-2">Today</h6>
                  <Badge variant="primary" className="fs-6 px-3 py-2">{today}</Badge>
                </div>
                <div className="col-md-4">
                  <h6 className="text-muted mb-2">This Week</h6>
                  <Badge variant="warning" className="fs-6 px-3 py-2">{week}</Badge>
                </div>
                <div className="col-md-4">
                  <h6 className="text-muted mb-2">This Month</h6>
                  <Badge variant="success" className="fs-6 px-3 py-2">{month}</Badge>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      <Modal
        isOpen={showConfirmation}
        onClose={handleCancelSubmit}
        title="Confirm Time Entry"
        size="lg"
        footer={
          <div className="d-flex justify-content-end w-100">
            <Button 
              variant="outline-secondary" 
              onClick={handleCancelSubmit}
              className="me-2"
            >
              Cancel
            </Button>
            <Button 
              variant="success" 
              onClick={handleConfirmSubmit}
            >
              Submit Time Entry
            </Button>
          </div>
        }
      >
        <div className="container">
          <div className="alert alert-info mb-4">
            <i className="bi bi-info-circle me-2"></i>
            Please review and confirm your time entry. You can adjust the time, project, and tasks if needed.
          </div>
          
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label fw-bold">Elapsed Time</label>
                <div className="d-flex align-items-center">
                  <h3 className="mb-0 me-3">{formatHMS(confirmationData.elapsedMs)}</h3>
                  <Badge variant="primary">
                    {formatMinutes(confirmationData.adjustedMinutes)}
                  </Badge>
                </div>
              </div>
              
              <div className="mb-3">
                <label className="form-label fw-bold">Adjust Minutes</label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    value={confirmationData.adjustedMinutes}
                    onChange={(e) => setConfirmationData({
                      ...confirmationData,
                      adjustedMinutes: parseInt(e.target.value) || 0
                    })}
                    min="1"
                  />
                  <span className="input-group-text">minutes</span>
                </div>
                <small className="text-muted">Minimum 1 minute</small>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label fw-bold">📁 Project</label>
                <select 
                  className="form-select"
                  value={confirmationData.project} 
                  onChange={(e) => setConfirmationData({
                    ...confirmationData,
                    project: e.target.value
                  })}
                >
                  <option value="">Select a project</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-3">
                <label className="form-label fw-bold">📝 Tasks</label>
                <div className="border rounded p-3" style={{ maxHeight: "180px", overflowY: "auto" }}>
                  {confirmationData.project ? (
                    projects.find(p => p.name === confirmationData.project)?.tasks?.length > 0 ? (
                      projects.find(p => p.name === confirmationData.project)?.tasks?.map(t => (
                        <div key={t._id} className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`confirm-task-${t._id}`}
                            checked={confirmationData.tasks.some(task => task.id === (t.id || t._id))}
                            onChange={() => {
                              const isSelected = confirmationData.tasks.some(task => task.id === (t.id || t._id));
                              let updatedTasks;
                              
                              if (isSelected) {
                                updatedTasks = confirmationData.tasks.filter(task => task.id !== (t.id || t._id));
                              } else {
                                updatedTasks = [...confirmationData.tasks, t];
                              }
                              
                              setConfirmationData({
                                ...confirmationData,
                                tasks: updatedTasks
                              });
                            }}
                          />
                          <label 
                            className="form-check-label"
                            htmlFor={`confirm-task-${t._id}`}
                          >
                            {t.name}
                            {t.color && <Badge variant="secondary" className="ms-2" style={{backgroundColor: t.color}}>&nbsp;</Badge>}
                          </label>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted text-center py-2">
                        No tasks available for this project
                      </div>
                    )
                  ) : (
                    <div className="text-muted text-center py-2">
                      Select a project to see available tasks
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="row">
            <div className="col-12">
              <div className="d-flex justify-content-between text-muted small">
                <div>
                  <strong>Started:</strong> {formatDate(confirmationData.startTime)} • {formatTime(confirmationData.startTime)}
                </div>
                <div>
                  <strong>Ended:</strong> {formatDate(confirmationData.endTime)} • {formatTime(confirmationData.endTime)}
                </div>
              </div>
              {confirmationData.pausedTime > 0 && (
                <div className="text-muted small mt-1">
                  <strong>Paused time:</strong> {formatHMS(confirmationData.pausedTime)} (excluded from total)
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
      </div>
    </div>
  );
}

export default ClockPage;
