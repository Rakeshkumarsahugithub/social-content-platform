import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserSearch } from '../components/Search';
import FollowSuggestions from '../components/Profile/FollowSuggestions';
import { LoadingSpinner } from '../components/common';
import './Discover.css';

const Discover = () => {
  const { api } = useAuth();
  const [trendingUsers, setTrendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrendingUsers();
  }, []);

  const fetchTrendingUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get users with most followers (trending)
      const response = await api.get('/users/search?q=&limit=20');
      setTrendingUsers(response.data.data.users);
    } catch (error) {
      setError(error.response?.data?.error?.message || 'Failed to load trending users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="discover-container">
      <div className="discover-header">
        <h1>Discover People</h1>
        <p>Find and connect with interesting people on the platform</p>
      </div>

      <div className="discover-content">
        <div className="discover-main">
          <div className="search-section">
            <h2>Search Users</h2>
            <UserSearch showHeader={false} />
          </div>

          <div className="trending-section">
            <div className="section-header">
              <h2>Trending Users</h2>
              <button onClick={fetchTrendingUsers} className="refresh-btn">
                🔄 Refresh
              </button>
            </div>

            {loading ? (
              <div className="loading-container">
                <LoadingSpinner text="Loading trending users..." />
              </div>
            ) : error ? (
              <div className="error-container">
                <span className="error-icon">⚠️</span>
                <p>{error}</p>
                <button onClick={fetchTrendingUsers} className="retry-btn">
                  Try Again
                </button>
              </div>
            ) : trendingUsers.length === 0 ? (
              <div className="empty-container">
                <span className="empty-icon">👥</span>
                <p>No trending users found</p>
              </div>
            ) : (
              <div className="trending-users-grid">
                {trendingUsers.map((user) => (
                  <div key={user._id} className="trending-user-card">
                    <div className="user-avatar">
                      <img 
                        src={user.profilePicture || '/api/placeholder/80/80'} 
                        alt={user.fullName}
                        onError={(e) => {
                          e.target.src = '/api/placeholder/80/80';
                        }}
                      />
                    </div>
                    <div className="user-info">
                      <h3 className="user-name">{user.fullName}</h3>
                      <p className="user-username">@{user.username}</p>
                      {user.bio && (
                        <p className="user-bio">{user.bio}</p>
                      )}
                      <div className="user-stats">
                        <span className="stat">
                          <strong>{user.followersCount || 0}</strong> followers
                        </span>
                      </div>
                    </div>
                    <div className="user-actions">
                      <Link 
                        to={`/profile/${user.username}`}
                        className="view-profile-btn"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="discover-sidebar">
          <FollowSuggestions limit={5} />
          
          <div className="discover-tips">
            <h3>💡 Discovery Tips</h3>
            <ul>
              <li>Use the search bar to find specific users</li>
              <li>Check out suggested users based on your network</li>
              <li>Follow users with similar interests</li>
              <li>Engage with posts to discover new people</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Discover;