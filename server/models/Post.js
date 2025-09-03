const mongoose = require('mongoose');

const mediaFileSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String, // For video thumbnails
    default: ''
  },
  originalName: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  duration: {
    type: Number, // For videos in seconds
    default: 0
  }
});

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    maxlength: [280, 'Post content cannot exceed 280 characters'],
    trim: true,
    default: ''
  },
  mediaFiles: [mediaFileSchema],
  location: {
    type: String,
    required: true,
    enum: [
      'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
      'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
      'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri',
      'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
      'Faridabad', 'Meerut', 'Rajkot', 'Kalyan', 'Vasai', 'Varanasi',
      'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai',
      'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur'
    ]
  },
  views: {
    type: Number,
    default: 0
  },
  botViews: {
    type: Number,
    default: 0
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  dislikes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  botLikes: {
    type: Number,
    default: 0
  },
  botDislikes: {
    type: Number,
    default: 0
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  commentsCount: {
    type: Number,
    default: 0
  },
  approved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  paid: {
    type: Boolean,
    default: false
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paidAt: {
    type: Date
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  viewRevenue: {
    type: Number,
    default: 0
  },
  likeRevenue: {
    type: Number,
    default: 0
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ location: 1 });
postSchema.index({ approved: 1, paid: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ 'likes.user': 1 });
postSchema.index({ visibility: 1, isActive: 1 });

// Virtual for likes count
postSchema.virtual('likesCount').get(function() {
  return (this.likes && Array.isArray(this.likes)) ? this.likes.length : 0;
});

// Virtual for total engagement
postSchema.virtual('totalEngagement').get(function() {
  const likesCount = (this.likes && Array.isArray(this.likes)) ? this.likes.length : 0;
  const views = this.views || 0;
  const comments = this.commentsCount || 0;
  return views + likesCount + comments;
});

// Method to check if user has liked the post
postSchema.methods.isLikedBy = function(userId) {
  if (!this.likes || !Array.isArray(this.likes)) {
    return false;
  }
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Method to calculate revenue based on pricing
postSchema.methods.calculateRevenue = async function() {
  // Calculating revenue for post
  const Pricing = mongoose.model('Pricing');
  const pricing = await Pricing.findOne({ city: this.location });
  
  if (pricing) {
    const views = this.views || 0;
    const botViews = this.botViews || 0;
    const likesCount = (this.likes && Array.isArray(this.likes)) ? this.likes.length : 0;
    const botLikes = this.botLikes || 0;
    
    this.viewRevenue = (views - botViews) * pricing.pricePerView;
    this.likeRevenue = (likesCount - botLikes) * pricing.pricePerLike;
    this.totalRevenue = this.viewRevenue + this.likeRevenue;
    
    // Revenue calculated
  } else {
    // No pricing found for city
  }
  
  return this.totalRevenue || 0;
};

// Static method to get random city
postSchema.statics.getRandomCity = function() {
  const cities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
    'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
    'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri',
    'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
    'Faridabad', 'Meerut', 'Rajkot', 'Kalyan', 'Vasai', 'Varanasi'
  ];
  return cities[Math.floor(Math.random() * cities.length)];
};

// Pre-save middleware to assign random city if not provided
postSchema.pre('save', function(next) {
  if (!this.location) {
    this.location = this.constructor.getRandomCity();
  }
  next();
});

module.exports = mongoose.model('Post', postSchema);