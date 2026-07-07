import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentClearance from './pages/student/StudentClearance';
import StudentCertificate from './pages/student/StudentCertificate';
import OfficerDashboard from './pages/officer/OfficerDashboard';
import OfficerRequests from './pages/officer/OfficerRequests';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDepartments from './pages/admin/AdminDepartments';
import AdminReports from './pages/admin/AdminReports';
import './App.css';

function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  switch (user.role) {
    case 'student': return <Navigate to="/student/dashboard" />;
    case 'officer': return <Navigate to="/officer/dashboard" />;
    case 'admin': return <Navigate to="/admin/dashboard" />;
    default: return <Navigate to="/login" />;
  }
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute roles={['student']}><Layout /></ProtectedRoute>}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/clearance" element={<StudentClearance />} />
            <Route path="/student/certificate" element={<StudentCertificate />} />
          </Route>

          <Route element={<ProtectedRoute roles={['officer']}><Layout /></ProtectedRoute>}>
            <Route path="/officer/dashboard" element={<OfficerDashboard />} />
            <Route path="/officer/requests" element={<OfficerRequests />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin']}><Layout /></ProtectedRoute>}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/departments" element={<AdminDepartments />} />
            <Route path="/admin/reports" element={<AdminReports />} />
          </Route>

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
