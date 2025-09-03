import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { LoadingSpinner } from '../common';
import './PostManagement.css';

const PostManagement = () => {
  const { api, user } = useAuth();
  const { addNotification } = useNotifications();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    city: 'all',
    page: 1,
    limit: 20
  });
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingPost, setRejectingPost] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const cities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
    'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
    'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri',
    'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
    'Faridabad', 'Meerut', 'Rajkot', 'Kalyan', 'Vasai', 'Varanasi'
  ];

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filters).toString();
      const response = await api.get(`/admin/posts?${queryParams}`);
      
      if (response.data.success) {
        setPosts(response.data.data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch posts'
      });
    } finally {
      setLoading(false);
    }
  }, [filters, addNotification]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await api.get('/admin/posts/analytics');
      setAnalytics(response.data.data.analytics);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  }, []);

  // Real-time updates for views and likes
  const setupRealTimeUpdates = useCallback((postId) => {
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/posts/${postId}`);
        if (response.data.success) {
          const updatedPost = response.data.data;
          
          // Update views count in DOM
          const viewsElement = document.getElementById(`views-${postId}`);
          if (viewsElement) {
            viewsElement.textContent = updatedPost.views || 0;
          }
          
          // Update likes count in DOM
          const likesElement = document.getElementById(`likes-${postId}`);
          if (likesElement) {
            likesElement.textContent = updatedPost.likesCount || 0;
          }
          
          // Update posts state
          setPosts(prevPosts => 
            prevPosts.map(post => 
              post._id === postId 
                ? { ...post, views: updatedPost.views, likesCount: updatedPost.likesCount }
                : post
            )
          );
        }
      } catch (error) {
        console.error('Error updating post metrics:', error);
      }
    }, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchAnalytics();
    
    // Cleanup intervals on unmount
    return () => {
      posts.forEach(post => {
        const intervals = document.querySelectorAll(`[data-post-id="${post._id}"]`);
        intervals.forEach(el => {
          const intervalId = el.dataset.intervalId;
          if (intervalId) clearInterval(parseInt(intervalId));
        });
      });
    };
  }, [fetchPosts, fetchAnalytics]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handleApprove = async (postId) => {
    try {
      const response = await api.patch(`/admin/posts/${postId}/approve`);
      
      setPosts(prev => prev.map(post => 
        post._id === postId 
          ? { ...post, approved: true, approvedBy: user, approvedAt: new Date() }
          : post
      ));

      fetchAnalytics();
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Post approved successfully'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error?.message || 'Failed to approve post'
      });
    }
  };

  const handleRejectClick = (post) => {
    setRejectingPost(post);
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    try {
      await api.patch(`/admin/posts/${rejectingPost._id}/reject`, {
        reason: rejectionReason
      });

      // Update post status instead of removing from list
      setPosts(prev => prev.map(post => 
        post._id === rejectingPost._id 
          ? { ...post, isActive: false, rejected: true, rejectionReason: rejectionReason }
          : post
      ));
      
      setShowRejectModal(false);
      setRejectingPost(null);
      setRejectionReason('');
      fetchAnalytics();

      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Post rejected successfully'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error?.message || 'Failed to reject post'
      });
    }
  };

  const getStatusBadge = (post) => {
    if (post.rejected || !post.isActive) {
      return <span className="status-badge rejected">Rejected</span>;
    } else if (post.paid) {
      return <span className="status-badge paid">Paid</span>;
    } else if (post.approved) {
      return <span className="status-badge approved">Approved</span>;
    } else {
      return <span className="status-badge pending">Pending</span>;
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && posts.length === 0) {
    return (
      <div className="post-management">
        <div className="loading-container">
          <LoadingSpinner />
          <span>Loading posts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="post-management">
      <div className="post-header">
        <h2>Post Management & Approval</h2>
      </div>

      {analytics && (
        <div className="analytics-overview">
          <div className="stat-card">
            <h3>Total Posts</h3>
            <span className="stat-value">{analytics.overview.totalPosts}</span>
          </div>
          <div className="stat-card pending">
            <h3>Pending Approval</h3>
            <span className="stat-value">{analytics.overview.pendingPosts}</span>
          </div>
          <div className="stat-card approved">
            <h3>Approved</h3>
            <span className="stat-value">{analytics.overview.approvedPosts}</span>
          </div>
          <div className="stat-card paid">
            <h3>Paid</h3>
            <span className="stat-value">{analytics.overview.paidPosts}</span>
          </div>
          <div className="stat-card revenue">
            <h3>Total Revenue</h3>
            <span className="stat-value">{formatCurrency(analytics.overview.totalRevenue)}</span>
          </div>
        </div>
      )}

      <div className="filters-section">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filters.status} 
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">All Posts</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        <div className="filter-group">
          <label>City:</label>
          <select 
            value={filters.city} 
            onChange={(e) => handleFilterChange('city', e.target.value)}
          >
            <option value="all">All Cities</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="posts-list">
        {posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No Posts Found</h3>
            <p>No posts match the current filters.</p>
          </div>
        ) : (
          <div className="posts-table">
            <div className="table-header">
              <div className="table-row">
                <div className="table-cell">Author</div>
                <div className="table-cell">Content</div>
                <div className="table-cell">Location</div>
                <div className="table-cell">Views</div>
                <div className="table-cell">Likes</div>
                <div className="table-cell">Bot Activity</div>
                <div className="table-cell">Revenue</div>
                <div className="table-cell">Status</div>
                <div className="table-cell">Created</div>
                <div className="table-cell">Actions</div>
              </div>
            </div>
            
            <div className="table-body">
              {posts.map(post => (
                <div key={post._id} className="table-row">
                  <div className="table-cell">
                    <div className="author-info">
                      <img 
                        src={post.author?.profilePicture ? `http://localhost:5000${post.author.profilePicture}` : '/api/placeholder/32/32'} 
                        alt={post.author?.fullName || 'User'}
                        className="author-avatar"
                        onError={(e) => {
                          e.target.src = '/api/placeholder/32/32';
                        }}
                      />
                      <div>
                        <div className="author-name">{post.author.fullName}</div>
                        <div className="author-username">@{post.author.username}</div>
                      </div>
                    </div>
                  </div>
                  <div className="table-cell">
                    <div className="post-content">
                      {post.content || 'Media only post'}
                      {post.mediaFiles.length > 0 && (
                        <div className="media-indicator">
                          📎 {post.mediaFiles.length} file{post.mediaFiles.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="table-cell">{post.location}</div>
                  <div className="table-cell">
                    <div className="metric-value">
                      <div className="metric-main" id={`views-${post._id}`}>{post.viewsCount || post.views || 0}</div>
                      {(post.botViews > 0) && (
                        <span className="bot-count">({post.botViews} bot)</span>
                      )}
                    </div>
                  </div>
                  <div className="table-cell">
                    <div className="metric-value">
                      <div className="metric-main" id={`likes-${post._id}`}>{post.likesCount || 0}</div>
                      {(post.botLikes > 0) && (
                        <span className="bot-count">({post.botLikes} bot)</span>
                      )}
                    </div>
                  </div>
                  <div className="table-cell">
                    <div className="bot-activity">
                      <div>Views: {post.botViews || 0}</div>
                      <div>Likes: {post.botLikes || 0}</div>
                    </div>
                  </div>
                  <div className="table-cell">
                    <div className="revenue-breakdown">
                      <div className="total-revenue">{formatCurrency(post.totalRevenue || 0)}</div>
                      <div className="revenue-details">
                        <small>Views: {formatCurrency(post.viewRevenue || 0)}</small>
                        <small>Likes: {formatCurrency(post.likeRevenue || 0)}</small>
                      </div>
                    </div>
                  </div>
                  <div className="table-cell">
                    {getStatusBadge(post)}
                  </div>
                  <div className="table-cell">
                    {formatDate(post.createdAt)}
                  </div>
                  <div className="table-cell">
                    <div className="action-buttons">
                      {(post.rejected || !post.isActive) && (
                        <span className="rejected-status">Rejected</span>
                      )}
                      {!post.approved && !post.paid && !post.rejected && post.isActive && (
                        <>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleApprove(post._id)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRejectClick(post)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {post.approved && !post.paid && (
                        <span className="awaiting-payment">Awaiting Payment</span>
                      )}
                      {post.paid && (
                        <span className="completed">Completed</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Reject Post</h3>
              <button 
                className="close-btn" 
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectingPost(null);
                  setRejectionReason('');
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="post-preview">
                <div className="author-info">
                  <img 
                    src={rejectingPost?.author.profilePicture || '/api/placeholder/32/32'} 
                    alt={rejectingPost?.author.fullName}
                    className="author-avatar"
                  />
                  <div>
                    <div className="author-name">{rejectingPost?.author.fullName}</div>
                    <div className="author-username">@{rejectingPost?.author.username}</div>
                  </div>
                </div>
                <div className="post-content">
                  {rejectingPost?.content || 'Media only post'}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="rejectionReason">Reason for rejection:</label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this post..."
                  rows={4}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectingPost(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleRejectSubmit}
              >
                Reject Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostManagement;
