import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import PostCard from '../components/Post/PostCard';
import FollowSuggestions from '../components/Profile/FollowSuggestions';
import LoadMoreScroll from '../components/common/LoadMoreScroll';
import './Home.css';

const Home = () => {
  const { user, api } = useAuth();
  const location = useLocation();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check if we need to refresh (coming from post creation)
  useEffect(() => {
    if (location.state?.refresh) {
      setRefreshTrigger(prev => prev + 1);
      // Clear the state to prevent refresh on subsequent visits
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch function for infinite scroll
  const fetchPosts = useCallback(async (page = 1, limit = 10) => {
    const response = await api.get(`/posts/feed?page=${page}&limit=${limit}`);
    
    if (response.data.success) {
      return {
        data: response.data.data.posts,
        hasMore: response.data.data.pagination.hasMore
      };
    }
    
    throw new Error(response.data.error?.message || 'Failed to fetch posts');
  }, [api]);

  const handleLike = (updatedPost) => {
    // This will be handled by the PostCard's internal state management
    // No need to update here as each post manages its own like state
  };

  const renderPost = useCallback((post, index) => (
    <PostCard 
      key={post._id} 
      post={post} 
      onLike={handleLike}
    />
  ), [handleLike]);

  return (
    <div className="home-container">
      <div className="welcome-section">
        <h1>Welcome back, {user?.fullName}!</h1>
        <p>Discover what's happening in your community.</p>
      </div>
      
      <div className="home-content">
        <div className="feed-container">
          <LoadMoreScroll
            fetchFunction={fetchPosts}
            renderItem={renderPost}
            emptyMessage="No posts yet! Be the first to share something by creating a post."
            emptyIcon="📝"
            className="posts-feed"
            loadMoreThreshold={10}
            key={refreshTrigger} // Force refresh when needed
          />
        </div>

        <div className="home-sidebar">
          <FollowSuggestions limit={5} />
          
          <div className="quick-stats">
            <h3>Your Activity</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">{user?.followingCount || 0}</span>
                <span className="stat-label">Following</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{user?.followersCount || 0}</span>
                <span className="stat-label">Followers</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;