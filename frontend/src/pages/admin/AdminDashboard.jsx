import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getReports } from '../../services/api';
import { FiUsers, FiLayers, FiFileText, FiCheckCircle } from 'react-icons/fi';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [deptStats, setDeptStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getReports();
        setStats(res.data.stats);
        setDeptStats(res.data.departmentStats);
      } catch (err) {
        console.error('Failed to fetch reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back, {user.name} &mdash; System overview and management</p>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <FiUsers size={24} />
            <div className="stat-number">{stats.totalStudents}</div>
            <div className="stat-label">Total Students</div>
          </div>
          <div className="stat-card">
            <FiLayers size={24} />
            <div className="stat-number">{stats.totalDepartments}</div>
            <div className="stat-label">Departments</div>
          </div>
          <div className="stat-card">
            <FiFileText size={24} />
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Requests</div>
          </div>
          <div className="stat-card stat-approved">
            <FiCheckCircle size={24} />
            <div className="stat-number">{stats.fullyCleared}</div>
            <div className="stat-label">Fully Cleared</div>
          </div>
        </div>
      )}

      {stats && (
        <div className="stats-grid three-col">
          <div className="stat-card stat-pending">
            <div className="stat-number">{stats.pending}</div>
            <div className="stat-label">Pending Requests</div>
          </div>
          <div className="stat-card stat-approved">
            <div className="stat-number">{stats.approved}</div>
            <div className="stat-label">Approved Requests</div>
          </div>
          <div className="stat-card stat-rejected">
            <div className="stat-number">{stats.rejected}</div>
            <div className="stat-label">Rejected Requests</div>
          </div>
        </div>
      )}

      {deptStats.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>Department Overview</h2>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Total</th>
                  <th>Pending</th>
                  <th>Approved</th>
                  <th>Rejected</th>
                </tr>
              </thead>
              <tbody>
                {deptStats.map((dept, idx) => (
                  <tr key={idx}>
                    <td><strong>{dept.department_name}</strong></td>
                    <td>{dept.total}</td>
                    <td><span className="status-badge status-pending">{dept.pending}</span></td>
                    <td><span className="status-badge status-approved">{dept.approved}</span></td>
                    <td><span className="status-badge status-rejected">{dept.rejected}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
