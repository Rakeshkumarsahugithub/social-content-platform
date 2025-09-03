const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/socialmedia');

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    return conn;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('Server will continue without database connection');
    console.log('Make sure MongoDB is running on localhost:27017');
    // Don't exit process, let server run without DB
    return null;
  }
};

module.exports = connectDB;
