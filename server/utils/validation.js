const { body, validationResult } = require('express-validator');

// Common validation rules
const validationRules = {
  // User validation rules
  userRegistration: [
    body('fullName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores'),
    
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio cannot exceed 500 characters')
  ],

  userLogin: [
    body('identifier')
      .trim()
      .notEmpty()
      .withMessage('Email or username is required'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  adminLogin: [
    body('identifier')
      .trim()
      .notEmpty()
      .withMessage('Email or username is required'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    
    body('role')
      .isIn(['admin', 'manager', 'accountant'])
      .withMessage('Invalid role selected'),
    
    body('adminSecurityCode')
      .notEmpty()
      .withMessage('Admin security code is required')
  ],

  // Post validation rules
  postCreation: [
    body('content')
      .optional()
      .trim()
      .isLength({ max: 280 })
      .withMessage('Post content cannot exceed 280 characters'),
    
    body('location')
      .optional()
      .isIn([
        'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
        'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
        'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri',
        'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
        'Faridabad', 'Meerut', 'Rajkot', 'Kalyan', 'Vasai', 'Varanasi'
      ])
      .withMessage('Invalid city location')
  ],

  // Comment validation rules
  commentCreation: [
    body('content')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Comment must be between 1 and 500 characters'),
    
    body('parentComment')
      .optional()
      .isMongoId()
      .withMessage('Invalid parent comment ID')
  ],

  // Employee validation rules
  employeeCreation: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    
    body('mobile')
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Please provide a valid 10-digit mobile number'),
    
    body('role')
      .isIn(['manager', 'accountant'])
      .withMessage('Role must be either manager or accountant')
  ],

  // Pricing validation rules
  pricingCreation: [
    body('city')
      .trim()
      .notEmpty()
      .withMessage('City is required'),
    
    body('pricePerView')
      .isFloat({ min: 0.01, max: 100 })
      .withMessage('Price per view must be between 0.01 and 100'),
    
    body('pricePerLike')
      .isFloat({ min: 0.01, max: 100 })
      .withMessage('Price per like must be between 0.01 and 100')
  ],

  // View tracking validation
  viewTracking: [
    body('postId')
      .isMongoId()
      .withMessage('Invalid post ID'),
    
    body('viewDuration')
      .optional()
      .isInt({ min: 0 })
      .withMessage('View duration must be a positive number'),
    
    body('scrollPercentage')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Scroll percentage must be between 0 and 100')
  ]
};

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      }
    });
  }
  
  next();
};

// Custom validation functions
const customValidations = {
  // Check if user exists
  userExists: async (value, { req }) => {
    const { User } = require('../models');
    const user = await User.findById(value);
    if (!user) {
      throw new Error('User not found');
    }
    return true;
  },

  // Check if post exists
  postExists: async (value, { req }) => {
    const { Post } = require('../models');
    const post = await Post.findById(value);
    if (!post) {
      throw new Error('Post not found');
    }
    return true;
  },

  // Check if email is unique
  emailUnique: async (value, { req }) => {
    const { User } = require('../models');
    const existingUser = await User.findOne({ 
      email: value.toLowerCase(),
      _id: { $ne: req.params.id } // Exclude current user for updates
    });
    if (existingUser) {
      throw new Error('Email already exists');
    }
    return true;
  },

  // Check if username is unique
  usernameUnique: async (value, { req }) => {
    const { User } = require('../models');
    const existingUser = await User.findOne({ 
      username: value,
      _id: { $ne: req.params.id } // Exclude current user for updates
    });
    if (existingUser) {
      throw new Error('Username already exists');
    }
    return true;
  }
};

module.exports = {
  validationRules,
  handleValidationErrors,
  customValidations
};