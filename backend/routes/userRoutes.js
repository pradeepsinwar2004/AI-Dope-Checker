const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile (placeholder)
 * @access  Public
 */
router.get('/profile', (req, res) => {
    res.json({
        success: true,
        message: 'User routes are not implemented yet',
        features: [
            'User registration and authentication',
            'Personal medicine cabinet management',
            'Medicine check history',
            'Notification preferences',
            'Profile settings'
        ]
    });
});

/**
 * @route   POST /api/users/register
 * @desc    Register new user (placeholder)
 * @access  Public
 */
router.post('/register', (req, res) => {
    res.json({
        success: false,
        message: 'User registration is not implemented yet',
        note: 'The current version works without user authentication'
    });
});

/**
 * @route   POST /api/users/login
 * @desc    Login user (placeholder)
 * @access  Public
 */
router.post('/login', (req, res) => {
    res.json({
        success: false,
        message: 'User authentication is not implemented yet',
        note: 'The current version works without user authentication'
    });
});

module.exports = router;
