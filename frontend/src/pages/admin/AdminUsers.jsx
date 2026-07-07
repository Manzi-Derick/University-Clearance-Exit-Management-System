import { useState, useEffect } from 'react';
import { getAllUsers, createUser, updateUserStatus, deleteUser, getAllDepartments } from '../../services/api';
import { FiPlus, FiTrash2, FiToggleLeft, FiToggleRight, FiRefreshCw } from 'react-icons/fi';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', studentId: '', departmentId: '' });
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('student'); // Default to showing students

  const fetchData = async () => {
    try {
      const [usersRes, deptsRes] = await Promise.all([getAllUsers(), getAllDepartments()]);
      setUsers(usersRes.data.users);
      setDepartments(deptsRes.data.departments);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createUser({
        ...form,
        departmentId: form.departmentId ? parseInt(form.departmentId) : null
      });
      setShowForm(false);
      setForm({ name: '', email: '', password: '', role: 'student', studentId: '', departmentId: '' });
      fetchData(); // Refresh the list after creating
      alert('Student created successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user.');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await updateUserStatus(userId, newStatus);
      fetchData();
    } catch {
      alert('Failed to update user status.');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await deleteUser(userId);
      fetchData(); // Refresh the list
      alert('User deleted successfully!');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to delete user.';
      alert(errorMsg);
      console.error('Delete error:', err);
    }
  };

  const filteredUsers = filter === 'all' ? users : users.filter(u => u.role === filter);

  // Get counts
  const studentCount = users.filter(u => u.role === 'student').length;
  const officerCount = users.filter(u => u.role === 'officer').length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Manage Users</h1>
        <div className="header-actions">
          <button 
            className="btn btn-secondary" 
            onClick={fetchData}
            title="Refresh list"
          >
            <FiRefreshCw /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <FiPlus /> {showForm ? 'Cancel' : 'Add Student'}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{users.length}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card stat-approved">
          <div className="stat-number">{studentCount}</div>
          <div className="stat-label">Students</div>
        </div>
        <div className="stat-card stat-pending">
          <div className="stat-number">{officerCount}</div>
          <div className="stat-label">Officers</div>
        </div>
        <div className="stat-card stat-rejected">
          <div className="stat-number">{adminCount}</div>
          <div className="stat-label">Admins</div>
        </div>
      </div>

      {showForm && (
        <div className="card form-card">
          <h3>Create New User</h3>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="student">Student</option>
                  <option value="officer">Department Officer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>
            {form.role === 'student' && (
              <div className="form-group">
                <label>Student ID</label>
                <input type="text" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} placeholder="e.g. STU003" />
              </div>
            )}
            {form.role === 'officer' && (
              <div className="form-group">
                <label>Department</label>
                <select value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })} required>
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                  ))}
                </select>
              </div>
            )}
            <button type="submit" className="btn btn-primary">Create User</button>
          </form>
        </div>
      )}

      <div className="filter-bar">
        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All ({users.length})</button>
        <button className={`filter-btn ${filter === 'student' ? 'active' : ''}`} onClick={() => setFilter('student')}>Students ({users.filter(u => u.role === 'student').length})</button>
        <button className={`filter-btn ${filter === 'officer' ? 'active' : ''}`} onClick={() => setFilter('officer')}>Officers ({users.filter(u => u.role === 'officer').length})</button>
        <button className={`filter-btn ${filter === 'admin' ? 'active' : ''}`} onClick={() => setFilter('admin')}>Admins ({users.filter(u => u.role === 'admin').length})</button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Student ID</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.user_id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                  <td>{u.student_id || '-'}</td>
                  <td><span className={`status-badge status-${u.status === 'active' ? 'approved' : 'rejected'}`}>{u.status}</span></td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleToggleStatus(u.user_id, u.status)}
                        title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {u.status === 'active' ? <FiToggleRight /> : <FiToggleLeft />}
                      </button>
                      <button 
                        className="btn btn-sm btn-danger" 
                        onClick={() => handleDelete(u.user_id)} 
                        title="Delete Permanently"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
