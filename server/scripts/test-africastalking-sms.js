#!/usr/bin/env node
/**
 * Test script for Africa's Talking SMS integration
 * Usage: node server/scripts/test-africastalking-sms.js +234XXXXXXXXXX
 */

require('dotenv').config();

const BASE_URL = 'https://api.sandbox.africastalking.com/version1/messaging';

async function testSMS(phoneNumber) {
  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME || 'sandbox';
  const sender = process.env.AFRICASTALKING_SENDER_ID || 'WaZhop';

  if (!apiKey) {
    console.error('❌ AFRICASTALKING_API_KEY not found in .env');
    process.exit(1);
  }

  if (!phoneNumber) {
    console.error('❌ Phone number required');
    console.log('Usage: node server/scripts/test-africastalking-sms.js +234XXXXXXXXXX');
    process.exit(1);
  }

  // Generate test verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const message = `Your WaZhop verification code is ${code}. This is a test message. Code expires in 10 minutes.`;

  console.log('\n🔧 Testing Africa\'s Talking SMS Integration');
  console.log('=====================================');
  console.log(`📱 To: ${phoneNumber}`);
  console.log(`📝 Message: ${message}`);
  console.log(`🔑 API Key: ${apiKey.substring(0, 6)}...`);
  console.log(`👤 Username: ${username}`);
  console.log(`📤 Sender: ${sender}`);
  console.log('=====================================\n');

  try {
    console.log('📡 Sending SMS...');

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        apiKey: apiKey,
        Accept: 'application/json'
      },
      body: new URLSearchParams({
        username: username,
        to: phoneNumber,
        message: message,
        from: sender
      })
    });

    const responseText = await response.text();
    let result;

    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Invalid JSON response:', responseText);
      process.exit(1);
    }

    if (!response.ok) {
      console.error('❌ SMS Failed!');
      console.error('Status:', response.status);
      console.error('Response:', JSON.stringify(result, null, 2));
      process.exit(1);
    }

    console.log('✅ SMS Sent Successfully!');
    console.log('\n📊 Response:');
    console.log(JSON.stringify(result, null, 2));

    if (result.SMSMessageData?.Recipients) {
      result.SMSMessageData.Recipients.forEach((recipient, index) => {
        console.log(`\n📱 Recipient ${index + 1}:`);
        console.log(`   Number: ${recipient.number || recipient.phoneNumber}`);
        console.log(`   Status: ${recipient.status}`);
        console.log(`   StatusCode: ${recipient.statusCode}`);
        console.log(`   MessageId: ${recipient.messageId}`);
        console.log(`   Cost: ${recipient.cost || 'N/A'}`);
      });
    }

    console.log('\n✅ Test completed successfully!');
    console.log('💡 Check your phone for the verification code.\n');
  } catch (error) {
    console.error('❌ Error sending SMS:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    process.exit(1);
  }
}

// Get phone number from command line argument
const phoneNumber = process.argv[2];
testSMS(phoneNumber);
