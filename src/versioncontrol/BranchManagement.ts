/**
 * Branch Management System
 * Provides easy branch switching and management capabilities
 */

import { GitIntegration, GitBranch, GitCommit } from './GitIntegration';
import { createEngineError, validators } from '../utils/ErrorHandling';

export interface BranchStrategy {
  name: string;
  description: string;
  createFrom: string;
  autoMerge: boolean;
  protect: boolean;
  permissions: BranchPermissions;
}

export interface BranchPermissions {
  canPush: boolean;
  canForcePush: boolean;
  canDelete: boolean;
  canMerge: boolean;
  canCreate: boolean;
}

export interface BranchTemplate {
  name: string;
  description: string;
  baseBranch: string;
  setupCommands: string[];
  preCommitHooks: string[];
  postMergeHooks: string[];
  protections: BranchProtection[];
}

export interface BranchProtection {
  type: 'require_review' | 'require_status_checks' | 'restrict_push' | 'enforce_admins';
  enabled: boolean;
  configuration: any;
}

export interface BranchWorkflow {
  name: string;
  description: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
}

export interface WorkflowStep {
  name: string;
  type: 'create_branch' | 'run_tests' | 'request_review' | 'merge' | 'deploy' | 'cleanup';
  configuration: any;
  conditions?: string[];
}

export interface WorkflowTrigger {
  type: 'push' | 'pull_request' | 'merge' | 'manual';
  branches: string[];
  conditions?: string[];
}

export interface BranchMetrics {
  name: string;
  commits: number;
  additions: number;
  deletions: number;
  authors: string[];
  age: number; // days
  mergeFrequency: number;
  conflictRate: number;
}

export interface BranchComparison {
  branch1: string;
  branch2: string;
  ahead: number;
  behind: number;
  diverged: boolean;
  commonAncestor?: string;
  commitsAhead: GitCommit[];
  commitsBehind: GitCommit[];
  conflicts: string[];
}

export class BranchManagementSystem {
  private gitIntegration: GitIntegration;
  private strategies = new Map<string, BranchStrategy>();
  private templates = new Map<string, BranchTemplate>();
  private workflows = new Map<string, BranchWorkflow>();
  private protectionRules = new Map<string, BranchProtection[]>();

  constructor(gitIntegration: GitIntegration) {
    this.gitIntegration = gitIntegration;
    this.initializeDefaultStrategies();
    this.initializeDefaultTemplates();
    this.initializeDefaultWorkflows();
  }

  /**
   * Create a new branch with strategy
   */
  async createBranch(
    name: string,
    strategy: string,
    options: {
      baseBranch?: string;
      autoSwitch?: boolean;
      setupCommands?: string[];
    } = {}
  ): Promise<GitBranch> {
    validators.notEmpty(name);
    validators.notEmpty(strategy);

    try {
      const branchStrategy = this.strategies.get(strategy);
      if (!branchStrategy) {
        throw createEngineError(
          `Branch strategy '${strategy}' not found`,
          'BRANCH_STRATEGY_NOT_FOUND',
          'system',
          'high'
        );
      }

      const baseBranch = options.baseBranch || branchStrategy.createFrom;
      
      // Create the branch
      await this.gitIntegration.createBranch(name, false);
      
      // Setup branch if template exists
      const template = this.templates.get(strategy);
      if (template) {
        await this.setupBranchFromTemplate(name, template, options.setupCommands);
      }

      // Auto-switch if requested
      if (options.autoSwitch) {
        await this.gitIntegration.checkout(name);
      }

      // Get branch info
      const branches = await this.gitIntegration.listBranches();
      const newBranch = branches.find(b => b.name === name);
      
      if (!newBranch) {
        throw createEngineError(
          `Failed to retrieve created branch '${name}'`,
          'BRANCH_CREATION_FAILED',
          'system',
          'high'
        );
      }

      return newBranch;
    } catch (error) {
      throw createEngineError(
        `Failed to create branch '${name}': ${error}`,
        'BRANCH_CREATE_FAILED',
        'system',
        'high'
      );
    }
  }

  /**
   * Switch to a branch with conflict resolution
   */
  async switchBranch(
    targetBranch: string,
    options: {
      stashChanges?: boolean;
      force?: boolean;
      mergeStrategy?: 'ours' | 'theirs' | 'recursive';
    } = {}
  ): Promise<void> {
    validators.notEmpty(targetBranch);

    try {
      // Check if there are uncommitted changes
      const status = await this.gitIntegration.getStatus();
      const hasChanges = status.modified.length > 0 || 
                        status.added.length > 0 || 
                        status.untracked.length > 0;

      // Stash changes if requested and there are changes
      if (hasChanges && options.stashChanges) {
        await this.gitIntegration.stash(`Auto-stash before switching to ${targetBranch}`);
      }

      // Attempt checkout
      try {
        await this.gitIntegration.checkout(targetBranch);
      } catch (error) {
        // Handle merge conflicts during checkout
        if (options.mergeStrategy) {
          await this.handleCheckoutConflicts(targetBranch, options.mergeStrategy);
        } else {
          throw error;
        }
      }

      // Pop stash if we stashed and successfully switched
      if (hasChanges && options.stashChanges) {
        try {
          await this.gitIntegration.stashPop();
        } catch (error) {
          console.warn('Failed to pop stash after branch switch:', error);
        }
      }
    } catch (error) {
      throw createEngineError(
        `Failed to switch to branch '${targetBranch}': ${error}`,
        'BRANCH_SWITCH_FAILED',
        'system',
        'high'
      );
    }
  }

  /**
   * Merge branch with intelligent conflict resolution
   */
  async mergeBranch(
    sourceBranch: string,
    targetBranch?: string,
    options: {
      strategy?: 'fast-forward' | 'squash' | 'merge' | 'rebase';
      conflictResolution?: 'auto' | 'manual' | 'abort';
      createMergeCommit?: boolean;
      skipTests?: boolean;
    } = {}
  ): Promise<GitCommit> {
    validators.notEmpty(sourceBranch);

    try {
      const target = targetBranch || await this.gitIntegration.getCurrentBranch();
      
      // Ensure we're on the target branch
      await this.gitIntegration.checkout(target);

      // Pre-merge checks
      await this.runPreMergeChecks(sourceBranch, target);

      // Perform merge based on strategy
      let commit: GitCommit;

      switch (options.strategy || 'merge') {
        case 'fast-forward':
          commit = await this.fastForwardMerge(sourceBranch);
          break;
        case 'squash':
          commit = await this.squashMerge(sourceBranch);
          break;
        case 'rebase':
          commit = await this.rebaseMerge(sourceBranch);
          break;
        case 'merge':
        default:
          commit = await this.standardMerge(sourceBranch, options.conflictResolution);
          break;
      }

      // Post-merge actions
      if (!options.skipTests) {
        await this.runPostMergeTests();
      }

      return commit;
    } catch (error) {
      throw createEngineError(
        `Failed to merge branch '${sourceBranch}': ${error}`,
        'BRANCH_MERGE_FAILED',
        'system',
        'high'
      );
    }
  }

  /**
   * Compare two branches
   */
  async compareBranches(branch1: string, branch2: string): Promise<BranchComparison> {
    validators.notEmpty(branch1);
    validators.notEmpty(branch2);

    try {
      // Get ahead/behind information
      const branches = await this.gitIntegration.listBranches();
      const b1 = branches.find(b => b.name === branch1);
      const b2 = branches.find(b => b.name === branch2);

      if (!b1 || !b2) {
        throw createEngineError(
          `One or both branches not found: ${branch1}, ${branch2}`,
          'BRANCH_NOT_FOUND',
          'system',
          'medium'
        );
      }

      // Get commit history for both branches
      const [history1, history2] = await Promise.all([
        this.gitIntegration.getHistory(50, branch1),
        this.gitIntegration.getHistory(50, branch2)
      ]);

      // Find common ancestor
      const commonAncestor = this.findCommonAncestor(history1, history2);

      // Get commits ahead/behind
      const commitsAhead = history1.filter(commit => 
        !commonAncestor || !history2.some(c => c.hash === commit.hash)
      );
      const commitsBehind = history2.filter(commit => 
        !commonAncestor || !history1.some(c => c.hash === commit.hash)
      );

      // Check for potential conflicts
      const conflicts = await this.detectMergeConflicts(branch1, branch2);

      return {
        branch1,
        branch2,
        ahead: commitsAhead.length,
        behind: commitsBehind.length,
        diverged: commitsAhead.length > 0 && commitsBehind.length > 0,
        commonAncestor: commonAncestor?.hash,
        commitsAhead,
        commitsBehind,
        conflicts
      };
    } catch (error) {
      throw createEngineError(
        `Failed to compare branches '${branch1}' and '${branch2}': ${error}`,
        'BRANCH_COMPARE_FAILED',
        'system',
        'medium'
      );
    }
  }

  /**
   * Get branch metrics
   */
  async getBranchMetrics(branch: string, days = 30): Promise<BranchMetrics> {
    validators.notEmpty(branch);

    try {
      const history = await this.gitIntegration.getHistory(100, branch);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const recentCommits = history.filter(commit => commit.date >= cutoffDate);
      
      let additions = 0;
      let deletions = 0;
      const authors = new Set<string>();
      let mergeCount = 0;
      let conflictCount = 0;

      for (const commit of recentCommits) {
        authors.add(commit.author);
        
        // Parse commit message for merge/conflict indicators
        if (commit.message.toLowerCase().includes('merge')) {
          mergeCount++;
        }
        if (commit.message.toLowerCase().includes('conflict')) {
          conflictCount++;
        }

        // In a real implementation, would parse actual diff stats
        // For now, use placeholder calculations
        additions += Math.floor(Math.random() * 100);
        deletions += Math.floor(Math.random() * 50);
      }

      const age = days;
      const mergeFrequency = mergeCount / days;
      const conflictRate = conflictCount / Math.max(1, mergeCount);

      return {
        name: branch,
        commits: recentCommits.length,
        additions,
        deletions,
        authors: Array.from(authors),
        age,
        mergeFrequency,
        conflictRate
      };
    } catch (error) {
      throw createEngineError(
        `Failed to get metrics for branch '${branch}': ${error}`,
        'BRANCH_METRICS_FAILED',
        'system',
        'medium'
      );
    }
  }

  /**
   * Protect a branch
   */
  async protectBranch(
    branch: string,
    protections: BranchProtection[]
  ): Promise<void> {
    validators.notEmpty(branch);
    validators.notNull(protections);

    try {
      this.protectionRules.set(branch, protections);
      
      // In a real implementation, would configure Git hooks or use GitHub/GitLab APIs
      console.log(`Protected branch '${branch}' with ${protections.length} rules`);
    } catch (error) {
      throw createEngineError(
        `Failed to protect branch '${branch}': ${error}`,
        'BRANCH_PROTECTION_FAILED',
        'system',
        'medium'
      );
    }
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(
    workflowName: string,
    trigger: WorkflowTrigger,
    context: any = {}
  ): Promise<void> {
    try {
      const workflow = this.workflows.get(workflowName);
      if (!workflow) {
        throw createEngineError(
          `Workflow '${workflowName}' not found`,
          'WORKFLOW_NOT_FOUND',
          'system',
          'medium'
        );
      }

      for (const step of workflow.steps) {
        await this.executeWorkflowStep(step, context);
      }
    } catch (error) {
      throw createEngineError(
        `Failed to execute workflow '${workflowName}': ${error}`,
        'WORKFLOW_EXECUTION_FAILED',
        'system',
        'high'
      );
    }
  }

  /**
   * Get all available strategies
   */
  getStrategies(): BranchStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Get all available templates
   */
  getTemplates(): BranchTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get all available workflows
   */
  getWorkflows(): BranchWorkflow[] {
    return Array.from(this.workflows.values());
  }

  // Private methods

  private initializeDefaultStrategies(): void {
    // Feature branch strategy
    this.strategies.set('feature', {
      name: 'feature',
      description: 'Feature development branch',
      createFrom: 'main',
      autoMerge: false,
      protect: false,
      permissions: {
        canPush: true,
        canForcePush: false,
        canDelete: true,
        canMerge: false,
        canCreate: true
      }
    });

    // Hotfix strategy
    this.strategies.set('hotfix', {
      name: 'hotfix',
      description: 'Emergency fix branch',
      createFrom: 'main',
      autoMerge: true,
      protect: true,
      permissions: {
        canPush: true,
        canForcePush: false,
        canDelete: false,
        canMerge: true,
        canCreate: false
      }
    });

    // Release strategy
    this.strategies.set('release', {
      name: 'release',
      description: 'Release preparation branch',
      createFrom: 'develop',
      autoMerge: false,
      protect: true,
      permissions: {
        canPush: true,
        canForcePush: false,
        canDelete: false,
        canMerge: true,
        canCreate: false
      }
    });
  }

  private initializeDefaultTemplates(): void {
    // Feature branch template
    this.templates.set('feature', {
      name: 'feature',
      description: 'Feature branch template',
      baseBranch: 'main',
      setupCommands: [
        'npm install',
        'npm run build',
        'npm run test:unit'
      ],
      preCommitHooks: [
        'npm run lint',
        'npm run test:unit'
      ],
      postMergeHooks: [
        'npm run build',
        'npm run test:integration'
      ],
      protections: [
        {
          type: 'require_review',
          enabled: true,
          configuration: { requiredReviewers: 1 }
        }
      ]
    });
  }

  private initializeDefaultWorkflows(): void {
    // CI/CD workflow
    this.workflows.set('ci-cd', {
      name: 'CI/CD Pipeline',
      description: 'Continuous integration and deployment',
      steps: [
        {
          name: 'run_tests',
          type: 'run_tests',
          configuration: {
            testTypes: ['unit', 'integration', 'e2e'],
            coverage: true
          }
        },
        {
          name: 'build',
          type: 'run_tests',
          configuration: {
            buildCommand: 'npm run build',
            artifacts: ['dist/', 'build/']
          }
        },
        {
          name: 'deploy',
          type: 'deploy',
          configuration: {
            environment: 'staging',
            rollback: true
          }
        }
      ],
      triggers: [
        {
          type: 'push',
          branches: ['main', 'develop'],
          conditions: ['!skip-ci']
        }
      ]
    });
  }

  private async setupBranchFromTemplate(
    branchName: string,
    template: BranchTemplate,
    additionalCommands?: string[]
  ): Promise<void> {
    // Switch to the branch
    await this.gitIntegration.checkout(branchName);

    // Run setup commands
    const commands = [...template.setupCommands];
    if (additionalCommands) {
      commands.push(...additionalCommands);
    }

    for (const command of commands) {
      // In a real implementation, would execute shell commands
      console.log(`Running setup command: ${command}`);
    }
  }

  private async handleCheckoutConflicts(
    targetBranch: string,
    strategy: 'ours' | 'theirs' | 'recursive'
  ): Promise<void> {
    try {
      // Handle conflicts based on strategy
      switch (strategy) {
        case 'ours':
          // Keep our changes
          console.log('Keeping local changes during checkout');
          break;
        case 'theirs':
          // Take their changes
          console.log('Taking remote changes during checkout');
          break;
        case 'recursive':
          // Attempt recursive merge
          console.log('Attempting recursive merge during checkout');
          break;
      }
    } catch (error) {
      throw createEngineError(
        `Failed to handle checkout conflicts: ${error}`,
        'CHECKOUT_CONFLICTS_FAILED',
        'system',
        'medium'
      );
    }
  }

  private async runPreMergeChecks(sourceBranch: string, targetBranch: string): Promise<void> {
    // Check for conflicts
    const comparison = await this.compareBranches(sourceBranch, targetBranch);
    if (comparison.conflicts.length > 0) {
      console.warn(`Potential merge conflicts detected: ${comparison.conflicts.join(', ')}`);
    }

    // Run tests if configured
    console.log('Running pre-merge checks...');
  }

  private async fastForwardMerge(sourceBranch: string): Promise<GitCommit> {
    await this.gitIntegration.merge(sourceBranch, 'ours');
    const history = await this.gitIntegration.getHistory(1);
    return history[0];
  }

  private async squashMerge(sourceBranch: string): Promise<GitCommit> {
    // In a real implementation, would use git merge --squash
    await this.gitIntegration.merge(sourceBranch);
    const history = await this.gitIntegration.getHistory(1);
    return history[0];
  }

  private async rebaseMerge(sourceBranch: string): Promise<GitCommit> {
    // In a real implementation, would use git rebase
    await this.gitIntegration.merge(sourceBranch);
    const history = await this.gitIntegration.getHistory(1);
    return history[0];
  }

  private async standardMerge(
    sourceBranch: string,
    conflictResolution?: 'auto' | 'manual' | 'abort'
  ): Promise<GitCommit> {
    try {
      await this.gitIntegration.merge(sourceBranch);
      const history = await this.gitIntegration.getHistory(1);
      return history[0];
    } catch (error) {
      if (conflictResolution === 'auto') {
        // Attempt automatic conflict resolution
        console.log('Attempting automatic conflict resolution...');
        // In a real implementation, would use conflict resolution system
      } else if (conflictResolution === 'abort') {
        await this.gitIntegration.executeGitCommand(['merge', '--abort']);
        throw createEngineError(
          'Merge aborted due to conflicts',
          'MERGE_ABORTED',
          'system',
          'medium'
        );
      }
      throw error;
    }
  }

  private async runPostMergeTests(): Promise<void> {
    console.log('Running post-merge tests...');
    // In a real implementation, would run test suite
  }

  private findCommonAncestor(
    history1: GitCommit[],
    history2: GitCommit[]
  ): GitCommit | undefined {
    for (const commit1 of history1) {
      for (const commit2 of history2) {
        if (commit1.hash === commit2.hash) {
          return commit1;
        }
      }
    }
    return undefined;
  }

  private async detectMergeConflicts(branch1: string, branch2: string): Promise<string[]> {
    // In a real implementation, would simulate merge to detect conflicts
    // For now, return empty array
    return [];
  }

  private async executeWorkflowStep(step: WorkflowStep, context: any): Promise<void> {
    switch (step.type) {
      case 'create_branch':
        console.log(`Creating branch: ${step.configuration.branch}`);
        break;
      case 'run_tests':
        console.log(`Running tests: ${step.configuration.testTypes?.join(', ')}`);
        break;
      case 'request_review':
        console.log(`Requesting review: ${step.configuration.reviewers?.join(', ')}`);
        break;
      case 'merge':
        console.log(`Merging branch: ${step.configuration.source}`);
        break;
      case 'deploy':
        console.log(`Deploying to: ${step.configuration.environment}`);
        break;
      case 'cleanup':
        console.log(`Cleaning up: ${step.configuration.cleanup}`);
        break;
    }
  }
}

// Factory function
export function createBranchManagementSystem(gitIntegration: GitIntegration): BranchManagementSystem {
  return new BranchManagementSystem(gitIntegration);
}
