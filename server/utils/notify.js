const BASE_URL_BREVO = 'https://api.brevo.com/v3';

// Use native fetch (Node 18+). Build a tiny provider-agnostic layer so we can swap vendors.
async function sendEmail({
  to, subject, html, fromEmail, fromName
}) {
  const provider = (process.env.EMAIL_PROVIDER || 'brevo').toLowerCase();
  if (provider === 'brevo') {
    const apiKey = process.env.BREVO_API_KEY;
    const sender = {
      email: fromEmail || process.env.BREVO_SENDER_EMAIL,
      name: fromName || process.env.BREVO_SENDER_NAME || 'WaZhop'
    };
    if (!apiKey || !sender.email) {
      console.warn('[notify] Missing Brevo credentials (BREVO_API_KEY/BREVO_SENDER_EMAIL). Email not sent.');
      return { ok: false, skipped: true };
    }
    const resp = await fetch(`${BASE_URL_BREVO}/smtp/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        sender, to: [{ email: to }], subject, htmlContent: html
      })
    });
    if (!resp.ok) {
      const text = await resp.text();
      console.error('[notify] Brevo email error', resp.status, text);
      return { ok: false };
    }
    return { ok: true };
  }
  // No-op fallback
  console.warn(`[notify] EMAIL_PROVIDER=${provider} not implemented. Skipping.`);
  return { ok: false, skipped: true };
}

async function sendSMS({ to, text }) {
  const provider = (process.env.SMS_PROVIDER || 'none').toLowerCase();

  if (provider === 'brevo') {
    const apiKey = process.env.BREVO_API_KEY;
    const sender = process.env.BREVO_SMS_SENDER || 'WaZhop';
    if (!apiKey) {
      console.warn('[notify] Missing Brevo API key for SMS.');
      return { ok: false, skipped: true };
    }
    const resp = await fetch(`${BASE_URL_BREVO}/transactionalSMS/sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify({
        sender, recipient: to, content: text, type: 'transactional'
      })
    });
    if (!resp.ok) {
      const textResp = await resp.text();
      console.error('[notify] Brevo SMS error', resp.status, textResp);
      return { ok: false };
    }
    return { ok: true };
  }

  if (provider === 'twilio') {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.warn('[notify] Missing Twilio credentials.');
      return { ok: false, skipped: true };
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`
      },
      body: new URLSearchParams({
        To: to,
        From: fromNumber,
        Body: text
      })
    });

    if (!resp.ok) {
      const textResp = await resp.text();
      console.error('[notify] Twilio SMS error', resp.status, textResp);
      return { ok: false };
    }
    return { ok: true };
  }

  if (provider === 'africastalking') {
    const apiKey = process.env.AFRICASTALKING_API_KEY;
    const username = process.env.AFRICASTALKING_USERNAME;
    const sender = process.env.AFRICASTALKING_SENDER_ID || 'WaZhop';

    if (!apiKey || !username) {
      console.warn('[notify] Missing Africa\'s Talking credentials.');
      return { ok: false, skipped: true };
    }

    const url = 'https://api.africastalking.com/version1/messaging';

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        apiKey: apiKey,
        Accept: 'application/json'
      },
      body: new URLSearchParams({
        username: username,
        to: to,
        message: text,
        from: sender
      })
    });

    if (!resp.ok) {
      const textResp = await resp.text();
      console.error('[notify] Africa\'s Talking SMS error', resp.status, textResp);
      return { ok: false };
    }
    return { ok: true };
  }

  console.warn(`[notify] SMS_PROVIDER=${provider} not implemented. Skipping.`);
  return { ok: false, skipped: true };
}

module.exports = { sendEmail, sendSMS };
