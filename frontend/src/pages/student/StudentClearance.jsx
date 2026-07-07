import { useState, useEffect } from 'react';
import { getMyRequests } from '../../services/api';
import { FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';

export default function StudentClearance() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getMyRequests();
        setRequests(res.data.requests);
      } catch (err) {
        console.error('Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  const getProgressPercent = () => {
    if (requests.length === 0) return 0;
    return Math.round((requests.filter(r => r.status === 'approved').length / requests.length) * 100);
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>My Clearance Status</h1>
        <p>Detailed view of each department clearance request you have submitted</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Overall Progress</h2>
          <span className="progress-text">{getProgressPercent()}% Complete</span>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${getProgressPercent()}%` }}></div>
        </div>
      </div>

      <div className="clearance-grid">
        {requests.map((req) => (
          <div key={req.request_id} className={`clearance-card clearance-${req.status}`}>
            <div className="clearance-card-header">
              {req.status === 'approved' && <FiCheckCircle size={28} className="approved" />}
              {req.status === 'rejected' && <FiXCircle size={28} className="rejected" />}
              {req.status === 'pending' && <FiClock size={28} className="pending" />}
            </div>
            <h3>{req.department_name}</h3>
            <span className={`status-badge status-${req.status}`}>{req.status}</span>
            {req.remarks && <p className="remarks">{req.remarks}</p>}
            <p className="date">Submitted: {new Date(req.request_date).toLocaleDateString()}</p>
            {req.review_date && <p className="date">Reviewed: {new Date(req.review_date).toLocaleDateString()}</p>}
          </div>
        ))}
      </div>

      {requests.length === 0 && (
        <div className="empty-state">
          <h3>No clearance requests found</h3>
          <p>Go to Dashboard to submit your clearance request.</p>
        </div>
      )}
    </div>
  );
}
