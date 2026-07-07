const oracledb = require('oracledb');
const bcrypt = require('bcryptjs');
const { getConnection } = require('./db');

function isMissingSchemaObject(err) {
  return err && (err.message || '').includes('ORA-00942');
}

// Helper: run a query and return rows as plain objects
async function query(sql, params = [], options = {}) {
  const conn = await getConnection();
  try {
    const result = await conn.execute(sql, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      ...options
    });
    return result.rows || [];
  } finally {
    await conn.close();
  }
}

async function execute(sql, params = [], options = {}) {
  const conn = await getConnection();
  try {
    const result = await conn.execute(sql, params, { autoCommit: true, ...options });
    return result;
  } finally {
    await conn.close();
  }
}

// Normalize Oracle column names (UPPERCASE) to lowercase for frontend compatibility
function normalize(row) {
  if (!row) return null;
  const obj = {};
  for (const key of Object.keys(row)) {
    obj[key.toLowerCase()] = row[key];
  }
  return obj;
}
function normalizeAll(rows) {
  return rows.map(normalize);
}

const oracleDb = {
  // ---- USERS ----
  async findUserByEmail(email) {
    const rows = await query('SELECT * FROM users WHERE email = :1', [email]);
    return normalize(rows[0]) || null;
  },

  async findUserById(id) {
    const rows = await query('SELECT * FROM users WHERE user_id = :1', [id]);
    return normalize(rows[0]) || null;
  },

  async getAllUsers() {
    const rows = await query(
      'SELECT user_id, name, email, role, student_id, department_id, status, created_at FROM users ORDER BY user_id'
    );
    return normalizeAll(rows);
  },

  async getUsersByRole(role) {
    const rows = await query(
      'SELECT user_id, name, email, role, student_id, department_id, status, created_at FROM users WHERE role = :1',
      [role]
    );
    return normalizeAll(rows);
  },

  async createUser({ name, email, password_hash, role, student_id, department_id }) {
    const result = await execute(
      `INSERT INTO users (name, email, password_hash, role, student_id, department_id)
       VALUES (:1, :2, :3, :4, :5, :6)
       RETURNING user_id INTO :7`,
      [
        name, email, password_hash, role,
        student_id || null,
        department_id || null,
        { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      ]
    );
    const userId = result.outBinds[0][0];
    return { user_id: userId, name, email, role, student_id, department_id, status: 'active' };
  },

  async updateUserStatus(userId, status) {
    const result = await execute(
      'UPDATE users SET status = :1 WHERE user_id = :2',
      [status, userId]
    );
    return result.rowsAffected > 0;
  },

  async deleteUser(userId) {
    const result = await execute('DELETE FROM users WHERE user_id = :1', [userId]);
    return result.rowsAffected > 0;
  },

  async deleteClearanceRequestsByUser(userId) {
    const result = await execute('DELETE FROM clearance_requests WHERE user_id = :1', [userId]);
    return result.rowsAffected > 0;
  },

  async deleteClearanceRequest(requestId) {
    const result = await execute('DELETE FROM clearance_requests WHERE request_id = :1', [requestId]);
    return result.rowsAffected > 0;
  },

  // ---- DEPARTMENTS ----
  async getAllDepartments() {
    const rows = await query('SELECT * FROM departments ORDER BY department_id');
    return normalizeAll(rows);
  },

  async getDepartmentById(id) {
    const rows = await query('SELECT * FROM departments WHERE department_id = :1', [id]);
    return normalize(rows[0]) || null;
  },

  async createDepartment(name) {
    const result = await execute(
      'INSERT INTO departments (department_name) VALUES (:1) RETURNING department_id INTO :2',
      [name, { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }]
    );
    const deptId = result.outBinds[0][0];
    return { department_id: deptId, department_name: name };
  },

  async updateDepartment(id, name) {
    const result = await execute(
      'UPDATE departments SET department_name = :1 WHERE department_id = :2',
      [name, id]
    );
    if (result.rowsAffected === 0) return null;
    return { department_id: id, department_name: name };
  },

  async deleteDepartment(id) {
    const result = await execute('DELETE FROM departments WHERE department_id = :1', [id]);
    return result.rowsAffected > 0;
  },

  // ---- CLEARANCE REQUESTS ----
  async createClearanceRequest(userId, departmentId) {
    const existing = await query(
      "SELECT * FROM clearance_requests WHERE user_id = :1 AND department_id = :2 AND status <> 'rejected'",
      [userId, departmentId]
    );
    if (existing.length > 0) return null;

    await execute(
      "DELETE FROM clearance_requests WHERE user_id = :1 AND department_id = :2 AND status = 'rejected'",
      [userId, departmentId]
    );

    const result = await execute(
      'INSERT INTO clearance_requests (user_id, department_id) VALUES (:1, :2) RETURNING request_id INTO :3',
      [userId, departmentId, { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }]
    );
    const reqId = result.outBinds[0][0];
    const dept = await this.getDepartmentById(departmentId);
    const officers = await query(
      "SELECT user_id FROM users WHERE role = 'officer' AND department_id = :1 AND status = 'active'",
      [departmentId]
    );
    for (const officer of normalizeAll(officers)) {
      await this.createNotification({
        userId: officer.user_id,
        title: 'New clearance request',
        message: `A student submitted a clearance request for ${dept ? dept.department_name : 'your department'}.`,
        type: 'new_request',
        requestId: reqId
      });
    }
    return { request_id: reqId, user_id: userId, department_id: departmentId, status: 'pending' };
  },

  async submitClearanceForAllDepartments(userId) {
    const depts = await query('SELECT department_id FROM departments ORDER BY department_id');
    const created = [];
    for (const dept of depts) {
      const deptId = dept.DEPARTMENT_ID || dept.department_id;
      const existing = await query(
        'SELECT * FROM clearance_requests WHERE user_id = :1 AND department_id = :2',
        [userId, deptId]
      );
      if (existing.length === 0) {
        const result = await execute(
          'INSERT INTO clearance_requests (user_id, department_id) VALUES (:1, :2) RETURNING request_id INTO :3',
          [userId, deptId, { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }]
        );
        const reqId = result.outBinds[0][0];
        created.push({ request_id: reqId, user_id: userId, department_id: deptId, status: 'pending' });
      }
    }
    return created;
  },

  async getRequestsByUser(userId) {
    const rows = await query(
      `SELECT cr.*, d.department_name
       FROM clearance_requests cr
       JOIN departments d ON cr.department_id = d.department_id
       WHERE cr.user_id = :1
       ORDER BY cr.request_id`,
      [userId]
    );
    return normalizeAll(rows);
  },

  async getRequestsByDepartment(departmentId) {
    const rows = await query(
      `SELECT cr.*, u.name AS student_name, u.email AS student_email, u.student_id AS student_id_code
       FROM clearance_requests cr
       JOIN users u ON cr.user_id = u.user_id
       WHERE cr.department_id = :1
       ORDER BY cr.request_id`,
      [departmentId]
    );
    return normalizeAll(rows);
  },

  async getAllRequests() {
    const rows = await query(
      `SELECT cr.*,
              u.name AS student_name, u.student_id AS student_id_code,
              d.department_name,
              r.name AS reviewer_name
       FROM clearance_requests cr
       JOIN users u ON cr.user_id = u.user_id
       JOIN departments d ON cr.department_id = d.department_id
       LEFT JOIN users r ON cr.reviewed_by = r.user_id
       ORDER BY cr.request_id`
    );
    return normalizeAll(rows);
  },

  async updateRequestStatus(requestId, status, reviewedBy, remarks) {
    await execute(
      'UPDATE clearance_requests SET status = :1, reviewed_by = :2, remarks = :3, review_date = CURRENT_TIMESTAMP WHERE request_id = :4',
      [status, reviewedBy, remarks || null, requestId]
    );
    const rows = await query('SELECT * FROM clearance_requests WHERE request_id = :1', [requestId]);
    const request = normalize(rows[0]);
    if (request) {
      const dept = await this.getDepartmentById(request.department_id);
      await this.createNotification({
        userId: request.user_id,
        title: `Clearance ${status}`,
        message: `${dept ? dept.department_name : 'A department'} ${status} your clearance request.${remarks ? ` Remarks: ${remarks}` : ''}`,
        type: `request_${status}`,
        requestId
      });
    }
    return request;
  },

  async getRequestById(requestId) {
    const rows = await query('SELECT * FROM clearance_requests WHERE request_id = :1', [requestId]);
    return normalize(rows[0]) || null;
  },

  // ---- REPORTS ----
  async getClearanceStats() {
    const rows = await query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected
      FROM clearance_requests
    `);
    const r = normalize(rows[0]);

    const studentRows = await query("SELECT COUNT(*) AS cnt FROM users WHERE role = 'student'");
    const deptRows = await query('SELECT COUNT(*) AS cnt FROM departments');

    const clearedRows = await query(`
      SELECT cr.user_id
      FROM clearance_requests cr
      GROUP BY cr.user_id
      HAVING COUNT(*) = (SELECT COUNT(*) FROM departments)
         AND SUM(CASE WHEN cr.status = 'approved' THEN 1 ELSE 0 END) = (SELECT COUNT(*) FROM departments)
    `);

    return {
      total: r.total || 0,
      pending: r.pending || 0,
      approved: r.approved || 0,
      rejected: r.rejected || 0,
      totalStudents: normalize(studentRows[0]).cnt || 0,
      totalDepartments: normalize(deptRows[0]).cnt || 0,
      fullyCleared: clearedRows.length
    };
  },

  async getDepartmentStats() {
    const rows = await query(`
      SELECT d.department_id,
             d.department_name,
             COUNT(cr.request_id) AS total,
             SUM(CASE WHEN cr.status = 'pending' THEN 1 ELSE 0 END) AS pending,
             SUM(CASE WHEN cr.status = 'approved' THEN 1 ELSE 0 END) AS approved,
             SUM(CASE WHEN cr.status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
             AVG(CASE
               WHEN cr.review_date IS NOT NULL THEN
                 (CAST(cr.review_date AS DATE) - CAST(cr.request_date AS DATE)) * 24
               ELSE NULL
             END) AS average_review_hours
      FROM departments d
      LEFT JOIN clearance_requests cr ON d.department_id = cr.department_id
      GROUP BY d.department_id, d.department_name
      ORDER BY d.department_name
    `);
    const stats = normalizeAll(rows).map(row => ({
      ...row,
      pending_backlog: row.pending || 0,
      average_review_hours: Number((row.average_review_hours || 0).toFixed(2)),
      rejection_reasons: []
    }));

    const reasonRows = normalizeAll(await query(`
      SELECT d.department_id,
             cr.remarks AS reason,
             COUNT(*) AS count
      FROM clearance_requests cr
      JOIN departments d ON cr.department_id = d.department_id
      WHERE cr.status = 'rejected' AND cr.remarks IS NOT NULL
      GROUP BY d.department_id, cr.remarks
      ORDER BY d.department_id, count DESC
    `));

    return stats.map(dept => ({
      ...dept,
      rejection_reasons: reasonRows
        .filter(r => r.department_id === dept.department_id)
        .map(r => ({ reason: r.reason, count: r.count }))
    }));
  },

  async isStudentFullyCleared(userId) {
    const rows = await query(`
      SELECT COUNT(*) AS total,
             SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_count
      FROM clearance_requests WHERE user_id = :1
    `, [userId]);
    const r = normalize(rows[0]);
    const deptRows = await query('SELECT COUNT(*) AS cnt FROM departments');
    const deptCount = normalize(deptRows[0]).cnt;
    return r.total === deptCount && r.approved_count === deptCount;
  },

  async createNotification({ userId, title, message, type, requestId = null }) {
    try {
      const result = await execute(
        `INSERT INTO notifications (user_id, title, message, type, request_id)
         VALUES (:1, :2, :3, :4, :5)
         RETURNING notification_id INTO :6`,
        [userId, title, message, type, requestId, { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }]
      );
      return {
        notification_id: result.outBinds[0][0],
        user_id: userId,
        title,
        message,
        type,
        request_id: requestId,
        is_read: 'N'
      };
    } catch (err) {
      if (isMissingSchemaObject(err)) {
        console.warn('Notifications table is not installed yet. Run database/schema.sql to enable notifications.');
        return null;
      }
      throw err;
    }
  },

  async getNotificationsByUser(userId) {
    try {
      const rows = await query(
        `SELECT notification_id, user_id, title, message, type, request_id, is_read, created_at
         FROM notifications
         WHERE user_id = :1
         ORDER BY created_at DESC, notification_id DESC`,
        [userId]
      );
      return normalizeAll(rows);
    } catch (err) {
      if (isMissingSchemaObject(err)) return [];
      throw err;
    }
  },

  async markNotificationsRead(userId) {
    try {
      await execute("UPDATE notifications SET is_read = 'Y' WHERE user_id = :1", [userId]);
    } catch (err) {
      if (!isMissingSchemaObject(err)) throw err;
    }
    return true;
  }
};

module.exports = oracleDb;
