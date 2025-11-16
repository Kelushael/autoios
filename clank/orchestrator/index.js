/**
 * CLANK Orchestrator
 * Coordinates between LLM, Daemon, and Proactive Agent
 */

class Orchestrator {
  constructor(daemon, llm, db) {
    this.daemon = daemon;
    this.llm = llm;
    this.db = db;
  }

  async processUserIntent(userInput) {
    // Get LLM interpretation
    const interpretation = await this.llm.process(userInput);

    // Parse intent and execute
    const result = await this.executeIntent(userInput);

    return result;
  }

  async executeIntent(intent, context = {}) {
    const lower = intent.toLowerCase();

    // Git operations
    if (lower.includes('clone') && lower.includes('repo')) {
      const urlMatch = intent.match(/https?:\/\/[^\s]+/);
      const url = urlMatch ? urlMatch[0] : null;

      if (!url) {
        throw new Error('No repository URL found');
      }

      const destination = './cloned-repo';
      const result = await this.daemon.execute('git', 'clone', { url, destination });

      return `✅ Repository cloned to ${destination}`;
    }

    // Install dependencies
    if (lower.includes('install') && (lower.includes('dependencies') || lower.includes('deps'))) {
      const result = await this.daemon.execute('process', 'run', {
        command: 'npm',
        args: ['install']
      });

      return '✅ Dependencies installed';
    }

    // Run/start server
    if ((lower.includes('run') || lower.includes('start')) && lower.includes('dev')) {
      const result = await this.daemon.execute('process', 'run', {
        command: 'npm',
        args: ['run', 'dev']
      });

      return '✅ Development server started';
    }

    // List files
    if (lower.includes('list') && lower.includes('file')) {
      const files = await this.daemon.execute('filesystem', 'list', { path: '.' });
      return `Files:\n${files.join('\n')}`;
    }

    // Git status
    if (lower.includes('git') && lower.includes('status')) {
      const result = await this.daemon.execute('git', 'status', { cwd: '.' });
      return result.status;
    }

    // Fallback
    return `I understand: "${intent}". Implementation in progress...`;
  }
}

module.exports = Orchestrator;
