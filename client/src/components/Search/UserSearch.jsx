import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';
import './UserSearch.css';

const UserSearch = ({ showHeader = true, initialQuery = '' }) => {
  const { api } = useAuth();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (query.trim().length >= 2) {
      timeoutRef.current = setTimeout(() => {
        searchUsers(query.trim());
      }, 300);
    } else {
      setResults([]);
      setShowResults(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query]);

  const searchUsers = async (searchQuery) => {
    try {
      setLoading(true);
      const response = await api.get(`/users/search?q=${encodeURIComponent(searchQuery)}&limit=8`);
      setResults(response.data.data.users);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleResultClick = () => {
    setShowResults(false);
    setQuery('');
  };

  const handleInputFocus = () => {
    if (results.length > 0) {
      setShowResults(true);
    }
  };

  return (
    <div className="user-search" ref={searchRef}>
      {showHeader && (
        <div className="search-header">
          <h2>Search Users</h2>
        </div>
      )}
      
      <div className="search-input-container">
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className="search-input"
        />
        <span className="search-icon">🔍</span>
      </div>

      {showResults && (
        <div className="search-results">
          {loading ? (
            <div className="search-loading">
              <div className="mini-spinner"></div>
              <span>Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="results-list">
              {results.map(user => (
                <Link
                  key={user._id}
                  to={`/profile/${user.username}`}
                  className="search-result-item"
                  onClick={handleResultClick}
                >
                  <div className="result-avatar">
                    <img 
                      src={getImageUrl(user.profilePicture) || '/api/placeholder/40/40'} 
                      alt={user.fullName}
                      onError={handleImageError}
                    />
                  </div>
                  <div className="result-info">
                    <div className="result-name">{user.fullName}</div>
                    <div className="result-username">@{user.username}</div>
                    {user.bio && (
                      <div className="result-bio">{user.bio.substring(0, 50)}...</div>
                    )}
                  </div>
                  <div className="result-stats">
                    <span className="follower-count">{user.followersCount} followers</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="no-results">
              <span className="no-results-icon">🔍</span>
              <span>No users found for "{query}"</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default UserSearch;