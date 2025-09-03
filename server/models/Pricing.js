const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema({
  city: {
    type: String,
    required: [true, 'City is required'],
    unique: true,
    trim: true,
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
  pricePerView: {
    type: Number,
    required: [true, 'Price per view is required'],
    min: [0.01, 'Price per view must be at least 0.01'],
    max: [100, 'Price per view cannot exceed 100']
  },
  pricePerLike: {
    type: Number,
    required: [true, 'Price per like is required'],
    min: [0.01, 'Price per like must be at least 0.01'],
    max: [100, 'Price per like cannot exceed 100']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  effectiveFrom: {
    type: Date,
    default: Date.now
  },
  effectiveTo: {
    type: Date,
    default: null
  },
  tier: {
    type: String,
    enum: ['tier1', 'tier2', 'tier3'],
    default: function() {
      // Tier 1: Major metros
      const tier1Cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune'];
      // Tier 2: Other major cities
      const tier2Cities = ['Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore'];
      
      if (tier1Cities.includes(this.city)) return 'tier1';
      if (tier2Cities.includes(this.city)) return 'tier2';
      return 'tier3';
    }
  },
  multiplier: {
    type: Number,
    default: function() {
      switch (this.tier) {
        case 'tier1': return 1.5;
        case 'tier2': return 1.2;
        case 'tier3': return 1.0;
        default: return 1.0;
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance (city already indexed via unique: true)
pricingSchema.index({ tier: 1 });
pricingSchema.index({ isActive: 1 });
pricingSchema.index({ effectiveFrom: 1, effectiveTo: 1 });

// Virtual for effective pricing (with multiplier)
pricingSchema.virtual('effectivePricePerView').get(function() {
  return (this.pricePerView * this.multiplier).toFixed(4);
});

pricingSchema.virtual('effectivePricePerLike').get(function() {
  return (this.pricePerLike * this.multiplier).toFixed(4);
});

// Method to check if pricing is currently active
pricingSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  return this.isActive && 
         this.effectiveFrom <= now && 
         (!this.effectiveTo || this.effectiveTo >= now);
};

// Static method to get active pricing for a city
pricingSchema.statics.getActivePricing = function(city) {
  const now = new Date();
  return this.findOne({
    city,
    isActive: true,
    effectiveFrom: { $lte: now },
    $or: [
      { effectiveTo: null },
      { effectiveTo: { $gte: now } }
    ]
  });
};

// Static method to get all active pricing
pricingSchema.statics.getAllActivePricing = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    effectiveFrom: { $lte: now },
    $or: [
      { effectiveTo: null },
      { effectiveTo: { $gte: now } }
    ]
  }).sort({ city: 1 });
};

// Static method to initialize default pricing for all cities
pricingSchema.statics.initializeDefaultPricing = async function(adminUserId) {
  const cities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
    'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
    'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri',
    'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
    'Faridabad', 'Meerut', 'Rajkot', 'Kalyan', 'Vasai', 'Varanasi',
    'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai',
    'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur'
  ];
  
  const defaultPricing = cities.map(city => ({
    city,
    pricePerView: 0.10,
    pricePerLike: 0.25,
    createdBy: adminUserId
  }));
  
  try {
    await this.insertMany(defaultPricing, { ordered: false });
  } catch (error) {
    // Ignore duplicate key errors
    if (error.code !== 11000) {
      throw error;
    }
  }
};

// Pre-save middleware to set tier and multiplier
pricingSchema.pre('save', function(next) {
  if (this.isModified('city') || this.isNew) {
    const tier1Cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune'];
    const tier2Cities = ['Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore'];
    
    if (tier1Cities.includes(this.city)) {
      this.tier = 'tier1';
      this.multiplier = 1.5;
    } else if (tier2Cities.includes(this.city)) {
      this.tier = 'tier2';
      this.multiplier = 1.2;
    } else {
      this.tier = 'tier3';
      this.multiplier = 1.0;
    }
  }
  next();
});

module.exports = mongoose.model('Pricing', pricingSchema);