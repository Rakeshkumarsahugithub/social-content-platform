import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

const useSocket = () => {
  const { user, token } = useAuth();
  const { addNotification } = useNotifications();
  const socketRef = useRef(null);

  useEffect(() => {
    if (user && token) {
      // Initialize socket connection
      socketRef.current = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        auth: {
          token: token
        },
        autoConnect: true
      });

      const socket = socketRef.current;

      // Connection events
      socket.on('connect', () => {
        console.log('Connected to server');
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      // Notification events
      socket.on('notification', (notification) => {
        addNotification({
          type: notification.type,
          title: notification.title,
          message: notification.message,
          link: notification.link,
          data: notification.data
        });
      });

      // Admin notifications
      if (['admin', 'manager'].includes(user.role)) {
        socket.on('admin_notification', (notification) => {
          addNotification({
            type: 'admin',
            title: notification.title,
            message: notification.message,
            link: notification.link,
            data: notification.data
          });
        });
      }

      // Real-time post updates
      socket.on('post_update', (update) => {
        // Dispatch custom event for components to listen to
        window.dispatchEvent(new CustomEvent('postUpdate', { detail: update }));
      });

      // Real-time engagement updates
      socket.on('engagement_update', (update) => {
        window.dispatchEvent(new CustomEvent('engagementUpdate', { detail: update }));
      });

      // User status changes
      socket.on('user_status_changed', (statusUpdate) => {
        window.dispatchEvent(new CustomEvent('userStatusChanged', { detail: statusUpdate }));
      });

      // Typing indicators
      socket.on('user_typing', (typingData) => {
        window.dispatchEvent(new CustomEvent('userTyping', { detail: typingData }));
      });

      socket.on('user_stopped_typing', (typingData) => {
        window.dispatchEvent(new CustomEvent('userStoppedTyping', { detail: typingData }));
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user, token, addNotification]);

  // Socket utility functions
  const emitUserStatus = (status) => {
    if (socketRef.current) {
      socketRef.current.emit('user_status_update', status);
    }
  };

  const joinPost = (postId) => {
    if (socketRef.current) {
      socketRef.current.emit('join_post', postId);
    }
  };

  const leavePost = (postId) => {
    if (socketRef.current) {
      socketRef.current.emit('leave_post', postId);
    }
  };

  const startTyping = (postId) => {
    if (socketRef.current) {
      socketRef.current.emit('typing_start', { postId });
    }
  };

  const stopTyping = (postId) => {
    if (socketRef.current) {
      socketRef.current.emit('typing_stop', { postId });
    }
  };

  return {
    socket: socketRef.current,
    emitUserStatus,
    joinPost,
    leavePost,
    startTyping,
    stopTyping
  };
};

export default useSocket;
