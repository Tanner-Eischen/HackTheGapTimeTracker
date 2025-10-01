# Hack The Gap Time Tracker

A comprehensive time tracking application built with the MERN stack, designed for organizations with hierarchical team structures. Features role-based access control, real-time time tracking, approval workflows, and comprehensive reporting.

## >Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [User Roles](#user-roles)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

## >Features

### -Core Functionality
- **Real-time Time Tracking**: Clock in/out with minute precision
- **Manual Time Entry**: Retroactive time logging with project and task assignment
- **Project Management**: Goal-based project tracking with task categorization
- **Approval Workflows**: Supervisor approval system for time entries
- **Calendar Views**: Visual time entry management with week/month views
- **Reporting & Analytics**: Comprehensive reporting with export capabilities

### -User Experience
- **Role-based Dashboards**: Customized interfaces for employees, supervisors, and super admins
- **Interactive Onboarding**: Guided tours for new users with contextual help
- **Responsive Design**: Bootstrap 5-based UI optimized for desktop and mobile
- **Notification System**: Real-time notifications for approvals and updates

### -Security & Administration
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Three-tier permission system
- **Audit Trail**: Complete tracking of time entry modifications
- **Team Management**: Supervisor assignment and team oversight

## >Architecture


### Backend Structure

- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt password hashing
- **API**: RESTful design with comprehensive endpoint coverage
- **Middleware**: Role-based route protection and request validation

```
backend/
├── models/
│   ├── User.js              # User authentication and roles
│   ├── TimeEntry.js         # Time tracking entries
│   ├── Projects.js          # Project and task management
│   └── Notification.js      # System notifications
├── server.js               # Main server file with all routes
├── bcrypt.js              # Password hashing utilities
├── CreateSuperAdmin.js    # Initial setup script
└── package.json           # Dependencies and scripts
```

### Frontend Structure

- **Framework**: React 18 with modern hooks and context
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Bootstrap 5 with custom CSS components
- **Routing**: React Router with protected routes
- **State Management**: Context API for authentication state


```
frontend/react-vite-app/src/
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Badge.jsx
│   │   ├── Modal.jsx
│   │   ├── DashboardButton.jsx
│   │   ├── HelpButton.jsx
│   │   └── QuickEntryButton.jsx
│   ├── onboarding/         # Tour system components
│   │   ├── OnboardingCoachmarks.jsx
│   │   └── OnboardingManager.jsx
│   └── CalendarView.jsx    # Time entry calendar
├── store/
│   └── useOnboardingStore.js # Onboarding state management
├── utils/
│   └── onboardingSteps.js   # Tour configuration
├── [Page Components].jsx    # Main page components
├── AuthContext.jsx         # Authentication context
├── ProtectedRoute.jsx      # Route protection
└── main.jsx               # App entry point
```

### -Database Models
- **User**: Authentication, roles, and team relationships
- **TimeEntry**: Time tracking with approval workflow
- **Projects**: Goal-oriented project structure with tasks
- **Notifications**: System-wide notification management

## >Installation

### -Prerequisites
- Node.js (v14+)
- MongoDB (local or cloud instance)
- npm or yarn

### -Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hack-the-gap-tracker/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the backend directory:
   ```env
  MONGO_URI=your-mongodb-connection-string
  JWT_SECRET=your-jwt-secret-key
  PORT=4000
   ```

4. **Create Super Admin Account**
   ```bash
   node CreateSuperAdmin.js
   ```
   This creates a super admin with:
   - Email: `test@superadmin.com`
   - Password: `password`

5. **Start the server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

### -Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend/react-vite-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## -Configuration

### Environment Variables

**Backend (.env)**
```env
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret-key
PORT=4000
```

### Development vs Production

- **Development**: Uses Vite dev server with proxy to backend
- **Production**: Built static files served from backend or separate web server

## -Usage

### Initial Setup

1. **Access the application**: Navigate to `http://localhost:5173` (development)

2. **Super Admin Login**:
   - Email: `test@superadmin.com`
   - Password: `password`

3. **Create Supervisors**: Use the Super Admin dashboard to create supervisor accounts

4. **Register Employees**: Employees can self-register with automatic role assignment

5. **Team Assignment**: Super admins or supervisors can assign employees to teams

### Daily Workflow

#### For Employees:
1. **Clock In/Out**: Use the timer on the dashboard for real-time tracking
2. **Manual Entry**: Add time entries retrospectively with project details
3. **Project Selection**: Choose from available projects and tasks
4. **Submit for Approval**: Time entries automatically go to assigned supervisor

#### For Supervisors:
1. **Review Entries**: Access pending time entries from team members
2. **Approve/Reject**: Review and approve or reject entries with optional comments
3. **Team Management**: Add/remove team members and monitor productivity
4. **Create Projects**: Set up projects and tasks for team time allocation

#### For Super Admins:
1. **System Overview**: Monitor organization-wide statistics and activity
2. **Supervisor Management**: Create and manage supervisor accounts
3. **Global Reporting**: Access comprehensive reports across all teams
4. **System Configuration**: Manage organization-wide settings and policies

## -User Roles

### Employee
- **Primary Functions**: Time tracking, project management, personal reporting
- **Permissions**: 
  - Create and edit own time entries
  - View personal dashboard and reports
  - Access assigned projects and tasks
  - Submit time entries for supervisor approval
- **Dashboard Features**:
  - Real-time timer with project selection
  - Quick time entry forms
  - Personal time tracking statistics
  - Calendar view of time entries

### Supervisor
- **Primary Functions**: Team oversight, approval workflows, team reporting
- **Permissions**:
  - All employee permissions for personal time tracking
  - View and manage assigned team members
  - Approve/reject team time entries
  - Create projects and tasks for team
  - Access team reporting and analytics
- **Dashboard Features**:
  - Team member overview with pending approvals
  - Approval queue with filtering and batch operations
  - Team productivity metrics and charts
  - Project management for team assignments

### Super Admin
- **Primary Functions**: System administration, supervisor management, organization oversight
- **Permissions**:
  - All supervisor permissions
  - Create and manage supervisor accounts
  - View organization-wide data and reports
  - Reassign employees between supervisors
  - Access system-wide configuration settings
- **Dashboard Features**:
  - Organization statistics (total supervisors, employees, hours)
  - Supervisor management interface
  - System-wide pending approvals overview
  - Comprehensive reporting across all teams

### User Flow Examples

#### Employee Time Tracking Flow:
1. **Login** → Personal Dashboard
2. **Start Timer** → Select Project & Tasks → Work → **Stop Timer**
3. **Review Entry** → Submit for Approval
4. **Check Status** → View in Reports → Export if Approved

#### Supervisor Approval Flow:
1. **Login** → Supervisor Dashboard
2. **View Notifications** → Navigate to Approval Queue
3. **Review Time Entry** → Check Details & Comments
4. **Make Decision** → Approve with Comments OR Reject with Reason
5. **Monitor Team** → Check Team Reports → Export Data

#### Super Admin Management Flow:
1. **Login** → Super Admin Dashboard
2. **View System Stats** → Identify Issues or Trends
3. **Manage Supervisors** → Create New Account OR Reassign Teams
4. **Generate Reports** → Organization-wide Analysis
5. **System Maintenance** → Update Settings & Configurations

## 🔌 API Documentation

### Base URL
```
http://localhost:4000/api
```

### Authentication Endpoints

#### Register User
```http
POST /register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Time Tracking Endpoints

#### Create Time Entry
```http
POST /time
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2025-01-15",
  "minutes": 480,
  "project": "Project Alpha",
  "tasks": [
    {
      "id": "task-1",
      "name": "Development",
      "color": "#4F46E5"
    }
  ]
}
```

#### Get User Time Entries
```http
GET /time
Authorization: Bearer <token>
```

#### Approve Time Entry (Supervisor)
```http
PUT /time-entry/{entryId}/approve
Authorization: Bearer <token>
```

#### Reject Time Entry (Supervisor)
```http
PUT /time-entry/{entryId}/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Missing project details"
}
```

### Team Management Endpoints

#### Get Team Members (Supervisor/Super Admin)
```http
GET /team
Authorization: Bearer <token>
```

#### Add Team Member
```http
POST /team/add
Authorization: Bearer <token>
Content-Type: application/json

{
  "employeeEmail": "employee@example.com",
  "supervisorId": "supervisor-id" // Optional for super admin
}
```

#### Get Pending Entries (Supervisor)
```http
GET /pending-entries
Authorization: Bearer <token>
```

### Project Management Endpoints

#### Create Project
```http
POST /goals
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Project Alpha",
  "description": "Main development project",
  "type": "Development",
  "tasks": [
    {
      "name": "Frontend Development",
      "color": "#4F46E5",
      "hour": "40"
    }
  ]
}
```

#### Get User Projects
```http
GET /goals
Authorization: Bearer <token>
```

### Super Admin Endpoints

#### Create Supervisor
```http
POST /supervisor/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Supervisor",
  "email": "jane@example.com",
  "password": "password123"
}
```

#### Get All Supervisors
```http
GET /supervisors
Authorization: Bearer <token>
```

#### Get Supervisor Team
```http
GET /supervisors/{supervisorId}/team
Authorization: Bearer <token>
```

### Notification Endpoints

#### Get User Notifications
```http
GET /notifications
Authorization: Bearer <token>
```

#### Mark All Notifications as Read
```http
POST /notifications/markAllRead
Authorization: Bearer <token>
```

### Error Responses

All endpoints return consistent error responses:

```json
{
  "status": "Error",
  "message": "Descriptive error message"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `500`: Internal Server Error

### Authentication

Include JWT token in Authorization header:
```http
Authorization: Bearer <your-jwt-token>
```

Tokens expire after 12 hours and must be refreshed by re-logging in.

## 🤝 Contributing

### Development Setup

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Install dependencies** for both backend and frontend
4. **Make changes** following the coding standards
5. **Test thoroughly** across all user roles
6. **Commit changes**: `git commit -m 'Add amazing feature'`
7. **Push to branch**: `git push origin feature/amazing-feature`
8. **Create Pull Request**

### Coding Standards

- **JavaScript**: ES6+ with consistent formatting
- **React**: Functional components with hooks
- **MongoDB**: Mongoose schemas with proper validation
- **API**: RESTful design with proper HTTP methods
- **Security**: Input validation and sanitization

### Testing Guidelines

- Test all user roles and permissions
- Verify authentication and authorization
- Test time tracking accuracy and edge cases
- Ensure responsive design across devices
- Validate API endpoints with various inputs

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

1. **Documentation**: Check this README and inline code comments
2. **Issues**: Create GitHub issues for bugs and feature requests
3. **Help System**: Use the in-app help and onboarding system
4. **Email**: Use the help form within the application

---

Built with ❤️ for effective team time management