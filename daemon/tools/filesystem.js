/**
 * Filesystem Tool - Full file system access
 */

import fs from 'fs/promises';
import path from 'path';

export default class FilesystemTool {
  constructor(daemon) {
    this.daemon = daemon;
  }

  async read(filePath) {
    this.daemon.logConsciousness('fs:read', { filePath });
    return await fs.readFile(filePath, 'utf-8');
  }

  async write(filePath, content) {
    this.daemon.logConsciousness('fs:write', { filePath, size: content.length });
    return await fs.writeFile(filePath, content, 'utf-8');
  }

  async append(filePath, content) {
    this.daemon.logConsciousness('fs:append', { filePath, size: content.length });
    return await fs.appendFile(filePath, content, 'utf-8');
  }

  async mkdir(dirPath, options = { recursive: true }) {
    this.daemon.logConsciousness('fs:mkdir', { dirPath });
    return await fs.mkdir(dirPath, options);
  }

  async readdir(dirPath) {
    this.daemon.logConsciousness('fs:readdir', { dirPath });
    return await fs.readdir(dirPath);
  }

  async stat(filePath) {
    this.daemon.logConsciousness('fs:stat', { filePath });
    return await fs.stat(filePath);
  }

  async exists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async delete(filePath) {
    this.daemon.logConsciousness('fs:delete', { filePath });
    return await fs.unlink(filePath);
  }

  async copy(src, dest) {
    this.daemon.logConsciousness('fs:copy', { src, dest });
    return await fs.copyFile(src, dest);
  }

  async move(src, dest) {
    this.daemon.logConsciousness('fs:move', { src, dest });
    return await fs.rename(src, dest);
  }
}
