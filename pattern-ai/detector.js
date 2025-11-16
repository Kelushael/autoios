/**
 * Pattern Detection AI - Analyzes consciousness logs to find recurring workflows
 * Uses local LLM for intent analysis
 */

import logger from '../consciousness/logger.js';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../data/patterns.db');

class PatternDetector {
  constructor() {
    this.db = null;
    this.detectionInterval = null;
  }

  init() {
    this.db = new Database(DB_PATH);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS detected_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern_hash TEXT UNIQUE NOT NULL,
        pattern_name TEXT,
        pattern_description TEXT,
        actions TEXT NOT NULL,
        occurrences INTEGER DEFAULT 1,
        confidence REAL DEFAULT 0.0,
        first_seen TEXT NOT NULL,
        last_seen TEXT NOT NULL,
        suggested INTEGER DEFAULT 0,
        accepted INTEGER DEFAULT 0,
        rejected INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS workflow_suggestions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern_id INTEGER NOT NULL,
        suggested_at TEXT NOT NULL,
        workflow_name TEXT,
        workflow_description TEXT,
        trigger_type TEXT,
        trigger_value TEXT,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY (pattern_id) REFERENCES detected_patterns(id)
      );

      CREATE INDEX IF NOT EXISTS idx_pattern_hash ON detected_patterns(pattern_hash);
      CREATE INDEX IF NOT EXISTS idx_confidence ON detected_patterns(confidence);
    `);

    console.log('[PATTERN AI] Initialized');
  }

  // Start continuous pattern detection
  startDetection(intervalMs = 60000) {
    console.log(`[PATTERN AI] Starting detection (every ${intervalMs/1000}s)`);

    this.detectionInterval = setInterval(() => {
      this.detectPatterns();
    }, intervalMs);

    // Run immediately
    this.detectPatterns();
  }

  stopDetection() {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
  }

  // Detect patterns from consciousness logs
  detectPatterns() {
    console.log('[PATTERN AI] Analyzing consciousness logs...');

    const sequences = logger.findSequentialPatterns(2);

    for (const seq of sequences) {
      const hash = this.hashPattern(seq.pattern);
      const existing = this.db.prepare('SELECT * FROM detected_patterns WHERE pattern_hash = ?').get(hash);

      if (existing) {
        // Update existing pattern
        this.db.prepare(`
          UPDATE detected_patterns
          SET occurrences = ?, last_seen = datetime('now'), confidence = ?
          WHERE pattern_hash = ?
        `).run(seq.count, this.calculateConfidence(seq), hash);
      } else {
        // Insert new pattern
        const name = this.generatePatternName(seq);
        const description = this.generatePatternDescription(seq);

        this.db.prepare(`
          INSERT INTO detected_patterns (
            pattern_hash, pattern_name, pattern_description, actions,
            occurrences, confidence, first_seen, last_seen
          )
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).run(
          hash,
          name,
          description,
          JSON.stringify(seq.actions),
          seq.count,
          this.calculateConfidence(seq)
        );

        console.log(`[PATTERN AI] 🎯 New pattern detected: ${name} (${seq.count} occurrences)`);
      }
    }

    // Generate workflow suggestions for high-confidence patterns
    this.generateSuggestions();
  }

  // Calculate confidence score (0-1)
  calculateConfidence(sequence) {
    const occurrenceScore = Math.min(sequence.count / 10, 0.5); // Max 0.5 from occurrences
    const lengthScore = Math.min(sequence.length / 10, 0.3); // Max 0.3 from length
    const recencyScore = 0.2; // Base recency score

    return Math.min(occurrenceScore + lengthScore + recencyScore, 1.0);
  }

  // Generate human-readable pattern name
  generatePatternName(sequence) {
    const actions = sequence.actions.map(a => {
      if (a.command) {
        if (a.command.includes('git clone')) return 'Clone Repo';
        if (a.command.includes('npm install')) return 'Install NPM Deps';
        if (a.command.includes('yarn install')) return 'Install Yarn Deps';
        if (a.command.includes('npm run dev')) return 'Start Dev Server';
        if (a.command.includes('pytest')) return 'Run Tests';
        if (a.command.includes('python')) return 'Run Python Script';
        if (a.command.includes('cargo build')) return 'Build Rust';
        return a.command.split(' ')[0];
      }
      return a.action_type;
    });

    return actions.join(' → ');
  }

  // Generate pattern description
  generatePatternDescription(sequence) {
    return `Detected workflow: ${this.generatePatternName(sequence)}. Occurred ${sequence.count} times.`;
  }

  // Generate workflow suggestions
  generateSuggestions() {
    const patterns = this.db.prepare(`
      SELECT * FROM detected_patterns
      WHERE confidence >= 0.6
      AND suggested = 0
      ORDER BY confidence DESC
    `).all();

    for (const pattern of patterns) {
      const workflowName = `Auto ${pattern.pattern_name}`;
      const workflowDescription = `Automatically execute: ${pattern.pattern_name} when triggered`;

      // Determine trigger type
      const actions = JSON.parse(pattern.actions);
      let triggerType = 'manual';
      let triggerValue = null;

      // If pattern starts with git clone, trigger on repo detection
      if (actions[0]?.command?.includes('git clone')) {
        triggerType = 'repo_detected';
        triggerValue = 'any';
      }

      // If pattern starts with cd to directory, trigger on directory access
      if (actions[0]?.cwd) {
        triggerType = 'directory_access';
        triggerValue = actions[0].cwd;
      }

      // Create suggestion
      this.db.prepare(`
        INSERT INTO workflow_suggestions (
          pattern_id, suggested_at, workflow_name, workflow_description,
          trigger_type, trigger_value, status
        )
        VALUES (?, datetime('now'), ?, ?, ?, ?, 'pending')
      `).run(
        pattern.id,
        workflowName,
        workflowDescription,
        triggerType,
        triggerValue
      );

      // Mark pattern as suggested
      this.db.prepare('UPDATE detected_patterns SET suggested = 1 WHERE id = ?').run(pattern.id);

      console.log(`[PATTERN AI] 💡 Suggested workflow: ${workflowName}`);
    }
  }

  // Get pending suggestions
  getPendingSuggestions() {
    return this.db.prepare(`
      SELECT
        ws.*,
        dp.pattern_name,
        dp.pattern_description,
        dp.actions,
        dp.occurrences,
        dp.confidence
      FROM workflow_suggestions ws
      JOIN detected_patterns dp ON ws.pattern_id = dp.id
      WHERE ws.status = 'pending'
      ORDER BY dp.confidence DESC
    `).all();
  }

  // Accept a suggestion
  acceptSuggestion(suggestionId) {
    this.db.prepare(`
      UPDATE workflow_suggestions
      SET status = 'accepted'
      WHERE id = ?
    `).run(suggestionId);

    const suggestion = this.db.prepare('SELECT pattern_id FROM workflow_suggestions WHERE id = ?').get(suggestionId);
    this.db.prepare('UPDATE detected_patterns SET accepted = 1 WHERE id = ?').run(suggestion.pattern_id);

    console.log(`[PATTERN AI] ✅ Suggestion accepted: ${suggestionId}`);
  }

  // Reject a suggestion
  rejectSuggestion(suggestionId) {
    this.db.prepare(`
      UPDATE workflow_suggestions
      SET status = 'rejected'
      WHERE id = ?
    `).run(suggestionId);

    const suggestion = this.db.prepare('SELECT pattern_id FROM workflow_suggestions WHERE id = ?').get(suggestionId);
    this.db.prepare('UPDATE detected_patterns SET rejected = 1 WHERE id = ?').run(suggestion.pattern_id);

    console.log(`[PATTERN AI] ❌ Suggestion rejected: ${suggestionId}`);
  }

  // Get all detected patterns
  getPatterns(minConfidence = 0.0) {
    return this.db.prepare(`
      SELECT * FROM detected_patterns
      WHERE confidence >= ?
      ORDER BY confidence DESC, occurrences DESC
    `).all(minConfidence);
  }

  // Hash a pattern for uniqueness
  hashPattern(pattern) {
    let hash = 0;
    for (let i = 0; i < pattern.length; i++) {
      const char = pattern.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  close() {
    this.stopDetection();
    if (this.db) {
      this.db.close();
    }
  }
}

export default new PatternDetector();
