import { useState, useEffect, useCallback } from 'react'
import { throttle } from '../lib/utils'

/**
 * Visual Engine Hook
 * Manages visual state and executes AI-generated visual code
 * Listens for 'clank-visual-update' events from the chat system
 */
export function useVisualEngine() {
  const [currentVisual, setCurrentVisual] = useState('stars')
  const [visualData, setVisualData] = useState({})
  const [transitionType, setTransitionType] = useState('fade')
  const [history, setHistory] = useState([])

  /**
   * Execute visual code (throttled to prevent spam)
   */
  const executeVisualUpdate = useCallback(
    throttle((event) => {
      const { visualType, data, transition } = event.detail

      // Add to history
      setHistory(prev => [...prev, {
        visualType,
        data,
        timestamp: Date.now()
      }].slice(-10)) // Keep last 10 visuals

      // Update current visual
      setTransitionType(transition || 'fade')
      setCurrentVisual(visualType)
      setVisualData(data || {})

      console.log('[Visual Engine] Updated:', visualType, data)
    }, 2000), // Max 1 update per 2 seconds
    []
  )

  /**
   * Listen for visual update events
   */
  useEffect(() => {
    window.addEventListener('clank-visual-update', executeVisualUpdate)

    return () => {
      window.removeEventListener('clank-visual-update', executeVisualUpdate)
    }
  }, [executeVisualUpdate])

  /**
   * Manually trigger a visual update
   */
  const updateVisual = useCallback((visualType, data = {}, transition = 'fade') => {
    const event = new CustomEvent('clank-visual-update', {
      detail: { visualType, data, transition }
    })
    window.dispatchEvent(event)
  }, [])

  /**
   * Reset to default visual
   */
  const resetVisual = useCallback(() => {
    updateVisual('stars', {}, 'fade')
  }, [updateVisual])

  return {
    currentVisual,
    visualData,
    transitionType,
    history,
    updateVisual,
    resetVisual,
  }
}
