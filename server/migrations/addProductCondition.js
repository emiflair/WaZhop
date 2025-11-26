/**
 * Migration: Add condition field to existing products
 * Sets default condition to 'brand new' for all products without a condition
 */

const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const addProductCondition = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all products without a condition field
    const result = await Product.updateMany(
      { condition: { $exists: false } },
      { $set: { condition: 'brand new' } }
    );

    console.log(`✅ Updated ${result.modifiedCount} products with default condition 'brand new'`);

    // Also update any products with null or empty condition
    const nullResult = await Product.updateMany(
      { $or: [{ condition: null }, { condition: '' }] },
      { $set: { condition: 'brand new' } }
    );

    console.log(`✅ Updated ${nullResult.modifiedCount} products with null/empty condition`);

    // Verify the changes
    const totalProducts = await Product.countDocuments();
    const productsWithCondition = await Product.countDocuments({ condition: { $in: ['brand new', 'used'] } });
    
    console.log(`📊 Total products: ${totalProducts}`);
    console.log(`📊 Products with condition: ${productsWithCondition}`);
    
    if (totalProducts === productsWithCondition) {
      console.log('✅ All products now have a condition field!');
    } else {
      console.log(`⚠️  ${totalProducts - productsWithCondition} products still missing condition`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the migration
addProductCondition();
