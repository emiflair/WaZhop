# WaZhop Project Structure & Dependency Guide

## 📁 Project Overview

```
WaZhop/
├── client/           # React Frontend (Vite)
├── server/           # Node.js Backend (Express)
├── docker-compose.yml
└── Documentation files
```

## 🎨 FRONTEND STRUCTURE (client/)

### Core Application Files
```
client/
├── src/
│   ├── main.jsx              # ⚠️ Entry point - DO NOT DELETE
│   ├── App.jsx               # ⚠️ Router & Theme sync - CRITICAL
│   └── index.css             # Global styles
```

### 🎯 Context Providers (State Management)
**Location**: `client/src/context/`
**⚠️ CRITICAL - Many components depend on these**

```
context/
├── AuthContext.jsx         # Authentication state
│   └── Used by: All protected routes, Navbar, Dashboard
├── ThemeContext.jsx        # Theme (light/dark) management
│   └── Used by: App.jsx, Navbar, all pages
└── CartContext.jsx         # Shopping cart state
    └── Used by: Storefront, ProductDetail, CartSidebar
```

**Dependencies:**
- Delete `AuthContext` → Breaks: Login, Register, Dashboard, Admin pages
- Delete `ThemeContext` → Breaks: Theme toggle, dark mode
- Delete `CartContext` → Breaks: Shopping cart, storefront

### 🧩 Reusable Components
**Location**: `client/src/components/`

#### Critical Components (⚠️ Used Everywhere)
```
components/
├── Navbar.jsx              # Header with theme toggle
│   └── Used by: ALL pages
├── Footer.jsx              # Footer
│   └── Used by: All marketing & public pages
├── ErrorBoundary.jsx       # Error handling wrapper
│   └── Used by: App.jsx (wraps entire app)
└── ProtectedRoute.jsx      # Auth guard
    └── Used by: All dashboard routes
```

#### Layout Components
```
components/
├── DashboardLayout.jsx     # Dashboard sidebar/header
├── AdminLayout.jsx         # Admin dashboard layout
└── AuthLayout.jsx          # Login/Register layout
```

#### Feature Components
```
components/
├── CartSidebar.jsx         # Shopping cart drawer
├── ProductDetailModal.jsx  # Product popup (storefront)
├── ImageCropUpload.jsx     # Image upload with cropping
├── MultipleImageUpload.jsx # Multiple images upload
├── LazyImage.jsx          # Lazy loading images
├── LoadingSpinner.jsx     # Loading indicator
├── ErrorAlert.jsx         # Error display
└── StarRating.jsx         # Star rating display
```

### 📄 Pages Structure

#### Public Pages (No Auth Required)
```
pages/
├── Marketplace.jsx         # Homepage (/) - Product browsing
├── ProductDetail.jsx       # Product page (/product/:id)
├── Storefront.jsx         # Shop page (/:slug)
├── Home.jsx               # Marketing home (/about)
├── HowItWorks.jsx         # How it works page
├── Pricing.jsx            # Pricing page
├── About.jsx              # About page
├── Contact.jsx            # Contact page
├── Login.jsx              # Login page
├── Register.jsx           # Register page
├── ForgotPassword.jsx     # Password reset request
├── ResetPassword.jsx      # Password reset form
├── PrivacyPolicy.jsx      # Privacy policy
└── TermsOfService.jsx     # Terms of service
```

#### Dashboard Pages (⚠️ Require Auth)
```
pages/dashboard/
├── Dashboard.jsx           # Main dashboard
├── Profile.jsx            # User profile settings
├── ShopSettings.jsx       # Shop customization
├── Products.jsx           # Product management
├── ManageShops.jsx        # Multiple shops management
├── Subscription.jsx       # Plan & payment
├── Analytics.jsx          # Shop analytics
├── InventoryManagement.jsx # Stock management
├── Reviews.jsx            # Review management
└── ReferralProgram.jsx    # Referral tracking
```

#### Admin Pages (⚠️ Require Admin Role)
```
pages/admin/
├── AdminDashboard.jsx     # Admin overview
├── AdminUsers.jsx         # User management
├── AdminShops.jsx         # Shop management
├── AdminProducts.jsx      # Product moderation
├── AdminOrders.jsx        # Order management
├── AdminCoupons.jsx       # Coupon management
├── AdminAnalytics.jsx     # Platform analytics
├── AdminRevenue.jsx       # Revenue tracking
└── AdminSettings.jsx      # Platform settings
```

### 🔧 Utilities & Helpers
**Location**: `client/src/utils/`

```
utils/
├── api.js                 # ⚠️ API client - ALL API calls use this
│   └── Exports: productAPI, shopAPI, authAPI, etc.
├── currency.js            # Currency formatting
├── categories.js          # Product categories list
└── helpers.js             # Misc helper functions
```

**⚠️ WARNING**: Changing `api.js` affects ALL pages that make API calls

### 🎨 Hooks (Custom React Hooks)
**Location**: `client/src/hooks/`

```
hooks/
├── useMarketingTheme.js   # Force light mode on marketing pages
│   └── Used by: Home, HowItWorks, Pricing, About, Contact, etc.
└── useCart.js             # Cart operations
    └── Used by: Storefront, ProductDetail, CartSidebar
```

### 🎨 Assets
```
client/src/assets/
└── brand/                 # Logo, icons, brand images
```

---

## 🔙 BACKEND STRUCTURE (server/)

### Core Server File
```
server/
└── server.js              # ⚠️ Main entry point - DO NOT DELETE
```

### 📊 Models (Database Schemas)
**Location**: `server/models/`
**⚠️ CRITICAL - Changing these affects data structure**

```
models/
├── User.js                # User accounts
│   └── Fields: email, password, role, plan, whatsapp
├── Shop.js                # Shop/storefront
│   └── Fields: shopName, slug, owner, theme, products
├── Product.js             # Products
│   └── Fields: name, price, images, shop, moderation
├── Order.js               # Orders
│   └── Fields: products, buyer, seller, status
├── Review.js              # Product reviews
│   └── Fields: product, customer, rating, comment
├── Coupon.js              # Discount coupons
│   └── Fields: code, discount, shop, expiresAt
└── PlatformSettings.js    # Platform configuration
    └── Fields: notifications, payment settings
```

**Dependencies:**
- Changing model fields → Update corresponding controllers & routes
- Adding new fields → May require migration script

### 🎮 Controllers (Business Logic)
**Location**: `server/controllers/`

```
controllers/
├── authController.js      # Login, register, password reset
├── userController.js      # User profile operations
├── shopController.js      # Shop CRUD operations
├── productController.js   # Product CRUD operations
├── orderController.js     # Order management
├── reviewController.js    # Review management
├── couponController.js    # Coupon operations
├── subscriptionController.js  # Plan management
├── referralController.js  # Referral tracking
├── settingsController.js  # Platform settings
└── adminController.js     # Admin operations
```

**Each controller exports functions used by routes**

### 🛣️ Routes (API Endpoints)
**Location**: `server/routes/`

```
routes/
├── auth.js                # POST /api/auth/login, /register
├── user.js                # GET/PUT /api/user/profile
├── shop.js                # CRUD /api/shops
├── product.js             # CRUD /api/products
├── order.js               # CRUD /api/orders
├── review.js              # CRUD /api/reviews
├── coupon.js              # CRUD /api/coupons
├── subscription.js        # POST /api/subscription/upgrade
├── referral.js            # GET /api/referral/stats
├── settings.js            # GET/PUT /api/settings
└── admin.js               # Admin endpoints /api/admin/*
```

**Each route file:**
1. Imports controller functions
2. Applies middleware (auth, validation, moderation)
3. Defines API endpoints

### 🛡️ Middlewares (Request Processing)
**Location**: `server/middlewares/`

```
middlewares/
├── auth.js                # ⚠️ Authentication & authorization
│   └── Exports: protect, adminOnly, sellerOnly
├── contentModeration.js   # Content validation
│   └── Exports: moderateProductContent, moderateText
├── planLimits.js         # Subscription limit checks
└── subscription.js        # Subscription validation
```

**Middleware Flow:**
```
Request → auth.js → planLimits.js → contentModeration.js → controller → response
```

### 🛠️ Utilities
**Location**: `server/utils/`

```
utils/
├── mailer.js             # Email sending (Brevo)
├── sms.js                # SMS sending (AfricasTalking)
├── notify.js             # Unified notifications
├── helpers.js            # Helper functions
├── contentModeration.js  # Text content validation
├── imageModeration.js    # Image validation
├── ipGeolocation.js      # IP location detection
└── subscriptionCron.js   # Daily subscription checks
```

### ⚙️ Configuration
**Location**: `server/config/`

```
config/
├── cloudinary.js         # Cloudinary setup (image hosting)
├── shopTemplates.js      # Default shop templates
└── themePresets.js       # Default theme colors

### ☁️ Hosting Configuration

```
client/
└── vercel.json           # SPA rewrites so routes like /admin resolve to index.html
```

On Vercel, the project builds from `client/`. The `client/vercel.json` ensures client‑side routes and the PWA work without 404s.
```

### 🔄 Migrations
**Location**: `server/migrations/`

```
migrations/
├── addPaymentSettings.js      # Added payment fields to shops
├── enforceFreePlanLimits.js   # Applied plan limits
├── fixShopBranding.js         # Fixed branding fields
└── removeOwnerUniqueIndex.js  # Removed unique constraint
```

**⚠️ Run migrations when deploying schema changes**

---

## 🔗 CRITICAL DEPENDENCIES MAP

### Frontend Dependencies

#### If You Modify `AuthContext.jsx`:
**Breaks:**
- Login.jsx
- Register.jsx
- All dashboard pages
- Navbar.jsx (user dropdown)
- ProtectedRoute.jsx
- AdminRoute.jsx

**Safe Changes:**
- Add new auth methods ✅
- Add new user fields ✅

**Dangerous:**
- Remove `user` or `isAuthenticated` ❌
- Change `login()` or `logout()` signature ❌

#### If You Modify `ThemeContext.jsx`:
**Breaks:**
- App.jsx (theme sync)
- Navbar.jsx (theme toggle)
- All pages with dark mode classes

**Safe:**
- Add new theme modes ✅

**Dangerous:**
- Remove `theme` state ❌
- Change `toggleTheme()` ❌

#### If You Modify `api.js`:
**Breaks:**
- ALL pages that make API calls
- ALL components that fetch data

**Safe:**
- Add new API methods ✅
- Add interceptors ✅

**Dangerous:**
- Change base URL structure ❌
- Remove existing API methods ❌
- Change response structure ❌

### Backend Dependencies

#### If You Modify Models:
**Must Update:**
1. Corresponding controller
2. API routes
3. Frontend API calls
4. May need migration script

**Example:** Adding `Product.variants` field:
1. Update `Product.js` model
2. Update `productController.js` (handle variants)
3. Update `product.js` routes (validation)
4. Update frontend `ProductDetail.jsx`

#### If You Modify Controllers:
**Must Check:**
1. Routes still call controller correctly
2. Frontend API calls expect same response
3. Error handling is consistent

#### If You Modify Middleware:
**Impact:**
- Changes to `auth.js` → All protected routes
- Changes to `contentModeration.js` → Product/shop creation
- Changes to `planLimits.js` → Subscription checks

---

## 🚨 SAFE CHANGE CHECKLIST

### Before Deleting ANY File:

1. **Search for imports:**
   ```bash
   grep -r "import.*filename" client/src/
   grep -r "require.*filename" server/
   ```

2. **Search for usage:**
   ```bash
   grep -r "functionName" client/src/
   grep -r "functionName" server/
   ```

3. **Check if it's a route:**
   - Look in `App.jsx` for route definitions
   - Look in `server.js` for route registration

4. **Check database dependencies:**
   - Models: Used by controllers and migrations
   - Controllers: Used by routes
   - Routes: Used by frontend

### Before Modifying Core Files:

**High Risk (Test Thoroughly):**
- `AuthContext.jsx` - Authentication
- `ThemeContext.jsx` - Theme system
- `api.js` - API client
- `auth.js` (middleware) - Authorization
- Model files - Database structure
- `server.js` - Server entry

**Medium Risk:**
- Controllers - Business logic
- Routes - API endpoints
- Components used by multiple pages

**Low Risk:**
- Page-specific components
- Utility functions
- Styles

---

## 🔄 SAFE MODIFICATION WORKFLOW

### Adding New Feature:

1. **Backend:**
   ```
   Model → Controller → Route → Test
   ```

2. **Frontend:**
   ```
   API method → Component/Page → Test
   ```

3. **Integration:**
   ```
   Test end-to-end flow
   ```

### Modifying Existing Feature:

1. **Identify all dependencies** (use grep)
2. **Make changes in order:**
   - Database/Model first
   - Controller second
   - Routes third
   - Frontend last
3. **Test after each change**
4. **Update documentation**

### Deleting Feature:

1. **Find all references** (grep)
2. **Remove in reverse order:**
   - Frontend components first
   - Routes second
   - Controllers third
   - Models last (after migration)
3. **Test that nothing breaks**

---

## 📝 COMMON MODIFICATION PATTERNS

### Adding New API Endpoint:

1. **Backend:**
   ```javascript
   // server/controllers/exampleController.js
   exports.newFeature = async (req, res) => { ... }
   
   // server/routes/example.js
   router.post('/new-feature', protect, newFeature)
   
   // server/server.js
   app.use('/api/example', exampleRoutes)
   ```

2. **Frontend:**
   ```javascript
   // client/src/utils/api.js
   export const exampleAPI = {
     newFeature: (data) => api.post('/example/new-feature', data)
   }
   
   // client/src/pages/Example.jsx
   import { exampleAPI } from '../utils/api'
   const result = await exampleAPI.newFeature(data)
   ```

### Adding New Model Field:

1. **Update Model:**
   ```javascript
   // server/models/Product.js
   newField: {
     type: String,
     default: ''
   }
   ```

2. **Create Migration (if needed):**
   ```javascript
   // server/migrations/addNewField.js
   await Product.updateMany({}, { $set: { newField: '' } })
   ```

3. **Update Controller:**
   ```javascript
   // Handle new field in create/update
   ```

4. **Update Frontend:**
   ```javascript
   // Display/edit new field in UI
   ```

---

## 🎯 KEY FILES YOU SHOULD NEVER DELETE

### Frontend:
- `src/main.jsx` - App entry point
- `src/App.jsx` - Router
- `src/context/*` - State management
- `src/utils/api.js` - API client
- `src/components/Navbar.jsx` - Navigation
- `src/components/ErrorBoundary.jsx` - Error handling

### Backend:
- `server.js` - Server entry point
- `models/*` - Database schemas (without migration)
- `middlewares/auth.js` - Authentication
- `config/cloudinary.js` - Image hosting

### Configuration:
- `docker-compose.yml` - Container setup
- `client/package.json` - Dependencies
- `server/package.json` - Dependencies
- `.env` files - Environment variables

---

## 🔍 DEBUGGING TIPS

### If Something Breaks After Changes:

1. **Check Console:**
   - Browser console (F12) - Frontend errors
   - Terminal - Backend errors

2. **Check Docker Logs:**
   ```bash
   docker logs wazhop-backend --tail 50
   docker logs wazhop-frontend --tail 50
   ```

3. **Verify File Imports:**
   ```bash
   grep -r "import.*YourFile" client/src/
   ```

4. **Check API Calls:**
   - Network tab in browser DevTools
   - Check request/response format

5. **Rebuild Containers:**
   ```bash
   docker compose down
   docker compose up -d --build
   ```

---

## 📦 REBUILD COMMANDS

### After Frontend Changes:
```bash
docker compose up -d --build frontend
```

### After Backend Changes:
```bash
docker compose up -d --build backend
```

### Full Rebuild:
```bash
docker compose down
docker compose up -d --build
```

### Reset Everything (⚠️ DANGER - Deletes Data):
```bash
docker compose down -v
docker compose up -d --build
```

---

## 🎓 SUMMARY

**Golden Rules:**
1. ✅ Always search for dependencies before deleting
2. ✅ Test after every change
3. ✅ Make small, incremental changes
4. ✅ Keep backups of working code
5. ✅ Document your changes

**Safe Changes:**
- Adding new files/components
- Adding new API endpoints
- Adding new fields (with migrations)
- Styling changes
- Copy/documentation

**Risky Changes:**
- Modifying core contexts
- Changing model schemas without migration
- Removing widely-used components
- Changing API response structures
- Modifying authentication logic

**Emergency Recovery:**
```bash
# If something breaks badly:
git status                    # See what changed
git diff                      # See exact changes
git checkout -- <file>        # Revert specific file
git reset --hard HEAD         # Revert all changes (⚠️)
```

Remember: **When in doubt, search for dependencies first!** 🔍
