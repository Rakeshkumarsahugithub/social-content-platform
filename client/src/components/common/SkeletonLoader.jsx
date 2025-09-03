import React from 'react';
import './SkeletonLoader.css';

const SkeletonLoader = ({ type = 'post', count = 1 }) => {
  const renderPostSkeleton = () => (
    <div className="skeleton-post">
      <div className="skeleton-header">
        <div className="skeleton-avatar"></div>
        <div className="skeleton-user-info">
          <div className="skeleton-line skeleton-name"></div>
          <div className="skeleton-line skeleton-username"></div>
        </div>
      </div>
      <div className="skeleton-content">
        <div className="skeleton-line skeleton-text-long"></div>
        <div className="skeleton-line skeleton-text-medium"></div>
        <div className="skeleton-line skeleton-text-short"></div>
      </div>
      <div className="skeleton-media"></div>
      <div className="skeleton-actions">
        <div className="skeleton-action-btn"></div>
        <div className="skeleton-action-btn"></div>
        <div className="skeleton-action-btn"></div>
      </div>
    </div>
  );

  const renderUserSkeleton = () => (
    <div className="skeleton-user">
      <div className="skeleton-avatar-large"></div>
      <div className="skeleton-user-details">
        <div className="skeleton-line skeleton-name"></div>
        <div className="skeleton-line skeleton-username"></div>
        <div className="skeleton-line skeleton-bio"></div>
      </div>
      <div className="skeleton-follow-btn"></div>
    </div>
  );

  const renderCommentSkeleton = () => (
    <div className="skeleton-comment">
      <div className="skeleton-avatar-small"></div>
      <div className="skeleton-comment-content">
        <div className="skeleton-line skeleton-name-small"></div>
        <div className="skeleton-line skeleton-text-medium"></div>
        <div className="skeleton-line skeleton-text-short"></div>
      </div>
    </div>
  );

  const renderTableSkeleton = () => (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-table-cell skeleton-header-cell"></div>
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton-table-row">
          {Array.from({ length: 6 }).map((_, j) => (
            <div key={j} className="skeleton-table-cell">
              <div className="skeleton-line skeleton-cell-content"></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'post':
        return renderPostSkeleton();
      case 'user':
        return renderUserSkeleton();
      case 'comment':
        return renderCommentSkeleton();
      case 'table':
        return renderTableSkeleton();
      default:
        return renderPostSkeleton();
    }
  };

  return (
    <div className="skeleton-container">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-item">
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
