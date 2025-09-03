import React, { useState } from 'react';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';
import FollowList from './FollowList';
import './ProfileHeader.css';

const ProfileHeader = ({ user, isOwnProfile, onEditClick }) => {
  const defaultAvatar = '/api/placeholder/150/150';
  const [followListOpen, setFollowListOpen] = useState(false);
  const [followListType, setFollowListType] = useState('followers');

  return (
    <div className="profile-header">
      <div className="profile-avatar-section">
        <div className="profile-header-avatar">
          <img 
            src={getImageUrl(user.profilePicture) || '/api/placeholder/150/150'} 
            alt={`${user.fullName}'s profile`}
            className="profile-header-avatar-img"
            onError={handleImageError}
          />
        </div>
      </div>

      <div className="profile-info-section">
        <div className="profile-name-section">
          <h1 className="profile-name">{user.fullName}</h1>
          <p className="profile-username">@{user.username}</p>
          {user.role !== 'user' && (
            <span className="profile-role-badge">{user.role}</span>
          )}
        </div>

        {user.bio && (
          <div className="profile-bio">
            <p>{user.bio}</p>
          </div>
        )}

        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-number">{user.postsCount || 0}</span>
            <span className="stat-label">Posts</span>
          </div>
          <div 
            className="stat-item clickable" 
            onClick={() => {
              setFollowListType('followers');
              setFollowListOpen(true);
            }}
          >
            <span className="stat-number">{user.followersCount || 0}</span>
            <span className="stat-label">Followers</span>
          </div>
          <div 
            className="stat-item clickable" 
            onClick={() => {
              setFollowListType('following');
              setFollowListOpen(true);
            }}
          >
            <span className="stat-number">{user.followingCount || 0}</span>
            <span className="stat-label">Following</span>
          </div>
        </div>

        <div className="profile-meta">
          <div className="profile-visibility">
            <span className="visibility-label">Posts:</span>
            <span className={`visibility-badge ${user.postVisibility}`}>
              {user.postVisibility === 'public' ? '🌍 Public' : '🔒 Private'}
            </span>
          </div>
          
          <div className="profile-joined">
            <span className="joined-label">Joined:</span>
            <span className="joined-date">
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>

        {isOwnProfile && (
          <div className="profile-actions">
            <button onClick={onEditClick} className="edit-profile-btn">
              Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;