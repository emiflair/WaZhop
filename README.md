# 🛍️ WhatsApp Shop Builder (WaZhop)

> Create your store. Customize it. Share your WhatsApp link. Sell smarter.

## Overview

WhatsApp Shop Builder is a web platform that empowers small businesses and individual sellers to create their own online storefronts — directly linked to their WhatsApp accounts for easy product negotiation and sales.

## Tech Stack

- **Frontend:** React.js (Vite) + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MongoDB Atlas
- **Authentication:** JWT (JSON Web Tokens)
- **Cloud Storage:** Cloudinary
- **Hosting:** Vercel (Frontend) + Render/Railway (Backend)

## Project Structure

```
wazhop/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── utils/
│   └── package.json
├── server/          # Node.js backend
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── middlewares/
│   ├── config/
│   └── server.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB Atlas account
- Cloudinary account

### Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Configure your environment variables
npm run dev
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

## Features

### MVP (Phase 1)
- ✅ User authentication (signup/login)
- ✅ Seller dashboard
- ✅ Store customization (colors, logo, banner)
- ✅ Product management (CRUD)
- ✅ Public storefront (wazhop.com/:username)
- ✅ WhatsApp integration for product negotiation
- ✅ Payment integration (Flutterwave & Paystack) - Premium only
- ✅ Shopping cart and checkout
- ✅ Product reviews and ratings
- ✅ Mobile-responsive design
- ✅ PWA support (Add to Home Screen)
- ✅ Referral program
- ✅ IP-based currency detection

### Subscription Tiers

- **Free:** Up to 4 products, 1 shop, basic themes, WaZhop branding, WhatsApp checkout only
- **Pro (₦9,000/month):** Up to 100 products, 2 shops, inventory management, custom colors, no branding, custom subdomain, advanced analytics
- **Premium (₦18,000/month):** Unlimited products, 3 shops, payment integration (Flutterwave/Paystack), custom domain, advanced analytics, priority support

## License

MIT

## Contact

For support or inquiries, visit [wazhop.com/contact](https://wazhop.com/contact)
