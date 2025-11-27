# Base44 CLANK 🌟

**Meta-Recursive Visual Chat Interface**

An AI chatbot where the conversation itself generates the visual background in real-time. As you chat, the UI morphs to illustrate what you're discussing - creating a "living mirror" where **what you say is what you see**.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Key Features

### 🎨 **Reality Canvas**
- Conversation generates real-time 3D visuals using Three.js
- Pre-built templates: fireflies, particles, 3D objects, nature effects
- Smooth transitions and morphing between visual states
- 60fps performance with GPU acceleration

### 👁️ **Environmental Awareness**
- CLANK sees through your **camera** and **screen capture**
- Multimodal vision: AI responds to what it sees
- Privacy controls with pause/resume
- Base64 image encoding for LLM integration

### 💬 **Visual Chat**
- Semi-transparent glassmorphism interface
- Real-time messaging with typing indicators
- Visuals update as you chat
- Voice mode (coming soon)

### 🤖 **AI Director**
- Vision-capable LLM integration (Claude/GPT-4V/Ollama)
- Parses conversation + visual context
- Generates visual code automatically
- Fallback keyword detection

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run in browser (fastest)
npm run dev

# Run as Electron app
npm run electron:dev

# Build for production
npm run electron:build
```

Then:
1. Click the **eye icon** (top-right) to enable vision
2. Grant camera/screen permissions
3. Start chatting!

Try: *"Show me fireflies"* or *"I'm feeling chaotic"*

---

## 📸 Screenshots

```
┌─────────────────────────────────────┐
│  👁️ 📷 🖥️ ⚙️  [Vision Controls]   │
├─────────────────────────────────────┤
│                                     │
│    [Dynamic 3D Background]          │
│        ✨ Fireflies ✨              │
│                                     │
│  ┌───────────────────────────┐     │
│  │  💬 Chat Interface        │     │
│  │  ─────────────────────    │     │
│  │  You: Show me fireflies   │     │
│  │  CLANK: Here they come... │     │
│  │                           │     │
│  │  [Type message...]  [📤] │     │
│  └───────────────────────────┘     │
│                                     │
└─────────────────────────────────────┘
```

---

## 🏗️ Architecture

### 4 Layers:

1. **Reality Canvas** (z-index: 1) - Three.js background
2. **Chat Interface** (z-index: 10) - Glassmorphism overlay
3. **Vision Controls** (z-index: 20) - Camera/screen toggles
4. **AI Director** (Backend) - LLM + visual generation

### Event Flow:
```
User Message → Vision Snapshot → AI Director → LLM
                                    ↓
Visual Update ← Parse Response ← AI Response
```

---

## 🔌 LLM Integration

The system works with any vision-capable LLM. Configure in `src/lib/ai-director.js`:

**Claude API** (Anthropic):
```javascript
// Edit callVisionLLM() function
const response = await fetch('https://api.anthropic.com/v1/messages', {
  headers: { 'x-api-key': process.env.VITE_ANTHROPIC_API_KEY },
  // ... see SETUP.md for full code
})
```

**GPT-4V** (OpenAI):
```javascript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: { 'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}` },
  // ... see SETUP.md for full code
})
```

**Ollama** (Local):
```bash
ollama run llava
# Then configure endpoint in ai-director.js
```

Create `.env`:
```env
VITE_ANTHROPIC_API_KEY=your_key_here
# or
VITE_OPENAI_API_KEY=your_key_here
```

---

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Installation, configuration, deployment
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical deep dive

---

## 🎯 Visual Templates

Pre-built effects in `src/lib/VisualLibrary.js`:

| Type | Keywords | Description |
|------|----------|-------------|
| `fireflies` | firefly, glow, magical | Glowing particles |
| `particles` | particles, dots, field | Particle field |
| `stars` | stars, space, cosmos | Starfield |
| `cube` | cube, geometric, 3d | Rotating wireframe cube |
| `energy` | energy, power, burst | Energetic particles |
| `calm` | calm, peaceful, serene | Slow particles |
| `chaos` | chaos, wild, random | Fast chaotic particles |
| `fire` | fire, flame, burn | Fire effect |
| `ocean` | ocean, waves, water | Ocean waves |

---

## 🛠️ Tech Stack

**Frontend**: React, Vite, Tailwind CSS, Framer Motion
**3D**: Three.js, React Three Fiber, @react-three/drei
**Desktop**: Electron, electron-builder
**AI**: Claude API / GPT-4V / Ollama

---

## 📱 Platform Support

- ✅ **Desktop** (Electron) - Windows, macOS, Linux
- ✅ **Browser** (Web) - Chrome, Edge, Safari, Firefox
- ✅ **Mobile** - Responsive, touch-friendly (camera/screen limited)

---

## 🔐 Privacy & Security

- ✅ Camera/screen require explicit user consent
- ✅ Visual indicator when "seeing" is active
- ✅ Pause/resume controls
- ✅ No data stored without permission
- ✅ API keys in environment variables
- ✅ Sandboxed visual code execution

---

## 🤝 Contributing

This is a living system! Add your own:
- Visual templates (`VisualLibrary.js`)
- Transition effects (`RealityCanvas.jsx`)
- LLM providers (`ai-director.js`)
- UI enhancements

---

## 🗺️ Roadmap

- [ ] Voice input/output (Web Speech API)
- [ ] Advanced transitions (morph, explode)
- [ ] Recording (save visual sessions as video)
- [ ] Gesture control (MediaPipe hand tracking)
- [ ] AR mode (overlay visuals on camera)
- [ ] Multi-user (WebRTC shared experiences)
- [ ] Plugin system (user-created visuals)

---

## 📄 License

MIT © 2024 Marcus Anthony Seaton

---

## 🌟 Philosophy

> **Meta-Recursive**: The interface reflects the conversation
> **Living Mirror**: What you say is what you see
> **Environmental Awareness**: AI sees what you see
> **Conversational Visuals**: Chat generates art in real-time

This is not just a chatbot - it's a **visual consciousness interface**.

---

**Built with 💜 by Marcus Anthony Seaton**

*Part of the Base44 ecosystem*
