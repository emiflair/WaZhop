require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Product = require('../models/Product');

const clearLegacyProductConditions = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const removalQuery = {
      $or: [
        { condition: { $regex: /^brand\s?new$/i } },
        { condition: { $in: ['', null] } }
      ]
    };

    const legacyCount = await Product.countDocuments(removalQuery);
    console.log(`Found ${legacyCount} product(s) with legacy condition values.`);

    if (legacyCount === 0) {
      console.log('No legacy condition values detected. Nothing to update.');
      await mongoose.connection.close();
      process.exit(0);
    }

    const result = await Product.updateMany(removalQuery, { $unset: { condition: '' } });

    console.log(`Cleared condition for ${result.modifiedCount} product(s).`);
    console.log('Sellers will need to re-select a condition the next time they edit these products.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Failed to clear legacy product conditions:', error);
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }
    } catch (closeError) {
      console.error('Failed to close MongoDB connection after error:', closeError);
    }
    process.exit(1);
  }
};

clearLegacyProductConditions();
