const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validationRules, handleValidationErrors } = require('../utils/validation');
const { uploadSingle } = require('../middleware/upload');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', 
  uploadSingle,
  validationRules.userRegistration,
  handleValidationErrors,
  authController.register
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login',
  validationRules.userLogin,
  handleValidationErrors,
  authController.login
);

// @route   POST /api/auth/admin-login
// @desc    Admin/Manager/Accountant login
// @access  Public
router.post('/admin-login',
  validationRules.adminLogin,
  handleValidationErrors,
  authController.adminLogin
);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', authController.refreshToken);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticate, authController.logout);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;