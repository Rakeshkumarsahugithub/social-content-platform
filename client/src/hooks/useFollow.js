import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

const useFollow = () => {
  const { api } = useAuth();
  const { socket } = useSocket();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const followUser = useCallback(async (userId) => {
    if (loading) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await api.post(`/users/follow/${userId}`);
      
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Error following user:', error);
      setError(error.response?.data?.error?.message || 'Failed to follow user');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [api, loading]);

  const unfollowUser = useCallback(async (userId) => {
    if (loading) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await api.delete(`/users/follow/${userId}`);
      
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
      setError(error.response?.data?.error?.message || 'Failed to unfollow user');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [api, loading]);

  const toggleFollow = useCallback(async (userId, isCurrentlyFollowing) => {
    if (isCurrentlyFollowing) {
      return await unfollowUser(userId);
    } else {
      return await followUser(userId);
    }
  }, [followUser, unfollowUser]);

  const getFollowers = useCallback(async (userId, page = 1) => {
    try {
      const response = await api.get(`/users/${userId}/followers?page=${page}`);
      
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
      setError(error.response?.data?.error?.message || 'Failed to fetch followers');
      throw error;
    }
  }, [api]);

  const getFollowing = useCallback(async (userId, page = 1) => {
    try {
      const response = await api.get(`/users/${userId}/following?page=${page}`);
      
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Error fetching following:', error);
      setError(error.response?.data?.error?.message || 'Failed to fetch following');
      throw error;
    }
  }, [api]);

  const getFollowSuggestions = useCallback(async (limit = 10) => {
    try {
      const response = await api.get(`/users/suggestions/follow?limit=${limit}`);
      
      if (response.data.success) {
        return response.data.data.suggestions;
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setError(error.response?.data?.error?.message || 'Failed to fetch suggestions');
      throw error;
    }
  }, [api]);

  return {
    followUser,
    unfollowUser,
    toggleFollow,
    getFollowers,
    getFollowing,
    getFollowSuggestions,
    loading,
    error
  };
};

export default useFollow;