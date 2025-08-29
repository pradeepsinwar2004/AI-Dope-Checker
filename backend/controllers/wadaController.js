const WadaSubstance = require('../models/WadaSubstance');
const wadaAnalysisService = require('../services/wadaAnalysisService');
const { apiLogger, logWada } = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

class WadaController {
    /**
     * Get list of WADA substances with filtering
     * @route GET /api/wada/substances
     */
    getSubstances = asyncHandler(async (req, res) => {
        const {
            category,
            status,
            limit = 50,
            skip = 0,
            sort = 'name'
        } = req.query;

        const query = { isActive: true };

        if (category) query.category = category;
        if (status) query.prohibitionStatus = status;

        const substances = await WadaSubstance.find(query)
            .sort(sort)
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .select('-__v');

        const total = await WadaSubstance.countDocuments(query);

        res.json({
            success: true,
            data: substances,
            pagination: {
                total,
                limit: parseInt(limit),
                skip: parseInt(skip),
                hasMore: skip + substances.length < total
            }
        });
    });

    /**
     * Get specific WADA substance by ID
     * @route GET /api/wada/substances/:id
     */
    getSubstanceById = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const substance = await WadaSubstance.findById(id);

        if (!substance || !substance.isActive) {
            return res.status(404).json({
                success: false,
                error: 'Substance not found'
            });
        }

        res.json({
            success: true,
            data: substance
        });
    });

    /**
     * Search WADA substances
     * @route GET /api/wada/search
     */
    searchSubstances = asyncHandler(async (req, res) => {
        const {
            q: query,
            category,
            status,
            inCompetition,
            limit = 20,
            skip = 0
        } = req.query;

        const searchOptions = {
            category,
            prohibitionStatus: status,
            inCompetition,
            limit: parseInt(limit),
            skip: parseInt(skip)
        };

        const substances = await WadaSubstance.searchSubstances(query, searchOptions);
        const total = await WadaSubstance.countDocuments({
            isActive: true,
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { alternativeNames: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        });

        res.json({
            success: true,
            data: substances,
            query,
            pagination: {
                total,
                limit: parseInt(limit),
                skip: parseInt(skip),
                hasMore: skip + substances.length < total
            }
        });
    });

    /**
     * Get all WADA substance categories
     * @route GET /api/wada/categories
     */
    getCategories = asyncHandler(async (req, res) => {
        const categories = await WadaSubstance.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    prohibited: {
                        $sum: { $cond: [{ $eq: ['$prohibitionStatus', 'Prohibited'] }, 1, 0] }
                    },
                    restricted: {
                        $sum: { $cond: [{ $eq: ['$prohibitionStatus', 'Restricted'] }, 1, 0] }
                    },
                    monitored: {
                        $sum: { $cond: [{ $eq: ['$prohibitionStatus', 'Monitored'] }, 1, 0] }
                    },
                    samples: { $push: '$name' }
                }
            },
            {
                $project: {
                    category: '$_id',
                    count: 1,
                    statusBreakdown: {
                        prohibited: '$prohibited',
                        restricted: '$restricted',
                        monitored: '$monitored'
                    },
                    samples: { $slice: ['$samples', 5] }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.json({
            success: true,
            data: categories
        });
    });

    /**
     * Get WADA database statistics
     * @route GET /api/wada/stats
     */
    getStats = asyncHandler(async (req, res) => {
        const stats = await wadaAnalysisService.getAnalysisStats();

        const recentUpdates = await WadaSubstance.countDocuments({
            isActive: true,
            lastUpdated: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        const thresholdSubstances = await WadaSubstance.countDocuments({
            isActive: true,
            'thresholdLimits.hasThreshold': true
        });

        const tueAvailable = await WadaSubstance.countDocuments({
            isActive: true,
            'therapeuticUseExemption.available': true
        });

        res.json({
            success: true,
            data: {
                ...stats,
                recentUpdates,
                thresholdSubstances,
                tueAvailable,
                lastUpdated: new Date().toISOString()
            }
        });
    });

    /**
     * Find substance by exact name
     * @route GET /api/wada/substance-by-name/:name
     */
    getSubstanceByName = asyncHandler(async (req, res) => {
        const { name } = req.params;

        const substance = await WadaSubstance.findByName(name);

        if (!substance) {
            return res.status(404).json({
                success: false,
                error: 'Substance not found',
                searchTerm: name
            });
        }

        res.json({
            success: true,
            data: substance
        });
    });

    /**
     * Get substances with threshold limits
     * @route GET /api/wada/threshold-substances
     */
    getThresholdSubstances = asyncHandler(async (req, res) => {
        const { limit = 50 } = req.query;

        const substances = await WadaSubstance.find({
            isActive: true,
            'thresholdLimits.hasThreshold': true
        })
            .sort('name')
            .limit(parseInt(limit))
            .select('name category thresholdLimits prohibitionStatus');

        res.json({
            success: true,
            data: substances
        });
    });

    /**
     * Get substances for which TUE is available
     * @route GET /api/wada/tue-available
     */
    getTueAvailableSubstances = asyncHandler(async (req, res) => {
        const { limit = 50 } = req.query;

        const substances = await WadaSubstance.find({
            isActive: true,
            'therapeuticUseExemption.available': true
        })
            .sort('name')
            .limit(parseInt(limit))
            .select('name category therapeuticUseExemption prohibitionStatus');

        res.json({
            success: true,
            data: substances
        });
    });

    /**
     * Get substances prohibited in specific sport
     * @route GET /api/wada/by-sport/:sport
     */
    getSubstancesBySport = asyncHandler(async (req, res) => {
        const { sport } = req.params;

        const substances = await WadaSubstance.find({
            isActive: true,
            'prohibitionScope.particularSports': { $regex: sport, $options: 'i' }
        })
            .sort('name')
            .select('name category prohibitionScope prohibitionStatus');

        res.json({
            success: true,
            data: substances,
            sport
        });
    });

    /**
     * Get recently updated substances
     * @route GET /api/wada/recent-updates
     */
    getRecentUpdates = asyncHandler(async (req, res) => {
        const { days = 30, limit = 20 } = req.query;

        const cutoffDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

        const substances = await WadaSubstance.find({
            isActive: true,
            lastUpdated: { $gte: cutoffDate }
        })
            .sort({ lastUpdated: -1 })
            .limit(parseInt(limit))
            .select('name category prohibitionStatus lastUpdated');

        res.json({
            success: true,
            data: substances,
            period: `${days} days`
        });
    });

    /**
     * Check multiple ingredients against WADA database
     * @route POST /api/wada/check-ingredients
     */
    checkIngredients = asyncHandler(async (req, res) => {
        const { ingredients } = req.body;

        const results = [];

        for (const ingredient of ingredients) {
            const matches = await WadaSubstance.searchSubstances(ingredient, { limit: 3 });
            
            let status = 'Safe';
            let matchedSubstance = null;

            if (matches.length > 0) {
                const exactMatch = matches.find(substance =>
                    substance.name.toLowerCase() === ingredient.toLowerCase() ||
                    substance.alternativeNames.some(alt =>
                        alt.toLowerCase() === ingredient.toLowerCase()
                    )
                );

                if (exactMatch) {
                    matchedSubstance = exactMatch;
                    status = exactMatch.prohibitionStatus;
                }
            }

            results.push({
                ingredient,
                status,
                matchedSubstance: matchedSubstance ? {
                    id: matchedSubstance._id,
                    name: matchedSubstance.name,
                    category: matchedSubstance.category,
                    prohibitionStatus: matchedSubstance.prohibitionStatus
                } : null,
                potentialMatches: matches.slice(0, 3).map(s => ({
                    id: s._id,
                    name: s.name,
                    category: s.category
                }))
            });
        }

        res.json({
            success: true,
            data: results,
            summary: {
                total: ingredients.length,
                safe: results.filter(r => r.status === 'Safe').length,
                restricted: results.filter(r => r.status === 'Restricted').length,
                prohibited: results.filter(r => r.status === 'Prohibited').length
            }
        });
    });

    /**
     * Get substances similar to specified one
     * @route GET /api/wada/similar/:id
     */
    getSimilarSubstances = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { limit = 10 } = req.query;

        const substance = await WadaSubstance.findById(id);

        if (!substance) {
            return res.status(404).json({
                success: false,
                error: 'Substance not found'
            });
        }

        const similar = await WadaSubstance.find({
            isActive: true,
            _id: { $ne: id },
            $or: [
                { category: substance.category },
                { subcategory: substance.subcategory }
            ]
        })
            .sort('name')
            .limit(parseInt(limit))
            .select('name category subcategory prohibitionStatus');

        res.json({
            success: true,
            data: similar,
            reference: {
                id: substance._id,
                name: substance.name,
                category: substance.category
            }
        });
    });

    // Admin methods (would require authentication in production)

    /**
     * Create new WADA substance
     * @route POST /api/wada/substances
     */
    createSubstance = asyncHandler(async (req, res) => {
        const substanceData = req.body;

        const newSubstance = new WadaSubstance(substanceData);
        await newSubstance.save();

        logWada('Substance created', {
            id: newSubstance._id,
            name: newSubstance.name,
            category: newSubstance.category
        });

        res.status(201).json({
            success: true,
            data: newSubstance,
            message: 'Substance created successfully'
        });
    });

    /**
     * Update WADA substance
     * @route PUT /api/wada/substances/:id
     */
    updateSubstance = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;

        const substance = await WadaSubstance.findByIdAndUpdate(
            id,
            { ...updateData, lastUpdated: new Date() },
            { new: true, runValidators: true }
        );

        if (!substance) {
            return res.status(404).json({
                success: false,
                error: 'Substance not found'
            });
        }

        logWada('Substance updated', {
            id: substance._id,
            name: substance.name,
            changes: Object.keys(updateData)
        });

        res.json({
            success: true,
            data: substance,
            message: 'Substance updated successfully'
        });
    });

    /**
     * Delete WADA substance
     * @route DELETE /api/wada/substances/:id
     */
    deleteSubstance = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const substance = await WadaSubstance.findByIdAndUpdate(
            id,
            { isActive: false, lastUpdated: new Date() },
            { new: true }
        );

        if (!substance) {
            return res.status(404).json({
                success: false,
                error: 'Substance not found'
            });
        }

        logWada('Substance deactivated', {
            id: substance._id,
            name: substance.name
        });

        res.json({
            success: true,
            message: 'Substance deactivated successfully'
        });
    });
}

module.exports = new WadaController();
