const { User, Post } = require('../models');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/profiles');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Get user profile by ID
const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    const user = await User.findById(id)
      .select('-password -refreshToken -adminSecurityCode')
      .populate('followers', 'fullName username profilePicture')
      .populate('following', 'fullName username profilePicture');

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    // Get user's posts count
    const postsCount = await Post.countDocuments({ 
      author: id, 
      isActive: true 
    });

    // Check if current user follows this user
    const isFollowing = currentUserId ? 
      user.followers.some(follower => follower._id.toString() === currentUserId) : 
      false;

    // Check if this user follows current user back
    const followsBack = currentUserId ? 
      user.following.some(following => following._id.toString() === currentUserId) : 
      false;

    // Get recent posts (public or if following for private users)
    let recentPosts = [];
    const canViewPosts = user.postVisibility === 'public' || 
                        isFollowing || 
                        currentUserId === id;

    if (canViewPosts) {
      recentPosts = await Post.find({ 
        author: id, 
        isActive: true,
        visibility: user.postVisibility === 'private' && !isFollowing && currentUserId !== id 
          ? 'public' 
          : { $in: ['public', 'private'] }
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('author', 'fullName username profilePicture')
      .select('content mediaFiles location views likesCount commentsCount createdAt');
    }

    const profileData = {
      ...user.toObject(),
      postsCount,
      isFollowing,
      followsBack,
      canViewPosts,
      recentPosts,
      isOwnProfile: currentUserId === id
    };

    res.json({
      success: true,
      data: {
        user: profileData
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get user profile',
        code: 'GET_PROFILE_FAILED'
      }
    });
  }
};

// Get user profile by username
const getUserProfileByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user?.id;

    const user = await User.findOne({ username, isActive: true })
      .select('-password -refreshToken -adminSecurityCode')
      .populate('followers', 'fullName username profilePicture')
      .populate('following', 'fullName username profilePicture');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    // Get user's posts count
    const postsCount = await Post.countDocuments({ 
      author: user._id, 
      isActive: true 
    });

    // Check if current user follows this user
    const isFollowing = currentUserId ? 
      user.followers.some(follower => follower._id.toString() === currentUserId) : 
      false;

    // Check if this user follows current user back
    const followsBack = currentUserId ? 
      user.following.some(following => following._id.toString() === currentUserId) : 
      false;

    // Get recent posts (public or if following for private users)
    let recentPosts = [];
    const canViewPosts = user.postVisibility === 'public' || 
                        isFollowing || 
                        currentUserId === user._id.toString();

    if (canViewPosts) {
      recentPosts = await Post.find({ 
        author: user._id, 
        isActive: true,
        visibility: user.postVisibility === 'private' && !isFollowing && currentUserId !== user._id.toString() 
          ? 'public' 
          : { $in: ['public', 'private'] }
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('author', 'fullName username profilePicture')
      .select('content mediaFiles location views likesCount commentsCount createdAt');
    }

    const profileData = {
      ...user.toObject(),
      postsCount,
      isFollowing,
      followsBack,
      canViewPosts,
      recentPosts,
      isOwnProfile: currentUserId === user._id.toString()
    };

    res.json({
      success: true,
      data: {
        user: profileData
      }
    });
  } catch (error) {
    console.error('Get user profile by username error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get user profile',
        code: 'GET_PROFILE_FAILED'
      }
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
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

    const userId = req.user.id;
    const { fullName, bio, postVisibility } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    // Update fields
    if (fullName !== undefined) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (postVisibility !== undefined) user.postVisibility = postVisibility;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update profile',
        code: 'UPDATE_PROFILE_FAILED'
      }
    });
  }
};

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No image file provided',
          code: 'NO_FILE'
        }
      });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    // Delete old profile picture if exists
    if (user.profilePicture) {
      try {
        const oldImagePath = path.join(__dirname, '../uploads/profiles', path.basename(user.profilePicture));
        await fs.unlink(oldImagePath);
      } catch (error) {
        console.log('Old profile picture not found or already deleted');
      }
    }

    // Update user with new profile picture URL
    const filename = req.file.filename;
    const profilePictureUrl = `/uploads/profiles/${filename}`;
    
    // Update user with the new URL
    user.profilePicture = profilePictureUrl;
    await user.save();
    
    // Ensure the file was saved correctly
    const fullPath = path.join(__dirname, '../uploads/profiles', filename);
    try {
      await fs.access(fullPath);
    } catch (err) {
      console.error('Profile picture file not found after save:', fullPath);
      throw new Error('Failed to save profile picture');
    }

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      data: {
        profilePicture: profilePictureUrl,
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to upload profile picture',
        code: 'UPLOAD_FAILED'
      }
    });
  }
};

// Follow user
const followUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    if (id === currentUserId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cannot follow yourself',
          code: 'CANNOT_FOLLOW_SELF'
        }
      });
    }

    const [userToFollow, currentUser] = await Promise.all([
      User.findById(id),
      User.findById(currentUserId)
    ]);

    if (!userToFollow || !userToFollow.isActive) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    // Check if already following
    const isAlreadyFollowing = currentUser.following.includes(id);
    
    if (isAlreadyFollowing) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Already following this user',
          code: 'ALREADY_FOLLOWING'
        }
      });
    }

    // Add to following/followers
    currentUser.following.push(id);
    userToFollow.followers.push(currentUserId);

    // Update counts
    currentUser.followingCount = currentUser.following.length;
    userToFollow.followersCount = userToFollow.followers.length;

    await Promise.all([
      currentUser.save(),
      userToFollow.save()
    ]);

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(id).emit('follow_notification', {
        type: 'follow',
        from: {
          id: currentUserId,
          fullName: currentUser.fullName,
          username: currentUser.username,
          profilePicture: currentUser.profilePicture
        },
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'User followed successfully',
      data: {
        isFollowing: true,
        followersCount: userToFollow.followersCount,
        followingCount: currentUser.followingCount
      }
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to follow user',
        code: 'FOLLOW_FAILED'
      }
    });
  }
};

// Unfollow user
const unfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    const [userToUnfollow, currentUser] = await Promise.all([
      User.findById(id),
      User.findById(currentUserId)
    ]);

    if (!userToUnfollow || !userToUnfollow.isActive) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    // Check if actually following
    const isFollowing = currentUser.following.includes(id);
    
    if (!isFollowing) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Not following this user',
          code: 'NOT_FOLLOWING'
        }
      });
    }

    // Remove from following/followers
    currentUser.following = currentUser.following.filter(
      followingId => followingId.toString() !== id
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      followerId => followerId.toString() !== currentUserId
    );

    // Update counts
    currentUser.followingCount = currentUser.following.length;
    userToUnfollow.followersCount = userToUnfollow.followers.length;

    await Promise.all([
      currentUser.save(),
      userToUnfollow.save()
    ]);

    res.json({
      success: true,
      message: 'User unfollowed successfully',
      data: {
        isFollowing: false,
        followersCount: userToUnfollow.followersCount,
        followingCount: currentUser.followingCount
      }
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to unfollow user',
        code: 'UNFOLLOW_FAILED'
      }
    });
  }
};

// Get user followers
const getUserFollowers = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(id)
      .populate({
        path: 'followers',
        select: 'fullName username profilePicture bio followersCount',
        options: {
          skip: (page - 1) * limit,
          limit: parseInt(limit)
        }
      });

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    const totalFollowers = user.followersCount;
    const totalPages = Math.ceil(totalFollowers / limit);

    res.json({
      success: true,
      data: {
        followers: user.followers,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: totalFollowers,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get followers',
        code: 'GET_FOLLOWERS_FAILED'
      }
    });
  }
};

// Get user following
const getUserFollowing = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(id)
      .populate({
        path: 'following',
        select: 'fullName username profilePicture bio followersCount',
        options: {
          skip: (page - 1) * limit,
          limit: parseInt(limit)
        }
      });

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    const totalFollowing = user.followingCount;
    const totalPages = Math.ceil(totalFollowing / limit);

    res.json({
      success: true,
      data: {
        following: user.following,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: totalFollowing,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get following',
        code: 'GET_FOLLOWING_FAILED'
      }
    });
  }
};

// Search users
const searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    // If no query provided, return empty results instead of error
    if (!q || q.trim().length === 0) {
      return res.json({
        success: true,
        data: {
          users: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0,
            hasNext: false,
            hasPrev: false
          }
        }
      });
    }

    if (q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Search query must be at least 2 characters',
          code: 'INVALID_QUERY'
        }
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const skip = (page - 1) * limit;

    const users = await User.find({
      $and: [
        { isActive: true },
        { role: { $in: ['user', 'admin'] } }, // Include both user and admin roles
        {
          $or: [
            { fullName: searchRegex },
            { username: searchRegex },
            { bio: searchRegex }
          ]
        }
      ]
    })
    .select('fullName username profilePicture bio followersCount')
    .sort({ followersCount: -1, fullName: 1 })
    .skip(skip)
    .limit(parseInt(limit));

    const totalUsers = await User.countDocuments({
      $and: [
        { isActive: true },
        { role: { $in: ['user', 'admin'] } }, // Include both user and admin roles
        {
          $or: [
            { fullName: searchRegex },
            { username: searchRegex },
            { bio: searchRegex }
          ]
        }
      ]
    });

    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: totalUsers,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to search users',
        code: 'SEARCH_FAILED'
      }
    });
  }
};

// Get follow suggestions
const getFollowSuggestions = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const currentUser = await User.findById(currentUserId)
      .populate('following', '_id');

    const followingIds = currentUser.following.map(user => user._id);
    followingIds.push(currentUserId); // Exclude self

    // First, get total count for pagination
    const totalCount = await User.countDocuments({
      _id: { $nin: followingIds },
      isActive: true,
      role: { $in: ['user', 'admin'] }
    });

    // Find users followed by people you follow (mutual connections)
    const suggestions = await User.aggregate([
      // Match users that current user's following are following
      {
        $match: {
          _id: { $nin: followingIds },
          isActive: true,
          // Include both user and admin roles
          role: { $in: ['user', 'admin'] }
        }
      },
      // Add field for mutual connections count
      {
        $addFields: {
          mutualConnections: {
            $size: {
              $setIntersection: ['$followers', followingIds.slice(0, -1)] // Exclude self
            }
          }
        }
      },
      // Sort by mutual connections and followers count
      {
        $sort: {
          mutualConnections: -1,
          followersCount: -1,
          createdAt: -1
        }
      },
      // Skip for pagination
      { $skip: skip },
      // Limit results
      { $limit: parseInt(limit) },
      // Project only needed fields
      {
        $project: {
          fullName: 1,
          username: 1,
          profilePicture: 1,
          bio: 1,
          followersCount: 1,
          mutualConnections: 1
        }
      }
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      data: {
        suggestions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          total: totalCount,
          limit: parseInt(limit),
          hasMore: parseInt(page) < totalPages
        }
      }
    });
  } catch (error) {
    console.error('Get follow suggestions error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get follow suggestions',
        code: 'SUGGESTIONS_FAILED'
      }
    });
  }
};

module.exports = {
  getUserProfile,
  getUserProfileByUsername,
  updateProfile,
  uploadProfilePicture: [upload.single('profilePicture'), uploadProfilePicture],
  followUser,
  unfollowUser,
  getUserFollowers,
  getUserFollowing,
  searchUsers,
  getFollowSuggestions
};