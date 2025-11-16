/**
 * Voice I/O
 * Audio input (microphone) and output (TTS)
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class VoiceInput extends EventEmitter {
  constructor(config = {}) {
    super();
    this.sampleRate = config.sampleRate || 16000;
    this.channels = config.channels || 1;
    this.process = null;
    this.recording = false;
  }

  async init() {
    // Check if microphone is available
    // Using arecord on Linux, sox on Mac, etc.
    console.log('    🎤 Microphone initialized');
  }

  async captureCommand(durationMs = 5000) {
    return new Promise((resolve, reject) => {
      const audioChunks = [];
      const tempFile = path.join('/tmp', `clank-voice-${Date.now()}.wav`);

      // Record audio using arecord (Linux) or sox (cross-platform)
      const recorder = spawn('arecord', [
        '-f', 'S16_LE',
        '-r', this.sampleRate.toString(),
        '-c', this.channels.toString(),
        '-d', (durationMs / 1000).toString(),
        tempFile
      ]);

      recorder.on('close', () => {
        // Read audio file
        const audioBuffer = fs.readFileSync(tempFile);
        fs.unlinkSync(tempFile); // Clean up
        resolve(audioBuffer);
      });

      recorder.on('error', reject);

      setTimeout(() => {
        if (recorder.killed) return;
        recorder.kill();
      }, durationMs + 1000);
    });
  }

  async close() {
    if (this.process) {
      this.process.kill();
    }
  }
}

class VoiceOutput {
  constructor(config = {}) {
    this.voice = config.voice || 'en-US';
    this.speed = config.speed || 1.0;
    this.engine = config.engine || 'piper'; // or 'espeak', 'festival'
  }

  async init() {
    console.log('    🔊 TTS initialized');
  }

  async speak(text) {
    return new Promise((resolve, reject) => {
      // Use Piper TTS (fast, local, high quality)
      // Fallback to espeak if not available

      const tts = spawn('piper', [
        '--model', 'en_US-lessac-medium',
        '--output_file', '-'
      ]);

      // Pipe to audio player
      const player = spawn('aplay', ['-r', '22050', '-f', 'S16_LE', '-c', '1']);

      tts.stdout.pipe(player.stdin);

      tts.stdin.write(text);
      tts.stdin.end();

      player.on('close', resolve);
      player.on('error', (error) => {
        // Fallback to espeak
        this.speakFallback(text).then(resolve).catch(reject);
      });
    });
  }

  async speakFallback(text) {
    return new Promise((resolve, reject) => {
      const espeak = spawn('espeak', [
        '-v', this.voice,
        '-s', Math.floor(150 * this.speed).toString(),
        text
      ]);

      espeak.on('close', resolve);
      espeak.on('error', reject);
    });
  }

  async close() {
    // Nothing to close
  }
}

module.exports = {
  Input: VoiceInput,
  Output: VoiceOutput
};
