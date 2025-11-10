#!/usr/bin/env node
/* eslint-env node */
// Quick SMS send test via configured provider (Brevo or Termii).
// Usage: node scripts/test-sms.js +2348012345678 "Message text"

require('dotenv').config();
const { sendSMS } = require('../utils/notify');

async function main() {
  const to = process.argv[2];
  const msg = process.argv[3] || 'This is a WaZhop SMS test.';
  if (!to) {
    console.error('Usage: node scripts/test-sms.js <phoneE164> [message]');
    process.exit(1);
  }

  console.log('Testing SMS with:');
  console.log('  To:', to);
  console.log('  Provider:', process.env.SMS_PROVIDER || 'none');

  try {
    const res = await sendSMS({ to, text: msg });
    if (res && res.ok) {
      console.log('✅ SMS sent successfully');
      process.exit(0);
    } else if (res && res.skipped) {
      console.warn('⚠️ SMS sending skipped (missing or unsupported provider settings).');
      process.exit(2);
    } else {
      console.error('❌ SMS send failed. Check logs above for details.');
      process.exit(3);
    }
  } catch (err) {
    console.error('❌ Error sending SMS:', err.message);
    process.exit(4);
  }
}

main();
