import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import './NotificationToast.css';

const NotificationToast = () => {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <div 
          key={notification.id}
          className={`notification-toast ${notification.type}`}
        >
          <div className="notification-content">
            <div className="notification-icon">
              {notification.type === 'success' && '✅'}
              {notification.type === 'error' && '❌'}
              {notification.type === 'info' && 'ℹ️'}
              {notification.type === 'follow' && '👥'}
            </div>
            <div className="notification-message">
              <div className="notification-title">{notification.title}</div>
              {notification.message && (
                <div className="notification-text">{notification.message}</div>
              )}
            </div>
          </div>
          <button 
            className="notification-close"
            onClick={() => removeNotification(notification.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;