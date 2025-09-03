const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureUploadDirs = () => {
  const dirs = ['uploads/profiles', 'uploads/posts', 'uploads/temp'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

ensureUploadDirs();

// File filter function
const fileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  };
};

// Storage configuration
const createStorage = (destination, filenamePrefix = '') => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      cb(null, `${filenamePrefix}${uniqueSuffix}${extension}`);
    }
  });
};

// Profile picture upload
const profilePictureUpload = multer({
  storage: createStorage('uploads/profiles', 'profile-'),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: fileFilter([
    'image/jpeg',
    'image/png',
    'image/webp'
  ])
});

// Post media upload
const postMediaUpload = multer({
  storage: createStorage('uploads/posts', 'post-'),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 5 // Maximum 5 files
  },
  fileFilter: fileFilter([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ])
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = 'File upload error';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size too large';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      default:
        message = err.message;
    }
    
    return res.status(400).json({
      success: false,
      error: { message }
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      error: { message: err.message }
    });
  }
  
  next();
};

module.exports = {
  profilePictureUpload,
  postMediaUpload,
  handleMulterError
};
