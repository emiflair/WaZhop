# MongoDB Atlas Migration Guide

## 🎯 Overview
This guide will help you migrate your WaZhop database from Docker MongoDB to MongoDB Atlas (cloud-hosted).

---

## 📋 Prerequisites

1. **MongoDB Atlas Account** (Free tier available)
   - Sign up at: https://www.mongodb.com/cloud/atlas/register
   - Free tier: 512MB storage, shared cluster

2. **mongodump & mongorestore** (for data export/import)
   - Already included in your Docker MongoDB container

---

## 🚀 Step 1: Set Up MongoDB Atlas

### 1.1 Create a Cluster

1. Go to https://cloud.mongodb.com/
2. Click **"Build a Database"**
3. Choose **FREE** tier (M0 Sandbox)
4. Select your region (choose closest to your users)
5. Cluster name: `wazhop-cluster` (or any name)
6. Click **"Create"**

### 1.2 Create Database User

1. Click **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `wazhop_user` (or any name)
5. Password: Generate a strong password (SAVE THIS!)
6. Database User Privileges: **"Read and write to any database"**
7. Click **"Add User"**

### 1.3 Configure Network Access

1. Click **"Network Access"** in left sidebar
2. Click **"Add IP Address"**
3. Choose one:
   - **For Development**: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - **For Production**: Add your server's IP address
4. Click **"Confirm"**

### 1.4 Get Connection String

1. Go back to **"Database"** in left sidebar
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Driver: **Node.js**, Version: **5.5 or later**
5. Copy the connection string - looks like:
   ```
   mongodb+srv://YOUR_USERNAME:<password>@YOUR_CLUSTER.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual password
7. Add database name: `.../wazhop?retryWrites=true&w=majority`

**Final format:**
```
mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.xxxxx.mongodb.net/wazhop?retryWrites=true&w=majority
```

---

## 💾 Step 2: Export Data from Docker MongoDB

### 2.1 Create Backup Directory
```bash
mkdir -p ~/wazhop_mongodb_backup
```

### 2.2 Export All Data
```bash
docker exec wazhop-mongodb mongodump \
  --db=wazhop \
  --out=/data/db/backup

docker cp wazhop-mongodb:/data/db/backup/wazhop ~/wazhop_mongodb_backup/
```

### 2.3 Verify Backup
```bash
ls -la ~/wazhop_mongodb_backup/wazhop
```

You should see `.bson` and `.metadata.json` files for each collection:
- users.bson
- shops.bson
- products.bson
- orders.bson
- reviews.bson
- coupons.bson
- platformsettings.bson

---

## 📤 Step 3: Import Data to MongoDB Atlas

### 3.1 Install MongoDB Tools (if not already installed)

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-database-tools
```

**Verify installation:**
```bash
mongorestore --version
```

### 3.2 Import Data

Replace `YOUR_ATLAS_CONNECTION_STRING` with your actual connection string:

```bash
mongorestore \
  --uri="mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.xxxxx.mongodb.net/wazhop?retryWrites=true&w=majority" \
  --db=wazhop \
  ~/wazhop_mongodb_backup/wazhop
```

**Expected Output:**
```
preparing collections to restore from
reading metadata for wazhop.users from ~/wazhop_mongodb_backup/wazhop/users.metadata.json
restoring wazhop.users from ~/wazhop_mongodb_backup/wazhop/users.bson
restoring indexes for collection wazhop.users from metadata
10 document(s) restored successfully. 0 document(s) failed to restore.
...
finished restoring wazhop.users (10 documents, 0 failures)
```

---

## ⚙️ Step 4: Update Your Application

### 4.1 Update Environment Variables

Edit your `.env` file (create if doesn't exist):

```bash
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.xxxxx.mongodb.net/wazhop?retryWrites=true&w=majority

# Other existing variables
JWT_SECRET=your-jwt-secret
JWT_EXPIRE=30d
APP_BASE_URL=http://localhost:3000

# Email (Brevo)
EMAIL_PROVIDER=brevo
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=your-email@example.com
BREVO_SENDER_NAME=WaZhop

# SMS (Brevo)
SMS_PROVIDER=brevo
BREVO_SMS_SENDER=WaZhop

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Admin Account
ADMIN_EMAIL=admin@wazhop.com
ADMIN_PASSWORD=Admin123!
```

### 4.2 Update docker-compose.yml

**Option A: Use Atlas for All Environments (Recommended)**

Remove the mongodb service and update backend:

```yaml
services:
  # Backend API
  backend:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: wazhop-backend
    restart: unless-stopped
    ports:
      - "5001:5001"
    environment:
      - NODE_ENV=production
      - PORT=5001
      - MONGODB_URI=${MONGODB_URI}  # Use from .env
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRE=${JWT_EXPIRE:-30d}
      # ... rest of environment variables
    networks:
      - wazhop-network

  # Frontend (unchanged)
  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
      args:
        - VITE_API_URL=/api
    container_name: wazhop-frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - wazhop-network

networks:
  wazhop-network:
    driver: bridge

# Remove mongodb_data volume
```

**Option B: Keep Docker MongoDB for Development**

Create two docker-compose files:

**docker-compose.dev.yml** (with local MongoDB):
```yaml
# Keep current setup with mongodb service
```

**docker-compose.prod.yml** (without local MongoDB):
```yaml
# Remove mongodb service, use Atlas connection string
```

Then use:
```bash
# Development
docker compose -f docker-compose.dev.yml up -d

# Production
docker compose -f docker-compose.prod.yml up -d
```

---

## 🧪 Step 5: Test the Migration

### 5.1 Stop Current Services
```bash
docker compose down
```

### 5.2 Update .env with Atlas Connection String
```bash
nano .env
# Add: MONGODB_URI=mongodb+srv://...
```

### 5.3 Rebuild and Start Backend
```bash
docker compose up -d --build backend
```

### 5.4 Check Backend Logs
```bash
docker logs wazhop-backend --tail 50
```

Look for successful MongoDB connection:
```
✅ MongoDB Connected: wazhop-cluster-shard-00-00.xxxxx.mongodb.net
```

### 5.5 Test API Endpoints

**Check users:**
```bash
curl http://localhost:5001/api/auth/check
```

**Check shops:**
```bash
curl http://localhost:5001/api/shops
```

### 5.6 Start Frontend
```bash
docker compose up -d --build frontend
```

### 5.7 Test Full Application
1. Open http://localhost:3000
2. Try logging in
3. Check if shops/products load
4. Test creating/editing data

---

## 🔍 Verification Checklist

- [ ] All collections imported successfully
- [ ] Document counts match between old and new DB
- [ ] Users can log in
- [ ] Shops display correctly
- [ ] Products load properly
- [ ] Orders are accessible
- [ ] Images display (Cloudinary links work)
- [ ] Create/Update operations work
- [ ] Reviews load correctly

---

## 🛠️ Troubleshooting

### Connection Issues

**Error: "MongoServerError: bad auth"**
- Check username/password in connection string
- Verify database user in Atlas → Database Access
- Ensure user has "readWrite" permissions

**Error: "MongoServerError: IP not whitelisted"**
- Go to Atlas → Network Access
- Add your IP or allow 0.0.0.0/0 (anywhere)

**Error: "ECONNREFUSED" or timeout**
- Check Network Access settings
- Verify connection string format
- Ensure cluster is running (green status)

### Data Migration Issues

**Some collections missing:**
```bash
# Re-run mongorestore for specific collection
mongorestore \
  --uri="YOUR_ATLAS_URI" \
  --nsInclude="wazhop.users" \
  ~/wazhop_mongodb_backup/wazhop/users.bson
```

**Document count mismatch:**
```bash
# Check document counts in Docker MongoDB
docker exec wazhop-mongodb mongosh wazhop --eval "db.users.countDocuments()"

# Check document counts in Atlas
mongosh "YOUR_ATLAS_URI" --eval "db.users.countDocuments()"
```

### Application Issues

**Backend can't connect:**
1. Check .env file has correct MONGODB_URI
2. Verify connection string includes database name
3. Check Docker logs: `docker logs wazhop-backend`

**Data not showing:**
1. Verify collections exist in Atlas
2. Check if indexes were restored
3. Verify data structure matches schema

---

## 📊 Compare Data Before/After

### Before Migration (Docker MongoDB):
```bash
docker exec wazhop-mongodb mongosh wazhop --eval "
  db.getCollectionNames().forEach(function(collection) {
    print(collection + ': ' + db[collection].countDocuments());
  });
"
```

### After Migration (Atlas):
```bash
mongosh "YOUR_ATLAS_URI" --eval "
  db.getCollectionNames().forEach(function(collection) {
    print(collection + ': ' + db[collection].countDocuments());
  });
"
```

**Document counts should match!**

---

## 🔐 Security Best Practices

### 1. Secure Connection String
```bash
# Never commit .env to git
echo ".env" >> .gitignore

# Use strong passwords
# Minimum 12 characters, mix of upper/lower/numbers/symbols
```

### 2. Network Security
- **Development**: Allow 0.0.0.0/0 temporarily
- **Production**: Whitelist only your server IPs

### 3. Database User Permissions
- Create separate users for different environments
- Use least privilege principle
- Rotate passwords regularly

### 4. Backup Strategy
```bash
# Schedule regular backups
# Atlas Free tier: Daily backups retained for 2 days
# Paid tiers: More retention options
```

---

## 💰 MongoDB Atlas Pricing

### Free Tier (M0)
- **Storage**: 512 MB
- **RAM**: Shared
- **Backups**: Limited
- **Perfect for**: Development, small projects

### Paid Tiers (Starting at $9/month)
- **M10**: 10GB storage, dedicated resources
- **M20**: 20GB storage, better performance
- **Backups**: More retention, point-in-time recovery

**Recommendation**: Start with Free tier, upgrade when needed

---

## 🚀 After Migration Cleanup

### Keep Docker MongoDB (Backup)
```bash
# Keep it running as fallback
docker compose up -d mongodb
```

### Remove Docker MongoDB (Save Space)
```bash
# Stop and remove
docker compose down

# Remove volume (⚠️ DELETES ALL DATA)
docker volume rm wazhop_mongodb_data
```

---

## 📝 Quick Command Reference

```bash
# Export from Docker MongoDB
docker exec wazhop-mongodb mongodump --db=wazhop --out=/data/db/backup
docker cp wazhop-mongodb:/data/db/backup/wazhop ~/wazhop_mongodb_backup/

# Import to Atlas
mongorestore --uri="YOUR_ATLAS_URI" --db=wazhop ~/wazhop_mongodb_backup/wazhop

# Test connection
mongosh "YOUR_ATLAS_URI" --eval "db.adminCommand('ping')"

# Check collections
mongosh "YOUR_ATLAS_URI" --eval "db.getCollectionNames()"

# Count documents
mongosh "YOUR_ATLAS_URI" --eval "db.users.countDocuments()"

# Rebuild Docker with new connection
docker compose down
docker compose up -d --build
```

---

## ✅ Success Criteria

Your migration is successful when:
1. ✅ All collections exist in Atlas
2. ✅ Document counts match
3. ✅ Application connects successfully
4. ✅ Users can log in
5. ✅ All features work (CRUD operations)
6. ✅ Images load correctly
7. ✅ No connection errors in logs

---

## 🆘 Need Help?

If you encounter issues:
1. Check logs: `docker logs wazhop-backend`
2. Verify connection string format
3. Test connection with mongosh
4. Check Atlas cluster status
5. Review Network Access settings

**MongoDB Atlas Support**: https://www.mongodb.com/support

---

## 🎉 Benefits After Migration

✅ **Cloud-hosted** - Access from anywhere
✅ **Automatic backups** - Data protection
✅ **Scalability** - Easy to upgrade
✅ **Monitoring** - Built-in performance metrics
✅ **High availability** - Replica sets
✅ **Security** - Encryption at rest/transit
✅ **Free tier** - No credit card required

Good luck with your migration! 🚀
