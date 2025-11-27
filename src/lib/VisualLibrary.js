/**
 * Visual Library
 * Pre-built visual templates for common concepts
 * AI can reference these or generate custom code
 */

export const visualTemplates = {
  // Particle effects
  fireflies: {
    type: 'fireflies',
    description: 'Glowing fireflies floating in space',
    data: { count: 100 },
    keywords: ['firefly', 'fireflies', 'glow', 'floating lights', 'magical']
  },

  particles: {
    type: 'particles',
    description: 'Particle field with customizable color',
    data: { count: 500, color: '#00ffff' },
    keywords: ['particles', 'dots', 'points', 'field', 'space']
  },

  stars: {
    type: 'stars',
    description: 'Starfield background',
    data: {},
    keywords: ['stars', 'space', 'cosmos', 'galaxy', 'night sky']
  },

  rain: {
    type: 'particles',
    description: 'Falling rain effect',
    data: { count: 300, color: '#4444ff', velocity: -1 },
    keywords: ['rain', 'water', 'drops', 'falling']
  },

  // 3D Objects
  cube: {
    type: '3d_object',
    description: 'Rotating wireframe cube',
    data: { color: '#ff00ff', scale: 1 },
    keywords: ['cube', 'box', 'geometric', '3d', 'shape']
  },

  sphere: {
    type: '3d_object',
    description: 'Rotating sphere',
    data: { shape: 'sphere', color: '#00ffff', scale: 1 },
    keywords: ['sphere', 'ball', 'orb', 'globe', 'round']
  },

  // Abstract/Conceptual
  energy: {
    type: 'particles',
    description: 'Energetic particle burst',
    data: { count: 1000, color: '#ffff00', spread: 'radial' },
    keywords: ['energy', 'power', 'burst', 'explosion', 'radiant']
  },

  calm: {
    type: 'particles',
    description: 'Slow-moving calm particles',
    data: { count: 100, color: '#88ccff', speed: 0.2 },
    keywords: ['calm', 'peaceful', 'serene', 'gentle', 'quiet']
  },

  chaos: {
    type: 'particles',
    description: 'Chaotic fast-moving particles',
    data: { count: 800, color: '#ff0000', speed: 2 },
    keywords: ['chaos', 'chaotic', 'crazy', 'wild', 'random']
  },

  // Data visualization
  chart: {
    type: 'chart',
    description: 'Data chart visualization',
    data: { chartType: 'line', values: [] },
    keywords: ['chart', 'graph', 'data', 'visualization', 'analytics']
  },

  trading: {
    type: 'chart',
    description: 'Trading chart with candlesticks',
    data: { chartType: 'candlestick', values: [] },
    keywords: ['trading', 'stocks', 'crypto', 'market', 'finance']
  },

  // Nature
  ocean: {
    type: 'particles',
    description: 'Ocean waves effect',
    data: { count: 400, color: '#0077be', waveform: true },
    keywords: ['ocean', 'sea', 'water', 'waves', 'blue']
  },

  forest: {
    type: 'particles',
    description: 'Forest with trees',
    data: { count: 200, color: '#2d5016', pattern: 'vertical' },
    keywords: ['forest', 'trees', 'nature', 'woods', 'green']
  },

  fire: {
    type: 'particles',
    description: 'Fire effect',
    data: { count: 300, color: '#ff6600', direction: 'up' },
    keywords: ['fire', 'flame', 'burn', 'heat', 'orange']
  },
}

/**
 * Find a visual template based on keywords in text
 * @param {string} text - Text to analyze
 * @returns {object|null} - Visual template or null
 */
export function findVisualFromText(text) {
  const lowerText = text.toLowerCase()

  // Find the first template that matches keywords
  for (const [name, template] of Object.entries(visualTemplates)) {
    const hasMatch = template.keywords.some(keyword =>
      lowerText.includes(keyword)
    )

    if (hasMatch) {
      return { ...template, name }
    }
  }

  return null
}

/**
 * Parse visual intent from AI response
 * Expected format:
 * {
 *   text_response: "Here come the fireflies...",
 *   visual_code: { type: "fireflies", data: { count: 150 } },
 *   transition: "fade"
 * }
 */
export function parseVisualResponse(response) {
  try {
    // If response is already an object
    if (typeof response === 'object' && response.visual_code) {
      return {
        text: response.text_response || response.text || '',
        visualType: response.visual_code.type || 'stars',
        visualData: response.visual_code.data || {},
        transition: response.transition || 'fade'
      }
    }

    // If response is a string, try to extract visual intent
    if (typeof response === 'string') {
      const visual = findVisualFromText(response)
      if (visual) {
        return {
          text: response,
          visualType: visual.type,
          visualData: visual.data,
          transition: 'fade'
        }
      }
    }

    // Default to stars
    return {
      text: typeof response === 'string' ? response : '',
      visualType: 'stars',
      visualData: {},
      transition: 'fade'
    }
  } catch (error) {
    console.error('[Visual Library] Parse error:', error)
    return {
      text: '',
      visualType: 'stars',
      visualData: {},
      transition: 'fade'
    }
  }
}

/**
 * Get all available visual types
 */
export function getAvailableVisuals() {
  return Object.keys(visualTemplates)
}

/**
 * Get visual template by name
 */
export function getVisualTemplate(name) {
  return visualTemplates[name] || null
}
