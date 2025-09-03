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

// List all users
const listUsers = async () => {
  await connectDB();

  try {
    // Select all fields except password for security
    const users = await User.find({}, 'fullName username email role isActive adminSecurityCode');
    
    console.log('Users in the database:');
    console.log('=====================');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName} (@${user.username})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
      if (user.adminSecurityCode) {
        console.log(`   Has Admin Security Code: Yes`);
      }
      console.log('---------------------');
    });
    
    console.log(`Total users: ${users.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error listing users:', error);
    process.exit(1);
  }
};

listUsers();