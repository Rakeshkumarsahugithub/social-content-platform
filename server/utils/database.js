const mongoose = require('mongoose');
const { User, Pricing } = require('../models');

// Database connection function
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Initialize default data if needed
    await initializeDefaultData();
    
    return conn;
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Initialize default data
const initializeDefaultData = async () => {
  try {
    // Check if admin user exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      console.log('Creating default admin user...');
      const defaultAdmin = new User({
        fullName: 'System Administrator',
        email: 'admin@socialmedia.com',
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        adminSecurityCode: process.env.ADMIN_SECURITY_CODE || 'admin123',
        bio: 'System Administrator Account'
      });
      
      await defaultAdmin.save();
      console.log('Default admin user created successfully');
      
      // Initialize default pricing with admin ID
      await Pricing.initializeDefaultPricing(defaultAdmin._id);
      console.log('Default pricing initialized successfully');
    }
    
    // Check if pricing data exists
    const pricingCount = await Pricing.countDocuments();
    if (pricingCount === 0) {
      const admin = await User.findOne({ role: 'admin' });
      if (admin) {
        await Pricing.initializeDefaultPricing(admin._id);
        console.log('Default pricing initialized successfully');
      }
    }
    
  } catch (error) {
    console.error('Error initializing default data:', error);
  }
};

// Graceful shutdown
const gracefulShutdown = () => {
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  });
};

// Handle process termination
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = {
  connectDB,
  initializeDefaultData,
  gracefulShutdown
};