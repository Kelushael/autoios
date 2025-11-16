/**
 * CLANK Proactive Agent
 * Continuously monitors, learns, and suggests workflow automations
 */

const PatternAnalyzer = require('./pattern_analyzer');
const WorkflowExecutor = require('./workflow_executor');
const EventEmitter = require('events');

class ProactiveAgent extends EventEmitter {
  constructor(orchestrator, db) {
    super();
    this.orchestrator = orchestrator;
    this.db = db;
    this.analyzer = new PatternAnalyzer(db);
    this.executor = new WorkflowExecutor(orchestrator, db);
    this.analysisInterval = null;
  }

  /**
   * Start the proactive learning and execution system
   */
  async start() {
    console.log('\n🧠 CLANK Proactive Agent Starting...\n');

    // Initialize database tables
    await this.initializeTables();

    // Load existing active workflows
    await this.executor.loadActiveWorkflows();

    // Start periodic pattern analysis (every 6 hours)
    this.startPeriodicAnalysis(6 * 60 * 60 * 1000);

    // Run initial analysis
    await this.runAnalysis();

    console.log('\n✨ Proactive Agent is now active and learning\n');
  }

  /**
   * Initialize database tables for workflow management
   */
  initializeTables() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Workflow suggestions table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS workflow_suggestions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            steps TEXT NOT NULL,
            triggers TEXT NOT NULL,
            confidence REAL,
            status TEXT DEFAULT 'pending',
            user_feedback TEXT,
            created_at DATETIME,
            updated_at DATETIME
          )
        `);

        // Workflow executions log
        this.db.run(`
          CREATE TABLE IF NOT EXISTS workflow_executions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workflow_id INTEGER,
            trigger_type TEXT,
            results TEXT,
            success INTEGER,
            executed_at DATETIME,
            FOREIGN KEY (workflow_id) REFERENCES workflow_suggestions(id)
          )
        `);

        resolve();
      });
    });
  }

  /**
   * Start periodic pattern analysis
   */
  startPeriodicAnalysis(intervalMs) {
    this.analysisInterval = setInterval(async () => {
      await this.runAnalysis();
    }, intervalMs);

    console.log(`🔄 Periodic analysis scheduled every ${intervalMs / 1000 / 60 / 60} hours`);
  }

  /**
   * Run pattern analysis and generate suggestions
   */
  async runAnalysis() {
    try {
      console.log('\n🔍 Running proactive pattern analysis...\n');

      const suggestions = await this.analyzer.analyzeAndSuggest();

      if (suggestions.length > 0) {
        console.log('\n💡 New workflow suggestions:\n');

        suggestions.forEach(({id, workflow}) => {
          console.log(`  📌 ${workflow.name}`);
          console.log(`     Confidence: ${(workflow.confidence * 100).toFixed(1)}%`);
          console.log(`     Description: ${workflow.description}`);
          console.log(`     Triggers: ${workflow.triggers.map(t => t.description).join(', ')}`);
          console.log('');
        });

        this.emit('suggestions:new', suggestions);
      } else {
        console.log('  No new patterns detected yet\n');
      }

    } catch (error) {
      console.error('❌ Analysis error:', error.message);
      this.emit('analysis:error', error);
    }
  }

  /**
   * Get all pending suggestions for user review
   */
  async getPendingSuggestions() {
    return this.analyzer.getPendingSuggestions();
  }

  /**
   * Accept a workflow suggestion
   */
  async acceptSuggestion(id, userFeedback = '') {
    await this.analyzer.updateSuggestionStatus(id, 'accepted', userFeedback);

    // Get the workflow and activate it
    const workflow = await this.getWorkflowById(id);
    if (workflow) {
      await this.executor.activateWorkflow(workflow);
      console.log(`✅ Workflow activated: ${workflow.name}`);
      this.emit('workflow:accepted', workflow);
    }
  }

  /**
   * Reject a workflow suggestion
   */
  async rejectSuggestion(id, reason = '') {
    await this.analyzer.updateSuggestionStatus(id, 'rejected', reason);
    console.log(`❌ Suggestion rejected: ${id}`);
    this.emit('workflow:rejected', {id, reason});
  }

  /**
   * Get workflow by ID
   */
  getWorkflowById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT * FROM workflow_suggestions WHERE id = ?
      `, [id], (err, row) => {
        if (err) reject(err);
        else if (row) {
          resolve({
            ...row,
            steps: JSON.parse(row.steps),
            triggers: JSON.parse(row.triggers)
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Get workflow execution history
   */
  getWorkflowHistory(workflowId) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM workflow_executions
        WHERE workflow_id = ?
        ORDER BY executed_at DESC
        LIMIT 50
      `, [workflowId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(r => ({...r, results: JSON.parse(r.results)})));
      });
    });
  }

  /**
   * Manually execute a workflow
   */
  async executeWorkflow(workflowId) {
    const workflow = await this.getWorkflowById(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    return this.executor.executeWorkflow(workflow, {
      trigger: 'manual',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Stop the proactive agent
   */
  stop() {
    console.log('\n🛑 Stopping Proactive Agent...\n');

    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
    }

    this.executor.shutdown();

    console.log('✅ Proactive Agent stopped\n');
  }
}

module.exports = ProactiveAgent;
