import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, Briefcase, CalendarDays, ClipboardList, LayoutDashboard, LogOut, Menu, Search, ShieldCheck, Users, Wrench, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useState } from 'react';

const roleLinks = {
  user: [
    { label: 'Overview', to: '/user', icon: LayoutDashboard },
    { label: 'Find a pro', to: '/user/search', icon: Search },
    { label: 'My bookings', to: '/user/history', icon: CalendarDays }
  ],
  worker: [
    { label: 'Overview', to: '/worker', icon: LayoutDashboard },
    { label: 'Requests', to: '/worker/requests', icon: ClipboardList },
    { label: 'Work history', to: '/worker/history', icon: CalendarDays },
    { label: 'Earnings', to: '/worker/earnings', icon: Briefcase },
    { label: 'Time off', to: '/worker/leave', icon: CalendarDays }
  ],
  admin: [
    { label: 'Overview', to: '/admin', icon: LayoutDashboard },
    { label: 'Verification', to: '/admin/verify-workers', icon: ShieldCheck },
    { label: 'People', to: '/admin/manage-users', icon: Users },
    { label: 'Bookings', to: '/admin/bookings', icon: CalendarDays }
  ]
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const links = roleLinks[user.role] || [];
  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="site-nav sticky top-0 z-50">
      <div className="site-nav-inner">
        <Link to={`/${user.role}`} className="site-brand" aria-label="RepairHub home">
          <span className="site-brand-mark"><Wrench size={20} strokeWidth={2.4} /></span>
          <span className="site-brand-name">Repair<span>Hub</span></span>
        </Link>

        <div className="site-nav-links">
          {links.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === `/${user.role}`}
              className={({ isActive }) => `site-nav-link${isActive ? ' is-active' : ''}`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

        <div className="site-nav-actions">
          <Link to="/notifications" className="nav-icon-button" aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}>
            <Bell size={19} />
            {unreadCount > 0 && <span className="notification-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </Link>
          <Link to="/profile" className="nav-account">
            <span className="nav-avatar">{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
            <span className="nav-account-name">{user.name}</span>
          </Link>
          <button type="button" onClick={handleLogout} className="nav-logout" aria-label="Log out" title="Log out">
            <LogOut size={18} />
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="nav-menu-toggle"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-nav-panel">
          <div className="mobile-nav-links">
            {links.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === `/${user.role}`}
                onClick={closeMenu}
                className={({ isActive }) => `mobile-nav-link${isActive ? ' is-active' : ''}`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
            <Link to="/notifications" onClick={closeMenu} className="mobile-nav-link">
              <Bell size={18} />
              <span>Notifications</span>
              {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
            </Link>
            <Link to="/profile" onClick={closeMenu} className="mobile-nav-link">
              <Users size={18} />
              <span>My profile</span>
            </Link>
            <button type="button" onClick={handleLogout} className="mobile-nav-link mobile-nav-logout">
              <LogOut size={18} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
