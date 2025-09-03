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

// Reset user password
const resetUserPassword = async (username, newPassword) => {
  await connectDB();

  try {
    // Check if user exists
    const user = await User.findOne({ username: username });
    
    if (!user) {
      console.log(`User "${username}" not found.`);
      process.exit(1);
    }
    
    console.log(`User "${username}" found. Current role: ${user.role}`);
    console.log(`Current password hash: ${user.password}`);
    
    // Update user password (let the pre-save middleware handle hashing)
    user.password = newPassword;
    
    await user.save();
    console.log(`User "${username}" password reset successfully!`);
    console.log('New password:', newPassword);
    
    // Verify the password was saved correctly
    console.log(`Password after save: ${user.password}`);
    const isMatch = await user.comparePassword(newPassword);
    console.log(`Password verification: ${isMatch ? '✅ Valid' : '❌ Invalid'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error resetting user password:', error);
    process.exit(1);
  }
};

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node scripts/resetUserPassword.js <username> <newPassword>');
  console.log('Example: node scripts/resetUserPassword.js sitta admin123');
  process.exit(1);
}

const username = args[0];
const newPassword = args[1];

resetUserPassword(username, newPassword);