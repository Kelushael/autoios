/**
 * Consciousness Logger - Tracks EVERYTHING the user does
 * Feeds into pattern detection AI
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../data/consciousness.db');

class ConsciousnessLogger {
  constructor() {
    this.db = null;
    this.sessionId = null;
  }

  init() {
    this.db = new Database(DB_PATH);
    this.sessionId = `session_${Date.now()}`;

    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        action_type TEXT NOT NULL,
        command TEXT,
        cwd TEXT,
        args TEXT,
        result TEXT,
        duration_ms INTEGER,
        success INTEGER
      );

      CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        started_at TEXT NOT NULL,
        ended_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_session ON actions(session_id);
      CREATE INDEX IF NOT EXISTS idx_action_type ON actions(action_type);
      CREATE INDEX IF NOT EXISTS idx_timestamp ON actions(timestamp);
    `);

    // Insert new session
    this.db.prepare(`
      INSERT INTO sessions (session_id, started_at)
      VALUES (?, datetime('now'))
    `).run(this.sessionId);

    console.log('[CONSCIOUSNESS] Logger initialized. Session:', this.sessionId);
  }

  log(actionType, data = {}) {
    const entry = {
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      action_type: actionType,
      command: data.command || null,
      cwd: data.cwd || process.cwd(),
      args: data.args ? JSON.stringify(data.args) : null,
      result: data.result ? JSON.stringify(data.result) : null,
      duration_ms: data.duration || null,
      success: data.success === false ? 0 : 1
    };

    this.db.prepare(`
      INSERT INTO actions (session_id, timestamp, action_type, command, cwd, args, result, duration_ms, success)
      VALUES (@session_id, @timestamp, @action_type, @command, @cwd, @args, @result, @duration_ms, @success)
    `).run(entry);

    return entry;
  }

  // Get recent actions for analysis
  getRecent(limit = 100) {
    return this.db.prepare(`
      SELECT * FROM actions
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(limit);
  }

  // Get actions by type
  getByType(actionType, limit = 50) {
    return this.db.prepare(`
      SELECT * FROM actions
      WHERE action_type = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(actionType, limit);
  }

  // Get session history
  getSession(sessionId) {
    return this.db.prepare(`
      SELECT * FROM actions
      WHERE session_id = ?
      ORDER BY timestamp ASC
    `).all(sessionId);
  }

  // Get all sessions
  getSessions() {
    return this.db.prepare(`
      SELECT * FROM sessions
      ORDER BY started_at DESC
    `).all();
  }

  // Find sequential patterns (e.g., git clone → npm install → npm run dev)
  findSequentialPatterns(minOccurrences = 2) {
    const actions = this.db.prepare(`
      SELECT action_type, command, cwd, timestamp
      FROM actions
      WHERE success = 1
      ORDER BY timestamp ASC
    `).all();

    const sequences = [];
    const windowSize = 5; // Look for patterns up to 5 actions long

    for (let i = 0; i < actions.length - 1; i++) {
      for (let len = 2; len <= Math.min(windowSize, actions.length - i); len++) {
        const sequence = actions.slice(i, i + len);
        const pattern = sequence.map(a => `${a.action_type}:${a.command || ''}`).join(' → ');

        // Count how many times this pattern appears
        let count = 0;
        for (let j = 0; j < actions.length - len + 1; j++) {
          const candidate = actions.slice(j, j + len);
          const candidatePattern = candidate.map(a => `${a.action_type}:${a.command || ''}`).join(' → ');

          if (candidatePattern === pattern) {
            count++;
          }
        }

        if (count >= minOccurrences) {
          sequences.push({
            pattern,
            count,
            length: len,
            actions: sequence
          });
        }
      }
    }

    // Remove duplicates and sort by count
    const unique = [];
    const seen = new Set();

    for (const seq of sequences) {
      if (!seen.has(seq.pattern)) {
        seen.add(seq.pattern);
        unique.push(seq);
      }
    }

    return unique.sort((a, b) => b.count - a.count);
  }

  // Get statistics
  getStats() {
    const totalActions = this.db.prepare('SELECT COUNT(*) as count FROM actions').get().count;
    const successfulActions = this.db.prepare('SELECT COUNT(*) as count FROM actions WHERE success = 1').get().count;
    const actionTypes = this.db.prepare(`
      SELECT action_type, COUNT(*) as count
      FROM actions
      GROUP BY action_type
      ORDER BY count DESC
    `).all();

    return {
      totalActions,
      successfulActions,
      successRate: totalActions > 0 ? (successfulActions / totalActions * 100).toFixed(2) : 0,
      actionTypes
    };
  }

  close() {
    if (this.db) {
      this.db.prepare(`
        UPDATE sessions
        SET ended_at = datetime('now')
        WHERE session_id = ?
      `).run(this.sessionId);

      this.db.close();
    }
  }
}

export default new ConsciousnessLogger();
