import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyRequests, submitClearance, getDepartments } from '../../services/api';
import { FiCheckCircle, FiXCircle, FiClock, FiSend } from 'react-icons/fi';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isFullyCleared, setIsFullyCleared] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');

  const fetchRequests = async () => {
    try {
      const [requestRes, departmentRes] = await Promise.all([getMyRequests(), getDepartments()]);
      setRequests(requestRes.data.requests);
      setIsFullyCleared(requestRes.data.isFullyCleared);
      setDepartments(departmentRes.data.departments);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleSubmitClearance = async () => {
    if (!selectedDepartmentId) {
      setMessage('Please select a department first.');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      const res = await submitClearance(Number(selectedDepartmentId));
      setMessage(res.data.message);
      setSelectedDepartmentId('');
      fetchRequests();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to submit clearance.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResubmitDepartment = async (departmentId, departmentName) => {
    if (!confirm(`Resubmit clearance request to ${departmentName}? This will create a new request and you'll be reviewed again.`)) return;
    
    setSubmitting(true);
    setMessage('');
    try {
      const res = await submitClearance(departmentId);
      setMessage(res.data.message);
      fetchRequests();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to resubmit clearance.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <FiCheckCircle className="status-icon approved" />;
      case 'rejected': return <FiXCircle className="status-icon rejected" />;
      default: return <FiClock className="status-icon pending" />;
    }
  };

  const stats = {
    total: requests.length,
    approved: requests.filter(r => r.status === 'approved').length,
    pending: requests.filter(r => r.status === 'pending').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  };
  const requestedDepartmentIds = new Set(
    requests
      .filter(r => r.status !== 'rejected')
      .map(r => Number(r.department_id))
  );
  const availableDepartments = departments.filter(d => !requestedDepartmentIds.has(Number(d.department_id)));

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Welcome, {user.name}</h1>
        <p>Student ID: {user.studentId} &mdash; Track your clearance progress below</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Requests</div>
        </div>
        <div className="stat-card stat-approved">
          <div className="stat-number">{stats.approved}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card stat-pending">
          <div className="stat-number">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card stat-rejected">
          <div className="stat-number">{stats.rejected}</div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>

      {isFullyCleared && (
        <div className="alert alert-success">
          All departments have approved your clearance! You can now download your clearance certificate.
        </div>
      )}

      <div className="card form-card">
        <h3>Request Department Clearance</h3>
        <div className="inline-form">
          <select
            value={selectedDepartmentId}
            onChange={(e) => setSelectedDepartmentId(e.target.value)}
            disabled={submitting || availableDepartments.length === 0}
          >
            <option value="">Select a department</option>
            {availableDepartments.map((department) => (
              <option key={department.department_id} value={department.department_id}>
                {department.department_name}
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={handleSubmitClearance}
            disabled={submitting || availableDepartments.length === 0}
          >
            <FiSend /> {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
        {availableDepartments.length === 0 && (
          <p className="form-hint">Every department already has an active or approved request.</p>
        )}
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      {requests.length === 0 && !loading && (
        <div className="empty-state">
          <FiSend size={48} />
          <h3>No Clearance Requests Yet</h3>
          <p>Select one department above and submit your first clearance request.</p>
        </div>
      )}

      {requests.length > 0 && (
        <>
          <div className="card">
            <div className="card-header">
              <h2>Clearance Status by Department</h2>
            </div>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Date Submitted</th>
                    <th>Review Date</th>
                    <th>Remarks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.request_id}>
                      <td><strong>{req.department_name}</strong></td>
                      <td>
                        <span className={`status-badge status-${req.status}`}>
                          {getStatusIcon(req.status)} {req.status}
                        </span>
                      </td>
                      <td>{new Date(req.request_date).toLocaleDateString()}</td>
                      <td>{req.review_date ? new Date(req.review_date).toLocaleDateString() : '-'}</td>
                      <td>{req.remarks || '-'}</td>
                      <td>
                        {req.status === 'rejected' && (
                          <button 
                            className="btn btn-sm btn-primary" 
                            onClick={() => handleResubmitDepartment(req.department_id, req.department_name)}
                            disabled={submitting}
                          >
                            Resubmit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
