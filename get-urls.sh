#!/bin/bash

# WaZhop - Get Access URLs
# Run this script to get your current access URLs

echo "🌐 WaZhop Access URLs"
echo "===================="
echo ""

# Get local IP
IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)

if [ -z "$IP" ]; then
    echo "❌ Could not detect IP address"
    echo "Make sure you're connected to WiFi/Ethernet"
    exit 1
fi

echo "📍 Your Local IP: $IP"
echo ""

# Check if containers are running
if docker ps | grep -q wazhop-frontend; then
    echo "✅ Containers Running"
else
    echo "⚠️  Containers not running. Start with: docker compose up -d"
    echo ""
fi

echo ""
echo "🖥️  LAPTOP ACCESS:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:5001"
echo ""
echo "📱 MOBILE ACCESS (Same WiFi):"
echo "   Frontend:  http://$IP:3000"
echo "   Backend:   http://$IP:5001"
echo ""
echo "🔗 For remote access (different networks):"
echo "   Option 1 - localhost.run (free):"
echo "      ssh -R 80:localhost:3000 localhost.run"
echo ""
echo "   Option 2 - ngrok (install first: brew install ngrok):"
echo "      ngrok http 3000"
echo ""
echo "💡 TIP: Share the mobile URL with your team!"
echo ""

# QR Code option (if qrencode is installed)
if command -v qrencode &> /dev/null; then
    echo "📲 Scan QR Code to access on mobile:"
    qrencode -t ANSIUTF8 "http://$IP:3000"
    echo ""
else
    echo "💡 Want QR code? Install with: brew install qrencode"
    echo ""
fi
