// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const jwt = require('jsonwebtoken');

const ProjectModel = require('./models/Projects');
const TimeEntry = require('./models/TimeEntry');
const NotificationModel = require('./models/Notification');
const UserModel = require('./models/User');
const { hashPassword, comparePassword } = require('./bcrypt');

const app = express();
const PORT = process.env.PORT || 4000;
const SECRET_KEY = process.env.JWT_SECRET || 'secretkey';

app.use(cors());
app.use(express.json());

// ---- DB ----
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('Mongo connection error:', err));

// ---- Auth ----
// Middleware to ensure JSON responses
app.use((req, res, next) => {
  // Set content type for all API responses
  if (req.path.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');
    
    // Override error handling for API routes
    const originalSend = res.send;
    res.send = function(body) {
      // Log the response for debugging
      console.log(`API Response for ${req.path} - Type: ${typeof body}, First 50 chars:`, 
                 typeof body === 'string' ? body.substring(0, 50) : 'non-string');
      
      // Check if it's HTML or non-JSON string
      if (typeof body === 'string') {
        if (body.includes('<!DOCTYPE html>') || body.includes('<html>')) {
          console.error('Attempted to send HTML instead of JSON for API endpoint:', req.path);
          return originalSend.call(this, JSON.stringify({ error: 'Invalid response format' }));
        }
        
        // Try to ensure it's valid JSON
        try {
          // If it's not already a JSON object, try to parse it to validate
          if (body.trim()[0] !== '{' && body.trim()[0] !== '[') {
            JSON.parse(body); // This will throw if invalid
          }
        } catch (e) {
          console.error('Invalid JSON response:', e.message);
          return originalSend.call(this, JSON.stringify({ error: 'Invalid JSON response' }));
        }
      }
      return originalSend.call(this, body);
    };
  }
  next();
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  
  console.log('authenticateToken - Auth header exists:', !!authHeader);
  console.log('authenticateToken - Token extracted:', !!token);
  
  if (!token) return res.sendStatus(401);
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    // token now includes { id, email, role }
    console.log('authenticateToken - Decoded user:', {
      id: user.id,
      email: user.email,
      role: user.role
    });
    req.user = user;
    next();
  });
}

// ---- Root ----
app.get('/', (req, res) => res.send('Hack the Gap Time Tracker API is running'));

// Debug endpoints removed during cleanup

// ======================================================================
// Auth
// ======================================================================
app.post('/register', async (req, res) => {
  try {
    const name = req.body.name ?? req.body.fullName;
    const { email, password } = req.body;
    // All new registrations are set to 'employee' role
    const role = 'employee';

    if (!name || !email || !password) {
      return res.status(400).json({ status: "Error", message: "All fields are required" });
    }
    if (await UserModel.exists({ email })) {
      return res.status(409).json({ status: "Error", message: "Email already registered" });
    }

    const hashedPassword = await hashPassword(password);
    const user = await UserModel.create({ name, email, password: hashedPassword, role });

    res.status(201).json({
      status: "Success",
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ status: "Error", message: err?.message || "Internal Server Error" });
    const msg = err?.message || "Internal Server Error";
    return res.status(500).json({ status: "Error", message: msg });
  }
});




app.post('/api/time', authenticateToken, async (req, res) => {
  try {
    let {date, minutes, tasks, project } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!date || minutes === undefined || minutes === null || minutes <= 0) {
      return res.status(400).json({ status: "Error", message: "Date and valid minutes are required" });
    }

    // Use default project name if not provided
    const projectName = project && project.trim() ? project : 'No Project';

    // Get user's supervisor
    const user = await UserModel.findById(userId);
    const supervisorId = user ? user.supervisorId : null;

    console.log(`Time entry submission: Employee ${user?.name} (${userId}) -> Supervisor ${supervisorId}`);
    console.log(`Entry data:`, { date, minutes, tasks, project: projectName });

    if (!supervisorId) {
      console.log(`Warning: Employee ${user?.name} has no supervisor assigned`);
    }

    const tasksArray = Array.isArray(tasks) ? tasks.map(t => ({
      id: t.id || t._id || uuidv4(),
      name: t.name || t.task || '',
      color: t.color,
      hour: t.hour,
    })) : [];

    // Use async/await instead of .then().catch()
    const timeEntry = await TimeEntry.create({
      date, 
      minutes, 
      tasks: tasksArray, 
      project: projectName, 
      userId, 
      supervisorId, 
      status: 'pending'
    });

    res.json(timeEntry);

  } catch(err) {  
    console.error("time error:", err);
    res.status(500).json({ status: "Error", message: err.message });
  }
});

app.get('/api/time', authenticateToken, async (req, res) => {
  try {
    const times = await TimeEntry.find({ userId: req.user.id });
    res.json(times);

  } catch(err) {  
    console.error("time error:", err);
    res.status(500).json({ status: "Error", message: err.message });
  }
});

// Team Management APIs
// Team endpoints moved to line ~646



app.post('/api/team/add', authenticateToken, async (req, res) => {
  try {
    console.log('POST /api/team/add - Request body:', req.body);
    console.log('POST /api/team/add - User:', req.user);
    
    const { employeeEmail, supervisorId } = req.body;
    const requesterId = req.user.id;

    if (!employeeEmail) {
      console.log('Missing employeeEmail in request');
      return res.status(400).json({ status: "Error", message: "Employee email is required." });
    }

    console.log(`Looking for requester with ID: ${requesterId}`);
    const requester = await UserModel.findById(requesterId);
    if (!requester) {
      console.log('Requester not found');
      return res.status(404).json({ status: "Error", message: "Requester not found." });
    }
    
    console.log(`Requester found: ${requester.name} (${requester.role})`);
    
    // Determine which supervisor ID to use based on role and provided supervisorId
    let finalSupervisorId;
    
    if (requester.role === 'superadmin') {
      // Superadmin can add to any supervisor's team if supervisorId is provided
      if (supervisorId) {
        const supervisor = await UserModel.findById(supervisorId);
        if (!supervisor) {
          return res.status(404).json({ status: "Error", message: "Supervisor not found." });
        }
        if (supervisor.role !== 'supervisor') {
          return res.status(400).json({ status: "Error", message: "Specified user is not a supervisor." });
        }
        finalSupervisorId = supervisorId;
      } else {
        // If no supervisorId provided, use the superadmin's ID
        finalSupervisorId = requesterId;
      }
    } else if (requester.role === 'supervisor') {
      // Supervisors can only add to their own team
      finalSupervisorId = requesterId;
    } else {
      // Other roles cannot add team members
      return res.status(403).json({ status: "Error", message: "Access denied. Insufficient permissions." });
    }

    console.log(`Looking for employee with email: ${employeeEmail}`);
    const employee = await UserModel.findOne({ email: employeeEmail.toLowerCase().trim() });
    if (!employee) {
      console.log('Employee not found');
      return res.status(404).json({ status: "Error", message: "Employee not found. Make sure they have registered an account." });
    }

    console.log(`Employee found: ${employee.name} (${employee.role})`);
    if (employee.role !== 'employee') {
      console.log('User is not an employee');
      return res.status(400).json({ status: "Error", message: "User is not an employee." });
    }

    if (employee.supervisorId) {
      console.log('Employee already has a supervisor:', employee.supervisorId);
      return res.status(400).json({ status: "Error", message: "Employee already has a supervisor." });
    }

    console.log(`Assigning employee ${employee.name} to supervisor ${finalSupervisorId}`);
    employee.supervisorId = finalSupervisorId;
    await employee.save();

    console.log(`Employee ${employee.name} (${employee._id}) assigned to supervisor ${finalSupervisorId}`);

    res.json({ status: "Success", message: "Employee added to team successfully." });

  } catch(err) {  
    console.error("add team member error:", err);
    res.status(500).json({ status: "Error", message: err.message });
  }
});

app.delete('/api/team/:employeeId', authenticateToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const supervisorId = req.user.id;

    const supervisor = await UserModel.findById(supervisorId);
    // Update to allow both supervisor and superadmin to remove team members
    if (supervisor.role !== 'supervisor' && supervisor.role !== 'superadmin') {
      return res.status(403).json({ status: "Error", message: "Access denied. Supervisor or Superadmin role required." });
    }

    const employee = await UserModel.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ status: "Error", message: "Employee not found." });
    }

    if (employee.supervisorId.toString() !== supervisorId) {
      return res.status(403).json({ status: "Error", message: "Employee is not in your team." });
    }

    employee.supervisorId = null;
    await employee.save();

    res.json({ status: "Success", message: "Employee removed from team successfully." });

  } catch(err) {  
    console.error("remove team member error:", err);
    res.status(500).json({ status: "Error", message: err.message });
  }
});

// Time Entry Approval APIs

app.put('/api/time-entry/:entryId/approve', authenticateToken, async (req, res) => {
  try {
    const { entryId } = req.params;
    const supervisorId = req.user.id;

    const supervisor = await UserModel.findById(supervisorId);
    if (supervisor.role !== 'supervisor') {
      return res.status(403).json({ status: "Error", message: "Access denied. Supervisor role required." });
    }

    const entry = await TimeEntry.findById(entryId);
    if (!entry) {
      return res.status(404).json({ status: "Error", message: "Time entry not found." });
    }

    if (entry.supervisorId.toString() !== supervisorId) {
      return res.status(403).json({ status: "Error", message: "You can only approve entries from your team." });
    }

    entry.status = 'approved';
    entry.approvedAt = new Date();
    entry.approvedBy = supervisorId;
    await entry.save();

    res.json({ status: "Success", message: "Time entry approved successfully." });

  } catch(err) {  
    console.error("approve entry error:", err);
    res.status(500).json({ status: "Error", message: err.message });
  }
});

app.put('/api/time-entry/:entryId/reject', authenticateToken, async (req, res) => {
  try {
    const { entryId } = req.params;
    const { reason } = req.body;
    const supervisorId = req.user.id;

    const supervisor = await UserModel.findById(supervisorId);
    if (supervisor.role !== 'supervisor') {
      return res.status(403).json({ status: "Error", message: "Access denied. Supervisor role required." });
    }

    const entry = await TimeEntry.findById(entryId);
    if (!entry) {
      return res.status(404).json({ status: "Error", message: "Time entry not found." });
    }

    if (entry.supervisorId.toString() !== supervisorId) {
      return res.status(403).json({ status: "Error", message: "You can only reject entries from your team." });
    }

    entry.status = 'rejected';
    entry.rejectionReason = reason || 'No reason provided';
    entry.approvedBy = supervisorId;
    await entry.save();

    res.json({ status: "Success", message: "Time entry rejected successfully." });

  } catch(err) {  
    console.error("reject entry error:", err);
    res.status(500).json({ status: "Error", message: err.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(400).json({ status: "Error", message: "No record existed" });

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return res.status(400).json({ status: "Error", message: "Password is incorrect" });

    // include role in token so the API can authorize supervisors
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      SECRET_KEY,
      { expiresIn: '12h' }
    );

    // Check if this is the user's first login (no lastLoginDate)
    const isFirstLogin = !user.lastLoginDate;
    
    // Update lastLoginDate
    user.lastLoginDate = new Date();
    await user.save();
    
    res.json({
      status: "Success",
      token,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isFirstLogin
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ status: "Error", message: "Server error" });
  }
});

// ======================================================================
// Projects (Goals) + Tasks
// ======================================================================
app.post('/api/goals', authenticateToken, async (req, res) => {
  try {
    const { name, description = '', type = '', tasks = [] } = req.body;
    const userId = req.user.id;

    const normalizedTasks = Array.isArray(tasks)
    ? tasks.map(t => ({
        name: typeof t === "string" ? t : t?.name?.trim(),
        hour: t?.hour || 0,
        color: t?.color || "#000000"
      }))
      .filter(t => t.name)
    : [];

    const project = await ProjectModel.create({ name, description, type, tasks: normalizedTasks, userId });
    res.json(project);
  } catch (err) {
    console.error('POST /api/goals error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/goals', authenticateToken, async (req, res) => {
  try {
    const projects = await ProjectModel.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error('GET /api/goals error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/goals/:projectId/tasks', authenticateToken, async (req, res) => {
  try {
    const project = await ProjectModel.findOne(
      { _id: req.params.projectId, userId: req.user.id },
      'tasks'
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project.tasks || []);
  } catch (err) {
    console.error('GET /api/goals/:projectId/tasks error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/goals/:projectId/tasks', authenticateToken, async (req, res) => {
  try {
    const name = (req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Task name required' });

    const project = await ProjectModel.findOneAndUpdate(
      { _id: req.params.projectId, userId: req.user.id },
      { $push: { tasks: { name } } },
      { new: true, projection: { tasks: 1 } }
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });

    res.json(project.tasks);
  } catch (err) {
    console.error('POST /api/goals/:projectId/tasks error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ======================================================================
// Notifications
// ======================================================================
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    // Allow all authenticated users to access their notifications
    const notifications = await NotificationModel.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    console.error('GET /api/notifications error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const { id, name, description } = req.body;
    const userId = req.user.id;
    const doc = await NotificationModel.create({ id, name, description, userId });
    res.json(doc);
  } catch (err) {
    console.error('POST /api/notifications error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Support both PUT and POST for marking notifications as read
app.put('/api/notifications/markAllRead', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    await NotificationModel.updateMany(
      { userId, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/notifications/markAllRead error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add POST endpoint for the same functionality to support frontend
app.post('/api/notifications/markAllRead', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    await NotificationModel.updateMany(
      { userId, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/notifications/markAllRead error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ======================================================================
// Time entries
// ======================================================================
// HH:MM -> minutes
function calculateMinutes(start, end) {
  const [sh, sm] = String(start).split(':').map(Number);
  const [eh, em] = String(end).split(':').map(Number);
  return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
}

// normalize a Time document for frontends (task + default status)
function normalizeTimeDoc(d) {
  const out = (d?.toObject?.() ? d.toObject() : d) || {};

  // task normalization (accepts legacy shapes)
  let task = out.task;
  if (!task && out.tasks != null) {
    if (Array.isArray(out.tasks)) {
      const first = out.tasks[0];
      task = typeof first === 'string' ? first : (first?.name || '');
    } else {
      task = typeof out.tasks === 'string' ? out.tasks : (out.tasks?.name || '');
    }
  }
  if (!task) task = out.taskName || out.description || '';

  // default status for older rows
  const status = (out.status || 'pending');

  return { ...out, task, status };
}

/**
 * POST /api/time
 * Accepts:
 *  - { date, minutes, projectId, project, taskId, task }
 *  - or { startTime, endTime } to compute minutes
 * Back-compat: if client sends "tasks" (plural), it will map to "task".
 */
// Update this route to use the middleware
app.post('/api/supervisor/create', authenticateToken, superadminOnlyMiddleware, async (req, res) => {
  try {
    // Remove the role check here since it's now handled by middleware
    // if (req.user.role !== 'superadmin') {
    //   return res.status(403).json({ error: 'Forbidden. Only superadmins can create admin accounts.' });
    // }
    
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    // Check if user with this email already exists
    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create the new supervisor user
    const newSupervisor = await UserModel.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'supervisor'
    });

    // Return success without sending the password
    res.status(201).json({
      message: 'Supervisor created successfully',
      supervisor: {
        id: newSupervisor._id,
        name: newSupervisor.name,
        email: newSupervisor.email,
        role: newSupervisor.role
      }
    });
  } catch (err) {
    console.error('POST /api/supervisor/create error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get('/api/supervisors', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get all users with supervisor role
    const supervisors = await UserModel.find({ role: 'supervisor' })
      .select('name email _id')
      .sort({ name: 1 });
    
    res.json(supervisors);
  } catch (err) {
    console.error('GET /api/supervisors error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get a specific supervisor by ID (superadmin only)
app.get('/api/supervisors/:supervisorId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Forbidden. Only superadmins can view supervisor details.' });
    }

    const { supervisorId } = req.params;

    // Find the supervisor
    const supervisor = await UserModel.findById(supervisorId);
    if (!supervisor) {
      return res.status(404).json({ status: "Error", message: "Supervisor not found." });
    }

    if (supervisor.role !== 'supervisor') {
      return res.status(400).json({ status: "Error", message: "User is not a supervisor." });
    }

    // Return supervisor details without sensitive information
    res.json({
      _id: supervisor._id,
      name: supervisor.name,
      email: supervisor.email,
      role: supervisor.role
    });

  } catch(err) {  
    console.error("GET /api/supervisors/:supervisorId error:", err);
    res.status(500).json({ status: "Error", message: err.message });
  }
});

// Get all supervisors for superadmin reports
app.get('/api/superadmin/supervisors', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Forbidden. Only superadmins can access this endpoint.' });
    }

    // Get all users with supervisor role
    const supervisors = await UserModel.find({ role: 'supervisor' })
      .select('name email _id')
      .sort({ name: 1 });
    
    res.json({ supervisors });
  } catch (err) {
    console.error('GET /api/superadmin/supervisors error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get time entries for a specific supervisor (superadmin only)
app.get('/api/superadmin/supervisor/entries', authenticateToken, async (req, res) => {
  // Set content type to JSON at the beginning
  res.setHeader('Content-Type', 'application/json');
  try {
    console.log('/api/superadmin/supervisor/entries - User:', req.user);
    // Check if user is a superadmin
    if (req.user.role !== 'superadmin') {
      console.log('/api/superadmin/supervisor/entries - Access denied for role:', req.user?.role);
      return res.status(403).json({ status: 'Error', message: 'Only superadmins can access this endpoint' });
    }
    
    // Get supervisorId from query parameters
    const { supervisorId, userId } = req.query;
    
    if (!supervisorId) {
      return res.status(400).json({ status: 'Error', message: 'supervisorId is required' });
    }
    
    // Verify the supervisor exists
    const supervisor = await UserModel.findById(supervisorId);
    if (!supervisor) {
      return res.status(404).json({ status: "Error", message: "Supervisor not found." });
    }
    
    if (supervisor.role !== 'supervisor') {
      return res.status(400).json({ status: "Error", message: "User is not a supervisor." });
    }
    
    // Build query
    const query = { supervisorId: supervisorId };
    
    // If userId is provided, filter by that specific user
    if (userId) {
      console.log('/api/superadmin/supervisor/entries - Filtering by userId:', userId);
      query.userId = userId;
    }
    
    console.log('/api/superadmin/supervisor/entries - Query:', query);
    // Find all time entries for the supervisor's team
    const entries = await TimeEntry.find(query)
      .populate('userId', 'name email')
      .sort({ date: -1 })
      .lean(); // Convert to plain JavaScript objects
    
    console.log('/api/superadmin/supervisor/entries - Found entries:', entries.length);
    // Ensure we're sending a valid JSON response
    res.setHeader('Content-Type', 'application/json');
    
    // Add more logging to diagnose the issue
    const jsonString = JSON.stringify(entries);
    console.log('/api/superadmin/supervisor/entries - Response JSON (first 100 chars):', jsonString.substring(0, 100));
    
    // Send the response
    res.send(jsonString);
  } catch (err) {
    console.error('GET /api/superadmin/supervisor/entries error:', err);
    // Ensure error response is also JSON
    res.status(500);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ error: err.message }));
  }
});

// Delete a supervisor (superadmin only)
app.delete('/api/supervisors/:supervisorId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Forbidden. Only superadmins can delete supervisors.' });
    }

    const { supervisorId } = req.params;

    // Find the supervisor to delete
    const supervisor = await UserModel.findById(supervisorId);
    if (!supervisor) {
      return res.status(404).json({ status: "Error", message: "Supervisor not found." });
    }

    if (supervisor.role !== 'supervisor') {
      return res.status(400).json({ status: "Error", message: "User is not a supervisor." });
    }

    // Find all employees assigned to this supervisor
    const employees = await UserModel.find({ supervisorId: supervisorId });

    // Update all employees to remove the supervisor reference
    for (const employee of employees) {
      employee.supervisorId = null;
      await employee.save();
    }

    // Delete the supervisor
    await UserModel.findByIdAndDelete(supervisorId);

    res.json({ status: "Success", message: "Supervisor removed successfully." });

  } catch(err) {  
    console.error("delete supervisor error:", err);
    res.status(500).json({ status: "Error", message: err.message });
  }
});

// Get team members for a supervisor
app.get('/api/team', authenticateToken, async (req, res) => {
  try {
    // Check if user is a supervisor or superadmin
    if (req.user.role !== 'supervisor' && req.user.role !== 'superadmin') {
      return res.status(403).json({ status: 'Error', message: 'Only supervisors or superadmins can access team information' });
    }
    
    // Find all employees where supervisorId matches the current user's id
    const teamMembers = await UserModel.find({ supervisorId: req.user.id })
      .select('name email _id')
      .sort({ name: 1 });
    
    res.json(teamMembers);
  } catch (err) {
    console.error('GET /api/team error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get team members for a specific supervisor (superadmin only)
app.get('/api/supervisors/:supervisorId/team', authenticateToken, async (req, res) => {
  try {
    // Check if user is a superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ status: 'Error', message: 'Only superadmins can access other supervisors team information' });
    }
    
    const { supervisorId } = req.params;
    
    // Verify the supervisor exists
    const supervisor = await UserModel.findById(supervisorId);
    if (!supervisor) {
      return res.status(404).json({ status: "Error", message: "Supervisor not found." });
    }
    
    if (supervisor.role !== 'supervisor') {
      return res.status(400).json({ status: "Error", message: "User is not a supervisor." });
    }
    
    // Find all employees where supervisorId matches the requested supervisor's id
    const teamMembers = await UserModel.find({ supervisorId: supervisorId })
      .select('name email _id')
      .sort({ name: 1 });
    
    res.json(teamMembers);
  } catch (err) {
    console.error('GET /api/supervisors/:supervisorId/team error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all employees with 'employee' role
app.get('/api/employees', authenticateToken, async (req, res) => {
  try {
    // Check if user is a supervisor or superadmin
    if (req.user.role !== 'supervisor' && req.user.role !== 'superadmin') {
      return res.status(403).json({ status: 'Error', message: 'Only supervisors or superadmins can access employee information' });
    }
    
    // Find all users with role 'employee'
    const employees = await UserModel.find({ role: 'employee' })
      .select('name email _id supervisorId')
      .sort({ name: 1 });
    
    res.json(employees);
  } catch (err) {
    console.error('GET /api/employees error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get pending time entries for approval
app.get('/api/pending-entries', authenticateToken, async (req, res) => {
  try {
    // Check if user is a supervisor or superadmin
    if (req.user.role !== 'supervisor' && req.user.role !== 'superadmin') {
      return res.status(403).json({ status: 'Error', message: 'Only supervisors or superadmins can access pending entries' });
    }
    
    // Find all pending time entries where supervisorId matches the current user's id
    const pendingEntries = await TimeEntry.find({
      status: 'pending',
      supervisorId: req.user.id
    })
    .populate('userId', 'name email')
    .sort({ date: -1 });
    
    res.json(pendingEntries);
  } catch (err) {
    console.error('GET /api/pending-entries error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

// Add these middleware functions after the authenticateToken function (around line 40)

// Middleware for supervisor and superadmin only routes
function supervisorOnlyMiddleware(req, res, next) {
  console.log('supervisorOnlyMiddleware - User:', req.user);
  if (req.user.role !== 'superadmin' && req.user.role !== 'supervisor') {
    console.log('supervisorOnlyMiddleware - Access denied for role:', req.user?.role);
    return res.status(403).json({ status: 'Error', message: 'Only supervisors or superadmins can access debug information' });
  }
  console.log('supervisorOnlyMiddleware - Access granted for role:', req.user.role);
  next();
}

// Middleware for non-employee routes (supervisor or superadmin)
function nonEmployeeMiddleware(req, res, next) {
  if (req.user.role === 'employee') {
    return res.status(403).json({ status: "Error", message: "Access denied. Supervisor or higher role required." });
  }
  next();
}

// Middleware for superadmin only routes
function superadminOnlyMiddleware(req, res, next) {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ status: "Error", message: "Access denied. Superadmin role required." });
  }
  next();
}

// Routes for supervisor and team management are defined above

// Get all entries for a supervisor's team
app.get('/api/supervisor/entries', authenticateToken, async (req, res) => {
  try {
    console.log('/api/supervisor/entries - User:', req.user);
    // Check if user is a supervisor or superadmin
    if (req.user.role !== 'supervisor' && req.user.role !== 'superadmin') {
      console.log('/api/supervisor/entries - Access denied for role:', req.user?.role);
      return res.status(403).json({ status: 'Error', message: 'Only supervisors or superadmins can access team entries' });
    }
    
    // Get userId filter if provided
    const { userId } = req.query;
    
    // Build query
    const query = { supervisorId: req.user.id };
    
    // If userId is provided, filter by that specific user
    if (userId) {
      console.log('/api/supervisor/entries - Filtering by userId:', userId);
      query.userId = userId;
    }
    
    console.log('/api/supervisor/entries - Query:', query);
    // Find all time entries for the supervisor's team
    const entries = await TimeEntry.find(query)
      .populate('userId', 'name email')
      .sort({ date: -1 });
    
    console.log('/api/supervisor/entries - Found entries:', entries.length);
    res.json(entries);
  } catch (err) {
    console.error('GET /api/supervisor/entries error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get team members for a supervisor
app.get('/api/supervisor/team', authenticateToken, async (req, res) => {
  try {
    console.log('/api/supervisor/team - User:', req.user);
    // Check if user is a supervisor or superadmin
    if (req.user.role !== 'supervisor' && req.user.role !== 'superadmin') {
      console.log('/api/supervisor/team - Access denied for role:', req.user?.role);
      return res.status(403).json({ status: 'Error', message: 'Only supervisors or superadmins can access team information' });
    }
    
    console.log('/api/supervisor/team - Finding team members for supervisorId:', req.user.id);
    // Find all employees where supervisorId matches the current user's id
    const teamMembers = await UserModel.find({ supervisorId: req.user.id })
      .select('name email _id')
      .sort({ name: 1 });
    
    console.log('/api/supervisor/team - Found team members:', teamMembers.length);
    res.json(teamMembers);
  } catch (err) {
    console.error('GET /api/supervisor/team error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get supervisor information for the logged-in user
app.get('/api/user/supervisor', authenticateToken, async (req, res) => {
  try {
    // Only employees should have supervisors
    if (req.user.role !== 'employee') {
      return res.status(400).json({ status: "Error", message: "Only employees have supervisors" });
    }
    
    // Find the user with populated supervisor information
    const user = await UserModel.findById(req.user.id).populate('supervisorId', 'name email');
    
    if (!user) {
      return res.status(404).json({ status: "Error", message: "User not found" });
    }
    
    if (!user.supervisorId) {
      return res.status(404).json({ status: "Error", message: "No supervisor assigned" });
    }
    
    // Return the supervisor information
    res.json({
      status: "Success",
      supervisor: {
        id: user.supervisorId._id,
        name: user.supervisorId.name,
        email: user.supervisorId.email
      }
    });
  } catch(err) {  
    console.error("supervisor info error:", err);
    res.status(500).json({ status: "Error", message: err.message });
  }
});
