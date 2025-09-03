import React from 'react';
import { useNavigate } from 'react-router-dom';
import PostCreator from '../components/Post/PostCreator';
import './Create.css';

const Create = () => {
  const navigate = useNavigate();

  const handlePostCreated = (newPost) => {
    console.log('Post created successfully:', newPost);
    // Navigate to feed page after post creation
    navigate('/feed', { replace: true, state: { refresh: true } });
  };

  return (
    <div className="create-container">
      <div className="create-header">
        <h1>Create New Post</h1>
        <p>Share your thoughts, photos, and videos with the community.</p>
      </div>
      
      <div className="create-content">
        <PostCreator onPostCreated={handlePostCreated} />
        
        <div className="create-tips">
          <h3>💡 Tips for Great Posts</h3>
          <ul>
            <li>Keep your content engaging and authentic</li>
            <li>Use relevant hashtags to reach more people</li>
            <li>Add high-quality images or videos to get more engagement</li>
            <li>Videos are automatically trimmed to 1 minute for optimal viewing</li>
            <li>Stay within the 280 character limit for text content</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Create;