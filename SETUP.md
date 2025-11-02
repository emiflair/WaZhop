# 🚀 WaShop Setup Guide

This guide will help you set up the WhatsApp Shop Builder project on your local machine.

## Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account (free tier)
- Cloudinary account (free tier)
- Git

## Backend Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and configure:

- **MongoDB URI**: Get from MongoDB Atlas
  1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
  2. Create a free cluster
  3. Get connection string and replace in `MONGODB_URI`

- **JWT Secret**: Generate a random string
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- **Cloudinary**: Get from [cloudinary.com](https://cloudinary.com)
  1. Sign up for free account
  2. Go to Dashboard
  3. Copy Cloud Name, API Key, and API Secret

### 3. Start Backend Server

```bash
npm run dev
```

Server runs on http://localhost:5000

## Frontend Setup

### 1. Install Dependencies

```bash
cd client
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

The default configuration points to `http://localhost:5000/api`

### 3. Start Frontend

```bash
npm run dev
```

Frontend runs on http://localhost:5173

## Testing the Application

1. **Register a new account**: Go to http://localhost:5173/register
2. **Login**: Use your credentials
3. **Access Dashboard**: You'll be redirected after login
4. **View your shop**: Check the shop link in dashboard (e.g., http://localhost:5173/your-username)

## Project Structure

```
washop/
├── server/                 # Backend API
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── controllers/       # Route controllers
│   ├── middlewares/       # Auth & validation
│   ├── config/            # Configuration files
│   └── utils/             # Helper functions
├── client/                # React frontend
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── context/      # React context
│   │   └── utils/        # API utilities
│   └── public/           # Static assets
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Shops
- `GET /api/shops/my/shop` - Get current user's shop
- `GET /api/shops/:slug` - Get shop by slug (public)
- `PUT /api/shops/my/shop` - Update shop details
- `PUT /api/shops/my/theme` - Update shop theme
- `POST /api/shops/my/logo` - Upload logo
- `POST /api/shops/my/banner` - Upload banner

### Products
- `GET /api/products/my/products` - Get all products
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get single product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/:id/images` - Upload product images
- `PUT /api/products/my/reorder` - Reorder products

### Subscription
- `GET /api/users/subscription` - Get subscription info
- `POST /api/users/upgrade` - Upgrade plan
- `POST /api/users/downgrade` - Downgrade plan

## Next Steps

1. Expand dashboard pages (Products, Shop Settings, Profile, Subscription)
2. Add image upload functionality
3. Implement drag-and-drop product reordering
4. Add analytics and insights
5. Integrate Paystack for subscription payments
6. Add email notifications
7. Implement admin panel
8. Add SEO optimization
9. Deploy to production (Vercel + Render)

## Deployment

### Backend (Render/Railway)
1. Create account on Render.com or Railway.app
2. Connect GitHub repository
3. Set environment variables
4. Deploy

### Frontend (Vercel)
1. Create account on Vercel.com
2. Import Git repository
3. Set build command: `cd client && npm run build`
4. Set output directory: `client/dist`
5. Deploy

## Support

For issues or questions, create an issue on GitHub or contact support@washop.com

## License

MIT License - feel free to use this project for your own purposes!
