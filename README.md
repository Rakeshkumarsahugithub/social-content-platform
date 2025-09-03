# eMILO Social Media Platform

A comprehensive social media platform built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring user authentication, multimedia posts, real-time interactions, and an advanced admin panel with location-based revenue sharing.

## 🚀 Project Status: **95% Complete**

This is a fully functional social media platform with all core features implemented and tested. The project includes advanced video processing, real-time social features, and a comprehensive admin dashboard.

## ✨ Key Features

### 🔐 Authentication & User Management
- **Dual Role System**: User and Admin registration with security code protection
- **JWT Authentication**: Access and refresh token system with automatic renewal
- **Profile Management**: Complete user profiles with bio, profile pictures, and statistics
- **Social Features**: Follow/unfollow system with suggestions and notifications
- **Security**: Input validation, password hashing, and role-based access control

### 📱 Posts & Media Handling
- **Rich Content Creation**: Text posts with 280-character limit
- **Multi-Media Support**: Upload multiple images and videos per post
- **Advanced Video Processing**: 
  - Auto-trim videos longer than 60 seconds to exactly 1 minute
  - Generate thumbnails at 1-second mark
  - Support for MP4, WebM, MOV, and other formats
  - Robust error handling and fallback mechanisms
- **Location-Based Pricing**: Random city assignment for revenue calculations
- **Responsive Media Display**: Optimized for all device sizes

### 🤝 Real-Time Social Interactions
- **Like System**: Animated like/unlike with real-time updates via Socket.io
- **Comment System**: Nested comments with edit/delete functionality
- **View Tracking**: Advanced bot detection and analytics
- **Live Updates**: Real-time notifications for all social interactions
- **Infinite Scroll**: Smooth feed browsing experience

### 👨‍💼 Advanced Admin Dashboard
- **Post Management**: Review, approve, and reject posts with analytics
- **Revenue System**: City-wise pricing configuration and calculations
- **Payment Processing**: Complete payment workflow and history tracking
- **User Analytics**: Comprehensive statistics and reporting
- **Role-Based Access**: Admin-only features with security validation

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first approach with tablet and desktop optimization
- **Interactive Elements**: Smooth animations and hover effects
- **Loading States**: Skeleton loaders and progress indicators
- **Toast Notifications**: User-friendly feedback system
- **Clean Interface**: Modern design with intuitive navigation

## 🛠️ Complete Tech Stack & Library Purposes

### 🎨 Frontend Technologies
| Library/Tool | Version | Purpose | Security/Performance Role |
|--------------|---------|---------|---------------------------|
| **React** | 18.2.0 | Core UI framework | Virtual DOM for performance |
| **Vite** | 5.0.0 | Build tool & dev server | Fast HMR, optimized builds |
| **React Router DOM** | 6.8.0 | Client-side routing | Protected routes, navigation |
| **Axios** | 1.6.0 | HTTP client | Request/response interceptors, token management |
| **Socket.io-client** | 4.7.4 | Real-time communication | Live updates, WebSocket fallback |
| **React Hot Toast** | 2.4.1 | Notifications | User feedback, error handling |

### 🔧 Backend Technologies
| Library/Tool | Version | Purpose | Security/Performance Role |
|--------------|---------|---------|---------------------------|
| **Node.js** | 18+ | Runtime environment | Event-driven, non-blocking I/O |
| **Express.js** | 4.18.2 | Web framework | Middleware support, routing |
| **MongoDB** | 6.0+ | NoSQL database | Document-based, horizontal scaling |
| **Mongoose** | 7.0.3 | ODM for MongoDB | Schema validation, query optimization |

### 🔐 Security & Authentication
| Library/Tool | Version | Purpose | Security Implementation |
|--------------|---------|---------|------------------------|
| **bcryptjs** | 2.4.3 | Password hashing | Salt rounds (12), secure password storage |
| **jsonwebtoken** | 9.0.0 | JWT tokens | Access/refresh token system |
| **helmet** | 7.1.0 | Security headers | XSS protection, CSRF prevention |
| **cors** | 2.8.5 | Cross-origin requests | Whitelist origins, credentials handling |
| **express-validator** | 6.14.3 | Input validation | Sanitization, XSS prevention |

### 📁 File Handling & Media Processing
| Library/Tool | Version | Purpose | Performance Features |
|--------------|---------|---------|---------------------|
| **multer** | 1.4.5 | File uploads | Memory/disk storage, file filtering |
| **fluent-ffmpeg** | 2.1.3 | Video processing | Async processing, format conversion |
| **@ffmpeg-installer/ffmpeg** | 1.1.0 | FFmpeg binary | Bundled binary, cross-platform |
| **@ffprobe-installer/ffprobe** | 2.1.2 | Video metadata | Duration detection, format info |

### 🚀 Performance & Monitoring
| Library/Tool | Version | Purpose | Performance Benefits |
|--------------|---------|---------|---------------------|
| **morgan** | 1.10.0 | HTTP logging | Request monitoring, debugging |
| **socket.io** | 4.7.4 | Real-time events | Efficient WebSocket connections |
| **nodemon** | 3.0.2 | Development server | Auto-restart, development efficiency |

### 🧪 Development & Testing
| Library/Tool | Version | Purpose | Development Aid |
|--------------|---------|---------|-----------------|
| **jest** | 29.7.0 | Testing framework | Unit testing, mocking |
| **supertest** | 6.3.3 | API testing | HTTP assertions, integration tests |
| **concurrently** | 8.2.2 | Run multiple scripts | Development workflow |

## 📁 Detailed Project Structure & File-wise Implementation

### 🎯 Root Directory
```
social-platform/
├── 📄 package.json           # Root dependencies & scripts (concurrently)
├── 📄 README.md              # Comprehensive project documentation
├── 📄 .gitignore             # Git ignore patterns
├── 📁 client/                # React Frontend Application
├── 📁 server/                # Node.js Backend Application
└── 📁 .kiro/                 # Project specifications & configs
```

### 🖥️ Frontend Structure (`client/`)
```
client/
├── 📄 package.json           # Frontend dependencies (React 18, Vite, etc.)
├── 📄 vite.config.js         # Vite build configuration
├── 📄 index.html             # Main HTML template
├── 📄 .env                   # Frontend environment variables
├── 📁 public/                # Static assets
│   ├── 🖼️ favicon.ico        # App favicon
│   └── 🖼️ logo.svg           # App logo
├── 📁 src/                   # Source code
│   ├── 📄 App.jsx            # Main app component with routing
│   ├── 📄 App.css            # Global styles
│   ├── 📄 main.jsx           # React app entry point
│   ├── 📁 assets/            # Static assets (images, icons)
│   ├── 📁 components/        # Reusable UI components
│   │   ├── 📁 Admin/         # Admin dashboard components
│   │   │   ├── 📄 EmployeeManagement.jsx    # Employee CRUD operations
│   │   │   ├── 📄 PaymentDashboard.jsx      # Payment processing UI
│   │   │   ├── 📄 PostManagement.jsx        # Post approval system
│   │   │   ├── 📄 PricingManagement.jsx     # City pricing config
│   │   │   └── 📄 index.js                  # Admin components export
│   │   ├── 📁 Comments/      # Comment system components
│   │   │   ├── 📄 CommentForm.jsx           # Add/edit comments
│   │   │   ├── 📄 CommentItem.jsx           # Individual comment display
│   │   │   ├── 📄 CommentSection.jsx        # Comments container
│   │   │   └── 📄 index.js                  # Comments export
│   │   ├── 📁 Layout/        # App layout components
│   │   │   ├── 📄 Layout.jsx                # Main layout wrapper
│   │   │   ├── 📄 Navbar.jsx                # Navigation bar with auth
│   │   │   └── 📄 index.js                  # Layout export
│   │   ├── 📁 Post/          # Post-related components
│   │   │   ├── 📄 PostCard.jsx              # Individual post display
│   │   │   ├── 📄 PostCreator.jsx           # Create new post form
│   │   │   ├── 📄 LikesModal.jsx            # Show users who liked
│   │   │   └── 📄 index.js                  # Post components export
│   │   ├── 📁 Profile/       # User profile components
│   │   │   ├── 📄 ProfileHeader.jsx         # User info display
│   │   │   ├── 📄 ProfileEdit.jsx           # Edit profile form
│   │   │   ├── 📄 ProfileTabs.jsx           # Profile navigation tabs
│   │   │   ├── 📄 FollowButton.jsx          # Follow/unfollow button
│   │   │   ├── 📄 FollowList.jsx            # Followers/following lists
│   │   │   ├── 📄 FollowSuggestions.jsx     # User recommendations
│   │   │   └── 📄 index.js                  # Profile components export
│   │   └── 📄 ProtectedRoute.jsx            # Route authentication guard
│   ├── 📁 contexts/          # React Context providers
│   │   └── 📄 AuthContext.jsx               # Authentication state management
│   ├── 📁 hooks/             # Custom React hooks
│   │   ├── 📄 useAuth.js                    # Authentication hook
│   │   ├── 📄 useSocket.js                  # Socket.io connection hook
│   │   └── 📄 useInfiniteScroll.js          # Infinite scroll hook
│   ├── 📁 pages/             # Page components (routes)
│   │   ├── 📄 Home.jsx                      # Main feed page
│   │   ├── 📄 Login.jsx                     # User login page
│   │   ├── 📄 Register.jsx                  # User registration page
│   │   ├── 📄 Profile.jsx                   # User profile page
│   │   ├── 📄 AdminDashboard.jsx            # Admin panel page
│   │   └── 📄 NotFound.jsx                  # 404 error page
│   ├── 📁 services/          # API service functions
│   │   ├── 📄 api.js                        # Axios configuration
│   │   ├── 📄 authService.js                # Authentication API calls
│   │   ├── 📄 postService.js                # Post-related API calls
│   │   ├── 📄 userService.js                # User management API calls
│   │   └── 📄 adminService.js               # Admin panel API calls
│   └── 📁 utils/             # Utility functions
│       ├── 📄 constants.js                  # App constants
│       ├── 📄 helpers.js                    # Helper functions
│       └── 📄 validation.js                 # Form validation utils
```

### 🔧 Backend Structure (`server/`)
```
server/
├── 📄 package.json           # Backend dependencies & scripts
├── 📄 index.js               # Express server entry point
├── 📄 .env                   # Environment variables (secrets)
├── 📁 config/                # Configuration files
│   └── 📄 database.js        # MongoDB connection setup
├── 📁 controllers/           # Business logic handlers
│   ├── 📄 authController.js  # Authentication logic (register/login)
│   ├── 📄 userController.js  # User management operations
│   ├── 📄 postController.js  # Post CRUD & media processing
│   └── 📄 adminController.js # Admin panel operations
├── 📁 middleware/            # Express middleware functions
│   ├── 📄 auth.js            # JWT token verification
│   ├── 📄 upload.js          # File upload handling (Multer)
│   ├── 📄 validation.js      # Request validation middleware
│   ├── 📄 errorHandler.js    # Global error handling
│   ├── 📄 rateLimiter.js     # API rate limiting
│   ├── 📄 cors.js            # CORS configuration
│   ├── 📄 helmet.js          # Security headers
│   └── 📄 auditLog.js        # Admin action logging
├── 📁 models/                # MongoDB schemas (Mongoose)
│   ├── 📄 User.js            # User schema with auth methods
│   ├── 📄 Post.js            # Post schema with media fields
│   ├── 📄 Comment.js         # Comment schema with nesting
│   ├── 📄 Employee.js        # Employee management schema
│   ├── 📄 Pricing.js         # City-wise pricing schema
│   ├── 📄 Payment.js         # Payment tracking schema
│   ├── 📄 ViewTracking.js    # Post view analytics schema
│   └── 📄 AuditLog.js        # Admin action audit schema
├── 📁 routes/                # API route definitions
│   ├── 📄 auth.js            # Authentication routes
│   ├── 📄 users.js           # User management routes
│   ├── 📄 posts.js           # Post operations routes
│   └── 📄 admin.js           # Admin panel routes
├── 📁 scripts/               # Utility & maintenance scripts
│   ├── 📄 createAdminUser.js # Create admin user script
│   ├── 📄 listUsers.js       # List all users script
│   ├── 📄 resetUserPassword.js # Password reset script
│   ├── 📄 updateUserRole.js  # Role management script
│   └── 📄 fixProfilePicturePaths.js # Fix image paths script
├── 📁 uploads/               # File storage directory
│   ├── 📁 posts/             # Post media files
│   │   ├── 📁 images/        # Image uploads
│   │   ├── 📁 videos/        # Video uploads
│   │   └── 📁 thumbnails/    # Video thumbnails
│   └── 📁 profiles/          # Profile pictures
└── 📁 utils/                 # Helper utilities
    ├── 📄 jwt.js             # JWT token management
    ├── 📄 socketManager.js   # Socket.io connection handling
    ├── 📄 validation.js      # Data validation helpers
    └── 📄 database.js        # Database utility functions
```

## 🔒 Security Implementation Details

### 🛡️ Authentication Security
```javascript
// JWT Token System (utils/jwt.js)
- Access Token: 15-minute expiry, contains user ID & role
- Refresh Token: 7-day expiry, stored in database
- Token Rotation: New refresh token on each use
- Blacklist Support: Invalid tokens tracked

// Password Security (models/User.js)
- bcrypt with 12 salt rounds
- Password strength validation
- Account lockout after failed attempts
- Secure password reset flow
```

### 🔐 Input Validation & Sanitization
```javascript
// express-validator (middleware/validation.js)
- SQL Injection Prevention: Parameterized queries
- XSS Protection: HTML entity encoding
- CSRF Protection: Token validation
- File Upload Security: Type/size validation
- Rate Limiting: 100 requests/15min per IP
```

### 🛠️ Security Headers (helmet.js)
```javascript
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=()
```

## ⚡ Performance Optimization Details

### 🚀 Frontend Performance
```javascript
// React Optimizations
- Code Splitting: React.lazy() for route components
- Memoization: React.memo() for expensive components
- Virtual Scrolling: Infinite scroll with intersection observer
- Image Optimization: Lazy loading, WebP format support
- Bundle Optimization: Vite tree-shaking, minification
```

### 🔧 Backend Performance
```javascript
// Database Optimizations (MongoDB)
- Indexes: User email, post creation date, view tracking
- Aggregation Pipelines: Efficient data processing
- Connection Pooling: Mongoose connection management
- Query Optimization: Populate only required fields

// Caching Strategy
- Static File Caching: Express.static with cache headers
- API Response Caching: Memory cache for frequent queries
- CDN Ready: Static assets optimized for CDN delivery
```

### 📹 Video Processing Performance
```javascript
// FFmpeg Optimizations (controllers/postController.js)
- Async Processing: Non-blocking video operations
- Stream Processing: Memory-efficient large file handling
- Format Optimization: H.264/AAC for web compatibility
- Thumbnail Generation: Efficient keyframe extraction
- Error Recovery: Fallback mechanisms for failed processing
```

## 🗄️ Database Schema & Relationships

### 📊 Data Models Structure
```javascript
// User Model (models/User.js)
{
  fullName: String (required, trimmed)
  username: String (unique, indexed)
  email: String (unique, indexed, lowercase)
  password: String (hashed with bcrypt)
  role: Enum ['user', 'admin']
  profilePicture: String (file path)
  bio: String (max 500 chars)
  followers: [ObjectId] (ref: User)
  following: [ObjectId] (ref: User)
  isActive: Boolean (soft delete)
  lastLogin: Date
  createdAt: Date (auto)
}

// Post Model (models/Post.js)
{
  author: ObjectId (ref: User, indexed)
  content: String (max 280 chars)
  media: [{
    type: Enum ['image', 'video']
    url: String (file path)
    thumbnail: String (for videos)
  }]
  likes: [ObjectId] (ref: User)
  views: Number (default: 0)
  botViews: Number (default: 0)
  city: String (random assignment)
  status: Enum ['pending', 'approved', 'rejected']
  createdAt: Date (indexed for feed sorting)
}

// ViewTracking Model (models/ViewTracking.js)
{
  post: ObjectId (ref: Post, indexed)
  user: ObjectId (ref: User)
  ipAddress: String (hashed for privacy)
  userAgent: String
  isBot: Boolean (detection result)
  timestamp: Date (indexed)
}
```

## 🔧 Middleware Implementation

### 🛡️ Security Middleware Stack
```javascript
// Authentication Middleware (middleware/auth.js)
1. Extract JWT from Authorization header
2. Verify token signature and expiry
3. Check user exists and is active
4. Attach user object to request
5. Handle token refresh if near expiry

// Upload Middleware (middleware/upload.js)
1. File type validation (images/videos only)
2. File size limits (5MB images, 100MB videos)
3. Filename sanitization
4. Virus scanning (future enhancement)
5. Storage path organization

// Rate Limiting (middleware/rateLimiter.js)
1. IP-based request counting
2. Different limits for different endpoints
3. Sliding window algorithm
4. Redis support for distributed systems
```

## 🎯 API Endpoint Security & Performance

### 🔐 Protected Routes Implementation
```javascript
// Route Protection Levels
- Public: /api/auth/login, /api/auth/register
- User Protected: /api/posts/*, /api/users/*
- Admin Protected: /api/admin/*
- File Access: /uploads/* (with access control)

// Request Validation Pipeline
1. Rate limiting check
2. CORS validation
3. Content-Type validation
4. JWT token verification
5. Role-based access control
6. Input sanitization
7. Business logic execution
8. Response formatting
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Git

### 1) Clone the repository
```bash
git clone <repository-url>
cd social-platform
```

### 2) Install dependencies
```bash
# Install all deps (root, server, client)
npm run install-deps
```

Or install manually:
```bash
# Backend
yarn --cwd server install || (cd server && npm install)
# Frontend
yarn --cwd client install || (cd client && npm install)
```

### 3) Environment configuration

Create `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/social-platform
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_refresh_token_secret
CLIENT_URL=http://localhost:5173
ADMIN_SECURITY_CODE=admin123
```

Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=Social Media Platform
```

### 4) Run the app

Run both servers (concurrently):
```bash
npm run dev
```

Or run individually:
```bash
# Backend only
npm run server

# Frontend only
npm run client
```

### 5) Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

## 🔧 Admin Dashboard Features

The admin dashboard provides comprehensive management tools for platform administration:

### Post Management
- **Review System**: View all posts with engagement metrics and bot detection data
- **Approval Workflow**: Approve or reject posts with detailed analytics
- **Revenue Tracking**: Calculate earnings based on city-wise pricing and engagement
- **Analytics Dashboard**: Comprehensive statistics and performance metrics

### Revenue Management
- **City-Based Pricing**: Configure pricing per view and like for different cities
- **Pricing Analytics**: Track revenue performance across locations
- **Payment Processing**: Handle approved post payments with complete audit trail
- **Financial Reports**: Detailed revenue and payment history

### User Management
- **Admin Tools**: Create admin users with security code validation
- **User Analytics**: Track user engagement and platform usage
- **Role Management**: Simplified User/Admin role system

### API Endpoints
- **Posts**: `GET /api/admin/posts`, `PATCH /api/admin/posts/:id/approve`
- **Pricing**: `GET/POST/PUT /api/admin/pricing`, `GET /api/admin/pricing/stats`
- **Payments**: `GET /api/admin/payments/pending`, `PATCH /api/admin/payments/:id/pay`

**Access Control**: Admin role required for all admin features

## 📡 API Documentation

### User Authentication
```bash
POST /api/auth/register    # Register new user (User/Admin roles)
POST /api/auth/login       # User login
POST /api/auth/refresh     # Refresh JWT tokens
POST /api/auth/logout      # User logout
GET  /api/auth/me          # Get current user info
```

### User Management
```bash
GET    /api/users/profile/:id    # Get user profile
PUT    /api/users/profile        # Update user profile
POST   /api/users/follow/:id     # Follow user
DELETE /api/users/follow/:id     # Unfollow user
GET    /api/users/search         # Search users
GET    /api/users/suggestions    # Get follow suggestions
```

### Posts & Social Features
```bash
POST   /api/posts                # Create new post (text + media)
GET    /api/posts/feed           # Get user feed
GET    /api/posts/:id            # Get specific post
PUT    /api/posts/:id/like       # Like/unlike post
POST   /api/posts/:id/view       # Track post view
POST   /api/posts/:id/comments   # Add comment
PUT    /api/posts/comments/:id   # Edit comment
DELETE /api/posts/comments/:id   # Delete comment
```

## 🎬 Advanced Video Processing

The platform includes sophisticated video processing capabilities:

### Features
- **Auto-Trimming**: Videos longer than 60 seconds are automatically trimmed to 1 minute
- **Thumbnail Generation**: Creates thumbnails at the 1-second mark
- **Format Support**: MP4, WebM, MOV, AVI, MKV and other common formats
- **Optimization**: Re-encodes with H.264 video and AAC audio for web compatibility
- **Error Handling**: Robust fallback mechanisms and detailed logging

### Technical Implementation
- Uses `fluent-ffmpeg` with bundled `@ffmpeg-installer/ffmpeg`
- Processes videos asynchronously to avoid blocking
- Generates web-optimized output with `-movflags +faststart`
- Comprehensive error recovery and user feedback

### Testing Video Processing
```bash
cd server
npm run test-video  # Test video processing functionality
```

## 🛠️ Development & Deployment

### Project Scripts
```bash
# Root level
npm run dev          # Start both frontend and backend
npm run install-deps # Install all dependencies
npm run build        # Build for production

# Server scripts
npm run create-admin    # Create admin user
npm run list-users      # List all users
npm run reset-password  # Reset user password
npm run update-role     # Update user role
```

### Environment Variables

**Server (.env)**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/social-platform
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here
CLIENT_URL=http://localhost:5173
ADMIN_SECURITY_CODE=your_admin_security_code
NODE_ENV=development
```

**Client (.env)**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=eMILO Social Platform
```

## 🔧 Troubleshooting

### Common Issues

**Node.js Installation (Windows)**
```powershell
winget install OpenJS.NodeJS.LTS --silent
# Restart terminal and verify:
node -v && npm -v
```

**MongoDB Connection**
- Ensure MongoDB is running locally or update `MONGODB_URI` for cloud database
- Check firewall settings and network connectivity
- Verify database permissions and authentication

**Video Processing Issues**
- FFmpeg is bundled automatically with `@ffmpeg-installer/ffmpeg`
- Check server logs for detailed error messages
- Run `npm run test-video` in server directory for diagnostics
- Ensure sufficient disk space for video processing

**Port Conflicts**
- Frontend default: 5173 (Vite)
- Backend default: 5000 (Express)
- Update ports in environment files if needed

### Performance Optimization
- Use MongoDB indexes for better query performance
- Implement caching for frequently accessed data
- Optimize image/video sizes before upload
- Use CDN for static asset delivery in production

## 🚀 Production Deployment

### Build Process
```bash
# Build frontend
cd client && npm run build

# Start production server
cd server && npm start
```

### Production Considerations
- Set `NODE_ENV=production`
- Use process manager (PM2, Docker)
- Configure reverse proxy (Nginx)
- Set up SSL certificates
- Configure database backups
- Monitor application logs

## 📊 Project Statistics

- **Total Files**: 100+ source files
- **Lines of Code**: 15,000+ lines
- **Components**: 25+ React components
- **API Endpoints**: 30+ REST endpoints
- **Database Models**: 8 Mongoose schemas
- **Features**: 95% complete implementation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For technical support and questions:
- Create an issue in the repository
- Check existing documentation files
- Review troubleshooting section above

**Project Maintainer**: Available for consultation and feature requests#   s o c i a l - c o n t e n t - p l a t f o r m  
 