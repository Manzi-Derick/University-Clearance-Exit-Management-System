import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (data) => api.post('/auth/register', data);

// Clearance (Student)
export const getMyRequests = () => api.get('/clearance/my-requests');
export const submitClearance = (departmentId) => api.post('/clearance/submit', { departmentId });
export const getCertificateStatus = () => api.get('/clearance/certificate-status');
export const getNotifications = () => api.get('/clearance/notifications');
export const markNotificationsRead = () => api.put('/clearance/notifications/read');

// Clearance (Officer)
export const getDepartmentRequests = () => api.get('/clearance/department-requests');
export const approveRequest = (id, remarks) => api.put(`/clearance/${id}/approve`, { remarks });
export const rejectRequest = (id, remarks) => api.put(`/clearance/${id}/reject`, { remarks });

// Admin
export const getAllUsers = () => api.get('/admin/users');
export const createUser = (data) => api.post('/admin/users', data);
export const updateUserStatus = (id, status) => api.put(`/admin/users/${id}/status`, { status });
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);
export const deleteClearanceRequest = (id) => api.delete(`/admin/requests/${id}`);
export const getAllDepartments = () => api.get('/admin/departments');
export const createDepartment = (name) => api.post('/admin/departments', { name });
export const updateDepartment = (id, name) => api.put(`/admin/departments/${id}`, { name });
export const deleteDepartment = (id) => api.delete(`/admin/departments/${id}`);
export const getReports = () => api.get('/admin/reports');
export const getAllRequests = () => api.get('/clearance/all');

// Departments list (all roles)
export const getDepartments = () => api.get('/departments');

export default api;
