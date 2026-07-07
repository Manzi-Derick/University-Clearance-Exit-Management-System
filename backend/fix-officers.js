require('dotenv').config();
const oracledb = require('oracledb');
const bcrypt = require('bcryptjs');
oracledb.initOracleClient({ libDir: 'C:\\oraclexe\\app\\oracle\\product\\11.2.0\\server\\bin' });

async function fix() {
  const conn = await oracledb.getConnection({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECTION_STRING
  });

  const hash = bcrypt.hashSync('password123', 10);

  // Check existing officers
  const existing = await conn.execute(
    "SELECT u.department_id, d.department_name, u.email FROM users u JOIN departments d ON u.department_id = d.department_id WHERE u.role = 'officer'",
    [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  console.log('Existing officers:');
  existing.rows.forEach(r => console.log('  ', r.DEPARTMENT_NAME, '->', r.EMAIL));

  // Departments without officers
  const missing = await conn.execute(
    "SELECT d.department_id, d.department_name FROM departments d WHERE d.department_id NOT IN (SELECT NVL(department_id,0) FROM users WHERE role = 'officer')",
    [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  console.log('\nDepartments without officers:');
  missing.rows.forEach(r => console.log('  ', r.DEPARTMENT_ID, r.DEPARTMENT_NAME));

  // Create officers for missing departments
  for (const dept of missing.rows) {
    const emailPrefix = dept.DEPARTMENT_NAME.toLowerCase().replace(/[^a-z]/g, '');
    const email = emailPrefix + '@university.edu';
    const name = dept.DEPARTMENT_NAME + ' Officer';
    await conn.execute(
      'INSERT INTO users (name, email, password_hash, role, department_id) VALUES (:1, :2, :3, :4, :5)',
      [name, email, hash, 'officer', dept.DEPARTMENT_ID],
      { autoCommit: true }
    );
    console.log('  Created:', email, '->', dept.DEPARTMENT_NAME);
  }

  // Final list
  const all = await conn.execute(
    "SELECT u.email, d.department_name FROM users u JOIN departments d ON u.department_id = d.department_id WHERE u.role = 'officer' ORDER BY d.department_id",
    [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  console.log('\nAll department officers (password: password123):');
  all.rows.forEach(r => console.log('  ', r.EMAIL, '->', r.DEPARTMENT_NAME));

  await conn.close();
  console.log('\nDone!');
}
fix();
