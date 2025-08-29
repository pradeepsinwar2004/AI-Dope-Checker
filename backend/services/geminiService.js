const { GoogleGenerativeAI } = require('@google/generative-ai');
const { geminiLogger } = require('../utils/logger');

class GeminiService {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY environment variable is required');
        }
        
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        // Configuration
        this.generationConfig = {
            temperature: 0.2,
            topK: 40,
            topP: 0.8,
            maxOutputTokens: 2048,
        };
        
        this.safetySettings = [
            {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
        ];
    }

    /**
     * Analyze medicine composition using Gemini AI
     * @param {string} medicineName - Name of the medicine to analyze
     * @returns {Object} Analysis result with ingredients and medical information
     */
    async analyzeMedicineComposition(medicineName) {
        try {
            const prompt = this.buildAnalysisPrompt(medicineName);
            
            const startTime = Date.now();
            
            const result = await this.model.generateContent(prompt);
            
            const processingTime = Date.now() - startTime;
            
            const response = result.response;
            const text = response.text();
            
            if (!text) {
                throw new Error('Empty response from Gemini API');
            }
            
            // Parse the structured response
            const analysisResult = this.parseGeminiResponse(text);
            
            // Add metadata
            analysisResult.metadata = {
                processingTime,
                model: 'gemini-1.5-flash',
                timestamp: new Date().toISOString(),
                promptLength: prompt.length,
                responseLength: text.length
            };
            
            geminiLogger.info(`Gemini analysis completed for "${medicineName}" in ${processingTime}ms`);
            
            return analysisResult;
            
        } catch (error) {
            geminiLogger.error('Gemini API error:', {
                medicine: medicineName,
                error: error.message,
                stack: error.stack
            });
            
            // Return fallback response
            return this.createFallbackResponse(medicineName, error);
        }
    }

    /**
     * Build the analysis prompt for Gemini
     * @param {string} medicineName - Medicine name
     * @returns {string} Formatted prompt
     */
    buildAnalysisPrompt(medicineName) {
        return `
Analyze the medicine "${medicineName}" and provide detailed information about its composition and medical properties.

Please provide the following information in JSON format:

{
    "medicineName": "${medicineName}",
    "activeIngredients": [
        {
            "name": "ingredient name",
            "concentration": "typical concentration",
            "purpose": "therapeutic purpose"
        }
    ],
    "inactiveIngredients": ["list of inactive ingredients/excipients"],
    "medicalUses": ["primary medical uses and indications"],
    "commonBrands": ["common brand names"],
    "drugClass": "pharmacological drug class",
    "chemicalNames": ["alternative chemical names, synonyms"],
    "routeOfAdministration": ["oral", "injection", "topical", etc.],
    "prescriptionStatus": "prescription or over-the-counter",
    "contraindications": ["major contraindications"],
    "sideEffects": ["common side effects"],
    "mechanismOfAction": "how the drug works",
    "metabolism": "how the drug is metabolized",
    "halfLife": "elimination half-life if known",
    "dosageForm": "tablet, capsule, injection, etc.",
    "therapeuticCategory": "therapeutic category",
    "confidence": "confidence level (0-100) in the analysis"
}

Important notes:
1. Focus on accurate chemical and pharmaceutical information
2. Include all possible alternative names and synonyms
3. Be specific about active ingredients and their concentrations
4. If the medicine name is unclear or could refer to multiple drugs, mention this
5. Provide confidence level based on certainty of information
6. If this is not a recognized medicine, indicate this clearly

Respond only with valid JSON format.`;
    }

    /**
     * Parse Gemini response and extract structured data
     * @param {string} text - Raw response text
     * @returns {Object} Parsed analysis result
     */
    parseGeminiResponse(text) {
        try {
            // Clean up the response text
            let cleanText = text.trim();
            
            // Remove markdown code blocks if present
            cleanText = cleanText.replace(/```json\s*|\s*```/g, '');
            cleanText = cleanText.replace(/```\s*|\s*```/g, '');
            
            // Check if the JSON is incomplete (common with truncated responses)
            if (!cleanText.endsWith('}') && !cleanText.endsWith(']')) {
                geminiLogger.warn('Detected incomplete JSON response, attempting to fix');
                
                // Try to find the last complete object property and close it
                const lastBraceIndex = cleanText.lastIndexOf('}');
                const lastBracketIndex = cleanText.lastIndexOf(']');
                const lastQuoteIndex = cleanText.lastIndexOf('"');
                
                if (lastBraceIndex > -1 || lastBracketIndex > -1) {
                    // Truncate to last complete structure
                    const cutIndex = Math.max(lastBraceIndex, lastBracketIndex);
                    cleanText = cleanText.substring(0, cutIndex + 1);
                } else if (lastQuoteIndex > -1) {
                    // If we have quotes, try to close incomplete strings
                    cleanText = cleanText.substring(0, lastQuoteIndex + 1);
                    // Add closing brackets/braces as needed
                    const openBraces = (cleanText.match(/\{/g) || []).length;
                    const closeBraces = (cleanText.match(/\}/g) || []).length;
                    const openBrackets = (cleanText.match(/\[/g) || []).length;
                    const closeBrackets = (cleanText.match(/\]/g) || []).length;
                    
                    for (let i = 0; i < (openBrackets - closeBrackets); i++) {
                        cleanText += ']';
                    }
                    for (let i = 0; i < (openBraces - closeBraces); i++) {
                        cleanText += '}';
                    }
                }
            }
            
            // Try to parse JSON
            const parsed = JSON.parse(cleanText);
            
            // Validate required fields
            const required = ['medicineName', 'activeIngredients'];
            for (const field of required) {
                if (!parsed[field]) {
                    geminiLogger.warn(`Missing required field: ${field}`);
                }
            }
            
            // Ensure arrays exist
            parsed.activeIngredients = parsed.activeIngredients || [];
            parsed.inactiveIngredients = parsed.inactiveIngredients || [];
            parsed.medicalUses = parsed.medicalUses || [];
            parsed.commonBrands = parsed.commonBrands || [];
            parsed.chemicalNames = parsed.chemicalNames || [];
            parsed.contraindications = parsed.contraindications || [];
            parsed.sideEffects = parsed.sideEffects || [];
            
            // Set default confidence if not provided
            if (!parsed.confidence || parsed.confidence < 0 || parsed.confidence > 100) {
                parsed.confidence = 75; // Default moderate confidence
            }
            
            return {
                success: true,
                data: parsed,
                rawResponse: text
            };
            
        } catch (error) {
            geminiLogger.error('Failed to parse Gemini response:', {
                error: error.message,
                responseText: text.substring(0, 500) + '...'
            });
            
            // Try to extract key information using regex if JSON parsing fails
            return this.extractInfoWithRegex(text);
        }
    }

    /**
     * Extract information using regex as fallback
     * @param {string} text - Raw response text
     * @returns {Object} Extracted information
     */
    extractInfoWithRegex(text) {
        geminiLogger.info('Attempting regex extraction as fallback');
        
        const extracted = {
            medicineName: '',
            activeIngredients: [],
            inactiveIngredients: [],
            medicalUses: [],
            commonBrands: [],
            chemicalNames: [],
            confidence: 60 // Moderate confidence for regex extraction
        };

        try {
            // Extract medicine name
            const nameMatches = [
                text.match(/["']?medicineName["']?\s*:\s*["']([^"']+)["']/i),
                text.match(/medicine[:\s]+['"]*([^'".\n,]+)['"]*[,\n]/i),
                text.match(/analyzing\s+([^,.\n]+)/i)
            ];
            
            for (const match of nameMatches) {
                if (match) {
                    extracted.medicineName = match[1].trim();
                    break;
                }
            }

            // Extract active ingredients with better patterns
            const ingredientMatches = [
                text.match(/["']?activeIngredients["']?\s*:\s*\[(.*?)\]/s),
                text.match(/active[^:]*ingredients?[:\s]*([^}\]]+)/i),
                text.match(/acetylsalicylic acid|aspirin/i) // Common ingredients
            ];
            
            for (const match of ingredientMatches) {
                if (match) {
                    let ingredientText = match[1] || match[0];
                    
                    // If we found a JSON-like structure, try to parse ingredients
                    if (ingredientText.includes('{')) {
                        const ingredientNames = ingredientText.match(/["']?name["']?\s*:\s*["']([^"']+)["']/g);
                        if (ingredientNames) {
                            extracted.activeIngredients = ingredientNames.map(nameMatch => {
                                const name = nameMatch.match(/["']([^"']+)["']/)[1];
                                return { name: name.trim(), concentration: '', purpose: '' };
                            });
                        }
                    } else {
                        // Simple comma-separated ingredients
                        extracted.activeIngredients = ingredientText
                            .split(/[,;]/)
                            .map(ing => ({ name: ing.trim(), concentration: '', purpose: '' }))
                            .filter(ing => ing.name.length > 0);
                    }
                    break;
                }
            }

            // Extract medical uses
            const usesMatches = [
                text.match(/["']?medicalUses["']?\s*:\s*\[(.*?)\]/s),
                text.match(/(?:used for|treats?|indications?)[:\s]*([^.}]+)/i)
            ];
            
            for (const match of usesMatches) {
                if (match) {
                    let usesText = match[1];
                    if (usesText.includes('"')) {
                        const useMatches = usesText.match(/"([^"]+)"/g);
                        if (useMatches) {
                            extracted.medicalUses = useMatches.map(use => use.replace(/"/g, '').trim());
                        }
                    } else {
                        extracted.medicalUses = usesText
                            .split(/[,;]/)
                            .map(use => use.trim())
                            .filter(use => use.length > 0);
                    }
                    break;
                }
            }

            // Extract confidence if present
            const confidenceMatch = text.match(/["']?confidence["']?\s*:\s*(\d+)/i);
            if (confidenceMatch) {
                extracted.confidence = parseInt(confidenceMatch[1]);
            }

            // If we found some meaningful data, mark as success
            if (extracted.medicineName || extracted.activeIngredients.length > 0) {
                geminiLogger.info('Successfully extracted data using regex fallback', {
                    medicineName: extracted.medicineName,
                    ingredientsFound: extracted.activeIngredients.length,
                    usesFound: extracted.medicalUses.length
                });
                
                return {
                    success: true,
                    data: extracted,
                    rawResponse: text,
                    extractionMethod: 'regex'
                };
            }

            geminiLogger.warn('Regex extraction found minimal data');
            return {
                success: false,
                error: 'Failed to extract meaningful information from response',
                data: extracted,
                rawResponse: text
            };
            
        } catch (regexError) {
            geminiLogger.error('Regex extraction also failed:', regexError);
            return {
                success: false,
                error: 'Both JSON parsing and regex extraction failed',
                data: extracted,
                rawResponse: text
            };
        }
    }

    /**
     * Create fallback response when Gemini API fails
     * @param {string} medicineName - Medicine name
     * @param {Error} error - Original error
     * @returns {Object} Fallback response
     */
    createFallbackResponse(medicineName, error) {
        return {
            success: false,
            data: {
                medicineName: medicineName,
                activeIngredients: [],
                inactiveIngredients: [],
                medicalUses: [],
                commonBrands: [],
                chemicalNames: [medicineName],
                confidence: 0,
                error: 'API analysis failed'
            },
            rawResponse: '',
            error: error.message,
            metadata: {
                processingTime: 0,
                model: 'gemini-1.5-flash',
                timestamp: new Date().toISOString(),
                failed: true
            }
        };
    }

    /**
     * Get API usage statistics
     * @returns {Object} Usage statistics
     */
    getUsageStats() {
        // This would typically track API calls, tokens used, etc.
        return {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            averageResponseTime: 0,
            tokensUsed: 0
        };
    }

    /**
     * Validate API key and connection
     * @returns {boolean} True if API is accessible
     */
    async validateConnection() {
        try {
            const testResult = await this.model.generateContent({
                contents: [{ role: 'user', parts: [{ text: 'Hello, respond with "OK"' }] }],
                generationConfig: { ...this.generationConfig, maxOutputTokens: 10 },
                safetySettings: this.safetySettings,
            });
            
            const response = testResult.response.text();
            return response.toLowerCase().includes('ok');
            
        } catch (error) {
            geminiLogger.error('Gemini API validation failed:', error);
            return false;
        }
    }
}

module.exports = new GeminiService();
