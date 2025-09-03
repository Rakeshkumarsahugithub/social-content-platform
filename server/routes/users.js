const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../utils/validation');

// Validation rules for profile update
const profileUpdateValidation = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('postVisibility')
    .optional()
    .isIn(['public', 'private'])
    .withMessage('Post visibility must be either public or private')
];

// @route   GET /api/users/profile/:id
// @desc    Get user profile by ID
// @access  Public (with optional auth for follow status)
router.get('/profile/:id', optionalAuth, userController.getUserProfile);

// @route   GET /api/users/profile/username/:username
// @desc    Get user profile by username
// @access  Public (with optional auth for follow status)
router.get('/profile/username/:username', optionalAuth, userController.getUserProfileByUsername);

// @route   PUT /api/users/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', 
  authenticate,
  profileUpdateValidation,
  handleValidationErrors,
  userController.updateProfile
);

// @route   POST /api/users/profile/picture
// @desc    Upload profile picture
// @access  Private
router.post('/profile/picture', 
  authenticate,
  userController.uploadProfilePicture
);

// @route   POST /api/users/follow/:id
// @desc    Follow a user
// @access  Private
router.post('/follow/:id', authenticate, userController.followUser);

// @route   DELETE /api/users/follow/:id
// @desc    Unfollow a user
// @access  Private
router.delete('/follow/:id', authenticate, userController.unfollowUser);

// @route   GET /api/users/:id/followers
// @desc    Get user followers
// @access  Public
router.get('/:id/followers', userController.getUserFollowers);

// @route   GET /api/users/:id/following
// @desc    Get user following
// @access  Public
router.get('/:id/following', userController.getUserFollowing);

// @route   GET /api/users/search
// @desc    Search users
// @access  Public
router.get('/search', userController.searchUsers);

// @route   GET /api/users/suggestions/follow
// @desc    Get follow suggestions
// @access  Private
router.get('/suggestions/follow', authenticate, userController.getFollowSuggestions);

module.exports = router;