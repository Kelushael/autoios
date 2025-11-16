/**
 * CLANK Workflow UI
 * Terminal interface for reviewing and managing workflow suggestions
 */

const readline = require('readline');
const chalk = require('chalk');

class WorkflowUI {
  constructor(proactiveAgent) {
    this.agent = proactiveAgent;
    this.rl = null;
  }

  /**
   * Display pending workflow suggestions
   */
  async displayPendingSuggestions() {
    const suggestions = await this.agent.getPendingSuggestions();

    if (suggestions.length === 0) {
      console.log(chalk.yellow('\n💡 No pending workflow suggestions\n'));
      return;
    }

    console.log(chalk.cyan('\n╔═══════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║') + chalk.bold('           WORKFLOW SUGGESTIONS - Review Required           ') + chalk.cyan('║'));
    console.log(chalk.cyan('╚═══════════════════════════════════════════════════════════╝\n'));

    suggestions.forEach((suggestion, index) => {
      console.log(chalk.bold.green(`[${index + 1}] ${suggestion.name}`));
      console.log(chalk.gray(`    ${suggestion.description}`));
      console.log(chalk.yellow(`    Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`));

      console.log(chalk.blue('    Steps:'));
      suggestion.steps.forEach((step, i) => {
        console.log(chalk.gray(`      ${i + 1}. ${step.intent}`));
      });

      console.log(chalk.magenta('    Triggers:'));
      suggestion.triggers.forEach(trigger => {
        console.log(chalk.gray(`      • ${trigger.description}`));
      });

      console.log('');
    });

    return suggestions;
  }

  /**
   * Interactive review session
   */
  async reviewSuggestions() {
    const suggestions = await this.displayPendingSuggestions();

    if (suggestions.length === 0) return;

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    for (const suggestion of suggestions) {
      await this.reviewSingleSuggestion(suggestion);
    }

    this.rl.close();
  }

  /**
   * Review a single suggestion
   */
  reviewSingleSuggestion(suggestion) {
    return new Promise((resolve) => {
      console.log(chalk.bold.cyan(`\n📌 ${suggestion.name}\n`));

      this.rl.question(
        chalk.yellow('Accept this workflow? [Y]es / [N]o / [T]est / [S]kip: '),
        async (answer) => {
          const choice = answer.trim().toLowerCase();

          switch (choice) {
            case 'y':
            case 'yes':
              await this.acceptWorkflow(suggestion);
              break;

            case 'n':
            case 'no':
              await this.rejectWorkflow(suggestion);
              break;

            case 't':
            case 'test':
              await this.testWorkflow(suggestion);
              break;

            case 's':
            case 'skip':
            default:
              console.log(chalk.gray('  Skipped\n'));
              break;
          }

          resolve();
        }
      );
    });
  }

  /**
   * Accept a workflow
   */
  async acceptWorkflow(suggestion) {
    console.log(chalk.green('✅ Accepting workflow...'));

    await this.agent.acceptSuggestion(suggestion.id, 'User approved');

    console.log(chalk.green(`✨ Workflow "${suggestion.name}" is now active!\n`));
  }

  /**
   * Reject a workflow
   */
  async rejectWorkflow(suggestion) {
    return new Promise((resolve) => {
      this.rl.question(
        chalk.yellow('Reason for rejection (optional): '),
        async (reason) => {
          await this.agent.rejectSuggestion(suggestion.id, reason);
          console.log(chalk.red(`❌ Workflow rejected\n`));
          resolve();
        }
      );
    });
  }

  /**
   * Test a workflow
   */
  async testWorkflow(suggestion) {
    console.log(chalk.blue('🧪 Running sandbox test...\n'));

    const SandboxTester = require('../intelligence/sandbox_tester');
    const tester = new SandboxTester();

    try {
      const result = await tester.testWorkflow(suggestion);

      if (result.success) {
        console.log(chalk.green('\n✅ Test passed! Would you like to accept this workflow?'));

        return new Promise((resolve) => {
          this.rl.question(
            chalk.yellow('[Y]es / [N]o: '),
            async (answer) => {
              if (answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes') {
                await this.acceptWorkflow(suggestion);
              }
              resolve();
            }
          );
        });
      } else {
        console.log(chalk.red('\n❌ Test failed. Workflow not activated.\n'));
      }

    } catch (error) {
      console.error(chalk.red(`\n❌ Test error: ${error.message}\n`));
    }
  }

  /**
   * Display active workflows
   */
  async displayActiveWorkflows() {
    // Get all accepted workflows from database
    const active = await new Promise((resolve, reject) => {
      this.agent.db.all(`
        SELECT * FROM workflow_suggestions
        WHERE status = 'accepted'
        ORDER BY created_at DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(r => ({...r, triggers: JSON.parse(r.triggers)})));
      });
    });

    if (active.length === 0) {
      console.log(chalk.yellow('\n📋 No active workflows\n'));
      return;
    }

    console.log(chalk.cyan('\n╔═══════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║') + chalk.bold('                    ACTIVE WORKFLOWS                        ') + chalk.cyan('║'));
    console.log(chalk.cyan('╚═══════════════════════════════════════════════════════════╝\n'));

    active.forEach((workflow, index) => {
      console.log(chalk.bold.green(`[${index + 1}] ${workflow.name}`));
      console.log(chalk.gray(`    ${workflow.description}`));
      console.log(chalk.magenta('    Active triggers:'));
      workflow.triggers.forEach(trigger => {
        console.log(chalk.gray(`      • ${trigger.description}`));
      });
      console.log('');
    });
  }

  /**
   * Display workflow execution history
   */
  async displayHistory(workflowId) {
    const history = await this.agent.getWorkflowHistory(workflowId);

    if (history.length === 0) {
      console.log(chalk.yellow('\n📜 No execution history\n'));
      return;
    }

    console.log(chalk.cyan('\n╔═══════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║') + chalk.bold('                  EXECUTION HISTORY                         ') + chalk.cyan('║'));
    console.log(chalk.cyan('╚═══════════════════════════════════════════════════════════╝\n'));

    history.forEach((execution, index) => {
      const icon = execution.success ? chalk.green('✅') : chalk.red('❌');
      console.log(`${icon} ${execution.executed_at} - ${execution.trigger_type}`);

      execution.results.forEach(result => {
        const stepIcon = result.success ? chalk.green('  ✓') : chalk.red('  ✗');
        console.log(`${stepIcon} Step ${result.step}: ${result.intent}`);
      });

      console.log('');
    });
  }
}

module.exports = WorkflowUI;
