/**
 * CLANK LLM Engine
 * Connects to local LLM (Ollama/LM Studio)
 */

const axios = require('axios');

class LLMEngine {
  constructor(config = {}) {
    this.apiUrl = config.apiUrl || 'http://localhost:11434/api/generate'; // Ollama default
    this.model = config.model || 'llama2';
  }

  async connect() {
    try {
      // Test connection
      await axios.get('http://localhost:11434/api/tags');
      console.log('  ✅ LLM connected (Ollama)');
    } catch (error) {
      console.warn('  ⚠️  LLM not available - using fallback mode');
      this.fallbackMode = true;
    }
  }

  async process(prompt, context = {}) {
    if (this.fallbackMode) {
      return this.fallbackResponse(prompt);
    }

    try {
      const response = await axios.post(this.apiUrl, {
        model: this.model,
        prompt: this.buildPrompt(prompt, context),
        stream: false
      });

      return response.data.response;

    } catch (error) {
      console.error('LLM error:', error.message);
      return this.fallbackResponse(prompt);
    }
  }

  buildPrompt(userPrompt, context) {
    return `You are CLANK, an AI system with full access to the operating system.

Context:
${JSON.stringify(context, null, 2)}

User request: ${userPrompt}

Respond with the action to take.`;
  }

  fallbackResponse(prompt) {
    // Simple keyword-based fallback
    const lower = prompt.toLowerCase();

    if (lower.includes('clone') && lower.includes('repo')) {
      return 'I will clone the repository for you.';
    }

    if (lower.includes('install')) {
      return 'I will install the dependencies.';
    }

    if (lower.includes('run') || lower.includes('start')) {
      return 'I will start the application.';
    }

    return `I understand you want to: ${prompt}. Let me handle that.`;
  }
}

module.exports = LLMEngine;
