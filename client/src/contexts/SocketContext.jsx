import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, accessToken } = useAuth();

  useEffect(() => {
    let newSocket;

    if (user && accessToken) {
      // Initialize socket connection with proper authentication
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
      newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        auth: {
          token: accessToken
        }
      });

      newSocket.on('connect', () => {
        // Socket connected successfully
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
      });

      // Listen for follow notifications
      newSocket.on('follow_notification', (notification) => {
        console.log('Follow notification received:', notification);
        toast.success(`${notification.from.fullName} started following you`, {
          icon: '👥',
        });
      });

      // Listen for like notifications
      newSocket.on('like_notification', (notification) => {
        console.log('Like notification received:', notification);
        toast.success(notification.message, {
          icon: '❤️',
        });
      });

      // Listen for general notifications
      newSocket.on('notification', (notification) => {
        console.log('Notification received:', notification);
        toast.success(notification.message, {
          icon: notification.type === 'follow' ? '👥' : 
                notification.type === 'like' ? '❤️' : 
                notification.type === 'comment' ? '💬' : '🔔'
        });
      });

      setSocket(newSocket);
    } else {
      // Clean up socket when user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
    }

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [user, accessToken]);

  const value = {
    socket,
    connected
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;