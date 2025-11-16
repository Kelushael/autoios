#!/usr/bin/env node

/**
 * CLANK VOICE DAEMON
 * Invisible AI - Voice in, voice out, everything under the hood
 *
 * Features:
 * - Always listening
 * - Multiple mini-models (specialized)
 * - Audio → Intent (direct parsing, no text display)
 * - Intent → Code/Action (builds and manifests)
 * - TTS responses (speaks back)
 * - Full system control
 *
 * Run: sudo node voice_daemon.js
 */

const { spawn } = require('child_process');
const EventEmitter = require('events');
const path = require('path');

class VoiceDaemon extends EventEmitter {
  constructor() {
    super();

    this.state = {
      listening: false,
      processing: false,
      speaking: false,
      systemReady: false
    };

    // Mini-models for specialized tasks
    this.models = {
      coding: null,      // Code generation
      filesystem: null,  // File operations
      git: null,         // Git operations
      system: null,      // System control
      general: null      // General conversation
    };

    this.daemon = null;
    this.audioInput = null;
    this.audioOutput = null;
    this.intentParser = null;
  }

  async boot() {
    console.log('🎤 CLANK Voice Daemon - Booting...\n');

    // Initialize system access daemon
    console.log('🔐 Starting system access daemon...');
    const AccessDaemon = require('../clank/daemon');
    this.daemon = new AccessDaemon();
    await this.daemon.start();

    // Initialize mini-models
    console.log('🧠 Loading mini-models...');
    await this.loadMiniModels();

    // Initialize audio I/O
    console.log('🎧 Initializing audio systems...');
    await this.initializeAudio();

    // Initialize intent parser
    console.log('🎯 Starting intent parser...');
    await this.initializeIntentParser();

    this.state.systemReady = true;

    console.log('\n✅ CLANK Voice Daemon ready');
    console.log('🎤 Listening... (say "Hey CLANK" to activate)\n');

    // Start listening loop
    this.startListening();
  }

  async loadMiniModels() {
    // Load specialized mini-models
    // These can be tiny models (Phi-3, Gemma, etc.) for different tasks

    const MiniModel = require('./mini_model');

    this.models.coding = new MiniModel({
      name: 'Coding',
      model: 'phi-3-mini',
      systemPrompt: 'You are a code generator. Generate code based on intent. Output only code.',
      temperature: 0.2
    });

    this.models.filesystem = new MiniModel({
      name: 'Filesystem',
      model: 'phi-3-mini',
      systemPrompt: 'You are a file system controller. Parse file operation intents.',
      temperature: 0.1
    });

    this.models.git = new MiniModel({
      name: 'Git',
      model: 'phi-3-mini',
      systemPrompt: 'You are a git operation controller. Parse git intents.',
      temperature: 0.1
    });

    this.models.system = new MiniModel({
      name: 'System',
      model: 'phi-3-mini',
      systemPrompt: 'You are a system controller. Parse system operation intents.',
      temperature: 0.1
    });

    this.models.general = new MiniModel({
      name: 'General',
      model: 'phi-3-mini',
      systemPrompt: 'You are CLANK, a helpful AI assistant with system access.',
      temperature: 0.7
    });

    // Initialize all models
    await Promise.all([
      this.models.coding.init(),
      this.models.filesystem.init(),
      this.models.git.init(),
      this.models.system.init(),
      this.models.general.init()
    ]);

    console.log('  ✅ 5 mini-models loaded');
  }

  async initializeAudio() {
    const VoiceIO = require('./voice_io');

    // Audio input (microphone)
    this.audioInput = new VoiceIO.Input({
      sampleRate: 16000,
      channels: 1
    });

    // Audio output (TTS)
    this.audioOutput = new VoiceIO.Output({
      voice: 'en-US-neural',
      speed: 1.0
    });

    await this.audioInput.init();
    await this.audioOutput.init();

    console.log('  ✅ Audio I/O ready');
  }

  async initializeIntentParser() {
    const IntentParser = require('./intent_parser');

    this.intentParser = new IntentParser({
      models: this.models,
      daemon: this.daemon
    });

    await this.intentParser.init();

    console.log('  ✅ Intent parser ready');
  }

  async startListening() {
    this.state.listening = true;

    // Continuous audio input stream
    this.audioInput.on('speech', async (audioBuffer) => {
      if (this.state.processing) return;

      // Check for wake word
      const hasWakeWord = await this.detectWakeWord(audioBuffer);
      if (!hasWakeWord) return;

      // Speak acknowledgment
      await this.speak('Yes?');

      // Listen for command
      const command = await this.audioInput.captureCommand();

      // Process intent
      await this.processVoiceIntent(command);
    });
  }

  async detectWakeWord(audioBuffer) {
    // Simple wake word detection
    // In production, use Porcupine or similar
    const Detector = require('./wake_word_detector');
    return Detector.detect(audioBuffer, 'clank');
  }

  async processVoiceIntent(audioBuffer) {
    this.state.processing = true;

    try {
      // Step 1: Audio → Intent (skip text transcription)
      console.log('🎧 Hearing...');
      const intent = await this.intentParser.parseAudio(audioBuffer);

      console.log(`🎯 Intent: ${intent.category} - ${intent.action}`);

      // Step 2: Route to appropriate mini-model
      const model = this.routeToModel(intent);

      // Step 3: Execute
      console.log(`🔧 Executing via ${model.name} model...`);
      const result = await this.execute(intent, model);

      // Step 4: Speak response
      await this.speak(result.message);

      console.log('✅ Complete\n');

    } catch (error) {
      console.error('❌ Error:', error.message);
      await this.speak(`Sorry, I encountered an error: ${error.message}`);

    } finally {
      this.state.processing = false;
    }
  }

  routeToModel(intent) {
    const category = intent.category.toLowerCase();

    if (category.includes('code') || category.includes('write')) {
      return this.models.coding;
    }

    if (category.includes('file') || category.includes('folder')) {
      return this.models.filesystem;
    }

    if (category.includes('git') || category.includes('repo')) {
      return this.models.git;
    }

    if (category.includes('system') || category.includes('process')) {
      return this.models.system;
    }

    return this.models.general;
  }

  async execute(intent, model) {
    // Get model's interpretation
    const interpretation = await model.process(intent);

    // Execute via daemon
    const result = await this.daemon.execute(
      interpretation.tool,
      interpretation.action,
      interpretation.params
    );

    return {
      success: true,
      message: interpretation.response || 'Done',
      data: result
    };
  }

  async speak(text) {
    this.state.speaking = true;

    console.log(`🗣️  CLANK: "${text}"`);

    await this.audioOutput.speak(text);

    this.state.speaking = false;
  }

  async shutdown() {
    console.log('\n🛑 Shutting down Voice Daemon...');

    this.state.listening = false;

    if (this.audioInput) await this.audioInput.close();
    if (this.audioOutput) await this.audioOutput.close();
    if (this.daemon) this.daemon.stop();

    console.log('✅ Voice Daemon stopped\n');
  }
}

// Boot
const daemon = new VoiceDaemon();

daemon.boot().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => daemon.shutdown().then(() => process.exit(0)));
process.on('SIGTERM', () => daemon.shutdown().then(() => process.exit(0)));
