/**
 * Workflow Manager - Creates and executes automated workflows
 * Converts detected patterns into executable workflows
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import daemon from '../daemon/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../data/workflows.db');

class WorkflowManager {
  constructor() {
    this.db = null;
    this.activeWorkflows = new Map();
    this.triggers = new Map();
  }

  init() {
    this.db = new Database(DB_PATH);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS workflows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        actions TEXT NOT NULL,
        trigger_type TEXT,
        trigger_value TEXT,
        enabled INTEGER DEFAULT 1,
        auto_execute INTEGER DEFAULT 0,
        execution_count INTEGER DEFAULT 0,
        last_executed TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS workflow_executions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workflow_id INTEGER NOT NULL,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        status TEXT DEFAULT 'running',
        output TEXT,
        error TEXT,
        FOREIGN KEY (workflow_id) REFERENCES workflows(id)
      );

      CREATE INDEX IF NOT EXISTS idx_workflow_enabled ON workflows(enabled);
      CREATE INDEX IF NOT EXISTS idx_trigger_type ON workflows(trigger_type);
    `);

    console.log('[WORKFLOWS] Manager initialized');
  }

  // Create a new workflow
  createWorkflow(name, actions, options = {}) {
    const workflow = {
      name,
      description: options.description || '',
      actions: JSON.stringify(actions),
      trigger_type: options.triggerType || 'manual',
      trigger_value: options.triggerValue || null,
      enabled: options.enabled !== false ? 1 : 0,
      auto_execute: options.autoExecute ? 1 : 0,
      created_at: new Date().toISOString()
    };

    const result = this.db.prepare(`
      INSERT INTO workflows (name, description, actions, trigger_type, trigger_value, enabled, auto_execute, created_at)
      VALUES (@name, @description, @actions, @trigger_type, @trigger_value, @enabled, @auto_execute, @created_at)
    `).run(workflow);

    const workflowId = result.lastInsertRowid;

    // Set up trigger if auto-execute is enabled
    if (options.autoExecute) {
      this.setupTrigger(workflowId, options.triggerType, options.triggerValue);
    }

    console.log(`[WORKFLOWS] Created workflow: ${name} (ID: ${workflowId})`);

    return { id: workflowId, ...workflow };
  }

  // Create workflow from pattern suggestion
  createFromSuggestion(suggestion) {
    const actions = JSON.parse(suggestion.actions);

    return this.createWorkflow(
      suggestion.workflow_name,
      actions,
      {
        description: suggestion.workflow_description,
        triggerType: suggestion.trigger_type,
        triggerValue: suggestion.trigger_value,
        autoExecute: true
      }
    );
  }

  // Execute a workflow
  async executeWorkflow(workflowId, context = {}) {
    const workflow = this.db.prepare('SELECT * FROM workflows WHERE id = ?').get(workflowId);

    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (!workflow.enabled) {
      console.log(`[WORKFLOWS] Workflow ${workflow.name} is disabled`);
      return;
    }

    console.log(`[WORKFLOWS] ⚡ Executing workflow: ${workflow.name}`);

    // Create execution record
    const execution = this.db.prepare(`
      INSERT INTO workflow_executions (workflow_id, started_at, status)
      VALUES (?, datetime('now'), 'running')
    `).run(workflowId);

    const executionId = execution.lastInsertRowid;

    try {
      const actions = JSON.parse(workflow.actions);
      const results = [];

      for (const action of actions) {
        console.log(`[WORKFLOWS]   → ${action.action_type}: ${action.command || ''}`);

        const result = await this.executeAction(action, context);
        results.push(result);

        if (!result.success) {
          throw new Error(`Action failed: ${action.command}`);
        }
      }

      // Mark as completed
      this.db.prepare(`
        UPDATE workflow_executions
        SET completed_at = datetime('now'), status = 'completed', output = ?
        WHERE id = ?
      `).run(JSON.stringify(results), executionId);

      // Update workflow execution count
      this.db.prepare(`
        UPDATE workflows
        SET execution_count = execution_count + 1, last_executed = datetime('now')
        WHERE id = ?
      `).run(workflowId);

      console.log(`[WORKFLOWS] ✅ Workflow completed: ${workflow.name}`);

      return { success: true, results };

    } catch (error) {
      // Mark as failed
      this.db.prepare(`
        UPDATE workflow_executions
        SET completed_at = datetime('now'), status = 'failed', error = ?
        WHERE id = ?
      `).run(error.message, executionId);

      console.log(`[WORKFLOWS] ❌ Workflow failed: ${workflow.name} - ${error.message}`);

      return { success: false, error: error.message };
    }
  }

  // Execute a single action
  async executeAction(action, context) {
    const { action_type, command, cwd, args } = action;

    // Replace context variables in command
    let finalCommand = command;
    if (context && typeof finalCommand === 'string') {
      for (const [key, value] of Object.entries(context)) {
        finalCommand = finalCommand.replace(`\${${key}}`, value);
      }
    }

    const finalCwd = cwd || context.cwd || process.cwd();

    // Execute based on action type
    if (action_type === 'command') {
      return await daemon.executeCommand(finalCommand, { cwd: finalCwd });
    } else if (action_type.startsWith('git:')) {
      const gitAction = action_type.split(':')[1];
      const gitTool = daemon.tools.git;

      if (gitAction === 'clone') {
        return await gitTool.clone(finalCommand, finalCwd);
      } else if (gitAction === 'pull') {
        return await gitTool.pull(finalCwd);
      } else if (gitAction === 'push') {
        return await gitTool.push(finalCwd);
      }
    } else if (action_type.startsWith('fs:')) {
      // File system operations would go here
      return { success: true };
    }

    // Default: execute as command
    return await daemon.executeCommand(finalCommand, { cwd: finalCwd });
  }

  // Set up a trigger for auto-execution
  setupTrigger(workflowId, triggerType, triggerValue) {
    const trigger = {
      workflowId,
      type: triggerType,
      value: triggerValue
    };

    this.triggers.set(workflowId, trigger);

    console.log(`[WORKFLOWS] Set up trigger for workflow ${workflowId}: ${triggerType}`);
  }

  // Check if a trigger should fire
  async checkTriggers(event) {
    for (const [workflowId, trigger] of this.triggers.entries()) {
      if (this.shouldTrigger(trigger, event)) {
        await this.executeWorkflow(workflowId, event.context);
      }
    }
  }

  // Determine if a trigger should fire
  shouldTrigger(trigger, event) {
    if (trigger.type === 'repo_detected' && event.type === 'git:clone') {
      return true;
    }

    if (trigger.type === 'directory_access' && event.type === 'fs:chdir') {
      return event.path === trigger.value;
    }

    if (trigger.type === 'schedule') {
      // TODO: Implement scheduled triggers
      return false;
    }

    return false;
  }

  // Get all workflows
  getWorkflows(options = {}) {
    let query = 'SELECT * FROM workflows';
    const params = [];

    if (options.enabled !== undefined) {
      query += ' WHERE enabled = ?';
      params.push(options.enabled ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC';

    return this.db.prepare(query).all(...params);
  }

  // Get workflow by ID
  getWorkflow(id) {
    return this.db.prepare('SELECT * FROM workflows WHERE id = ?').get(id);
  }

  // Enable/disable workflow
  toggleWorkflow(id, enabled) {
    this.db.prepare('UPDATE workflows SET enabled = ? WHERE id = ?').run(enabled ? 1 : 0, id);
    console.log(`[WORKFLOWS] Workflow ${id} ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Delete workflow
  deleteWorkflow(id) {
    this.db.prepare('DELETE FROM workflows WHERE id = ?').run(id);
    this.triggers.delete(id);
    console.log(`[WORKFLOWS] Workflow ${id} deleted`);
  }

  // Get execution history
  getExecutions(workflowId = null, limit = 50) {
    if (workflowId) {
      return this.db.prepare(`
        SELECT * FROM workflow_executions
        WHERE workflow_id = ?
        ORDER BY started_at DESC
        LIMIT ?
      `).all(workflowId, limit);
    } else {
      return this.db.prepare(`
        SELECT we.*, w.name as workflow_name
        FROM workflow_executions we
        JOIN workflows w ON we.workflow_id = w.id
        ORDER BY we.started_at DESC
        LIMIT ?
      `).all(limit);
    }
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

export default new WorkflowManager();
