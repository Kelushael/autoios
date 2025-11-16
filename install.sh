#!/bin/bash

# CLANK Proactive AI Installation Script

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║     Installing CLANK - Proactive AI System                ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js version
echo "🔍 Checking Node.js version..."
NODE_VERSION=$(node -v 2>/dev/null)

if [ -z "$NODE_VERSION" ]; then
    echo "❌ Node.js is not installed"
    echo "   Please install Node.js 16+ from https://nodejs.org"
    exit 1
fi

echo "   ✅ Node.js $NODE_VERSION detected"
echo ""

# Create required directories
echo "📁 Creating directories..."
mkdir -p clank/persistence
mkdir -p clank/intelligence
mkdir -p clank/daemon/tools
mkdir -p clank/llm
mkdir -p clank/orchestrator
mkdir -p clank/cli
mkdir -p clank/tests
echo "   ✅ Directories created"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "   ✅ Dependencies installed"
echo ""

# Make scripts executable
chmod +x clank/main_with_proactive.js
chmod +x install.sh

echo "✅ Installation complete!"
echo ""
echo "To start CLANK:"
echo "  sudo node clank/main_with_proactive.js"
echo ""
echo "To run tests:"
echo "  npm test"
echo ""
echo "Documentation:"
echo "  README_PROACTIVE.md - Full usage guide"
echo "  PROACTIVE_AI_ARCHITECTURE.md - Technical details"
echo ""
