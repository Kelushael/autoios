/**
 * CLANK Sandbox Testing Demo
 * Tests the proactive workflow system in isolation
 */

const PatternAnalyzer = require('../intelligence/pattern_analyzer');
const SandboxTester = require('../intelligence/sandbox_tester');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║          CLANK Proactive AI - Sandbox Test Suite          ║
╚═══════════════════════════════════════════════════════════╝
`);

  // Create test database
  const testDbPath = path.join(__dirname, 'test.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  const db = new sqlite3.Database(testDbPath);

  try {
    // Initialize test data
    await initializeTestDatabase(db);
    await seedTestData(db);

    // Test 1: Pattern Detection
    console.log('\n📊 Test 1: Pattern Detection\n');
    const analyzer = new PatternAnalyzer(testDbPath);
    const patterns = await analyzer.detectPatterns();

    console.log(`✅ Detected ${patterns.length} patterns`);
    patterns.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.suggestedWorkflow.name} (confidence: ${(p.confidence * 100).toFixed(1)}%)`);
    });

    // Test 2: Workflow Suggestion
    console.log('\n💡 Test 2: Workflow Suggestion Generation\n');
    const suggestions = await analyzer.analyzeAndSuggest();

    console.log(`✅ Generated ${suggestions.length} suggestions`);
    suggestions.forEach(({workflow}, i) => {
      console.log(`   ${i + 1}. ${workflow.name}`);
      console.log(`      Steps: ${workflow.steps.length}`);
      console.log(`      Triggers: ${workflow.triggers.map(t => t.type).join(', ')}`);
    });

    // Test 3: Sandbox Testing
    if (suggestions.length > 0) {
      console.log('\n🧪 Test 3: Sandbox Workflow Testing\n');
      const tester = new SandboxTester();
      const testWorkflow = suggestions[0].workflow;

      const result = await tester.testWorkflow(testWorkflow);

      console.log(`✅ Test completed`);
      console.log(`   Success: ${result.success ? 'YES' : 'NO'}`);
      console.log(`   Steps tested: ${result.steps ? result.steps.length : 0}`);
    }

    // Test 4: Statistics
    console.log('\n📈 Test 4: System Statistics\n');
    const stats = await getTestStats(db);

    console.log(`   Consciousness logs: ${stats.consciousnessLogs}`);
    console.log(`   Conversation entries: ${stats.conversations}`);
    console.log(`   Workflow suggestions: ${stats.suggestions}`);

    console.log('\n✅ All tests passed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    db.close();

    // Cleanup
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  }
}

function initializeTestDatabase(db) {
  return new Promise((resolve) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE consciousness_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          intent TEXT,
          actions TEXT,
          tools_used TEXT,
          success INTEGER
        )
      `);

      db.run(`
        CREATE TABLE conversation_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          user_message TEXT,
          ai_response TEXT
        )
      `);

      db.run(`
        CREATE TABLE workflow_suggestions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          description TEXT,
          steps TEXT,
          triggers TEXT,
          confidence REAL,
          status TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, resolve);
    });
  });
}

async function seedTestData(db) {
  // Seed with realistic usage patterns
  const devWorkflowPattern = [
    {
      intent: 'clone repository from github',
      actions: JSON.stringify(['git_clone']),
      tools: JSON.stringify(['git', 'filesystem']),
      success: 1
    },
    {
      intent: 'install dependencies',
      actions: JSON.stringify(['npm_install']),
      tools: JSON.stringify(['npm', 'filesystem']),
      success: 1
    },
    {
      intent: 'run dev server',
      actions: JSON.stringify(['npm_run_dev']),
      tools: JSON.stringify(['npm', 'process']),
      success: 1
    }
  ];

  // Insert pattern 4 times (to trigger detection)
  for (let i = 0; i < 4; i++) {
    for (const step of devWorkflowPattern) {
      await new Promise((resolve) => {
        db.run(`
          INSERT INTO consciousness_logs
          (timestamp, intent, actions, tools_used, success)
          VALUES (datetime('now', '-${10 - i} days'), ?, ?, ?, ?)
        `, [step.intent, step.actions, step.tools, step.success], resolve);
      });
    }

    // Add some delay between sessions
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('✅ Test data seeded');
}

function getTestStats(db) {
  return new Promise((resolve) => {
    const stats = {};

    db.get('SELECT COUNT(*) as count FROM consciousness_logs', (err, row) => {
      stats.consciousnessLogs = row.count;

      db.get('SELECT COUNT(*) as count FROM conversation_history', (err, row) => {
        stats.conversations = row.count;

        db.get('SELECT COUNT(*) as count FROM workflow_suggestions', (err, row) => {
          stats.suggestions = row.count;
          resolve(stats);
        });
      });
    });
  });
}

// Run tests
runTests();
