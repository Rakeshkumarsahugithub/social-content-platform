import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserSearch } from '../components/Search';
import PostCard from '../components/Post/PostCard';
import { LoadingSpinner } from '../components/common';
import './Search.css';

const Search = () => {
  const [searchParams] = useSearchParams();
  const { api } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    hasNext: false,
    hasPrev: false
  });

  const query = searchParams.get('q') || '';

  useEffect(() => {
    if (query.trim().length >= 2) {
      if (activeTab === 'posts') {
        searchPosts();
      }
    } else {
      setPosts([]);
      setPagination({
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        hasNext: false,
        hasPrev: false
      });
    }
  }, [query, activeTab]);

  const searchPosts = async (page = 1) => {
    if (!query.trim() || query.trim().length < 2) return;

    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/posts/search?q=${encodeURIComponent(query)}&page=${page}&limit=10`);
      
      if (response.data.success) {
        if (page === 1) {
          setPosts(response.data.data.posts);
        } else {
          setPosts(prev => [...prev, ...response.data.data.posts]);
        }
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      setError(error.response?.data?.error?.message || 'Failed to search posts');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (pagination.hasNext && !loading) {
      searchPosts(pagination.currentPage + 1);
    }
  };

  const handleLike = (updatedPost) => {
    // Update the post in the list
    setPosts(prev => prev.map(post => 
      post._id === updatedPost._id ? { ...post, ...updatedPost } : post
    ));
  };

  const renderPost = (post) => (
    <PostCard 
      key={post._id} 
      post={post} 
      onLike={handleLike}
    />
  );

  if (!query.trim()) {
    return (
      <div className="search-page">
        <div className="search-header">
          <h1>Search</h1>
          <p>Enter a search term to find users and posts</p>
        </div>
        
        <div className="search-tabs">
          <button 
            className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            Posts
          </button>
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
        </div>

        <div className="search-content">
          <div className="empty-search">
            <div className="empty-icon">🔍</div>
            <h3>Start Searching</h3>
            <p>Use the search bar in the navigation to find users and posts</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>Search Results</h1>
        <p>Results for "{query}"</p>
      </div>

      <div className="search-tabs">
        <button 
          className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts ({pagination.totalItems})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
      </div>

      <div className="search-content">
        {activeTab === 'posts' ? (
          <div className="posts-search">
            {loading && posts.length === 0 ? (
              <div className="loading-container">
                <LoadingSpinner />
                <span>Searching posts...</span>
              </div>
            ) : error ? (
              <div className="error-container">
                <div className="error-icon">⚠️</div>
                <p>{error}</p>
                <button onClick={() => searchPosts()} className="retry-btn">
                  Try Again
                </button>
              </div>
            ) : posts.length === 0 ? (
              <div className="no-results">
                <div className="no-results-icon">📝</div>
                <h3>No Posts Found</h3>
                <p>No posts match your search for "{query}"</p>
              </div>
            ) : (
              <div className="posts-results">
                <div className="results-header">
                  <span>Found {pagination.totalItems} post{pagination.totalItems !== 1 ? 's' : ''}</span>
                </div>
                
                <div className="posts-list">
                  {posts.map(renderPost)}
                </div>

                {pagination.hasNext && (
                  <div className="load-more-container">
                    <button 
                      className="load-more-btn"
                      onClick={handleLoadMore}
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : 'Load More Posts'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="users-search">
            <UserSearch showHeader={false} initialQuery={query} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
