/**
 * Process Operations
 */

const { spawn, exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

module.exports = {
  async run(params) {
    const { command, args = [], cwd } = params;

    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, { cwd, shell: true });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', data => stdout += data.toString());
      proc.stderr.on('data', data => stderr += data.toString());

      proc.on('close', code => {
        if (code === 0) {
          resolve({ stdout, stderr, exitCode: code });
        } else {
          reject(new Error(`Process exited with code ${code}: ${stderr}`));
        }
      });

      proc.on('error', reject);
    });
  },

  async exec(params) {
    const { command, cwd } = params;
    return execAsync(command, { cwd });
  },

  async kill(params) {
    const { pid } = params;
    process.kill(pid);
    return { success: true };
  }
};
