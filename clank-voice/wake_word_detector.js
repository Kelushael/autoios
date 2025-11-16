/**
 * Wake Word Detector
 * Detects "Hey CLANK" or just "CLANK" in audio
 */

const fs = require('fs');
const path = require('path');

class WakeWordDetector {
  static async detect(audioBuffer, wakeWord = 'clank') {
    // OPTION 1: Use Porcupine (Picovoice) for offline wake word detection
    // OPTION 2: Use simple energy + pattern detection
    // OPTION 3: Use Whisper in continuous mode

    // For now, simple implementation:
    // Convert audio to text and check for wake word

    try {
      // Quick whisper check (small model, fast)
      const tempFile = path.join('/tmp', `wake-${Date.now()}.wav`);
      fs.writeFileSync(tempFile, audioBuffer);

      const { spawn } = require('child_process');

      return new Promise((resolve) => {
        const whisper = spawn('whisper', [
          tempFile,
          '--model', 'tiny',
          '--language', 'en'
        ]);

        let output = '';
        whisper.stdout.on('data', (data) => output += data.toString());

        whisper.on('close', () => {
          fs.unlinkSync(tempFile);

          const detected = output.toLowerCase().includes(wakeWord.toLowerCase()) ||
                          output.toLowerCase().includes('hey ' + wakeWord.toLowerCase());

          resolve(detected);
        });

        whisper.on('error', () => {
          fs.unlinkSync(tempFile);
          resolve(false);
        });

        // Timeout after 1 second
        setTimeout(() => {
          whisper.kill();
          if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
          resolve(false);
        }, 1000);
      });

    } catch (error) {
      return false;
    }
  }
}

module.exports = WakeWordDetector;
