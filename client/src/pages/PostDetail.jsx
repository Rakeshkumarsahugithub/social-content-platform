import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CommentSection } from '../components/Comments';
import api from '../services/api';
import { getImageUrl, handleImageError } from '../utils/imageUtils';
import './PostDetail.css';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/posts/${id}`);
      
      if (response.data.success) {
        setPost(response.data.data.post);
      } else {
        setError('Post not found');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      if (error.response?.status === 404) {
        setError('Post not found');
      } else {
        setError('Failed to load post. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user || isLiking) return;

    setIsLiking(true);
    try {
      const response = await api.put(`/posts/${post._id}/like`);
      
      if (response.data.success) {
        setPost(prev => ({
          ...prev,
          isLiked: response.data.data.isLiked,
          likesCount: response.data.data.likesCount
        }));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: `${post.author.fullName}'s post`,
        text: post.content || 'Check out this post',
        url: `${window.location.origin}/post/${post._id}`
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
        await fallbackShare(`${window.location.origin}/post/${post._id}`);
      } catch (fallbackError) {
        console.error('Error with fallback share:', fallbackError);
        // Last resort: show alert with URL
        alert(`Share this post: ${window.location.origin}/post/${post._id}`);
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
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString();
    }
  };

  const renderMedia = () => {
    if (!post.mediaFiles || post.mediaFiles.length === 0) {
      return null;
    }

    return (
      <div className="post-detail-media">
        {post.mediaFiles.map((media, index) => (
          <div key={index} className="media-item">
            {media.type === 'image' ? (
              <img
                src={getImageUrl(media.url)}
                alt="Post media"
                onError={handleImageError}
                className="media-image"
              />
            ) : (
              <video
                src={getImageUrl(media.url)}
                controls
                className="media-video"
                poster={media.thumbnail ? getImageUrl(media.thumbnail) : undefined}
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="post-detail-container">
        <div className="post-detail-loading">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="post-detail-container">
        <div className="post-detail-error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/feed')} className="back-btn">
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-detail-container">
        <div className="post-detail-error">
          <h2>Post Not Found</h2>
          <p>The post you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/feed')} className="back-btn">
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="post-detail-container">
      <div className="post-detail-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Back
        </button>
      </div>

      <article className="post-detail">
        <header className="post-detail-header-info">
          <div className="post-author">
            <div className="post-author-avatar">
              <img
                src={getImageUrl(post.author.profilePicture)}
                alt={post.author.fullName}
                onError={handleImageError}
              />
            </div>
            <div className="post-author-info">
              <h3 className="post-author-name">{post.author.fullName}</h3>
              <span className="post-author-username">@{post.author.username}</span>
              <span className="post-meta">
                {post.location} • {formatDate(post.createdAt)}
              </span>
            </div>
          </div>
        </header>

        {post.content && (
          <div className="post-detail-content">
            <p>{post.content}</p>
          </div>
        )}

        {renderMedia()}

        <div className="post-detail-stats">
          <div className="post-stats">
            <span className="stat-item">
              <strong>{post.views || 0}</strong> views
            </span>
            <span className="stat-item">
              <strong>{post.likesCount || 0}</strong> likes
            </span>
            <span className="stat-item">
              <strong>{post.commentsCount || 0}</strong> comments
            </span>
          </div>
        </div>

        <div className="post-detail-actions">
          <button
            className={`action-btn like-btn ${post.isLiked ? 'liked' : ''}`}
            onClick={handleLike}
            disabled={isLiking}
          >
            <span className="action-icon">{post.isLiked ? '❤️' : '🤍'}</span>
            <span className="action-text">
              {post.isLiked ? 'Liked' : 'Like'}
            </span>
          </button>

          <button className="action-btn share-btn" onClick={handleShare}>
            <span className="action-icon">📤</span>
            <span className="action-text">Share</span>
          </button>
        </div>

        <CommentSection postId={post._id} />
      </article>
    </div>
  );
};

export default PostDetail;