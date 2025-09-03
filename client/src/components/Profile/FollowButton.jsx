import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common';
import './FollowButton.css';

const FollowButton = ({ userId, isFollowing, onFollowChange }) => {
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFollowToggle = async () => {
    setLoading(true);
    setError(null);

    try {
      if (isFollowing) {
        // Unfollow
        const response = await api.delete(`/users/follow/${userId}`);
        onFollowChange(response.data.data);
      } else {
        // Follow
        const response = await api.post(`/users/follow/${userId}`);
        onFollowChange(response.data.data);
      }
    } catch (error) {
      setError(error.response?.data?.error?.message || 'Failed to update follow status');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="follow-button-container">
      {error && (
        <div className="follow-error">
          {error}
        </div>
      )}
      
      <button
        onClick={handleFollowToggle}
        disabled={loading}
        className={`follow-btn ${isFollowing ? 'following' : 'not-following'}`}
      >
        {loading ? (
          <span className="loading-text">
            <LoadingSpinner size="mini" />
            {isFollowing ? 'Unfollowing...' : 'Following...'}
          </span>
        ) : (
          <span className="follow-text">
            {isFollowing ? (
              <>
                <span className="follow-icon">✓</span>
                Following
              </>
            ) : (
              <>
                <span className="follow-icon">+</span>
                Follow
              </>
            )}
          </span>
        )}
      </button>
    </div>
  );
};

export default FollowButton;