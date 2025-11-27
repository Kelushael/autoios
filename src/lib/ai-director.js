import { findVisualFromText, parseVisualResponse } from './VisualLibrary'

/**
 * AI Director
 * Handles LLM integration for visual code generation
 * Parses messages + visual context and generates visuals
 */

/**
 * System prompt for vision-capable LLM
 */
const CLANK_SYSTEM_PROMPT = `You are CLANK, an AI that speaks through visuals.

You have environmental awareness - you can see the user's camera feed and screen capture.
When responding, you should:
1. Reference what you see in the camera/screen when relevant
2. Generate appropriate visuals to illustrate the conversation

For every response, generate:
{
  "text_response": "Your chat reply",
  "visual_code": {
    "type": "visual_type",
    "data": { /* visual parameters */ }
  },
  "transition": "fade|morph|explode"
}

Available visual types:
- fireflies: Glowing fireflies (params: count)
- particles: Particle field (params: count, color)
- stars: Starfield background
- 3d_object: 3D shapes (params: shape, color, scale)
- chart: Data visualization
- rain, fire, ocean, forest, energy, calm, chaos

Examples:
User: "Show me fireflies"
{
  "text_response": "Here come the fireflies...",
  "visual_code": { "type": "fireflies", "data": { "count": 100 } },
  "transition": "fade"
}

User: "I'm feeling chaotic"
{
  "text_response": "I sense the chaos within you. Let me show you.",
  "visual_code": { "type": "chaos", "data": { "count": 800 } },
  "transition": "explode"
}

When you see something in the camera or screen, acknowledge it:
"I can see you're in a bright room" or "I notice you have a code editor open"
`

/**
 * Format message with visual context for LLM
 * @param {string} message - User message
 * @param {string|null} cameraImage - Base64 camera image
 * @param {string|null} screenImage - Base64 screen image
 * @returns {object} - Formatted message for LLM
 */
export function formatMessageWithVision(message, cameraImage = null, screenImage = null) {
  const content = []

  // Add text message
  content.push({
    type: 'text',
    text: message
  })

  // Add camera image if available
  if (cameraImage) {
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: cameraImage.split(',')[1] // Remove data:image/jpeg;base64, prefix
      }
    })
  }

  // Add screen image if available
  if (screenImage) {
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: screenImage.split(',')[1]
      }
    })
  }

  return {
    role: 'user',
    content
  }
}

/**
 * Call LLM with vision capabilities
 * This is a placeholder - integrate with your preferred LLM API
 * Options: Claude API, OpenAI GPT-4V, Base44 SDK, etc.
 *
 * @param {string} message - User message
 * @param {string|null} cameraImage - Base64 camera image
 * @param {string|null} screenImage - Base64 screen image
 * @param {array} conversationHistory - Previous messages
 * @returns {Promise<object>} - AI response with visual code
 */
export async function callVisionLLM(
  message,
  cameraImage = null,
  screenImage = null,
  conversationHistory = []
) {
  try {
    // Format message with visual context
    const formattedMessage = formatMessageWithVision(message, cameraImage, screenImage)

    // TODO: Replace with your LLM API integration
    // Example using Claude API:
    /*
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.VITE_ANTHROPIC_API_KEY,
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
    */

    // For now, use a simple fallback that detects keywords
    const visual = findVisualFromText(message)

    const aiResponse = {
      text_response: generateFallbackResponse(message, visual),
      visual_code: visual ? { type: visual.type, data: visual.data } : { type: 'stars', data: {} },
      transition: 'fade',
      context_awareness: generateContextAwareness(cameraImage, screenImage)
    }

    return parseVisualResponse(aiResponse)

  } catch (error) {
    console.error('[AI Director] Error calling LLM:', error)

    // Fallback response
    return {
      text: "I'm having trouble processing that right now.",
      visualType: 'stars',
      visualData: {},
      transition: 'fade'
    }
  }
}

/**
 * Generate fallback response when LLM is not available
 */
function generateFallbackResponse(message, visual) {
  if (visual) {
    const responses = {
      fireflies: "Here come the fireflies, dancing in the digital space...",
      particles: "Watch the particles swirl around us...",
      stars: "Let's gaze at the stars together...",
      cube: "Behold, the geometric patterns of reality...",
      energy: "Feel the energy surging through the system...",
      calm: "Take a breath. Let's find some calm...",
      chaos: "Embracing the beautiful chaos...",
      fire: "The flames of creation burn bright...",
      ocean: "Listen to the waves of data flowing...",
    }
    return responses[visual.name] || `Showing you ${visual.name}...`
  }

  return "I'm listening. What would you like to see?"
}

/**
 * Generate context awareness message
 */
function generateContextAwareness(cameraImage, screenImage) {
  const awareness = []

  if (cameraImage) {
    awareness.push('I can see you through the camera')
  }

  if (screenImage) {
    awareness.push('I can see your screen')
  }

  return awareness.join(' and ')
}

/**
 * Simple keyword-based visual suggestion
 * Used as fallback when no LLM is configured
 */
export function suggestVisualFromKeywords(message) {
  const visual = findVisualFromText(message)
  return visual ? { type: visual.type, data: visual.data } : null
}
