# WaShop - E-commerce Platform

## 🚀 Quick Start with Docker

### Prerequisites
- Docker Desktop installed ([Download here](https://www.docker.com/products/docker-desktop/))
- No other software needed!

### Option 1: Run with Docker Compose (Recommended)

1. **Clone or navigate to the project:**
   ```bash
   cd washop
   ```

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

3. **Access the application:**
   - **Frontend:** http://localhost:3000
   - **Backend API:** http://localhost:5001
   - **From other devices on your network:** http://YOUR_LOCAL_IP:3000
   
   To find your local IP:
   - **Mac/Linux:** `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - **Windows:** `ipconfig` (look for IPv4 Address)

4. **View logs:**
   ```bash
   docker-compose logs -f
   ```

5. **Stop all services:**
   ```bash
   docker-compose down
   ```

6. **Stop and remove all data:**
   ```bash
   docker-compose down -v
   ```

### Option 2: Access from Mobile/Tablet on Local Network (Development Mode)

If you want to test during development without Docker:

1. **Get your computer's local IP address:**
   ```bash
   # Mac/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig
   ```
   
   Example IP: `192.168.1.100`

2. **Start the development servers:**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm start
   
   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```

3. **Access from your phone/tablet:**
   - Open browser on your mobile device
   - Go to: `http://192.168.1.100:5173` (replace with your IP)
   - Make sure your phone and computer are on the same WiFi network

### Environment Variables

Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=5001
NODE_ENV=production

# MongoDB
MONGODB_URI=mongodb://mongodb:27017/washop

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=30d

# Cloudinary (Optional - for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL
CLIENT_URL=http://localhost:3000

# Admin Account
ADMIN_EMAIL=admin@washop.com
ADMIN_PASSWORD=Admin123!
```

### 📱 Mobile Access Tips

1. **Firewall:** Make sure your firewall allows connections on ports 3000, 5001, and 5173
2. **Same Network:** Ensure your mobile device is on the same WiFi as your computer
3. **HTTPS Warning:** You might see security warnings - this is normal for local development

### 🛠️ Development Commands

```bash
# Build Docker images
docker-compose build

# Rebuild and start
docker-compose up --build

# View running containers
docker ps

# Access container shell
docker exec -it washop-backend sh
docker exec -it washop-frontend sh
docker exec -it washop-mongodb mongosh washop

# Remove all containers and volumes (fresh start)
docker-compose down -v
```

### 📦 What's Included

- **Frontend:** React + Vite (Nginx in production)
- **Backend:** Node.js + Express
- **Database:** MongoDB 7.0
- **Network:** All services connected on `washop-network`

### 🎯 Default Ports

- **Frontend (Production):** 3000
- **Frontend (Dev):** 5173
- **Backend:** 5001
- **MongoDB:** 27017

### 🔧 Troubleshooting

**Port already in use:**
```bash
# Stop all Docker containers
docker-compose down

# Or change ports in docker-compose.yml
```

**Can't connect from mobile:**
1. Check firewall settings
2. Verify same WiFi network
3. Ping your computer from mobile
4. Try `http://YOUR_IP:3000` instead of `localhost:3000`

**Database not connecting:**
```bash
# Check MongoDB logs
docker logs washop-mongodb

# Restart MongoDB
docker-compose restart mongodb
```

**Need fresh database:**
```bash
# Remove volume and restart
docker-compose down -v
docker-compose up -d
```

### 🚀 Production Deployment

For production deployment to cloud providers:

1. Set proper environment variables
2. Use secure JWT_SECRET
3. Enable HTTPS/SSL
4. Configure proper CORS settings
5. Use managed MongoDB (MongoDB Atlas, AWS DocumentDB, etc.)

---

## 📝 License

This project is licensed under the MIT License.
