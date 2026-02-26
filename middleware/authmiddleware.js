import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../helpers/errorHelper.js';

const authMiddleware = async (req, res, next) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`🔐 [${requestId}] [AUTH MIDDLEWARE] Starting authentication...`);
  console.log(`📨 [${requestId}] [AUTH MIDDLEWARE] Request details:`, {
    path: req.path,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent']?.substring(0, 100)
  });

  let token;

  // Check authorization header
  if (req.headers.authorization) {
    console.log(`📨 [${requestId}] [AUTH MIDDLEWARE] Authorization header present`);
    
    if (req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log(`✅ [${requestId}] [AUTH MIDDLEWARE] Bearer token extracted`);
      console.log(`🔑 [${requestId}] [AUTH MIDDLEWARE] Token length: ${token.length} characters`);
      console.log(`🔑 [${requestId}] [AUTH MIDDLEWARE] Token preview: ${token.substring(0, 30)}...`);
    } else {
      console.log(`⚠️ [${requestId}] [AUTH MIDDLEWARE] Authorization header doesn't start with Bearer`);
      console.log(`📨 [${requestId}] [AUTH MIDDLEWARE] Header value:`, req.headers.authorization.substring(0, 50) + "...");
    }
  } else {
    console.log(`⚠️ [${requestId}] [AUTH MIDDLEWARE] No authorization header found`);
  }

  if (!token) {
    console.log(`❌ [${requestId}] [AUTH MIDDLEWARE] No valid token found`);
    console.log(`⏱️ [${requestId}] [AUTH MIDDLEWARE] Processing time: ${Date.now() - startTime}ms`);
    return next(new AppError('Not authorized to access this route', 401));
  }

  try {
    console.log(`🔍 [${requestId}] [AUTH MIDDLEWARE] Verifying token...`);
    console.log(`🔧 [${requestId}] [AUTH MIDDLEWARE] JWT Secret:`, process.env.JWT_SECRET ? "✅ Configured" : "❌ Missing");
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log(`✅ [${requestId}] [AUTH MIDDLEWARE] Token verified successfully`);
    console.log(`📦 [${requestId}] [AUTH MIDDLEWARE] Decoded token:`, {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      iat: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : null,
      exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null
    });

    // Check token expiration
    if (decoded.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - currentTime;
      
      if (timeUntilExpiry < 0) {
        console.log(`⏰ [${requestId}] [AUTH MIDDLEWARE] ⚠️ TOKEN EXPIRED ⚠️`);
        console.log(`⏰ [${requestId}] [AUTH MIDDLEWARE] Expired ${Math.abs(timeUntilExpiry)} seconds ago`);
      } else {
        console.log(`⏰ [${requestId}] [AUTH MIDDLEWARE] Token expires in ${timeUntilExpiry} seconds`);
        console.log(`⏰ [${requestId}] [AUTH MIDDLEWARE] Expiry time: ${new Date(decoded.exp * 1000).toISOString()}`);
      }
    }

    console.log(`👤 [${requestId}] [AUTH MIDDLEWARE] Fetching user from database...`);
    console.log(`🔍 [${requestId}] [AUTH MIDDLEWARE] User ID: ${decoded.id}`);
    
    const dbStartTime = Date.now();
    req.user = await User.findById(decoded.id).select('-password');
    const dbTime = Date.now() - dbStartTime;
    
    console.log(`⏱️ [${requestId}] [AUTH MIDDLEWARE] Database query time: ${dbTime}ms`);
    
    if (!req.user) {
      console.log(`❌ [${requestId}] [AUTH MIDDLEWARE] User not found in database`);
      console.log(`🔍 [${requestId}] [AUTH MIDDLEWARE] User ID ${decoded.id} does not exist or was deleted`);
      console.log(`⏱️ [${requestId}] [AUTH MIDDLEWARE] Total processing time: ${Date.now() - startTime}ms`);
      return next(new AppError('User not found', 401));
    }

    console.log(`✅ [${requestId}] [AUTH MIDDLEWARE] User found in database`);
    console.log(`📊 [${requestId}] [AUTH MIDDLEWARE] User details:`, {
      id: req.user._id.toString(),
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isActive: req.user.isActive || true,
      createdAt: req.user.createdAt,
      lastActive: req.user.lastActive || 'N/A'
    });

    // Check if user is active
    if (req.user.isActive === false) {
      console.log(`⚠️ [${requestId}] [AUTH MIDDLEWARE] User account is deactivated`);
      console.log(`⏱️ [${requestId}] [AUTH MIDDLEWARE] Total processing time: ${Date.now() - startTime}ms`);
      return next(new AppError('Account deactivated', 403));
    }

    // Update last active timestamp (don't await to not block)
    User.findByIdAndUpdate(decoded.id, { lastActive: new Date() }).catch(err => {
      console.log(`⚠️ [${requestId}] [AUTH MIDDLEWARE] Failed to update lastActive:`, err.message);
    });
    
    const totalTime = Date.now() - startTime;
    console.log(`🎉 [${requestId}] [AUTH MIDDLEWARE] Authentication successful!`);
    console.log(`📝 [${requestId}] [AUTH MIDDLEWARE] Request path: ${req.method} ${req.path}`);
    console.log(`⏱️ [${requestId}] [AUTH MIDDLEWARE] Total processing time: ${totalTime}ms`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ [${requestId}]`);

    next();
  } catch (error) {
    console.log(`❌ [${requestId}] [AUTH MIDDLEWARE] Token verification failed`);
    console.log(`🔍 [${requestId}] [AUTH MIDDLEWARE] Error type: ${error.name}`);
    console.log(`📋 [${requestId}] [AUTH MIDDLEWARE] Error message: ${error.message}`);
    
    if (error.stack) {
      console.log(`📚 [${requestId}] [AUTH MIDDLEWARE] Stack trace:`, error.stack);
    }

    // Specific error handling with detailed messages
    if (error.name === 'JsonWebTokenError') {
      console.log(`⚠️ [${requestId}] [AUTH MIDDLEWARE] Invalid JWT signature or malformed token`);
      
      // Check common JWT issues
      if (token.split('.').length !== 3) {
        console.log(`⚠️ [${requestId}] [AUTH MIDDLEWARE] Token doesn't have the correct format (should have 3 parts)`);
      }
    } else if (error.name === 'TokenExpiredError') {
      console.log(`⚠️ [${requestId}] [AUTH MIDDLEWARE] Token expired at:`, error.expiredAt);
      console.log(`⚠️ [${requestId}] [AUTH MIDDLEWARE] Current time:`, new Date());
    } else if (error.name === 'NotBeforeError') {
      console.log(`⚠️ [${requestId}] [AUTH MIDDLEWARE] Token not active yet. Active from:`, error.date);
    }

    console.log(`⏱️ [${requestId}] [AUTH MIDDLEWARE] Total processing time: ${Date.now() - startTime}ms`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ [${requestId}]`);

    next(new AppError('Invalid token', 401));
  }
};

export default authMiddleware;
