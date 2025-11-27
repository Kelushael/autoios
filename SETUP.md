# Base44 CLANK - Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run in Development Mode

**Browser Mode** (fastest for testing):
```bash
npm run dev
```
Open http://localhost:5173

**Electron Mode** (full desktop app):
```bash
npm run electron:dev
```

### 3. Build for Production

**Web Build**:
```bash
npm run build
npm run preview
```

**Electron Build**:
```bash
npm run electron:build
```

Packaged apps will be in the `release` directory.

---

## 🎯 System Architecture

### Layer 1: Reality Canvas (z-index: 1)
- **Component**: `src/components/clank/RealityCanvas.jsx`
- **Purpose**: Dynamic visual background using Three.js
- **Features**:
  - Responds to conversation in real-time
  - Supports pre-built templates (fireflies, particles, 3D objects)
  - Smooth transitions between visual states

### Layer 2: Chat Interface (z-index: 10)
- **Component**: `src/components/clank/FloatingClank.jsx`
- **Purpose**: Semi-transparent chat overlay with glassmorphism
- **Features**:
  - Real-time messaging with AI
  - Sends camera + screen snapshots to LLM
  - Triggers visual updates based on conversation

### Layer 3: Environmental Awareness (z-index: 20)
- **Hook**: `src/hooks/useClankVision.js`
- **Component**: `src/components/clank/VisionFeed.jsx`
- **Purpose**: CLANK sees everything you see
- **Features**:
  - Camera capture via `getUserMedia`
  - Screen capture via `getDisplayMedia`
  - Base64 encoding for multimodal LLM
  - Privacy controls (pause/resume)

### Layer 4: AI Director (Backend)
- **Module**: `src/lib/ai-director.js`
- **Purpose**: Parses messages + visual context, generates visuals
- **Features**:
  - Formats messages with camera/screen images
  - Calls vision-capable LLM
  - Parses response for visual code
  - Fallback keyword detection

---

## 🔌 LLM Integration

### Current State
The system uses **keyword-based fallback** when no LLM is configured.

### Integrating a Real LLM

Edit `src/lib/ai-director.js` in the `callVisionLLM` function:

#### Option 1: Claude API (Anthropic)

```javascript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-3-opus-20240229',
    max_tokens: 1024,
    system: CLANK_SYSTEM_PROMPT,
    messages: [...conversationHistory, formattedMessage]
  })
})

const data = await response.json()
const aiResponse = JSON.parse(data.content[0].text)
```

Create `.env`:
```env
VITE_ANTHROPIC_API_KEY=your_api_key_here
```

#### Option 2: OpenAI GPT-4V

```javascript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
  },
  body: JSON.stringify({
    model: 'gpt-4-vision-preview',
    messages: [
      { role: 'system', content: CLANK_SYSTEM_PROMPT },
      ...conversationHistory,
      formattedMessage
    ],
    max_tokens: 1024
  })
})

const data = await response.json()
const aiResponse = JSON.parse(data.choices[0].message.content)
```

Create `.env`:
```env
VITE_OPENAI_API_KEY=your_api_key_here
```

#### Option 3: Local LLM (Ollama)

Install [Ollama](https://ollama.ai/) and run a vision model:

```bash
ollama run llava
```

Then in `ai-director.js`:

```javascript
const response = await fetch('http://localhost:11434/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'llava',
    messages: [...conversationHistory, formattedMessage],
    stream: false
  })
})

const data = await response.json()
const aiResponse = JSON.parse(data.message.content)
```

---

## 📸 Camera & Screen Permissions

### Browser (Development)
- Camera: Browser will prompt for permission
- Screen: User must manually select screen to share

### Electron (Production)
- **macOS**: Add to `Info.plist`:
  ```xml
  <key>NSCameraUsageDescription</key>
  <string>CLANK needs camera access to see you</string>
  <key>NSMicrophoneUsageDescription</key>
  <string>CLANK needs microphone for voice mode</string>
  ```

- **Windows/Linux**: Permissions handled automatically

---

## 🎨 Visual Templates

### Pre-built Templates
Located in `src/lib/VisualLibrary.js`:

- **Particles**: fireflies, particles, stars, rain, energy, calm, chaos
- **3D Objects**: cube, sphere
- **Nature**: ocean, forest, fire
- **Data**: chart, trading

### Adding Custom Visuals

1. **Add template to VisualLibrary.js**:
```javascript
export const visualTemplates = {
  // ... existing templates

  aurora: {
    type: 'aurora',
    description: 'Northern lights effect',
    data: { colors: ['#00ff00', '#0000ff', '#ff00ff'] },
    keywords: ['aurora', 'northern lights', 'lights']
  }
}
```

2. **Implement in RealityCanvas.jsx**:
```javascript
function Aurora({ colors }) {
  const meshRef = useRef()

  useFrame((state) => {
    // Animation logic
  })

  return (
    <mesh ref={meshRef}>
      {/* Aurora geometry and materials */}
    </mesh>
  )
}

// Add to VisualScene switch:
case 'aurora':
  return <Aurora colors={visualData?.colors} />
```

---

## 🧪 Testing

### Test Camera Capture
1. Click the eye icon (top-right)
2. Click the camera icon
3. Grant camera permission
4. Click settings icon to view preview

### Test Screen Capture
1. Enable vision (eye icon)
2. Click monitor icon
3. Select screen to share
4. View preview

### Test Visual Generation
Type these messages in chat:
- "Show me fireflies" → Should show fireflies
- "I'm feeling chaotic" → Should show chaos particles
- "Show me a cube" → Should show rotating cube
- "Take me to space" → Should show stars

---

## 🔧 Configuration

### Visual Update Rate
Edit `src/hooks/useVisualEngine.js`:

```javascript
throttle((event) => {
  // ...
}, 2000) // Change from 2000ms to desired rate
```

### Vision Capture Interval
Edit `src/hooks/useClankVision.js`:

```javascript
const {
  captureInterval = 3000, // Change from 3000ms
  imageQuality = 0.7,     // 0 to 1
  imageType = 'image/jpeg' // or 'image/png'
} = options
```

### Camera Resolution
Edit `src/hooks/useClankVision.js`:

```javascript
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1280 },  // Change resolution
    height: { ideal: 720 },
    facingMode: 'user'
  },
  audio: false
})
```

---

## 📱 Mobile Support

The interface is responsive and works on mobile browsers:

- Chat input adapts to smaller screens
- Vision controls scale appropriately
- Touch-friendly interface
- Camera uses front-facing by default

To use as PWA, add `manifest.json` and service worker.

---

## 🐛 Troubleshooting

### Camera not working
- Check browser permissions (chrome://settings/content)
- Ensure HTTPS in production (required for getUserMedia)
- On Electron, check macOS system preferences

### Screen capture not available
- Only works in Electron or Chrome/Edge browsers
- Firefox requires `media.getusermedia.screensharing.enabled`

### Visuals not updating
- Check browser console for errors
- Verify 'clank-visual-update' events are firing
- Ensure Three.js is loading (check Network tab)

### LLM not responding
- Verify API key in `.env`
- Check API rate limits
- Test with keyword fallback first

---

## 🚢 Deployment

### Electron Desktop App

```bash
npm run electron:build
```

Outputs:
- **macOS**: `release/CLANK-1.0.0.dmg`
- **Windows**: `release/CLANK Setup 1.0.0.exe`
- **Linux**: `release/CLANK-1.0.0.AppImage`

### Web App (Static)

```bash
npm run build
```

Deploy the `dist` folder to:
- Vercel
- Netlify
- GitHub Pages
- Any static host

**Note**: Camera/screen capture requires HTTPS!

---

## 📚 Next Steps

1. **Integrate Real LLM**: Follow LLM Integration section above
2. **Add Voice Mode**: Implement Web Speech API or ElevenLabs
3. **Add More Visuals**: Extend VisualLibrary.js
4. **Improve Transitions**: Add morph/explode transition types
5. **Add Memory**: Store conversation history in IndexedDB
6. **Add Base44 SDK**: Integrate with Base44 platform features

---

## 🤝 Contributing

This is a living system. Add your own visual templates, improve the AI Director, or enhance the environmental awareness system.

---

## 📄 License

MIT © Marcus Anthony Seaton
