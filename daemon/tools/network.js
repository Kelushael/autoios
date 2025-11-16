/**
 * Network Tool - HTTP requests and downloads
 */

import axios from 'axios';
import fs from 'fs';
import { pipeline } from 'stream/promises';

export default class NetworkTool {
  constructor(daemon) {
    this.daemon = daemon;
  }

  async get(url, options = {}) {
    this.daemon.logConsciousness('network:get', { url });

    try {
      const response = await axios.get(url, options);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async post(url, data, options = {}) {
    this.daemon.logConsciousness('network:post', { url, dataSize: JSON.stringify(data).length });

    try {
      const response = await axios.post(url, data, options);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async download(url, destination) {
    this.daemon.logConsciousness('network:download', { url, destination });

    try {
      const response = await axios({
        method: 'get',
        url,
        responseType: 'stream'
      });

      await pipeline(
        response.data,
        fs.createWriteStream(destination)
      );

      return { success: true, destination };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async request(method, url, options = {}) {
    this.daemon.logConsciousness('network:request', { method, url });

    try {
      const response = await axios({ method, url, ...options });
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
