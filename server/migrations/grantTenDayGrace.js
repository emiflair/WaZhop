/**
 * Migration: Grant a 10-day grace period to legacy premium users.
 * Run once to give accounts without an expiry a deadline to upgrade.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const GRACE_DAYS = parseInt(process.env.LEGACY_GRACE_PERIOD_DAYS || '10', 10);

const grantGracePeriod = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const now = new Date();
    const graceExpiry = new Date(now.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000);

    console.log(`🕒 Setting grace period to end on ${graceExpiry.toISOString()}`);

    const legacyUsers = await User.find({
      plan: { $in: ['pro', 'premium'] },
      $or: [
        { planExpiry: { $exists: false } },
        { planExpiry: null }
      ]
    });

    if (!legacyUsers.length) {
      console.log('ℹ️ No legacy premium users found without an expiry.');
      await mongoose.connection.close();
      console.log('👋 Database connection closed');
      process.exit(0);
    }

    for (const user of legacyUsers) {
      user.planExpiry = graceExpiry;
      user.subscriptionStatus = 'active';
      user.lastBillingDate = now;
      user.autoRenew = false;
      user.renewalAttempts = 0;
      user.lastRenewalAttempt = null;
      user.renewalFailureReason = null;

      await user.save();
      console.log(`✅ Granted trial until ${graceExpiry.toISOString()} for ${user.email}`);
    }

    console.log(`🎉 Updated ${legacyUsers.length} users.`);

    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

grantGracePeriod();
