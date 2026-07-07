const express = require('express');
const bcrypt = require('bcryptjs');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const db = require('../getDb');

const router = express.Router();

// GET /api/admin/users - Get all users
router.get('/users', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json({ users });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/admin/users - Create a new user (officer or student)
router.post('/users', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { name, email, password, role, studentId, departmentId } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }

    if (!['student', 'officer', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }

    const existing = await db.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await db.createUser({
      name,
      email,
      password_hash,
      role,
      student_id: studentId || null,
      department_id: departmentId || null
    });

    res.status(201).json({ message: 'User created.', user });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/admin/users/:id/status - Activate/deactivate user
router.put('/users/:id/status', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Status must be active or inactive.' });
    }

    const updated = await db.updateUserStatus(userId, status);
    if (!updated) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ message: `User ${status === 'active' ? 'activated' : 'deactivated'}.` });
  } catch (err) {
    console.error('Update user status error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/admin/users/:id - Delete a user
router.delete('/users/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Prevent admin from deleting themselves
    if (userId === req.user.userId) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }
    
    const deleted = await db.deleteUser(userId);
    if (!deleted) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Delete user error:', err);
    
    // Check for Oracle foreign key constraint error
    if (err.code === 'ORA-02292') {
      return res.status(400).json({ 
        error: 'Cannot delete user. This user has clearance requests associated with them. Delete the requests first or use deactivate instead.' 
      });
    }
    
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/admin/departments - Get all departments
router.get('/departments', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const departments = await db.getAllDepartments();
    res.json({ departments });
  } catch (err) {
    console.error('Get departments error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/admin/departments - Create department
router.post('/departments', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Department name is required.' });
    }
    const dept = await db.createDepartment(name);
    res.status(201).json({ message: 'Department created.', department: dept });
  } catch (err) {
    console.error('Create department error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/admin/departments/:id - Update department
router.put('/departments/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const deptId = parseInt(req.params.id);
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Department name is required.' });
    }
    const dept = await db.updateDepartment(deptId, name);
    if (!dept) {
      return res.status(404).json({ error: 'Department not found.' });
    }
    res.json({ message: 'Department updated.', department: dept });
  } catch (err) {
    console.error('Update department error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/admin/departments/:id - Delete department
router.delete('/departments/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const deptId = parseInt(req.params.id);
    const deleted = await db.deleteDepartment(deptId);
    if (!deleted) {
      return res.status(404).json({ error: 'Department not found.' });
    }
    res.json({ message: 'Department deleted.' });
  } catch (err) {
    console.error('Delete department error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/admin/reports - Get clearance statistics
router.get('/reports', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const stats = await db.getClearanceStats();
    const departmentStats = await db.getDepartmentStats();
    res.json({ stats, departmentStats });
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/admin/requests/:id - Delete a single clearance request
router.delete('/requests/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const deleted = await db.deleteClearanceRequest(requestId);
    if (!deleted) {
      return res.status(404).json({ error: 'Request not found.' });
    }
    res.json({ message: 'Clearance request deleted successfully.' });
  } catch (err) {
    console.error('Delete request error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
