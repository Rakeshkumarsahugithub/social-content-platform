import React, { createContext, useContext, useCallback, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const { type, title, message } = notification;
    
    const toastOptions = {
      duration: type === 'error' ? 6000 : 4000,
      position: 'top-right',
      style: {
        background: 'var(--surface-color)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '16px',
        maxWidth: '400px',
      },
    };

    const content = (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '20px' }}>
          {type === 'success' && '✅'}
          {type === 'error' && '❌'}
          {type === 'info' && 'ℹ️'}
          {type === 'follow' && '👥'}
        </div>
        <div>
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>{title}</div>
          {message && <div style={{ fontSize: '14px', opacity: '0.8' }}>{message}</div>}
        </div>
      </div>
    );

    switch (type) {
      case 'success':
        return toast.success(content, toastOptions);
      case 'error':
        return toast.error(content, toastOptions);
      case 'info':
      case 'follow':
        return toast(content, toastOptions);
      default:
        return toast(content, toastOptions);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    toast.dismiss(id);
  }, []);

  const clearAllNotifications = useCallback(() => {
    toast.dismiss();
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    toast.dismiss();
  }, []);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    markAsRead,
    clearAll
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Toaster 
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerStyle={{
          top: 20,
          right: 20,
        }}
        toastOptions={{
          className: '',
          style: {
            background: 'var(--surface-color)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          },
        }}
      />
    </NotificationContext.Provider>
  );
};

export default NotificationContext;