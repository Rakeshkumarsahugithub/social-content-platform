import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';
import './PostCreator.css';

const PostCreator = ({ onPostCreated }) => {
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    content: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const MAX_CHARS = 280;
  const MAX_FILES = 10;
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const handleContentChange = (e) => {
    const content = e.target.value;
    if (content.length <= MAX_CHARS) {
      setFormData({ content });
      setError(null);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file count
    if (selectedFiles.length + files.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    // Validate file types and sizes
    const validFiles = [];
    const newPreviews = [];

    for (const file of files) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setError(`File ${file.name} is too large. Maximum size is 50MB.`);
        continue;
      }

      // Check file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        setError(`File ${file.name} is not supported. Only images and videos are allowed.`);
        continue;
      }

      validFiles.push(file);

      // Create preview
      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          newPreviews.push({
            id: Date.now() + Math.random(),
            type: 'image',
            url: e.target.result,
            file: file,
            name: file.name
          });
          setPreviews(prev => [...prev, ...newPreviews]);
        };
        reader.readAsDataURL(file);
      } else if (isVideo) {
        const videoUrl = URL.createObjectURL(file);
        newPreviews.push({
          id: Date.now() + Math.random(),
          type: 'video',
          url: videoUrl,
          file: file,
          name: file.name
        });
        setPreviews(prev => [...prev, ...newPreviews]);
      }
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (previewId) => {
    const preview = previews.find(p => p.id === previewId);
    if (preview) {
      // Revoke object URL to prevent memory leaks
      if (preview.type === 'video') {
        URL.revokeObjectURL(preview.url);
      }
      
      setPreviews(prev => prev.filter(p => p.id !== previewId));
      setSelectedFiles(prev => prev.filter(f => f !== preview.file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.content.trim() && selectedFiles.length === 0) {
      setError('Please add some content or media to your post');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const postFormData = new FormData();
      postFormData.append('content', formData.content);
      
      // Append files
      selectedFiles.forEach((file, index) => {
        postFormData.append('mediaFiles', file);
      });

      const response = await api.post('/posts', postFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Clear form
      setFormData({ content: '' });
      setSelectedFiles([]);
      setPreviews([]);
      
      // Clean up object URLs
      previews.forEach(preview => {
        if (preview.type === 'video') {
          URL.revokeObjectURL(preview.url);
        }
      });

      // Notify parent component or redirect to feed
      if (onPostCreated) {
        onPostCreated(response.data.data.post);
      }
      
      // Always redirect to feed page (/feed) after successful post creation
      console.log('Post created successfully, redirecting to feed...');
      navigate('/feed', { replace: true });

    } catch (error) {
      setError(error.response?.data?.error?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const remainingChars = MAX_CHARS - formData.content.length;

  return (
    <div className="post-creator">
      <div className="post-creator-header">
        <div className="post-creator-user-avatar">
          <img 
            src={getImageUrl(user?.profilePicture) || '/api/placeholder/40/40'} 
            alt={user?.fullName}
            onError={handleImageError}
          />
        </div>
        <div className="user-info">
          <span className="user-name">{user?.fullName}</span>
          <span className="user-username">@{user?.username}</span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="post-form">
        <div className="content-section">
          <textarea
            value={formData.content}
            onChange={handleContentChange}
            placeholder="What's happening?"
            className="content-textarea"
            rows={3}
          />
          <div className="char-counter">
            <span className={`counter-text ${
              remainingChars < 0 ? 'error' : 
              remainingChars < 20 ? 'warning' : 
              remainingChars < 50 ? 'caution' : ''
            }`}>
              {remainingChars < 0 ? `${Math.abs(remainingChars)} characters over limit` : `${remainingChars} characters remaining`}
            </span>
            <div className={`progress-bar ${
              remainingChars < 0 ? 'error' : 
              remainingChars < 20 ? 'warning' : 
              remainingChars < 50 ? 'caution' : ''
            }`}>
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${Math.min(100, ((MAX_CHARS - remainingChars) / MAX_CHARS) * 100)}%` 
                }}
              ></div>
            </div>
          </div>
        </div>

        {previews.length > 0 && (
          <div className="media-previews">
            {previews.map((preview) => (
              <div key={preview.id} className="media-preview">
                <button
                  type="button"
                  onClick={() => removeFile(preview.id)}
                  className="remove-media-btn"
                >
                  ×
                </button>
                {preview.type === 'image' ? (
                  <img src={preview.url} alt={preview.name} />
                ) : (
                  <video controls>
                    <source src={preview.url} type={preview.file.type} />
                    Your browser does not support the video tag.
                  </video>
                )}
                <div className="media-info">
                  <span className="media-name">{preview.name}</span>
                  <span className="media-type">{preview.type}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="post-actions">
          <div className="media-actions">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept="image/*,video/*"
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="media-btn"
              disabled={selectedFiles.length >= MAX_FILES}
            >
              📷 Add Media ({selectedFiles.length}/{MAX_FILES})
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || (remainingChars < 0) || (!formData.content.trim() && selectedFiles.length === 0)}
            className="post-btn"
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostCreator;