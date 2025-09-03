import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../components/common/FormElements.css';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
    role: 'user',
    adminSecurityCode: ''
  });
  const [showAdminFields, setShowAdminFields] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const fileInputRef = useRef(null);
  
  const { register, isAuthenticated, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Force re-render on route change
  const [key, setKey] = useState(0);
  useEffect(() => {
    setKey(prev => prev + 1);
  }, [location.pathname]);

  const from = location.state?.from?.pathname || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Clear errors when component mounts or route changes
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Show admin fields when non-user role is selected
    if (name === 'role') {
      setShowAdminFields(value !== 'user');
      if (value === 'user') {
        setFormData(prev => ({
          ...prev,
          adminSecurityCode: ''
        }));
      }
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setProfilePicture(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    // Create FormData for file upload
    const registrationData = new FormData();
    registrationData.append('fullName', formData.fullName);
    registrationData.append('username', formData.username);
    registrationData.append('email', formData.email);
    registrationData.append('password', formData.password);
    registrationData.append('bio', formData.bio);
    registrationData.append('role', formData.role);
    
    if (formData.role !== 'user' && formData.adminSecurityCode) {
      registrationData.append('adminSecurityCode', formData.adminSecurityCode);
    }
    
    if (profilePicture) {
      registrationData.append('profilePicture', profilePicture);
    }

    const result = await register(registrationData);
    
    if (result.success) {
      // Redirect to login page after successful registration
      navigate('/login', { 
        replace: true, 
        state: { 
          message: 'Registration successful! Please sign in to continue.',
          username: formData.username || formData.email
        } 
      });
    }
  };

  return (
    <div className="auth-container" key={key}>
      <div className="auth-card">
        <div className="auth-header">
          <div className="platform-brand">
            <h1><span className="letter-e">e</span><span className="letter-m">M</span><span className="letter-ilo">ILO</span></h1>
            <span className="brand-tagline">SOCIAL MEDIA PLATFORM</span>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Profile Picture Section */}
          <div className="profile-picture-section">
            <label className="profile-picture-label">Profile Picture (Optional)</label>
            <div className="profile-picture-upload">
              <div className="profile-picture-preview">
                {profilePicturePreview ? (
                  <img src={profilePicturePreview} alt="Profile preview" />
                ) : (
                  <div className="upload-placeholder">
                    <span className="camera-icon">📷</span>
                    <span>Upload</span>
                  </div>
                )}
              </div>
              <button 
                type="button" 
                className="choose-photo-btn"
                onClick={handleFileSelect}
              >
                Choose Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Form Fields in Two Columns */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fullName">Full Name *</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">Username *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Choose a username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Create a password"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Account Type *</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {showAdminFields && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="adminSecurityCode">Admin Security Code *</label>
                <input
                  type="password"
                  id="adminSecurityCode"
                  name="adminSecurityCode"
                  value={formData.adminSecurityCode}
                  onChange={handleChange}
                  required
                  placeholder="Enter admin security code"
                />
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio (Optional)</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself"
                  rows="1"
                />
              </div>
            </div>
          )}

          {!showAdminFields && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bio">Bio (Optional)</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself"
                  rows="1"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="auth-button create-account-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="auth-link"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;