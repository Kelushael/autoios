/**
 * CLANK Workflow Executor
 * Executes learned workflows automatically based on triggers
 */

const EventEmitter = require('events');
const cron = require('node-cron');
const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');

class WorkflowExecutor extends EventEmitter {
  constructor(orchestrator, db) {
    super();
    this.orchestrator = orchestrator;
    this.db = db;
    this.activeWatchers = new Map();
    this.scheduledJobs = new Map();
    this.executing = new Set();
  }

  /**
   * Load and activate all accepted workflows
   */
  async loadActiveWorkflows() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM workflow_suggestions
        WHERE status = 'accepted'
      `, async (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        console.log(`📋 Loading ${rows.length} active workflows...`);

        for (const workflow of rows) {
          const parsed = {
            ...workflow,
            steps: JSON.parse(workflow.steps),
            triggers: JSON.parse(workflow.triggers)
          };

          await this.activateWorkflow(parsed);
        }

        resolve(rows.length);
      });
    });
  }

  /**
   * Activate a workflow's triggers
   */
  async activateWorkflow(workflow) {
    console.log(`⚡ Activating workflow: ${workflow.name}`);

    for (const trigger of workflow.triggers) {
      switch (trigger.type) {
        case 'schedule':
          this.activateScheduleTrigger(workflow, trigger);
          break;
        case 'file_detected':
          this.activateFileTrigger(workflow, trigger);
          break;
        case 'repo_detected':
          this.activateRepoTrigger(workflow, trigger);
          break;
        default:
          console.warn(`⚠️  Unknown trigger type: ${trigger.type}`);
      }
    }
  }

  /**
   * Activate a cron schedule trigger
   */
  activateScheduleTrigger(workflow, trigger) {
    const job = cron.schedule(trigger.cron, async () => {
      console.log(`⏰ Schedule triggered: ${workflow.name}`);
      await this.executeWorkflow(workflow, {trigger: 'schedule'});
    });

    this.scheduledJobs.set(`${workflow.id}-schedule`, job);
    console.log(`  ⏰ Schedule active: ${trigger.description}`);
  }

  /**
   * Activate file detection trigger
   */
  activateFileTrigger(workflow, trigger) {
    const watchPath = process.cwd();

    const watcher = chokidar.watch(trigger.pattern, {
      cwd: watchPath,
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true
    });

    watcher.on('add', async (filePath) => {
      console.log(`📁 File detected: ${filePath} → ${workflow.name}`);
      await this.executeWorkflow(workflow, {
        trigger: 'file_detected',
        file: filePath
      });
    });

    this.activeWatchers.set(`${workflow.id}-file`, watcher);
    console.log(`  👁️  Watching: ${trigger.pattern}`);
  }

  /**
   * Activate repo detection trigger
   */
  activateRepoTrigger(workflow, trigger) {
    const checkInterval = setInterval(async () => {
      const isRepo = fs.existsSync(path.join(process.cwd(), '.git'));

      if (isRepo && !this.executing.has(workflow.id)) {
        console.log(`🔍 Repo detected → ${workflow.name}`);
        await this.executeWorkflow(workflow, {trigger: 'repo_detected'});
      }
    }, 5000); // Check every 5 seconds

    this.scheduledJobs.set(`${workflow.id}-repo`, {stop: () => clearInterval(checkInterval)});
    console.log(`  🔍 Monitoring for: ${trigger.description}`);
  }

  /**
   * Execute a workflow's steps
   */
  async executeWorkflow(workflow, context) {
    // Prevent duplicate execution
    if (this.executing.has(workflow.id)) {
      console.log(`⏭️  Skipping ${workflow.name} (already executing)`);
      return;
    }

    this.executing.add(workflow.id);

    try {
      console.log(`\n🚀 Executing workflow: ${workflow.name}`);
      console.log(`📝 Description: ${workflow.description}`);
      console.log(`🎯 Triggered by: ${context.trigger}\n`);

      const results = [];

      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        console.log(`  Step ${i + 1}/${workflow.steps.length}: ${step.intent}`);

        try {
          // Execute through orchestrator
          const result = await this.orchestrator.executeIntent(step.intent, {
            ...context,
            workflowId: workflow.id,
            stepNumber: i + 1
          });

          results.push({
            step: i + 1,
            intent: step.intent,
            success: true,
            result
          });

          console.log(`    ✅ Complete`);
        } catch (error) {
          console.error(`    ❌ Failed: ${error.message}`);

          results.push({
            step: i + 1,
            intent: step.intent,
            success: false,
            error: error.message
          });

          // Stop workflow on error
          break;
        }
      }

      // Log workflow execution
      await this.logWorkflowExecution(workflow, results, context);

      console.log(`\n✨ Workflow complete: ${workflow.name}\n`);
      this.emit('workflow:complete', {workflow, results, context});

    } catch (error) {
      console.error(`❌ Workflow failed: ${error.message}`);
      this.emit('workflow:error', {workflow, error, context});
    } finally {
      this.executing.delete(workflow.id);
    }
  }

  /**
   * Log workflow execution to database
   */
  logWorkflowExecution(workflow, results, context) {
    return new Promise((resolve, reject) => {
      const success = results.every(r => r.success);

      this.db.run(`
        INSERT INTO workflow_executions
        (workflow_id, trigger_type, results, success, executed_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `, [
        workflow.id,
        context.trigger,
        JSON.stringify(results),
        success ? 1 : 0
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Deactivate a workflow
   */
  deactivateWorkflow(workflowId) {
    // Stop all watchers for this workflow
    for (const [key, watcher] of this.activeWatchers.entries()) {
      if (key.startsWith(`${workflowId}-`)) {
        watcher.close();
        this.activeWatchers.delete(key);
      }
    }

    // Stop all scheduled jobs for this workflow
    for (const [key, job] of this.scheduledJobs.entries()) {
      if (key.startsWith(`${workflowId}-`)) {
        job.stop();
        this.scheduledJobs.delete(key);
      }
    }

    console.log(`🛑 Deactivated workflow: ${workflowId}`);
  }

  /**
   * Shutdown all workflows
   */
  shutdown() {
    console.log('🛑 Shutting down workflow executor...');

    this.activeWatchers.forEach(watcher => watcher.close());
    this.scheduledJobs.forEach(job => job.stop());

    this.activeWatchers.clear();
    this.scheduledJobs.clear();
  }
}

module.exports = WorkflowExecutor;
