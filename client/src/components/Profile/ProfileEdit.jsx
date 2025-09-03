import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';
import '../common/FormElements.css';
import './ProfileEdit.css';

const ProfileEdit = ({ user, onSave, onCancel }) => {
  const { api } = useAuth();
  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    bio: user.bio || '',
    postVisibility: user.postVisibility || 'public'
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(getImageUrl(user.profilePicture) || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setProfilePicture(file);
      
      // Create a blob URL for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Update profile data
      const profileResponse = await api.put('/users/profile', formData);
      let updatedUser = profileResponse.data.data.user;

      // Upload profile picture if selected
      if (profilePicture) {
        const formDataPicture = new FormData();
        formDataPicture.append('profilePicture', profilePicture);

        const pictureResponse = await api.post('/users/profile/picture', formDataPicture, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        updatedUser = {
          ...updatedUser,
          profilePicture: pictureResponse.data.data.profilePicture
        };
      }

      onSave(updatedUser);
    } catch (error) {
      setError(error.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-edit-overlay">
      <div className="profile-edit-modal">
        <div className="profile-edit-header">
          <h2>Edit Profile</h2>
          <button onClick={onCancel} className="close-btn">×</button>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-edit-form">
          <div className="profile-picture-section">
            <div className="profile-edit-picture-container">
              <img 
                src={previewUrl || getImageUrl(user?.profilePicture) || '/api/placeholder/120/120'} 
                alt="Profile preview"
                className="profile-edit-preview-img"
                onError={(e) => {
                  e.target.src = '/api/placeholder/120/120';
                }}
              />
            </div>
            <div className="picture-upload">
              <label htmlFor="profilePicture" className="upload-btn">
                Change Picture
              </label>
              <input
                type="file"
                id="profilePicture"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <small className="upload-hint">
                JPEG, PNG, GIF, or WebP. Max 5MB.
              </small>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={4}
              maxLength={500}
              placeholder="Tell us about yourself..."
            />
            <small className="char-count">
              {formData.bio.length}/500 characters
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="postVisibility">Default Post Visibility</label>
            <select
              id="postVisibility"
              name="postVisibility"
              value={formData.postVisibility}
              onChange={handleInputChange}
            >
              <option value="public">🌍 Public - Anyone can see your posts</option>
              <option value="private">🔒 Private - Only followers can see your posts</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="save-btn">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEdit;