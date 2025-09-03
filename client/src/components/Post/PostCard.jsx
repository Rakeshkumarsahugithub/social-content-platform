import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';
import useViewTracking from '../../hooks/useViewTracking';
import LikesModal from './LikesModal';
import './PostCard.css';

// Helper function to generate initials for avatar fallback
const getInitials = (name) => {
  if (!name) return 'U';
  const initials = name.split(' ').map(part => part[0]).join('');
  return initials.length > 2 ? initials.substring(0, 2) : initials;
};

const PostCard = ({ post, onLike, onComment }) => {
  const { api, user } = useAuth();
  const { socket } = useSocket();
  const [isLiking, setIsLiking] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [showFloatingHeart, setShowFloatingHeart] = useState(false);

  // Track view when post becomes visible
  const viewRef = useViewTracking(post._id, (viewData) => {
    setLocalPost(prev => ({
      ...prev,
      views: viewData.views,
      botViews: viewData.botViews,
      totalRevenue: viewData.totalRevenue
    }));
  });

  // Listen for real-time like updates
  useEffect(() => {
    if (socket) {
      const handleLikeUpdate = (data) => {
        if (data.postId === post._id) {
          setLocalPost(prev => ({
            ...prev,
            likesCount: data.likesCount,
            // Only update isLiked if it's for the current user
            isLiked: data.userId === user.id ? data.isLiked : prev.isLiked
          }));
          
          // Trigger animation for any like update
          setLikeAnimation(true);
          setTimeout(() => setLikeAnimation(false), 600);
        }
      };

      socket.on('post_like_update', handleLikeUpdate);

      return () => {
        socket.off('post_like_update', handleLikeUpdate);
      };
    }
  }, [socket, post._id, user.id]);



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
      return `${days}d ago`;
    }
  };

  const handleLike = async () => {
    if (isLiking) return;

    setIsLiking(true);
    try {
      const response = await api.put(`/posts/${post._id}/like`);
      
      if (response.data.success) {
        const updatedPost = {
          ...localPost,
          isLiked: response.data.data.isLiked,
          likesCount: response.data.data.likesCount
        };
        setLocalPost(updatedPost);
        
        if (onLike) {
          onLike(updatedPost);
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = () => {
    if (onComment) {
      onComment(post);
    }
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: `${localPost.author.fullName}'s post`,
        text: localPost.content || 'Check out this post',
        url: `${window.location.origin}/post/${localPost._id}`
      };

      // Try Web Share API first
      if (navigator.share) {
        await navigator.share(shareData);
        console.log('Shared successfully via Web Share API');
      } else {
        // Fallback for browsers that don't support Web Share API
        await fallbackShare(shareData.url);
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      // Always try fallback on error
      try {
        await fallbackShare(`${window.location.origin}/post/${localPost._id}`);
      } catch (fallbackError) {
        console.error('Error with fallback share:', fallbackError);
        // Last resort: show alert with URL
        alert(`Share this post: ${window.location.origin}/post/${localPost._id}`);
      }
    }
  };

  const fallbackShare = async (url) => {
    // Try clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(url);
        alert('Post link copied to clipboard!');
        return;
      } catch (clipboardError) {
        console.warn('Clipboard API failed:', clipboardError);
      }
    }
    
    // Fallback to legacy execCommand
    try {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        alert('Post link copied to clipboard!');
      } else {
        throw new Error('Copy command failed');
      }
    } catch (error) {
      console.error('All copy methods failed:', error);
      // Show URL in alert as last resort
      prompt('Copy this link to share the post:', url);
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (lastTap && (now - lastTap) < DOUBLE_TAP_DELAY) {
      // Double tap detected - like the post if not already liked
      if (!localPost.isLiked) {
        handleLike();
        // Show floating heart animation
        setShowFloatingHeart(true);
        setTimeout(() => setShowFloatingHeart(false), 1000);
      }
    } else {
      setLastTap(now);
    }
  };

  const renderMedia = () => {
    if (!localPost.mediaFiles || localPost.mediaFiles.length === 0) {
      return null;
    }

    return (
      <div className="post-media" onTouchEnd={handleDoubleTap}>
        {localPost.mediaFiles.map((media, index) => (
          <div key={index} className="media-item">
            {media.type === 'image' ? (
              <img 
                src={getImageUrl(media.url) || '/api/placeholder/400/300'} 
                alt="Post media"
                onError={handleImageError}
                className="post-media-img"
              />
            ) : (
              <video 
                controls 
                poster={media.thumbnail ? getImageUrl(media.thumbnail) : undefined}
                preload="metadata"
              >
                <source src={getImageUrl(media.url)} type="video/mp4" />
                <source src={getImageUrl(media.url)} type="video/webm" />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        ))}
        {showFloatingHeart && (
          <div className="floating-heart">❤️</div>
        )}
      </div>
    );
  };

  return (
    <article className="post-card" ref={viewRef}>
      <div className="post-header">
        <Link to={`/profile/${localPost.author.username}`} className="post-author">
          <div className="author-avatar">
            {localPost.author.profilePicture ? (
              <img 
                src={getImageUrl(localPost.author.profilePicture) || '/api/placeholder/40/40'} 
                alt={localPost.author.fullName}
                onError={handleImageError}
                className="author-avatar-img"
              />
            ) : (
              <div 
                className="avatar-placeholder"
                style={{ 
                  backgroundColor: '#3498db',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '18px'
                }}
              >
                {getInitials(localPost.author.fullName)}
              </div>
            )}
          </div>
          <div className="author-info">
            <span className="author-name">{localPost.author.fullName}</span>
            <span className="author-username">@{localPost.author.username}</span>
          </div>
        </Link>
        <div className="post-meta">
          <span className="post-time">{formatDate(localPost.createdAt)}</span>
          {localPost.location && (
            <span className="post-location">📍 {localPost.location}</span>
          )}
        </div>
      </div>

      {localPost.content && (
        <div className="post-content">
          <p>{localPost.content}</p>
        </div>
      )}

      {renderMedia()}

      <div className="post-stats">
        <div className="engagement-stats">
          <span className="stat-item">
            <span className="stat-icon">👁️</span>
            <span className="stat-count">{localPost.views || 0}</span>
            <span className="stat-label">views</span>
          </span>
          {localPost.botViews > 0 && (
            <span className="stat-item bot-stat">
              <span className="stat-icon">🤖</span>
              <span className="stat-count">{localPost.botViews}</span>
              <span className="stat-label">bot views</span>
            </span>
          )}
        </div>
      </div>

      <div className="post-actions">
        <button 
          onClick={handleLike}
          disabled={isLiking}
          className={`action-btn like-btn ${localPost.isLiked ? 'liked' : ''} ${likeAnimation ? 'animate' : ''}`}
        >
          <span className="action-icon">
            {localPost.isLiked ? '❤️' : '🤍'}
          </span>
          <span 
            className="action-count clickable" 
            onClick={(e) => {
              e.stopPropagation();
              if (localPost.likesCount > 0) {
                setShowLikesModal(true);
              }
            }}
          >
            {localPost.likesCount || 0}
          </span>
          <span className="action-text">Like</span>
        </button>

        <Link to={`/post/${localPost._id}`} className="action-btn comment-btn">
          <span className="action-icon">💬</span>
          <span className="action-count">{localPost.commentsCount || 0}</span>
          <span className="action-text">Comment</span>
        </Link>

        <button className="action-btn share-btn" onClick={handleShare}>
          <span className="action-icon">📤</span>
          <span className="action-text">Share</span>
        </button>
      </div>

      <LikesModal 
        postId={localPost._id}
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
      />
    </article>
  );
};

export default PostCard;