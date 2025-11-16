/**
 * Consciousness Watcher - Monitors file system and shell activity
 * Detects patterns in real-time
 */

import chokidar from 'chokidar';
import logger from './logger.js';

class ConsciousnessWatcher {
  constructor() {
    this.watchers = [];
    this.commandHistory = [];
  }

  // Watch a directory for changes
  watchDirectory(dir, options = {}) {
    const watcher = chokidar.watch(dir, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true,
      ...options
    });

    watcher
      .on('add', path => {
        logger.log('fs:create', { command: 'file created', args: { path } });
      })
      .on('change', path => {
        logger.log('fs:modify', { command: 'file changed', args: { path } });
      })
      .on('unlink', path => {
        logger.log('fs:delete', { command: 'file deleted', args: { path } });
      })
      .on('addDir', path => {
        logger.log('fs:mkdir', { command: 'directory created', args: { path } });
      })
      .on('unlinkDir', path => {
        logger.log('fs:rmdir', { command: 'directory deleted', args: { path } });
      });

    this.watchers.push(watcher);
    console.log(`[WATCHER] Watching directory: ${dir}`);

    return watcher;
  }

  // Log a command execution
  logCommand(command, cwd, result) {
    const start = Date.now();

    this.commandHistory.push({
      command,
      cwd,
      timestamp: new Date().toISOString()
    });

    logger.log('command', {
      command,
      cwd,
      result,
      duration: Date.now() - start,
      success: result.success !== false
    });
  }

  // Get command history
  getCommandHistory(limit = 50) {
    return this.commandHistory.slice(-limit);
  }

  // Detect if user is setting up a dev environment
  detectDevSetup() {
    const recent = this.commandHistory.slice(-10);
    const commands = recent.map(c => c.command);

    // Pattern: git clone → cd → npm install → npm run dev
    const patterns = {
      'git-npm-dev': ['git clone', 'npm install', 'npm run dev'],
      'git-yarn-dev': ['git clone', 'yarn install', 'yarn dev'],
      'pip-venv': ['python -m venv', 'pip install'],
      'cargo-run': ['cargo new', 'cargo build', 'cargo run']
    };

    for (const [name, pattern] of Object.entries(patterns)) {
      const matches = pattern.every(cmd =>
        commands.some(c => c.includes(cmd))
      );

      if (matches) {
        return { detected: true, pattern: name, commands: pattern };
      }
    }

    return { detected: false };
  }

  stopAll() {
    this.watchers.forEach(w => w.close());
    this.watchers = [];
  }
}

export default new ConsciousnessWatcher();
