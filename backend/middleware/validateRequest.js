const { validationResult } = require('express-validator');
const { apiLogger, logSecurity } = require('../utils/logger');

/**
 * Middleware to validate request data using express-validator
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const validationErrors = errors.array().map(error => ({
            field: error.path,
            message: error.msg,
            value: error.value,
            location: error.location
        }));
        
        logSecurity('Validation failed', {
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            errors: validationErrors,
            body: req.body,
            query: req.query,
            params: req.params
        });
        
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            message: 'The request contains invalid data',
            details: validationErrors,
            timestamp: new Date().toISOString()
        });
    }
    
    next();
};

module.exports = validateRequest;
