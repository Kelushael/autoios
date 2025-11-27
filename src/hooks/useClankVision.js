import { useState, useEffect, useRef, useCallback } from 'react'
import { elementToBase64 } from '../lib/utils'

/**
 * Environmental Awareness Hook
 * Captures camera feed and screen to give CLANK vision
 *
 * Returns:
 * - cameraStream: MediaStream from webcam
 * - screenStream: MediaStream from screen capture
 * - getCameraSnapshot: Function to get base64 image from camera
 * - getScreenSnapshot: Function to get base64 image from screen
 * - startCamera: Function to initialize camera
 * - startScreen: Function to initialize screen capture
 * - stopCamera: Function to stop camera
 * - stopScreen: Function to stop screen capture
 * - cameraEnabled: Boolean
 * - screenEnabled: Boolean
 */
export function useClankVision(options = {}) {
  const {
    captureInterval = 3000, // Capture frame every 3 seconds
    imageQuality = 0.7,
    imageType = 'image/jpeg',
  } = options

  const [cameraStream, setCameraStream] = useState(null)
  const [screenStream, setScreenStream] = useState(null)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [screenEnabled, setScreenEnabled] = useState(false)
  const [error, setError] = useState(null)

  const cameraVideoRef = useRef(null)
  const screenVideoRef = useRef(null)
  const captureTimerRef = useRef(null)

  /**
   * Initialize camera capture
   */
  const startCamera = useCallback(async () => {
    try {
      // Request camera permission if in Electron
      if (window.electron?.requestCameraPermission) {
        const granted = await window.electron.requestCameraPermission()
        if (!granted) {
          throw new Error('Camera permission denied')
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      })

      setCameraStream(stream)
      setCameraEnabled(true)
      setError(null)

      // Create video element for capture
      if (!cameraVideoRef.current) {
        cameraVideoRef.current = document.createElement('video')
        cameraVideoRef.current.autoplay = true
        cameraVideoRef.current.muted = true
      }
      cameraVideoRef.current.srcObject = stream

      return stream
    } catch (err) {
      console.error('Failed to start camera:', err)
      setError(err.message)
      setCameraEnabled(false)
      return null
    }
  }, [])

  /**
   * Initialize screen capture
   */
  const startScreen = useCallback(async () => {
    try {
      let stream

      // Use Electron's desktopCapturer if available
      if (window.electron?.getScreenSources) {
        const sources = await window.electron.getScreenSources()
        const primaryScreen = sources.find(source => source.name.includes('Entire') || source.name.includes('Screen'))

        if (primaryScreen) {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: primaryScreen.id,
                minWidth: 1280,
                maxWidth: 1920,
                minHeight: 720,
                maxHeight: 1080
              }
            }
          })
        }
      } else {
        // Fallback to browser getDisplayMedia
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        })
      }

      setScreenStream(stream)
      setScreenEnabled(true)
      setError(null)

      // Create video element for capture
      if (!screenVideoRef.current) {
        screenVideoRef.current = document.createElement('video')
        screenVideoRef.current.autoplay = true
        screenVideoRef.current.muted = true
      }
      screenVideoRef.current.srcObject = stream

      return stream
    } catch (err) {
      console.error('Failed to start screen capture:', err)
      setError(err.message)
      setScreenEnabled(false)
      return null
    }
  }, [])

  /**
   * Stop camera capture
   */
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
      setCameraEnabled(false)
    }
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null
    }
  }, [cameraStream])

  /**
   * Stop screen capture
   */
  const stopScreen = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop())
      setScreenStream(null)
      setScreenEnabled(false)
    }
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null
    }
  }, [screenStream])

  /**
   * Get camera snapshot as base64
   */
  const getCameraSnapshot = useCallback(() => {
    if (!cameraVideoRef.current || !cameraEnabled) {
      return null
    }

    try {
      const video = cameraVideoRef.current
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        return null
      }

      return elementToBase64(video, imageType, imageQuality)
    } catch (err) {
      console.error('Failed to capture camera snapshot:', err)
      return null
    }
  }, [cameraEnabled, imageType, imageQuality])

  /**
   * Get screen snapshot as base64
   */
  const getScreenSnapshot = useCallback(() => {
    if (!screenVideoRef.current || !screenEnabled) {
      return null
    }

    try {
      const video = screenVideoRef.current
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        return null
      }

      return elementToBase64(video, imageType, imageQuality)
    } catch (err) {
      console.error('Failed to capture screen snapshot:', err)
      return null
    }
  }, [screenEnabled, imageType, imageQuality])

  /**
   * Get both snapshots at once
   */
  const getVisionSnapshot = useCallback(() => {
    return {
      camera: getCameraSnapshot(),
      screen: getScreenSnapshot(),
      timestamp: Date.now()
    }
  }, [getCameraSnapshot, getScreenSnapshot])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      stopScreen()
      if (captureTimerRef.current) {
        clearInterval(captureTimerRef.current)
      }
    }
  }, [stopCamera, stopScreen])

  return {
    cameraStream,
    screenStream,
    cameraEnabled,
    screenEnabled,
    error,
    startCamera,
    startScreen,
    stopCamera,
    stopScreen,
    getCameraSnapshot,
    getScreenSnapshot,
    getVisionSnapshot,
  }
}
