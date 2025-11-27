import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Camera, Monitor, Settings } from 'lucide-react'
import { useClankVision } from '../../hooks/useClankVision'
import { cn } from '../../lib/utils'

/**
 * VisionFeed Component
 * Provides controls for environmental awareness (camera + screen capture)
 * Shows CLANK's "eyes" - what it can see
 */
export default function VisionFeed({ enabled, onToggle }) {
  const {
    cameraStream,
    screenStream,
    cameraEnabled,
    screenEnabled,
    error,
    startCamera,
    startScreen,
    stopCamera,
    stopScreen,
  } = useClankVision()

  const [showPreview, setShowPreview] = useState(false)
  const [cameraVideoEl, setCameraVideoEl] = useState(null)
  const [screenVideoEl, setScreenVideoEl] = useState(null)

  // Handle camera video element
  useEffect(() => {
    if (cameraVideoEl && cameraStream) {
      cameraVideoEl.srcObject = cameraStream
    }
  }, [cameraVideoEl, cameraStream])

  // Handle screen video element
  useEffect(() => {
    if (screenVideoEl && screenStream) {
      screenVideoEl.srcObject = screenStream
    }
  }, [screenVideoEl, screenStream])

  const handleToggleCamera = async () => {
    if (cameraEnabled) {
      stopCamera()
    } else {
      await startCamera()
    }
  }

  const handleToggleScreen = async () => {
    if (screenEnabled) {
      stopScreen()
    } else {
      await startScreen()
    }
  }

  const handleToggleVision = () => {
    onToggle(!enabled)
    if (!enabled) {
      // Auto-start camera when enabling vision
      if (!cameraEnabled) {
        startCamera()
      }
    }
  }

  return (
    <div className="fixed top-4 right-4 z-20 flex flex-col gap-2">
      {/* Main Vision Toggle */}
      <motion.button
        onClick={handleToggleVision}
        className={cn(
          'glass-dark rounded-full p-3 transition-all duration-300',
          enabled && 'bg-blue-500/30 ring-2 ring-blue-400/50'
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={enabled ? 'CLANK Vision Active' : 'Enable CLANK Vision'}
      >
        {enabled ? (
          <Eye className="w-6 h-6 text-blue-400" />
        ) : (
          <EyeOff className="w-6 h-6 text-gray-400" />
        )}
      </motion.button>

      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-2"
          >
            {/* Camera Toggle */}
            <motion.button
              onClick={handleToggleCamera}
              className={cn(
                'glass-dark rounded-full p-3 transition-all duration-300',
                cameraEnabled && 'bg-green-500/30 ring-2 ring-green-400/50'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={cameraEnabled ? 'Camera Active' : 'Enable Camera'}
            >
              <Camera className={cn(
                'w-5 h-5',
                cameraEnabled ? 'text-green-400' : 'text-gray-400'
              )} />
            </motion.button>

            {/* Screen Capture Toggle */}
            <motion.button
              onClick={handleToggleScreen}
              className={cn(
                'glass-dark rounded-full p-3 transition-all duration-300',
                screenEnabled && 'bg-purple-500/30 ring-2 ring-purple-400/50'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={screenEnabled ? 'Screen Capture Active' : 'Enable Screen Capture'}
            >
              <Monitor className={cn(
                'w-5 h-5',
                screenEnabled ? 'text-purple-400' : 'text-gray-400'
              )} />
            </motion.button>

            {/* Preview Toggle */}
            <motion.button
              onClick={() => setShowPreview(!showPreview)}
              className="glass-dark rounded-full p-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Toggle Preview"
            >
              <Settings className="w-5 h-5 text-gray-400" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="glass-dark rounded-lg p-3 max-w-xs"
          >
            <p className="text-xs text-red-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Windows */}
      <AnimatePresence>
        {showPreview && (cameraEnabled || screenEnabled) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-4 right-4 flex gap-2"
          >
            {/* Camera Preview */}
            {cameraEnabled && (
              <div className="glass-dark rounded-lg overflow-hidden">
                <div className="px-3 py-2 border-b border-white/10">
                  <p className="text-xs text-green-400 font-medium">Camera Feed</p>
                </div>
                <video
                  ref={setCameraVideoEl}
                  autoPlay
                  muted
                  playsInline
                  className="w-48 h-36 object-cover"
                />
              </div>
            )}

            {/* Screen Preview */}
            {screenEnabled && (
              <div className="glass-dark rounded-lg overflow-hidden">
                <div className="px-3 py-2 border-b border-white/10">
                  <p className="text-xs text-purple-400 font-medium">Screen Capture</p>
                </div>
                <video
                  ref={setScreenVideoEl}
                  autoPlay
                  muted
                  playsInline
                  className="w-48 h-36 object-cover"
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vision Status Indicator */}
      <AnimatePresence>
        {(cameraEnabled || screenEnabled) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 left-4 glass-dark rounded-full px-4 py-2 flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">
              CLANK sees {cameraEnabled && 'you'}{cameraEnabled && screenEnabled && ' and '}{screenEnabled && 'your screen'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
