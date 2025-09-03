const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class SocketManager {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // socketId -> userId
  }

  initialize(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));

    console.log('Socket.io server initialized');
    return this.io;
  }

  async authenticateSocket(socket, next) {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  }

  handleConnection(socket) {
    const userId = socket.userId;
    
    // Store user connection
    this.connectedUsers.set(userId, socket.id);
    this.userSockets.set(socket.id, userId);

    // User connected

    // Join user to their personal room
    socket.join(`user_${userId}`);

    // Join admin users to admin room
    if (['admin', 'manager'].includes(socket.user.role)) {
      socket.join('admin_room');
    }

    // Handle disconnection
    socket.on('disconnect', () => {
      this.connectedUsers.delete(userId);
      this.userSockets.delete(socket.id);
      // User disconnected
    });

    // Handle real-time events
    this.setupEventHandlers(socket);
  }

  setupEventHandlers(socket) {
    // User status updates
    socket.on('user_status_update', (status) => {
      socket.broadcast.emit('user_status_changed', {
        userId: socket.userId,
        status,
        timestamp: new Date()
      });
    });

    // Typing indicators for comments
    socket.on('typing_start', (data) => {
      socket.to(`post_${data.postId}`).emit('user_typing', {
        userId: socket.userId,
        username: socket.user.username,
        postId: data.postId
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(`post_${data.postId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        postId: data.postId
      });
    });

    // Join/leave post rooms for real-time updates
    socket.on('join_post', (postId) => {
      socket.join(`post_${postId}`);
    });

    socket.on('leave_post', (postId) => {
      socket.leave(`post_${postId}`);
    });
    
    // Handle join_room event from client
    socket.on('join_room', (room) => {
      socket.join(room);
      // User joined room
    });
  }

  // Notification methods
  sendNotificationToUser(userId, notification) {
    const socketId = this.connectedUsers.get(userId.toString());
    if (socketId) {
      this.io.to(socketId).emit('notification', notification);
    }
  }

  sendNotificationToAdmins(notification) {
    this.io.to('admin_room').emit('admin_notification', notification);
  }

  // Real-time post updates
  broadcastPostUpdate(postId, updateType, data) {
    this.io.to(`post_${postId}`).emit('post_update', {
      postId,
      type: updateType,
      data,
      timestamp: new Date()
    });
  }

  // Real-time engagement updates
  broadcastEngagement(postId, engagementType, data) {
    this.io.to(`post_${postId}`).emit('engagement_update', {
      postId,
      type: engagementType,
      data,
      timestamp: new Date()
    });
  }

  // Follow/unfollow notifications
  notifyFollow(followedUserId, followerData) {
    this.sendNotificationToUser(followedUserId, {
      type: 'follow',
      title: 'New Follower',
      message: `${followerData.fullName} started following you`,
      data: followerData,
      timestamp: new Date()
    });
  }

  notifyUnfollow(unfollowedUserId, unfollowerData) {
    this.sendNotificationToUser(unfollowedUserId, {
      type: 'unfollow',
      title: 'Follower Update',
      message: `${unfollowerData.fullName} unfollowed you`,
      data: unfollowerData,
      timestamp: new Date()
    });
  }

  // Post engagement notifications
  notifyLike(postAuthorId, likerData, postData) {
    this.sendNotificationToUser(postAuthorId, {
      type: 'like',
      title: 'Post Liked',
      message: `${likerData.fullName} liked your post`,
      data: { liker: likerData, post: postData },
      link: `/post/${postData._id}`,
      timestamp: new Date()
    });
  }

  notifyComment(postAuthorId, commenterData, commentData, postData) {
    this.sendNotificationToUser(postAuthorId, {
      type: 'comment',
      title: 'New Comment',
      message: `${commenterData.fullName} commented on your post`,
      data: { commenter: commenterData, comment: commentData, post: postData },
      link: `/post/${postData._id}`,
      timestamp: new Date()
    });
  }

  // Admin notifications
  notifyPostApproval(postAuthorId, postData, approverData) {
    this.sendNotificationToUser(postAuthorId, {
      type: 'post_approved',
      title: 'Post Approved',
      message: `Your post has been approved and is now live`,
      data: { post: postData, approver: approverData },
      link: `/post/${postData._id}`,
      timestamp: new Date()
    });
  }

  notifyPostRejection(postAuthorId, postData, rejectorData, reason) {
    this.sendNotificationToUser(postAuthorId, {
      type: 'post_rejected',
      title: 'Post Rejected',
      message: `Your post was rejected: ${reason}`,
      data: { post: postData, rejector: rejectorData, reason },
      timestamp: new Date()
    });
  }

  notifyPaymentProcessed(postAuthorId, paymentData) {
    this.sendNotificationToUser(postAuthorId, {
      type: 'payment_processed',
      title: 'Payment Processed',
      message: `Payment of ₹${paymentData.amount.toFixed(2)} has been processed for your post`,
      data: paymentData,
      timestamp: new Date()
    });
  }

  // Admin alerts
  notifyNewPostForApproval(postData) {
    this.sendNotificationToAdmins({
      type: 'new_post_approval',
      title: 'New Post Pending Approval',
      message: `New post by ${postData.author.fullName} requires approval`,
      data: postData,
      link: `/admin/posts`,
      timestamp: new Date()
    });
  }

  // Get online users count
  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }

  // Get online users list (for admin)
  getOnlineUsers() {
    const onlineUsers = [];
    for (const [userId, socketId] of this.connectedUsers) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket && socket.user) {
        onlineUsers.push({
          userId,
          username: socket.user.username,
          fullName: socket.user.fullName,
          role: socket.user.role,
          connectedAt: socket.handshake.time
        });
      }
    }
    return onlineUsers;
  }
}

// Create singleton instance
const socketManager = new SocketManager();

module.exports = socketManager;
