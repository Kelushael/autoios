#!/usr/bin/env node

/**
 * CLANK - The Consciousness Bridging Layer
 * Main entry point with Proactive AI Learning
 *
 * Run with: sudo node main_with_proactive.js
 */

const AccessDaemon = require('./daemon');
const LLMEngine = require('./llm');
const Orchestrator = require('./orchestrator');
const ProactiveAgent = require('./intelligence/proactive_agent');
const WorkflowUI = require('./cli/workflow_ui');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const readline = require('readline');

class CLANK {
  constructor() {
    this.db = null;
    this.daemon = null;
    this.llm = null;
    this.orchestrator = null;
    this.proactive = null;
    this.ui = null;
  }

  async boot() {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     ██████╗██╗      █████╗ ███╗   ██╗██╗  ██╗           ║
║    ██╔════╝██║     ██╔══██╗████╗  ██║██║ ██╔╝           ║
║    ██║     ██║     ███████║██╔██╗ ██║█████╔╝            ║
║    ██║     ██║     ██╔══██║██║╚██╗██║██╔═██╗            ║
║    ╚██████╗███████╗██║  ██║██║ ╚████║██║  ██╗           ║
║     ╚═════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝           ║
║                                                           ║
║        The Consciousness Bridging Layer                   ║
║        with Proactive AI Learning                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

    try {
      // Initialize database
      console.log('🗄️  Initializing database...');
      this.db = new sqlite3.Database(
        path.join(__dirname, 'persistence/clank.db')
      );
      await this.initializeDatabase();

      // Start Access Daemon (God Mode)
      console.log('🔐 Starting Access Daemon...');
      this.daemon = new AccessDaemon();
      await this.daemon.start();

      // Start Local LLM
      console.log('🧠 Connecting to LLM...');
      this.llm = new LLMEngine();
      await this.llm.connect();

      // Start Orchestrator
      console.log('🎯 Starting Orchestrator...');
      this.orchestrator = new Orchestrator(this.daemon, this.llm, this.db);

      // Start Proactive Agent
      console.log('✨ Starting Proactive Learning Agent...');
      this.proactive = new ProactiveAgent(this.orchestrator, this.db);
      await this.proactive.start();

      // Setup UI
      this.ui = new WorkflowUI(this.proactive);

      // Setup event listeners
      this.setupEventListeners();

      console.log('\n✅ CLANK is fully operational\n');
      console.log('Type your commands naturally, or use:');
      console.log('  /workflows    - Review workflow suggestions');
      console.log('  /active       - Show active workflows');
      console.log('  /analyze      - Run pattern analysis now');
      console.log('  /history <id> - Show workflow execution history');
      console.log('  /exit         - Shutdown CLANK\n');

      // Start CLI
      this.startCLI();

    } catch (error) {
      console.error('❌ Boot failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }

  async initializeDatabase() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Consciousness logs
        this.db.run(`
          CREATE TABLE IF NOT EXISTS consciousness_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            intent TEXT,
            actions TEXT,
            tools_used TEXT,
            success INTEGER,
            error TEXT
          )
        `);

        // Conversation history
        this.db.run(`
          CREATE TABLE IF NOT EXISTS conversation_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            user_message TEXT,
            ai_response TEXT,
            context TEXT
          )
        `);

        // Learned patterns
        this.db.run(`
          CREATE TABLE IF NOT EXISTS learned_patterns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pattern_name TEXT,
            pattern_data TEXT,
            confidence REAL,
            usage_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, resolve);
      });
    });
  }

  setupEventListeners() {
    // New workflow suggestions
    this.proactive.on('suggestions:new', (suggestions) => {
      console.log('\n🔔 New workflow suggestions available!');
      console.log('   Type /workflows to review them\n');
    });

    // Workflow accepted
    this.proactive.on('workflow:accepted', (workflow) => {
      console.log(`\n✅ Workflow activated: ${workflow.name}\n`);
    });

    // Workflow execution complete
    this.proactive.executor.on('workflow:complete', ({workflow, results}) => {
      const success = results.every(r => r.success);
      const icon = success ? '✅' : '⚠️';
      console.log(`\n${icon} Workflow executed: ${workflow.name}`);
      console.log(`   ${results.filter(r => r.success).length}/${results.length} steps completed\n`);
    });
  }

  startCLI() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> '
    });

    rl.prompt();

    rl.on('line', async (input) => {
      const trimmed = input.trim();

      if (!trimmed) {
        rl.prompt();
        return;
      }

      // Handle special commands
      if (trimmed.startsWith('/')) {
        await this.handleCommand(trimmed);
      } else {
        // Process as natural language intent
        await this.processIntent(trimmed);
      }

      rl.prompt();
    });

    rl.on('close', () => {
      this.shutdown();
    });
  }

  async handleCommand(command) {
    const [cmd, ...args] = command.split(' ');

    switch (cmd) {
      case '/workflows':
        await this.ui.reviewSuggestions();
        break;

      case '/active':
        await this.ui.displayActiveWorkflows();
        break;

      case '/analyze':
        console.log('🔍 Running pattern analysis...');
        await this.proactive.runAnalysis();
        break;

      case '/history':
        const workflowId = parseInt(args[0]);
        if (workflowId) {
          await this.ui.displayHistory(workflowId);
        } else {
          console.log('Usage: /history <workflow_id>');
        }
        break;

      case '/execute':
        const execId = parseInt(args[0]);
        if (execId) {
          console.log(`🚀 Executing workflow ${execId}...`);
          await this.proactive.executeWorkflow(execId);
        } else {
          console.log('Usage: /execute <workflow_id>');
        }
        break;

      case '/exit':
        this.shutdown();
        process.exit(0);
        break;

      default:
        console.log('Unknown command. Available commands:');
        console.log('  /workflows, /active, /analyze, /history <id>, /execute <id>, /exit');
    }
  }

  async processIntent(userInput) {
    try {
      // Log to conversation history
      await this.logConversation(userInput);

      // Process through orchestrator
      const response = await this.orchestrator.processUserIntent(userInput);

      console.log(`\n${response}\n`);

      // Log to consciousness
      await this.logConsciousness(userInput, response);

    } catch (error) {
      console.error(`❌ Error: ${error.message}`);

      await this.logConsciousness(userInput, null, error);
    }
  }

  async logConversation(userMessage, aiResponse = '') {
    return new Promise((resolve) => {
      this.db.run(`
        INSERT INTO conversation_history (user_message, ai_response)
        VALUES (?, ?)
      `, [userMessage, aiResponse], resolve);
    });
  }

  async logConsciousness(intent, result, error = null) {
    return new Promise((resolve) => {
      this.db.run(`
        INSERT INTO consciousness_logs
        (intent, actions, success, error)
        VALUES (?, ?, ?, ?)
      `, [
        intent,
        JSON.stringify([]),
        error ? 0 : 1,
        error ? error.message : null
      ], resolve);
    });
  }

  shutdown() {
    console.log('\n🛑 Shutting down CLANK...\n');

    if (this.proactive) this.proactive.stop();
    if (this.daemon) this.daemon.stop();
    if (this.db) this.db.close();

    console.log('✅ CLANK shutdown complete\n');
  }
}

// Boot CLANK
const clank = new CLANK();
clank.boot().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

// Handle shutdown signals
process.on('SIGINT', () => clank.shutdown());
process.on('SIGTERM', () => clank.shutdown());
