import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';
import ThemeToggle from '../common/ThemeToggle';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { notifications, markAsRead, clearAll } = useNotifications();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const notificationRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mobileMenuBtnRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && 
          mobileMenuBtnRef.current && !mobileMenuBtnRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowMobileMenu(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowProfileMenu(false);
    setShowMobileMenu(false);
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
    setShowNotifications(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/feed" className="navbar-logo">
          <span className="logo-text">
            <span className="logo-e">e</span>
            <span className="logo-m">M</span>
            <span className="logo-ilo">ILO</span>
          </span>
        </Link>

        {/* Search Bar */}
        <form className="navbar-search" onSubmit={handleSearch}>
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Search users, posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">
              <span className="search-icon">🔍</span>
            </button>
          </div>
        </form>

        {/* Desktop Navigation */}
        <div className="navbar-nav desktop-nav">
          <Link 
            to="/feed" 
            className={`nav-link ${isActive('/feed') ? 'active' : ''}`}
          >
            <span className="nav-icon">🏠</span>
            <span>Home</span>
          </Link>
          
          <Link 
            to="/explore" 
            className={`nav-link ${isActive('/explore') ? 'active' : ''}`}
          >
            <span className="nav-icon">🔍</span>
            <span>Explore</span>
          </Link>

          <Link 
            to="/create" 
            className={`nav-link ${isActive('/create') ? 'active' : ''}`}
          >
            <span className="nav-icon">➕</span>
            <span>Create</span>
          </Link>

          {(user?.role === 'admin' || user?.role === 'manager') && (
            <Link 
              to="/admin" 
              className={`nav-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
            >
              <span className="nav-icon">⚙️</span>
              <span>Admin</span>
            </Link>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="navbar-actions">
          {/* Notifications */}
          <div className="notification-container" ref={notificationRef}>
            <button 
              className="notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <span className="notification-icon">🔔</span>
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h3>Notifications</h3>
                  {notifications.length > 0 && (
                    <button onClick={clearAll} className="clear-all-btn">
                      Clear All
                    </button>
                  )}
                </div>
                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <div className="no-notifications">
                      <span className="empty-icon">🔕</span>
                      <p>No notifications</p>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map(notification => (
                      <div 
                        key={notification.id}
                        className={`notification-item ${!notification.read ? 'unread' : ''}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="notification-content">
                          <h4>{notification.title}</h4>
                          <p>{notification.message}</p>
                          <span className="notification-time">
                            {new Date(notification.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        {!notification.read && <div className="unread-indicator"></div>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="profile-container" ref={profileMenuRef}>
            <button 
              className="profile-btn"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="navbar-user-icon-container" id="navbar-profile-icon">
                {user?.profilePicture ? (
                  <img 
                    src={getImageUrl(user.profilePicture)} 
                    alt={user.fullName || 'Profile'}
                    className="navbar-profile-img"
                    onError={handleImageError}
                  />
                ) : (
                  <span className="navbar-user-emoji">👤</span>
                )}
              </div>
              <span className="profile-name">
                {user?.fullName && user.fullName.length > 7 
                  ? user.fullName.substring(0, 7) + '...' 
                  : user?.fullName}
              </span>
              <span className="dropdown-arrow">▼</span>
            </button>

            {showProfileMenu && (
              <div className="profile-dropdown">
                <div className="profile-info">
                  <div className="dropdown-user-icon-container" id="dropdown-profile-icon">
                    {user?.profilePicture ? (
                      <img 
                        src={getImageUrl(user.profilePicture)} 
                        alt={user.fullName || 'Profile'}
                        className="dropdown-profile-img"
                        onError={handleImageError}
                      />
                    ) : (
                      <span className="dropdown-user-emoji">👤</span>
                    )}
                  </div>
                  <div>
                    <h4>{user?.fullName}</h4>
                    <p>@{user?.username}</p>
                    <span className="role-badge">{user?.role}</span>
                  </div>
                </div>
                <div className="profile-menu-divider"></div>
                <Link to={`/profile/${user?.username}`} className="profile-menu-item">
                  <span className="menu-icon">👤</span>
                  <span>My Profile</span>
                </Link>
                <Link to="/settings" className="profile-menu-item">
                  <span className="menu-icon">⚙️</span>
                  <span>Settings</span>
                </Link>
                <div className="profile-menu-divider"></div>
                <div className="profile-menu-item theme-toggle-item">
                  <span className="menu-icon">{isDark ? '🌙' : '☀️'}</span>
                  <span>Theme</span>
                  <ThemeToggle className="profile-theme-toggle" />
                </div>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <Link to="/admin" className="profile-menu-item">
                    <span className="menu-icon">🛡️</span>
                    <span>Admin Panel</span>
                  </Link>
                )}
                <div className="profile-menu-divider"></div>
                <button onClick={handleLogout} className="profile-menu-item logout-btn">
                  <span className="menu-icon">🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            ref={mobileMenuBtnRef}
            className={`mobile-menu-btn ${showMobileMenu ? 'active' : ''}`}
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle mobile menu"
          >
            <span className="hamburger"></span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {showMobileMenu && (
        <div className="mobile-nav" ref={mobileMenuRef}>
          <form className="mobile-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mobile-search-input"
            />
            <button type="submit" className="mobile-search-btn">🔍</button>
          </form>
          
          <div className="mobile-nav-links">
            <Link 
              to="/feed" 
              className={`mobile-nav-link ${isActive('/feed') ? 'active' : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              <span className="nav-icon">🏠</span>
              <span>Home</span>
            </Link>
            
            <Link 
              to="/explore" 
              className={`mobile-nav-link ${isActive('/explore') ? 'active' : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              <span className="nav-icon">🔍</span>
              <span>Explore</span>
            </Link>

            <Link 
              to="/create" 
              className={`mobile-nav-link ${isActive('/create') ? 'active' : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              <span className="nav-icon">➕</span>
              <span>Create</span>
            </Link>

            <Link 
              to={`/profile/${user?.username}`} 
              className={`mobile-nav-link ${location.pathname.includes('/profile/') ? 'active' : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              <span className="nav-icon">👤</span>
              <span>Profile</span>
            </Link>

            {(user?.role === 'admin' || user?.role === 'manager') && (
              <Link 
                to="/admin" 
                className={`mobile-nav-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
                onClick={() => setShowMobileMenu(false)}
              >
                <span className="nav-icon">⚙️</span>
                <span>Admin</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
