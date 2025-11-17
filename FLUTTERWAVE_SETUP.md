# Flutterwave Payment Integration Setup Guide

## 🎉 What's Been Integrated

Your WaZhop platform now has **full Flutterwave payment integration** for subscription plans (Pro & Premium). Users can now pay securely using:
- Credit/Debit Cards
- Bank Transfers
- USSD
- Mobile Money

---

## 📋 Setup Instructions

### Step 1: Get Your Flutterwave API Keys

1. **Sign up/Login** to [Flutterwave Dashboard](https://dashboard.flutterwave.com/)
2. Navigate to **Settings → API**
3. Copy your:
   - **Public Key** (starts with `FLWPUBK_TEST-` for test mode)
   - **Secret Key** (starts with `FLWSECK_TEST-` for test mode)

> ⚠️ **Important**: Start with TEST keys during development. Switch to LIVE keys only when ready for production.

---

### Step 2: Configure Environment Variables

#### **Client Side** (`/client/.env`)

Create or update your `.env` file:

```bash
VITE_API_URL=http://localhost:5000/api
VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-your-public-key-here
```

#### **Server Side** (`/server/.env`)

Add to your server `.env`:

```bash
# Flutterwave Payment Configuration
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-your-public-key-here
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-your-secret-key-here
```

---

### Step 3: Restart Your Servers

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend  
cd client
npm run dev
```

---

## 🧪 Testing the Integration

### Test Mode (Using Test Cards)

Flutterwave provides test cards for testing payments:

| Card Number | CVV | Expiry | PIN | OTP | Result |
|------------|-----|--------|-----|-----|--------|
| 5531886652142950 | 564 | 09/32 | 3310 | 12345 | Success |
| 4187427415564246 | 828 | 09/32 | - | 12345 | Success |

**Test Process:**
1. Go to your subscription page
2. Click "Upgrade to Pro" or "Upgrade to Premium"
3. Select Monthly or Yearly billing
4. Click "Proceed to Payment"
5. Use test card details above
6. Complete the payment flow
7. Your plan should upgrade automatically!

---

## 🔄 Payment Flow

```
User clicks "Upgrade to Pro"
    ↓
Selects billing period (Monthly/Yearly)
    ↓
Applies coupon code (optional)
    ↓
Reviews order summary
    ↓
Clicks "Proceed to Payment"
    ↓
Flutterwave payment modal opens
    ↓
User completes payment
    ↓
Backend verifies payment with Flutterwave
    ↓
User plan upgraded automatically
    ↓
Success notification shown
```

---

## 💰 Pricing Configuration

Current prices (in NGN):

| Plan | Monthly | Yearly | Yearly Savings |
|------|---------|--------|----------------|
| Pro | ₦9,000 | ₦75,600 | ₦32,400 (30% off) |
| Premium | ₦18,000 | ₦151,200 | ₦64,800 (30% off) |

To modify prices, update:
- **Frontend**: `client/src/pages/dashboard/Subscription.jsx` (lines 78-196)
- **Backend**: `server/controllers/subscriptionController.js` (lines ~60 and ~360)

---

## 🔐 Security Features

✅ **Payment Verification**: All payments verified server-side with Flutterwave  
✅ **Amount Validation**: Server checks payment amount matches expected price  
✅ **Transaction Reference**: Each payment has unique reference for tracking  
✅ **No Direct Payment**: Client never handles sensitive payment data  
✅ **Coupon Support**: Discounts applied and verified before payment  

---

## 🚀 Going Live (Production)

### Before Switching to Live Mode:

1. **Complete Flutterwave KYC**: Submit business documents
2. **Get Live API Keys**: From Flutterwave Dashboard → Settings → API
3. **Update Environment Variables**: Replace TEST keys with LIVE keys
4. **Test Thoroughly**: Use real small amounts first
5. **Configure Webhooks** (optional): For automated notifications

### Update Live Keys:

```bash
# Client .env
VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-your-live-public-key

# Server .env
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-your-live-public-key
FLUTTERWAVE_SECRET_KEY=FLWSECK-your-live-secret-key
```

---

## 📱 What Happens After Payment?

1. **Plan Upgrade**: User's plan immediately upgraded
2. **Expiry Date Set**: Based on billing period (30 days or 365 days)
3. **Features Unlocked**: All plan features become available
4. **Database Updated**: User record saved with new subscription details
5. **Coupon Applied**: If used, coupon usage recorded

---

## 🐛 Troubleshooting

### "Payment verification failed"
- Check if `FLUTTERWAVE_SECRET_KEY` is set in server `.env`
- Verify secret key is correct and hasn't expired
- Check server logs for detailed error

### "Transaction not found"
- Payment may not have completed on Flutterwave's side
- Check Flutterwave dashboard for transaction status
- Ask user to retry payment

### "Amount mismatch"
- Ensure frontend and backend prices are synchronized
- Check if coupon discount calculation matches on both sides

### Payment modal doesn't open
- Verify `VITE_FLUTTERWAVE_PUBLIC_KEY` is set in client `.env`
- Check browser console for errors
- Ensure public key is valid

---

## 📞 Support & Resources

- **Flutterwave Docs**: https://developer.flutterwave.com/docs
- **Test Cards**: https://developer.flutterwave.com/docs/integration-guides/testing-helpers
- **Dashboard**: https://dashboard.flutterwave.com/
- **Support**: support@flutterwave.com

---

## ✅ Integration Checklist

- [ ] Flutterwave account created
- [ ] Test API keys obtained
- [ ] Environment variables configured (client & server)
- [ ] Servers restarted with new env vars
- [ ] Test payment completed successfully
- [ ] User plan upgraded after test payment
- [ ] Coupon codes tested (if using)
- [ ] Ready for production with live keys

---

## 📝 Next Steps

1. **Test the integration** using test cards
2. **Create coupon codes** for promotions (optional)
3. **Complete Flutterwave KYC** for live payments
4. **Switch to live keys** when ready
5. **Monitor transactions** in Flutterwave dashboard

---

**Built with ❤️ for WaZhop**
