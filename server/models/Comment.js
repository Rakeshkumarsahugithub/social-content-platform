const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  repliesCount: {
    type: Number,
    default: 0
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  level: {
    type: Number,
    default: 0,
    max: 3 // Limit nesting to 3 levels
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ isActive: 1 });

// Virtual for likes count
commentSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Method to check if user has liked the comment
commentSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Pre-save middleware to set level for nested comments
commentSchema.pre('save', async function(next) {
  if (this.parentComment && this.isNew) {
    try {
      const parentComment = await this.constructor.findById(this.parentComment);
      if (parentComment) {
        this.level = parentComment.level + 1;
        
        // Prevent deep nesting
        if (this.level > 3) {
          const error = new Error('Comment nesting cannot exceed 3 levels');
          return next(error);
        }
        
        // Add this comment to parent's replies
        parentComment.replies.push(this._id);
        parentComment.repliesCount = parentComment.replies.length;
        await parentComment.save();
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Post-save middleware to update post comments count
commentSchema.post('save', async function(doc) {
  if (doc.isNew && !doc.parentComment) {
    try {
      const Post = mongoose.model('Post');
      await Post.findByIdAndUpdate(
        doc.post,
        { $inc: { commentsCount: 1 }, $push: { comments: doc._id } }
      );
    } catch (error) {
      console.error('Error updating post comments count:', error);
    }
  }
});

// Post-remove middleware to update counts
commentSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    try {
      // Update post comments count if it's a top-level comment
      if (!doc.parentComment) {
        const Post = mongoose.model('Post');
        await Post.findByIdAndUpdate(
          doc.post,
          { $inc: { commentsCount: -1 }, $pull: { comments: doc._id } }
        );
      } else {
        // Update parent comment replies count
        await this.model.findByIdAndUpdate(
          doc.parentComment,
          { $inc: { repliesCount: -1 }, $pull: { replies: doc._id } }
        );
      }
      
      // Delete all replies if this comment has any
      if (doc.replies && doc.replies.length > 0) {
        await this.model.deleteMany({ _id: { $in: doc.replies } });
      }
    } catch (error) {
      console.error('Error updating comment counts:', error);
    }
  }
});

module.exports = mongoose.model('Comment', commentSchema);