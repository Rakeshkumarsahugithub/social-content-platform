import React, { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';
import SkeletonLoader from './SkeletonLoader';
import './InfiniteScroll.css';

const LoadMoreScroll = ({ 
  fetchFunction, 
  renderItem, 
  skeletonType = 'post',
  skeletonCount = 3,
  emptyMessage = 'No items found',
  emptyIcon = '📭',
  className = '',
  initialLoad = true,
  loadMoreThreshold = 10 // Show load more button every N items
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);

  // Initial load
  useEffect(() => {
    if (initialLoad) {
      loadInitialData();
    }
  }, [initialLoad]);

  const loadInitialData = useCallback(async () => {
    try {
      setInitialLoading(true);
      setError(null);
      
      const response = await fetchFunction(1, loadMoreThreshold);
      const newData = response.data || [];
      
      setData(newData);
      setHasMore(response.hasMore !== false && newData.length === loadMoreThreshold);
      setPage(2);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setInitialLoading(false);
    }
  }, [fetchFunction, loadMoreThreshold]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchFunction(page, loadMoreThreshold);
      const newData = response.data || [];
      
      setData(prevData => {
        // Remove duplicates based on _id
        const existingIds = new Set(prevData.map(item => item._id));
        const uniqueNewData = newData.filter(item => !existingIds.has(item._id));
        return [...prevData, ...uniqueNewData];
      });

      setHasMore(response.hasMore !== false && newData.length === loadMoreThreshold);
      setPage(prevPage => prevPage + 1);
    } catch (err) {
      setError(err.message || 'Failed to load more data');
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, page, loadMoreThreshold, loading, hasMore]);

  const refresh = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    loadInitialData();
  }, [loadInitialData]);

  const handleRetry = () => {
    if (data.length === 0) {
      refresh();
    } else {
      loadMore();
    }
  };

  if (error && data.length === 0) {
    return (
      <div className="infinite-scroll-error">
        <div className="error-content">
          <span className="error-icon">⚠️</span>
          <h3>Failed to load content</h3>
          <p>{error}</p>
          <button onClick={handleRetry} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (data.length === 0 && !initialLoading) {
    return (
      <div className="infinite-scroll-empty">
        <span className="empty-icon">{emptyIcon}</span>
        <h3>Nothing here yet</h3>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`infinite-scroll-container ${className}`}>
      {initialLoading ? (
        <div className="infinite-scroll-loading">
          <SkeletonLoader type={skeletonType} count={skeletonCount} />
        </div>
      ) : (
        <>
          <div className="infinite-scroll-content">
            {data.map((item, index) => (
              <div
                key={item._id || index}
                className="infinite-scroll-item"
              >
                {renderItem(item, index)}
              </div>
            ))}
          </div>

          {/* Show load more button if we have data and there's more to load */}
          {data.length > 0 && hasMore && (
            <div className="load-more-container">
              <button 
                className="load-more-button"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="mini" />
                    <span>Loading more posts...</span>
                  </>
                ) : (
                  <>
                    <span>Load More Posts</span>
                    <span className="load-more-icon">↓</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error state for load more */}
          {error && data.length > 0 && (
            <div className="infinite-scroll-load-error">
              <p>Failed to load more items</p>
              <button onClick={handleRetry} className="retry-button small">
                Retry
              </button>
            </div>
          )}

          {/* End of content */}
          {!hasMore && data.length > 0 && (
            <div className="infinite-scroll-end">
              <span className="end-icon">🎉</span>
              <p>You've reached the end!</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LoadMoreScroll;
