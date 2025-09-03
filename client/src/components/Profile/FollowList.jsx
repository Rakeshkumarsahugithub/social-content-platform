import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';
import FollowButton from './FollowButton';
import { LoadingSpinner } from '../common';
import './FollowList.css';

const FollowList = ({ userId, type, isOpen, onClose }) => {
  const { api, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUsers();
    }
  }, [isOpen, userId, type]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = type === 'followers' ? 'followers' : 'following';
      const response = await api.get(`/users/${userId}/${endpoint}`);
      setUsers(response.data.data.users);
    } catch (error) {
      setError(error.response?.data?.error?.message || `Failed to load ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowChange = (userId, followData) => {
    setUsers(prevUsers => 
      prevUsers.map(u => 
        u._id === userId 
          ? { ...u, isFollowing: followData.isFollowing }
          : u
      )
    );
  };

  if (!isOpen) return null;

  return (
    <div className="follow-list-overlay" onClick={onClose}>
      <div className="follow-list-modal" onClick={e => e.stopPropagation()}>
        <div className="follow-list-header">
          <h3>{type === 'followers' ? 'Followers' : 'Following'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="follow-list-content">
          {loading ? (
            <div className="follow-list-loading">
              <LoadingSpinner />
              <span>Loading {type}...</span>
            </div>
          ) : error ? (
            <div className="follow-list-error">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
              <button onClick={fetchUsers} className="retry-btn">
                Try Again
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="follow-list-empty">
              <span className="empty-icon">👥</span>
              <p>No {type} yet</p>
            </div>
          ) : (
            <div className="users-list">
              {users.map((followUser) => (
                <div key={followUser._id} className="user-item">
                  <Link 
                    to={`/profile/${followUser.username}`} 
                    className="user-info"
                    onClick={onClose}
                  >
                    <div className="user-avatar">
                      <img 
                        src={getImageUrl(followUser.profilePicture) || '/api/placeholder/40/40'} 
                        alt={followUser.fullName}
                        onError={handleImageError}
                      />
                    </div>
                    <div className="user-details">
                      <span className="user-name">{followUser.fullName}</span>
                      <span className="user-username">@{followUser.username}</span>
                      {followUser.bio && (
                        <span className="user-bio">{followUser.bio}</span>
                      )}
                    </div>
                  </Link>
                  
                  {user?.id !== followUser._id && (
                    <div className="user-actions">
                      <FollowButton
                        userId={followUser._id}
                        isFollowing={followUser.isFollowing}
                        onFollowChange={(data) => handleFollowChange(followUser._id, data)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowList;