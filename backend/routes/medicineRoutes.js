const express = require('express');
const { body, param, query } = require('express-validator');
const rateLimit = require('express-rate-limit');

const medicineController = require('../controllers/medicineController');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// Rate limiting for medicine checking (more restrictive)
const checkMedicineLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    message: {
        error: 'Too many medicine check requests. Please wait a moment before trying again.',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Validation schemas
const checkMedicineValidation = [
    body('medicine')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Medicine name is required and must be between 1-200 characters')
        .matches(/^[a-zA-Z0-9\s\-_().,]+$/)
        .withMessage('Medicine name contains invalid characters'),
    
    body('context.inCompetition')
        .optional()
        .isBoolean()
        .withMessage('inCompetition must be a boolean'),
    
    body('context.sport')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Sport name must be less than 50 characters'),
    
    body('options.useCache')
        .optional()
        .isBoolean()
        .withMessage('useCache must be a boolean'),
    
    body('options.forceRecheck')
        .optional()
        .isBoolean()
        .withMessage('forceRecheck must be a boolean')
];

const getAnalysisValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid analysis ID')
];

const searchAnalysisValidation = [
    query('query')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be between 1-100 characters'),
    
    query('status')
        .optional()
        .isIn(['Safe', 'Restricted', 'Prohibited'])
        .withMessage('Status must be Safe, Restricted, or Prohibited'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1-100'),
    
    query('skip')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Skip must be a non-negative integer')
];

// Routes

/**
 * @route   POST /api/medicines/check
 * @desc    Check medicine against WADA database
 * @access  Public
 * @body    { medicine: string, context?: object, options?: object }
 */
router.post('/check', 
    checkMedicineLimit,
    checkMedicineValidation,
    validateRequest,
    medicineController.checkMedicine.bind(medicineController)
);

/**
 * @route   GET /api/medicines/analysis/:id
 * @desc    Get specific medicine analysis by ID
 * @access  Public
 */
router.get('/analysis/:id',
    getAnalysisValidation,
    validateRequest,
    medicineController.getAnalysis.bind(medicineController)
);

/**
 * @route   GET /api/medicines/search
 * @desc    Search medicine analyses
 * @access  Public
 * @query   { query?, status?, limit?, skip? }
 */
router.get('/search',
    searchAnalysisValidation,
    validateRequest,
    medicineController.searchAnalyses.bind(medicineController)
);

/**
 * @route   GET /api/medicines/popular
 * @desc    Get most frequently checked medicines
 * @access  Public
 * @query   { limit? }
 */
router.get('/popular',
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1-50'),
    validateRequest,
    medicineController.getPopularMedicines.bind(medicineController)
);

/**
 * @route   GET /api/medicines/analytics
 * @desc    Get medicine checking analytics
 * @access  Public
 * @query   { days? }
 */
router.get('/analytics',
    query('days')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('Days must be between 1-365'),
    validateRequest,
    medicineController.getAnalytics.bind(medicineController)
);

/**
 * @route   POST /api/medicines/batch-check
 * @desc    Check multiple medicines at once
 * @access  Public
 * @body    { medicines: string[], context?: object }
 */
router.post('/batch-check',
    rateLimit({
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 3, // 3 batch requests per 5 minutes
        message: {
            error: 'Too many batch requests. Please wait before trying again.',
            retryAfter: 300
        }
    }),
    body('medicines')
        .isArray({ min: 1, max: 10 })
        .withMessage('Must provide 1-10 medicines to check'),
    body('medicines.*')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Each medicine name must be between 1-200 characters'),
    validateRequest,
    medicineController.batchCheckMedicines.bind(medicineController)
);

/**
 * @route   DELETE /api/medicines/analysis/:id
 * @desc    Delete medicine analysis (admin only)
 * @access  Admin
 */
router.delete('/analysis/:id',
    getAnalysisValidation,
    validateRequest,
    // TODO: Add admin authentication middleware
    medicineController.deleteAnalysis.bind(medicineController)
);

/**
 * @route   PUT /api/medicines/analysis/:id/refresh
 * @desc    Refresh medicine analysis
 * @access  Public
 */
router.put('/analysis/:id/refresh',
    getAnalysisValidation,
    validateRequest,
    medicineController.refreshAnalysis.bind(medicineController)
);

/**
 * @route   GET /api/medicines/categories
 * @desc    Get medicine categories and statistics
 * @access  Public
 */
router.get('/categories', medicineController.getCategories.bind(medicineController));

/**
 * @route   POST /api/medicines/feedback
 * @desc    Submit feedback on medicine analysis
 * @access  Public
 * @body    { analysisId: string, feedback: object }
 */
router.post('/feedback',
    body('analysisId')
        .isMongoId()
        .withMessage('Invalid analysis ID'),
    body('feedback.rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1-5'),
    body('feedback.comment')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Comment must be less than 500 characters'),
    body('feedback.isAccurate')
        .optional()
        .isBoolean()
        .withMessage('isAccurate must be a boolean'),
    validateRequest,
    medicineController.submitFeedback.bind(medicineController)
);

/**
 * @route   DELETE /api/medicines/cache/:medicine
 * @desc    Clear cache for a specific medicine (for testing)
 * @access  Public
 */
router.delete('/cache/:medicine', medicineController.clearCache.bind(medicineController));

module.exports = router;
