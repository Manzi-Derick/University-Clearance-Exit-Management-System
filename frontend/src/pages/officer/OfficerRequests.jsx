import { useState, useEffect } from 'react';
import { getDepartmentRequests, approveRequest, rejectRequest } from '../../services/api';
import { FiCheckCircle, FiXCircle, FiClock, FiMessageSquare } from 'react-icons/fi';

export default function OfficerRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [remarksModal, setRemarksModal] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await getDepartmentRequests();
      setRequests(res.data.requests);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleApprove = async (requestId) => {
    setProcessing(true);
    try {
      await approveRequest(requestId, '');
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectOpen = (requestId) => {
    setRemarksModal(requestId);
    setRemarks('');
  };

  const handleRejectConfirm = async () => {
    if (!remarks.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }
    setProcessing(true);
    try {
      await rejectRequest(remarksModal, remarks);
      setRemarksModal(null);
      setRemarks('');
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject.');
    } finally {
      setProcessing(false);
    }
  };

  const filteredRequests = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Clearance Requests</h1>
        <p>Review and process student clearance requests for your department</p>
      </div>

      <div className="filter-bar">
        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          All ({requests.length})
        </button>
        <button className={`filter-btn ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
          Pending ({requests.filter(r => r.status === 'pending').length})
        </button>
        <button className={`filter-btn ${filter === 'approved' ? 'active' : ''}`} onClick={() => setFilter('approved')}>
          Approved ({requests.filter(r => r.status === 'approved').length})
        </button>
        <button className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>
          Rejected ({requests.filter(r => r.status === 'rejected').length})
        </button>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="empty-state">
          <h3>No {filter !== 'all' ? filter : ''} requests found</h3>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Student ID</th>
                  <th>Email</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => (
                  <tr key={req.request_id}>
                    <td><strong>{req.student_name}</strong></td>
                    <td>{req.student_id_code || '-'}</td>
                    <td>{req.student_email}</td>
                    <td>{new Date(req.request_date).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge status-${req.status}`}>{req.status}</span>
                    </td>
                    <td>{req.remarks || '-'}</td>
                    <td>
                      {req.status === 'pending' ? (
                        <div className="action-buttons">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleApprove(req.request_id)}
                            disabled={processing}
                          >
                            <FiCheckCircle /> Approve
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRejectOpen(req.request_id)}
                            disabled={processing}
                          >
                            <FiXCircle /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="processed">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {remarksModal && (
        <div className="modal-overlay" onClick={() => setRemarksModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3><FiMessageSquare /> Rejection Reason</h3>
            <p>Please provide a reason for rejecting this clearance request:</p>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g., Outstanding library books, unpaid fees..."
              rows={3}
            />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setRemarksModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleRejectConfirm} disabled={processing}>
                {processing ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
