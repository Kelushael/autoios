#!/usr/bin/env node
/**
 * CLANK - Main Entry Point
 * Boot sequence for the consciousness bridging layer
 */

import daemon from './daemon/index.js';
import logger from './consciousness/logger.js';
import watcher from './consciousness/watcher.js';
import patternDetector from './pattern-ai/detector.js';
import workflowManager from './workflows/manager.js';
import cli from './cli/index.js';
import chalk from 'chalk';

class CLANK {
  constructor() {
    this.initialized = false;
  }

  async boot() {
    console.clear();

    console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════╗
║  CLANK BOOT SEQUENCE                                      ║
╚═══════════════════════════════════════════════════════════╝
    `));

    try {
      // 1. Initialize daemon (god-mode access)
      console.log(chalk.white('🔥 Initializing daemon with god-mode access...'));
      await daemon.init();

      // 2. Initialize consciousness logger
      console.log(chalk.white('🧠 Initializing consciousness logger...'));
      logger.init();

      // 3. Start watching file system
      console.log(chalk.white('👁️  Starting consciousness watcher...'));
      watcher.watchDirectory(process.cwd());

      // 4. Initialize pattern AI
      console.log(chalk.white('🤖 Initializing pattern detection AI...'));
      patternDetector.init();

      // 5. Initialize workflow manager
      console.log(chalk.white('⚡ Initializing workflow manager...'));
      workflowManager.init();

      // 6. Start pattern detection
      console.log(chalk.white('🔍 Starting continuous pattern detection...'));
      patternDetector.startDetection(60000); // Every 60 seconds

      console.log(chalk.green('\n✅ CLANK is fully conscious and operational!\n'));

      this.initialized = true;

      // 7. Launch CLI
      await cli.init();

    } catch (error) {
      console.error(chalk.red('\n❌ Boot failed:'), error);
      process.exit(1);
    }
  }

  async shutdown() {
    console.log(chalk.yellow('\n🛑 Shutting down CLANK...\n'));

    watcher.stopAll();
    patternDetector.close();
    workflowManager.close();
    logger.close();

    console.log(chalk.green('👋 CLANK shutdown complete\n'));
    process.exit(0);
  }
}

// Create and boot CLANK
const clank = new CLANK();

// Handle graceful shutdown
process.on('SIGINT', () => clank.shutdown());
process.on('SIGTERM', () => clank.shutdown());

// Boot
clank.boot().catch(console.error);

export default clank;
