const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userRole: {
    type: String,
    enum: ['user', 'admin', 'manager', 'accountant'],
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN', 'LOGOUT', 'REGISTER', 'UPDATE_PROFILE',
      'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT',
      'FOLLOW', 'UNFOLLOW', 'LIKE', 'UNLIKE',
      'DEACTIVATE', 'PROCESS_PAYMENT'
    ]
  },
  resource: {
    type: String,
    required: true,
    enum: ['USER', 'POST', 'COMMENT', 'EMPLOYEE', 'PRICING', 'PAYMENT']
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  statusCode: {
    type: Number,
    required: true
  },
  requestBody: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  metadata: {
    method: String,
    url: String,
    params: mongoose.Schema.Types.Mixed,
    query: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, timestamp: -1 });
auditLogSchema.index({ userRole: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

// Static methods
auditLogSchema.statics.getRecentActivity = function(limit = 50) {
  return this.find()
    .populate('userId', 'fullName username email')
    .sort({ timestamp: -1 })
    .limit(limit);
};

auditLogSchema.statics.getUserActivity = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

auditLogSchema.statics.getActionStats = function(timeframe = '30d') {
  const startDate = new Date();
  
  switch (timeframe) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          action: '$action',
          resource: '$resource'
        },
        count: { $sum: 1 },
        lastActivity: { $max: '$timestamp' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
