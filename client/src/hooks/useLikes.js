import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

const useLikes = (initialPost) => {
  const { api } = useAuth();
  const { socket } = useSocket();
  const [isLiking, setIsLiking] = useState(false);
  const [error, setError] = useState(null);

  const toggleLike = useCallback(async (postId) => {
    if (isLiking) return null;

    setIsLiking(true);
    setError(null);

    try {
      const response = await api.put(`/posts/${postId}/like`);
      
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      setError(error.response?.data?.error?.message || 'Failed to update like');
      throw error;
    } finally {
      setIsLiking(false);
    }
  }, [api, isLiking]);

  const getLikesList = useCallback(async (postId) => {
    try {
      const response = await api.get(`/posts/${postId}/likes`);
      
      if (response.data.success) {
        return response.data.data.likes;
      }
    } catch (error) {
      console.error('Error fetching likes:', error);
      setError(error.response?.data?.error?.message || 'Failed to fetch likes');
      throw error;
    }
  }, [api]);

  return {
    toggleLike,
    getLikesList,
    isLiking,
    error
  };
};

export default useLikes;