import React, { useState, useEffect } from 'react';
import './FormValidation.css';

export const ValidatedInput = ({ 
  type = 'text', 
  name, 
  value, 
  onChange, 
  placeholder, 
  required = false,
  validation = {},
  className = '',
  ...props 
}) => {
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  const validateField = (val) => {
    if (required && (!val || val.trim() === '')) {
      return 'This field is required';
    }

    if (validation.minLength && val.length < validation.minLength) {
      return `Minimum ${validation.minLength} characters required`;
    }

    if (validation.maxLength && val.length > validation.maxLength) {
      return `Maximum ${validation.maxLength} characters allowed`;
    }

    if (validation.pattern && !validation.pattern.test(val)) {
      return validation.message || 'Invalid format';
    }

    if (type === 'email' && val) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        return 'Please enter a valid email address';
      }
    }

    if (type === 'password' && val) {
      if (val.length < 8) {
        return 'Password must be at least 8 characters';
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(val)) {
        return 'Password must contain uppercase, lowercase, and number';
      }
    }

    return '';
  };

  useEffect(() => {
    if (touched) {
      const errorMsg = validateField(value);
      setError(errorMsg);
    }
  }, [value, touched]);

  const handleBlur = () => {
    setTouched(true);
    const errorMsg = validateField(value);
    setError(errorMsg);
  };

  const isValid = !error && touched && value;
  const hasError = error && touched;

  return (
    <div className={`validated-input-container ${className}`}>
      <div className="input-wrapper">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`validated-input ${hasError ? 'error' : ''} ${isValid ? 'valid' : ''}`}
          {...props}
        />
        {isValid && <span className="validation-icon success">✓</span>}
        {hasError && <span className="validation-icon error">✗</span>}
      </div>
      {hasError && <div className="error-message">{error}</div>}
    </div>
  );
};

export const ValidatedTextarea = ({ 
  name, 
  value, 
  onChange, 
  placeholder, 
  required = false,
  validation = {},
  className = '',
  rows = 4,
  ...props 
}) => {
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  const validateField = (val) => {
    if (required && (!val || val.trim() === '')) {
      return 'This field is required';
    }

    if (validation.minLength && val.length < validation.minLength) {
      return `Minimum ${validation.minLength} characters required`;
    }

    if (validation.maxLength && val.length > validation.maxLength) {
      return `Maximum ${validation.maxLength} characters allowed`;
    }

    return '';
  };

  useEffect(() => {
    if (touched) {
      const errorMsg = validateField(value);
      setError(errorMsg);
    }
  }, [value, touched]);

  const handleBlur = () => {
    setTouched(true);
    const errorMsg = validateField(value);
    setError(errorMsg);
  };

  const isValid = !error && touched && value;
  const hasError = error && touched;

  return (
    <div className={`validated-input-container ${className}`}>
      <div className="input-wrapper">
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          rows={rows}
          className={`validated-textarea ${hasError ? 'error' : ''} ${isValid ? 'valid' : ''}`}
          {...props}
        />
        {isValid && <span className="validation-icon success textarea-icon">✓</span>}
        {hasError && <span className="validation-icon error textarea-icon">✗</span>}
      </div>
      {hasError && <div className="error-message">{error}</div>}
      {validation.maxLength && (
        <div className="character-count">
          {value.length}/{validation.maxLength}
        </div>
      )}
    </div>
  );
};

export const FormButton = ({ 
  type = 'button', 
  variant = 'primary', 
  loading = false, 
  disabled = false,
  children,
  className = '',
  ...props 
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`form-button ${variant} ${loading ? 'loading' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <span className="button-spinner"></span>
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default { ValidatedInput, ValidatedTextarea, FormButton };
