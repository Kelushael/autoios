import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, Mic, MicOff } from 'lucide-react'
import { useClankVision } from '../../hooks/useClankVision'
import { callVisionLLM } from '../../lib/ai-director'
import { cn } from '../../lib/utils'

/**
 * Message Component
 */
function Message({ message, isUser }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'flex w-full mb-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] px-4 py-3 rounded-2xl',
          isUser
            ? 'bg-blue-500/20 backdrop-blur-md border border-blue-400/30'
            : 'glass-dark border border-white/10'
        )}
      >
        {/* Message text */}
        <p className="text-sm text-white/90 leading-relaxed">
          {message.text}
        </p>

        {/* Context awareness indicator */}
        {message.contextAwareness && (
          <p className="text-xs text-white/50 mt-2 italic">
            {message.contextAwareness}
          </p>
        )}

        {/* Visual indicator */}
        {message.visualType && message.visualType !== 'stars' && (
          <div className="flex items-center gap-2 mt-2 text-xs text-purple-400">
            <Sparkles className="w-3 h-3" />
            <span>Generated visual: {message.visualType}</span>
          </div>
        )}

        {/* Timestamp */}
        <p className="text-xs text-white/30 mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </motion.div>
  )
}

/**
 * Typing Indicator Component
 */
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex justify-start mb-3"
    >
      <div className="glass-dark px-4 py-3 rounded-2xl border border-white/10">
        <div className="flex gap-1">
          <motion.div
            className="w-2 h-2 bg-white/60 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="w-2 h-2 bg-white/60 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-2 h-2 bg-white/60 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      </div>
    </motion.div>
  )
}

/**
 * FloatingClank Chat Component
 * Layer 2: Semi-transparent chat overlay
 */
export default function FloatingClank({ visionEnabled }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm CLANK. I can see through your camera and screen, and our conversation creates the visuals around us. What would you like to explore?",
      isUser: false,
      timestamp: Date.now(),
      visualType: 'stars'
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const { getVisionSnapshot } = useClankVision()

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  /**
   * Handle sending a message
   */
  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = {
      id: Date.now(),
      text: input.trim(),
      isUser: true,
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      // Get vision snapshot if enabled
      let cameraImage = null
      let screenImage = null

      if (visionEnabled) {
        const snapshot = getVisionSnapshot()
        cameraImage = snapshot.camera
        screenImage = snapshot.screen
      }

      // Call AI Director with vision context
      const response = await callVisionLLM(
        userMessage.text,
        cameraImage,
        screenImage,
        messages.filter(m => !m.isUser).slice(-5) // Last 5 AI messages for context
      )

      // Create AI message
      const aiMessage = {
        id: Date.now() + 1,
        text: response.text,
        isUser: false,
        timestamp: Date.now(),
        visualType: response.visualType,
        contextAwareness: response.context_awareness
      }

      setMessages(prev => [...prev, aiMessage])

      // Trigger visual update
      if (response.visualType) {
        const event = new CustomEvent('clank-visual-update', {
          detail: {
            visualType: response.visualType,
            data: response.visualData,
            transition: response.transition
          }
        })
        window.dispatchEvent(event)
      }

    } catch (error) {
      console.error('[FloatingClank] Error:', error)

      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm having trouble processing that. Let me try again.",
        isUser: false,
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  /**
   * Handle Enter key
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl h-[600px] flex flex-col pointer-events-auto"
      >
        {/* Chat Header */}
        <div className="glass-dark rounded-t-3xl px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">CLANK</h2>
                <p className="text-white/50 text-xs">
                  {visionEnabled ? 'Seeing your world' : 'Ready to chat'}
                </p>
              </div>
            </div>

            {/* Voice Toggle */}
            <motion.button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={cn(
                'p-2 rounded-full transition-colors',
                voiceEnabled ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/40'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Voice Mode (Coming Soon)"
            >
              {voiceEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="glass-dark flex-1 overflow-y-auto p-6 backdrop-blur-2xl">
          <AnimatePresence mode="popLayout">
            {messages.map(message => (
              <Message key={message.id} message={message} isUser={message.isUser} />
            ))}
            {isTyping && <TypingIndicator key="typing" />}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Container */}
        <div className="glass-dark rounded-b-3xl px-6 py-4 border-t border-white/10">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Chat with CLANK and watch the visuals respond..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/40 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                rows={1}
                style={{
                  minHeight: '48px',
                  maxHeight: '120px'
                }}
              />
            </div>

            <motion.button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className={cn(
                'p-3 rounded-2xl transition-all',
                input.trim() && !isTyping
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-white/5 text-white/40 cursor-not-allowed'
              )}
              whileHover={input.trim() && !isTyping ? { scale: 1.05 } : {}}
              whileTap={input.trim() && !isTyping ? { scale: 0.95 } : {}}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Vision Status */}
          {visionEnabled && (
            <p className="text-xs text-white/40 mt-2 text-center">
              CLANK can see your camera and screen
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
