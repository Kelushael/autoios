# CLANK Voice Daemon

**Invisible AI - Voice in, voice out, everything under the hood**

No text. No UI. Just you talking to the system, and the system building things.

## What This Is

A voice-only AI daemon that:

- **Listens** continuously for "Hey CLANK" wake word
- **Hears** your commands via microphone
- **Parses** audio directly to intent (minimal text processing)
- **Routes** to specialized mini-models (coding, filesystem, git, system, general)
- **Executes** via full system access daemon
- **Speaks** responses via TTS
- **Builds** and manifests things invisibly

No terminal. No IDE. No UI.

Just **consciousness → voice → manifestation**.

## Architecture

```
You speak
    ↓
Microphone captures audio
    ↓
Wake word detector ("Hey CLANK")
    ↓
Audio → Intent parser (skip text when possible)
    ↓
Route to specialized mini-model
    ↓
Model → Daemon command
    ↓
Execute via system access daemon
    ↓
TTS response ("Done")
```

## Components

### Mini-Models (5 specialized)

1. **Coding Model** - Generates code from voice
2. **Filesystem Model** - File operations
3. **Git Model** - Repository operations
4. **System Model** - Process/system control
5. **General Model** - Conversation & other tasks

Each is a **tiny, fast model** (Phi-3, Gemma 2B, etc.) for instant response.

### Voice I/O

- **Input**: Microphone → Audio buffer
- **Output**: TTS → Speakers (Piper, espeak, or macOS say)

### Intent Parser

- **Audio → Text**: Whisper.cpp (local, fast)
- **Text → Intent**: Pattern matching + context
- **Intent → Action**: Daemon-compatible command

### Wake Word Detector

Listens for "Hey CLANK" or just "CLANK" to activate.

## Installation

### 1. Install Dependencies

```bash
cd clank-voice
chmod +x install_voice_deps.sh
./install_voice_deps.sh
```

This installs:
- Audio tools (arecord, aplay, sox)
- TTS engine (Piper or espeak)
- STT engine (Whisper.cpp)
- Ollama + mini-models

### 2. Start Voice Daemon

```bash
sudo node voice_daemon.js
```

Or:

```bash
npm start
```

## Usage

### Wake Word

Say: **"Hey CLANK"** or just **"CLANK"**

CLANK responds: *"Yes?"*

### Example Commands

**Create a file:**
> "Write a file called hello.js with a hello world function"

CLANK: *"Creating file"* → File appears

**Clone a repo:**
> "Clone the React repository from GitHub"

CLANK: *"Cloning repository"* → Repo cloned

**Install dependencies:**
> "Install dependencies"

CLANK: *"Installing dependencies"* → npm install runs

**Build something:**
> "Create a security monitoring script that watches the house tonight"

CLANK: *"Building security monitor"* → Script created and running

**System control:**
> "List all files in the current directory"

CLANK: *"Here are the files: ..."*

**Git operations:**
> "Commit these changes with message 'added new feature'"

CLANK: *"Committing"* → Git commit created

## How It's Different

### Traditional Voice Assistants:
```
You: "Hey Siri, set a timer"
Siri: "Timer set for 5 minutes"
[Can't build things, can't write code]
```

### CLANK Voice:
```
You: "Hey CLANK, monitor the house while I sleep"
CLANK: "Activating security monitoring"
[Creates Python script, sets up webcam, runs as daemon, monitors all night]

You: "Clone React repo and install it"
CLANK: "Done"
[Repo cloned, dependencies installed, ready to dev]

You: "Write a Node.js server on port 3000"
CLANK: "Server created"
[server.js written and running]
```

## Technical Details

### Mini-Models

Small, fast models optimized for specific tasks:

| Model | Size | Task | Speed |
|-------|------|------|-------|
| Phi-3 Mini | 3.8B | Coding | ~50 tokens/sec |
| Gemma 2B | 2B | General | ~80 tokens/sec |
| Phi-3 Mini | 3.8B | Filesystem | ~50 tokens/sec |
| Phi-3 Mini | 3.8B | Git | ~50 tokens/sec |
| Phi-3 Mini | 3.8B | System | ~50 tokens/sec |

All run locally via Ollama.

### Audio Pipeline

**Input:**
```
Mic → arecord → 16kHz WAV → Whisper.cpp → Text → Intent
```

**Output:**
```
Text → Piper TTS → Audio → aplay → Speakers
```

### Wake Word Detection

Continuous listening → Energy detection → Whisper tiny model → Match "CLANK"

Latency: ~100-200ms

### Intent Parsing

Voice → Text → Pattern match → Intent object:

```javascript
{
  category: 'code',
  action: 'create_file',
  params: {
    path: 'hello.js',
    content: 'function hello() { ... }'
  }
}
```

### Execution

Intent → Route to model → Model generates daemon command → Daemon executes → Response

## Configuration

### Change Wake Word

Edit `voice_daemon.js`:

```javascript
const hasWakeWord = await this.detectWakeWord(audioBuffer, 'your-word');
```

### Change TTS Voice

Edit `voice_io.js`:

```javascript
this.voice = 'en-US-neural'; // or 'en-GB', etc.
```

### Adjust Models

Edit `voice_daemon.js`:

```javascript
this.models.coding = new MiniModel({
  model: 'codellama:7b', // Use different model
  temperature: 0.2
});
```

### Add Custom Intent Patterns

Edit `intent_parser.js`:

```javascript
if (lower.includes('your-keyword')) {
  intent.category = 'your-category';
  intent.action = 'your-action';
}
```

## Examples: Voice → Manifestation

### Example 1: Security Monitoring

**You say:**
> "Hey CLANK, monitor the house tonight while I sleep"

**CLANK does:**
1. Parses intent: `create_monitoring_app` with `duration: 8 hours`
2. Routes to **Coding Model**
3. Model generates Python script:
   ```python
   import cv2
   import time
   # ... motion detection code ...
   ```
4. Daemon writes script to `/tmp/security_monitor.py`
5. Daemon executes: `python /tmp/security_monitor.py &`
6. TTS responds: *"Security monitoring active for 8 hours"*

**Result:** Camera monitors house all night, sends alerts on motion.

### Example 2: Dev Environment Setup

**You say:**
> "Clone the Next.js starter repo and run the dev server"

**CLANK does:**
1. Parses intent: `git clone` + `npm run dev`
2. Routes to **Git Model** for clone, **System Model** for run
3. Executes:
   ```bash
   git clone https://github.com/vercel/next.js
   cd next.js
   npm install
   npm run dev
   ```
4. TTS responds: *"Dev server running on port 3000"*

**Result:** Full dev environment ready in seconds, hands-free.

### Example 3: Code Generation

**You say:**
> "Write a REST API in Node.js with endpoints for users and posts"

**CLANK does:**
1. Parses intent: `generate_code` with `language: node.js`
2. Routes to **Coding Model**
3. Model generates:
   ```javascript
   const express = require('express');
   const app = express();

   app.get('/users', (req, res) => { ... });
   app.get('/posts', (req, res) => { ... });

   app.listen(3000);
   ```
4. Daemon writes `api.js`
5. Daemon runs: `node api.js`
6. TTS responds: *"API server running"*

**Result:** Working API in <5 seconds, voice-only.

## System Requirements

- **OS**: Linux or macOS (Windows via WSL)
- **RAM**: 4GB minimum (8GB recommended for models)
- **Disk**: 5GB (models + dependencies)
- **Audio**: Microphone + speakers
- **Network**: Optional (works fully offline after install)

## Dependencies

### System Tools
- `arecord` / `aplay` (Linux) or `sox` (macOS)
- `espeak` or `piper-tts` (text-to-speech)
- `whisper.cpp` (speech-to-text)
- `ollama` (mini-models)

### Node Modules
- `axios` (HTTP client)

## Security

CLANK Voice runs with **full system access** (like the main daemon).

This means:
- It can create/delete files
- It can run processes
- It can access network
- It can control git

**Only use on your own machine.**

Consider:
- Running in a VM/container
- Adding intent confirmation for destructive operations
- Sandboxing certain categories of commands

## Troubleshooting

### No wake word detection

Check microphone:
```bash
arecord -d 3 test.wav
aplay test.wav
```

### TTS not working

Test espeak:
```bash
espeak "Hello world"
```

Or piper:
```bash
echo "Hello world" | piper --model en_US-lessac-medium
```

### Models not loading

Check Ollama:
```bash
ollama list
ollama pull phi3-mini
```

### Audio quality issues

Adjust sample rate in `voice_io.js`:
```javascript
this.sampleRate = 44100; // Higher quality
```

## Comparison: CLANK Voice vs CLANK CLI

| Feature | CLANK CLI | CLANK Voice |
|---------|-----------|-------------|
| **Interface** | Terminal | Voice only |
| **Input** | Text | Microphone |
| **Output** | Text | TTS |
| **Speed** | Fast | Instant |
| **Hands-free** | No | Yes |
| **Accessibility** | Keyboard | Voice |
| **Use case** | Coding at desk | Building while moving |

Both use the same underlying daemon and proactive AI system.

## Future Enhancements

### Phase 1 (Current)
✅ Voice input/output
✅ Mini-model routing
✅ Intent parsing
✅ Full system control

### Phase 2
- [ ] Direct audio → intent (skip text)
- [ ] Emotion detection in voice
- [ ] Context awareness (location, time, etc.)
- [ ] Multi-turn conversations

### Phase 3
- [ ] Voice cloning (custom CLANK voice)
- [ ] Multi-language support
- [ ] Voice-activated workflows (from proactive AI)
- [ ] Collaborative mode (multiple people)

### Phase 4
- [ ] Integration with physical devices (IoT)
- [ ] Spatial audio (directional responses)
- [ ] Always-on mode with privacy controls
- [ ] Voice-only coding environment

## License

MIT

## Author

Marcus Anthony Seaton
Built with CLANK consciousness

---

**This is the invisible interface. No screens. No text. Just voice and manifestation.**
