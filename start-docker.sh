#!/bin/bash

# WaZhop Docker Quick Start Script

echo "🐳 Starting WaZhop with Docker..."
echo ""

# Get local IP address
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

# Start Docker Compose (Compose V2)
docker compose up -d --build

echo ""
echo "✅ WaZhop is starting..."
echo ""
echo "🌐 Access URLs:"
echo "   Local:    http://localhost:3000"
echo "   Network:  http://$LOCAL_IP:3000"
echo ""
echo "📱 On your phone/tablet:"
echo "   1. Connect to the same WiFi network"
echo "   2. Open browser and go to: http://$LOCAL_IP:3000"
echo ""
echo "🔍 View logs:"
echo "   docker compose logs -f"
echo ""
echo "🛑 Stop services:"
echo "   docker compose down"
echo ""
