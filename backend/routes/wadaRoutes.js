const express = require('express');
const { body, param, query } = require('express-validator');

const wadaController = require('../controllers/wadaController');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// Validation schemas
const searchSubstancesValidation = [
    query('q')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query is required and must be between 1-100 characters'),
    
    query('category')
        .optional()
        .isIn([
            'Anabolic Agents',
            'Peptide Hormones',
            'Beta-2 Agonists',
            'Hormone Antagonists',
            'Diuretics',
            'Masking Agents',
            'Stimulants',
            'Narcotics',
            'Cannabinoids',
            'Glucocorticoids',
            'Beta Blockers',
            'Other'
        ])
        .withMessage('Invalid category'),
    
    query('status')
        .optional()
        .isIn(['Prohibited', 'Restricted', 'Monitored'])
        .withMessage('Status must be Prohibited, Restricted, or Monitored'),
    
    query('inCompetition')
        .optional()
        .isBoolean()
        .withMessage('inCompetition must be a boolean'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1-100'),
    
    query('skip')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Skip must be a non-negative integer')
];

const getSubstanceValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid substance ID')
];

const listSubstancesValidation = [
    query('category')
        .optional()
        .isIn([
            'Anabolic Agents',
            'Peptide Hormones',
            'Beta-2 Agonists',
            'Hormone Antagonists',
            'Diuretics',
            'Masking Agents',
            'Stimulants',
            'Narcotics',
            'Cannabinoids',
            'Glucocorticoids',
            'Beta Blockers',
            'Other'
        ])
        .withMessage('Invalid category'),
    
    query('status')
        .optional()
        .isIn(['Prohibited', 'Restricted', 'Monitored'])
        .withMessage('Invalid status'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1-100'),
    
    query('skip')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Skip must be a non-negative integer'),
    
    query('sort')
        .optional()
        .isIn(['name', 'category', 'lastUpdated', '-name', '-category', '-lastUpdated'])
        .withMessage('Invalid sort field')
];

// Routes

/**
 * @route   GET /api/wada/substances
 * @desc    Get list of WADA substances with filtering
 * @access  Public
 * @query   { category?, status?, limit?, skip?, sort? }
 */
router.get('/substances',
    listSubstancesValidation,
    validateRequest,
    wadaController.getSubstances
);

/**
 * @route   GET /api/wada/substances/:id
 * @desc    Get specific WADA substance by ID
 * @access  Public
 */
router.get('/substances/:id',
    getSubstanceValidation,
    validateRequest,
    wadaController.getSubstanceById
);

/**
 * @route   GET /api/wada/search
 * @desc    Search WADA substances
 * @access  Public
 * @query   { q: string, category?, status?, inCompetition?, limit?, skip? }
 */
router.get('/search',
    searchSubstancesValidation,
    validateRequest,
    wadaController.searchSubstances
);

/**
 * @route   GET /api/wada/categories
 * @desc    Get all WADA substance categories with counts
 * @access  Public
 */
router.get('/categories', wadaController.getCategories);

/**
 * @route   GET /api/wada/stats
 * @desc    Get WADA database statistics
 * @access  Public
 */
router.get('/stats', wadaController.getStats);

/**
 * @route   GET /api/wada/substance-by-name/:name
 * @desc    Find substance by exact name or alternative name
 * @access  Public
 */
router.get('/substance-by-name/:name',
    param('name')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Substance name is required and must be between 1-200 characters'),
    validateRequest,
    wadaController.getSubstanceByName
);

/**
 * @route   GET /api/wada/threshold-substances
 * @desc    Get substances with threshold limits
 * @access  Public
 */
router.get('/threshold-substances',
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1-100'),
    validateRequest,
    wadaController.getThresholdSubstances
);

/**
 * @route   GET /api/wada/tue-available
 * @desc    Get substances for which TUE is available
 * @access  Public
 */
router.get('/tue-available',
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1-100'),
    validateRequest,
    wadaController.getTueAvailableSubstances
);

/**
 * @route   GET /api/wada/by-sport/:sport
 * @desc    Get substances prohibited in specific sport
 * @access  Public
 */
router.get('/by-sport/:sport',
    param('sport')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Sport name is required and must be between 1-50 characters'),
    validateRequest,
    wadaController.getSubstancesBySport
);

/**
 * @route   GET /api/wada/recent-updates
 * @desc    Get recently updated substances
 * @access  Public
 */
router.get('/recent-updates',
    query('days')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('Days must be between 1-365'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1-50'),
    validateRequest,
    wadaController.getRecentUpdates
);

/**
 * @route   POST /api/wada/check-ingredients
 * @desc    Check multiple ingredients against WADA database
 * @access  Public
 * @body    { ingredients: string[] }
 */
router.post('/check-ingredients',
    body('ingredients')
        .isArray({ min: 1, max: 20 })
        .withMessage('Must provide 1-20 ingredients to check'),
    body('ingredients.*')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Each ingredient must be between 1-100 characters'),
    validateRequest,
    wadaController.checkIngredients
);

/**
 * @route   GET /api/wada/similar/:id
 * @desc    Get substances similar to the specified one
 * @access  Public
 */
router.get('/similar/:id',
    getSubstanceValidation,
    query('limit')
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage('Limit must be between 1-20'),
    validateRequest,
    wadaController.getSimilarSubstances
);

// Admin routes (would require authentication middleware in production)

/**
 * @route   POST /api/wada/substances
 * @desc    Add new WADA substance (admin only)
 * @access  Admin
 */
router.post('/substances',
    // TODO: Add admin authentication middleware
    body('name')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Name is required and must be between 1-200 characters'),
    body('category')
        .isIn([
            'Anabolic Agents',
            'Peptide Hormones',
            'Beta-2 Agonists',
            'Hormone Antagonists',
            'Diuretics',
            'Masking Agents',
            'Stimulants',
            'Narcotics',
            'Cannabinoids',
            'Glucocorticoids',
            'Beta Blockers',
            'Other'
        ])
        .withMessage('Invalid category'),
    validateRequest,
    wadaController.createSubstance
);

/**
 * @route   PUT /api/wada/substances/:id
 * @desc    Update WADA substance (admin only)
 * @access  Admin
 */
router.put('/substances/:id',
    // TODO: Add admin authentication middleware
    getSubstanceValidation,
    validateRequest,
    wadaController.updateSubstance
);

/**
 * @route   DELETE /api/wada/substances/:id
 * @desc    Delete WADA substance (admin only)
 * @access  Admin
 */
router.delete('/substances/:id',
    // TODO: Add admin authentication middleware
    getSubstanceValidation,
    validateRequest,
    wadaController.deleteSubstance
);

module.exports = router;
