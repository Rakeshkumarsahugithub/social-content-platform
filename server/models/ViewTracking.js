const mongoose = require('mongoose');

const viewTrackingSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  sessionId: {
    type: String,
    required: false,
    default: function() {
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  },
  viewDuration: {
    type: Number, // in milliseconds
    default: 0
  },
  scrollPercentage: {
    type: Number, // percentage of post viewed
    min: 0,
    max: 100,
    default: 0
  },
  isBot: {
    type: Boolean,
    default: false
  },
  botScore: {
    type: Number, // 0-100, higher means more likely to be bot
    default: 0
  },
  deviceInfo: {
    type: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown'
    },
    os: String,
    browser: String,
    screenResolution: String
  },
  referrer: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isValidView: {
    type: Boolean,
    default: true
  },
  viewSource: {
    type: String,
    enum: ['feed', 'profile', 'direct', 'search'],
    default: 'feed'
  }
}, {
  timestamps: true
});

// Indexes for performance and analytics
viewTrackingSchema.index({ post: 1, user: 1 });
viewTrackingSchema.index({ post: 1, timestamp: -1 });
viewTrackingSchema.index({ user: 1, timestamp: -1 });
viewTrackingSchema.index({ ipAddress: 1, timestamp: -1 });
viewTrackingSchema.index({ isBot: 1 });
viewTrackingSchema.index({ isValidView: 1 });
viewTrackingSchema.index({ timestamp: -1 });

// Compound index for bot detection queries
viewTrackingSchema.index({ 
  ipAddress: 1, 
  userAgent: 1, 
  timestamp: -1 
});

// TTL index to automatically delete old tracking data (90 days)
viewTrackingSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

// Static method for bot detection
viewTrackingSchema.statics.detectBot = function(ipAddress, userAgent, userId) {
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /facebook/i, /twitter/i, /linkedin/i,
    /curl/i, /wget/i, /python/i, /java/i,
    /phantom/i, /selenium/i, /headless/i
  ];
  
  let botScore = 0;
  
  // Check user agent for bot patterns
  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) {
      botScore += 30;
      break;
    }
  }
  
  // Check for suspicious user agent characteristics
  if (userAgent.length < 20) botScore += 20;
  if (!userAgent.includes('Mozilla')) botScore += 15;
  if (userAgent.includes('compatible') && !userAgent.includes('MSIE')) botScore += 10;
  
  return {
    isBot: botScore >= 50,
    botScore
  };
};

// Static method to check for rapid successive views (bot behavior)
viewTrackingSchema.statics.checkRapidViews = async function(userId, ipAddress, timeWindow = 60000) {
  const recentViews = await this.countDocuments({
    $or: [
      { user: userId },
      { ipAddress }
    ],
    timestamp: {
      $gte: new Date(Date.now() - timeWindow)
    }
  });
  
  return recentViews > 10; // More than 10 views per minute is suspicious
};

// Static method to get view analytics for a post
viewTrackingSchema.statics.getPostAnalytics = async function(postId) {
  const analytics = await this.aggregate([
    { $match: { post: new mongoose.Types.ObjectId(postId) } },
    {
      $group: {
        _id: null,
        totalViews: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user' },
        botViews: {
          $sum: { $cond: ['$isBot', 1, 0] }
        },
        validViews: {
          $sum: { $cond: ['$isValidView', 1, 0] }
        },
        avgViewDuration: { $avg: '$viewDuration' },
        avgScrollPercentage: { $avg: '$scrollPercentage' },
        deviceBreakdown: {
          $push: '$deviceInfo.type'
        }
      }
    },
    {
      $project: {
        totalViews: 1,
        uniqueViewers: { $size: '$uniqueUsers' },
        botViews: 1,
        validViews: 1,
        avgViewDuration: { $round: ['$avgViewDuration', 2] },
        avgScrollPercentage: { $round: ['$avgScrollPercentage', 2] }
      }
    }
  ]);
  
  return analytics[0] || {
    totalViews: 0,
    uniqueViewers: 0,
    botViews: 0,
    validViews: 0,
    avgViewDuration: 0,
    avgScrollPercentage: 0
  };
};

// Method to validate if view should count
viewTrackingSchema.methods.validateView = function() {
  // View is valid if:
  // 1. Not detected as bot
  // 2. Scroll percentage >= 70%
  // 3. View duration >= 2 seconds
  this.isValidView = !this.isBot && 
                     this.scrollPercentage >= 70 && 
                     this.viewDuration >= 2000;
  
  return this.isValidView;
};

// Pre-save middleware for bot detection and validation
viewTrackingSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Detect bot behavior
    const botDetection = this.constructor.detectBot(
      this.ipAddress, 
      this.userAgent, 
      this.user
    );
    
    this.isBot = botDetection.isBot;
    this.botScore = botDetection.botScore;
    
    // Check for rapid successive views
    const isRapidView = await this.constructor.checkRapidViews(
      this.user, 
      this.ipAddress
    );
    
    if (isRapidView) {
      this.isBot = true;
      this.botScore = Math.max(this.botScore, 75);
    }
    
    // Validate the view
    this.validateView();
  }
  
  next();
});

// Post-save middleware to update post view count
viewTrackingSchema.post('save', async function(doc) {
  if (doc.isNew) {
    try {
      // Updating post view count
      const Post = mongoose.model('Post');
      const updateData = { $inc: { views: 1 } };
      
      if (doc.isBot) {
        updateData.$inc.botViews = 1;
      }
      
      const result = await Post.findByIdAndUpdate(doc.post, updateData);
      // Post view count updated
    } catch (error) {
      console.error('Error updating post view count:', error);
    }
  }
});

module.exports = mongoose.model('ViewTracking', viewTrackingSchema);