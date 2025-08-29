const { apiLogger, logError, logSecurity } = require('../utils/logger');

/**
 * Global error handling middleware
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (error, req, res, next) => {
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal Server Error';
    
    // Log the error with context
    logError(error, {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
        statusCode
    });
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
        // Mongoose validation error
        statusCode = 400;
        message = 'Validation Error';
        const validationErrors = Object.values(error.errors).map(err => ({
            field: err.path,
            message: err.message,
            value: err.value
        }));
        
        return res.status(statusCode).json({
            success: false,
            error: message,
            details: validationErrors,
            timestamp: new Date().toISOString()
        });
    }
    
    if (error.name === 'CastError') {
        // Mongoose cast error (e.g., invalid ObjectId)
        statusCode = 400;
        message = 'Invalid ID format';
        
        return res.status(statusCode).json({
            success: false,
            error: message,
            details: `Invalid ${error.path}: ${error.value}`,
            timestamp: new Date().toISOString()
        });
    }
    
    if (error.code === 11000) {
        // MongoDB duplicate key error
        statusCode = 409;
        message = 'Duplicate Entry';
        const field = Object.keys(error.keyValue)[0];
        const value = error.keyValue[field];
        
        return res.status(statusCode).json({
            success: false,
            error: message,
            details: `${field} '${value}' already exists`,
            timestamp: new Date().toISOString()
        });
    }
    
    if (error.name === 'JsonWebTokenError') {
        // JWT error
        statusCode = 401;
        message = 'Invalid token';
        
        return res.status(statusCode).json({
            success: false,
            error: message,
            details: 'Please provide a valid authentication token',
            timestamp: new Date().toISOString()
        });
    }
    
    if (error.name === 'TokenExpiredError') {
        // JWT expired error
        statusCode = 401;
        message = 'Token expired';
        
        return res.status(statusCode).json({
            success: false,
            error: message,
            details: 'Authentication token has expired',
            timestamp: new Date().toISOString()
        });
    }
    
    if (error.message.includes('Gemini')) {
        // Gemini API errors
        statusCode = 503;
        message = 'AI Service Unavailable';
        
        return res.status(statusCode).json({
            success: false,
            error: message,
            details: 'The AI analysis service is currently unavailable. Please try again later.',
            retryAfter: 60,
            timestamp: new Date().toISOString()
        });
    }
    
    if (error.message.includes('rate limit')) {
        // Rate limiting errors
        statusCode = 429;
        message = 'Too Many Requests';
        
        return res.status(statusCode).json({
            success: false,
            error: message,
            details: 'Rate limit exceeded. Please try again later.',
            retryAfter: error.retryAfter || 60,
            timestamp: new Date().toISOString()
        });
    }
    
    // Default error response
    const errorResponse = {
        success: false,
        error: statusCode >= 500 ? 'Internal Server Error' : message,
        timestamp: new Date().toISOString()
    };
    
    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = error.stack;
        errorResponse.details = error.message;
    } else if (statusCode < 500) {
        // Include original message for client errors
        errorResponse.details = message;
    }
    
    // Add request ID if available
    if (req.id) {
        errorResponse.requestId = req.id;
    }
    
    // Security headers for error responses
    res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
    });
    
    res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const notFoundHandler = (req, res) => {
    logSecurity('404 Not Found', {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referrer: req.get('Referrer')
    });
    
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
        availableEndpoints: {
            health: 'GET /health',
            medicines: 'POST /api/medicines/check',
            wadaSubstances: 'GET /api/wada/substances',
            documentation: 'GET /api/docs'
        },
        timestamp: new Date().toISOString()
    });
};

/**
 * Async error wrapper
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Custom error class
 */
class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();
        
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Create a custom error
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {AppError} Custom error instance
 */
const createError = (message, statusCode = 500) => {
    return new AppError(message, statusCode);
};

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    AppError,
    createError
};
