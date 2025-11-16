/**
 * Process Tool - Launch, kill, and manage processes
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default class ProcessTool {
  constructor(daemon) {
    this.daemon = daemon;
    this.processes = new Map();
  }

  async run(command, args = [], options = {}) {
    const id = `proc_${Date.now()}`;
    this.daemon.logConsciousness('process:run', { id, command, args });

    const proc = spawn(command, args, {
      cwd: options.cwd || process.cwd(),
      env: { ...process.env, ...options.env },
      detached: options.detached || false,
      stdio: options.stdio || 'pipe'
    });

    this.processes.set(id, proc);

    return {
      id,
      pid: proc.pid,
      process: proc
    };
  }

  async execute(command, options = {}) {
    this.daemon.logConsciousness('process:execute', { command });

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

  async kill(id) {
    this.daemon.logConsciousness('process:kill', { id });

    const proc = this.processes.get(id);
    if (proc) {
      proc.kill();
      this.processes.delete(id);
      return true;
    }
    return false;
  }

  async killByPid(pid) {
    this.daemon.logConsciousness('process:killByPid', { pid });

    try {
      process.kill(pid);
      return true;
    } catch {
      return false;
    }
  }

  list() {
    return Array.from(this.processes.entries()).map(([id, proc]) => ({
      id,
      pid: proc.pid,
      killed: proc.killed
    }));
  }
}
