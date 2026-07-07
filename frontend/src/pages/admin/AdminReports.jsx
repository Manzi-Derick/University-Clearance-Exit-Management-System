import { useState, useEffect } from 'react';
import { getReports, getAllRequests, deleteClearanceRequest } from '../../services/api';
import { FiBarChart2, FiDownload, FiTrash2 } from 'react-icons/fi';

export default function AdminReports() {
  const [stats, setStats] = useState(null);
  const [deptStats, setDeptStats] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportsRes, requestsRes] = await Promise.all([getReports(), getAllRequests()]);
        setStats(reportsRes.data.stats);
        setDeptStats(reportsRes.data.departmentStats);
        setRequests(requestsRes.data.requests);
      } catch (err) {
        console.error('Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDeleteRequest = async (requestId) => {
    if (!confirm('Are you sure you want to delete this clearance request?')) return;
    try {
      await deleteClearanceRequest(requestId);
      setRequests(requests.filter(r => r.request_id !== requestId));
      alert('Clearance request deleted successfully!');
    } catch (err) {
      alert('Failed to delete request.');
      console.error('Delete error:', err);
    }
  };

  const handleExport = () => {
    let csv = 'Request ID,Student,Student ID,Department,Status,Remarks,Request Date,Review Date\n';
    requests.forEach(r => {
      csv += `${r.request_id},"${r.student_name}",${r.student_id_code || ''},"${r.department_name}",${r.status},"${r.remarks || ''}",${r.request_date},${r.review_date || ''}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clearance_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Clearance Reports</h1>
        <button className="btn btn-primary" onClick={handleExport} disabled={requests.length === 0}>
          <FiDownload /> Export CSV
        </button>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Requests</div>
          </div>
          <div className="stat-card stat-pending">
            <div className="stat-number">{stats.pending}</div>
            <div className="stat-label">Pending</div>
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
      )}

      {deptStats.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2><FiBarChart2 /> Department Statistics</h2>
          </div>
          <div className="dept-stats-grid">
            {deptStats.map((dept, idx) => (
              <div key={idx} className="dept-stat-card">
                <h3>{dept.department_name}</h3>
                <div className="dept-performance">
                  <div className="dept-performance-item">
                    <span>Avg Review</span>
                    <strong>{Number(dept.average_review_hours || 0).toFixed(1)}h</strong>
                  </div>
                  <div className="dept-performance-item">
                    <span>Backlog</span>
                    <strong>{dept.pending_backlog || 0}</strong>
                  </div>
                </div>
                <div className="dept-stat-bars">
                  <div className="dept-stat-row">
                    <span>Pending</span>
                    <div className="mini-bar">
                      <div className="mini-bar-fill pending" style={{ width: `${dept.total ? (dept.pending / dept.total) * 100 : 0}%` }}></div>
                    </div>
                    <span>{dept.pending}</span>
                  </div>
                  <div className="dept-stat-row">
                    <span>Approved</span>
                    <div className="mini-bar">
                      <div className="mini-bar-fill approved" style={{ width: `${dept.total ? (dept.approved / dept.total) * 100 : 0}%` }}></div>
                    </div>
                    <span>{dept.approved}</span>
                  </div>
                  <div className="dept-stat-row">
                    <span>Rejected</span>
                    <div className="mini-bar">
                      <div className="mini-bar-fill rejected" style={{ width: `${dept.total ? (dept.rejected / dept.total) * 100 : 0}%` }}></div>
                    </div>
                    <span>{dept.rejected}</span>
                  </div>
                </div>
                {dept.rejection_reasons?.length > 0 && (
                  <div className="reason-list">
                    <h4>Rejection Reasons</h4>
                    {dept.rejection_reasons.map((item) => (
                      <span key={item.reason} className="reason-pill">
                        {item.reason} <strong>{item.count}</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {requests.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>All Clearance Requests</h2>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Reviewed By</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.request_id}>
                    <td>{r.request_id}</td>
                    <td><strong>{r.student_name}</strong> ({r.student_id_code})</td>
                    <td>{r.department_name}</td>
                    <td><span className={`status-badge status-${r.status}`}>{r.status}</span></td>
                    <td>{r.reviewer_name || '-'}</td>
                    <td>{new Date(r.request_date).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-danger" 
                        onClick={() => handleDeleteRequest(r.request_id)}
                        title="Delete Request"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
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
