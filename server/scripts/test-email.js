#!/usr/bin/env node
/* eslint-env node */
// Quick Brevo email send test.
// Usage: node scripts/test-email.js you@example.com "Subject" "HTML body (optional)"

require('dotenv').config();
const { sendEmail } = require('../utils/notify');

async function main() {
  const to = process.argv[2] || process.env.ADMIN_EMAIL;
  const subject = process.argv[3] || 'WaZhop email verification test';
  const htmlBody = process.argv[4] || '<p>This is a test from WaZhop backend.</p>';

  if (!to) {
    console.error('Usage: node scripts/test-email.js <toEmail> [subject] [html]');
    console.error('Hint: ADMIN_EMAIL is set to', process.env.ADMIN_EMAIL || '(not set)');
    process.exit(1);
  }

  console.log('Testing Brevo email with:');
  console.log('  To:', to);
  console.log('  Subject:', subject);
  console.log('  Sender:', process.env.BREVO_SENDER_EMAIL, '-', process.env.BREVO_SENDER_NAME || 'WaZhop');

  try {
    const res = await sendEmail({ to, subject, html: htmlBody });
    if (res && res.ok) {
      console.log('✅ Email sent successfully via provider');
      process.exit(0);
    } else if (res && res.skipped) {
      console.warn('⚠️ Email sending skipped (missing or unsupported provider settings).');
      process.exit(2);
    } else {
      console.error('❌ Email send failed. Check logs above for details.');
      process.exit(3);
    }
  } catch (err) {
    console.error('❌ Error sending email:', err.message);
    process.exit(4);
  }
}

main();
