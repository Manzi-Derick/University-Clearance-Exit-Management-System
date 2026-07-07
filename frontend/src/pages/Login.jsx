import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi, register as registerApi } from '../services/api';
import { FiMail, FiLock, FiUser, FiHash } from 'react-icons/fi';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const getRedirectPath = (role) => {
    switch (role) {
      case 'student': return '/student/dashboard';
      case 'officer': return '/officer/dashboard';
      case 'admin': return '/admin/dashboard';
      default: return '/login';
    }
  };

  const handleDemoLogin = (demoEmail, demoPassword) => {
    setError('');
    setEmail(demoEmail);
    setPassword(demoPassword);
    setIsRegister(false);
    // Auto-submit after a short delay for better UX
    setTimeout(async () => {
      try {
        setLoading(true);
        const res = await loginApi(demoEmail, demoPassword);
        loginUser(res.data.user, res.data.token);
        navigate(getRedirectPath(res.data.user.role));
      } catch (err) {
        setError(err.response?.data?.error || 'Something went wrong. Please try again.');
        setLoading(false);
      }
    }, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (isRegister) {
        res = await registerApi({ name, email, password, studentId });
      } else {
        res = await loginApi(email, password);
      }
      loginUser(res.data.user, res.data.token);
      navigate(getRedirectPath(res.data.user.role));
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-icon">&#127891;</div>
          <h1>UniClear</h1>
          <p>University Clearance & Exit Management System</p>
        </div>

        <div className="login-card">
          <h2>{isRegister ? 'Student Registration' : 'Sign In'}</h2>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <div className="form-group">
                  <label><FiUser /> Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label><FiHash /> Student ID</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. STU001"
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label><FiMail /> Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label><FiLock /> Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Please wait...' : isRegister ? 'Register' : 'Sign In'}
            </button>
          </form>

          <div className="login-footer">
            {isRegister ? (
              <p>Already have an account? <button className="link-btn" onClick={() => { setIsRegister(false); setError(''); }}>Sign In</button></p>
            ) : (
              <p>New student? <button className="link-btn" onClick={() => { setIsRegister(true); setError(''); }}>Register here</button></p>
            )}
          </div>

          <div className="demo-credentials">
            <h3>Demo Accounts</h3>
            <div className="demo-buttons">
              <button className="demo-role-btn admin" onClick={() => handleDemoLogin('admin@university.edu', 'password123')}>
                Admin
              </button>
              <div className="officer-group">
                <span className="group-label">Officers:</span>
                <button className="demo-role-btn officer" onClick={() => handleDemoLogin('library@university.edu', 'password123')}>
                  Library
                </button>
                <button className="demo-role-btn officer" onClick={() => handleDemoLogin('finance@university.edu', 'password123')}>
                  Finance
                </button>
                <button className="demo-role-btn officer" onClick={() => handleDemoLogin('it@university.edu', 'password123')}>
                  IT
                </button>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
