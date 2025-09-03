import React from 'react';

const ProfileTabs = ({ user, activeTab, onTabChange, canViewPosts }) => {
  const tabs = [
    { id: 'posts', label: 'Posts', count: user.postsCount },
    { id: 'followers', label: 'Followers', count: user.followersCount },
    { id: 'following', label: 'Following', count: user.followingCount }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <div className="tab-content posts-tab">
            {canViewPosts ? (
              <div className="posts-placeholder">
                <p>Posts will be displayed here once post management is implemented.</p>
                {user.recentPosts && user.recentPosts.length > 0 && (
                  <div className="recent-posts-preview">
                    <h4>Recent Posts Preview:</h4>
                    {user.recentPosts.map(post => (
                      <div key={post._id} className="post-preview">
                        <p>{post.content || 'Media post'}</p>
                        <small>{new Date(post.createdAt).toLocaleDateString()}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="private-content">
                <div className="private-message">
                  <span className="private-icon">🔒</span>
                  <h3>This account is private</h3>
                  <p>Follow this account to see their posts.</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'followers':
        return (
          <div className="tab-content followers-tab">
            <div className="followers-placeholder">
              <p>Followers list will be implemented in the next tasks.</p>
              <p>This user has {user.followersCount} followers.</p>
            </div>
          </div>
        );

      case 'following':
        return (
          <div className="tab-content following-tab">
            <div className="following-placeholder">
              <p>Following list will be implemented in the next tasks.</p>
              <p>This user is following {user.followingCount} people.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="profile-tabs">
      <div className="tabs-header">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span className="tab-label">{tab.label}</span>
            <span className="tab-count">{tab.count || 0}</span>
          </button>
        ))}
      </div>

      <div className="tabs-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ProfileTabs;