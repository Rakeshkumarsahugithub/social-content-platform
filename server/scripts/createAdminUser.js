const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/socialmedia');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Create or update admin user
const createAdminUser = async () => {
  await connectDB();

  try {
    // Check if user exists
    const existingUser = await User.findOne({ username: 'sitta' });
    
    if (existingUser) {
      console.log('User "sitta" found. Updating role to admin...');
      
      // Update user role to admin
      existingUser.role = 'admin';
      
      // Set admin security code if not already set
      if (!existingUser.adminSecurityCode) {
        existingUser.adminSecurityCode = process.env.ADMIN_SECURITY_CODE || 'admin123';
      }
      
      await existingUser.save();
      console.log('User "sitta" updated to admin role successfully!');
      console.log('User details:', {
        id: existingUser._id,
        username: existingUser.username,
        email: existingUser.email,
        role: existingUser.role
      });
    } else {
      console.log('User "sitta" not found. Creating new admin user...');
      
      // Create new admin user
      const newUser = new User({
        fullName: 'Admin User',
        email: 'admin@example.com',
        username: 'sitta',
        password: 'admin123', // This will be hashed automatically
        role: 'admin',
        adminSecurityCode: process.env.ADMIN_SECURITY_CODE || 'admin123',
        isActive: true
      });
      
      await newUser.save();
      console.log('New admin user "sitta" created successfully!');
      console.log('User details:', {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating/updating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();