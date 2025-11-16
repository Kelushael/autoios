/**
 * Git Tool - Repository operations
 */

export default class GitTool {
  constructor(daemon) {
    this.daemon = daemon;
  }

  async clone(repoUrl, targetDir, options = {}) {
    this.daemon.logConsciousness('git:clone', { repoUrl, targetDir });

    const args = ['clone', repoUrl];
    if (targetDir) args.push(targetDir);
    if (options.branch) args.push('-b', options.branch);
    if (options.depth) args.push('--depth', options.depth);

    return await this.daemon.executeCommand(`git ${args.join(' ')}`);
  }

  async pull(repoPath = '.') {
    this.daemon.logConsciousness('git:pull', { repoPath });
    return await this.daemon.executeCommand('git pull', { cwd: repoPath });
  }

  async push(repoPath = '.', branch = null) {
    this.daemon.logConsciousness('git:push', { repoPath, branch });

    const cmd = branch ? `git push origin ${branch}` : 'git push';
    return await this.daemon.executeCommand(cmd, { cwd: repoPath });
  }

  async commit(message, repoPath = '.') {
    this.daemon.logConsciousness('git:commit', { repoPath, message });

    await this.daemon.executeCommand('git add .', { cwd: repoPath });
    return await this.daemon.executeCommand(`git commit -m "${message}"`, { cwd: repoPath });
  }

  async status(repoPath = '.') {
    this.daemon.logConsciousness('git:status', { repoPath });
    return await this.daemon.executeCommand('git status', { cwd: repoPath });
  }

  async branch(repoPath = '.') {
    this.daemon.logConsciousness('git:branch', { repoPath });
    return await this.daemon.executeCommand('git branch', { cwd: repoPath });
  }

  async checkout(branch, repoPath = '.', create = false) {
    this.daemon.logConsciousness('git:checkout', { repoPath, branch, create });

    const cmd = create ? `git checkout -b ${branch}` : `git checkout ${branch}`;
    return await this.daemon.executeCommand(cmd, { cwd: repoPath });
  }
}
