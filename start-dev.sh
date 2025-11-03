#!/bin/bash

# WaZhop Development Startup Script

echo "🚀 Starting WaZhop Development Servers..."
echo ""

# Start backend
echo "📦 Starting Backend Server (Port 5001)..."
cd server
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo "🎨 Starting Frontend Server (Port 5173)..."
cd client
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Both servers started!"
echo "📍 Backend: http://localhost:5001"
echo "📍 Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
