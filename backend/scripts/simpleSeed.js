require('dotenv').config();
const mongoose = require('mongoose');
const WadaSubstance = require('../models/WadaSubstance');
const substancesData = require('../data/wadaSubstances.json');

async function simpleSeed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        console.log(`Starting to seed ${substancesData.length} substances...`);

        for (let i = 0; i < substancesData.length; i++) {
            const substanceData = substancesData[i];
            try {
                const substance = new WadaSubstance(substanceData);
                await substance.save();
                successCount++;
                
                if (successCount % 50 === 0) {
                    console.log(`Progress: ${successCount}/${substancesData.length} substances seeded`);
                }
            } catch (error) {
                errorCount++;
                errors.push({
                    name: substanceData.name,
                    error: error.message
                });
                console.log(`Error with ${substanceData.name}: ${error.message}`);
            }
        }

        console.log('\n=== SEEDING COMPLETE ===');
        console.log(`Successfully seeded: ${successCount} substances`);
        console.log(`Errors: ${errorCount} substances`);
        console.log(`Total in database: ${await WadaSubstance.countDocuments()}`);

        // Check for testosterone specifically
        const testosterone = await WadaSubstance.findOne({name: 'Testosterone'});
        console.log(`\nTestosterone found: ${!!testosterone}`);
        if (testosterone) {
            console.log(`Testosterone details: ${testosterone.name} - ${testosterone.prohibitionStatus}`);
        }

        // Show category breakdown
        const categories = await WadaSubstance.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        console.log('\n=== CATEGORY BREAKDOWN ===');
        categories.forEach(cat => {
            console.log(`${cat._id}: ${cat.count} substances`);
        });

        if (errors.length > 0) {
            console.log('\n=== ERRORS ===');
            errors.slice(0, 10).forEach(err => {
                console.log(`- ${err.name}: ${err.error}`);
            });
            if (errors.length > 10) {
                console.log(`... and ${errors.length - 10} more errors`);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

simpleSeed();
