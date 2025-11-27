import { useState } from 'react'
import RealityCanvas from './components/clank/RealityCanvas'
import FloatingClank from './components/clank/FloatingClank'
import VisionFeed from './components/clank/VisionFeed'

function App() {
  const [visionEnabled, setVisionEnabled] = useState(false)

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* Layer 1: Reality Canvas - Dynamic visual background (z-index: 1) */}
      <RealityCanvas />

      {/* Layer 2: Chat Interface - Semi-transparent overlay (z-index: 10) */}
      <FloatingClank visionEnabled={visionEnabled} />

      {/* Layer 3: Vision Feed Controls - Environmental awareness (z-index: 20) */}
      <VisionFeed
        enabled={visionEnabled}
        onToggle={setVisionEnabled}
      />
    </div>
  )
}

export default App
