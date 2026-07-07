const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const db = require('../getDb');

const router = express.Router();

// GET /api/departments - Public list of departments
router.get('/', authMiddleware, async (req, res) => {
  try {
    const departments = await db.getAllDepartments();
    res.json({ departments });
  } catch (err) {
    console.error('Get departments error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
