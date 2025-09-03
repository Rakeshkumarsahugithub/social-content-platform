import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';
import api from '../../services/api';
import './CommentSection.css';

const CommentSection = ({ postId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false
  });
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch comments
  const fetchComments = async (page = 1, append = false) => {
    try {
      const response = await api.get(`/posts/${postId}/comments?page=${page}&limit=${pagination.limit}`);
      
      if (response.data.success) {
        const newComments = response.data.data.comments;
        
        if (append) {
          setComments(prev => [...prev, ...newComments]);
        } else {
          setComments(newComments);
        }
        
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load initial comments
  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  // Add new comment
  const handleAddComment = async (content) => {
    if (!user) {
      setError('Please login to comment');
      return;
    }

    try {
      const response = await api.post(`/posts/${postId}/comments`, {
        content
      });

      if (response.data.success) {
        const newComment = response.data.data.comment;
        // Ensure the new comment has the correct structure
        const formattedComment = {
          ...newComment,
          replies: newComment.replies || [],
          repliesCount: newComment.repliesCount || 0
        };
        setComments(prev => [formattedComment, ...prev]);
        setPagination(prev => ({
          ...prev,
          total: prev.total + 1
        }));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment. Please try again.');
      throw error;
    }
  };

  // Add reply to comment
  const handleAddReply = async (content, parentCommentId) => {
    if (!user) {
      setError('Please login to reply');
      return;
    }

    try {
      const response = await api.post(`/posts/${postId}/comments`, {
        content,
        parentComment: parentCommentId
      });

      if (response.data.success) {
        const newReply = response.data.data.comment;
        
        // Update the parent comment with the new reply
        setComments(prev => prev.map(comment => {
          if (comment._id === parentCommentId) {
            // Ensure the new reply has the correct structure
            const formattedReply = {
              ...newReply,
              replies: newReply.replies || [],
              repliesCount: newReply.repliesCount || 0
            };
            
            return {
              ...comment,
              replies: [...(comment.replies || []), formattedReply],
              repliesCount: (comment.repliesCount || 0) + 1
            };
          }
          return comment;
        }));
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      setError('Failed to add reply. Please try again.');
      throw error;
    }
  };

  // Update a single comment after edit
  const handleCommentUpdated = (updated) => {
    setComments(prev => prev.map(c => {
      if (c._id === updated._id) {
        return { ...c, ...updated };
      }
      if (c.replies && c.replies.length) {
        return {
          ...c,
          replies: c.replies.map(r => (r._id === updated._id ? { ...r, ...updated } : r))
        };
      }
      return c;
    }));
  };

  // Remove a comment locally after delete
  const handleCommentDeleted = (deletedId, parentId) => {
    if (!parentId) {
      setComments(prev => prev.filter(c => c._id !== deletedId));
    } else {
      setComments(prev => prev.map(c => (
        c._id === parentId
          ? { ...c, replies: (c.replies || []).filter(r => r._id !== deletedId), repliesCount: Math.max(0, (c.repliesCount || 1) - 1) }
          : c
      )));
    }
    setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
  };

  // Load more comments
  const handleLoadMore = () => {
    if (pagination.hasMore && !loadingMore) {
      setLoadingMore(true);
      fetchComments(pagination.page + 1, true);
    }
  };

  if (loading) {
    return (
      <div className="comment-section">
        <div className="comment-section-header">
          <h3>Comments</h3>
        </div>
        <div className="comment-loading">
          <div className="comment-skeleton">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="comment-skeleton-item">
                <div className="comment-skeleton-avatar"></div>
                <div className="comment-skeleton-content">
                  <div className="comment-skeleton-header"></div>
                  <div className="comment-skeleton-text"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="comment-section">
      <div className="comment-section-header">
        <h3>Comments ({pagination.total})</h3>
      </div>

      {error && (
        <div className="comment-error">
          <p>{error}</p>
          <button 
            className="retry-btn"
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchComments();
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {user && (
        <div className="comment-section-form">
          <CommentForm
            onSubmit={handleAddComment}
            placeholder="Write a comment..."
          />
        </div>
      )}

      <div className="comment-list">
        {comments.length === 0 ? (
          <div className="no-comments">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <>
            {comments.map((comment, index) => (
              <CommentItem
                key={`${comment._id}-${index}`}
                comment={comment}
                onReply={handleAddReply}
                onUpdated={handleCommentUpdated}
                onDeleted={handleCommentDeleted}
                level={0}
                index={index}
              />
            ))}
            
            {pagination.hasMore && (
              <div className="load-more-comments">
                <button
                  className="load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load More Comments'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CommentSection;