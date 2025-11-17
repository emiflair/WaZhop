/**
 * Migration: Add renewal tracking fields to User model
 * Run this once to add renewalAttempts, lastRenewalAttempt, and renewalFailureReason
 * to existing users
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const addRenewalTracking = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('📝 Adding renewal tracking fields to users...');
    
    const result = await User.updateMany(
      {
        // Update all users that don't have these fields
        $or: [
          { renewalAttempts: { $exists: false } },
          { lastRenewalAttempt: { $exists: false } },
          { renewalFailureReason: { $exists: false } }
        ]
      },
      {
        $set: {
          renewalAttempts: 0,
          lastRenewalAttempt: null,
          renewalFailureReason: null
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} users`);
    console.log('Migration completed successfully!');

    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
addRenewalTracking();
