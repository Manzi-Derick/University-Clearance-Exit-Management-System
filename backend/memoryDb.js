const bcrypt = require('bcryptjs');

// In-memory database for demo mode (when Oracle is not available)
const departments = [
  { department_id: 1, department_name: 'Library', created_at: new Date() },
  { department_id: 2, department_name: 'Finance', created_at: new Date() },
  { department_id: 3, department_name: 'IT Department', created_at: new Date() }
];

const defaultHash = bcrypt.hashSync('password123', 10);

const users = [
  { user_id: 1, name: 'System Admin', email: 'admin@university.edu', password_hash: defaultHash, role: 'admin', student_id: null, department_id: null, status: 'active', created_at: new Date() },
  { user_id: 2, name: 'Library Officer', email: 'library@university.edu', password_hash: defaultHash, role: 'officer', student_id: null, department_id: 1, status: 'active', created_at: new Date() },
  { user_id: 3, name: 'Finance Officer', email: 'finance@university.edu', password_hash: defaultHash, role: 'officer', student_id: null, department_id: 2, status: 'active', created_at: new Date() },
  { user_id: 4, name: 'IT Officer', email: 'it@university.edu', password_hash: defaultHash, role: 'officer', student_id: null, department_id: 3, status: 'active', created_at: new Date() },
  { user_id: 8, name: 'John Doe', email: 'john@university.edu', password_hash: defaultHash, role: 'student', student_id: 'STU001', department_id: null, status: 'active', created_at: new Date() },
  { user_id: 9, name: 'Jane Smith', email: 'jane@university.edu', password_hash: defaultHash, role: 'student', student_id: 'STU002', department_id: null, status: 'active', created_at: new Date() }
];

let clearanceRequests = [];
const notifications = [];

let nextUserId = 10;
let nextDeptId = 7;
let nextRequestId = 1;
let nextNotificationId = 1;

function createNotification({ user_id, title, message, type, request_id = null }) {
  const notification = {
    notification_id: nextNotificationId++,
    user_id,
    title,
    message,
    type,
    request_id,
    is_read: 'N',
    created_at: new Date()
  };
  notifications.push(notification);
  return notification;
}

const memoryDb = {
  // ---- USERS ----
  findUserByEmail(email) {
    return users.find(u => u.email === email) || null;
  },

  findUserById(id) {
    return users.find(u => u.user_id === id) || null;
  },

  getAllUsers() {
    return users.map(({ password_hash, ...u }) => u);
  },

  getUsersByRole(role) {
    return users.filter(u => u.role === role).map(({ password_hash, ...u }) => u);
  },

  createUser({ name, email, password_hash, role, student_id, department_id }) {
    const user = {
      user_id: nextUserId++,
      name,
      email,
      password_hash,
      role,
      student_id: student_id || null,
      department_id: department_id || null,
      status: 'active',
      created_at: new Date()
    };
    users.push(user);
    const { password_hash: _, ...safe } = user;
    return safe;
  },

  updateUserStatus(userId, status) {
    const user = users.find(u => u.user_id === userId);
    if (user) {
      user.status = status;
      return true;
    }
    return false;
  },

  deleteUser(userId) {
    const idx = users.findIndex(u => u.user_id === userId);
    if (idx !== -1) {
      users.splice(idx, 1);
      return true;
    }
    return false;
  },

  deleteClearanceRequestsByUser(userId) {
    const count = clearanceRequests.length;
    clearanceRequests = clearanceRequests.filter(r => r.user_id !== userId);
    return clearanceRequests.length < count; // Returns true if any were deleted
  },

  deleteClearanceRequest(requestId) {
    const idx = clearanceRequests.findIndex(r => r.request_id === requestId);
    if (idx !== -1) {
      clearanceRequests.splice(idx, 1);
      return true;
    }
    return false;
  },

  // ---- DEPARTMENTS ----
  getAllDepartments() {
    return [...departments];
  },

  getDepartmentById(id) {
    return departments.find(d => d.department_id === id) || null;
  },

  createDepartment(name) {
    const dept = { department_id: nextDeptId++, department_name: name, created_at: new Date() };
    departments.push(dept);
    return dept;
  },

  updateDepartment(id, name) {
    const dept = departments.find(d => d.department_id === id);
    if (dept) {
      dept.department_name = name;
      return dept;
    }
    return null;
  },

  deleteDepartment(id) {
    const idx = departments.findIndex(d => d.department_id === id);
    if (idx !== -1) {
      departments.splice(idx, 1);
      return true;
    }
    return false;
  },

  // ---- CLEARANCE REQUESTS ----
  createClearanceRequest(userId, departmentId) {
    const existing = clearanceRequests.find(
      r => r.user_id === userId && r.department_id === departmentId && r.status !== 'rejected'
    );
    if (existing) return null;

    const rejected = clearanceRequests.find(
      r => r.user_id === userId && r.department_id === departmentId && r.status === 'rejected'
    );
    if (rejected) {
      clearanceRequests = clearanceRequests.filter(r => r.request_id !== rejected.request_id);
    }

    const req = {
      request_id: nextRequestId++,
      user_id: userId,
      department_id: departmentId,
      status: 'pending',
      remarks: null,
      reviewed_by: null,
      request_date: new Date(),
      review_date: null
    };
    clearanceRequests.push(req);
    const dept = departments.find(d => d.department_id === departmentId);
    users
      .filter(u => u.role === 'officer' && u.department_id === departmentId && u.status === 'active')
      .forEach(officer => createNotification({
        user_id: officer.user_id,
        title: 'New clearance request',
        message: `A student submitted a clearance request for ${dept ? dept.department_name : 'your department'}.`,
        type: 'new_request',
        request_id: req.request_id
      }));
    return req;
  },

  submitClearanceForAllDepartments(userId) {
    const created = [];
    for (const dept of departments) {
      const existing = clearanceRequests.find(
        r => r.user_id === userId && r.department_id === dept.department_id
      );
      if (!existing) {
        const req = {
          request_id: nextRequestId++,
          user_id: userId,
          department_id: dept.department_id,
          status: 'pending',
          remarks: null,
          reviewed_by: null,
          request_date: new Date(),
          review_date: null
        };
        clearanceRequests.push(req);
        created.push(req);
      }
    }
    return created;
  },

  getRequestsByUser(userId) {
    return clearanceRequests
      .filter(r => r.user_id === userId)
      .map(r => {
        const dept = departments.find(d => d.department_id === r.department_id);
        return { ...r, department_name: dept ? dept.department_name : 'Unknown' };
      });
  },

  getRequestsByDepartment(departmentId) {
    return clearanceRequests
      .filter(r => r.department_id === departmentId)
      .map(r => {
        const user = users.find(u => u.user_id === r.user_id);
        return {
          ...r,
          student_name: user ? user.name : 'Unknown',
          student_email: user ? user.email : '',
          student_id_code: user ? user.student_id : ''
        };
      });
  },

  getAllRequests() {
    return clearanceRequests.map(r => {
      const user = users.find(u => u.user_id === r.user_id);
      const dept = departments.find(d => d.department_id === r.department_id);
      const reviewer = r.reviewed_by ? users.find(u => u.user_id === r.reviewed_by) : null;
      return {
        ...r,
        student_name: user ? user.name : 'Unknown',
        student_id_code: user ? user.student_id : '',
        department_name: dept ? dept.department_name : 'Unknown',
        reviewer_name: reviewer ? reviewer.name : null
      };
    });
  },

  updateRequestStatus(requestId, status, reviewedBy, remarks) {
    const req = clearanceRequests.find(r => r.request_id === requestId);
    if (req) {
      req.status = status;
      req.reviewed_by = reviewedBy;
      req.remarks = remarks || null;
      req.review_date = new Date();
      const dept = departments.find(d => d.department_id === req.department_id);
      createNotification({
        user_id: req.user_id,
        title: `Clearance ${status}`,
        message: `${dept ? dept.department_name : 'A department'} ${status} your clearance request.${remarks ? ` Remarks: ${remarks}` : ''}`,
        type: `request_${status}`,
        request_id: req.request_id
      });
      return req;
    }
    return null;
  },

  getRequestById(requestId) {
    return clearanceRequests.find(r => r.request_id === requestId) || null;
  },

  // ---- REPORTS ----
  getClearanceStats() {
    const total = clearanceRequests.length;
    const pending = clearanceRequests.filter(r => r.status === 'pending').length;
    const approved = clearanceRequests.filter(r => r.status === 'approved').length;
    const rejected = clearanceRequests.filter(r => r.status === 'rejected').length;
    const totalStudents = users.filter(u => u.role === 'student').length;
    const totalDepartments = departments.length;

    // Students fully cleared (all departments approved)
    const studentIds = [...new Set(clearanceRequests.map(r => r.user_id))];
    let fullyCleared = 0;
    for (const sid of studentIds) {
      const reqs = clearanceRequests.filter(r => r.user_id === sid);
      if (reqs.length === departments.length && reqs.every(r => r.status === 'approved')) {
        fullyCleared++;
      }
    }

    return { total, pending, approved, rejected, totalStudents, totalDepartments, fullyCleared };
  },

  getDepartmentStats() {
    return departments.map(d => {
      const reqs = clearanceRequests.filter(r => r.department_id === d.department_id);
      const reviewed = reqs.filter(r => r.review_date && r.request_date);
      const averageReviewHours = reviewed.length
        ? reviewed.reduce((sum, r) => sum + ((new Date(r.review_date) - new Date(r.request_date)) / 36e5), 0) / reviewed.length
        : 0;
      const rejectionReasons = reqs
        .filter(r => r.status === 'rejected' && r.remarks)
        .reduce((acc, r) => {
          acc[r.remarks] = (acc[r.remarks] || 0) + 1;
          return acc;
        }, {});
      return {
        department_id: d.department_id,
        department_name: d.department_name,
        total: reqs.length,
        pending: reqs.filter(r => r.status === 'pending').length,
        approved: reqs.filter(r => r.status === 'approved').length,
        rejected: reqs.filter(r => r.status === 'rejected').length,
        average_review_hours: Number(averageReviewHours.toFixed(2)),
        pending_backlog: reqs.filter(r => r.status === 'pending').length,
        rejection_reasons: Object.entries(rejectionReasons).map(([reason, count]) => ({ reason, count }))
      };
    });
  },

  isStudentFullyCleared(userId) {
    const reqs = clearanceRequests.filter(r => r.user_id === userId);
    return reqs.length === departments.length && reqs.every(r => r.status === 'approved');
  },

  getNotificationsByUser(userId) {
    return notifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  markNotificationsRead(userId) {
    notifications
      .filter(n => n.user_id === userId)
      .forEach(n => { n.is_read = 'Y'; });
    return true;
  }
};

module.exports = memoryDb;
