const { User } = require('../models');
const { verifyToken, extractToken } = require('../utils/jwt');

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Access token required',
          code: 'NO_TOKEN'
        }
      });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not found or inactive',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      }
    });
  }
};

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    await authenticate(req, res, () => {
      if (!['admin', 'manager', 'accountant'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Admin access required',
            code: 'INSUFFICIENT_PERMISSIONS'
          }
        });
      }
      next();
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication failed',
        code: 'AUTH_FAILED'
      }
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: `Access denied. Required roles: ${roles.join(', ')}`,
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    next();
  };
};

// Permission-based authorization for employees
const authorizePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            code: 'NOT_AUTHENTICATED'
          }
        });
      }

      // Admin has all permissions
      if (req.user.role === 'admin') {
        return next();
      }

      // Check employee permissions
      if (['manager', 'accountant'].includes(req.user.role)) {
        const { Employee } = require('../models');
        const employee = await Employee.findOne({ 
          email: req.user.email,
          isActive: true 
        });

        if (!employee || !employee.hasPermission(permission)) {
          return res.status(403).json({
            success: false,
            error: {
              message: `Permission '${permission}' required`,
              code: 'INSUFFICIENT_PERMISSIONS'
            }
          });
        }

        req.employee = employee;
        return next();
      }

      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied',
          code: 'ACCESS_DENIED'
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Authorization check failed',
          code: 'AUTH_CHECK_FAILED'
        }
      });
    }
  };
};

// Optional authentication (for public/private content)
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('-password -refreshToken');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

module.exports = {
  authenticate,
  authenticateAdmin,
  authorize,
  authorizePermission,
  optionalAuth
};