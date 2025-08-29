const WadaSubstance = require('../models/WadaSubstance');
const { wadaLogger } = require('../utils/logger');

class WadaAnalysisService {
    constructor() {
        this.confidenceThresholds = {
            exact: 95,
            high: 85,
            medium: 70,
            low: 50
        };
        
        this.riskLevels = {
            prohibited: 'High',
            restricted: 'Medium',
            safe: 'Low'
        };
    }

    /**
     * Analyze medicine ingredients against WADA database
     * @param {Object} geminiAnalysis - Analysis result from Gemini
     * @param {Object} options - Analysis options
     * @returns {Object} WADA compliance analysis
     */
    async analyzeMedicineCompliance(geminiAnalysis, options = {}) {
        try {
            const { inCompetition = true, sport = null } = options;
            
            wadaLogger.info('Starting WADA compliance analysis', {
                medicine: geminiAnalysis.data.medicineName,
                activeIngredients: geminiAnalysis.data.activeIngredients.length
            });

            // Extract all searchable terms
            const searchTerms = this.extractSearchTerms(geminiAnalysis.data);
            
            // Search for prohibited substances
            const foundSubstances = await this.searchProhibitedSubstances(searchTerms);
            
            // Analyze each found substance
            const analysisResults = await this.analyzeFoundSubstances(
                foundSubstances, 
                searchTerms,
                { inCompetition, sport }
            );
            
            // Determine overall compliance status
            const complianceResult = this.determineComplianceStatus(analysisResults);
            
            // Generate recommendations and warnings
            const recommendations = this.generateRecommendations(analysisResults, complianceResult);
            
            const result = {
                overallStatus: complianceResult.status,
                riskLevel: complianceResult.riskLevel,
                foundSubstances: analysisResults.prohibited.concat(analysisResults.restricted),
                safeIngredients: analysisResults.safe,
                warnings: complianceResult.warnings,
                recommendations: recommendations,
                metadata: {
                    totalIngredientsChecked: searchTerms.length,
                    prohibitedFound: analysisResults.prohibited.length,
                    restrictedFound: analysisResults.restricted.length,
                    safeFound: analysisResults.safe.length,
                    analysisContext: { inCompetition, sport }
                }
            };
            
            wadaLogger.info('WADA analysis completed', {
                medicine: geminiAnalysis.data.medicineName,
                status: result.overallStatus,
                riskLevel: result.riskLevel,
                foundSubstances: result.foundSubstances.length
            });
            
            return result;
            
        } catch (error) {
            wadaLogger.error('WADA analysis failed:', error);
            throw new Error(`WADA analysis failed: ${error.message}`);
        }
    }

    /**
     * Extract searchable terms from Gemini analysis
     * @param {Object} analysisData - Gemini analysis data
     * @returns {Array} Array of search terms
     */
    extractSearchTerms(analysisData) {
        const terms = new Set();
        
        // Add medicine name
        if (analysisData.medicineName) {
            terms.add(analysisData.medicineName.toLowerCase().trim());
        }
        
        // Add active ingredients
        if (analysisData.activeIngredients) {
            analysisData.activeIngredients.forEach(ingredient => {
                if (ingredient.name) {
                    terms.add(ingredient.name.toLowerCase().trim());
                }
            });
        }
        
        // Add chemical names and synonyms
        if (analysisData.chemicalNames) {
            analysisData.chemicalNames.forEach(name => {
                terms.add(name.toLowerCase().trim());
            });
        }
        
        // Add common brands
        if (analysisData.commonBrands) {
            analysisData.commonBrands.forEach(brand => {
                terms.add(brand.toLowerCase().trim());
            });
        }
        
        // Clean and filter terms
        return Array.from(terms)
            .filter(term => term.length > 2) // Ignore very short terms
            .filter(term => !this.isCommonExcipient(term)); // Filter out common inactive ingredients
    }

    /**
     * Search for prohibited substances in WADA database
     * @param {Array} searchTerms - Terms to search for
     * @returns {Array} Found WADA substances
     */
    async searchProhibitedSubstances(searchTerms) {
        const foundSubstances = [];
        
        // Get all active WADA substances for cross-checking
        const allWadaSubstances = await WadaSubstance.find({ isActive: true });
        
        for (const term of searchTerms) {
            try {
                // Method 1: Search by exact name match first
                let substances = await WadaSubstance.find({
                    isActive: true,
                    $or: [
                        { name: { $regex: `^${this.escapeRegex(term)}$`, $options: 'i' } },
                        { alternativeNames: { $regex: `^${this.escapeRegex(term)}$`, $options: 'i' } }
                    ]
                });
                
                // Add exact matches
                substances.forEach(substance => {
                    foundSubstances.push({
                        substance,
                        searchTerm: term,
                        matchType: 'Exact',
                        confidence: this.confidenceThresholds.exact
                    });
                });
                
                // Method 2: Check if any banned substance is contained within the ingredient name
                // This will catch cases like "testosterone propionate" containing "testosterone"
                for (const wadaSubstance of allWadaSubstances) {
                    const bannedName = wadaSubstance.name.toLowerCase();
                    const termLower = term.toLowerCase();
                    
                    // Skip if we already found this substance with exact match
                    const alreadyFound = foundSubstances.some(found => 
                        found.substance._id.equals(wadaSubstance._id)
                    );
                    if (alreadyFound) continue;
                    
                    // Check if the ingredient contains the banned substance name
                    // e.g., "testosterone propionate" contains "testosterone"
                    if (termLower.includes(bannedName) && bannedName.length > 3) {
                        foundSubstances.push({
                            substance: wadaSubstance,
                            searchTerm: term,
                            matchType: 'Derivative',
                            confidence: this.confidenceThresholds.high // High confidence for derivatives
                        });
                    }
                    
                    // Also check alternative names
                    if (wadaSubstance.alternativeNames && wadaSubstance.alternativeNames.length > 0) {
                        for (const altName of wadaSubstance.alternativeNames) {
                            const altNameLower = altName.toLowerCase();
                            if (termLower.includes(altNameLower) && altNameLower.length > 3) {
                                const alreadyFoundAlt = foundSubstances.some(found => 
                                    found.substance._id.equals(wadaSubstance._id)
                                );
                                if (!alreadyFoundAlt) {
                                    foundSubstances.push({
                                        substance: wadaSubstance,
                                        searchTerm: term,
                                        matchType: 'Derivative',
                                        confidence: this.confidenceThresholds.high
                                    });
                                }
                                break; // Only add once per substance
                            }
                        }
                    }
                }
                
                // Method 3: If no exact or derivative matches, try partial matches (original logic)
                if (substances.length === 0 && !foundSubstances.some(f => f.searchTerm === term)) {
                    substances = await WadaSubstance.find({
                        isActive: true,
                        $or: [
                            { name: { $regex: this.escapeRegex(term), $options: 'i' } },
                            { alternativeNames: { $regex: this.escapeRegex(term), $options: 'i' } },
                            { description: { $regex: this.escapeRegex(term), $options: 'i' } }
                        ]
                    }).limit(5);
                    
                    substances.forEach(substance => {
                        // Skip if already found
                        const alreadyFound = foundSubstances.some(found => 
                            found.substance._id.equals(substance._id)
                        );
                        if (alreadyFound) return;
                        
                        const confidence = this.calculateMatchConfidence(term, substance);
                        if (confidence >= this.confidenceThresholds.low) {
                            foundSubstances.push({
                                substance,
                                searchTerm: term,
                                matchType: 'Partial',
                                confidence
                            });
                        }
                    });
                }
                
            } catch (error) {
                wadaLogger.error(`Error searching for term "${term}":`, error);
            }
        }
        
        // Remove duplicates and sort by confidence
        const uniqueSubstances = this.removeDuplicateMatches(foundSubstances);
        return uniqueSubstances.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Analyze found substances for compliance
     * @param {Array} foundSubstances - Substances found in database
     * @param {Array} allTerms - All search terms
     * @param {Object} context - Analysis context
     * @returns {Object} Categorized analysis results
     */
    async analyzeFoundSubstances(foundSubstances, allTerms, context) {
        const results = {
            prohibited: [],
            restricted: [],
            safe: []
        };
        
        // Analyze each found substance
        for (const found of foundSubstances) {
            const { substance, searchTerm, matchType, confidence } = found;
            
            // Check if substance is prohibited in current context
            const isProhibited = substance.isProhibitedFor(context);
            
            const analysisItem = {
                substance: substance._id,
                substanceName: substance.name,
                matchType,
                confidence,
                searchTerm,
                prohibitionScope: substance.fullProhibitionStatus,
                notes: this.generateSubstanceNotes(substance, context, matchType)
            };
            
            if (isProhibited && substance.prohibitionStatus === 'Prohibited') {
                results.prohibited.push(analysisItem);
            } else if (substance.prohibitionStatus === 'Restricted' || substance.prohibitionStatus === 'Monitored') {
                results.restricted.push(analysisItem);
            }
        }
        
        // Identify safe ingredients (those not found in WADA database)
        const foundTerms = foundSubstances.map(f => f.searchTerm.toLowerCase());
        results.safe = allTerms.filter(term => !foundTerms.includes(term.toLowerCase()));
        
        return results;
    }

    /**
     * Determine overall compliance status
     * @param {Object} analysisResults - Analysis results by category
     * @returns {Object} Compliance status determination
     */
    determineComplianceStatus(analysisResults) {
        const { prohibited, restricted } = analysisResults;
        
        let status, riskLevel;
        const warnings = [];
        
        if (prohibited.length > 0) {
            status = 'Prohibited';
            riskLevel = 'High';
            warnings.push('Contains substances prohibited by WADA');
            warnings.push('Use of this medicine could result in a positive doping test');
        } else if (restricted.length > 0) {
            status = 'Restricted';
            riskLevel = 'Medium';
            warnings.push('Contains restricted or monitored substances');
            warnings.push('May require Therapeutic Use Exemption (TUE)');
        } else {
            status = 'Safe';
            riskLevel = 'Low';
        }
        
        return { status, riskLevel, warnings };
    }

    /**
     * Generate recommendations based on analysis
     * @param {Object} analysisResults - Analysis results
     * @param {Object} complianceResult - Compliance determination
     * @returns {Array} Array of recommendations
     */
    generateRecommendations(analysisResults, complianceResult) {
        const recommendations = [];
        
        if (complianceResult.status === 'Prohibited') {
            recommendations.push('Do not use this medicine if you are subject to anti-doping testing');
            recommendations.push('Consult with a sports medicine physician for alternative treatments');
            recommendations.push('Check with your national anti-doping organization');
        } else if (complianceResult.status === 'Restricted') {
            recommendations.push('Consult with a sports medicine physician before use');
            recommendations.push('Consider applying for a Therapeutic Use Exemption (TUE) if medically necessary');
            recommendations.push('Monitor dosage and timing relative to competition');
            recommendations.push('Keep detailed medical records of usage');
        } else {
            recommendations.push('This medicine appears safe for athletes');
            recommendations.push('Always inform your medical team about all medications');
            recommendations.push('Check for updates to the WADA prohibited list regularly');
        }
        
        // Add specific recommendations for threshold substances
        analysisResults.restricted.forEach(item => {
            if (item.substance && item.substance.thresholdLimits && item.substance.thresholdLimits.hasThreshold) {
                recommendations.push(`Monitor ${item.substanceName} levels - threshold limits apply`);
            }
        });
        
        return recommendations;
    }

    /**
     * Calculate match confidence between search term and substance
     * @param {string} term - Search term
     * @param {Object} substance - WADA substance
     * @returns {number} Confidence percentage
     */
    calculateMatchConfidence(term, substance) {
        const termLower = term.toLowerCase();
        const nameLower = substance.name.toLowerCase();
        
        // Exact match
        if (termLower === nameLower) return this.confidenceThresholds.exact;
        
        // Check alternative names
        for (const altName of substance.alternativeNames || []) {
            if (termLower === altName.toLowerCase()) {
                return this.confidenceThresholds.high;
            }
        }
        
        // Partial match scoring
        if (nameLower.includes(termLower)) {
            const ratio = termLower.length / nameLower.length;
            return Math.min(this.confidenceThresholds.high, Math.floor(ratio * 100));
        }
        
        if (termLower.includes(nameLower)) {
            const ratio = nameLower.length / termLower.length;
            return Math.min(this.confidenceThresholds.medium, Math.floor(ratio * 100));
        }
        
        // Description match (lower confidence)
        if (substance.description && substance.description.toLowerCase().includes(termLower)) {
            return this.confidenceThresholds.low;
        }
        
        return 0;
    }

    /**
     * Generate notes for a substance match
     * @param {Object} substance - WADA substance
     * @param {Object} context - Analysis context
     * @param {string} matchType - Type of match
     * @returns {string} Generated notes
     */
    generateSubstanceNotes(substance, context, matchType) {
        const notes = [];
        
        if (matchType === 'Derivative') {
            notes.push(`Contains banned substance: ${substance.name}`);
            notes.push('Derivative/compound of prohibited substance detected');
        } else {
            notes.push(`${matchType} match with WADA database`);
        }
        
        if (substance.prohibitionStatus === 'Prohibited') {
            notes.push('Prohibited substance');
        } else if (substance.prohibitionStatus === 'Restricted') {
            notes.push('Restricted substance - may require TUE');
        }
        
        if (substance.thresholdLimits && substance.thresholdLimits.hasThreshold) {
            notes.push('Threshold limits apply');
        }
        
        if (substance.prohibitionScope.particularSports.length > 0) {
            notes.push(`Specific to: ${substance.prohibitionScope.particularSports.join(', ')}`);
        }
        
        return notes.join('. ');
    }

    /**
     * Remove duplicate substance matches
     * @param {Array} substances - Array of substance matches
     * @returns {Array} Filtered array without duplicates
     */
    removeDuplicateMatches(substances) {
        const seen = new Set();
        return substances.filter(item => {
            const key = item.substance._id.toString();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    /**
     * Check if term is a common excipient (inactive ingredient)
     * @param {string} term - Term to check
     * @returns {boolean} True if common excipient
     */
    isCommonExcipient(term) {
        const commonExcipients = [
            'lactose', 'cellulose', 'starch', 'magnesium stearate',
            'silicon dioxide', 'talc', 'gelatin', 'water',
            'sucrose', 'mannitol', 'sorbitol', 'glycerin',
            'propylene glycol', 'ethanol', 'titanium dioxide',
            'iron oxide', 'povidone', 'croscarmellose sodium'
        ];
        
        return commonExcipients.includes(term.toLowerCase());
    }

    /**
     * Escape special regex characters
     * @param {string} string - String to escape
     * @returns {string} Escaped string
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Get WADA analysis statistics
     * @returns {Object} Analysis statistics
     */
    async getAnalysisStats() {
        try {
            const totalSubstances = await WadaSubstance.countDocuments({ isActive: true });
            
            const statusCounts = await WadaSubstance.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$prohibitionStatus', count: { $sum: 1 } } }
            ]);
            
            const categoryCounts = await WadaSubstance.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$category', count: { $sum: 1 } } }
            ]);
            
            return {
                totalSubstances,
                byStatus: statusCounts.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                byCategory: categoryCounts.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            };
        } catch (error) {
            wadaLogger.error('Failed to get analysis stats:', error);
            throw error;
        }
    }
}

module.exports = new WadaAnalysisService();
