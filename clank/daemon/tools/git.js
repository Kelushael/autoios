/**
 * Git Operations
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

module.exports = {
  async clone(params) {
    const { url, destination } = params;
    const { stdout, stderr } = await execAsync(`git clone ${url} ${destination}`);
    return { stdout, stderr };
  },

  async pull(params) {
    const { cwd } = params;
    const { stdout, stderr } = await execAsync('git pull', { cwd });
    return { stdout, stderr };
  },

  async commit(params) {
    const { message, cwd } = params;
    await execAsync('git add .', { cwd });
    const { stdout, stderr } = await execAsync(`git commit -m "${message}"`, { cwd });
    return { stdout, stderr };
  },

  async push(params) {
    const { cwd } = params;
    const { stdout, stderr } = await execAsync('git push', { cwd });
    return { stdout, stderr };
  },

  async status(params) {
    const { cwd } = params;
    const { stdout } = await execAsync('git status', { cwd });
    return { status: stdout };
  }
};
