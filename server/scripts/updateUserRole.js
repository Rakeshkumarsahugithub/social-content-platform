const mongoose = require('mongoose');
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

// Update user role
const updateUserRole = async (username, newRole) => {
  await connectDB();

  try {
    // Check if user exists
    const user = await User.findOne({ username: username });
    
    if (!user) {
      console.log(`User "${username}" not found.`);
      process.exit(1);
    }
    
    console.log(`User "${username}" found. Current role: ${user.role}`);
    
    // Update user role
    user.role = newRole;
    
    // Set admin security code if changing to admin/manager/accountant and not already set
    if (['admin', 'manager', 'accountant'].includes(newRole) && !user.adminSecurityCode) {
      user.adminSecurityCode = process.env.ADMIN_SECURITY_CODE || 'admin123';
    }
    
    await user.save();
    console.log(`User "${username}" role updated to "${newRole}" successfully!`);
    console.log('User details:', {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating user role:', error);
    process.exit(1);
  }
};

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node scripts/updateUserRole.js <username> <newRole>');
  console.log('Example: node scripts/updateUserRole.js sitta admin');
  process.exit(1);
}

const username = args[0];
const newRole = args[1];

// Validate role
const validRoles = ['user', 'admin', 'manager', 'accountant'];
if (!validRoles.includes(newRole)) {
  console.log(`Invalid role. Valid roles are: ${validRoles.join(', ')}`);
  process.exit(1);
}

updateUserRole(username, newRole);