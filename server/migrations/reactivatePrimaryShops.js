/**
 * Migration: Reactivate Primary Shops for Free Plan Users
 * 
 * This migration ensures that every user's first (primary) shop is active,
 * fixing the "Shop Not Found" issue for sellers clicking their shop URLs.
 * 
 * Run this after fixing the planEnforcement.js logic to ensure existing
 * inactive shops are reactivated.
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Shop = require('../models/Shop');
const User = require('../models/User');

async function reactivatePrimaryShops() {
  try {
    console.log('🔄 Starting primary shop reactivation migration...');

    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users`);

    let reactivatedCount = 0;
    let skippedCount = 0;

    // Process all users sequentially
    await Promise.all(users.map(async (user) => {
      // Get user's shops sorted by creation date (oldest first = primary)
      const shops = await Shop.find({ owner: user._id }).sort({ createdAt: 1 });

      if (shops.length === 0) {
        console.log(`⏭️  User ${user.email} has no shops, skipping`);
        skippedCount++;
        return;
      }

      const [primaryShop] = shops;

      // Check if primary shop is inactive
      if (!primaryShop.isActive) {
        const shopInfo = `"${primaryShop.shopName}" (${primaryShop.slug})`;
        console.log(`🔧 Reactivating primary shop for user ${user.email}: ${shopInfo}`);
        
        primaryShop.isActive = true;
        primaryShop.showBranding = user.plan === 'free';
        primaryShop.showWatermark = user.plan === 'free';
        await primaryShop.save();
        
        reactivatedCount++;
      } else {
        console.log(`✅ User ${user.email}'s primary shop "${primaryShop.shopName}" is already active`);
        skippedCount++;
      }
    }));

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Reactivated: ${reactivatedCount} shops`);
    console.log(`⏭️  Skipped (already active): ${skippedCount} users`);
    console.log(`📈 Total processed: ${users.length} users`);
    console.log('\n✅ Migration completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
reactivatePrimaryShops();
