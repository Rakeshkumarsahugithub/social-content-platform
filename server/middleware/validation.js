const { body, param, query, validationResult } = require('express-validator');

// Custom validation functions
const isValidObjectId = (value) => {
  return /^[0-9a-fA-F]{24}$/.test(value);
};

const isValidUsername = (value) => {
  return /^[a-zA-Z0-9_]{3,20}$/.test(value);
};

const isValidPassword = (value) => {
  return value.length >= 8 && 
         /(?=.*[a-z])/.test(value) && 
         /(?=.*[A-Z])/.test(value) && 
         /(?=.*\d)/.test(value);
};

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: errors.array()
      }
    });
  }
  next();
};

// User validation rules
const userValidation = {
  register: [
    body('fullName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Full name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Full name can only contain letters and spaces'),
    
    body('username')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Username must be between 3 and 20 characters')
      .custom(isValidUsername)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    
    body('password')
      .custom(isValidPassword)
      .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
    
    body('mobile')
      .optional()
      .isMobilePhone('en-IN')
      .withMessage('Please provide a valid Indian mobile number'),
    
    body('city')
      .trim()
      .isLength({ min: 2, max: 30 })
      .withMessage('City must be between 2 and 30 characters'),
    
    handleValidationErrors
  ],

  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    
    handleValidationErrors
  ],

  updateProfile: [
    body('fullName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Full name must be between 2 and 50 characters'),
    
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 160 })
      .withMessage('Bio cannot exceed 160 characters'),
    
    body('mobile')
      .optional()
      .isMobilePhone('en-IN')
      .withMessage('Please provide a valid Indian mobile number'),
    
    body('city')
      .optional()
      .trim()
      .isLength({ min: 2, max: 30 })
      .withMessage('City must be between 2 and 30 characters'),
    
    handleValidationErrors
  ]
};

// Post validation rules
const postValidation = {
  create: [
    body('content')
      .optional()
      .trim()
      .isLength({ max: 2200 })
      .withMessage('Content cannot exceed 2200 characters'),
    
    body('location')
      .trim()
      .isLength({ min: 2, max: 30 })
      .withMessage('Location must be between 2 and 30 characters')
      .matches(/^[a-zA-Z\s,.-]+$/)
      .withMessage('Location contains invalid characters'),
    
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    
    body('tags.*')
      .optional()
      .trim()
      .isLength({ min: 1, max: 20 })
      .withMessage('Each tag must be between 1 and 20 characters'),
    
    handleValidationErrors
  ],

  update: [
    param('id')
      .custom(isValidObjectId)
      .withMessage('Invalid post ID'),
    
    body('content')
      .optional()
      .trim()
      .isLength({ max: 2200 })
      .withMessage('Content cannot exceed 2200 characters'),
    
    handleValidationErrors
  ]
};

// Comment validation rules
const commentValidation = {
  create: [
    param('postId')
      .custom(isValidObjectId)
      .withMessage('Invalid post ID'),
    
    body('content')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Comment must be between 1 and 500 characters'),
    
    handleValidationErrors
  ]
};

// Admin validation rules
const adminValidation = {
  createEmployee: [
    body('fullName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Full name must be between 2 and 50 characters'),
    
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    
    body('mobile')
      .isMobilePhone('en-IN')
      .withMessage('Please provide a valid Indian mobile number'),
    
    body('role')
      .isIn(['admin', 'manager', 'accountant'])
      .withMessage('Invalid role'),
    
    handleValidationErrors
  ],

  updatePricing: [
    body('city')
      .trim()
      .isLength({ min: 2, max: 30 })
      .withMessage('City must be between 2 and 30 characters'),
    
    body('pricePerView')
      .isFloat({ min: 0.01, max: 100 })
      .withMessage('Price per view must be between 0.01 and 100'),
    
    body('pricePerLike')
      .isFloat({ min: 0.01, max: 100 })
      .withMessage('Price per like must be between 0.01 and 100'),
    
    body('tier')
      .isIn(['tier1', 'tier2', 'tier3'])
      .withMessage('Invalid tier'),
    
    handleValidationErrors
  ]
};

// Search validation
const searchValidation = {
  users: [
    query('q')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Search query must be between 1 and 50 characters')
      .escape(),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    
    handleValidationErrors
  ]
};

// File upload validation
const fileValidation = {
  profilePicture: (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No file uploaded' }
      });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Only JPEG, PNG, and WebP images are allowed' }
      });
    }

    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: { message: 'File size cannot exceed 5MB' }
      });
    }

    next();
  },

  postMedia: (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm', 'video/quicktime'
    ];
    const maxSize = 50 * 1024 * 1024; // 50MB
    const maxFiles = 5;

    if (req.files.length > maxFiles) {
      return res.status(400).json({
        success: false,
        error: { message: `Maximum ${maxFiles} files allowed` }
      });
    }

    for (const file of req.files) {
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid file type. Only images and videos are allowed' }
        });
      }

      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          error: { message: 'File size cannot exceed 50MB' }
        });
      }
    }

    next();
  }
};

module.exports = {
  userValidation,
  postValidation,
  commentValidation,
  adminValidation,
  searchValidation,
  fileValidation,
  handleValidationErrors
};
