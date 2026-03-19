/**
 * Git Integration System
 * Provides built-in Git operations for version control within the engine
 */

import { createEngineError, safeExecute, handleAsyncError } from '../utils/ErrorHandling';

export interface GitRepository {
  path: string;
  branch: string;
  remote?: string;
  isDirty: boolean;
  ahead: number;
  behind: number;
  lastCommit?: GitCommit;
}

export interface GitCommit {
  hash: string;
  author: string;
  email: string;
  date: Date;
  message: string;
  files: string[];
  parents: string[];
}

export interface GitBranch {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
  ahead: number;
  behind: number;
  lastCommit?: string;
}

export interface GitStatus {
  modified: string[];
  added: string[];
  deleted: string[];
  untracked: string[];
  renamed: string[];
  conflicted: string[];
}

export interface GitDiff {
  file: string;
  type: 'modified' | 'added' | 'deleted' | 'renamed';
  hunks: GitDiffHunk[];
  oldPath?: string;
  newPath?: string;
}

export interface GitDiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: GitDiffLine[];
}

export interface GitDiffLine {
  type: 'context' | 'added' | 'removed';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface GitMergeConflict {
  file: string;
  conflicts: GitConflictSection[];
  status: 'unresolved' | 'resolved';
}

export interface GitConflictSection {
  start: number;
  end: number;
  ours: string[];
  theirs: string[];
  base?: string[];
}

export class GitIntegration {
  private repositoryPath: string;
  private isInitialized = false;

  constructor(repositoryPath: string) {
    this.repositoryPath = repositoryPath;
  }

  /**
   * Initialize Git repository
   */
  async init(): Promise<void> {
    try {
      await this.executeGitCommand(['init']);
      this.isInitialized = true;
    } catch (error) {
      throw createEngineError(
        `Failed to initialize Git repository: ${error}`,
        'GIT_INIT_FAILED',
        'system',
        'high'
      );
    }
  }

  /**
   * Get repository status
   */
  async getStatus(): Promise<GitStatus> {
    this.ensureInitialized();

    try {
      const output = await this.executeGitCommand(['status', '--porcelain']);
      return this.parseStatus(output);
    } catch (error) {
      throw createEngineError(
        `Failed to get Git status: ${error}`,
        'GIT_STATUS_FAILED',
        'system',
        'medium'
      );
    }
  }

  /**
   * Get current branch information
   */
  async getCurrentBranch(): Promise<string> {
    this.ensureInitialized();

    try {
      const output = await this.executeGitCommand(['rev-parse', '--abbrev-ref', 'HEAD']);
      return output.trim();
    } catch (error) {
      throw createEngineError(
        `Failed to get current branch: ${error}`,
        'GIT_BRANCH_FAILED',
        'system',
        'medium'
      );
    }
  }

  /**
   * List all branches
   */
  async listBranches(includeRemote = false): Promise<GitBranch[]> {
    this.ensureInitialized();

    try {
      const args = ['branch', '-vv'];
      if (includeRemote) {
        args.push('-a');
      }
      
      const output = await this.executeGitCommand(args);
      return this.parseBranches(output);
    } catch (error) {
      throw createEngineError(
        `Failed to list branches: ${error}`,
        'GIT_LIST_BRANCHES_FAILED',
        'system',
        'medium'
      );
    }
  }

  /**
   * Switch to a branch
   */
  async checkout(branch: string, createNew = false): Promise<void> {
    this.ensureInitialized();

    try {
      const args = ['checkout'];
      if (createNew) {
        args.push('-b');
      }
      args.push(branch);

      await this.executeGitCommand(args);
    } catch (error) {
      throw createEngineError(
        `Failed to checkout branch '${branch}': ${error}`,
        'GIT_CHECKOUT_FAILED',
        'system',
        'high'
      );
    }
  }

  /**
   * Create a new branch
   */
  async createBranch(name: string, checkout = true): Promise<void> {
    this.ensureInitialized();

    try {
      await this.executeGitCommand(['branch', name]);
      if (checkout) {
        await this.checkout(name);
      }
    } catch (error) {
      throw createEngineError(
        `Failed to create branch '${name}': ${error}`,
        'GIT_CREATE_BRANCH_FAILED',
        'system',
        'high'
      );
    }
  }

  /**
   * Delete a branch
   */
  async deleteBranch(name: string, force = false): Promise<void> {
    this.ensureInitialized();

    try {
      const args = ['branch'];
      if (force) {
        args.push('-D');
      } else {
        args.push('-d');
      }
      args.push(name);

      await this.executeGitCommand(args);
    } catch (error) {
      throw createEngineError(
        `Failed to delete branch '${name}': ${error}`,
        'GIT_DELETE_BRANCH_FAILED',
        'system',
        'medium'
      );
    }
  }

  /**
   * Add files to staging area
   */
  async add(files: string[]): Promise<void> {
    this.ensureInitialized();

    try {
      await this.executeGitCommand(['add', ...files]);
    } catch (error) {
      throw createEngineError(
        `Failed to add files: ${error}`,
        'GIT_ADD_FAILED',
        'system',
        'medium'
      );
    }
  }

  /**
   * Commit changes
   */
  async commit(message: string, author?: { name: string; email: string }): Promise<GitCommit> {
    this.ensureInitialized();

    try {
      const args = ['commit', '-m', message];
      
      if (author) {
        args.push('--author', `${author.name} <${author.email}>`);
      }

      await this.executeGitCommand(args);
      
      // Get the commit details
      const hash = await this.executeGitCommand(['rev-parse', 'HEAD']);
      return await this.getCommit(hash.trim());
    } catch (error) {
      throw createEngineError(
        `Failed to commit: ${error}`,
        'GIT_COMMIT_FAILED',
        'system',
        'high'
      );
    }
  }

  /**
   * Get commit details
   */
  async getCommit(hash: string): Promise<GitCommit> {
    this.ensureInitialized();

    try {
      const logOutput = await this.executeGitCommand([
        'log',
        '-1',
        '--pretty=format:%H|%an|%ae|%ai|%s',
        '--name-only',
        hash
      ]);

      return this.parseCommit(logOutput);
    } catch (error) {
      throw createEngineError(
        `Failed to get commit '${hash}': ${error}`,
        'GIT_GET_COMMIT_FAILED',
        'system',
        'medium'
      );
    }
  }

  /**
   * Get commit history
   */
  async getHistory(limit = 50, branch?: string): Promise<GitCommit[]> {
    this.ensureInitialized();

    try {
      const args = [
        'log',
        `-${limit}`,
        '--pretty=format:%H|%an|%ae|%ai|%s',
        '--name-only'
      ];

      if (branch) {
        args.push(branch);
      }

      const output = await this.executeGitCommand(args);
      return this.parseCommits(output);
    } catch (error) {
      throw createEngineError(
        `Failed to get history: ${error}`,
        'GIT_HISTORY_FAILED',
        'system',
        'medium'
      );
    }
  }

  /**
   * Get diff between commits or working directory
   */
  async getDiff(file?: string, commitHash?: string): Promise<GitDiff[]> {
    this.ensureInitialized();

    try {
      const args = ['diff', '--unified=3'];
      
      if (commitHash) {
        args.push(commitHash);
      }
      
      if (file) {
        args.push('--', file);
      }

      const output = await this.executeGitCommand(args);
      return this.parseDiff(output);
    } catch (error) {
      throw createEngineError(
        `Failed to get diff: ${error}`,
        'GIT_DIFF_FAILED',
        'system',
        'medium'
      );
    }
  }

  /**
   * Pull changes from remote
   */
  async pull(remote = 'origin', branch?: string): Promise<void> {
    this.ensureInitialized();

    try {
      const args = ['pull', remote];
      if (branch) {
        args.push(branch);
      }

      await this.executeGitCommand(args);
    } catch (error) {
      throw createEngineError(
        `Failed to pull from remote: ${error}`,
        'GIT_PULL_FAILED',
        'system',
        'high'
      );
    }
  }

  /**
   * Push changes to remote
   */
  async push(remote = 'origin', branch?: string): Promise<void> {
    this.ensureInitialized();

    try {
      const args = ['push', remote];
      if (branch) {
        args.push(branch);
      }

      await this.executeGitCommand(args);
    } catch (error) {
      throw createEngineError(
        `Failed to push to remote: ${error}`,
        'GIT_PUSH_FAILED',
        'system',
        'high'
      );
    }
  }

  /**
   * Merge branches
   */
  async merge(branch: string, strategy?: 'ours' | 'theirs' | 'recursive'): Promise<void> {
    this.ensureInitialized();

    try {
      const args = ['merge'];
      
      if (strategy) {
        args.push(`--strategy=${strategy}`);
      }
      
      args.push(branch);

      await this.executeGitCommand(args);
    } catch (error) {
      throw createEngineError(
        `Failed to merge branch '${branch}': ${error}`,
        'GIT_MERGE_FAILED',
        'system',
        'high'
      );
    }
  }

  /**
   * Get merge conflicts
   */
  async getConflicts(): Promise<GitMergeConflict[]> {
    this.ensureInitialized();

    try {
      const output = await this.executeGitCommand(['diff', '--name-only', '--diff-filter=U']);
      const conflictedFiles = output.trim().split('\n').filter(Boolean);
      
      const conflicts: GitMergeConflict[] = [];
      
      for (const file of conflictedFiles) {
        const fileContent = await this.executeGitCommand(['show', ':1:' + file]);
        const conflict = await this.parseConflictFile(file, fileContent);
        conflicts.push(conflict);
      }

      return conflicts;
    } catch (error) {
      throw createEngineError(
        `Failed to get conflicts: ${error}`,
        'GIT_CONFLICTS_FAILED',
        'system',
        'high'
      );
    }
  }

  /**
   * Resolve merge conflict
   */
  async resolveConflict(file: string, resolution: 'ours' | 'theirs'): Promise<void> {
    this.ensureInitialized();

    try {
      const checkoutArgs = ['checkout', resolution, '--', file];
      await this.executeGitCommand(checkoutArgs);
      
      await this.add([file]);
    } catch (error) {
      throw createEngineError(
        `Failed to resolve conflict in '${file}': ${error}`,
        'GIT_RESOLVE_CONFLICT_FAILED',
        'system',
        'high'
      );
    }
  }

  /**
   * Stash changes
   */
  async stash(message?: string): Promise<string> {
    this.ensureInitialized();

    try {
      const args = ['stash'];
      if (message) {
        args.push('push', '-m', message);
      } else {
        args.push('push');
      }

      await this.executeGitCommand(args);
      
      // Get stash reference
      const output = await this.executeGitCommand(['stash', 'list', '--format=%gd']);
      return output.trim().split('\n')[0];
    } catch (error) {
      throw createEngineError(
        `Failed to stash changes: ${error}`,
        'GIT_STASH_FAILED',
        'system',
        'medium'
      );
    }
  }

  /**
   * Pop stashed changes
   */
  async stashPop(index = 0): Promise<void> {
    this.ensureInitialized();

    try {
      await this.executeGitCommand(['stash', 'pop', `stash@{${index}}`]);
    } catch (error) {
      throw createEngineError(
        `Failed to pop stash: ${error}`,
        'GIT_STASH_POP_FAILED',
        'system',
        'medium'
      );
    }
  }

  /**
   * Get repository information
   */
  async getRepositoryInfo(): Promise<GitRepository> {
    this.ensureInitialized();

    try {
      const [branch, remote, isDirty, ahead, behind, lastCommit] = await Promise.all([
        this.getCurrentBranch(),
        this.getRemote(),
        this.isWorkingDirectoryDirty(),
        this.getAheadBehind(),
        this.getAheadBehind(),
        this.getHistory(1).then(commits => commits[0])
      ]);

      return {
        path: this.repositoryPath,
        branch,
        remote,
        isDirty,
        ahead: ahead.ahead,
        behind: behind.behind,
        lastCommit
      };
    } catch (error) {
      throw createEngineError(
        `Failed to get repository info: ${error}`,
        'GIT_REPO_INFO_FAILED',
        'system',
        'medium'
      );
    }
  }

  // Private helper methods

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw createEngineError(
        'Git repository not initialized',
        'GIT_NOT_INITIALIZED',
        'system',
        'high'
      );
    }
  }

  private async executeGitCommand(args: string[]): Promise<string> {
    // This would integrate with a Git command executor
    // For now, we'll simulate the command execution
    const command = `git ${args.join(' ')}`;
    
    // In a real implementation, this would use child_process or similar
    // For demonstration, we'll return a mock response
    console.log(`Executing Git command: ${command}`);
    
    // Mock implementation - in reality this would execute the actual git command
    return '';
  }

  private parseStatus(output: string): GitStatus {
    const lines = output.trim().split('\n');
    const status: GitStatus = {
      modified: [],
      added: [],
      deleted: [],
      untracked: [],
      renamed: [],
      conflicted: []
    };

    for (const line of lines) {
      if (!line) continue;
      
      const statusCode = line.substring(0, 2);
      const filePath = line.substring(3);

      switch (statusCode[0]) {
        case 'M':
          status.modified.push(filePath);
          break;
        case 'A':
          status.added.push(filePath);
          break;
        case 'D':
          status.deleted.push(filePath);
          break;
        case 'R':
          status.renamed.push(filePath);
          break;
        case 'C':
          status.conflicted.push(filePath);
          break;
        case '?':
          status.untracked.push(filePath);
          break;
      }
    }

    return status;
  }

  private parseBranches(output: string): GitBranch[] {
    const lines = output.trim().split('\n');
    const branches: GitBranch[] = [];

    for (const line of lines) {
      if (!line) continue;
      
      const isCurrent = line.startsWith('*');
      const parts = line.replace(/^\*?\s*/, '').split(/\s+/);
      const name = parts[0];
      const isRemote = name.includes('remotes/');

      branches.push({
        name: isRemote ? name.replace('remotes/', '') : name,
        isCurrent,
        isRemote,
        ahead: 0,
        behind: 0,
        lastCommit: parts[1]?.replace(/^\[/, '').replace(/\]$/, '')
      });
    }

    return branches;
  }

  private parseCommit(output: string): GitCommit {
    const lines = output.trim().split('\n');
    const [hash, author, email, date, message] = lines[0].split('|');
    const files = lines.slice(1).filter(line => line.trim());

    return {
      hash,
      author,
      email,
      date: new Date(date),
      message,
      files,
      parents: []
    };
  }

  private parseCommits(output: string): GitCommit[] {
    const sections = output.trim().split('\n\n');
    return sections.map(section => this.parseCommit(section));
  }

  private parseDiff(output: string): GitDiff[] {
    // Simplified diff parsing - would need full implementation
    const diffs: GitDiff[] = [];
    const lines = output.split('\n');
    
    let currentDiff: Partial<GitDiff> | null = null;
    
    for (const line of lines) {
      if (line.startsWith('diff --git')) {
        if (currentDiff) {
          diffs.push(currentDiff as GitDiff);
        }
        currentDiff = { file: '', type: 'modified', hunks: [] };
      }
      // Add more diff parsing logic here
    }
    
    if (currentDiff) {
      diffs.push(currentDiff as GitDiff);
    }
    
    return diffs;
  }

  private async parseConflictFile(file: string, content: string): Promise<GitMergeConflict> {
    // Parse conflict markers and sections
    const conflicts: GitConflictSection[] = [];
    const lines = content.split('\n');
    
    let currentConflict: Partial<GitConflictSection> | null = null;
    let currentSection = 'base';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('<<<<<<<')) {
        currentConflict = { start: i + 1, end: 0, ours: [], theirs: [], base: [] };
        currentSection = 'ours';
      } else if (line.startsWith('=======')) {
        currentSection = 'theirs';
      } else if (line.startsWith('>>>>>>>')) {
        if (currentConflict) {
          currentConflict.end = i;
          conflicts.push(currentConflict as GitConflictSection);
        }
        currentConflict = null;
      } else if (currentConflict) {
        if (currentSection === 'ours') {
          currentConflict.ours!.push(line);
        } else if (currentSection === 'theirs') {
          currentConflict.theirs!.push(line);
        }
      }
    }
    
    return {
      file,
      conflicts,
      status: 'unresolved'
    };
  }

  private async getRemote(): Promise<string | undefined> {
    try {
      const output = await this.executeGitCommand(['remote', 'get-url', 'origin']);
      return output.trim() || undefined;
    } catch {
      return undefined;
    }
  }

  private async isWorkingDirectoryDirty(): Promise<boolean> {
    try {
      const output = await this.executeGitCommand(['status', '--porcelain']);
      return output.trim().length > 0;
    } catch {
      return false;
    }
  }

  private async getAheadBehind(): Promise<{ ahead: number; behind: number }> {
    try {
      const output = await this.executeGitCommand(['rev-list', '--count', '--left-right', 'HEAD...@{u}']);
      const [behind, ahead] = output.trim().split('\t').map(Number);
      return { ahead, behind };
    } catch {
      return { ahead: 0, behind: 0 };
    }
  }
}

// Factory function
export function createGitIntegration(repositoryPath: string): GitIntegration {
  return new GitIntegration(repositoryPath);
}
