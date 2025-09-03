const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const ViewTracking = require('../models/ViewTracking');
const Pricing = require('../models/Pricing');
const path = require('path');
const fs = require('fs');
// Optional FFmpeg setup - don't crash if not available
let ffmpeg = null;
let ffmpegAvailable = false;

try {
  ffmpeg = require('fluent-ffmpeg');
  
  try {
    const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
    ffmpeg.setFfmpegPath(ffmpegPath);
    // FFmpeg path set
  } catch (error) {
    console.warn('Could not set FFmpeg path:', error.message);
  }

  try {
    const ffprobePath = require('@ffprobe-installer/ffprobe').path;
    ffmpeg.setFfprobePath(ffprobePath);
    // FFprobe path set
  } catch (error) {
    console.warn('Could not set FFprobe path:', error.message);
  }
  
  ffmpegAvailable = true;
  // FFmpeg modules loaded successfully
} catch (error) {
  console.warn('⚠️ FFmpeg not available - video processing disabled:', error.message);
  console.log('To enable video trimming, run: npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg @ffprobe-installer/ffprobe');
}

// Test FFmpeg availability
const testFFmpegAvailability = () => {
  return new Promise((resolve) => {
    if (!ffmpegAvailable || !ffmpeg) {
      // FFmpeg not available - skipping test
      resolve(false);
      return;
    }
    
    try {
      // Testing FFmpeg availability...
      
      ffmpeg.ffprobe('-version', (err, data) => {
        if (err) {
          console.warn('FFmpeg is not available:', err.message);
          // Video processing will be disabled
          resolve(false);
        } else {
          // FFmpeg is available and working
          resolve(true);
        }
      });
    } catch (error) {
      console.error('FFmpeg setup error:', error.message);
      resolve(false);
    }
  });
};

// Test FFmpeg on startup (only if available)
if (ffmpegAvailable) {
  testFFmpegAvailability();
}

// Predefined cities for random assignment
const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
  'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
  'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri',
  'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
  'Faridabad', 'Meerut', 'Rajkot', 'Kalyan', 'Vasai', 'Varanasi',
  'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai',
  'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur'
];

// Helper function to get random city
const getRandomCity = () => {
  return CITIES[Math.floor(Math.random() * CITIES.length)];
};

// Helper function to process video
const processVideo = async (filePath) => {
  return new Promise((resolve, reject) => {
    try {
      // If FFmpeg is not available, skip video processing
      if (!ffmpegAvailable || !ffmpeg) {
        // FFmpeg not available - skipping video processing
        resolve(null);
        return;
      }

      const outputPath = filePath.replace(path.extname(filePath), '_processed.mp4');
      const thumbnailPath = filePath.replace(path.extname(filePath), '_thumb.jpg');

      // Processing video

      // Check if input file exists
      if (!fs.existsSync(filePath)) {
        console.error('Input video file does not exist:', filePath);
        resolve(null);
        return;
      }

      // Get file stats
      const fileStats = fs.statSync(filePath);

      // Check if ffmpeg is available and get video metadata
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          console.warn('FFmpeg probe failed, skipping video processing:', err.message);
          // Try to generate thumbnail from original file anyway
          generateThumbnail(filePath, thumbnailPath, resolve);
          return;
        }

        const duration = metadata.format.duration;
        // Video metadata processed

        // Create base ffmpeg command
        let command = ffmpeg(filePath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .format('mp4')
          .outputOptions([
            '-movflags +faststart', // Enable fast start for web playback
            '-preset fast',         // Faster encoding
            '-crf 23',             // Good quality
            '-avoid_negative_ts make_zero' // Handle timestamp issues
          ]);

        // CRITICAL: If video is longer than 60 seconds, trim to exactly 60 seconds
        if (duration > 60) {
          // Trimming video to 60s
          command = command
            .seekInput('00:00:00')
            .duration('00:01:00');
        }
        
        // Add output and thumbnail generation
        command
          .output(outputPath)
          .on('start', (commandLine) => {
            // Starting video processing
          })
          .on('progress', (progress) => {
            if (progress.percent) {
              // Throttle progress logs to reduce terminal spam
              const percent = Math.round(progress.percent);
              if (percent % 10 === 0) { // Only log every 10%
                // Processing progress logged
              }
            }
          })
          .on('end', () => {
            // Video processing completed
            
            // Verify the processed file
            if (fs.existsSync(outputPath)) {
              const processedStats = fs.statSync(outputPath);
              // Output file size logged
              
              // Quick duration verification (no detailed logging)
              ffmpeg.ffprobe(outputPath, (probeErr, processedMetadata) => {
                if (!probeErr && processedMetadata) {
                  const processedDuration = processedMetadata.format.duration;
                  if (duration > 60 && processedDuration > 61) {
                    console.warn(`⚠️ Trim failed: ${processedDuration}s`);
                  }
                }
                
                // Replace original with processed file
                try {
                  fs.renameSync(outputPath, filePath);
                  // Original file replaced with processed version
                } catch (renameErr) {
                  console.error('Error replacing original file:', renameErr);
                  // If rename fails, try to copy and then delete
                  try {
                    fs.copyFileSync(outputPath, filePath);
                    fs.unlinkSync(outputPath);
                    // Original file replaced with processed version (copy method)
                  } catch (copyErr) {
                    console.error('Error copying processed file:', copyErr);
                  }
                }
                
                // Now generate thumbnail
                generateThumbnail(filePath, thumbnailPath, resolve);
              });
            } else {
              console.error('✗ Processed video file was not created');
              // Try to generate thumbnail from original file anyway
              generateThumbnail(filePath, thumbnailPath, resolve);
            }
          })
          .on('error', (err) => {
            console.error('❌ Video processing failed:', err.message);
            
            // Clean up partial files
            try {
              if (fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
              }
            } catch (cleanupErr) {
              console.error('Cleanup error:', cleanupErr);
            }
            
            // Try to generate thumbnail from original file anyway
            generateThumbnail(filePath, thumbnailPath, resolve);
          })
          .run();
      });
    } catch (error) {
      console.error('Video processing setup error:', error.message);
      // Try to generate thumbnail from original file anyway
      generateThumbnail(filePath, thumbnailPath, resolve);
    }
  });
};

// Helper function to generate thumbnail
const generateThumbnail = (videoPath, thumbnailPath, resolve) => {
  // Check if FFmpeg is available
  if (!ffmpegAvailable || !ffmpeg) {
    resolve(null);
    return;
  }
  
  // Check if video file exists
  if (!fs.existsSync(videoPath)) {
    console.error('Video file does not exist for thumbnail generation:', videoPath);
    resolve(null);
    return;
  }
  
  ffmpeg(videoPath)
    .screenshots({
      timestamps: ['00:00:01'], // Generate thumbnail at 1 second
      filename: path.basename(thumbnailPath),
      folder: path.dirname(thumbnailPath),
      size: '320x240'
    })
    .on('start', (commandLine) => {
      // Silent thumbnail generation
    })
    .on('end', () => {
      if (fs.existsSync(thumbnailPath)) {
        resolve(thumbnailPath);
      } else {
        resolve(null);
      }
    })
    .on('error', (err) => {
      console.error('Thumbnail generation error:', err.message);
      console.error('Error stack:', err.stack);
      resolve(null);
    });
};

// Helper function to detect bot behavior
const detectBotBehavior = (req) => {
  const userAgent = req.get('User-Agent') || '';
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /java/i
  ];
  
  return botPatterns.some(pattern => pattern.test(userAgent));
};

const postController = {
  // Create a new post
  createPost: async (req, res) => {
    try {
      const { content } = req.body;
      const userId = req.user.id;

      // Validate content length
      if (content && content.length > 280) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Post content cannot exceed 280 characters',
            code: 'CONTENT_TOO_LONG'
          }
        });
      }

      // Validate that either content or media is provided
      if (!content?.trim() && (!req.files || req.files.length === 0)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Post must contain either text content or media',
            code: 'EMPTY_POST'
          }
        });
      }

      // Process uploaded files
      const mediaFiles = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const isVideo = file.mimetype.startsWith('video/');
          let thumbnailUrl = null;

          if (isVideo) {
            try {
              // Process video (trim to 1 minute and generate thumbnail)
              thumbnailUrl = await processVideo(file.path);
            } catch (error) {
              console.error('Video processing error:', error);
              // Continue without processing if ffmpeg fails
            }
          }

          mediaFiles.push({
            type: isVideo ? 'video' : 'image',
            url: `/uploads/posts/${file.filename}`,
            thumbnail: thumbnailUrl ? `/uploads/posts/${path.basename(thumbnailUrl)}` : null,
            originalName: file.originalname,
            size: file.size
          });

        }
      }

      // Assign random city
      const location = getRandomCity();

      // Create post
      const post = new Post({
        author: userId,
        content: content?.trim() || '',
        mediaFiles,
        location,
        views: 0,
        botViews: 0,
        likes: [],
        botLikes: 0,
        comments: [],
        approved: false,
        paid: false,
        totalRevenue: 0
      });

      await post.save();

      // Update user's posts count
      await User.findByIdAndUpdate(userId, {
        $inc: { postsCount: 1 }
      });

      // Populate author information
      await post.populate('author', 'fullName username profilePicture');

      res.status(201).json({
        success: true,
        data: {
          post,
          message: 'Post created successfully'
        }
      });

    } catch (error) {
      console.error('Create post error:', error);
      
      // Clean up any uploaded files if post creation failed
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          try {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } catch (cleanupError) {
            console.error('File cleanup error:', cleanupError);
          }
        });
      }
      
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to create post',
          code: 'CREATE_POST_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  },

  // Get paginated feed
  getFeed: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const posts = await Post.find()
        .populate('author', 'fullName username profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Add engagement metrics
      const postsWithMetrics = posts.map(post => ({
        ...post,
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
        isLiked: post.likes.some(like => like.user.toString() === req.user.id)
      }));

      const totalPosts = await Post.countDocuments();
      const hasMore = skip + posts.length < totalPosts;

      res.json({
        success: true,
        data: {
          posts: postsWithMetrics,
          pagination: {
            page,
            limit,
            total: totalPosts,
            hasMore
          }
        }
      });

    } catch (error) {
      console.error('Get feed error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch feed',
          code: 'FETCH_FEED_ERROR'
        }
      });
    }
  },

  // Get specific post
  getPost: async (req, res) => {
    try {
      const { id } = req.params;

      const post = await Post.findById(id)
        .populate('author', 'fullName username profilePicture')
        .lean();

      if (!post) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Post not found',
            code: 'POST_NOT_FOUND'
          }
        });
      }

      // Add engagement metrics
      const postWithMetrics = {
        ...post,
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
        isLiked: post.likes.some(like => like.user.toString() === req.user.id)
      };

      res.json({
        success: true,
        data: {
          post: postWithMetrics
        }
      });

    } catch (error) {
      console.error('Get post error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch post',
          code: 'FETCH_POST_ERROR'
        }
      });
    }
  },

  // Toggle like on post
  toggleLike: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Rate limiting: Check if user has liked/unliked this post in the last 2 seconds
      const recentActivity = await Post.findOne({
        _id: id,
        'likes.user': userId,
        'likes.createdAt': { $gte: new Date(Date.now() - 2000) }
      });

      if (recentActivity) {
        return res.status(429).json({
          success: false,
          error: {
            message: 'Please wait before liking again',
            code: 'RATE_LIMIT_EXCEEDED'
          }
        });
      }

      const post = await Post.findById(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Post not found',
            code: 'POST_NOT_FOUND'
          }
        });
      }

      const isLiked = post.likes.some(like => like.user.toString() === userId);
      const isBot = detectBotBehavior(req);

      if (isLiked) {
        // Unlike
        post.likes = post.likes.filter(like => like.user.toString() !== userId);
        if (isBot) {
          post.botLikes = Math.max(0, post.botLikes - 1);
        }
      } else {
        // Like
        post.likes.push({
          user: userId,
          createdAt: new Date()
        });
        if (isBot) {
          post.botLikes += 1;
        }
      }

      await post.save();

      // Emit real-time update
      const io = req.app.get('io');
      if (io) {
        io.emit('post_like_update', {
          postId: id,
          likesCount: post.likes.length,
          isLiked: !isLiked,
          userId: userId
        });
      }

      // Send notification to post author if someone else liked their post
      if (!isLiked && post.author.toString() !== userId) {
        // Populate author and user info for notification
        await post.populate('author', 'fullName username');
        const user = await User.findById(userId).select('fullName username');
        
        if (io && user) {
          io.to(post.author._id.toString()).emit('like_notification', {
            type: 'like',
            title: 'New Like',
            message: `${user.fullName} liked your post`,
            postId: id,
            from: {
              id: userId,
              fullName: user.fullName,
              username: user.username
            },
            timestamp: new Date()
          });
        }
      }

      res.json({
        success: true,
        data: {
          isLiked: !isLiked,
          likesCount: post.likes.length,
          message: isLiked ? 'Post unliked' : 'Post liked'
        }
      });

    } catch (error) {
      console.error('Toggle like error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to toggle like',
          code: 'TOGGLE_LIKE_ERROR'
        }
      });
    }
  },

  // Get users who liked a post
  getLikes: async (req, res) => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const post = await Post.findById(id);

      if (!post) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Post not found',
            code: 'POST_NOT_FOUND'
          }
        });
      }

      // Get paginated likes and populate user data
      const paginatedLikes = post.likes
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(skip, skip + limit);

      await Post.populate(paginatedLikes, {
        path: 'user',
        select: 'fullName username profilePicture'
      });

      const likes = paginatedLikes.map(like => ({
        user: like.user,
        createdAt: like.createdAt
      }));

      const totalLikes = post.likes.length;
      const hasMore = skip + likes.length < totalLikes;

      res.json({
        success: true,
        data: {
          likes,
          pagination: {
            page,
            limit,
            total: totalLikes,
            hasMore
          }
        }
      });

    } catch (error) {
      console.error('Get likes error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch likes',
          code: 'FETCH_LIKES_ERROR'
        }
      });
    }
  },

  // Track post view
  trackView: async (req, res) => {
    try {
      const { postId, userAgent, screenResolution, referrer, language, platform, isAutomated } = req.body;
      const userId = req.user.id;
      const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
      
      // Generate session ID if not provided
      const sessionId = req.sessionID || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      if (!postId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Post ID is required',
            code: 'MISSING_POST_ID'
          }
        });
      }

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Post not found',
            code: 'POST_NOT_FOUND'
          }
        });
      }

      // Enhanced bot detection with multiple methods
      const detectBot = () => {
        // Method 1: User Agent patterns
        const botPatterns = [
          /bot/i, /crawler/i, /spider/i, /scraper/i,
          /facebook/i, /twitter/i, /linkedin/i,
          /headless/i, /phantom/i, /selenium/i,
          /chrome-headless/i, /puppeteer/i, /playwright/i,
          /webdriver/i, /automation/i, /test/i
        ];

        const userAgentString = (userAgent || '').toLowerCase();
        const userAgentBot = botPatterns.some(pattern => pattern.test(userAgent || '')) ||
                            userAgentString.includes('headlesschrome') ||
                            userAgentString.includes('phantomjs');

        // Method 2: Missing or suspicious user agent
        const suspiciousUA = !userAgent || userAgent === 'Unknown' || userAgent.length < 10;

        // Method 3: Client-side automation detection
        const clientBot = isAutomated === true;

        // Method 4: Rapid requests (check if same user viewed multiple posts quickly)
        // This will be implemented as a separate check

        return userAgentBot || suspiciousUA || clientBot;
      };

      const isBot = detectBot();

      // Always allow view tracking for immediate increment
      try {
        // Create view tracking record with all required fields
        const viewTracking = new ViewTracking({
          post: postId,
          user: userId,
          ipAddress,
          userAgent: userAgent || 'Unknown',
          sessionId,
          viewDuration: 0,
          scrollPercentage: 0,
          deviceInfo: {
            type: 'unknown',
            screenResolution: screenResolution || 'unknown'
          },
          referrer: referrer || '',
          isBot,
          timestamp: new Date(),
          viewSource: 'feed'
        });

        // Save without triggering post-save middleware conflicts
        await viewTracking.save();

        // Manually increment view counter (ViewTracking post-save middleware also does this)
        // So we'll let the middleware handle it instead of double counting
        // post.views += 1;
        // if (isBot) {
        //   post.botViews += 1;
        // }

        // Calculate revenue if pricing exists
        try {
          await post.calculateRevenue();
          await post.save();
        } catch (revenueError) {
          console.warn('Revenue calculation failed:', revenueError.message);
          // Continue without revenue calculation
        }
      } catch (viewTrackingError) {
        console.error('ViewTracking creation error:', viewTrackingError);
        // Fallback: just increment post views directly
        post.views += 1;
        if (isBot) {
          post.botViews = (post.botViews || 0) + 1;
        }
        await post.save();
      }

      // Refresh post data after potential updates
      const updatedPost = await Post.findById(postId);

      res.json({
        success: true,
        data: {
          views: updatedPost.views,
          botViews: updatedPost.botViews,
          totalRevenue: updatedPost.totalRevenue || 0,
          viewRevenue: updatedPost.viewRevenue || 0,
          isBot
        }
      });

    } catch (error) {
      console.error('Track view error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to track view',
          code: 'TRACK_VIEW_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  },

  // Get post comments
  getComments: async (req, res) => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const comments = await Comment.find({ post: id, parentComment: null })
        .populate('author', 'fullName username profilePicture')
        .populate({
          path: 'replies',
          populate: {
            path: 'author',
            select: 'fullName username profilePicture'
          }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalComments = await Comment.countDocuments({ post: id, parentComment: null });
      const hasMore = skip + comments.length < totalComments;

      res.json({
        success: true,
        data: {
          comments,
          pagination: {
            page,
            limit,
            total: totalComments,
            hasMore
          }
        }
      });

    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch comments',
          code: 'FETCH_COMMENTS_ERROR'
        }
      });
    }
  },

  // Add comment to post
  addComment: async (req, res) => {
    try {
      const { id } = req.params;
      const { content, parentComment } = req.body;
      const userId = req.user.id;

      if (!content?.trim()) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Comment content is required',
            code: 'EMPTY_COMMENT'
          }
        });
      }

      const post = await Post.findById(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Post not found',
            code: 'POST_NOT_FOUND'
          }
        });
      }

      // Create comment
      const comment = new Comment({
        post: id,
        author: userId,
        content: content.trim(),
        parentComment: parentComment || null,
        replies: []
      });

      await comment.save();

      // Update post comments array
      post.comments.push(comment._id);
      await post.save();

      // If this is a reply, update parent comment
      if (parentComment) {
        await Comment.findByIdAndUpdate(parentComment, {
          $push: { replies: comment._id }
        });
      }

      // Populate author information
      await comment.populate('author', 'fullName username profilePicture');

      res.status(201).json({
        success: true,
        data: {
          comment,
          message: 'Comment added successfully'
        }
      });

    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to add comment',
          code: 'ADD_COMMENT_ERROR'
        }
      });
    }
  },

  // Delete own comment
  deleteComment: async (req, res) => {
    try {
      const { id, commentId } = req.params;
      const userId = req.user.id;

      const comment = await Comment.findById(commentId);
      if (!comment || comment.post.toString() !== id) {
        return res.status(404).json({
          success: false,
          error: { message: 'Comment not found', code: 'COMMENT_NOT_FOUND' }
        });
      }
      if (comment.author.toString() !== userId) {
        return res.status(403).json({
          success: false,
          error: { message: 'Not allowed to delete this comment', code: 'FORBIDDEN' }
        });
      }

      // Remove reference from post or parent comment
      if (comment.parentComment) {
        await Comment.findByIdAndUpdate(comment.parentComment, { $pull: { replies: comment._id } });
      } else {
        await Post.findByIdAndUpdate(id, { $pull: { comments: comment._id } });
      }

      await Comment.findByIdAndDelete(commentId);

      res.json({ success: true, data: { deleted: true } });
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to delete comment', code: 'DELETE_COMMENT_ERROR' }
      });
    }
  },

  // Edit own comment
  editComment: async (req, res) => {
    try {
      const { id, commentId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;

      if (!content?.trim()) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Comment content is required',
            code: 'EMPTY_COMMENT'
          }
        });
      }

      const comment = await Comment.findById(commentId);
      if (!comment || comment.post.toString() !== id) {
        return res.status(404).json({
          success: false,
          error: { message: 'Comment not found', code: 'COMMENT_NOT_FOUND' }
        });
      }
      if (comment.author.toString() !== userId) {
        return res.status(403).json({
          success: false,
          error: { message: 'Not allowed to edit this comment', code: 'FORBIDDEN' }
        });
      }

      // Update comment content
      comment.content = content.trim();
      comment.updatedAt = new Date();
      await comment.save();

      // Populate author information
      await comment.populate('author', 'fullName username profilePicture');

      res.json({
        success: true,
        data: {
          comment,
          message: 'Comment updated successfully'
        }
      });

    } catch (error) {
      console.error('Edit comment error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to edit comment',
          code: 'EDIT_COMMENT_ERROR'
        }
      });
    }
  },

  // Search posts
  searchPosts: async (req, res) => {
    try {
      const { q, page = 1, limit = 20 } = req.query;

      // If no query provided, return empty results
      if (!q || q.trim().length === 0) {
        return res.json({
          success: true,
          data: {
            posts: [],
            pagination: {
              currentPage: parseInt(page),
              totalPages: 0,
              totalItems: 0,
              hasNext: false,
              hasPrev: false
            }
          }
        });
      }

      if (q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Search query must be at least 2 characters',
            code: 'INVALID_QUERY'
          }
        });
      }

      const searchRegex = new RegExp(q.trim(), 'i');
      const skip = (page - 1) * limit;

      const posts = await Post.find({
        $and: [
          { isActive: true },
          {
            $or: [
              { content: searchRegex },
              { location: searchRegex }
            ]
          }
        ]
      })
      .populate('author', 'fullName username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

      // Add engagement metrics
      const postsWithMetrics = posts.map(post => ({
        ...post,
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
        isLiked: post.likes.some(like => like.user.toString() === req.user.id)
      }));

      const totalPosts = await Post.countDocuments({
        $and: [
          { isActive: true },
          {
            $or: [
              { content: searchRegex },
              { location: searchRegex }
            ]
          }
        ]
      });

      const totalPages = Math.ceil(totalPosts / limit);

      res.json({
        success: true,
        data: {
          posts: postsWithMetrics,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: totalPosts,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Search posts error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to search posts',
          code: 'SEARCH_POSTS_FAILED'
        }
      });
    }
  }
};

module.exports = postController;