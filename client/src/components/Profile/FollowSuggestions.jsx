import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';
import FollowButton from './FollowButton';
import { LoadingSpinner } from '../common';
import './FollowSuggestions.css';

const FollowSuggestions = ({ limit = 5 }) => {
  const { api } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSuggestions, setTotalSuggestions] = useState(0);

  useEffect(() => {
    fetchSuggestions(1);
  }, []);

  const fetchSuggestions = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/users/suggestions/follow?limit=${limit}&page=${page}`);
      const { suggestions, pagination } = response.data.data;
      
      // Ensure we never show more than the requested limit
      const limitedSuggestions = suggestions.slice(0, limit);
      
      setSuggestions(limitedSuggestions);
      setCurrentPage(page);
      setTotalPages(pagination.totalPages || 1);
      setTotalSuggestions(pagination.total || 0);
      
      // Debug logging
      console.log('Suggestions Debug:', {
        requestedLimit: limit,
        receivedCount: suggestions.length,
        displayedCount: limitedSuggestions.length,
        totalPages: pagination.totalPages,
        totalSuggestions: pagination.total,
        hasMore: pagination.hasMore,
        currentPage: page,
        paginationCondition: (pagination.totalPages > 1 || pagination.total > limit),
        fullPagination: pagination
      });
    } catch (error) {
      setError(error.response?.data?.error?.message || 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchSuggestions(page);
    }
  };

  const handleFollowChange = (userId, followData) => {
    setSuggestions(prevSuggestions => 
      prevSuggestions.map(user => 
        user._id === userId 
          ? { ...user, isFollowing: followData.isFollowing }
          : user
      )
    );
  };

  const handleDismiss = (userId) => {
    setSuggestions(prevSuggestions => 
      prevSuggestions.filter(user => user._id !== userId)
    );
    setTotalSuggestions(prev => Math.max(0, prev - 1));
  };

  if (loading) {
    return (
      <div className="follow-suggestions">
        <div className="suggestions-header">
          <h3>Suggested for you</h3>
        </div>
        <div className="suggestions-loading">
          <LoadingSpinner size="mini" />
          <span>Loading suggestions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="follow-suggestions">
        <div className="suggestions-header">
          <h3>Suggested for you</h3>
        </div>
        <div className="suggestions-error">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button onClick={() => fetchSuggestions(currentPage)} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="follow-suggestions">
        <div className="suggestions-header">
          <h3>Suggested for you</h3>
        </div>
        <div className="suggestions-empty">
          <span className="empty-icon">🔍</span>
          <p>No suggestions available right now</p>
        </div>
      </div>
    );
  }

  return (
    <div className="follow-suggestions">
      <div className="suggestions-header">
        <h3>Suggested for you</h3>
        <button onClick={() => fetchSuggestions(currentPage)} className="refresh-btn">
          🔄
        </button>
      </div>

      <div className="suggestions-list">
        {suggestions.map((user) => (
          <div key={user._id} className="suggestion-item">
            <Link to={`/profile/${user.username}`} className="user-info">
              <div className="suggestion-user-avatar">
                <img 
                  src={getImageUrl(user.profilePicture) || '/api/placeholder/40/40'} 
                  alt={user.fullName}
                  onError={handleImageError}
                />
              </div>
              <div className="user-details">
                <span className="user-name">{user.fullName}</span>
                <span className="user-username">@{user.username}</span>
                {user.mutualConnections > 0 && (
                  <span className="mutual-followers">
                    {user.mutualConnections} mutual connection{user.mutualConnections !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </Link>
            
            <div className="suggestion-actions">
              <button 
                className="dismiss-btn"
                onClick={() => handleDismiss(user._id)}
                title="Dismiss suggestion"
              >
                ×
              </button>
              <FollowButton
                userId={user._id}
                isFollowing={user.isFollowing}
                onFollowChange={(data) => handleFollowChange(user._id, data)}
              />
            </div>
          </div>
        ))}
      </div>

      {totalSuggestions > limit && (
        <div className="suggestions-pagination">
          <div className="pagination-info">
            <span>Page {currentPage} of {totalPages}</span>
            <span className="total-count">({totalSuggestions} total suggestions)</span>
          </div>
          <div className="pagination-controls">
            <button 
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              ← Previous
            </button>
            <div className="page-numbers">
              {(() => {
                const pages = [];
                const maxVisiblePages = 7;
                
                if (totalPages <= maxVisiblePages) {
                  // Show all pages if total pages is small
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(
                      <button
                        key={i}
                        className={`page-btn ${i === currentPage ? 'active' : ''}`}
                        onClick={() => handlePageChange(i)}
                      >
                        {i}
                      </button>
                    );
                  }
                } else {
                  // Always show first page
                  pages.push(
                    <button
                      key={1}
                      className={`page-btn ${1 === currentPage ? 'active' : ''}`}
                      onClick={() => handlePageChange(1)}
                    >
                      1
                    </button>
                  );
                  
                  // Show ellipsis if current page is far from start
                  if (currentPage > 4) {
                    pages.push(
                      <span key="ellipsis-start" className="page-ellipsis">...</span>
                    );
                  }
                  
                  // Show pages around current page
                  const startPage = Math.max(2, currentPage - 1);
                  const endPage = Math.min(totalPages - 1, currentPage + 1);
                  
                  for (let i = startPage; i <= endPage; i++) {
                    if (i !== 1 && i !== totalPages) {
                      pages.push(
                        <button
                          key={i}
                          className={`page-btn ${i === currentPage ? 'active' : ''}`}
                          onClick={() => handlePageChange(i)}
                        >
                          {i}
                        </button>
                      );
                    }
                  }
                  
                  // Show ellipsis if current page is far from end
                  if (currentPage < totalPages - 3) {
                    pages.push(
                      <span key="ellipsis-end" className="page-ellipsis">...</span>
                    );
                  }
                  
                  // Always show last page (if more than 1 page)
                  if (totalPages > 1) {
                    pages.push(
                      <button
                        key={totalPages}
                        className={`page-btn ${totalPages === currentPage ? 'active' : ''}`}
                        onClick={() => handlePageChange(totalPages)}
                      >
                        {totalPages}
                      </button>
                    );
                  }
                }
                
                return pages;
              })()}
            </div>
            <button 
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowSuggestions;