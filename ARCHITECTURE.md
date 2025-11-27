# Base44 CLANK - Technical Architecture

## Vision

An AI chatbot where the conversation itself generates the visual background in real-time. As you chat, the UI morphs to illustrate what you're discussing - creating a "living mirror" or "TV screen" effect.

---

## System Layers

### Layer 1: Reality Canvas (z-index: 1)
**Purpose**: Dynamic visual background that responds to conversation

**Technology**:
- React Three Fiber (React wrapper for Three.js)
- @react-three/drei (helpers)
- WebGL for GPU acceleration

**Implementation**: `src/components/clank/RealityCanvas.jsx`

**Features**:
- Renders 3D scenes and effects
- Listens for `clank-visual-update` events
- Maintains scene state (doesn't restart from scratch)
- Supports delta updates to modify existing scene
- 60fps performance via requestAnimationFrame

**Visual Types**:
- Particle systems (fireflies, rain, energy)
- 3D objects (cubes, spheres, custom meshes)
- Starfields and backgrounds
- Data visualizations (charts, graphs)
- Nature effects (fire, ocean, forest)

---

### Layer 2: Chat Interface (z-index: 10)
**Purpose**: Semi-transparent chat overlay

**Technology**:
- React for UI
- Framer Motion for animations
- Tailwind CSS for styling
- Glassmorphism (backdrop-blur)

**Implementation**: `src/components/clank/FloatingClank.jsx`

**Features**:
- Real-time messaging
- Typing indicators
- Message history
- Visual status indicators
- Voice mode (future)
- Mobile-responsive

**Flow**:
1. User types message
2. Get camera/screen snapshot (if vision enabled)
3. Send to AI Director
4. Receive response with visual_code
5. Display message
6. Emit visual-update event
7. RealityCanvas renders visual

---

### Layer 3: Environmental Awareness (z-index: 20)
**Purpose**: CLANK sees everything you see

**Technology**:
- getUserMedia API (camera)
- getDisplayMedia API (screen capture)
- Electron desktopCapturer (desktop)
- Canvas API (image conversion)

**Implementation**:
- Hook: `src/hooks/useClankVision.js`
- Component: `src/components/clank/VisionFeed.jsx`

**Features**:
- Real-time camera feed
- Screen capture
- Base64 image encoding
- Configurable capture interval (default 3s)
- Privacy controls (pause/resume)
- Preview windows
- Permission handling

**Data Flow**:
```
Camera/Screen → Video Element → Canvas → Base64 → LLM
```

**Snapshot Format**:
```javascript
{
  camera: "data:image/jpeg;base64,/9j/4AAQ...",
  screen: "data:image/jpeg;base64,/9j/4AAQ...",
  timestamp: 1234567890
}
```

---

### Layer 4: AI Director (Backend Logic)
**Purpose**: Parse messages, visual context, and generate visuals

**Technology**:
- Vision-capable LLM (Claude/GPT-4V/Ollama)
- Multimodal input processing
- JSON response parsing

**Implementation**: `src/lib/ai-director.js`

**System Prompt**:
```
You are CLANK, an AI that speaks through visuals.
You can see the user's camera and screen.

For every response, generate:
{
  "text_response": "Your chat reply",
  "visual_code": {
    "type": "visual_type",
    "data": { /* parameters */ }
  },
  "transition": "fade|morph|explode",
  "context_awareness": "What you noticed in camera/screen"
}
```

**Flow**:
1. Receive: message + camera image + screen image
2. Format multimodal input for LLM
3. Call LLM API
4. Parse JSON response
5. Extract text, visual_code, transition
6. Return structured data

**Fallback Mode**:
When no LLM configured, uses keyword detection:
```javascript
"Show me fireflies" → { type: "fireflies", data: { count: 100 } }
```

---

## Event System

### clank-visual-update Event

**Purpose**: Decouple chat from visuals

**Emitter**: FloatingClank.jsx

**Listener**: RealityCanvas.jsx (via useVisualEngine hook)

**Payload**:
```javascript
{
  visualType: "fireflies",
  data: { count: 100, color: "#ffff00" },
  transition: "fade"
}
```

**Usage**:
```javascript
// Emit
const event = new CustomEvent('clank-visual-update', {
  detail: { visualType, data, transition }
})
window.dispatchEvent(event)

// Listen
window.addEventListener('clank-visual-update', (event) => {
  const { visualType, data, transition } = event.detail
  // Update visuals
})
```

---

## Data Flow

### Message Send Flow

```
┌─────────────┐
│ User Input  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Get Vision Snapshot │ (camera + screen)
└──────┬──────────────┘
       │
       ▼
┌─────────────────┐
│  AI Director    │ (format multimodal message)
└──────┬──────────┘
       │
       ▼
┌─────────────┐
│  LLM API    │ (Claude/GPT-4V/Ollama)
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ Parse Response   │ (extract text + visual_code)
└──────┬───────────┘
       │
       ├──────────────────┐
       ▼                  ▼
┌─────────────┐   ┌──────────────────┐
│Display Text │   │ Emit Visual Event│
└─────────────┘   └──────┬───────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │ Reality Canvas│
                  │ Updates Visual│
                  └──────────────┘
```

### Vision Capture Flow

```
┌──────────────┐
│ Vision Enabled│
└───────┬───────┘
        │
        ▼
┌────────────────────┐
│ Start Camera/Screen│ (getUserMedia/getDisplayMedia)
└────────┬───────────┘
         │
         ▼
┌────────────────┐
│  Video Stream  │ (continuous)
└────────┬───────┘
         │
         ▼ (on message send)
┌─────────────────┐
│ Capture Frame   │ (video → canvas)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Convert to Base64│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Send to LLM     │
└─────────────────┘
```

---

## Performance Optimizations

### Visual Updates
- **Throttling**: Max 1 visual update per 2 seconds
- **Delta Updates**: Modify existing scene instead of recreating
- **GPU Acceleration**: WebGL rendering
- **requestAnimationFrame**: Smooth 60fps animations

### Camera/Screen Capture
- **Lazy Capture**: Only capture on message send (not continuous)
- **Configurable Quality**: JPEG at 70% quality by default
- **Resolution Limits**: Camera 720p, Screen 1080p max
- **Cleanup**: Stop streams when not in use

### Memory Management
- **Message History**: Keep last 10 messages
- **Visual History**: Keep last 10 visual states
- **Stream Cleanup**: Stop all streams on unmount
- **Event Listeners**: Remove on unmount

---

## Security Considerations

### Sandboxing
- AI-generated code runs in isolated React components
- No eval() or Function() constructor
- Pre-defined visual templates only
- Rate limiting on visual updates

### Privacy
- Camera/screen capture requires explicit user consent
- Visual indicator when CLANK is "seeing"
- Pause/resume controls
- No data stored without permission

### API Security
- API keys in environment variables (.env)
- Never expose keys in client code
- Use HTTPS for all API calls
- Validate all LLM responses

---

## Extension Points

### Adding New Visuals
1. Add template to `VisualLibrary.js`
2. Implement React component in `RealityCanvas.jsx`
3. Add to VisualScene switch statement

### Adding New LLM Providers
1. Edit `ai-director.js`
2. Implement in `callVisionLLM` function
3. Add API key to `.env`

### Adding Voice Mode
1. Use Web Speech API or external service
2. Add voice input handling in FloatingClank
3. Convert speech to text → send to AI Director
4. Use TTS for AI responses

### Adding Memory/Context
1. Store messages in IndexedDB or localStorage
2. Include recent context in LLM calls
3. Implement semantic search for retrieval

---

## File Structure

```
autoios/
├── electron/
│   ├── main.js           # Electron main process
│   └── preload.js        # IPC bridge
├── src/
│   ├── components/
│   │   └── clank/
│   │       ├── RealityCanvas.jsx    # Layer 1: Visuals
│   │       ├── FloatingClank.jsx    # Layer 2: Chat
│   │       └── VisionFeed.jsx       # Layer 3: Controls
│   ├── hooks/
│   │   ├── useClankVision.js        # Camera/screen capture
│   │   └── useVisualEngine.js       # Visual state management
│   ├── lib/
│   │   ├── ai-director.js           # LLM integration
│   │   ├── VisualLibrary.js         # Visual templates
│   │   └── utils.js                 # Utilities
│   ├── App.jsx                      # Root component
│   ├── main.jsx                     # React entry point
│   └── index.css                    # Global styles
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## Technology Stack

**Frontend**:
- React 18.2
- Vite 5.2 (build tool)
- Tailwind CSS 3.4
- Framer Motion 11

**3D Graphics**:
- Three.js 0.163
- React Three Fiber 8.16
- @react-three/drei 9.105

**Desktop**:
- Electron 29.1
- electron-builder 24.13

**AI**:
- Claude API (Anthropic)
- GPT-4V (OpenAI)
- Ollama (local)

**State Management**:
- Zustand 4.5 (if needed)
- React hooks (useState, useEffect, useCallback)

---

## Future Enhancements

1. **Advanced Transitions**: Implement morph and explode transitions
2. **Voice Interface**: Full voice input/output
3. **Gesture Control**: Hand tracking via MediaPipe
4. **AR Mode**: Overlay visuals on camera feed
5. **Multi-User**: WebRTC for shared visual experiences
6. **Plugin System**: User-created visual extensions
7. **Recording**: Save visual sessions as videos
8. **Presets**: Save and load visual configurations

---

## Philosophy

**Meta-Recursive**: The interface reflects the conversation
**Living Mirror**: What you say is what you see
**Environmental Awareness**: AI sees what you see
**Conversational Visuals**: Chat generates art in real-time

This is not just a chatbot - it's a visual consciousness interface.

---

## Credits

Architecture & Implementation: Marcus Anthony Seaton
Concept: Base44 - Meta-Recursive Visual Chat Interface
