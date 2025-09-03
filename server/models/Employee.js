const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Employee name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: ['manager', 'accountant'],
      message: 'Role must be either manager or accountant'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  permissions: {
    createEmployee: {
      type: Boolean,
      default: false
    },
    revenueMaster: {
      type: Boolean,
      default: function() {
        return this.role === 'manager';
      }
    },
    postList: {
      type: Boolean,
      default: function() {
        return this.role === 'manager';
      }
    },
    payment: {
      type: Boolean,
      default: true
    }
  },
  lastLogin: {
    type: Date
  },
  loginCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance (email already indexed via unique: true)
employeeSchema.index({ role: 1 });
employeeSchema.index({ createdBy: 1 });
employeeSchema.index({ isActive: 1 });

// Pre-save middleware to set permissions based on role
employeeSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    switch (this.role) {
      case 'manager':
        this.permissions = {
          createEmployee: false,
          revenueMaster: true,
          postList: true,
          payment: true
        };
        break;
      case 'accountant':
        this.permissions = {
          createEmployee: false,
          revenueMaster: false,
          postList: false,
          payment: true
        };
        break;
    }
  }
  next();
});

// Method to check if employee has specific permission
employeeSchema.methods.hasPermission = function(permission) {
  return this.permissions[permission] === true;
};

// Method to get role-based permissions
employeeSchema.methods.getRolePermissions = function() {
  const rolePermissions = {
    manager: {
      createEmployee: false,
      revenueMaster: true,
      postList: true,
      payment: true
    },
    accountant: {
      createEmployee: false,
      revenueMaster: false,
      postList: false,
      payment: true
    }
  };
  
  return rolePermissions[this.role] || {};
};

// Static method to get employees by role
employeeSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

// Virtual for display name
employeeSchema.virtual('displayInfo').get(function() {
  return {
    name: this.name,
    email: this.email,
    role: this.role,
    permissions: this.permissions,
    isActive: this.isActive
  };
});

module.exports = mongoose.model('Employee', employeeSchema);