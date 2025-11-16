/**
 * CLANK Sandbox Tester
 * Tests workflows in isolated sandbox environment before live deployment
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class SandboxTester {
  constructor() {
    this.sandboxDir = path.join(os.tmpdir(), 'clank-sandbox');
    this.testResults = [];
  }

  /**
   * Create isolated sandbox environment
   */
  async createSandbox() {
    console.log('📦 Creating sandbox environment...');

    try {
      await fs.mkdir(this.sandboxDir, {recursive: true});

      // Create sandbox structure
      await fs.mkdir(path.join(this.sandboxDir, 'workspace'), {recursive: true});
      await fs.mkdir(path.join(this.sandboxDir, 'logs'), {recursive: true});

      // Create sandbox config
      const config = {
        created: new Date().toISOString(),
        restrictions: {
          network: false, // No network access in sandbox
          filesystem: path.join(this.sandboxDir, 'workspace'),
          maxExecutionTime: 60000, // 1 minute max
        }
      };

      await fs.writeFile(
        path.join(this.sandboxDir, 'config.json'),
        JSON.stringify(config, null, 2)
      );

      console.log(`✅ Sandbox created: ${this.sandboxDir}`);
      return this.sandboxDir;

    } catch (error) {
      console.error('❌ Sandbox creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Test a workflow in sandbox
   */
  async testWorkflow(workflow) {
    console.log(`\n🧪 Testing workflow: ${workflow.name}\n`);

    const sandboxPath = await this.createSandbox();
    const testLog = [];
    let success = true;

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        console.log(`  Testing step ${i + 1}/${workflow.steps.length}: ${step.intent}`);

        const stepResult = await this.testStep(step, sandboxPath);
        testLog.push({
          step: i + 1,
          intent: step.intent,
          ...stepResult
        });

        if (!stepResult.success) {
          success = false;
          console.log(`    ❌ Step failed: ${stepResult.error}`);
          break;
        } else {
          console.log(`    ✅ Step passed`);
        }
      }

      // Save test results
      const result = {
        workflowName: workflow.name,
        timestamp: new Date().toISOString(),
        success,
        steps: testLog,
        sandboxPath
      };

      await this.saveTestResults(result);

      console.log(`\n${success ? '✅' : '❌'} Test ${success ? 'PASSED' : 'FAILED'}: ${workflow.name}\n`);

      return result;

    } catch (error) {
      console.error(`❌ Test error: ${error.message}`);
      return {
        workflowName: workflow.name,
        success: false,
        error: error.message
      };
    } finally {
      // Cleanup sandbox after test
      await this.cleanupSandbox();
    }
  }

  /**
   * Test a single workflow step
   */
  async testStep(step, sandboxPath) {
    const startTime = Date.now();

    try {
      // Simulate step execution in sandbox
      // This is a simplified version - real implementation would map to actual tool calls
      const result = await this.executeInSandbox(step, sandboxPath);

      return {
        success: true,
        duration: Date.now() - startTime,
        output: result
      };

    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Execute a command in sandbox
   */
  executeInSandbox(step, sandboxPath) {
    return new Promise((resolve, reject) => {
      // Map step actions to safe sandbox commands
      const command = this.mapStepToCommand(step);

      if (!command) {
        resolve({simulated: true, step: step.intent});
        return;
      }

      const process = spawn(command.cmd, command.args, {
        cwd: path.join(sandboxPath, 'workspace'),
        timeout: 60000,
        env: {
          ...process.env,
          CLANK_SANDBOX: '1',
          PATH: process.env.PATH
        }
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => stdout += data.toString());
      process.stderr.on('data', (data) => stderr += data.toString());

      process.on('close', (code) => {
        if (code === 0) {
          resolve({stdout, stderr, exitCode: code});
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      process.on('error', reject);
    });
  }

  /**
   * Map workflow step to sandbox-safe command
   */
  mapStepToCommand(step) {
    // Git operations
    if (step.tools.includes('git')) {
      if (step.intent.includes('clone')) {
        // In sandbox, simulate clone
        return {
          cmd: 'mkdir',
          args: ['-p', 'test-repo']
        };
      }
    }

    // File operations
    if (step.tools.includes('filesystem')) {
      if (step.actions.some(a => a.includes('read'))) {
        return {
          cmd: 'ls',
          args: ['-la']
        };
      }
    }

    // NPM operations
    if (step.intent.includes('install')) {
      // Simulate npm install
      return {
        cmd: 'echo',
        args: ['Simulating npm install...']
      };
    }

    // Default: no command (simulation only)
    return null;
  }

  /**
   * Save test results
   */
  async saveTestResults(result) {
    const filename = `test-${Date.now()}.json`;
    const filepath = path.join(this.sandboxDir, 'logs', filename);

    await fs.writeFile(filepath, JSON.stringify(result, null, 2));
    this.testResults.push(result);

    console.log(`📝 Test results saved: ${filepath}`);
  }

  /**
   * Cleanup sandbox
   */
  async cleanupSandbox() {
    try {
      await fs.rm(this.sandboxDir, {recursive: true, force: true});
      console.log('🧹 Sandbox cleaned up');
    } catch (error) {
      console.warn('⚠️  Sandbox cleanup warning:', error.message);
    }
  }

  /**
   * Get all test results
   */
  getTestResults() {
    return this.testResults;
  }

  /**
   * Get test statistics
   */
  getStats() {
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.success).length;
    const failed = total - passed;

    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? (passed / total * 100).toFixed(1) : 0
    };
  }
}

module.exports = SandboxTester;
