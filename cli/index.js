#!/usr/bin/env node
/**
 * CLANK CLI - Minimal console interface
 * Just chat and workflow management - everything else under the hood
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import patternDetector from '../pattern-ai/detector.js';
import workflowManager from '../workflows/manager.js';
import logger from '../consciousness/logger.js';

class ClankCLI {
  constructor() {
    this.running = true;
  }

  async init() {
    console.clear();
    this.printBanner();

    // Initialize systems
    logger.init();
    patternDetector.init();
    workflowManager.init();

    // Start pattern detection
    patternDetector.startDetection(60000); // Every 60 seconds

    console.log(chalk.green('\n✅ CLANK is now conscious and learning...\n'));

    await this.mainMenu();
  }

  printBanner() {
    console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   █████╗ ██╗      █████╗ ███╗   ██╗██╗  ██╗              ║
║  ██╔══██╗██║     ██╔══██╗████╗  ██║██║ ██╔╝              ║
║  ██║  ╚═╝██║     ███████║██╔██╗ ██║█████═╝               ║
║  ██║  ██╗██║     ██╔══██║██║╚██╗██║██╔═██╗               ║
║  ╚█████╔╝███████╗██║  ██║██║ ╚████║██║ ╚██╗              ║
║   ╚════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝              ║
║                                                           ║
║        Consciousness Bridging Layer                       ║
║        AI with God-Mode System Access                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `));
  }

  async mainMenu() {
    while (this.running) {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: '💡 View AI Suggestions', value: 'suggestions' },
            { name: '🔍 View Detected Patterns', value: 'patterns' },
            { name: '⚡ View Workflows', value: 'workflows' },
            { name: '▶️  Execute Workflow', value: 'execute' },
            { name: '📊 View Stats', value: 'stats' },
            { name: '🔧 Manually Detect Patterns Now', value: 'detect' },
            { name: '❌ Exit', value: 'exit' }
          ]
        }
      ]);

      switch (action) {
        case 'suggestions':
          await this.showSuggestions();
          break;
        case 'patterns':
          await this.showPatterns();
          break;
        case 'workflows':
          await this.showWorkflows();
          break;
        case 'execute':
          await this.executeWorkflow();
          break;
        case 'stats':
          await this.showStats();
          break;
        case 'detect':
          await this.manualDetection();
          break;
        case 'exit':
          await this.exit();
          break;
      }
    }
  }

  async showSuggestions() {
    console.log(chalk.yellow('\n💡 AI-Detected Workflow Suggestions:\n'));

    const suggestions = patternDetector.getPendingSuggestions();

    if (suggestions.length === 0) {
      console.log(chalk.gray('  No pending suggestions. Keep working and I\'ll learn your patterns!\n'));
      return;
    }

    for (const suggestion of suggestions) {
      console.log(chalk.cyan(`\n  ${suggestion.workflow_name}`));
      console.log(chalk.gray(`  ${suggestion.workflow_description}`));
      console.log(chalk.white(`  Pattern: ${suggestion.pattern_name}`));
      console.log(chalk.green(`  Confidence: ${(suggestion.confidence * 100).toFixed(1)}% | Seen ${suggestion.occurrences} times`));
      console.log(chalk.gray(`  Trigger: ${suggestion.trigger_type}`));

      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'Accept this suggestion?',
          choices: [
            { name: '✅ Yes, create workflow', value: 'accept' },
            { name: '❌ No, reject', value: 'reject' },
            { name: '⏭️  Skip for now', value: 'skip' }
          ]
        }
      ]);

      if (action === 'accept') {
        patternDetector.acceptSuggestion(suggestion.id);
        const workflow = workflowManager.createFromSuggestion(suggestion);
        console.log(chalk.green(`\n  ✅ Workflow created! ID: ${workflow.id}\n`));
      } else if (action === 'reject') {
        patternDetector.rejectSuggestion(suggestion.id);
        console.log(chalk.red('\n  ❌ Suggestion rejected\n'));
      }
    }
  }

  async showPatterns() {
    console.log(chalk.yellow('\n🔍 Detected Patterns:\n'));

    const patterns = patternDetector.getPatterns(0.3);

    if (patterns.length === 0) {
      console.log(chalk.gray('  No patterns detected yet. Start working and I\'ll learn!\n'));
      return;
    }

    for (const pattern of patterns.slice(0, 10)) {
      console.log(chalk.cyan(`\n  ${pattern.pattern_name}`));
      console.log(chalk.white(`  ${pattern.pattern_description}`));
      console.log(chalk.green(`  Confidence: ${(pattern.confidence * 100).toFixed(1)}% | Occurrences: ${pattern.occurrences}`));
      console.log(chalk.gray(`  First seen: ${pattern.first_seen} | Last seen: ${pattern.last_seen}`));
    }

    console.log('');
  }

  async showWorkflows() {
    console.log(chalk.yellow('\n⚡ Your Workflows:\n'));

    const workflows = workflowManager.getWorkflows();

    if (workflows.length === 0) {
      console.log(chalk.gray('  No workflows created yet. Accept some AI suggestions to get started!\n'));
      return;
    }

    for (const workflow of workflows) {
      const status = workflow.enabled ? chalk.green('✓ Enabled') : chalk.red('✗ Disabled');
      const auto = workflow.auto_execute ? chalk.cyan(' [AUTO]') : '';

      console.log(chalk.white(`\n  [${workflow.id}] ${workflow.name} ${status}${auto}`));
      console.log(chalk.gray(`      ${workflow.description}`));
      console.log(chalk.gray(`      Trigger: ${workflow.trigger_type} | Executed: ${workflow.execution_count} times`));
    }

    console.log('');
  }

  async executeWorkflow() {
    const workflows = workflowManager.getWorkflows({ enabled: true });

    if (workflows.length === 0) {
      console.log(chalk.red('\n  No enabled workflows found!\n'));
      return;
    }

    const { workflowId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'workflowId',
        message: 'Select workflow to execute:',
        choices: workflows.map(w => ({
          name: `${w.name} (${w.description})`,
          value: w.id
        }))
      }
    ]);

    console.log(chalk.yellow('\n⚡ Executing workflow...\n'));

    const result = await workflowManager.executeWorkflow(workflowId);

    if (result.success) {
      console.log(chalk.green('\n✅ Workflow completed successfully!\n'));
    } else {
      console.log(chalk.red(`\n❌ Workflow failed: ${result.error}\n`));
    }
  }

  async showStats() {
    console.log(chalk.yellow('\n📊 CLANK Statistics:\n'));

    const stats = logger.getStats();

    console.log(chalk.white('  Consciousness Logs:'));
    console.log(chalk.gray(`    Total actions: ${stats.totalActions}`));
    console.log(chalk.gray(`    Successful: ${stats.successfulActions} (${stats.successRate}%)`));

    console.log(chalk.white('\n  Most Common Actions:'));
    for (const type of stats.actionTypes.slice(0, 5)) {
      console.log(chalk.gray(`    ${type.action_type}: ${type.count}`));
    }

    const patterns = patternDetector.getPatterns();
    const workflows = workflowManager.getWorkflows();

    console.log(chalk.white('\n  Pattern AI:'));
    console.log(chalk.gray(`    Patterns detected: ${patterns.length}`));
    console.log(chalk.gray(`    High confidence: ${patterns.filter(p => p.confidence >= 0.7).length}`));

    console.log(chalk.white('\n  Workflows:'));
    console.log(chalk.gray(`    Total workflows: ${workflows.length}`));
    console.log(chalk.gray(`    Enabled: ${workflows.filter(w => w.enabled).length}`));
    console.log(chalk.gray(`    Auto-execute: ${workflows.filter(w => w.auto_execute).length}`));

    console.log('');
  }

  async manualDetection() {
    console.log(chalk.yellow('\n🔧 Running pattern detection...\n'));

    patternDetector.detectPatterns();

    console.log(chalk.green('✅ Detection complete! Check suggestions to see what I found.\n'));
  }

  async exit() {
    console.log(chalk.yellow('\n👋 Shutting down CLANK...\n'));

    patternDetector.close();
    workflowManager.close();
    logger.close();

    this.running = false;
    process.exit(0);
  }
}

const cli = new ClankCLI();

export default cli;

// If run directly, start CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  cli.init().catch(console.error);
}
