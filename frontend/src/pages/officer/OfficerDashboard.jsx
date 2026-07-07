import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getDepartmentRequests } from '../../services/api';
import { FiCheckCircle, FiXCircle, FiClock, FiUsers } from 'react-icons/fi';

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getDepartmentRequests();
        setRequests(res.data.requests);
      } catch (err) {
        console.error('Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Welcome, {user.name}</h1>
        <p>Department Officer Dashboard &mdash; Review and process clearance requests</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Requests</div>
        </div>
        <div className="stat-card stat-pending">
          <div className="stat-number">{stats.pending}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card stat-approved">
          <div className="stat-number">{stats.approved}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card stat-rejected">
          <div className="stat-number">{stats.rejected}</div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>

      {stats.pending > 0 && (
        <div className="alert alert-warning">
          You have <strong>{stats.pending}</strong> pending request(s) that require your review.
        </div>
      )}

      {stats.total === 0 && (
        <div className="empty-state">
          <FiUsers size={48} />
          <h3>No Requests Yet</h3>
          <p>No students have submitted clearance requests for your department.</p>
        </div>
      )}
    </div>
  );
}
