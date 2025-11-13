const mongoose = require('mongoose');
const Shop = require('../models/Shop');
require('dotenv').config();

/**
 * Migration: Add paymentSettings field to existing shops
 * Run this script to add the paymentSettings structure to all shops
 */

const addPaymentSettings = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wazhop');
    console.log('Connected to MongoDB');

    // Update all shops to include paymentSettings if they don't have it
    const result = await Shop.updateMany(
      { paymentSettings: { $exists: false } },
      {
        $set: {
          paymentSettings: {
            enabled: false,
            provider: null,
            flutterwave: {
              publicKey: null,
              paymentLink: null
            },
            paystack: {
              publicKey: null,
              paymentLink: null
            },
            allowWhatsAppNegotiation: true,
            currency: 'NGN'
          }
        }
      }
    );

    console.log('✅ Migration completed successfully');
    console.log(`📊 Updated ${result.modifiedCount} shops`);
    console.log(`📊 Matched ${result.matchedCount} shops`);

    // Disconnect
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
addPaymentSettings();
