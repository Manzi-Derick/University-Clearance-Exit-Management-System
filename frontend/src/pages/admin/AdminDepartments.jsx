import { useState, useEffect } from 'react';
import { getAllDepartments, createDepartment, updateDepartment, deleteDepartment } from '../../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX } from 'react-icons/fi';

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const fetchDepartments = async () => {
    try {
      const res = await getAllDepartments();
      setDepartments(res.data.departments);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createDepartment(newName.trim());
      setNewName('');
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create department.');
    }
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    try {
      await updateDepartment(id, editName.trim());
      setEditingId(null);
      fetchDepartments();
    } catch {
      alert('Failed to update department.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      await deleteDepartment(id);
      fetchDepartments();
      alert('Department deleted successfully.');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to delete department.';
      alert(errorMsg);
      console.error('Delete error:', err);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Manage Departments</h1>
      </div>

      <div className="card form-card">
        <h3>Add New Department</h3>
        <form onSubmit={handleCreate} className="inline-form">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Department name"
            required
          />
          <button type="submit" className="btn btn-primary">
            <FiPlus /> Add
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>All Departments ({departments.length})</h2>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Department Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.department_id}>
                  <td>{dept.department_id}</td>
                  <td>
                    {editingId === dept.department_id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="inline-edit"
                      />
                    ) : (
                      <strong>{dept.department_name}</strong>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {editingId === dept.department_id ? (
                        <>
                          <button className="btn btn-sm btn-success" onClick={() => handleUpdate(dept.department_id)}>
                            <FiSave /> Save
                          </button>
                          <button className="btn btn-sm btn-secondary" onClick={() => setEditingId(null)}>
                            <FiX /> Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => { setEditingId(dept.department_id); setEditName(dept.department_name); }}
                          >
                            <FiEdit2 /> Edit
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(dept.department_id)}>
                            <FiTrash2 /> Delete
                          </button>
                        </>
                      )}
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
