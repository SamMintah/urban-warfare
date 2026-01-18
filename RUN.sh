#!/bin/bash

# Urban Warfare FPS - Quick Run Script
# This script sets up and runs the game

echo "🎮 Urban Warfare FPS - Setup & Run"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start the development server
echo "🚀 Starting development server..."
echo ""
echo "The game will open in your browser at http://localhost:3000"
echo ""
echo "Controls:"
echo "  WASD - Move"
echo "  Mouse - Look around"
echo "  Left Click - Shoot"
echo "  Right Click - Aim down sights"
echo "  R - Reload"
echo "  Shift - Run"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
