#!/bin/bash

# Quick Deployment Guide for WaZhop
# This script helps you deploy to Railway and Vercel

echo "🚀 WaZhop Deployment Assistant"
echo "=============================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo ""
echo "✅ CLI tools ready!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1️⃣  DEPLOY BACKEND (Railway):"
echo "   • Go to: https://railway.app/"
echo "   • Login with GitHub"
echo "   • Create new project from GitHub repo"
echo "   • Set root directory to 'server'"
echo "   • Add environment variables from .env"
echo "   • Copy the generated Railway URL"
echo ""
echo "2️⃣  DEPLOY FRONTEND (Vercel):"
echo "   Run: vercel"
echo "   • Login when prompted"
echo "   • Set root directory to 'client'"
echo "   • Build command: npm run build"
echo "   • Output directory: dist"
echo "   • Add env: VITE_API_URL=<your-railway-url>/api"
echo "   Then run: vercel --prod"
echo ""
echo "3️⃣  UPDATE BACKEND ENV:"
echo "   • In Railway, update APP_BASE_URL to your Vercel URL"
echo ""
echo "📖 Full guide: See DEPLOYMENT_GUIDE.md"
echo ""

read -p "Press Enter to continue..."
