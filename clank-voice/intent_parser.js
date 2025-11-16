/**
 * Intent Parser
 * Audio → Intent (skip text transcription when possible)
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class IntentParser {
  constructor(config) {
    this.models = config.models;
    this.daemon = config.daemon;
    this.whisper = null;
  }

  async init() {
    // Initialize Whisper for audio → text (when needed)
    // But prefer audio → intent directly
    console.log('    ✅ Intent parser initialized');
  }

  async parseAudio(audioBuffer) {
    // OPTION 1: Direct audio → intent (ideal, but requires special model)
    // This would use a model trained on audio → intent mapping
    // For now, we'll use Option 2

    // OPTION 2: Audio → text → intent (practical)
    const text = await this.audioToText(audioBuffer);
    console.log(`    📝 Heard: "${text}"`);

    const intent = this.textToIntent(text);
    return intent;
  }

  async audioToText(audioBuffer) {
    // Use Whisper.cpp or Vosk for local transcription
    return new Promise((resolve, reject) => {
      const tempFile = path.join('/tmp', `clank-audio-${Date.now()}.wav`);
      fs.writeFileSync(tempFile, audioBuffer);

      // Run whisper.cpp
      const whisper = spawn('whisper', [
        tempFile,
        '--model', 'base',
        '--output-format', 'txt'
      ]);

      let output = '';
      whisper.stdout.on('data', (data) => output += data.toString());

      whisper.on('close', () => {
        fs.unlinkSync(tempFile);

        // Extract just the transcribed text
        const lines = output.split('\n');
        const text = lines.find(l => !l.startsWith('[')) || output;

        resolve(text.trim());
      });

      whisper.on('error', (error) => {
        // Fallback: assume simple command
        fs.unlinkSync(tempFile);
        resolve('unknown command');
      });
    });
  }

  textToIntent(text) {
    const lower = text.toLowerCase();

    // Parse intent from natural language
    let intent = {
      raw: text,
      category: 'general',
      action: text,
      params: {},
      context: {}
    };

    // Code creation intents
    if (lower.includes('write') || lower.includes('create') || lower.includes('build')) {
      intent.category = 'code';

      if (lower.includes('file') || lower.includes('script')) {
        intent.action = 'create_file';
        intent.params = this.extractFileParams(text);
      } else if (lower.includes('function') || lower.includes('class')) {
        intent.action = 'generate_code';
        intent.params = this.extractCodeParams(text);
      }
    }

    // File operations
    if (lower.includes('file') || lower.includes('folder') || lower.includes('directory')) {
      intent.category = 'filesystem';

      if (lower.includes('list') || lower.includes('show')) {
        intent.action = 'list';
      } else if (lower.includes('delete') || lower.includes('remove')) {
        intent.action = 'delete';
      } else if (lower.includes('read') || lower.includes('open')) {
        intent.action = 'read';
      }

      intent.params = this.extractFileParams(text);
    }

    // Git operations
    if (lower.includes('git') || lower.includes('repo') || lower.includes('clone')) {
      intent.category = 'git';

      if (lower.includes('clone')) {
        intent.action = 'clone';
        intent.params = this.extractGitParams(text);
      } else if (lower.includes('commit')) {
        intent.action = 'commit';
      } else if (lower.includes('push')) {
        intent.action = 'push';
      } else if (lower.includes('status')) {
        intent.action = 'status';
      }
    }

    // System operations
    if (lower.includes('install') || lower.includes('run') || lower.includes('start')) {
      intent.category = 'system';

      if (lower.includes('install')) {
        intent.action = 'install';
        intent.params = { command: 'npm', args: ['install'] };
      } else if (lower.includes('run') || lower.includes('start')) {
        intent.action = 'run';
        intent.params = this.extractRunParams(text);
      }
    }

    // Special: Monitor/security
    if (lower.includes('monitor') || lower.includes('watch') || lower.includes('security')) {
      intent.category = 'code';
      intent.action = 'create_monitoring_app';
      intent.params = {
        type: 'security',
        duration: this.extractDuration(text)
      };
    }

    return intent;
  }

  extractFileParams(text) {
    const params = {};

    // Extract filename
    const filenameMatch = text.match(/(?:called|named|file)\s+([a-zA-Z0-9_.-]+)/);
    if (filenameMatch) {
      params.path = filenameMatch[1];
    }

    // Extract path
    const pathMatch = text.match(/(?:in|at|to)\s+(\/[^\s]+|\.\/[^\s]+)/);
    if (pathMatch) {
      params.path = pathMatch[1];
    }

    return params;
  }

  extractCodeParams(text) {
    const params = {};

    // Extract language
    const langMatch = text.match(/(?:in|using)\s+(javascript|python|node|js|py)/i);
    if (langMatch) {
      params.language = langMatch[1].toLowerCase();
    }

    params.description = text;
    return params;
  }

  extractGitParams(text) {
    const params = {};

    // Extract URL
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) {
      params.url = urlMatch[1];
    }

    return params;
  }

  extractRunParams(text) {
    const params = {};

    if (text.includes('dev server') || text.includes('development')) {
      params.command = 'npm';
      params.args = ['run', 'dev'];
    } else if (text.includes('build')) {
      params.command = 'npm';
      params.args = ['run', 'build'];
    } else if (text.includes('test')) {
      params.command = 'npm';
      params.args = ['test'];
    }

    return params;
  }

  extractDuration(text) {
    // Extract duration from text
    const hourMatch = text.match(/(\d+)\s*hours?/);
    if (hourMatch) return parseInt(hourMatch[1]) * 3600000;

    const minMatch = text.match(/(\d+)\s*(?:min|minute)s?/);
    if (minMatch) return parseInt(minMatch[1]) * 60000;

    if (text.includes('tonight') || text.includes('sleep')) {
      return 8 * 3600000; // 8 hours
    }

    return 3600000; // Default: 1 hour
  }
}

module.exports = IntentParser;
