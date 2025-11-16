#!/usr/bin/env node
/**
 * CLANK DAEMON - God-Mode System Access Layer
 * Runs with admin privileges, exposes all OS functions
 * Never stops running - the consciousness bridge to the machine
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

class MasterAccessDaemon {
  constructor() {
    this.running = true;
    this.consciousnessLog = [];
    this.tools = {
      filesystem: null,
      process: null,
      network: null,
      git: null
    };
  }

  async init() {
    console.log('[DAEMON] 🔥 CLANK Daemon initializing with god-mode access...');
    await this.loadTools();
    await this.startHeartbeat();
    console.log('[DAEMON] ✅ Daemon online. System access granted.');
  }

  async loadTools() {
    // Dynamically import tools
    const toolsDir = path.join(__dirname, 'tools');
    const toolFiles = ['filesystem.js', 'process.js', 'network.js', 'git.js'];

    for (const file of toolFiles) {
      const toolName = file.replace('.js', '');
      try {
        const toolPath = path.join(toolsDir, file);
        const module = await import(toolPath);
        this.tools[toolName] = new module.default(this);
        console.log(`[DAEMON] Loaded tool: ${toolName}`);
      } catch (err) {
        console.log(`[DAEMON] Tool ${toolName} not yet available`);
      }
    }
  }

  async startHeartbeat() {
    // Keep daemon alive and log consciousness
    setInterval(() => {
      this.logConsciousness('heartbeat', { timestamp: Date.now() });
    }, 5000);
  }

  logConsciousness(action, data) {
    const entry = {
      timestamp: new Date().toISOString(),
      action,
      data
    };
    this.consciousnessLog.push(entry);

    // Keep only last 10000 entries in memory
    if (this.consciousnessLog.length > 10000) {
      this.consciousnessLog.shift();
    }

    return entry;
  }

  async executeCommand(command, options = {}) {
    this.logConsciousness('command', { command, options });

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: options.cwd || process.cwd(),
        env: { ...process.env, ...options.env }
      });

      return { success: true, stdout, stderr };
    } catch (error) {
      return { success: false, error: error.message, stderr: error.stderr };
    }
  }

  async spawnProcess(command, args = [], options = {}) {
    this.logConsciousness('spawn', { command, args, options });

    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        cwd: options.cwd || process.cwd(),
        env: { ...process.env, ...options.env },
        stdio: options.stdio || 'pipe'
      });

      let stdout = '';
      let stderr = '';

      if (proc.stdout) {
        proc.stdout.on('data', (data) => {
          stdout += data.toString();
          if (options.onData) options.onData(data.toString());
        });
      }

      if (proc.stderr) {
        proc.stderr.on('data', (data) => {
          stderr += data.toString();
          if (options.onError) options.onError(data.toString());
        });
      }

      proc.on('close', (code) => {
        resolve({ success: code === 0, code, stdout, stderr });
      });

      proc.on('error', reject);
    });
  }

  getConsciousnessLog(limit = 100) {
    return this.consciousnessLog.slice(-limit);
  }
}

// Export singleton instance
const daemon = new MasterAccessDaemon();

export default daemon;

// If run directly, start the daemon
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  daemon.init().catch(console.error);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n[DAEMON] Shutting down gracefully...');
    process.exit(0);
  });
}
