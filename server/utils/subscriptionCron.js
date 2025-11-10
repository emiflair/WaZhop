const cron = require('node-cron');
const { checkExpiredSubscriptions } = require('../controllers/subscriptionController');

/**
 * Subscription Cron Jobs
 * Handles automated subscription management tasks
 */

/**
 * Check expired subscriptions every day at 2:00 AM
 * Format: minute hour day month weekday
 */
const startSubscriptionCron = () => {
  // Run daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('[Cron] Running subscription expiry check...');
    const result = await checkExpiredSubscriptions();
    
    if (result.success) {
      console.log(`[Cron] Subscription check completed. Processed ${result.processed} subscriptions.`);
    } else {
      console.error(`[Cron] Subscription check failed:`, result.error);
    }
  });
  
  console.log('✅ Subscription cron job started (runs daily at 2:00 AM)');
  
  // Optional: Run check immediately on startup (useful for development)
  if (process.env.NODE_ENV === 'development') {
    console.log('[Cron] Running initial subscription check (dev mode)...');
    checkExpiredSubscriptions().then(result => {
      if (result.success) {
        console.log(`[Cron] Initial check completed. Processed ${result.processed} subscriptions.`);
      }
    });
  }
};

module.exports = { startSubscriptionCron };
