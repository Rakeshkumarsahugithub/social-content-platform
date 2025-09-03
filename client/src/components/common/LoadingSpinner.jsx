import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'normal', text = 'Loading...' }) => {
  if (size === 'mini') {
    return <div className="mini-spinner" />;
  }

  return (
    <div className="loading-container">
      <div className="loading-spinner">
        <div className="spinner" />
        <p>{text}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;