import React, { useState, useEffect } from 'react';
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';
import Signup from './Signup';
import Login from './Login';
import Goals from './Goals';
import ReportPage from './ReportPage';
import PrivateRoute from './PrivateRoute';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import Notification from "./Notification";
import OnboardingManager from './components/onboarding/OnboardingManager';
import HelpButton from './components/ui/HelpButton';
import ModalTest from './components/ui/ModalTest';

import Dashboard from './Dashboard';
import Help from './Help';
import SupervisorDashboard from './SupervisorDashboard';
import ApprovalQueue from './ApprovalQueue';
import TeamManagement from './TeamManagement';
import ClockPage from './ClockPage';
import { Routes, Route, Navigate, useLocation, BrowserRouter } from 'react-router-dom';
import SuperAdminDashboard from './SuperAdminDashboard';
import AddSupervisorForm from './AddSupervisorForm';
import SupervisorView from './SupervisorView';
import ForgotPassword from './ForgotPassword';

function App() {
  const [notifications, setNotifications] = useState([]);
  const location = useLocation();

  // Hide notification on login/signup pages
  const hideNotification = location.pathname === "/login" || location.pathname === "/register";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios.get("/api/notifications", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => setNotifications(res.data))
      .catch((err) => console.error(err));
  }, []);

  const addNotification = (newNotif) => {
    const token = localStorage.getItem("token");
    axios.post("/api/notifications", newNotif, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setNotifications(prev => [...prev, res.data]))
      .catch(err => console.error(err));
  };

  return (
    <AuthProvider>
      {/* Global Onboarding Manager */}
      <OnboardingManager />
      
      {!hideNotification && (
        <div style={{ position: 'fixed', top: '15px', right: '15px', zIndex: 1000 }}>
          <Notification
            notifications={notifications}
            setNotifications={setNotifications}
            addNotification={addNotification}
          />
        </div>
      )}

      <Routes>
        {/* Public Routes */}
        <Route path='/' element={<Navigate to="/login" replace />} />
        <Route path='/register' element={<Signup />} />
        <Route path='/login' element={<Login />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />

        {/* Employee-Only Routes */}
        <Route path='/dashboard' element={
          <ProtectedRoute requiredRole="employee">
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          </ProtectedRoute>
        } />
        <Route path='/time' element={
          <ProtectedRoute requiredRole="employee">
            <PrivateRoute>
              <ClockPage />
            </PrivateRoute>
          </ProtectedRoute>
        } />

        
        <Route path='/report' element={
          <ProtectedRoute>
            <PrivateRoute>
              <ReportPage />
            </PrivateRoute>
          </ProtectedRoute>
        } />
        <Route path='/clock' element={
          <ProtectedRoute requiredRole="employee">
            <PrivateRoute>
              <ClockPage />
            </PrivateRoute>
          </ProtectedRoute>
        } />
        <Route path='/goals' element={
          <ProtectedRoute requiredRole="employee">
            <PrivateRoute>
              <Goals addNotification={addNotification} />
            </PrivateRoute>
          </ProtectedRoute>
        } />
        <Route path='/help' element={
          <ProtectedRoute requiredRole={['employee', 'supervisor', 'superadmin']}>
            <PrivateRoute>
              <Help />
            </PrivateRoute>
          </ProtectedRoute>
        } />

        {/* Supervisor/Admin Routes */}
        <Route path='/supervisor' element={
          <ProtectedRoute requiredRole={['supervisor', 'superadmin']}>
            <PrivateRoute>
              <SupervisorDashboard />
            </PrivateRoute>
          </ProtectedRoute>
        } />
        <Route path='/supervisor/dashboard' element={
          <ProtectedRoute requiredRole={['supervisor', 'superadmin']}>
            <PrivateRoute>
              <SupervisorDashboard />
            </PrivateRoute>
          </ProtectedRoute>
        } />
        <Route path='/supervisor/approvals' element={
          <ProtectedRoute requiredRole={['supervisor', 'superadmin']}>
            <PrivateRoute>
              <ApprovalQueue />
            </PrivateRoute>
          </ProtectedRoute>
        } />
        <Route path='/supervisor/team' element={
          <ProtectedRoute requiredRole={['supervisor', 'superadmin']}>
            <PrivateRoute>
              <TeamManagement />
            </PrivateRoute>
          </ProtectedRoute>
        } />
        

        {/* SuperAdmin-Only Routes */}
        <Route path='/superadmin/dashboard' element={
          <ProtectedRoute requiredRole="superadmin">
            <PrivateRoute>
              <SuperAdminDashboard />
            </PrivateRoute>
          </ProtectedRoute>
        } />
        <Route path='/superadmin/add-supervisor' element={
          <ProtectedRoute requiredRole="superadmin">
            <PrivateRoute>
              <AddSupervisorForm />
            </PrivateRoute>
          </ProtectedRoute>
        } />
        <Route path='/superadmin/supervisor/:supervisorId' element={
          <ProtectedRoute requiredRole="superadmin">
            <PrivateRoute>
              <SupervisorView />
            </PrivateRoute>
          </ProtectedRoute>
        } />
        <Route path='/superadmin/reports' element={
          <ProtectedRoute requiredRole="superadmin">
            <PrivateRoute>
              <ReportPage />
            </PrivateRoute>
          </ProtectedRoute>
        } />
        <Route path='/modal-test' element={<ModalTest />} />
      </Routes>
      
      {/* Global Help Button - Available on all pages except login/signup */}
      {!hideNotification && <HelpButton />}
    </AuthProvider>
  );
}

// Wrap App in BrowserRouter so useLocation works
export default function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
