import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../components/common/FormElements.css';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get registration success message and username if coming from registration
  const registrationMessage = location.state?.message;
  const suggestedUsername = location.state?.username;

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
    
    // Pre-fill username if coming from registration
    if (suggestedUsername && !formData.identifier) {
      setFormData(prev => ({
        ...prev,
        identifier: suggestedUsername
      }));
    }
  }, [clearError, suggestedUsername]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Regular user login
    const result = await login({
      identifier: formData.identifier,
      password: formData.password
    });
    
    if (result.success) {
      // Navigate based on user role
      const userRole = result.data.data.user.role;
      if (['admin', 'manager', 'accountant'].includes(userRole)) {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  };

  return (
    <div className="auth-container" key={key}>
      <div className="auth-card">
        <div className="auth-header">
          <div className="platform-brand">
            <h1><span className="letter-e">e</span><span className="letter-m">M</span><span className="letter-ilo">ILO</span></h1>
            <span className="brand-tagline">Social Media Platform</span>
          </div>
          <p>Sign in to your account</p>
        </div>

        {registrationMessage && (
          <div className="success-message">
            <span className="success-icon">✅</span>
            {registrationMessage}
          </div>
        )}

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="identifier">Email or Username</label>
            <input
              type="text"
              id="identifier"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              required
              placeholder="Enter your email or username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link 
              to="/register" 
              className="auth-link"
              onClick={(e) => {
                console.log('Register link clicked');
                // Let React Router handle navigation
              }}
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;