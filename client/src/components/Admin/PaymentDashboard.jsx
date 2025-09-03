import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { LoadingSpinner } from '../common';
import './PaymentDashboard.css';

const PaymentDashboard = () => {
  const { api, user } = useAuth();
  const { addNotification } = useNotifications();
  const [pendingPayments, setPendingPayments] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [statistics, setStatistics] = useState(null);
  const [filters, setFilters] = useState({
    city: 'all',
    timeframe: '30d'
  });

  const cities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
    'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
    'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri',
    'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
    'Faridabad', 'Meerut', 'Rajkot', 'Kalyan', 'Vasai', 'Varanasi'
  ];

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingPayments();
    } else {
      fetchPaymentHistory();
    }
  }, [activeTab, filters]);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        city: filters.city
      }).toString();
      
      const response = await api.get(`/admin/payments/pending?${queryParams}`);
      setPendingPayments(response.data.data.posts);
      setStatistics({
        totalPending: response.data.data.totalPendingRevenue,
        count: response.data.data.posts.length
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load pending payments'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        timeframe: filters.timeframe
      }).toString();
      
      const response = await api.get(`/admin/payments/history?${queryParams}`);
      setPaymentHistory(response.data.data.payments);
      setStatistics(response.data.data.statistics);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load payment history'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (postId) => {
    try {
      const response = await api.patch(`/admin/payments/${postId}/pay`);
      
      setPendingPayments(prev => prev.filter(post => post._id !== postId));
      
      addNotification({
        type: 'success',
        title: 'Payment Processed',
        message: `Payment of ${formatCurrency(response.data.data.paidAmount)} processed successfully`
      });

      // Refresh statistics
      fetchPendingPayments();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Payment Failed',
        message: error.response?.data?.error?.message || 'Failed to process payment'
      });
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const formatCurrency = (amount) => {
    // Handle undefined or null values
    if (amount === undefined || amount === null) {
      return '₹0.00';
    }
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

  return (
    <div className="payment-dashboard">
      <div className="payment-header">
        <h2>Payment Processing Dashboard</h2>
        <div className="user-role">
          <span className="role-badge">{user.role}</span>
        </div>
      </div>

      {statistics && (
        <div className="payment-stats">
          {activeTab === 'pending' ? (
            <>
              <div className="stat-card pending">
                <h3>Pending Payments</h3>
                <span className="stat-value">{statistics.count}</span>
              </div>
              <div className="stat-card amount">
                <h3>Total Amount</h3>
                <span className="stat-value">{formatCurrency(statistics.totalPending)}</span>
              </div>
            </>
          ) : (
            <>
              <div className="stat-card completed">
                <h3>Paid Posts</h3>
                <span className="stat-value">{statistics.totalPosts}</span>
              </div>
              <div className="stat-card amount">
                <h3>Total Paid</h3>
                <span className="stat-value">{formatCurrency(statistics.totalAmount)}</span>
              </div>
              <div className="stat-card average">
                <h3>Average Payment</h3>
                <span className="stat-value">{formatCurrency(statistics.avgAmount)}</span>
              </div>
            </>
          )}
        </div>
      )}

      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Payments
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Payment History
        </button>
      </div>

      <div className="filters-section">
        {activeTab === 'pending' ? (
          <div className="filter-group">
            <label>Filter by City:</label>
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
        ) : (
          <div className="filter-group">
            <label>Timeframe:</label>
            <select 
              value={filters.timeframe} 
              onChange={(e) => handleFilterChange('timeframe', e.target.value)}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        )}
      </div>

      <div className="payments-content">
        {loading ? (
          <div className="loading-container">
            <LoadingSpinner />
            <span>Loading {activeTab === 'pending' ? 'pending payments' : 'payment history'}...</span>
          </div>
        ) : (
          <div className="payments-table">
            {activeTab === 'pending' ? (
              pendingPayments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💰</div>
                  <h3>No Pending Payments</h3>
                  <p>All approved posts have been paid.</p>
                </div>
              ) : (
                <>
                  <div className="table-header">
                    <div className="table-row">
                      <div className="table-cell">Author</div>
                      <div className="table-cell">Content</div>
                      <div className="table-cell">Location</div>
                      <div className="table-cell">Engagement</div>
                      <div className="table-cell">Revenue</div>
                      <div className="table-cell">Approved</div>
                      <div className="table-cell">Action</div>
                    </div>
                  </div>
                  <div className="table-body">
                    {pendingPayments.map(post => (
                      <div key={post._id} className="table-row">
                        <div className="table-cell">
                          <div className="author-info">
                            <img 
                              src={post.author.profilePicture || '/api/placeholder/32/32'} 
                              alt={post.author.fullName}
                              className="author-avatar"
                            />
                            <div>
                              <div className="author-name">{post.author.fullName}</div>
                              <div className="author-username">@{post.author.username}</div>
                              <div className="author-email">{post.author.email}</div>
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
                          <div className="engagement-metrics">
                            <div>👁️ {post.views} views</div>
                            <div>❤️ {post.likesCount} likes</div>
                            <div>💬 {post.commentsCount} comments</div>
                          </div>
                        </div>
                        <div className="table-cell">
                          <div className="revenue-breakdown">
                            <div className="total-revenue">{formatCurrency(post.totalRevenue)}</div>
                            <div className="revenue-details">
                              <small>Views: {formatCurrency(post.viewRevenue)}</small>
                              <small>Likes: {formatCurrency(post.likeRevenue)}</small>
                            </div>
                          </div>
                        </div>
                        <div className="table-cell">
                          <div className="approval-info">
                            <div>{formatDate(post.approvedAt)}</div>
                            <div className="approved-by">by {post.approvedBy.fullName}</div>
                          </div>
                        </div>
                        <div className="table-cell">
                          <button
                            className="btn btn-primary pay-btn"
                            onClick={() => handlePayment(post._id)}
                          >
                            💳 Pay {formatCurrency(post.totalRevenue)}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )
            ) : (
              paymentHistory.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h3>No Payment History</h3>
                  <p>No payments have been processed in the selected timeframe.</p>
                </div>
              ) : (
                <>
                  <div className="table-header">
                    <div className="table-row">
                      <div className="table-cell">Author</div>
                      <div className="table-cell">Content</div>
                      <div className="table-cell">Location</div>
                      <div className="table-cell">Amount Paid</div>
                      <div className="table-cell">Paid By</div>
                      <div className="table-cell">Payment Date</div>
                    </div>
                  </div>
                  <div className="table-body">
                    {paymentHistory.map(post => (
                      <div key={post._id} className="table-row">
                        <div className="table-cell">
                          <div className="author-info">
                            <img 
                              src={post.author.profilePicture || '/api/placeholder/32/32'} 
                              alt={post.author.fullName}
                              className="author-avatar"
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
                          </div>
                        </div>
                        <div className="table-cell">{post.location}</div>
                        <div className="table-cell">
                          <div className="paid-amount">{formatCurrency(post.totalRevenue)}</div>
                        </div>
                        <div className="table-cell">
                          <div className="paid-by-info">
                            <div>{post.paidBy.fullName}</div>
                            <div className="paid-by-username">@{post.paidBy.username}</div>
                          </div>
                        </div>
                        <div className="table-cell">
                          {formatDate(post.paidAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentDashboard;
