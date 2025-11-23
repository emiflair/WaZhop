/**
 * Migration: Fix User Shop References
 *
 * This migration fixes a critical bug where users had shop references
 * that didn't belong to them. This could happen due to:
 * 1. Referral code issues
 * 2. Population issues
 * 3. Race conditions during registration
 *
 * The fix:
 * - Validates each user's shop reference
 * - Removes shop reference if it doesn't belong to the user
 * - Logs all corrections made
 */

const mongoose = require('mongoose');
const path = require('path');
const User = require('../models/User');
const Shop = require('../models/Shop');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fixUserShopReferences() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all users who have a shop reference
    const usersWithShops = await User.find({ shop: { $exists: true, $ne: null } });
    console.log(`\n📊 Found ${usersWithShops.length} users with shop references`);

    let fixed = 0;
    let correct = 0;
    let errors = 0;

    for (const user of usersWithShops) {
      try {
        // Check if the shop exists
        const shop = await Shop.findById(user.shop);

        if (!shop) {
          console.log(`\n❌ User ${user.email} has reference to non-existent shop ${user.shop}`);
          user.shop = undefined;
          await user.save();
          fixed++;
          continue;
        }

        // Check if the user owns the shop
        if (shop.owner.toString() !== user._id.toString()) {
          console.log(`\n🚨 SECURITY ISSUE: User ${user.email} (${user._id}) has shop ${shop.shopName} (${shop._id}) which belongs to ${shop.owner}`);
          console.log('   Removing incorrect shop reference...');
          user.shop = undefined;
          await user.save();
          fixed++;
        } else {
          correct++;
        }
      } catch (error) {
        console.error(`\n❌ Error processing user ${user.email}:`, error.message);
        errors++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Correct shop references: ${correct}`);
    console.log(`   🔧 Fixed shop references: ${fixed}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n📡 MongoDB connection closed');
  }
}

// Run migration
fixUserShopReferences();
