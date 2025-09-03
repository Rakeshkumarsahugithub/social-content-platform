import React, { useEffect, useState } from 'react';
import useSocket from '../../hooks/useSocket';
import './RealTimeUpdates.css';

const RealTimeUpdates = ({ children, postId = null }) => {
  const { joinPost, leavePost } = useSocket();
  const [liveEngagement, setLiveEngagement] = useState({});
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    if (postId) {
      joinPost(postId);
      return () => leavePost(postId);
    }
  }, [postId, joinPost, leavePost]);

  useEffect(() => {
    const handleEngagementUpdate = (event) => {
      const { postId: updatedPostId, type, data } = event.detail;
      
      if (!postId || postId === updatedPostId) {
        setLiveEngagement(prev => ({
          ...prev,
          [updatedPostId]: {
            ...prev[updatedPostId],
            [type]: data
          }
        }));
      }
    };

    const handleUserTyping = (event) => {
      const { userId, username, postId: typingPostId } = event.detail;
      
      if (postId === typingPostId) {
        setTypingUsers(prev => {
          const existing = prev.find(u => u.userId === userId);
          if (!existing) {
            return [...prev, { userId, username }];
          }
          return prev;
        });
      }
    };

    const handleUserStoppedTyping = (event) => {
      const { userId, postId: typingPostId } = event.detail;
      
      if (postId === typingPostId) {
        setTypingUsers(prev => prev.filter(u => u.userId !== userId));
      }
    };

    window.addEventListener('engagementUpdate', handleEngagementUpdate);
    window.addEventListener('userTyping', handleUserTyping);
    window.addEventListener('userStoppedTyping', handleUserStoppedTyping);

    return () => {
      window.removeEventListener('engagementUpdate', handleEngagementUpdate);
      window.removeEventListener('userTyping', handleUserTyping);
      window.removeEventListener('userStoppedTyping', handleUserStoppedTyping);
    };
  }, [postId]);

  return (
    <div className="real-time-container">
      {children}
      
      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          <div className="typing-animation">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span className="typing-text">
            {typingUsers.length === 1 
              ? `${typingUsers[0].username} is typing...`
              : `${typingUsers.length} people are typing...`
            }
          </span>
        </div>
      )}
    </div>
  );
};

export default RealTimeUpdates;
