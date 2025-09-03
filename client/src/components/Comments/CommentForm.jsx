import React, { useState } from 'react';
import './CommentForm.css';

const CommentForm = ({ onSubmit, onCancel, parentCommentId = null, placeholder = "Write a comment..." }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim(), parentCommentId);
      setContent('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <div className="comment-form-content">
        <textarea
          className="comment-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={3}
          maxLength={500}
          disabled={isSubmitting}
        />
        
        <div className="comment-form-footer">
          <div className="comment-char-count">
            <span className={content.length > 450 ? 'warning' : ''}>
              {content.length}/500
            </span>
          </div>
          
          <div className="comment-form-actions">
            {onCancel && (
              <button
                type="button"
                className="comment-btn comment-btn-cancel"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            )}
            
            <button
              type="submit"
              className="comment-btn comment-btn-submit"
              disabled={!content.trim() || isSubmitting}
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;