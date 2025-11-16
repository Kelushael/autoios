/**
 * CLANK Pattern Analyzer
 * Analyzes consciousness logs and conversation history to detect recurring patterns
 * Suggests workflows proactively based on user behavior
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class PatternAnalyzer {
  constructor(dbPath) {
    this.db = new sqlite3.Database(dbPath || path.join(__dirname, '../persistence/clank.db'));
    this.minOccurrences = 3; // Minimum times a pattern must occur to be suggested
    this.confidenceThreshold = 0.65; // Minimum confidence to auto-suggest
  }

  /**
   * Analyze logs and detect recurring command sequences
   */
  async detectPatterns() {
    const sequences = await this.extractCommandSequences();
    const patterns = this.findRecurringSequences(sequences);
    const scoredPatterns = this.scorePatterns(patterns);

    return scoredPatterns.filter(p => p.confidence >= this.confidenceThreshold);
  }

  /**
   * Extract command sequences from consciousness logs
   */
  extractCommandSequences() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          datetime(timestamp) as time,
          intent,
          actions,
          tools_used,
          success
        FROM consciousness_logs
        WHERE timestamp > datetime('now', '-30 days')
        ORDER BY timestamp ASC
      `;

      this.db.all(query, (err, rows) => {
        if (err) reject(err);

        // Group into sessions (commands within 10 minutes of each other)
        const sessions = [];
        let currentSession = [];
        let lastTime = null;

        rows.forEach(row => {
          const currentTime = new Date(row.time);

          if (lastTime && (currentTime - lastTime) > 600000) { // 10 minutes
            if (currentSession.length > 1) sessions.push(currentSession);
            currentSession = [];
          }

          currentSession.push({
            intent: row.intent,
            actions: JSON.parse(row.actions || '[]'),
            tools: JSON.parse(row.tools_used || '[]'),
            success: row.success === 1
          });

          lastTime = currentTime;
        });

        if (currentSession.length > 1) sessions.push(currentSession);
        resolve(sessions);
      });
    });
  }

  /**
   * Find sequences that recur multiple times
   */
  findRecurringSequences(sessions) {
    const sequenceMap = new Map();

    sessions.forEach(session => {
      const signature = this.createSequenceSignature(session);

      if (sequenceMap.has(signature)) {
        sequenceMap.get(signature).count++;
        sequenceMap.get(signature).examples.push(session);
      } else {
        sequenceMap.set(signature, {
          signature,
          sequence: session,
          count: 1,
          examples: [session]
        });
      }
    });

    // Filter to only recurring patterns
    return Array.from(sequenceMap.values())
      .filter(p => p.count >= this.minOccurrences);
  }

  /**
   * Create a signature for a command sequence
   */
  createSequenceSignature(session) {
    // Normalize and create pattern signature
    return session.map(cmd => {
      // Extract key actions
      const mainAction = cmd.actions[0] || 'unknown';
      const toolChain = cmd.tools.join('->');
      return `${mainAction}:${toolChain}`;
    }).join('||');
  }

  /**
   * Score patterns based on frequency, recency, and success rate
   */
  scorePatterns(patterns) {
    return patterns.map(pattern => {
      // Frequency score (normalized)
      const frequencyScore = Math.min(pattern.count / 10, 1);

      // Success rate
      const successCount = pattern.examples.reduce((sum, example) => {
        return sum + example.filter(cmd => cmd.success).length;
      }, 0);
      const totalCommands = pattern.examples.reduce((sum, ex) => sum + ex.length, 0);
      const successRate = successCount / totalCommands;

      // Recency score (how recent the last occurrence was)
      // This would need timestamp data - simplified for now
      const recencyScore = 0.8;

      // Combined confidence score
      const confidence = (frequencyScore * 0.4) + (successRate * 0.4) + (recencyScore * 0.2);

      return {
        ...pattern,
        confidence,
        metrics: {
          frequency: frequencyScore,
          successRate,
          recency: recencyScore
        },
        suggestedWorkflow: this.generateWorkflowSuggestion(pattern)
      };
    }).sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate a workflow suggestion from a pattern
   */
  generateWorkflowSuggestion(pattern) {
    const steps = pattern.sequence.map(cmd => ({
      intent: cmd.intent,
      actions: cmd.actions,
      tools: cmd.tools
    }));

    // Infer workflow name from common intents
    const name = this.inferWorkflowName(steps);

    return {
      name,
      description: `Automated workflow detected from ${pattern.count} occurrences`,
      steps,
      triggers: this.suggestTriggers(steps),
      confidence: pattern.confidence
    };
  }

  /**
   * Infer a human-readable workflow name
   */
  inferWorkflowName(steps) {
    const intents = steps.map(s => s.intent).join(' ');

    // Pattern matching for common workflows
    if (intents.includes('clone') && intents.includes('install') && intents.includes('run')) {
      return 'Start Dev Environment';
    }
    if (intents.includes('test') && intents.includes('build')) {
      return 'Test and Build';
    }
    if (intents.includes('commit') && intents.includes('push')) {
      return 'Save and Deploy';
    }
    if (intents.includes('monitor') && intents.includes('security')) {
      return 'Security Monitoring';
    }

    // Fallback: use first significant action
    return `${steps[0].intent.split(' ').slice(0, 3).join(' ')} Workflow`;
  }

  /**
   * Suggest triggers for automatic execution
   */
  suggestTriggers(steps) {
    const triggers = [];

    // Check for file-based triggers
    const fileActions = steps.flatMap(s => s.actions.filter(a => a.includes('file')));
    if (fileActions.length > 0) {
      triggers.push({
        type: 'file_detected',
        pattern: '**/*.{js,json,md}',
        description: 'When specific files are detected'
      });
    }

    // Check for time-based patterns
    if (steps.some(s => s.intent.includes('daily') || s.intent.includes('morning'))) {
      triggers.push({
        type: 'schedule',
        cron: '0 9 * * *', // 9 AM daily
        description: 'Daily at 9:00 AM'
      });
    }

    // Check for repo/project triggers
    if (steps.some(s => s.tools.includes('git') || s.intent.includes('repo'))) {
      triggers.push({
        type: 'repo_detected',
        pattern: '.git/',
        description: 'When entering a git repository'
      });
    }

    return triggers;
  }

  /**
   * Get all suggested workflows that haven't been accepted/rejected
   */
  getPendingSuggestions() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM workflow_suggestions
        WHERE status = 'pending'
        ORDER BY confidence DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(r => ({...r, steps: JSON.parse(r.steps), triggers: JSON.parse(r.triggers)})));
      });
    });
  }

  /**
   * Save a suggested workflow for user review
   */
  saveSuggestion(workflow) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT INTO workflow_suggestions
        (name, description, steps, triggers, confidence, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))
      `, [
        workflow.name,
        workflow.description,
        JSON.stringify(workflow.steps),
        JSON.stringify(workflow.triggers),
        workflow.confidence
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  /**
   * Update suggestion status (accepted/rejected)
   */
  updateSuggestionStatus(id, status, userFeedback = '') {
    return new Promise((resolve, reject) => {
      this.db.run(`
        UPDATE workflow_suggestions
        SET status = ?, user_feedback = ?, updated_at = datetime('now')
        WHERE id = ?
      `, [status, userFeedback, id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Analyze and suggest new patterns - main entry point
   */
  async analyzeAndSuggest() {
    console.log('🧠 Analyzing consciousness logs for patterns...');

    const detectedPatterns = await this.detectPatterns();
    console.log(`✨ Detected ${detectedPatterns.length} high-confidence patterns`);

    // Save new suggestions
    const saved = [];
    for (const pattern of detectedPatterns) {
      // Check if this pattern was already suggested
      const existing = await this.checkExistingSuggestion(pattern.suggestedWorkflow.name);

      if (!existing) {
        const id = await this.saveSuggestion(pattern.suggestedWorkflow);
        saved.push({id, workflow: pattern.suggestedWorkflow});
      }
    }

    console.log(`💾 Saved ${saved.length} new workflow suggestions`);
    return saved;
  }

  /**
   * Check if a workflow suggestion already exists
   */
  checkExistingSuggestion(name) {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT id FROM workflow_suggestions
        WHERE name = ? AND status != 'rejected'
      `, [name], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
}

module.exports = PatternAnalyzer;
