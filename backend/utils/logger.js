const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.prettyPrint()
);

// Define console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        
        // Add metadata if present
        if (Object.keys(meta).length > 0) {
            msg += '\n' + JSON.stringify(meta, null, 2);
        }
        
        return msg;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: {
        service: 'ai-dope-checker-api',
        version: process.env.npm_package_version || '1.0.0'
    },
    transports: [
        // Write all logs with level 'error' and below to error.log
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 10
        }),
        
        // Write all logs with level 'info' and below to combined.log
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 10
        }),
        
        // Write application-specific logs
        new winston.transports.File({
            filename: path.join(logsDir, 'application.log'),
            level: 'info',
            maxsize: 5242880, // 5MB
            maxFiles: 10,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        })
    ],
    
    // Handle exceptions and rejections
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log')
        })
    ],
    
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log')
        })
    ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat,
        level: 'debug'
    }));
}

// Create specific loggers for different components
const createComponentLogger = (component) => {
    return logger.child({ component });
};

// API request logger
const apiLogger = createComponentLogger('api');

// Database logger
const dbLogger = createComponentLogger('database');

// Gemini service logger
const geminiLogger = createComponentLogger('gemini');

// WADA analysis logger
const wadaLogger = createComponentLogger('wada-analysis');

// Performance logger
const performanceLogger = createComponentLogger('performance');

// Security logger
const securityLogger = createComponentLogger('security');

// Custom logging methods
const logAPI = (req, res, responseTime) => {
    const logData = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        contentLength: res.get('Content-Length'),
        referrer: req.get('Referrer')
    };
    
    if (res.statusCode >= 400) {
        apiLogger.warn('API request failed', logData);
    } else {
        apiLogger.info('API request', logData);
    }
};

const logError = (error, context = {}) => {
    logger.error('Application error', {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString()
    });
};

const logSecurity = (event, details = {}) => {
    securityLogger.warn(`Security event: ${event}`, {
        ...details,
        timestamp: new Date().toISOString()
    });
};

const logPerformance = (operation, duration, metadata = {}) => {
    performanceLogger.info(`Performance: ${operation}`, {
        duration: `${duration}ms`,
        ...metadata,
        timestamp: new Date().toISOString()
    });
};

const logGemini = (operation, details = {}) => {
    geminiLogger.info(`Gemini: ${operation}`, {
        ...details,
        timestamp: new Date().toISOString()
    });
};

const logWada = (operation, details = {}) => {
    wadaLogger.info(`WADA: ${operation}`, {
        ...details,
        timestamp: new Date().toISOString()
    });
};

const logDatabase = (operation, details = {}) => {
    dbLogger.info(`Database: ${operation}`, {
        ...details,
        timestamp: new Date().toISOString()
    });
};

// Log application startup
const logStartup = (port, environment) => {
    logger.info('🚀 Application started', {
        port,
        environment,
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        pid: process.pid,
        timestamp: new Date().toISOString()
    });
};

// Log application shutdown
const logShutdown = (reason = 'unknown') => {
    logger.info('🛑 Application shutting down', {
        reason,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
};

// Create a stream for Morgan HTTP logger
const stream = {
    write: (message) => {
        apiLogger.info(message.trim());
    }
};

module.exports = {
    logger,
    apiLogger,
    dbLogger,
    geminiLogger,
    wadaLogger,
    performanceLogger,
    securityLogger,
    createComponentLogger,
    logAPI,
    logError,
    logSecurity,
    logPerformance,
    logGemini,
    logWada,
    logDatabase,
    logStartup,
    logShutdown,
    stream
};
