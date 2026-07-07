import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiBell, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { getNotifications, markNotificationsRead } from '../services/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const loadNotifications = async () => {
      try {
        const res = await getNotifications();
        if (mounted) setNotifications(res.data.notifications || []);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const unreadCount = notifications.filter(n => n.is_read === 'N').length;

  const handleToggleNotifications = async () => {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);
    if (nextOpen && unreadCount > 0) {
      try {
        await markNotificationsRead();
        setNotifications(notifications.map(n => ({ ...n, is_read: 'Y' })));
      } catch (err) {
        console.error('Failed to mark notifications read:', err);
      }
    }
  };

  const getNavLinks = () => {
    if (!user) return [];
    switch (user.role) {
      case 'student':
        return [
          { path: '/student/dashboard', label: 'Dashboard' },
          { path: '/student/clearance', label: 'My Clearance' },
          { path: '/student/certificate', label: 'Certificate' }
        ];
      case 'officer':
        return [
          { path: '/officer/dashboard', label: 'Dashboard' },
          { path: '/officer/requests', label: 'Requests' }
        ];
      case 'admin':
        return [
          { path: '/admin/dashboard', label: 'Dashboard' },
          { path: '/admin/users', label: 'Users' },
          { path: '/admin/departments', label: 'Departments' },
          { path: '/admin/reports', label: 'Reports' }
        ];
      default:
        return [];
    }
  };

  const links = getNavLinks();

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <span className="brand-icon">&#127891;</span>
          <span>UniClear</span>
        </Link>

        <button className="nav-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>

        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {user && (
            <div className="nav-user">
              <div className="notifications">
                <button className="notification-btn" onClick={handleToggleNotifications} title="Notifications">
                  <FiBell size={18} />
                  {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
                </button>
                {notificationsOpen && (
                  <div className="notification-menu">
                    <h3>Notifications</h3>
                    {notifications.length === 0 ? (
                      <p className="notification-empty">No notifications yet.</p>
                    ) : (
                      notifications.slice(0, 6).map((notification) => (
                        <div key={notification.notification_id} className="notification-item">
                          <strong>{notification.title}</strong>
                          <p>{notification.message}</p>
                          <span>{new Date(notification.created_at).toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <span className="nav-user-info">
                <span className="user-name">{user.name}</span>
                <span className={`role-badge role-${user.role}`}>{user.role}</span>
              </span>
              <button className="btn-logout" onClick={handleLogout} title="Logout">
                <FiLogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
