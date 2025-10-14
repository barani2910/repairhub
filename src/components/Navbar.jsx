import { Link, useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useState } from 'react';

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

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={`/${user.role}`} className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">W</span>
              </div>
              <span className="text-xl font-bold text-gray-800">WorkerBook</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Link
              to={`/${user.role}`}
              className="text-gray-700 hover:text-blue-600 transition"
            >
              Dashboard
            </Link>

            <Link
              to="/notifications"
              className="relative text-gray-700 hover:text-blue-600 transition"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>

            <Link
              to="/profile"
              className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition"
            >
              <User className="w-6 h-6" />
              <span>{user.name}</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition"
            >
              <LogOut className="w-6 h-6" />
              <span>Logout</span>
            </button>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-blue-600"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to={`/${user.role}`}
              className="block px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/notifications"
              className="block px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-md flex items-center justify-between"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link
              to="/profile"
              className="block px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Profile
            </Link>
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
