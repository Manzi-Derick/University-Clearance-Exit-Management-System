# UniClear - University Clearance & Exit Management System

## 🎓 Overview

**UniClear** is a comprehensive web-based application designed to streamline and automate the university clearance and exit process for graduating students. The system replaces manual, paper-based clearance procedures with a efficient digital workflow, enabling students to track their clearance status in real-time across multiple departments.

---

## ✨ Key Features

### For Students
- **Online Clearance Submission** - Submit clearance requests to all departments with one click
- **Real-Time Status Tracking** - Monitor clearance progress across Library, Finance, IT, and other departments
- **Resubmission Capability** - Resubmit rejected requests after fixing issues (second chances!)
- **Progress Dashboard** - Visual progress bars and statistics showing approval status
- **Digital Certificate** - Download clearance certificate once all departments approve

### For Department Officers
- **Department Dashboard** - View all pending clearance requests for your department
- **Approve/Reject Actions** - Process requests with detailed remarks
- **Queue Management** - Organized view of pending, approved, and rejected requests
- **Statistics & Reports** - Track department clearance metrics

### For Administrators
- **Full User Management** - Create, update, activate/deactivate, and delete users (students, officers, admins)
- **Department Management** - Add, edit, or remove departments dynamically
- **System-Wide Reports** - View all clearance requests across all departments
- **Cascade Delete** - Automatically clean up user data when deleting accounts
- **Individual Request Deletion** - Remove specific clearance requests if needed
- **Stats Dashboard** - Comprehensive analytics on system usage

---

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Context API** - Global state management
- **CSS3** - Custom styling with responsive design
- **React Icons** - Icon library (FiMail, FiLock, etc.)

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Oracle Database** - Primary database (with SQL Developer)
- **In-Memory Database** - Fallback database option
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### Database
- **Oracle Database 11g/12c** - Enterprise-grade RDBMS
- **SQL Developer** - Database management tool
- **Schema-based design** - Normalized tables with foreign key constraints

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- Oracle Database (XE or full version)
- SQL Developer (for database management)
- Git (optional, for version control)

### Step 1: Clone the Repository
```bash
git clone https://github.com/yourusername/uniclear.git
cd uniclear
```

### Step 2: Install Dependencies

You can install all dependencies for both root, backend, and frontend using the following command from the root directory:
```bash
npm run install-all
```

Alternatively, install them manually:

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 3: Configure Database

**Option A: Fresh Database Setup**
1. Open Oracle SQL Developer
2. Connect as SYSTEM
3. Run: `database/schema.sql`
4. This creates tables and inserts default data

**Option B: Use Existing Database**
If you already have the database set up, skip this step.

### Step 4: Configure Environment

1. Copy the example environment file:
   ```bash
   cp .env.example backend/.env
   ```
2. Edit `backend/.env` with your actual credentials:
```env
USE_ORACLE=true
DB_USER=SYSTEM
DB_PASSWORD=your_actual_password
DB_CONNECTION_STRING=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=localhost)(PORT=1521))(CONNECT_DATA=(SID=XE)))
JWT_SECRET=your_secret_key
PORT=5000
```

### Step 5: Start the Application

**Quick Start (Recommended):**
```bash
# Double-click start.bat (Windows)
# OR run the PowerShell script
.\start.ps1
```

**Manual Start:**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### Step 6: Access the Application

Open browser: http://localhost:5173

---

## 👥 Default Login Credentials

### Admin Account
- **Email:** admin@university.edu
- **Password:** password123
- **Access:** Full system control

### Department Officers
- **Library:** library@university.edu / password123
- **Finance:** finance@university.edu / password123
- **IT:** it@university.edu / password123

### Sample Students
- **John Doe:** john@university.edu / password123 (ID: STU001)
- **Jane Smith:** jane@university.edu / password123 (ID: STU002)

**Demo Buttons:** Quick login buttons are available on the login page!

---

## 📋 Core Workflows

### Student Clearance Workflow

```
1. Student logs in
   ↓
2. Submits clearance request to all departments
   ↓
3. Tracks progress in dashboard
   ↓
4. If rejected by any department:
   - Fix the issue (return books, pay fees, etc.)
   - Click "Resubmit" button
   - Get reviewed again ✅
   ↓
5. Once all departments approve → Download certificate!
```

### Officer Review Workflow

```
1. Officer logs in
   ↓
2. Views pending requests for their department
   ↓
3. Reviews each request
   ↓
4. Approves (if clear) or Rejects (with remarks)
   ↓
5. Student sees status update immediately
```

### Admin Management Workflow

```
1. Admin logs in
   ↓
2. Manages users (add students, create officers)
   ↓
3. Manages departments (add/remove)
   ↓
4. Views system-wide reports
   ↓
5. Deletes problematic data if needed
```

---

## 🗂️ Project Structure

```
UniClear/
├── backend/
│   ├── middleware/
│   │   └── auth.js          # JWT authentication
│   ├── routes/
│   │   ├── admin.js         # Admin endpoints
│   │   ├── auth.js          # Login/register endpoints
│   │   ├── clearance.js     # Clearance request endpoints
│   │   └── departments.js   # Department management
│   ├── .env                 # Environment variables
│   ├── db.js                # Database interface
│   ├── oracleDb.js          # Oracle database methods
│   ├── memoryDb.js          # In-memory database
│   ├── getDb.js             # Database selector
│   └── server.js            # Express server
│
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx        # Main layout wrapper
│   │   │   ├── Navbar.jsx        # Navigation bar
│   │   │   └── ProtectedRoute.jsx # Route protection
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Authentication context
│   │   ├── pages/
│   │   │   ├── Login.jsx         # Login page
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── AdminUsers.jsx
│   │   │   │   ├── AdminDepartments.jsx
│   │   │   │   └── AdminReports.jsx
│   │   │   ├── officer/
│   │   │   │   ├── OfficerDashboard.jsx
│   │   │   │   └── OfficerRequests.jsx
│   │   │   └── student/
│   │   │       ├── StudentDashboard.jsx
│   │   │       ├── StudentClearance.jsx
│   │   │       └── StudentCertificate.jsx
│   │   ├── services/
│   │   │   └── api.js       # API client
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   └── package.json
│
├── database/
│   ├── schema.sql           # Database schema + sample data
│   └── cleanup-extra-departments.sql  # Department cleanup
│
├── start.bat                # Windows startup script
├── start.ps1                # PowerShell startup script
└── README.md                # This file
```

---

## 🔐 Security Features

### Authentication
- **JWT Tokens** - Secure session management
- **Password Hashing** - bcrypt with salt rounds
- **Role-Based Access** - Middleware enforces permissions
- **Protected Routes** - Frontend route guards

### Authorization
- **Admin** - Full access to everything
- **Officer** - Only their department's requests
- **Student** - Only their own requests

### Database Security
- **Parameterized Queries** - Prevents SQL injection
- **Foreign Key Constraints** - Data integrity
- **Cascade Deletes** - Automatic cleanup of related data

---

## 🎨 User Interface Highlights

### Design Principles
- **Clean & Professional** - Modern Material Design-inspired
- **Responsive** - Works on desktop, tablet, and mobile
- **Intuitive Navigation** - Clear sidebar menu
- **Visual Feedback** - Color-coded statuses (green=approved, red=rejected)
- **Accessibility** - High contrast, readable fonts

### Color Coding
- 🟢 **Green** - Approved, Success
- 🔴 **Red** - Rejected, Error
- 🟡 **Yellow/Orange** - Pending, Warning
- 🔵 **Blue** - Info, Primary actions

---

## 📊 Database Schema

### Tables

**departments**
```sql
department_id (PK)
department_name
created_at
```

**users**
```sql
user_id (PK)
name
email
password_hash
role (admin/officer/student)
student_id (nullable)
department_id (nullable, FK)
status (active/inactive)
created_at
```

**clearance_requests**
```sql
request_id (PK)
user_id (FK)
department_id (FK)
status (pending/approved/rejected)
reviewer_id (FK, nullable)
remarks (nullable)
request_date
review_date (nullable)
```

---

## 🔧 Configuration Options

### Switch Between Databases

**Use Oracle (Production):**
```env
USE_ORACLE=true
```

**Use In-Memory (Development/Testing):**
```env
USE_ORACLE=false
```

### Change Port

Edit `backend/.env`:
```env
PORT=5000  # Change to any available port
```

### Custom JWT Secret

Edit `backend/.env`:
```env
JWT_SECRET=your_super_secret_key_here
```

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill the process or change port in .env
```

### Database Connection Error
```bash
# Verify Oracle service is running
# Check credentials in .env match your Oracle setup
# Test connection in SQL Developer first
```

### Frontend Shows Blank Page
```bash
# Hard refresh: Ctrl + Shift + R
# Clear browser cache
# Check browser console for errors (F12)
# Verify backend is running on port 5000
```

### Can't Login
```bash
# Make sure backend is running
# Check credentials are correct
# Verify database has users (run schema.sql if empty)
```

---

## 📝 API Endpoints

### Authentication
```
POST   /api/auth/login           - User login
POST   /api/auth/register        - Student registration
```

### Clearance Requests
```
GET    /api/clearance/my-requests        - Student's requests
POST   /api/clearance/submit             - Submit/resubmit clearance
GET    /api/clearance/department-requests - Officer's queue
PUT    /api/clearance/:id/approve        - Approve request
PUT    /api/clearance/:id/reject         - Reject request
GET    /api/clearance/all                - All requests (admin)
GET    /api/clearance/certificate-status - Check eligibility
```

### Admin
```
GET    /api/admin/users              - Get all users
POST   /api/admin/users              - Create user
PUT    /api/admin/users/:id/status   - Activate/deactivate
DELETE /api/admin/users/:id          - Delete user (cascade)
GET    /api/admin/departments        - Get departments
POST   /api/admin/departments        - Add department
PUT    /api/admin/departments/:id    - Update department
DELETE /api/admin/departments/:id    - Delete department
GET    /api/admin/reports            - System statistics
DELETE /api/admin/requests/:id       - Delete single request
```

---

## 🚀 Future Enhancements

### Planned Features
- [ ] Email notifications for status changes
- [ ] File upload for supporting documents
- [ ] Bulk operations (approve/reject multiple at once)
- [ ] Export reports to PDF/Excel
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Analytics dashboard with charts
- [ ] Automated certificate generation
- [ ] Integration with university SIS

### Potential Improvements
- [ ] Real-time updates (WebSocket)
- [ ] Advanced search and filtering
- [ ] User activity logs
- [ ] Two-factor authentication
- [ ] Role customization
- [ ] Department-specific forms

---

## 👨‍💻 Development Team

This project was developed as part of the SMD (Software Development) coursework.

**Key Contributions:**
- Full-stack development with React + Node.js
- Oracle database design and optimization
- RESTful API architecture
- Responsive UI/UX design
- Security implementation (JWT, RBAC)

---

## 📄 License

This project is created for educational purposes.

---

## 🤝 Contributing

This is an academic project. However, feel free to:
1. Fork the repository
2. Implement new features
3. Fix bugs
4. Improve documentation
5. Submit pull requests

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the documentation files in the root directory
3. Check browser console for errors
4. Verify backend logs in terminal

---

## 🎯 Quick Reference Commands

### Start Everything
```bash
start.bat  # Windows
```

### Check Backend Health
```bash
curl http://localhost:5000/api/health
```

### Database Setup
```bash
# In SQL Developer:
database/schema.sql
```

### Kill Stuck Processes
```powershell
Get-Process node | Stop-Process -Force
```

---

## ✨ Key Achievements

✅ **Full CRUD Operations** - Complete Create, Read, Update, Delete functionality  
✅ **Role-Based Access Control** - Three distinct user roles with proper permissions  
✅ **Cascade Delete** - Automatic cleanup of related data  
✅ **Resubmission Feature** - Second chances for rejected requests  
✅ **Dynamic Departments** - Admin can add/remove departments on-the-fly  
✅ **Real-Time Updates** - Instant status changes visible to students  
✅ **Responsive Design** - Works on all devices  
✅ **Secure Authentication** - JWT + bcrypt password hashing  
✅ **Dual Database Support** - Oracle + In-memory fallback  
✅ **Professional UI/UX** - Clean, modern interface  

---

## 🎓 Learning Outcomes

This project demonstrates mastery of:
- Modern web development (React, Node.js, Express)
- Database design and optimization
- RESTful API development
- Authentication & authorization
- State management (Context API)
- Responsive web design
- Problem-solving and critical thinking
- Full-stack integration

---

**UniClear - Making university clearance simple, fast, and transparent! 🎉**
