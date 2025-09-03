const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const User = require('../models/User');
const Pricing = require('../models/Pricing');
const Post = require('../models/Post');
const { authenticate, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin role required.' 
    });
  }
  next();
};

// Get all employees
router.get('/employees', authenticate, requireAdmin, async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      employees
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees'
    });
  }
});

// Create new employee
router.post('/employees', [
  authenticate,
  requireAdmin,
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
    .withMessage('Please provide a valid 10-digit mobile number starting with 6-9'),
  body('role')
    .isIn(['manager', 'accountant'])
    .withMessage('Role must be either manager or accountant')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, mobile, role } = req.body;

    // Check if employee with email already exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email already exists'
      });
    }

    // Check if user with email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new employee
    const employee = new Employee({
      name,
      email,
      mobile,
      role,
      createdBy: req.user.id
    });

    await employee.save();

    // Populate the createdBy field for response
    await employee.populate('createdBy', 'fullName email');

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      employee
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create employee'
    });
  }
});

// Toggle employee status (activate/deactivate)
router.patch('/employees/:id/toggle-status', authenticate, requireAdmin, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    employee.isActive = !employee.isActive;
    await employee.save();

    res.json({
      success: true,
      message: `Employee ${employee.isActive ? 'activated' : 'deactivated'} successfully`,
      employee
    });
  } catch (error) {
    console.error('Error toggling employee status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update employee status'
    });
  }
});

// Get employee by ID
router.get('/employees/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('createdBy', 'fullName email');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      employee
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee'
    });
  }
});

// Update employee
router.put('/employees/:id', [
  authenticate,
  requireAdmin,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('mobile')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit mobile number starting with 6-9'),
  body('role')
    .optional()
    .isIn(['manager', 'accountant'])
    .withMessage('Role must be either manager or accountant')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, mobile, role } = req.body;
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== employee.email) {
      const existingEmployee = await Employee.findOne({ 
        email, 
        _id: { $ne: req.params.id } 
      });
      
      if (existingEmployee) {
        return res.status(400).json({
          success: false,
          message: 'Employee with this email already exists'
        });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
    }

    // Update employee fields
    if (name) employee.name = name;
    if (email) employee.email = email;
    if (mobile) employee.mobile = mobile;
    if (role) employee.role = role;

    await employee.save();
    await employee.populate('createdBy', 'fullName email');

    res.json({
      success: true,
      message: 'Employee updated successfully',
      employee
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update employee'
    });
  }
});

// Delete employee (soft delete by setting isActive to false)
router.delete('/employees/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    employee.isActive = false;
    await employee.save();

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete employee'
    });
  }
});

// Get employee statistics
router.get('/employees/stats/overview', authenticate, requireAdmin, async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ isActive: true });
    const managerCount = await Employee.countDocuments({ role: 'manager', isActive: true });
    const accountantCount = await Employee.countDocuments({ role: 'accountant', isActive: true });

    const recentEmployees = await Employee.find({ isActive: true })
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        total: totalEmployees,
        active: activeEmployees,
        inactive: totalEmployees - activeEmployees,
        managers: managerCount,
        accountants: accountantCount,
        recent: recentEmployees
      }
    });
  } catch (error) {
    console.error('Error fetching employee stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee statistics'
    });
  }
});

// Middleware to check admin or manager role for pricing management
const requireAdminOrManager = (req, res, next) => {
  if (!['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin or Manager role required.' 
    });
  }
  next();
};

// PRICING MANAGEMENT ROUTES

// Get all pricing configurations
router.get('/pricing', authenticate, requireAdminOrManager, async (req, res) => {
  try {
    const pricing = await Pricing.find()
      .populate('createdBy', 'fullName email')
      .populate('updatedBy', 'fullName email')
      .sort({ tier: 1, city: 1 });

    res.json({
      success: true,
      data: {
        pricing
      }
    });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch pricing configurations',
        code: 'FETCH_PRICING_FAILED'
      }
    });
  }
});

// Get active pricing configurations
router.get('/pricing/active', authenticate, requireAdminOrManager, async (req, res) => {
  try {
    const activePricing = await Pricing.getAllActivePricing();

    res.json({
      success: true,
      data: {
        pricing: activePricing
      }
    });
  } catch (error) {
    console.error('Error fetching active pricing:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch active pricing',
        code: 'FETCH_ACTIVE_PRICING_FAILED'
      }
    });
  }
});

// Create or update pricing for a city
router.post('/pricing', [
  authenticate,
  requireAdminOrManager,
  body('city')
    .notEmpty()
    .withMessage('City is required')
    .isIn([
      'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
      'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
      'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri',
      'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
      'Faridabad', 'Meerut', 'Rajkot', 'Kalyan', 'Vasai', 'Varanasi',
      'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai',
      'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur'
    ])
    .withMessage('Invalid city selected'),
  body('pricePerView')
    .isFloat({ min: 0.01, max: 100 })
    .withMessage('Price per view must be between 0.01 and 100'),
  body('pricePerLike')
    .isFloat({ min: 0.01, max: 100 })
    .withMessage('Price per like must be between 0.01 and 100')
], async (req, res) => {
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

    const { city, pricePerView, pricePerLike } = req.body;

    // Check if pricing already exists for this city
    let pricing = await Pricing.findOne({ city });

    if (pricing) {
      // Update existing pricing
      pricing.pricePerView = pricePerView;
      pricing.pricePerLike = pricePerLike;
      pricing.updatedBy = req.user.id;
      pricing.effectiveFrom = new Date();
    } else {
      // Create new pricing
      pricing = new Pricing({
        city,
        pricePerView,
        pricePerLike,
        createdBy: req.user.id
      });
    }

    await pricing.save();
    await pricing.populate([
      { path: 'createdBy', select: 'fullName email' },
      { path: 'updatedBy', select: 'fullName email' }
    ]);

    res.json({
      success: true,
      message: `Pricing ${pricing.isNew ? 'created' : 'updated'} successfully for ${city}`,
      data: {
        pricing
      }
    });
  } catch (error) {
    console.error('Error creating/updating pricing:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to save pricing configuration',
        code: 'SAVE_PRICING_FAILED'
      }
    });
  }
});

// Update specific pricing
router.put('/pricing/:id', [
  authenticate,
  requireAdminOrManager,
  body('pricePerView')
    .optional()
    .isFloat({ min: 0.01, max: 100 })
    .withMessage('Price per view must be between 0.01 and 100'),
  body('pricePerLike')
    .optional()
    .isFloat({ min: 0.01, max: 100 })
    .withMessage('Price per like must be between 0.01 and 100')
], async (req, res) => {
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

    const { pricePerView, pricePerLike } = req.body;
    const pricing = await Pricing.findById(req.params.id);

    if (!pricing) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Pricing configuration not found',
          code: 'PRICING_NOT_FOUND'
        }
      });
    }

    // Update pricing
    if (pricePerView !== undefined) pricing.pricePerView = pricePerView;
    if (pricePerLike !== undefined) pricing.pricePerLike = pricePerLike;
    pricing.updatedBy = req.user.id;
    pricing.effectiveFrom = new Date();

    await pricing.save();
    await pricing.populate([
      { path: 'createdBy', select: 'fullName email' },
      { path: 'updatedBy', select: 'fullName email' }
    ]);

    res.json({
      success: true,
      message: `Pricing updated successfully for ${pricing.city}`,
      data: {
        pricing
      }
    });
  } catch (error) {
    console.error('Error updating pricing:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update pricing configuration',
        code: 'UPDATE_PRICING_FAILED'
      }
    });
  }
});

// Initialize default pricing for all cities
router.post('/pricing/initialize', authenticate, requireAdmin, async (req, res) => {
  try {
    await Pricing.initializeDefaultPricing(req.user.id);

    res.json({
      success: true,
      message: 'Default pricing initialized for all cities'
    });
  } catch (error) {
    console.error('Error initializing pricing:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to initialize default pricing',
        code: 'INIT_PRICING_FAILED'
      }
    });
  }
});

// Delete pricing configuration
router.delete('/pricing/:id', authenticate, requireAdminOrManager, async (req, res) => {
  try {
    const pricing = await Pricing.findById(req.params.id);

    if (!pricing) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Pricing configuration not found',
          code: 'PRICING_NOT_FOUND'
        }
      });
    }

    await Pricing.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: `Pricing configuration for ${pricing.city} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting pricing:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete pricing configuration',
        code: 'DELETE_PRICING_FAILED'
      }
    });
  }
});

// Get pricing statistics
router.get('/pricing/stats', authenticate, requireAdminOrManager, async (req, res) => {
  try {
    const totalCities = await Pricing.countDocuments();
    const activePricing = await Pricing.countDocuments({ isActive: true });
    const tier1Count = await Pricing.countDocuments({ tier: 'tier1', isActive: true });
    const tier2Count = await Pricing.countDocuments({ tier: 'tier2', isActive: true });
    const tier3Count = await Pricing.countDocuments({ tier: 'tier3', isActive: true });

    // Get average pricing by tier
    const tierStats = await Pricing.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$tier',
          avgPricePerView: { $avg: '$pricePerView' },
          avgPricePerLike: { $avg: '$pricePerLike' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalCities,
          activePricing,
          inactivePricing: totalCities - activePricing,
          byTier: {
            tier1: tier1Count,
            tier2: tier2Count,
            tier3: tier3Count
          },
          tierAverages: tierStats
        }
      }
    });
  } catch (error) {
    console.error('Error fetching pricing stats:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch pricing statistics',
        code: 'FETCH_PRICING_STATS_FAILED'
      }
    });
  }
});

// POST MANAGEMENT AND APPROVAL ROUTES

// Get all posts for admin/manager review
router.get('/posts', authenticate, requireAdminOrManager, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all', city } = req.query;
    const skip = (page - 1) * limit;

    // Build filter query
    let filter = { isActive: true };
    
    if (status === 'pending') {
      filter.approved = false;
      filter.paid = false;
    } else if (status === 'approved') {
      filter.approved = true;
      filter.paid = false;
    } else if (status === 'paid') {
      filter.paid = true;
    }

    if (city && city !== 'all') {
      filter.location = city;
    }

    const posts = await Post.find(filter)
      .populate('author', 'fullName username profilePicture')
      .populate('approvedBy', 'fullName username')
      .populate('paidBy', 'fullName username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate revenue for each post
    for (let post of posts) {
      await post.calculateRevenue();
    }

    const totalPosts = await Post.countDocuments(filter);
    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: totalPosts,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch posts',
        code: 'FETCH_POSTS_FAILED'
      }
    });
  }
});

// Approve a post
router.patch('/posts/:id/approve', authenticate, requireAdminOrManager, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'fullName username');

    if (!post) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Post not found',
          code: 'POST_NOT_FOUND'
        }
      });
    }

    if (post.approved) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Post is already approved',
          code: 'ALREADY_APPROVED'
        }
      });
    }

    // Approve the post
    post.approved = true;
    post.approvedBy = req.user.id;
    post.approvedAt = new Date();

    // Calculate revenue
    await post.calculateRevenue();
    await post.save();

    // Populate the approvedBy field for response
    await post.populate('approvedBy', 'fullName username');

    // Emit real-time notification to user
    const io = req.app.get('io');
    io.to(post.author._id.toString()).emit('post_approved', {
      type: 'post_approved',
      post: {
        id: post._id,
        content: post.content.substring(0, 50) + '...',
        totalRevenue: post.totalRevenue
      },
      approvedBy: {
        fullName: req.user.fullName,
        username: req.user.username
      },
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Post approved successfully',
      data: {
        post
      }
    });
  } catch (error) {
    console.error('Error approving post:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to approve post',
        code: 'APPROVE_POST_FAILED'
      }
    });
  }
});

// Reject a post
router.patch('/posts/:id/reject', authenticate, requireAdminOrManager, async (req, res) => {
  try {
    const { reason } = req.body;
    const post = await Post.findById(req.params.id)
      .populate('author', 'fullName username');

    if (!post) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Post not found',
          code: 'POST_NOT_FOUND'
        }
      });
    }

    if (post.approved) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cannot reject an approved post',
          code: 'CANNOT_REJECT_APPROVED'
        }
      });
    }

    // Soft delete the post
    post.isActive = false;
    post.rejectedBy = req.user.id;
    post.rejectedAt = new Date();
    post.rejectionReason = reason || 'No reason provided';

    await post.save();

    // Emit real-time notification to user
    const io = req.app.get('io');
    io.to(post.author._id.toString()).emit('post_rejected', {
      type: 'post_rejected',
      post: {
        id: post._id,
        content: post.content.substring(0, 50) + '...'
      },
      reason: post.rejectionReason,
      rejectedBy: {
        fullName: req.user.fullName,
        username: req.user.username
      },
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Post rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting post:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to reject post',
        code: 'REJECT_POST_FAILED'
      }
    });
  }
});

// Get post analytics and statistics
router.get('/posts/analytics', authenticate, requireAdminOrManager, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const [
      totalPosts,
      pendingPosts,
      approvedPosts,
      paidPosts,
      totalRevenue,
      topCities,
      recentActivity
    ] = await Promise.all([
      Post.countDocuments({ isActive: true, createdAt: { $gte: startDate } }),
      Post.countDocuments({ isActive: true, approved: false, createdAt: { $gte: startDate } }),
      Post.countDocuments({ isActive: true, approved: true, paid: false, createdAt: { $gte: startDate } }),
      Post.countDocuments({ isActive: true, paid: true, createdAt: { $gte: startDate } }),
      
      // Total revenue calculation
      Post.aggregate([
        { $match: { isActive: true, approved: true, createdAt: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: '$totalRevenue' } } }
      ]),

      // Top cities by post count
      Post.aggregate([
        { $match: { isActive: true, createdAt: { $gte: startDate } } },
        { $group: { _id: '$location', count: { $sum: 1 }, revenue: { $sum: '$totalRevenue' } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // Recent activity
      Post.find({ isActive: true, createdAt: { $gte: startDate } })
        .populate('author', 'fullName username')
        .sort({ createdAt: -1 })
        .limit(10)
        .select('content author location approved paid totalRevenue createdAt')
    ]);

    res.json({
      success: true,
      data: {
        analytics: {
          overview: {
            totalPosts,
            pendingPosts,
            approvedPosts,
            paidPosts,
            totalRevenue: totalRevenue[0]?.total || 0
          },
          topCities,
          recentActivity,
          timeframe
        }
      }
    });
  } catch (error) {
    console.error('Error fetching post analytics:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch post analytics',
        code: 'FETCH_ANALYTICS_FAILED'
      }
    });
  }
});

// PAYMENT PROCESSING ROUTES

// Get approved posts ready for payment (for accountants)
router.get('/payments/pending', authenticate, async (req, res) => {
  try {
    // Check if user has payment permission
    if (req.user.role === 'user') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. Payment permission required.',
          code: 'ACCESS_DENIED'
        }
      });
    }

    const { page = 1, limit = 20, city } = req.query;
    const skip = (page - 1) * limit;

    let filter = { 
      isActive: true, 
      approved: true, 
      paid: false 
    };

    if (city && city !== 'all') {
      filter.location = city;
    }

    const posts = await Post.find(filter)
      .populate('author', 'fullName username profilePicture email')
      .populate('approvedBy', 'fullName username')
      .sort({ approvedAt: 1 }) // Oldest approved first
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate revenue for each post
    for (let post of posts) {
      await post.calculateRevenue();
    }

    const totalPosts = await Post.countDocuments(filter);
    const totalPages = Math.ceil(totalPosts / limit);

    // Calculate total pending payment amount
    const totalPendingRevenue = posts.reduce((sum, post) => sum + post.totalRevenue, 0);

    res.json({
      success: true,
      data: {
        posts,
        totalPendingRevenue,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: totalPosts,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch pending payments',
        code: 'FETCH_PAYMENTS_FAILED'
      }
    });
  }
});

// Process payment for a post
router.patch('/payments/:id/pay', authenticate, async (req, res) => {
  try {
    // Check if user has payment permission
    if (req.user.role === 'user') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. Payment permission required.',
          code: 'ACCESS_DENIED'
        }
      });
    }

    const post = await Post.findById(req.params.id)
      .populate('author', 'fullName username email');

    if (!post) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Post not found',
          code: 'POST_NOT_FOUND'
        }
      });
    }

    if (!post.approved) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Post must be approved before payment',
          code: 'NOT_APPROVED'
        }
      });
    }

    if (post.paid) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Post has already been paid',
          code: 'ALREADY_PAID'
        }
      });
    }

    // Process payment
    post.paid = true;
    post.paidBy = req.user.id;
    post.paidAt = new Date();

    // Ensure revenue is calculated
    await post.calculateRevenue();
    await post.save();

    // Populate the paidBy field for response
    await post.populate('paidBy', 'fullName username');

    // Emit real-time notification to user
    const io = req.app.get('io');
    io.to(post.author._id.toString()).emit('payment_processed', {
      type: 'payment_processed',
      post: {
        id: post._id,
        content: post.content.substring(0, 50) + '...',
        totalRevenue: post.totalRevenue
      },
      paidBy: {
        fullName: req.user.fullName,
        username: req.user.username
      },
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        post,
        paidAmount: post.totalRevenue
      }
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to process payment',
        code: 'PAYMENT_FAILED'
      }
    });
  }
});

// Get payment history and statistics
router.get('/payments/history', authenticate, async (req, res) => {
  try {
    // Check if user has payment permission
    if (req.user.role === 'user') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. Payment permission required.',
          code: 'ACCESS_DENIED'
        }
      });
    }

    const { page = 1, limit = 20, timeframe = '30d' } = req.query;
    const skip = (page - 1) * limit;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const paidPosts = await Post.find({
      isActive: true,
      paid: true,
      paidAt: { $gte: startDate }
    })
    .populate('author', 'fullName username profilePicture email')
    .populate('paidBy', 'fullName username')
    .sort({ paidAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const totalPaidPosts = await Post.countDocuments({
      isActive: true,
      paid: true,
      paidAt: { $gte: startDate }
    });

    const totalPages = Math.ceil(totalPaidPosts / limit);

    // Calculate payment statistics
    const paymentStats = await Post.aggregate([
      {
        $match: {
          isActive: true,
          paid: true,
          paidAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalRevenue' },
          totalPosts: { $sum: 1 },
          avgAmount: { $avg: '$totalRevenue' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        payments: paidPosts,
        statistics: paymentStats[0] || { totalAmount: 0, totalPosts: 0, avgAmount: 0 },
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: totalPaidPosts,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch payment history',
        code: 'FETCH_HISTORY_FAILED'
      }
    });
  }
});

// Update user role (admin only)
router.patch('/users/:id/role', [
  authenticate,
  requireAdmin,
  body('role')
    .isIn(['user', 'admin', 'manager', 'accountant'])
    .withMessage('Invalid role')
], async (req, res) => {
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

    const { role } = req.body;
    const userId = req.params.id;

    // Don't allow changing own role
    if (userId === req.user.id && role !== req.user.role) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cannot change your own role',
          code: 'CANNOT_CHANGE_OWN_ROLE'
        }
      });
    }

    // Find user to update
    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    // If changing to admin/manager/accountant, require security code
    if (['admin', 'manager', 'accountant'].includes(role) && !userToUpdate.adminSecurityCode) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'User must have admin security code for elevated roles',
          code: 'MISSING_SECURITY_CODE'
        }
      });
    }

    // Update user role
    userToUpdate.role = role;
    await userToUpdate.save();

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      data: {
        user: userToUpdate.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update user role',
        code: 'UPDATE_ROLE_FAILED'
      }
    });
  }
});

module.exports = router;