import React, { useEffect, useRef } from 'react';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import LoadingSpinner from './LoadingSpinner';
import SkeletonLoader from './SkeletonLoader';
import './InfiniteScroll.css';

const InfiniteScroll = ({ 
  fetchFunction, 
  renderItem, 
  skeletonType = 'post',
  skeletonCount = 3,
  emptyMessage = 'No items found',
  emptyIcon = '📭',
  className = '',
  initialLoad = true
}) => {
  const {
    data,
    loading,
    hasMore,
    error,
    loadMore,
    refresh,
    lastElementRef
  } = useInfiniteScroll(fetchFunction);

  const containerRef = useRef();

  useEffect(() => {
    if (initialLoad && data.length === 0 && !loading) {
      loadMore();
    }
  }, [initialLoad, data.length, loading, loadMore]);

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

  if (data.length === 0 && !loading) {
    return (
      <div className="infinite-scroll-empty">
        <span className="empty-icon">{emptyIcon}</span>
        <h3>Nothing here yet</h3>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`infinite-scroll-container ${className}`} ref={containerRef}>
      <div className="infinite-scroll-content">
        {data.map((item, index) => {
          const isLast = index === data.length - 1;
          return (
            <div
              key={item._id || index}
              ref={isLast ? lastElementRef : null}
              className="infinite-scroll-item"
            >
              {renderItem(item, index)}
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="infinite-scroll-loading">
          {data.length === 0 ? (
            <SkeletonLoader type={skeletonType} count={skeletonCount} />
          ) : (
            <LoadingSpinner size="mini" text="Loading more..." />
          )}
        </div>
      )}

      {error && data.length > 0 && (
        <div className="infinite-scroll-load-error">
          <p>Failed to load more items</p>
          <button onClick={handleRetry} className="retry-button small">
            Retry
          </button>
        </div>
      )}

      {!hasMore && data.length > 0 && (
        <div className="infinite-scroll-end">
          <span className="end-icon">🎉</span>
          <p>You've reached the end!</p>
        </div>
      )}
    </div>
  );
};

export default InfiniteScroll;
