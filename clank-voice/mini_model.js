/**
 * Mini Model
 * Lightweight specialized LLM for specific tasks
 */

const axios = require('axios');

class MiniModel {
  constructor(config) {
    this.name = config.name;
    this.model = config.model || 'phi-3-mini';
    this.systemPrompt = config.systemPrompt;
    this.temperature = config.temperature || 0.5;
    this.apiUrl = config.apiUrl || 'http://localhost:11434/api/generate';
    this.ready = false;
  }

  async init() {
    // Pull model if needed
    try {
      await axios.post('http://localhost:11434/api/pull', {
        name: this.model
      });

      this.ready = true;
      console.log(`    ✅ ${this.name} model ready`);

    } catch (error) {
      console.warn(`    ⚠️  ${this.name} model not available - using fallback`);
      this.ready = false;
    }
  }

  async process(intent) {
    if (!this.ready) {
      return this.fallback(intent);
    }

    try {
      const prompt = this.buildPrompt(intent);

      const response = await axios.post(this.apiUrl, {
        model: this.model,
        prompt: prompt,
        system: this.systemPrompt,
        temperature: this.temperature,
        stream: false
      });

      return this.parseResponse(response.data.response, intent);

    } catch (error) {
      console.error(`${this.name} model error:`, error.message);
      return this.fallback(intent);
    }
  }

  buildPrompt(intent) {
    return `Intent: ${intent.action}
Context: ${JSON.stringify(intent.context || {})}
Parameters: ${JSON.stringify(intent.params || {})}

Parse this intent and output the exact system command to execute.`;
  }

  parseResponse(modelResponse, intent) {
    // Parse model output into daemon-compatible format

    // Default structure
    const parsed = {
      tool: intent.category,
      action: intent.action,
      params: intent.params || {},
      response: modelResponse
    };

    // Try to extract structured output
    try {
      // Look for JSON in response
      const jsonMatch = modelResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        Object.assign(parsed, extracted);
      }
    } catch (e) {
      // Use raw response
    }

    return parsed;
  }

  fallback(intent) {
    // Simple keyword-based fallback
    const action = intent.action.toLowerCase();

    if (action.includes('create') || action.includes('write')) {
      return {
        tool: 'filesystem',
        action: 'write',
        params: intent.params,
        response: 'Creating file'
      };
    }

    if (action.includes('clone') || action.includes('repo')) {
      return {
        tool: 'git',
        action: 'clone',
        params: intent.params,
        response: 'Cloning repository'
      };
    }

    if (action.includes('install')) {
      return {
        tool: 'process',
        action: 'run',
        params: { command: 'npm', args: ['install'] },
        response: 'Installing dependencies'
      };
    }

    return {
      tool: 'general',
      action: 'respond',
      params: {},
      response: 'I understand. Let me handle that.'
    };
  }
}

module.exports = MiniModel;
