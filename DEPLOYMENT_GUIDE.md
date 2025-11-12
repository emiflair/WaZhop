# WaZhop Deployment Guide

## 🚀 Quick Deploy (Free Tier)

### Prerequisites
1. GitHub account (you already have this)
2. MongoDB Atlas (already set up ✅)
3. Cloudinary account (already set up ✅)

---

## 📦 Backend Deployment (Railway.app)

### Step 1: Create Railway Account
1. Go to https://railway.app/
2. Click **"Login"** → **"Login with GitHub"**
3. Authorize Railway to access your repositories
4. Free tier: $5 credit/month (enough for small app)

### Step 2: Deploy Backend
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose **emiflair/WaZhop** repository
4. Railway will detect Node.js automatically

### Step 3: Configure Environment Variables
Click on your service → **"Variables"** tab → Add these:

```bash
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
APP_BASE_URL=https://your-frontend.vercel.app
EMAIL_PROVIDER=brevo
BREVO_API_KEY=your_brevo_key
BREVO_SENDER_EMAIL=your_email
BREVO_SENDER_NAME=WaZhop
SMS_PROVIDER=brevo
BREVO_SMS_SENDER=WaZhop
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ADMIN_EMAIL=admin@wazhop.com
ADMIN_PASSWORD=Admin123!
```

### Step 4: Set Root Directory
1. Click **"Settings"** tab
2. Scroll to **"Root Directory"**
3. Set to: `server`
4. Click **"Save"**

### Step 5: Get Backend URL
1. Go to **"Settings"** → **"Domains"**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `https://wazhop-backend-production.up.railway.app`)

---

## 🌐 Frontend Deployment (Vercel)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```
Follow the prompts to authenticate with GitHub.

### Step 3: Deploy Frontend
```bash
cd /Users/emifeaustin/Desktop/WaZhop
vercel
```

**Answer the prompts:**
- Set up and deploy? **Y**
- Which scope? **Your personal account**
- Link to existing project? **N**
- Project name? **wazhop** (or your preferred name)
- In which directory is your code? **./client**
- Want to override settings? **Y**
- Build command? **npm run build**
- Output directory? **dist**
- Development command? **npm run dev**

### Step 4: Set Environment Variable
```bash
vercel env add VITE_API_URL
```
Enter: `https://your-railway-backend-url.railway.app/api`

### Step 5: Deploy to Production
```bash
vercel --prod
```

### Step 6: Enable SPA Routing (Avoid 404 on /admin and PWA)

Add a Vercel config inside `client/` so that all routes serve `index.html`:

```
client/vercel.json
{
   "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
   ]
}
```

---

## ⚙️ Alternative: Deploy via Vercel Website

### Step 1: Create Vercel Account
1. Go to https://vercel.com/
2. Click **"Sign Up"** → **"Continue with GitHub"**
3. Authorize Vercel

### Step 2: Import Project
1. Click **"Add New..."** → **"Project"**
2. Import **emiflair/WaZhop** repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Add Environment Variable
1. Click **"Environment Variables"**
2. Add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-railway-backend-url.railway.app/api`
3. Click **"Deploy"**

---

## 🔄 Update Backend URL in Frontend

After deploying backend, update the frontend API URL:

### Option 1: Vercel Dashboard
1. Go to your project on Vercel
2. **Settings** → **Environment Variables**
3. Edit `VITE_API_URL` to your Railway backend URL
4. **Deployments** → Click ⋯ → **Redeploy**

### Option 2: Vercel CLI
```bash
vercel env rm VITE_API_URL production
vercel env add VITE_API_URL production
# Enter your Railway backend URL
vercel --prod
```

---

## ✅ Verification Steps

### 1. Test Backend
```bash
curl https://your-backend.railway.app/api/health
```

Should return: `{"status":"ok"}`

### 2. Test Frontend
Open: `https://your-frontend.vercel.app`

### 3. Test Full Flow
1. Open frontend URL
2. Try registering/logging in
3. Browse marketplace
4. Create a shop
5. Upload products

---

## ✅ Post‑Deploy Checklist (Production)

- [ ] Railway → Variables: set `APP_BASE_URL` to your Vercel domain (e.g. `https://wazhop.vercel.app`)
- [ ] Vercel → Env Vars: set `VITE_API_URL` to `https://<railway>.up.railway.app/api`
- [ ] MongoDB Atlas → Network Access: allow your server IP (or temporarily `0.0.0.0/0` while testing)
- [ ] `client/vercel.json` exists to enable SPA rewrites (no more 404s on `/admin` or PWA)
- [ ] Health check returns 200 at `/api/health`

## � Subscriptions & Plan Enforcement

WaZhop supports two downgrade paths and runtime enforcement on the backend:

- User‑initiated destructive downgrade to Free: The dashboard asks for explicit confirmation. If confirmed, the backend prunes data to fit Free limits (keeps oldest shop; caps products at Free tier; clears images where necessary) and enforces branding/watermark.
- Automatic non‑destructive downgrade on expiry: When a paid plan expires (and auto‑renew is off), a scheduled check and a request‑time middleware move the user to Free without deleting data. Extra shops are deactivated and branding/watermark is enabled.

Runtime behavior:
- If a request arrives after expiry, the API may return HTTP 402 (Payment Required) with a message indicating plan expiry. You can surface this in the client and redirect users to the Subscription page.
- Free tier limits (e.g., max shops/products/storage) are enforced server‑side in utilities and controllers.

Optional client enhancement:
- Add a global 402 handler (axios interceptor) to show a friendly toast and navigate to the Subscription screen when a 402 is returned.

## �💰 Pricing Overview

### Railway (Backend)
- **Free Tier**: $5 credit/month
- **Hobby Plan**: $5/month (500 hours, no credit card required initially)
- **Usage**: ~$0.01/hour for small apps
- **Estimate**: Should last the month for development

### Vercel (Frontend)
- **Free Tier**: Unlimited for personal/hobby projects
- **Bandwidth**: 100GB/month
- **Builds**: 6,000 minutes/month
- **Perfect for**: Development and small production apps

### MongoDB Atlas
- **Free Tier**: 512MB storage (already using this ✅)

### Cloudinary
- **Free Tier**: 25GB storage, 25GB bandwidth (already using this ✅)

**Total Cost**: $0-5/month for hobby usage

---

## 🔧 Custom Domain (Optional)

### Add Domain to Vercel
1. Buy domain from Namecheap/GoDaddy (~$10/year)
2. In Vercel: **Settings** → **Domains**
3. Add your domain
4. Update DNS records as instructed

### Add Domain to Railway
1. In Railway: **Settings** → **Domains**
2. Click **"Custom Domain"**
3. Enter: `api.yourdomain.com`
4. Update DNS with CNAME record

---

## 🚨 Important: Update Environment Variables

### Update Backend `APP_BASE_URL`
```bash
# In Railway
APP_BASE_URL=https://your-frontend.vercel.app
```

### Update Frontend `VITE_API_URL`
```bash
# In Vercel
VITE_API_URL=https://your-backend.railway.app/api
```

---

## 📱 Monitoring & Logs

### Railway Logs
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# View logs
railway logs
```

### Vercel Logs
```bash
# View deployment logs
vercel logs

# View production logs
vercel logs --prod
```

---

## 🔄 Continuous Deployment

Both Railway and Vercel automatically deploy when you push to GitHub:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

**Railway**: Deploys backend automatically
**Vercel**: Deploys frontend automatically

---

## 🆘 Troubleshooting

### Backend Won't Start
1. Check Railway logs
2. Verify all environment variables are set
3. Ensure MongoDB Atlas IP whitelist includes `0.0.0.0/0`

### Frontend Can't Connect to Backend
1. Check CORS settings in backend
2. Verify `VITE_API_URL` is correct
3. Check Railway backend is running

### CORS Errors
Add to `server/server.js`:
```javascript
app.use(cors({
  origin: ['https://your-frontend.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
```

---

## 🎉 Success!

Once deployed:
- **Frontend**: https://wazhop.vercel.app
- **Backend**: https://wazhop.railway.app
- **MongoDB**: Atlas (cloud)
- **Images**: Cloudinary (cloud)

All free tier! 🎊
