const mongoose = require('mongoose');
const User = require('../models/User');
const Shop = require('../models/Shop');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

/**
 * Migration: Enforce Free Plan Limits
 * This script will deactivate extra shops for users on free plan
 */

const enforceFreePlanLimits = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Find all users on free plan
    const freeUsers = await User.find({ plan: 'free' });
    console.log(`\n📊 Found ${freeUsers.length} users on Free plan`);

    let updatedUsers = 0;
    let deactivatedShops = 0;

    for (const user of freeUsers) {
      // Get all user's shops sorted by creation date (oldest first)
      const shops = await Shop.find({ owner: user._id }).sort({ createdAt: 1 });

      if (shops.length > 1) {
        console.log(`\n👤 User: ${user.name || user.email}`);
        console.log(`   Plan: ${user.plan}`);
        console.log(`   Shops: ${shops.length}`);

        // Keep the first (oldest) shop active, deactivate the rest
        const [activeShop, ...inactiveShops] = shops;

        console.log(`   ✅ Keeping active: "${activeShop.shopName}"`);

        for (const shop of inactiveShops) {
          if (shop.isActive) {
            shop.isActive = false;
            await shop.save();
            deactivatedShops++;
            console.log(`   ❌ Deactivated: "${shop.shopName}"`);
          }
        }

        // Ensure all shops have branding for free users
        await Shop.updateMany(
          { owner: user._id },
          { $set: { showBranding: true } }
        );

        updatedUsers++;
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Users processed: ${updatedUsers}`);
    console.log(`   Shops deactivated: ${deactivatedShops}`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

enforceFreePlanLimits();
