const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const WadaSubstance = require('../models/WadaSubstance');

// Simple console logger replacement
const logger = {
    info: console.log,
    error: console.error
};

/**
 * Seed WADA substances data into MongoDB
 */
async function seedWadaData() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        logger.info('Connected to MongoDB for seeding');

        // Read WADA substances data
        const dataPath = path.join(__dirname, '../data/wadaSubstances.json');
        const rawData = await fs.readFile(dataPath, 'utf8');
        const substances = JSON.parse(rawData);

        logger.info(`Found ${substances.length} substances to seed`);

        // Clear existing data (optional - remove this if you want to preserve existing data)
        const existingCount = await WadaSubstance.countDocuments();
        if (existingCount > 0) {
            console.log(`\nFound ${existingCount} existing substances.`);
            console.log('Do you want to:');
            console.log('1. Replace all existing data');
            console.log('2. Add only new substances');
            console.log('3. Cancel seeding');
            
            // For automation, we'll add only new substances
            logger.info('Adding only new substances (skipping duplicates)');
        }

        // Seed substances
        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        for (const substanceData of substances) {
            try {
                // Check if substance already exists
                const existing = await WadaSubstance.findOne({
                    $or: [
                        { name: { $regex: `^${substanceData.name}$`, $options: 'i' } },
                        { wadaCode: substanceData.wadaCode }
                    ]
                });

                if (existing) {
                    // Update existing substance
                    Object.assign(existing, substanceData);
                    existing.lastUpdated = new Date();
                    await existing.save();
                    updatedCount++;
                    logger.info(`Updated: ${substanceData.name}`);
                } else {
                    // Create new substance
                    const newSubstance = new WadaSubstance(substanceData);
                    await newSubstance.save();
                    addedCount++;
                    logger.info(`Added: ${substanceData.name}`);
                }

            } catch (error) {
                logger.error(`Error processing ${substanceData.name}:`, error.message);
                skippedCount++;
            }
        }

        // Create additional search-friendly entries
        await createSearchAliases();

        // Create indexes for better performance
        await createIndexes();

        // Summary
        logger.info('\n=== SEEDING COMPLETE ===');
        logger.info(`Added: ${addedCount} substances`);
        logger.info(`Updated: ${updatedCount} substances`);
        logger.info(`Skipped: ${skippedCount} substances`);
        logger.info(`Total in database: ${await WadaSubstance.countDocuments()}`);

        // Display categories summary
        const categorySummary = await WadaSubstance.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        logger.info('\n=== CATEGORY SUMMARY ===');
        categorySummary.forEach(cat => {
            logger.info(`${cat._id}: ${cat.count} substances`);
        });

        // Display prohibition status summary
        const statusSummary = await WadaSubstance.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$prohibitionStatus', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        logger.info('\n=== STATUS SUMMARY ===');
        statusSummary.forEach(status => {
            logger.info(`${status._id}: ${status.count} substances`);
        });

    } catch (error) {
        logger.error('Seeding failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        logger.info('Database connection closed');
        process.exit(0);
    }
}

/**
 * Create search aliases for common substance names
 */
async function createSearchAliases() {
    const aliases = [
        {
            name: 'Anavar',
            category: 'Anabolic Agents',
            alternativeNames: ['Oxandrolone', 'Var'],
            prohibitionStatus: 'Prohibited',
            prohibitionScope: { inCompetition: true, outOfCompetition: true },
            description: 'Oral anabolic steroid',
            wadaCode: 'S1.2'
        },
        {
            name: 'Winstrol',
            category: 'Anabolic Agents',
            alternativeNames: ['Stanozolol', 'Winny'],
            prohibitionStatus: 'Prohibited',
            prohibitionScope: { inCompetition: true, outOfCompetition: true },
            description: 'Anabolic steroid derived from dihydrotestosterone',
            wadaCode: 'S1.2'
        },
        {
            name: 'Dianabol',
            category: 'Anabolic Agents',
            alternativeNames: ['Methandrostenolone', 'D-bol'],
            prohibitionStatus: 'Prohibited',
            prohibitionScope: { inCompetition: true, outOfCompetition: true },
            description: 'Oral anabolic steroid',
            wadaCode: 'S1.2'
        }
    ];

    for (const alias of aliases) {
        try {
            const existing = await WadaSubstance.findOne({
                name: { $regex: `^${alias.name}$`, $options: 'i' }
            });

            if (!existing) {
                const newAlias = new WadaSubstance(alias);
                await newAlias.save();
                logger.info(`Added alias: ${alias.name}`);
            }
        } catch (error) {
            logger.error(`Error adding alias ${alias.name}:`, error.message);
        }
    }
}

/**
 * Create database indexes for better performance
 */
async function createIndexes() {
    try {
        await WadaSubstance.createIndexes();
        logger.info('Database indexes created successfully');
    } catch (error) {
        logger.error('Error creating indexes:', error.message);
    }
}

/**
 * Validate seeded data
 */
async function validateData() {
    try {
        const totalSubstances = await WadaSubstance.countDocuments();
        const activeSubstances = await WadaSubstance.countDocuments({ isActive: true });
        const prohibitedSubstances = await WadaSubstance.countDocuments({ 
            prohibitionStatus: 'Prohibited',
            isActive: true 
        });
        
        logger.info('\n=== DATA VALIDATION ===');
        logger.info(`Total substances: ${totalSubstances}`);
        logger.info(`Active substances: ${activeSubstances}`);
        logger.info(`Prohibited substances: ${prohibitedSubstances}`);
        
        // Check for substances without required fields
        const missingNames = await WadaSubstance.countDocuments({ 
            $or: [{ name: { $exists: false } }, { name: '' }]
        });
        
        const missingCategories = await WadaSubstance.countDocuments({
            $or: [{ category: { $exists: false } }, { category: '' }]
        });
        
        if (missingNames > 0) logger.warn(`${missingNames} substances missing names`);
        if (missingCategories > 0) logger.warn(`${missingCategories} substances missing categories`);
        
        if (missingNames === 0 && missingCategories === 0) {
            logger.info('✓ All substances have required fields');
        }
        
    } catch (error) {
        logger.error('Validation failed:', error);
    }
}

// Run seeding if this file is executed directly
if (require.main === module) {
    console.log('🚀 Starting WADA Database Seeding...\n');
    seedWadaData()
        .then(() => validateData())
        .catch(error => {
            console.error('Seeding process failed:', error);
            process.exit(1);
        });
}

module.exports = {
    seedWadaData,
    createSearchAliases,
    createIndexes,
    validateData
};
