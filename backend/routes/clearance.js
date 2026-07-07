const express = require('express');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const db = require('../getDb');

const router = express.Router();

// GET /api/clearance/my-requests - Student views their clearance requests
router.get('/my-requests', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const requests = await db.getRequestsByUser(req.user.userId);
    const isFullyCleared = await db.isStudentFullyCleared(req.user.userId);
    res.json({ requests, isFullyCleared });
  } catch (err) {
    console.error('Get requests error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/clearance/submit - Student submits clearance to one selected department
router.post('/submit', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const departmentId = parseInt(req.body.departmentId, 10);
    if (!departmentId) {
      return res.status(400).json({ error: 'Select a department before submitting a clearance request.' });
    }

    const department = await db.getDepartmentById(departmentId);
    if (!department) {
      return res.status(404).json({ error: 'Department not found.' });
    }

    const created = await db.createClearanceRequest(req.user.userId, departmentId);
    if (!created) {
      return res.status(409).json({
        error: 'You already have an active clearance request for this department.'
      });
    }

    res.status(201).json({
      message: `Clearance request submitted to ${department.department_name}.`,
      request: created
    });
  } catch (err) {
    console.error('Submit clearance error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/clearance/department-requests - Officer views requests for their department
router.get('/department-requests', authMiddleware, roleMiddleware('officer'), async (req, res) => {
  try {
    const requests = await db.getRequestsByDepartment(req.user.departmentId);
    res.json({ requests });
  } catch (err) {
    console.error('Get department requests error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/clearance/:id/approve - Officer approves a request
router.put('/:id/approve', authMiddleware, roleMiddleware('officer'), async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const request = await db.getRequestById(requestId);

    if (!request) {
      return res.status(404).json({ error: 'Request not found.' });
    }
    if (request.department_id !== req.user.departmentId) {
      return res.status(403).json({ error: 'Not authorized for this department.' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed.' });
    }

    const updated = await db.updateRequestStatus(requestId, 'approved', req.user.userId, req.body.remarks);
    res.json({ message: 'Clearance approved.', request: updated });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/clearance/:id/reject - Officer rejects a request
router.put('/:id/reject', authMiddleware, roleMiddleware('officer'), async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const request = await db.getRequestById(requestId);

    if (!request) {
      return res.status(404).json({ error: 'Request not found.' });
    }
    if (request.department_id !== req.user.departmentId) {
      return res.status(403).json({ error: 'Not authorized for this department.' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed.' });
    }

    const remarks = req.body.remarks || 'Pending obligations found.';
    const updated = await db.updateRequestStatus(requestId, 'rejected', req.user.userId, remarks);
    res.json({ message: 'Clearance rejected.', request: updated });
  } catch (err) {
    console.error('Reject error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/clearance/all - Admin views all requests
router.get('/all', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const requests = await db.getAllRequests();
    res.json({ requests });
  } catch (err) {
    console.error('Get all requests error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/clearance/certificate-status - Check if student can download certificate
router.get('/certificate-status', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const isFullyCleared = await db.isStudentFullyCleared(req.user.userId);
    res.json({ eligible: isFullyCleared });
  } catch (err) {
    console.error('Certificate status error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/clearance/notifications - Current user notifications
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = await db.getNotificationsByUser(req.user.userId);
    res.json({
      notifications,
      unreadCount: notifications.filter(n => n.is_read === 'N').length
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/clearance/notifications/read - Mark current user's notifications as read
router.put('/notifications/read', authMiddleware, async (req, res) => {
  try {
    await db.markNotificationsRead(req.user.userId);
    res.json({ message: 'Notifications marked as read.' });
  } catch (err) {
    console.error('Mark notifications error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
