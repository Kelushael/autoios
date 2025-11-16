/**
 * Filesystem Operations
 */

const fs = require('fs').promises;
const path = require('path');

module.exports = {
  async read(params) {
    const { path: filePath } = params;
    return fs.readFile(filePath, 'utf8');
  },

  async write(params) {
    const { path: filePath, content } = params;
    return fs.writeFile(filePath, content, 'utf8');
  },

  async list(params) {
    const { path: dirPath } = params;
    return fs.readdir(dirPath);
  },

  async exists(params) {
    const { path: filePath } = params;
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  },

  async mkdir(params) {
    const { path: dirPath } = params;
    return fs.mkdir(dirPath, { recursive: true });
  },

  async delete(params) {
    const { path: filePath } = params;
    return fs.rm(filePath, { recursive: true, force: true });
  }
};
