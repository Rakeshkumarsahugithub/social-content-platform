import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import CommentForm from './CommentForm';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';
import './CommentItem.css';

const CommentItem = ({ comment, onReply, level = 0, index = 0, onUpdated, onDeleted }) => {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

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

  const handleReply = async (content) => {
    try {
      await onReply(content, comment._id);
      setShowReplyForm(false);
      setShowReplies(true);
    } catch (error) {
      throw error;
    }
  };

  const handleCancelReply = () => {
    setShowReplyForm(false);
  };

  const toggleReplies = () => {
    setShowReplies(!showReplies);
  };

  // Check if comment data is valid
  if (!comment) {
    return null;
  }

  const maxLevel = 3; // Maximum nesting level
  const hasReplies = comment.replies && comment.replies.length > 0;
  const isOwner = user && comment.author && (comment.author._id === user.id || comment.author.id === user.id);
  // Safely get author name
  const authorName = comment.author ? comment.author.fullName || 'Unknown User' : 'Unknown User';

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    try {
      // Ensure we have the correct post ID and comment ID
      const postId = comment.post;
      const commentId = comment._id;
      
      if (!postId || !commentId) {
        console.error('Missing post ID or comment ID', { post: comment.post, commentId: comment._id });
        return;
      }
      
      console.log(`Editing comment with postId: ${postId}, commentId: ${commentId}`);
      const res = await api.put(`/posts/${postId}/comments/${commentId}`, { content: editContent.trim() });
      if (res.data.success) {
        setIsEditing(false);
        if (onUpdated) onUpdated(res.data.data.comment);
      }
    } catch (e) {
      console.error('Edit comment failed', e);
      // Show error to user
      alert('Failed to edit comment. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      // Ensure we have the correct post ID and comment ID
      const postId = comment.post;
      const commentId = comment._id;
      
      if (!postId || !commentId) {
        console.error('Missing post ID or comment ID', { post: comment.post, commentId: comment._id });
        return;
      }
      
      console.log(`Deleting comment with postId: ${postId}, commentId: ${commentId}`);
      const res = await api.delete(`/posts/${postId}/comments/${commentId}`);
      if (res.data.success) {
        if (onDeleted) onDeleted(commentId, comment.parentComment || null);
      }
    } catch (e) {
      console.error('Delete comment failed', e);
      // Show error to user
      alert('Failed to delete comment. Please try again.');
    }
  };

  return (
    <div className={`comment-item ${level > 0 ? 'reply' : ''}`} style={{ marginLeft: `${level * 20}px` }}>
      <div className="comment-content">
        <div className="comment-header">
          {comment.author ? (
            <Link to={`/profile/${comment.author.username}`} className="comment-author">
              <div className="comment-avatar">
                <img 
                  src={getImageUrl(comment.author.profilePicture)} 
                  alt={comment.author.fullName}
                  onError={handleImageError}
                />
              </div>
              <div className="comment-author-info">
                <span className="comment-author-name">{comment.author.fullName}</span>
                <span className="comment-author-username">@{comment.author.username}</span>
              </div>
            </Link>
          ) : (
            <div className="comment-author">
              <div className="comment-avatar">
                <img 
                  src="/api/placeholder/40/40" 
                  alt="Unknown user"
                  onError={handleImageError}
                />
              </div>
              <div className="comment-author-info">
                <span className="comment-author-name">Unknown User</span>
                <span className="comment-author-username">@unknown</span>
              </div>
            </div>
          )}
          <span className="comment-time">{formatDate(comment.createdAt)}</span>
        </div>

        <div className="comment-text">
          {isEditing ? (
            <div className="comment-edit-form">
              <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} />
              <div className="comment-edit-actions">
                <button onClick={handleEdit}>Save</button>
                <button onClick={() => { setIsEditing(false); setEditContent(comment.content); }}>Cancel</button>
              </div>
            </div>
          ) : (
            <p>{comment.content}</p>
          )}
        </div>

        <div className="comment-actions">
          {level < maxLevel && (
            <button 
              className="reply-btn"
              onClick={() => setShowReplyForm(!showReplyForm)}
            >
              💬 Reply
            </button>
          )}
          
          {hasReplies && (
            <button 
              className="toggle-replies-btn"
              onClick={toggleReplies}
            >
              {showReplies ? '▼' : '▶'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </button>
          )}

          {isOwner && !isEditing && (
            <>
              <button className="edit-btn" onClick={() => setIsEditing(true)}>✏️ Edit</button>
              <button className="delete-btn" onClick={handleDelete}>🗑️ Delete</button>
            </>
          )}
        </div>

        {showReplyForm && (
          <CommentForm 
            onSubmit={handleReply}
            onCancel={handleCancelReply}
            parentCommentId={comment._id}
            placeholder={`Reply to ${authorName}...`}
          />
        )}
      </div>

      {hasReplies && showReplies && (
        <div className="comment-replies">
          {comment.replies.map((reply, replyIndex) => (
            <CommentItem 
              key={`${reply._id}-${index}-${replyIndex}`} 
              comment={reply}
              onReply={onReply}
              level={level + 1}
              index={replyIndex}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;