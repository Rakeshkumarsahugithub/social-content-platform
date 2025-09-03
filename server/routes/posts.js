const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');
const { validationRules, handleValidationErrors } = require('../utils/validation');
const postController = require('../controllers/postController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/posts');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  }
});

// File filter for images and videos
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|avi|mov|wmv|flv|webm/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images and videos are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: fileFilter
});

// Routes
router.post('/', authenticate, upload.array('mediaFiles', 10), postController.createPost);
router.get('/feed', authenticate, postController.getFeed);
router.get('/search', authenticate, postController.searchPosts);
router.get('/:id', authenticate, postController.getPost);
router.put('/:id/like', authenticate, postController.toggleLike);
router.get('/:id/likes', authenticate, postController.getLikes);
router.post('/track-view', authenticate, ...validationRules.viewTracking, handleValidationErrors, postController.trackView);
router.get('/:id/comments', authenticate, postController.getComments);
router.post('/:id/comments', authenticate, postController.addComment);
router.put('/:id/comments/:commentId', authenticate, postController.editComment);
router.delete('/:id/comments/:commentId', authenticate, postController.deleteComment);

module.exports = router;