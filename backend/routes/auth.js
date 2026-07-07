const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../getDb');
require('dotenv').config();

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ error: 'Account is deactivated. Contact administrator.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
        role: user.role,
        name: user.name,
        departmentId: user.department_id,
        studentId: user.student_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        userId: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.student_id,
        departmentId: user.department_id
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/register (student self-registration)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, studentId } = req.body;
    if (!name || !email || !password || !studentId) {
      return res.status(400).json({ error: 'All fields are required.' });
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
      role: 'student',
      student_id: studentId,
      department_id: null
    });

    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
        role: user.role,
        name: user.name,
        departmentId: null,
        studentId: user.student_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        userId: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.student_id
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
