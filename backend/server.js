const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { logger, stream } = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const medicineRoutes = require('./routes/medicineRoutes');
const wadaRoutes = require('./routes/wadaRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Compression middleware
app.use(compression());

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// Logging middleware
app.use(morgan('combined', { stream }));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
    });
});

// API routes
app.use('/api/medicines', medicineRoutes);
app.use('/api/wada', wadaRoutes);
app.use('/api/users', userRoutes);

// Welcome route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to AI Dope Checker API',
        version: '1.0.0',
        documentation: '/api/docs',
        health: '/health'
    });
});

// 404 handler
app.use('*', notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Database connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });
        
        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB reconnected');
        });
        
    } catch (error) {
        logger.error('Database connection failed:', error);
        process.exit(1);
    }
};

// Graceful shutdown
const gracefulShutdown = () => {
    logger.info('Received shutdown signal, closing HTTP server...');
    
    mongoose.connection.close(() => {
        logger.info('MongoDB connection closed');
        process.exit(0);
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        
        const server = app.listen(PORT, () => {
            logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
            logger.info(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
            logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
        });
        
        // Handle server errors
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger.error(`Port ${PORT} is already in use`);
            } else {
                logger.error('Server error:', error);
            }
            process.exit(1);
        });
        
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Only start server if this file is run directly
if (require.main === module) {
    startServer();
}

module.exports = app;
