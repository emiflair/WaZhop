require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Shop = require('../models/Shop');

const fixShopBranding = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    let updatedCount = 0;

    for (const user of users) {
      // Determine if branding should be shown based on plan
      const showBranding = user.plan === 'free';

      // Update all shops for this user
      const result = await Shop.updateMany(
        { owner: user._id },
        { $set: { showBranding: showBranding } }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ Updated ${result.modifiedCount} shops for ${user.name} (${user.plan} plan) - showBranding: ${showBranding}`);
        updatedCount += result.modifiedCount;
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log(`Total shops updated: ${updatedCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

fixShopBranding();
