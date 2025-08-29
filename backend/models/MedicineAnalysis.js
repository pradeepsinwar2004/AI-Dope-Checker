const mongoose = require('mongoose');

const medicineAnalysisSchema = new mongoose.Schema({
    medicineName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    normalizedName: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    geminiAnalysis: {
        activeIngredients: [{
            name: String,
            concentration: String,
            purpose: String
        }],
        inactiveIngredients: [String],
        medicalUses: [String],
        commonBrands: [String],
        drugClass: String,
        rawResponse: String
    },
    wadaAnalysis: {
        overallStatus: {
            type: String,
            enum: ['Safe', 'Restricted', 'Prohibited'],
            required: true
        },
        riskLevel: {
            type: String,
            enum: ['Low', 'Medium', 'High'],
            required: true
        },
        foundSubstances: [{
            substance: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'WadaSubstance'
            },
            matchType: {
                type: String,
                enum: ['Exact', 'Partial', 'Alternative', 'Derivative'],
                required: true
            },
            confidence: {
                type: Number,
                min: 0,
                max: 100,
                required: true
            },
            notes: String
        }],
        safeIngredients: [String],
        warnings: [String],
        recommendations: [String]
    },
    analysisMetadata: {
        analysisDate: {
            type: Date,
            default: Date.now
        },
        geminiModel: String,
        analysisVersion: {
            type: String,
            default: '1.0'
        },
        processingTime: Number, // in milliseconds
        confidence: {
            type: Number,
            min: 0,
            max: 100
        }
    },
    userContext: {
        userAgent: String,
        ipAddress: String,
        sessionId: String
    },
    cacheInfo: {
        isCached: {
            type: Boolean,
            default: false
        },
        cacheExpiry: Date,
        lastAccessed: {
            type: Date,
            default: Date.now
        },
        accessCount: {
            type: Number,
            default: 1
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
medicineAnalysisSchema.index({ normalizedName: 1 });
medicineAnalysisSchema.index({ 'wadaAnalysis.overallStatus': 1 });
medicineAnalysisSchema.index({ 'analysisMetadata.analysisDate': -1 });
medicineAnalysisSchema.index({ 'cacheInfo.cacheExpiry': 1 }, { expireAfterSeconds: 0 });

// Virtual for formatted result
medicineAnalysisSchema.virtual('formattedResult').get(function() {
    return {
        medicine: this.medicineName,
        status: this.wadaAnalysis.overallStatus,
        riskLevel: this.wadaAnalysis.riskLevel,
        title: this.getStatusTitle(),
        description: this.getStatusDescription(),
        details: this.getDetailedAnalysis(),
        ingredients: this.getIngredientAnalysis(),
        warnings: this.wadaAnalysis.warnings,
        recommendations: this.wadaAnalysis.recommendations,
        analysisDate: this.analysisMetadata.analysisDate,
        confidence: this.analysisMetadata.confidence
    };
});

// Instance methods
medicineAnalysisSchema.methods.getStatusTitle = function() {
    switch (this.wadaAnalysis.overallStatus) {
        case 'Safe':
            return 'WADA Compliant';
        case 'Restricted':
            return 'Restricted Substance';
        case 'Prohibited':
            return 'WADA Prohibited';
        default:
            return 'Unknown Status';
    }
};

medicineAnalysisSchema.methods.getStatusDescription = function() {
    switch (this.wadaAnalysis.overallStatus) {
        case 'Safe':
            return 'This medicine is safe for athletes and contains no WADA prohibited substances.';
        case 'Restricted':
            return 'This medicine contains substances that are restricted or require monitoring.';
        case 'Prohibited':
            return 'This substance is prohibited by WADA and cannot be used by athletes.';
        default:
            return 'Status could not be determined.';
    }
};

medicineAnalysisSchema.methods.getDetailedAnalysis = function() {
    let details = `${this.medicineName} has been analyzed against the current WADA prohibited list. `;
    
    if (this.wadaAnalysis.foundSubstances.length > 0) {
        const prohibitedCount = this.wadaAnalysis.foundSubstances.filter(s => 
            s.substance && s.substance.prohibitionStatus === 'Prohibited'
        ).length;
        
        if (prohibitedCount > 0) {
            details += `Found ${prohibitedCount} prohibited substance(s). `;
        }
        
        details += `This analysis identified specific ingredients that require attention. `;
    } else {
        details += `No banned substances were found in its composition. `;
    }
    
    details += `This medication is considered ${(this.wadaAnalysis.riskLevel || 'unknown').toLowerCase()} risk for athletes.`;
    
    return details;
};

medicineAnalysisSchema.methods.getIngredientAnalysis = function() {
    const ingredients = [];
    
    // Add found WADA substances with enhanced derivative information
    this.wadaAnalysis.foundSubstances.forEach(found => {
        if (found.substance) {
            let description = '';
            let status = 'safe';
            
            // Determine status based on prohibition
            if (found.substance.prohibitionStatus === 'Prohibited') {
                status = 'danger';
            } else if (found.substance.prohibitionStatus === 'Restricted' || found.substance.prohibitionStatus === 'Monitored') {
                status = 'warning';
            }
            
            // Enhanced description for derivatives
            if (found.matchType === 'Derivative') {
                description = `Contains banned substance: ${found.substance.name}. Derivative/compound of prohibited substance detected.`;
            } else {
                description = `${found.matchType} match - ${found.substance.description || 'WADA listed substance'}`;
            }
            
            ingredients.push({
                name: found.searchTerm || found.substance.name, // Use the actual ingredient name
                status: status,
                description: description,
                matchType: found.matchType,
                bannedSubstance: found.substance.name, // The actual banned substance
                confidence: found.confidence
            });
        }
    });
    
    // Add safe ingredients
    if (this.wadaAnalysis.safeIngredients) {
        this.wadaAnalysis.safeIngredients.forEach(ingredient => {
            ingredients.push({
                name: ingredient,
                status: 'safe',
                description: 'Not on WADA prohibited list',
                matchType: 'Safe'
            });
        });
    }
    
    // If no specific ingredients found, add generic entries from Gemini analysis
    if (ingredients.length === 0) {
        ingredients.push({
            name: 'Active Ingredients',
            status: (this.wadaAnalysis.overallStatus || 'unknown').toLowerCase(),
            description: 'Analyzed against WADA database'
        });
    }
    
    return ingredients;
};

medicineAnalysisSchema.methods.updateAccessInfo = function() {
    this.cacheInfo.lastAccessed = new Date();
    this.cacheInfo.accessCount += 1;
    return this.save();
};

// Static methods
medicineAnalysisSchema.statics.findByMedicineName = function(name) {
    const normalizedName = (name || '').toLowerCase().trim();
    return this.findOne({ 
        normalizedName,
        'cacheInfo.cacheExpiry': { $gt: new Date() }
    }).populate('wadaAnalysis.foundSubstances.substance');
};

medicineAnalysisSchema.statics.getAnalyticsData = function(dateRange = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);
    
    return this.aggregate([
        {
            $match: {
                'analysisMetadata.analysisDate': { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$wadaAnalysis.overallStatus',
                count: { $sum: 1 },
                avgConfidence: { $avg: '$analysisMetadata.confidence' },
                avgProcessingTime: { $avg: '$analysisMetadata.processingTime' }
            }
        }
    ]);
};

medicineAnalysisSchema.statics.getPopularMedicines = function(limit = 10) {
    return this.aggregate([
        {
            $group: {
                _id: '$normalizedName',
                medicine: { $first: '$medicineName' },
                count: { $sum: '$cacheInfo.accessCount' },
                lastAnalyzed: { $max: '$analysisMetadata.analysisDate' },
                status: { $first: '$wadaAnalysis.overallStatus' }
            }
        },
        {
            $sort: { count: -1 }
        },
        {
            $limit: limit
        }
    ]);
};

// Pre-save middleware
medicineAnalysisSchema.pre('save', function(next) {
    if (this.isNew) {
        this.normalizedName = (this.medicineName || '').toLowerCase().trim();
        
        // Set cache expiry (default 30 days)
        if (!this.cacheInfo.cacheExpiry) {
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 30);
            this.cacheInfo.cacheExpiry = expiry;
        }
    }
    next();
});

module.exports = mongoose.model('MedicineAnalysis', medicineAnalysisSchema);
