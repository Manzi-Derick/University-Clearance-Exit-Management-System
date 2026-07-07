const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const clearanceRoutes = require('./routes/clearance');
const adminRoutes = require('./routes/admin');
const departmentRoutes = require('./routes/departments');

const app = express();
const PORT = process.env.PORT || 5000;
const useOracle = process.env.USE_ORACLE === 'true';

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clearance', clearanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/departments', departmentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'running', mode: useOracle ? 'oracle' : 'in-memory' });
});

async function start() {
  if (useOracle) {
    const db = require('./db');
    try {
      await db.initialize();
      console.log('Connected to Oracle Database');
    } catch (err) {
      console.error('Oracle connection failed:', err.message);
      console.log('Falling back to in-memory mode');
    }
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Mode: ${useOracle ? 'Oracle Database' : 'In-memory database (demo)'}`);
    console.log(`\nDefault credentials (password: password123):`);
    console.log(`  Admin:   admin@university.edu`);
    console.log(`  Officer: library@university.edu`);
    console.log(`  Student: john@university.edu`);
  });
}

start();
