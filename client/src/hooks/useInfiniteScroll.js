import { useState, useEffect, useCallback, useRef } from 'react';

const useInfiniteScroll = (fetchFunction, initialPage = 1, pageSize = 10) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(initialPage);
  const observerRef = useRef();

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchFunction(page, pageSize);
      const newData = response.data || [];
      
      setData(prevData => {
        // Remove duplicates based on _id
        const existingIds = new Set(prevData.map(item => item._id));
        const uniqueNewData = newData.filter(item => !existingIds.has(item._id));
        return [...prevData, ...uniqueNewData];
      });

      setHasMore(newData.length === pageSize);
      setPage(prevPage => prevPage + 1);
    } catch (err) {
      setError(err.message || 'Failed to load more data');
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, page, pageSize, loading, hasMore]);

  const reset = useCallback(() => {
    setData([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
    setLoading(false);
  }, [initialPage]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setPage(initialPage);
      
      const response = await fetchFunction(initialPage, pageSize);
      const newData = response.data || [];
      
      setData(newData);
      setHasMore(newData.length === pageSize);
      setPage(initialPage + 1);
    } catch (err) {
      setError(err.message || 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, initialPage, pageSize]);

  // Intersection Observer for automatic loading
  const lastElementRef = useCallback(node => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    }, {
      threshold: 0.1,
      rootMargin: '100px'
    });
    
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore, loadMore]);

  // Initial load
  useEffect(() => {
    if (data.length === 0 && !loading) {
      loadMore();
    }
  }, []);

  return {
    data,
    loading,
    hasMore,
    error,
    loadMore,
    reset,
    refresh,
    lastElementRef
  };
};

export default useInfiniteScroll;
