const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/social-platform');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// User schema (minimal for migration)
const userSchema = new mongoose.Schema({
  profilePicture: String
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

const fixProfilePicturePaths = async () => {
  try {
    console.log('Starting profile picture path migration...');
    
    // Find all users with full Windows paths in profilePicture
    const usersWithFullPaths = await User.find({
      profilePicture: { 
        $regex: /^[A-Z]:\\.*\\uploads\\/ 
      }
    });
    
    console.log(`Found ${usersWithFullPaths.length} users with full paths`);
    
    let updatedCount = 0;
    
    for (const user of usersWithFullPaths) {
      const oldPath = user.profilePicture;
      
      // Convert Windows path to relative path
      // Extract filename from full path
      const filename = oldPath.split('\\').pop();
      const newPath = `/uploads/${filename}`;
      
      // Update user
      await User.findByIdAndUpdate(user._id, {
        profilePicture: newPath
      });
      
      console.log(`Updated user ${user._id}: ${oldPath} -> ${newPath}`);
      updatedCount++;
    }
    
    console.log(`Migration completed! Updated ${updatedCount} users.`);
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run migration
const runMigration = async () => {
  await connectDB();
  await fixProfilePicturePaths();
};

runMigration();
