const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Migration: Add lastExpiryWarning field to User model
 * 
 * This migration adds the lastExpiryWarning field to all existing users
 * to support the new 24-hour warning notification system.
 * 
 * Run: node server/migrations/addLastExpiryWarning.js
 */

const User = require('../models/User');

async function addLastExpiryWarning() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🔄 Adding lastExpiryWarning field to existing users...');

    // Update all users to add the lastExpiryWarning field if it doesn't exist
    const result = await User.updateMany(
      { lastExpiryWarning: { $exists: false } },
      { $set: { lastExpiryWarning: null } }
    );

    console.log(`✅ Migration completed successfully!`);
    console.log(`   - Modified ${result.modifiedCount} users`);
    console.log(`   - Matched ${result.matchedCount} users`);

    // Verify the migration
    const totalUsers = await User.countDocuments();
    const usersWithField = await User.countDocuments({ 
      lastExpiryWarning: { $exists: true } 
    });

    console.log('\n📊 Verification:');
    console.log(`   - Total users: ${totalUsers}`);
    console.log(`   - Users with lastExpiryWarning field: ${usersWithField}`);

    if (totalUsers === usersWithField) {
      console.log('✅ All users have the lastExpiryWarning field');
    } else {
      console.log('⚠️  Some users are missing the field');
    }

    await mongoose.connection.close();
    console.log('\n✅ Migration completed and database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the migration
addLastExpiryWarning();
