import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common';
import './LikesModal.css';

const LikesModal = ({ postId, isOpen, onClose }) => {
  const { api } = useAuth();
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && postId) {
      fetchLikes();
    }
  }, [isOpen, postId]);

  const fetchLikes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/posts/${postId}/likes`);
      
      if (response.data.success) {
        setLikes(response.data.data.likes);
      }
    } catch (error) {
      console.error('Error fetching likes:', error);
      setError(error.response?.data?.error?.message || 'Failed to load likes');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      if (days < 7) {
        return `${days}d ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="likes-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Likes</h3>
          <button onClick={onClose} className="close-btn">
            ✕
          </button>
        </div>

        <div className="modal-content">
          {loading ? (
            <div className="loading-container">
              <LoadingSpinner text="Loading likes..." />
            </div>
          ) : error ? (
            <div className="error-container">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
              <button onClick={fetchLikes} className="retry-btn">
                Try Again
              </button>
            </div>
          ) : likes.length === 0 ? (
            <div className="empty-container">
              <span className="empty-icon">💔</span>
              <p>No likes yet</p>
            </div>
          ) : (
            <div className="likes-list">
              {likes.map((like, index) => (
                <div key={index} className="like-item">
                  <Link 
                    to={`/profile/${like.user.username}`} 
                    className="like-user"
                    onClick={onClose}
                  >
                    <div className="user-avatar">
                      <img 
                        src={like.user.profilePicture || '/api/placeholder/40/40'} 
                        alt={like.user.fullName}
                        onError={(e) => {
                          e.target.src = '/api/placeholder/40/40';
                        }}
                      />
                    </div>
                    <div className="user-info">
                      <span className="user-name">{like.user.fullName}</span>
                      <span className="user-username">@{like.user.username}</span>
                    </div>
                  </Link>
                  <span className="like-date">{formatDate(like.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LikesModal;