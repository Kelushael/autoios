/**
 * Network Operations
 */

const https = require('https');
const http = require('http');

module.exports = {
  async fetch(params) {
    const { url, method = 'GET', headers = {}, body } = params;

    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;

      const req = client.request(url, { method, headers }, (res) => {
        let data = '';

        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });

      req.on('error', reject);

      if (body) {
        req.write(body);
      }

      req.end();
    });
  },

  async download(params) {
    const { url, destination } = params;
    const fs = require('fs');

    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      const file = fs.createWriteStream(destination);

      client.get(url, (response) => {
        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve({ path: destination });
        });
      }).on('error', (err) => {
        fs.unlink(destination, () => reject(err));
      });
    });
  }
};
