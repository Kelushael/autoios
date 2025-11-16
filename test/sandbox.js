/**
 * CLANK Sandbox Test
 * Simulates user behavior to test pattern detection and workflow suggestions
 */

import logger from '../consciousness/logger.js';
import patternDetector from '../pattern-ai/detector.js';
import workflowManager from '../workflows/manager.js';
import chalk from 'chalk';

class SandboxTest {
  constructor() {
    this.testActions = [
      // Simulate: git clone → npm install → npm run dev (3 times)
      { action: 'command', cmd: 'git clone https://github.com/example/repo1.git', cwd: '/tmp' },
      { action: 'command', cmd: 'npm install', cwd: '/tmp/repo1' },
      { action: 'command', cmd: 'npm run dev', cwd: '/tmp/repo1' },

      { action: 'command', cmd: 'git clone https://github.com/example/repo2.git', cwd: '/tmp' },
      { action: 'command', cmd: 'npm install', cwd: '/tmp/repo2' },
      { action: 'command', cmd: 'npm run dev', cwd: '/tmp/repo2' },

      { action: 'command', cmd: 'git clone https://github.com/example/repo3.git', cwd: '/tmp' },
      { action: 'command', cmd: 'npm install', cwd: '/tmp/repo3' },
      { action: 'command', cmd: 'npm run dev', cwd: '/tmp/repo3' },

      // Simulate: pytest (multiple times)
      { action: 'command', cmd: 'pytest', cwd: '/home/project' },
      { action: 'command', cmd: 'pytest', cwd: '/home/project' },
      { action: 'command', cmd: 'pytest', cwd: '/home/project' },
    ];
  }

  async run() {
    console.log(chalk.cyan('\n╔═══════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║  CLANK Sandbox Test                                       ║'));
    console.log(chalk.cyan('╚═══════════════════════════════════════════════════════════╝\n'));

    // Initialize systems
    console.log(chalk.yellow('📦 Initializing CLANK systems...\n'));

    logger.init();
    patternDetector.init();
    workflowManager.init();

    // Simulate user actions
    console.log(chalk.yellow('🎬 Simulating user behavior...\n'));

    for (const action of this.testActions) {
      console.log(chalk.gray(`  → ${action.cmd} (in ${action.cwd})`));

      logger.log('command', {
        command: action.cmd,
        cwd: action.cwd,
        success: true
      });

      // Small delay to simulate real usage
      await this.sleep(100);
    }

    console.log(chalk.green('\n✅ Simulated 12 actions logged to consciousness\n'));

    // Run pattern detection
    console.log(chalk.yellow('🔍 Running pattern detection AI...\n'));

    patternDetector.detectPatterns();

    await this.sleep(500);

    // Show detected patterns
    const patterns = patternDetector.getPatterns();

    console.log(chalk.cyan(`\n📊 Detected ${patterns.length} patterns:\n`));

    for (const pattern of patterns) {
      console.log(chalk.white(`  ${pattern.pattern_name}`));
      console.log(chalk.gray(`    Occurrences: ${pattern.occurrences} | Confidence: ${(pattern.confidence * 100).toFixed(1)}%`));
    }

    // Show workflow suggestions
    const suggestions = patternDetector.getPendingSuggestions();

    console.log(chalk.cyan(`\n💡 Generated ${suggestions.length} workflow suggestions:\n`));

    for (const suggestion of suggestions) {
      console.log(chalk.green(`  ✓ ${suggestion.workflow_name}`));
      console.log(chalk.gray(`    ${suggestion.workflow_description}`));
      console.log(chalk.gray(`    Confidence: ${(suggestion.confidence * 100).toFixed(1)}% | Trigger: ${suggestion.trigger_type}`));
    }

    // Auto-accept first suggestion
    if (suggestions.length > 0) {
      console.log(chalk.yellow('\n⚡ Auto-accepting first suggestion...\n'));

      const firstSuggestion = suggestions[0];
      patternDetector.acceptSuggestion(firstSuggestion.id);

      const workflow = workflowManager.createFromSuggestion(firstSuggestion);

      console.log(chalk.green(`✅ Workflow created: ${workflow.name} (ID: ${workflow.id})\n`));

      // List workflows
      const workflows = workflowManager.getWorkflows();
      console.log(chalk.cyan(`📋 Total workflows: ${workflows.length}\n`));

      for (const w of workflows) {
        console.log(chalk.white(`  [${w.id}] ${w.name}`));
        console.log(chalk.gray(`      ${w.description}`));
      }
    }

    // Show stats
    console.log(chalk.yellow('\n📊 Final Statistics:\n'));

    const stats = logger.getStats();

    console.log(chalk.white('  Consciousness:'));
    console.log(chalk.gray(`    Total actions: ${stats.totalActions}`));
    console.log(chalk.gray(`    Success rate: ${stats.successRate}%`));

    console.log(chalk.white('\n  Patterns:'));
    console.log(chalk.gray(`    Detected: ${patterns.length}`));
    console.log(chalk.gray(`    High confidence (≥70%): ${patterns.filter(p => p.confidence >= 0.7).length}`));

    console.log(chalk.white('\n  Workflows:'));
    const workflows = workflowManager.getWorkflows();
    console.log(chalk.gray(`    Created: ${workflows.length}`));
    console.log(chalk.gray(`    Auto-execute: ${workflows.filter(w => w.auto_execute).length}`));

    console.log(chalk.green('\n✅ Sandbox test complete!\n'));

    // Cleanup
    logger.close();
    patternDetector.close();
    workflowManager.close();

    process.exit(0);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run test
const test = new SandboxTest();
test.run().catch(console.error);
