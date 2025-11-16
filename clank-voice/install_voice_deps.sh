#!/bin/bash

# CLANK Voice Dependencies Installation

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║     Installing CLANK Voice Dependencies                   ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

OS=$(uname -s)

if [ "$OS" = "Linux" ]; then
    echo "📦 Installing Linux audio dependencies..."

    # Audio recording/playback
    sudo apt-get update
    sudo apt-get install -y alsa-utils

    # Text-to-Speech
    echo "📦 Installing TTS engine..."
    sudo apt-get install -y espeak

    # Optional: Piper TTS (higher quality)
    echo "📦 Installing Piper TTS (optional)..."
    wget -O /tmp/piper.tar.gz https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_linux_x86_64.tar.gz
    tar -xzf /tmp/piper.tar.gz -C ~/.local/bin/

    # Speech-to-Text
    echo "📦 Installing Whisper.cpp..."
    git clone https://github.com/ggerganov/whisper.cpp /tmp/whisper.cpp
    cd /tmp/whisper.cpp
    make
    sudo cp main ~/.local/bin/whisper

    # Download Whisper model
    echo "📦 Downloading Whisper base model..."
    bash ./models/download-ggml-model.sh base
    mkdir -p ~/.clank/models
    cp models/ggml-base.bin ~/.clank/models/

    echo "  ✅ Linux dependencies installed"

elif [ "$OS" = "Darwin" ]; then
    echo "📦 Installing macOS audio dependencies..."

    # Install Homebrew if not present
    which brew > /dev/null || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Audio
    brew install sox

    # TTS (macOS has built-in 'say')
    echo "  ✅ Using macOS built-in TTS"

    # STT
    echo "📦 Installing Whisper.cpp..."
    git clone https://github.com/ggerganov/whisper.cpp /tmp/whisper.cpp
    cd /tmp/whisper.cpp
    make
    cp main /usr/local/bin/whisper

    bash ./models/download-ggml-model.sh base
    mkdir -p ~/.clank/models
    cp models/ggml-base.bin ~/.clank/models/

    echo "  ✅ macOS dependencies installed"

else
    echo "❌ Unsupported OS: $OS"
    echo "   Please use Linux or macOS, or WSL on Windows"
    exit 1
fi

# Install Ollama (for mini-models)
echo "📦 Installing Ollama..."
curl -fsSL https://ollama.com/install.sh | sh

# Pull mini-models
echo "📦 Pulling mini-models..."
ollama pull phi3-mini
ollama pull gemma:2b

# Install Node dependencies
echo "📦 Installing Node.js dependencies..."
npm install

echo ""
echo "✅ Installation complete!"
echo ""
echo "To start CLANK Voice Daemon:"
echo "  sudo node voice_daemon.js"
echo ""
echo "Or:"
echo "  npm start"
echo ""
