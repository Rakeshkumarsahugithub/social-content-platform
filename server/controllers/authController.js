const { User } = require('../models');
const { generateTokens, verifyRefreshToken, createTokenPayload } = require('../utils/jwt');
const { validationResult } = require('express-validator');

// User Registration
const register = async (req, res) => {
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

    const { fullName, email, username, password, bio, role, adminSecurityCode } = req.body;
    const profilePicture = req.file ? req.file.path.replace(/\\/g, '/').replace(/.*\/uploads\//, '/uploads/') : '';

    // Validate role
    const validRoles = ['user', 'admin'];
    const userRole = role && validRoles.includes(role) ? role : 'user';

    // If role is not 'user', validate admin security code
    if (userRole !== 'user') {
      if (!adminSecurityCode || adminSecurityCode !== process.env.ADMIN_SECURITY_CODE) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid admin security code for the selected role',
            code: 'INVALID_ADMIN_CODE'
          }
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          message: existingUser.email === email.toLowerCase() 
            ? 'Email already registered' 
            : 'Username already taken',
          code: 'USER_EXISTS'
        }
      });
    }

    // Create new user with role assignment
    const user = new User({
      fullName,
      email: email.toLowerCase(),
      username,
      password,
      bio: bio || '',
      profilePicture: profilePicture || '',
      postVisibility: 'public',
      role: userRole,
      adminSecurityCode: userRole !== 'user' ? adminSecurityCode : undefined
    });

    await user.save();

    // Generate tokens
    const tokenPayload = createTokenPayload(user);
    const { accessToken, refreshToken } = generateTokens(tokenPayload);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.getPublicProfile(),
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Registration failed',
        code: 'REGISTRATION_FAILED'
      }
    });
  }
};

// User Login
const login = async (req, res) => {
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

    const { identifier, password } = req.body;

    // Find user by email or username
    const user = await User.findByEmailOrUsername(identifier);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    // Generate tokens
    const tokenPayload = createTokenPayload(user);
    const { accessToken, refreshToken } = generateTokens(tokenPayload);

    // Update user login info
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.getPublicProfile(),
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Login failed',
        code: 'LOGIN_FAILED'
      }
    });
  }
};

// Admin Login
const adminLogin = async (req, res) => {
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

    const { identifier, password, role, adminSecurityCode } = req.body;
    
    // Debug logging
    // Admin login attempt logged

    // Validate admin security code
    if (adminSecurityCode !== process.env.ADMIN_SECURITY_CODE) {
      // Admin security code mismatch
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid admin security code',
          code: 'INVALID_SECURITY_CODE'
        }
      });
    }

    // Find user by email or username
    const user = await User.findByEmailOrUsername(identifier);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    // Check if user has sufficient permissions for the requested role
    // Allow users with admin role to access admin role only
    const validRoles = ['admin'];
    if (!validRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Invalid role requested',
          code: 'INVALID_ROLE'
        }
      });
    }

    // Check if user has the required role or higher privileges
    const hasSufficientPermissions = (user.role === 'admin');

    if (!hasSufficientPermissions) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient permissions for requested role',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    // Generate tokens
    const tokenPayload = createTokenPayload(user);
    const { accessToken, refreshToken } = generateTokens(tokenPayload);

    // Update user login info
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        user: user.getPublicProfile(),
        accessToken,
        refreshToken,
        permissions: user.role === 'admin' ? 'all' : await getUserPermissions(user)
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Admin login failed',
        code: 'ADMIN_LOGIN_FAILED'
      }
    });
  }
};

// Refresh Token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Refresh token required',
          code: 'NO_REFRESH_TOKEN'
        }
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(token);
    
    // Find user and verify refresh token
    const user = await User.findById(decoded.id);
    
    if (!user || user.refreshToken !== token || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        }
      });
    }

    // Generate new tokens
    const tokenPayload = createTokenPayload(user);
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(tokenPayload);

    // Update refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: {
        message: 'Token refresh failed',
        code: 'TOKEN_REFRESH_FAILED'
      }
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const user = req.user;
    
    // Clear refresh token
    user.refreshToken = null;
    await user.save();

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Logout failed',
        code: 'LOGOUT_FAILED'
      }
    });
  }
};

// Get Current User
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -refreshToken')
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

    res.json({
      success: true,
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get user data',
        code: 'GET_USER_FAILED'
      }
    });
  }
};

// Helper function to get user permissions
const getUserPermissions = async (user) => {
  if (user.role === 'admin') {
    return {
      createEmployee: true,
      revenueMaster: true,
      postList: true,
      payment: true
    };
  }

  // No longer supporting manager and accountant roles

  return {};
};

module.exports = {
  register,
  login,
  adminLogin,
  refreshToken,
  logout,
  getCurrentUser
};