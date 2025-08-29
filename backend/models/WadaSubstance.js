const mongoose = require('mongoose');

const wadaSubstanceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: [
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
        ]
    },
    subcategory: {
        type: String,
        trim: true
    },
    alternativeNames: [{
        type: String,
        trim: true
    }],
    casNumber: {
        type: String,
        trim: true
    },
    prohibitionStatus: {
        type: String,
        required: true,
        enum: ['Prohibited', 'Restricted', 'Monitored'],
        default: 'Prohibited'
    },
    prohibitionScope: {
        inCompetition: {
            type: Boolean,
            default: true
        },
        outOfCompetition: {
            type: Boolean,
            default: false
        },
        particularSports: [{
            type: String,
            trim: true
        }]
    },
    thresholdLimits: {
        hasThreshold: {
            type: Boolean,
            default: false
        },
        urineThreshold: {
            value: Number,
            unit: String,
            description: String
        },
        bloodThreshold: {
            value: Number,
            unit: String,
            description: String
        }
    },
    therapeuticUseExemption: {
        available: {
            type: Boolean,
            default: false
        },
        conditions: [String],
        requirements: [String]
    },
    description: {
        type: String,
        trim: true
    },
    medicalUses: [String],
    sideEffects: [String],
    detectionWindow: {
        urine: String,
        blood: String,
        hair: String
    },
    wadaCode: {
        type: String,
        trim: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better search performance
wadaSubstanceSchema.index({ name: 'text', alternativeNames: 'text', description: 'text' });
wadaSubstanceSchema.index({ category: 1, subcategory: 1 });
wadaSubstanceSchema.index({ prohibitionStatus: 1 });
wadaSubstanceSchema.index({ wadaCode: 1 }, { unique: true, sparse: true });

// Virtual for full prohibition status
wadaSubstanceSchema.virtual('fullProhibitionStatus').get(function() {
    const scope = [];
    if (this.prohibitionScope.inCompetition) scope.push('In-Competition');
    if (this.prohibitionScope.outOfCompetition) scope.push('Out-of-Competition');
    
    return {
        status: this.prohibitionStatus,
        scope: scope.length > 0 ? scope : ['All Times'],
        sports: this.prohibitionScope.particularSports
    };
});

// Virtual for search terms
wadaSubstanceSchema.virtual('searchTerms').get(function() {
    const terms = [this.name, ...this.alternativeNames];
    if (this.casNumber) terms.push(this.casNumber);
    return terms.map(term => term.toLowerCase());
});

// Instance method to check if substance is prohibited for specific context
wadaSubstanceSchema.methods.isProhibitedFor = function(context = {}) {
    const { inCompetition = true, sport = null } = context;
    
    if (this.prohibitionStatus === 'Prohibited') {
        if (inCompetition && this.prohibitionScope.inCompetition) return true;
        if (!inCompetition && this.prohibitionScope.outOfCompetition) return true;
        
        if (sport && this.prohibitionScope.particularSports.includes(sport)) {
            return true;
        }
    }
    
    return false;
};

// Static method to search substances
wadaSubstanceSchema.statics.searchSubstances = function(query, options = {}) {
    const {
        category = null,
        prohibitionStatus = null,
        inCompetition = null,
        limit = 50,
        skip = 0
    } = options;
    
    const searchCriteria = {
        isActive: true,
        $or: [
            { name: { $regex: query, $options: 'i' } },
            { alternativeNames: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { casNumber: { $regex: query, $options: 'i' } }
        ]
    };
    
    if (category) searchCriteria.category = category;
    if (prohibitionStatus) searchCriteria.prohibitionStatus = prohibitionStatus;
    if (inCompetition !== null) {
        searchCriteria['prohibitionScope.inCompetition'] = inCompetition;
    }
    
    return this.find(searchCriteria)
        .sort({ name: 1 })
        .limit(limit)
        .skip(skip);
};

// Static method to get substance by name or alternative name
wadaSubstanceSchema.statics.findByName = function(name) {
    return this.findOne({
        isActive: true,
        $or: [
            { name: { $regex: `^${name}$`, $options: 'i' } },
            { alternativeNames: { $regex: `^${name}$`, $options: 'i' } }
        ]
    });
};

// Pre-save middleware
wadaSubstanceSchema.pre('save', function(next) {
    // Ensure alternative names don't include the main name
    if (this.alternativeNames) {
        this.alternativeNames = this.alternativeNames.filter(
            name => name.toLowerCase() !== this.name.toLowerCase()
        );
    }
    
    // Update lastUpdated
    this.lastUpdated = new Date();
    next();
});

module.exports = mongoose.model('WadaSubstance', wadaSubstanceSchema);
