import { useState, useEffect } from 'react';
import useSocket from './useSocket';

const useRealTimeEngagement = (postId, initialData = {}) => {
  const [engagement, setEngagement] = useState({
    likes: initialData.likesCount || 0,
    comments: initialData.commentsCount || 0,
    views: initialData.views || 0,
    isLiked: initialData.isLiked || false,
    ...initialData
  });

  const { socket } = useSocket();

  useEffect(() => {
    const handleEngagementUpdate = (event) => {
      const { postId: updatedPostId, type, data } = event.detail;
      
      if (postId === updatedPostId) {
        setEngagement(prev => {
          switch (type) {
            case 'like':
              return {
                ...prev,
                likes: data.likesCount,
                isLiked: data.isLiked
              };
            case 'comment':
              return {
                ...prev,
                comments: data.commentsCount
              };
            case 'view':
              return {
                ...prev,
                views: data.views
              };
            default:
              return prev;
          }
        });
      }
    };

    window.addEventListener('engagementUpdate', handleEngagementUpdate);
    
    return () => {
      window.removeEventListener('engagementUpdate', handleEngagementUpdate);
    };
  }, [postId]);

  const updateEngagement = (type, data) => {
    setEngagement(prev => ({
      ...prev,
      ...data
    }));
  };

  return {
    engagement,
    updateEngagement
  };
};

export default useRealTimeEngagement;
