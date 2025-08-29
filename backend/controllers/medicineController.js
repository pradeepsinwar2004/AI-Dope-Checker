const MedicineAnalysis = require('../models/MedicineAnalysis');
const geminiService = require('../services/geminiService');
const wadaAnalysisService = require('../services/wadaAnalysisService');
const { apiLogger } = require('../utils/logger');

class MedicineController {
    /**
     * Check medicine against WADA database
     * @route POST /api/medicines/check
     */
    async checkMedicine(req, res, next) {
        try {
            const { medicine, context = {}, options = {} } = req.body;
            const { inCompetition = true, sport = null } = context;
            const { useCache = true, forceRecheck = false } = options;

            apiLogger.info('Medicine check requested', {
                medicine,
                context,
                options,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });

            // Pre-validate for obvious nonsense names BEFORE calling Gemini
            const preValidation = this.preValidateMedicineName(medicine);
            if (!preValidation.valid) {
                apiLogger.warn('Invalid medicine name detected (pre-validation)', { medicine, reason: preValidation.reason });
                return res.status(422).json({
                    success: false,
                    error: 'Unknown or invalid medicine',
                    details: preValidation.reason,
                    suggestions: [
                        'Verify the medicine name is spelled correctly',
                        'Try using the brand name or generic name',
                        'Check if this is a real pharmaceutical product'
                    ]
                });
            }

            // Check cache first (unless forced recheck)
            if (useCache && !forceRecheck) {
                const cachedAnalysis = await MedicineAnalysis.findByMedicineName(medicine);
                if (cachedAnalysis) {
                    await cachedAnalysis.updateAccessInfo();
                    apiLogger.info('Returning cached analysis', { medicine });
                    
                    return res.json({
                        success: true,
                        data: cachedAnalysis.formattedResult,
                        cached: true,
                        analysisId: cachedAnalysis._id
                    });
                }
            }

            // Analyze with Gemini AI
            apiLogger.info('Starting Gemini analysis', { medicine });
            const geminiResult = await geminiService.analyzeMedicineComposition(medicine);
            
            if (!geminiResult.success) {
                apiLogger.warn('Gemini analysis failed', { medicine, error: geminiResult.error });
                return res.status(422).json({
                    success: false,
                    error: 'Failed to analyze medicine composition',
                    details: geminiResult.error,
                    suggestions: [
                        'Check medicine name spelling',
                        'Try using the generic name',
                        'Ensure the medicine name is correct'
                    ]
                });
            }

            // Validate if medicine is real/valid based on Gemini analysis
            const isValidMedicine = this.validateMedicineData(geminiResult, medicine);
            if (!isValidMedicine.valid) {
                apiLogger.warn('Invalid or unknown medicine detected', { medicine, reason: isValidMedicine.reason });
                return res.status(422).json({
                    success: false,
                    error: 'Unknown or invalid medicine',
                    details: isValidMedicine.reason,
                    suggestions: [
                        'Verify the medicine name is spelled correctly',
                        'Try using the brand name or generic name',
                        'Check if this is a real pharmaceutical product',
                        'Consult with a healthcare provider for medicine identification'
                    ]
                });
            }

            // Analyze against WADA database
            apiLogger.info('Starting WADA analysis', { medicine });
            const wadaResult = await wadaAnalysisService.analyzeMedicineCompliance(
                geminiResult,
                { inCompetition, sport }
            );

            // Save analysis to database
            const analysisData = {
                medicineName: medicine,
                normalizedName: medicine.toLowerCase().trim(),
                geminiAnalysis: {
                    activeIngredients: geminiResult.data.activeIngredients || [],
                    inactiveIngredients: geminiResult.data.inactiveIngredients || [],
                    medicalUses: geminiResult.data.medicalUses || [],
                    commonBrands: geminiResult.data.commonBrands || [],
                    drugClass: geminiResult.data.drugClass,
                    rawResponse: geminiResult.rawResponse
                },
                wadaAnalysis: wadaResult,
                analysisMetadata: {
                    analysisDate: new Date(),
                    geminiModel: 'gemini-1.5-flash',
                    analysisVersion: '1.0',
                    processingTime: geminiResult.metadata?.processingTime || 0,
                    confidence: geminiResult.data.confidence || 75
                },
                userContext: {
                    userAgent: req.get('User-Agent'),
                    ipAddress: req.ip,
                    sessionId: req.sessionID
                }
            };

            const savedAnalysis = new MedicineAnalysis(analysisData);
            await savedAnalysis.save();

            apiLogger.info('Medicine analysis completed', {
                medicine,
                status: wadaResult.overallStatus,
                analysisId: savedAnalysis._id
            });

            res.json({
                success: true,
                data: savedAnalysis.formattedResult,
                cached: false,
                analysisId: savedAnalysis._id
            });

        } catch (error) {
            apiLogger.error('Medicine check failed:', error);
            next(error);
        }
    }

    /**
     * Get specific medicine analysis
     * @route GET /api/medicines/analysis/:id
     */
    async getAnalysis(req, res, next) {
        try {
            const { id } = req.params;

            const analysis = await MedicineAnalysis.findById(id)
                .populate('wadaAnalysis.foundSubstances.substance');

            if (!analysis) {
                return res.status(404).json({
                    success: false,
                    error: 'Analysis not found'
                });
            }

            await analysis.updateAccessInfo();

            res.json({
                success: true,
                data: analysis.formattedResult,
                analysisId: analysis._id
            });

        } catch (error) {
            apiLogger.error('Failed to get analysis:', error);
            next(error);
        }
    }

    /**
     * Search medicine analyses
     * @route GET /api/medicines/search
     */
    async searchAnalyses(req, res, next) {
        try {
            const { 
                query = '', 
                status = null, 
                limit = 20, 
                skip = 0 
            } = req.query;

            const searchCriteria = {};

            if (query) {
                searchCriteria.$or = [
                    { medicineName: { $regex: query, $options: 'i' } },
                    { normalizedName: { $regex: query, $options: 'i' } }
                ];
            }

            if (status) {
                searchCriteria['wadaAnalysis.overallStatus'] = status;
            }

            const analyses = await MedicineAnalysis.find(searchCriteria)
                .sort({ 'analysisMetadata.analysisDate': -1 })
                .limit(parseInt(limit))
                .skip(parseInt(skip))
                .select('medicineName wadaAnalysis.overallStatus wadaAnalysis.riskLevel analysisMetadata.analysisDate');

            const total = await MedicineAnalysis.countDocuments(searchCriteria);

            res.json({
                success: true,
                data: analyses,
                pagination: {
                    total,
                    limit: parseInt(limit),
                    skip: parseInt(skip),
                    hasMore: skip + analyses.length < total
                }
            });

        } catch (error) {
            apiLogger.error('Search failed:', error);
            next(error);
        }
    }

    /**
     * Get most popular medicines
     * @route GET /api/medicines/popular
     */
    async getPopularMedicines(req, res, next) {
        try {
            const { limit = 10 } = req.query;

            const popular = await MedicineAnalysis.getPopularMedicines(parseInt(limit));

            res.json({
                success: true,
                data: popular
            });

        } catch (error) {
            apiLogger.error('Failed to get popular medicines:', error);
            next(error);
        }
    }

    /**
     * Get analytics data
     * @route GET /api/medicines/analytics
     */
    async getAnalytics(req, res, next) {
        try {
            const { days = 30 } = req.query;

            const analytics = await MedicineAnalysis.getAnalyticsData(parseInt(days));

            // Get total counts
            const totalAnalyses = await MedicineAnalysis.countDocuments({});
            const uniqueMedicines = await MedicineAnalysis.distinct('normalizedName').then(arr => arr.length);

            res.json({
                success: true,
                data: {
                    period: {
                        days: parseInt(days),
                        startDate: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000)
                    },
                    totalAnalyses,
                    uniqueMedicines,
                    statusBreakdown: analytics,
                    trends: analytics // Could be enhanced with time-series data
                }
            });

        } catch (error) {
            apiLogger.error('Failed to get analytics:', error);
            next(error);
        }
    }

    /**
     * Batch check multiple medicines
     * @route POST /api/medicines/batch-check
     */
    async batchCheckMedicines(req, res, next) {
        try {
            const { medicines, context = {} } = req.body;
            
            apiLogger.info('Batch medicine check requested', {
                count: medicines.length,
                medicines: medicines.slice(0, 5), // Log first 5 for debugging
                context
            });

            const results = [];
            const errors = [];

            for (let i = 0; i < medicines.length; i++) {
                try {
                    const medicine = medicines[i];
                    
                    // Check cache first
                    let analysis = await MedicineAnalysis.findByMedicineName(medicine);
                    
                    if (analysis) {
                        await analysis.updateAccessInfo();
                        results.push({
                            medicine,
                            success: true,
                            data: analysis.formattedResult,
                            cached: true
                        });
                    } else {
                        // For batch processing, we'll mark for individual checking
                        results.push({
                            medicine,
                            success: false,
                            requiresIndividualCheck: true,
                            message: 'Please check this medicine individually for detailed analysis'
                        });
                    }
                } catch (error) {
                    errors.push({
                        medicine: medicines[i],
                        error: error.message
                    });
                }
            }

            res.json({
                success: true,
                data: results,
                summary: {
                    total: medicines.length,
                    cached: results.filter(r => r.cached).length,
                    requiresCheck: results.filter(r => r.requiresIndividualCheck).length,
                    errors: errors.length
                },
                errors
            });

        } catch (error) {
            apiLogger.error('Batch check failed:', error);
            next(error);
        }
    }

    /**
     * Refresh medicine analysis
     * @route PUT /api/medicines/analysis/:id/refresh
     */
    async refreshAnalysis(req, res, next) {
        try {
            const { id } = req.params;

            const existingAnalysis = await MedicineAnalysis.findById(id);
            if (!existingAnalysis) {
                return res.status(404).json({
                    success: false,
                    error: 'Analysis not found'
                });
            }

            // Perform fresh analysis
            const geminiResult = await geminiService.analyzeMedicineComposition(
                existingAnalysis.medicineName
            );

            if (!geminiResult.success) {
                return res.status(422).json({
                    success: false,
                    error: 'Failed to refresh analysis',
                    details: geminiResult.error
                });
            }

            const wadaResult = await wadaAnalysisService.analyzeMedicineCompliance(geminiResult);

            // Update existing analysis
            existingAnalysis.geminiAnalysis = {
                activeIngredients: geminiResult.data.activeIngredients || [],
                inactiveIngredients: geminiResult.data.inactiveIngredients || [],
                medicalUses: geminiResult.data.medicalUses || [],
                commonBrands: geminiResult.data.commonBrands || [],
                drugClass: geminiResult.data.drugClass,
                rawResponse: geminiResult.rawResponse
            };
            existingAnalysis.wadaAnalysis = wadaResult;
            existingAnalysis.analysisMetadata.analysisDate = new Date();
            existingAnalysis.analysisMetadata.confidence = geminiResult.data.confidence || 75;

            await existingAnalysis.save();

            apiLogger.info('Analysis refreshed', {
                medicine: existingAnalysis.medicineName,
                analysisId: id
            });

            res.json({
                success: true,
                data: existingAnalysis.formattedResult,
                refreshed: true
            });

        } catch (error) {
            apiLogger.error('Failed to refresh analysis:', error);
            next(error);
        }
    }

    /**
     * Get medicine categories
     * @route GET /api/medicines/categories
     */
    async getCategories(req, res, next) {
        try {
            const categories = await MedicineAnalysis.aggregate([
                {
                    $group: {
                        _id: '$geminiAnalysis.drugClass',
                        count: { $sum: 1 },
                        samples: { $push: '$medicineName' }
                    }
                },
                {
                    $project: {
                        category: '$_id',
                        count: 1,
                        samples: { $slice: ['$samples', 5] }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            res.json({
                success: true,
                data: categories
            });

        } catch (error) {
            apiLogger.error('Failed to get categories:', error);
            next(error);
        }
    }

    /**
     * Submit feedback on analysis
     * @route POST /api/medicines/feedback
     */
    async submitFeedback(req, res, next) {
        try {
            const { analysisId, feedback } = req.body;

            const analysis = await MedicineAnalysis.findById(analysisId);
            if (!analysis) {
                return res.status(404).json({
                    success: false,
                    error: 'Analysis not found'
                });
            }

            // Store feedback (you might want a separate Feedback model)
            // For now, we'll log it
            apiLogger.info('Feedback received', {
                analysisId,
                medicine: analysis.medicineName,
                feedback,
                timestamp: new Date(),
                ip: req.ip
            });

            res.json({
                success: true,
                message: 'Feedback submitted successfully'
            });

        } catch (error) {
            apiLogger.error('Failed to submit feedback:', error);
            next(error);
        }
    }

    /**
     * Delete analysis (admin only)
     * @route DELETE /api/medicines/analysis/:id
     */
    async deleteAnalysis(req, res, next) {
        try {
            const { id } = req.params;

            const analysis = await MedicineAnalysis.findById(id);
            if (!analysis) {
                return res.status(404).json({
                    success: false,
                    error: 'Analysis not found'
                });
            }

            await MedicineAnalysis.findByIdAndDelete(id);

            apiLogger.info('Analysis deleted', {
                analysisId: id,
                medicine: analysis.medicineName,
                deletedBy: req.user?.id || 'system'
            });

            res.json({
                success: true,
                message: 'Analysis deleted successfully'
            });

        } catch (error) {
            apiLogger.error('Failed to delete analysis:', error);
            next(error);
        }
    }

    /**
     * Clear cache for a specific medicine (for testing)
     * @route DELETE /api/medicines/cache/:medicine
     */
    async clearCache(req, res, next) {
        try {
            const { medicine } = req.params;
            const normalizedName = medicine.toLowerCase().trim();

            const result = await MedicineAnalysis.deleteMany({ normalizedName });

            apiLogger.info('Cache cleared for medicine', {
                medicine,
                deletedCount: result.deletedCount
            });

            res.json({
                success: true,
                message: `Cache cleared for ${medicine}`,
                deletedCount: result.deletedCount
            });

        } catch (error) {
            apiLogger.error('Failed to clear cache:', error);
            next(error);
        }
    }

    /**
     * Validate if medicine data from Gemini indicates a real medicine
     * @param {Object} geminiResult - Result from Gemini analysis
     * @param {string} medicineName - Original medicine name
     * @returns {Object} Validation result with valid flag and reason
     */
    validateMedicineData(geminiResult, medicineName) {
        const data = geminiResult.data;
        
        // Only validate based on pharmaceutical data found by Gemini
        const hasActiveIngredients = data.activeIngredients && data.activeIngredients.length > 0;
        const hasMedicalUses = data.medicalUses && data.medicalUses.length > 0;
        const hasDrugClass = data.drugClass && data.drugClass.trim() !== '';
        const hasCommonBrands = data.commonBrands && data.commonBrands.length > 0;
        
        // Check confidence level
        const confidence = data.confidence || 0;
        
        // Only flag as invalid if NO pharmaceutical data found AND very low confidence
        if (!hasActiveIngredients && !hasMedicalUses && !hasDrugClass && !hasCommonBrands && confidence < 20) {
            return {
                valid: false,
                reason: `Unable to identify "${medicineName}" as a known pharmaceutical product. Please verify the medicine name.`
            };
        }
        
        // Additional check: if Gemini explicitly indicates it's not a real medicine
        const rawResponse = geminiResult.rawResponse || '';
        const notMedicineIndicators = [
            'not a medicine',
            'not a pharmaceutical',
            'not a drug',
            'not found',
            'unknown medicine',
            'invalid medicine',
            'not a valid',
            'does not exist'
        ];
        
        for (const indicator of notMedicineIndicators) {
            if (rawResponse.toLowerCase().includes(indicator)) {
                return {
                    valid: false,
                    reason: `"${medicineName}" is not recognized as a valid pharmaceutical product`
                };
            }
        }
        
        return { valid: true };
    }

    /**
     * Pre-validate medicine name for obvious nonsense before Gemini analysis
     * @param {string} medicineName - Medicine name to validate
     * @returns {Object} Validation result
     */
    preValidateMedicineName(medicineName) {
        const nameToCheck = medicineName.toLowerCase().trim();
        
        // Flag obvious nonsense patterns that are clearly not medicine names
        const obviousNonsensePatterns = [
            /^(abcdef|abcdefg|abcdefgh)$/i,  // Literal alphabet sequences
            /^(123456|1234567|12345678)$/i,  // Literal number sequences
            /^(qwerty|qwertyui|asdfgh|zxcvbn)$/i, // Keyboard sequences
            /^(test|testing|dummy|fake|invalid|sample)$/i, // Test words
            /^[a-z]\1{4,}$/i, // Repeated single letters like "aaaaa", "bbbbb"
            /^(xyz|abc|def|hij|klm|nop|rst|uvw)$/i, // Random 3-letter combos
            /^\d{3,}$/,      // Only numbers 3+ digits like "123", "456"
            /^[!@#$%^&*()]{2,}$/, // Only special characters
            /^.{1,2}$/,      // Too short (1-2 characters)
        ];
        
        // Check for obvious nonsense first
        for (const pattern of obviousNonsensePatterns) {
            if (pattern.test(nameToCheck)) {
                return {
                    valid: false,
                    reason: `"${medicineName}" does not appear to be a valid medicine name`
                };
            }
        }
        
        return { valid: true };
    }
}

module.exports = new MedicineController();
