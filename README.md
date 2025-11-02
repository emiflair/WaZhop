# 🛍️ WhatsApp Shop Builder (WaShop)

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
washop/
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
- ✅ Public storefront (washop.com/:username)
- ✅ WhatsApp integration for product negotiation

### Subscription Tiers

- **Free:** Up to 10 products, 1 theme, Washop branding
- **Pro (₦2,000/month):** Up to 100 products, custom colors, no branding
- **Premium (₦5,000/month):** Unlimited products, advanced themes, analytics

## License

MIT

## Contact

For support or inquiries, visit [washop.com/contact](https://washop.com/contact)
