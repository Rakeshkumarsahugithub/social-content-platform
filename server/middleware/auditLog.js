const AuditLog = require('../models/AuditLog');

// Audit logging middleware
const auditLogger = (action, resource) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action after successful response
      if (res.statusCode < 400) {
        logAuditEvent(req, action, resource, res.statusCode, data);
      }
      originalSend.call(this, data);
    };

    next();
  };
};

const logAuditEvent = async (req, action, resource, statusCode, responseData) => {
  try {
    const auditData = {
      userId: req.user?.id,
      userRole: req.user?.role,
      action,
      resource,
      resourceId: req.params.id || req.body.id,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      timestamp: new Date(),
      statusCode,
      requestBody: sanitizeRequestBody(req.body),
      metadata: {
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        query: req.query
      }
    };

    await AuditLog.create(auditData);
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
};

// Sanitize sensitive data from request body
const sanitizeRequestBody = (body) => {
  const sanitized = { ...body };
  
  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.confirmPassword;
  delete sanitized.currentPassword;
  delete sanitized.newPassword;
  
  return sanitized;
};

// Specific audit loggers for different actions
const auditLoggers = {
  // User actions
  userLogin: auditLogger('LOGIN', 'USER'),
  userLogout: auditLogger('LOGOUT', 'USER'),
  userRegister: auditLogger('REGISTER', 'USER'),
  userUpdate: auditLogger('UPDATE_PROFILE', 'USER'),
  
  // Post actions
  postCreate: auditLogger('CREATE', 'POST'),
  postUpdate: auditLogger('UPDATE', 'POST'),
  postDelete: auditLogger('DELETE', 'POST'),
  postApprove: auditLogger('APPROVE', 'POST'),
  postReject: auditLogger('REJECT', 'POST'),
  
  // Admin actions
  employeeCreate: auditLogger('CREATE', 'EMPLOYEE'),
  employeeUpdate: auditLogger('UPDATE', 'EMPLOYEE'),
  employeeDeactivate: auditLogger('DEACTIVATE', 'EMPLOYEE'),
  pricingUpdate: auditLogger('UPDATE', 'PRICING'),
  paymentProcess: auditLogger('PROCESS_PAYMENT', 'PAYMENT'),
  
  // Follow actions
  userFollow: auditLogger('FOLLOW', 'USER'),
  userUnfollow: auditLogger('UNFOLLOW', 'USER'),
  
  // Engagement actions
  postLike: auditLogger('LIKE', 'POST'),
  postUnlike: auditLogger('UNLIKE', 'POST'),
  commentCreate: auditLogger('CREATE', 'COMMENT'),
  commentDelete: auditLogger('DELETE', 'COMMENT')
};

module.exports = {
  auditLogger,
  auditLoggers,
  logAuditEvent
};
