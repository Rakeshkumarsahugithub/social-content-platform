import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProfileHeader from '../components/Profile/ProfileHeader';
import ProfileEdit from '../components/Profile/ProfileEdit';
import FollowButton from '../components/Profile/FollowButton';
import ProfileTabs from '../components/Profile/ProfileTabs';

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser, api, updateUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  const isOwnProfile = !username || username === currentUser?.username;
  const profileIdentifier = username || currentUser?.username;

  useEffect(() => {
    fetchProfile();
  }, [profileIdentifier]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use username-based endpoint if we have a username, otherwise use current user
      const endpoint = username 
        ? `/users/profile/username/${username}` 
        : `/users/profile/${currentUser?.id}`;
      
      const response = await api.get(endpoint);
      setProfileUser(response.data.data.user);
    } catch (error) {
      setError(error.response?.data?.error?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = (updatedUser) => {
    setProfileUser(prev => ({ ...prev, ...updatedUser }));
    
    // If this is the current user's profile, update the auth context as well
    if (isOwnProfile && updateUser) {
      updateUser(updatedUser);
    }
    
    setIsEditing(false);
  };

  const handleFollowChange = (newFollowState) => {
    setProfileUser(prev => ({
      ...prev,
      isFollowing: newFollowState.isFollowing,
      followersCount: newFollowState.followersCount
    }));
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-error">
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
        <button onClick={fetchProfile} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="profile-not-found">
        <h2>Profile Not Found</h2>
        <p>The user you're looking for doesn't exist or has been deactivated.</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-content">
        <ProfileHeader 
          user={profileUser}
          isOwnProfile={isOwnProfile}
          onEditClick={() => setIsEditing(true)}
        />

        {!isOwnProfile && (
          <div className="profile-actions">
            <FollowButton 
              userId={profileUser._id}
              isFollowing={profileUser.isFollowing}
              onFollowChange={handleFollowChange}
            />
          </div>
        )}

        {isEditing && isOwnProfile && (
          <ProfileEdit
            user={profileUser}
            onSave={handleProfileUpdate}
            onCancel={() => setIsEditing(false)}
          />
        )}

        <ProfileTabs
          user={profileUser}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          canViewPosts={profileUser.canViewPosts}
        />
      </div>
    </div>
  );
};

export default Profile;