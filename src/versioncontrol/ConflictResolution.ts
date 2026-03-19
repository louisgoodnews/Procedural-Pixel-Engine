/**
 * Conflict Resolution System
 * Provides intelligent conflict resolution for Git merges
 */

import { GitMergeConflict, GitConflictSection } from './GitIntegration';
import { createEngineError, validators } from '../utils/ErrorHandling';

export interface ConflictResolutionStrategy {
  name: string;
  description: string;
  applicableTo: string[];
  resolve: (conflict: GitMergeConflict) => Promise<ConflictResolution>;
}

export interface ConflictResolution {
  file: string;
  strategy: string;
  resolution: string;
  conflicts: ResolvedConflict[];
  success: boolean;
  warnings?: string[];
}

export interface ResolvedConflict {
  start: number;
  end: number;
  resolution: 'ours' | 'theirs' | 'merged' | 'manual';
  content: string;
  original: {
    ours: string[];
    theirs: string[];
    base?: string[];
  };
}

export interface MergeStrategy {
  name: string;
  description: string;
  priority: number;
  applicable: (conflict: GitConflictSection) => boolean;
  resolve: (conflict: GitConflictSection) => Promise<string>;
}

export interface ConflictOptions {
  autoResolve?: boolean;
  preferOurs?: boolean;
  preferTheirs?: boolean;
  backupOriginal?: boolean;
  strategy?: string[];
}

export class ConflictResolutionSystem {
  private strategies = new Map<string, ConflictResolutionStrategy>();
  private mergeStrategies = new Map<string, MergeStrategy>();

  constructor() {
    this.initializeDefaultStrategies();
    this.initializeMergeStrategies();
  }

  /**
   * Register a conflict resolution strategy
   */
  registerStrategy(strategy: ConflictResolutionStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  /**
   * Register a merge strategy
   */
  registerMergeStrategy(strategy: MergeStrategy): void {
    this.mergeStrategies.set(strategy.name, strategy);
  }

  /**
   * Resolve conflicts in a file
   */
  async resolveConflict(
    conflict: GitMergeConflict,
    options: ConflictOptions = {}
  ): Promise<ConflictResolution> {
    validators.notNull(conflict, 'Conflict cannot be null');

    try {
      const applicableStrategies = this.getApplicableStrategies(conflict, options.strategy);
      
      if (applicableStrategies.length === 0) {
        throw createEngineError(
          `No applicable resolution strategies found for ${conflict.file}`,
          'NO_RESOLUTION_STRATEGY',
          'system',
          'high'
        );
      }

      // Try strategies in order of priority
      for (const strategy of applicableStrategies) {
        try {
          const resolution = await strategy.resolve(conflict);
          
          if (resolution.success) {
            return resolution;
          }
        } catch (error) {
          console.warn(`Strategy ${strategy.name} failed for ${conflict.file}:`, error);
        }
      }

      // If all strategies failed, return manual resolution
      return this.createManualResolution(conflict);
    } catch (error) {
      throw createEngineError(
        `Failed to resolve conflict in ${conflict.file}: ${error}`,
        'CONFLICT_RESOLUTION_FAILED',
        'system',
        'high',
        { conflict, options }
      );
    }
  }

  /**
   * Resolve multiple conflicts
   */
  async resolveConflicts(
    conflicts: GitMergeConflict[],
    options: ConflictOptions = {}
  ): Promise<ConflictResolution[]> {
    const resolutions: ConflictResolution[] = [];

    for (const conflict of conflicts) {
      const resolution = await this.resolveConflict(conflict, options);
      resolutions.push(resolution);
    }

    return resolutions;
  }

  /**
   * Auto-resolve conflicts using heuristics
   */
  async autoResolve(conflicts: GitMergeConflict[]): Promise<ConflictResolution[]> {
    const options: ConflictOptions = {
      autoResolve: true,
      strategy: ['auto-merge', 'json-merge', 'text-merge']
    };

    return this.resolveConflicts(conflicts, options);
  }

  /**
   * Create a three-way merge
   */
  async threeWayMerge(
    ours: string,
    theirs: string,
    base: string,
    options: ConflictOptions = {}
  ): Promise<string> {
    try {
      const lines1 = ours.split('\n');
      const lines2 = theirs.split('\n');
      const linesBase = base.split('\n');

      const merged: string[] = [];
      let conflicts = 0;

      // Simple three-way merge algorithm
      const maxLength = Math.max(lines1.length, lines2.length, linesBase.length);
      
      for (let i = 0; i < maxLength; i++) {
        const line1 = lines1[i];
        const line2 = lines2[i];
        const lineBase = linesBase[i];

        if (line1 === line2) {
          // No conflict
          merged.push(line1 || '');
        } else if (line1 === lineBase) {
          // They changed, we didn't
          merged.push(line2 || '');
        } else if (line2 === lineBase) {
          // We changed, they didn't
          merged.push(line1 || '');
        } else {
          // Both changed - conflict
          conflicts++;
          merged.push(`<<<<<<< OURS`);
          merged.push(line1 || '');
          merged.push(`=======`);
          merged.push(line2 || '');
          merged.push(`>>>>>>> THEIRS`);
        }
      }

      if (conflicts > 0 && !options.autoResolve) {
        throw createEngineError(
          `Merge resulted in ${conflicts} conflicts`,
          'MERGE_CONFLICTS',
          'system',
          'medium'
        );
      }

      return merged.join('\n');
    } catch (error) {
      throw createEngineError(
        `Three-way merge failed: ${error}`,
        'THREE_WAY_MERGE_FAILED',
        'system',
        'high'
      );
    }
  }

  /**
   * Get conflict statistics
   */
  getConflictStats(conflicts: GitMergeConflict[]): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<'low' | 'medium' | 'high', number>;
    estimatedResolutionTime: number;
  } {
    const stats = {
      total: conflicts.length,
      byType: {} as Record<string, number>,
      bySeverity: { low: 0, medium: 0, high: 0 },
      estimatedResolutionTime: 0
    };

    for (const conflict of conflicts) {
      const fileType = this.getFileType(conflict.file);
      stats.byType[fileType] = (stats.byType[fileType] || 0) + 1;
      
      const severity = this.estimateConflictSeverity(conflict);
      stats.bySeverity[severity]++;
      
      stats.estimatedResolutionTime += this.estimateResolutionTime(conflict);
    }

    return stats;
  }

  // Private methods

  private initializeDefaultStrategies(): void {
    // Auto-merge strategy
    this.registerStrategy({
      name: 'auto-merge',
      description: 'Automatically merge non-conflicting changes',
      applicableTo: ['*'],
      resolve: async (conflict) => this.autoMergeStrategy(conflict)
    });

    // JSON merge strategy
    this.registerStrategy({
      name: 'json-merge',
      description: 'Intelligently merge JSON files',
      applicableTo: ['*.json'],
      resolve: async (conflict) => this.jsonMergeStrategy(conflict)
    });

    // Text merge strategy
    this.registerStrategy({
      name: 'text-merge',
      description: 'Merge text files line by line',
      applicableTo: ['*.txt', '*.md', '*.js', '*.ts'],
      resolve: async (conflict) => this.textMergeStrategy(conflict)
    });

    // Binary merge strategy
    this.registerStrategy({
      name: 'binary-merge',
      description: 'Handle binary file conflicts',
      applicableTo: ['*.png', '*.jpg', '*.gif', '*.wav', '*.mp3'],
      resolve: async (conflict) => this.binaryMergeStrategy(conflict)
    });
  }

  private initializeMergeStrategies(): void {
    // Prefer newer changes
    this.registerMergeStrategy({
      name: 'prefer-newer',
      description: 'Prefer newer changes based on timestamps',
      priority: 1,
      applicable: (conflict) => true,
      resolve: async (conflict) => this.preferNewerStrategy(conflict)
    });

    // Prefer ours
    this.registerMergeStrategy({
      name: 'prefer-ours',
      description: 'Always prefer our version',
      priority: 2,
      applicable: (conflict) => true,
      resolve: async (conflict) => this.preferOursStrategy(conflict)
    });

    // Prefer theirs
    this.registerMergeStrategy({
      name: 'prefer-theirs',
      description: 'Always prefer their version',
      priority: 2,
      applicable: (conflict) => true,
      resolve: async (conflict) => this.preferTheirsStrategy(conflict)
    });
  }

  private getApplicableStrategies(
    conflict: GitMergeConflict,
    preferredStrategies?: string[]
  ): ConflictResolutionStrategy[] {
    const strategies = Array.from(this.strategies.values());
    
    // Filter by file type
    const applicable = strategies.filter(strategy => 
      strategy.applicableTo.some(pattern => this.matchesPattern(conflict.file, pattern))
    );

    // Sort by preference
    if (preferredStrategies) {
      return applicable.sort((a, b) => {
        const aIndex = preferredStrategies.indexOf(a.name);
        const bIndex = preferredStrategies.indexOf(b.name);
        
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    }

    return applicable;
  }

  private matchesPattern(filename: string, pattern: string): boolean {
    if (pattern === '*') return true;
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filename);
    }
    return filename === pattern;
  }

  private async autoMergeStrategy(conflict: GitMergeConflict): Promise<ConflictResolution> {
    const resolvedConflicts: ResolvedConflict[] = [];

    for (const section of conflict.conflicts) {
      // Try to auto-merge if sections are identical
      if (this.canAutoMerge(section)) {
        const mergedContent = this.mergeSections(section);
        resolvedConflicts.push({
          start: section.start,
          end: section.end,
          resolution: 'merged',
          content: mergedContent,
          original: {
            ours: section.ours,
            theirs: section.theirs,
            base: section.base
          }
        });
      } else {
        // Mark for manual resolution
        resolvedConflicts.push({
          start: section.start,
          end: section.end,
          resolution: 'manual',
          content: this.createConflictMarkers(section),
          original: {
            ours: section.ours,
            theirs: section.theirs,
            base: section.base
          }
        });
      }
    }

    return {
      file: conflict.file,
      strategy: 'auto-merge',
      resolution: this.buildResolvedContent(conflict, resolvedConflicts),
      conflicts: resolvedConflicts,
      success: resolvedConflicts.every(c => c.resolution !== 'manual')
    };
  }

  private async jsonMergeStrategy(conflict: GitMergeConflict): Promise<ConflictResolution> {
    const resolvedConflicts: ResolvedConflict[] = [];

    for (const section of conflict.conflicts) {
      try {
        const oursJson = JSON.parse(section.ours.join('\n'));
        const theirsJson = JSON.parse(section.theirs.join('\n'));
        
        const merged = this.mergeJsonObjects(oursJson, theirsJson);
        const mergedContent = JSON.stringify(merged, null, 2);

        resolvedConflicts.push({
          start: section.start,
          end: section.end,
          resolution: 'merged',
          content: mergedContent,
          original: {
            ours: section.ours,
            theirs: section.theirs,
            base: section.base
          }
        });
      } catch (error) {
        // Fall back to manual resolution
        resolvedConflicts.push({
          start: section.start,
          end: section.end,
          resolution: 'manual',
          content: this.createConflictMarkers(section),
          original: {
            ours: section.ours,
            theirs: section.theirs,
            base: section.base
          }
        });
      }
    }

    return {
      file: conflict.file,
      strategy: 'json-merge',
      resolution: this.buildResolvedContent(conflict, resolvedConflicts),
      conflicts: resolvedConflicts,
      success: resolvedConflicts.every(c => c.resolution !== 'manual')
    };
  }

  private async textMergeStrategy(conflict: GitMergeConflict): Promise<ConflictResolution> {
    const resolvedConflicts: ResolvedConflict[] = [];

    for (const section of conflict.conflicts) {
      // Try line-by-line merge
      const merged = this.mergeTextSections(section.ours, section.theirs, section.base);
      
      resolvedConflicts.push({
        start: section.start,
        end: section.end,
        resolution: merged.hasConflicts ? 'manual' : 'merged',
        content: merged.content,
        original: {
          ours: section.ours,
          theirs: section.theirs,
          base: section.base
        }
      });
    }

    return {
      file: conflict.file,
      strategy: 'text-merge',
      resolution: this.buildResolvedContent(conflict, resolvedConflicts),
      conflicts: resolvedConflicts,
      success: resolvedConflicts.every(c => c.resolution !== 'manual')
    };
  }

  private async binaryMergeStrategy(conflict: GitMergeConflict): Promise<ConflictResolution> {
    // For binary files, we can't auto-merge
    const resolvedConflicts: ResolvedConflict[] = [];

    for (const section of conflict.conflicts) {
      resolvedConflicts.push({
        start: section.start,
        end: section.end,
        resolution: 'manual',
        content: `<<<<<<< BINARY CONFLICT
File: ${conflict.file}
Binary files cannot be automatically merged.
Please manually choose which version to keep.
>>>>>>> BINARY CONFLICT`,
        original: {
          ours: section.ours,
          theirs: section.theirs,
          base: section.base
        }
      });
    }

    return {
      file: conflict.file,
      strategy: 'binary-merge',
      resolution: this.buildResolvedContent(conflict, resolvedConflicts),
      conflicts: resolvedConflicts,
      success: false,
      warnings: ['Binary files require manual resolution']
    };
  }

  private canAutoMerge(section: GitConflictSection): boolean {
    // Check if both versions are identical
    return section.ours.join('\n') === section.theirs.join('\n');
  }

  private mergeSections(section: GitConflictSection): string {
    // If both are identical, return either
    return section.ours.join('\n');
  }

  private createConflictMarkers(section: GitConflictSection): string {
    const lines: string[] = [];
    lines.push('<<<<<<< OURS');
    lines.push(...section.ours);
    lines.push('=======');
    lines.push(...section.theirs);
    lines.push('>>>>>>> THEIRS');
    return lines.join('\n');
  }

  private mergeJsonObjects(ours: any, theirs: any): any {
    if (typeof ours !== 'object' || typeof theirs !== 'object') {
      return theirs; // Prefer theirs for non-objects
    }

    const result = { ...ours };

    for (const key in theirs) {
      if (theirs.hasOwnProperty(key)) {
        if (ours.hasOwnProperty(key)) {
          if (typeof ours[key] === 'object' && typeof theirs[key] === 'object') {
            result[key] = this.mergeJsonObjects(ours[key], theirs[key]);
          } else {
            // Conflict - prefer theirs for now
            result[key] = theirs[key];
          }
        } else {
          result[key] = theirs[key];
        }
      }
    }

    return result;
  }

  private mergeTextSections(
    ours: string[],
    theirs: string[],
    base?: string[]
  ): { content: string; hasConflicts: boolean } {
    const merged: string[] = [];
    let hasConflicts = false;

    // Simple line-by-line merge
    const maxLength = Math.max(ours.length, theirs.length, base?.length || 0);

    for (let i = 0; i < maxLength; i++) {
      const ourLine = ours[i];
      const theirLine = theirs[i];
      const baseLine = base?.[i];

      if (ourLine === theirLine) {
        merged.push(ourLine || '');
      } else if (ourLine === baseLine) {
        merged.push(theirLine || '');
      } else if (theirLine === baseLine) {
        merged.push(ourLine || '');
      } else {
        // Conflict
        hasConflicts = true;
        merged.push('<<<<<<< OURS');
        merged.push(ourLine || '');
        merged.push('=======');
        merged.push(theirLine || '');
        merged.push('>>>>>>> THEIRS');
      }
    }

    return {
      content: merged.join('\n'),
      hasConflicts
    };
  }

  private buildResolvedContent(conflict: GitMergeConflict, resolvedConflicts: ResolvedConflict[]): string {
    // This would reconstruct the full file content with resolved conflicts
    // For now, return concatenated resolutions
    return resolvedConflicts.map(c => c.content).join('\n');
  }

  private createManualResolution(conflict: GitMergeConflict): ConflictResolution {
    const resolvedConflicts: ResolvedConflict[] = conflict.conflicts.map(section => ({
      start: section.start,
      end: section.end,
      resolution: 'manual' as const,
      content: this.createConflictMarkers(section),
      original: {
        ours: section.ours,
        theirs: section.theirs,
        base: section.base
      }
    }));

    return {
      file: conflict.file,
      strategy: 'manual',
      resolution: this.buildResolvedContent(conflict, resolvedConflicts),
      conflicts: resolvedConflicts,
      success: false,
      warnings: ['Manual resolution required']
    };
  }

  private getFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext || 'unknown';
  }

  private estimateConflictSeverity(conflict: GitMergeConflict): 'low' | 'medium' | 'high' {
    const fileType = this.getFileType(conflict.file);
    const conflictCount = conflict.conflicts.length;

    // Binary files are high severity
    if (['png', 'jpg', 'jpeg', 'gif', 'wav', 'mp3', 'ogg'].includes(fileType)) {
      return 'high';
    }

    // JSON files are medium severity (can be auto-merged)
    if (fileType === 'json') {
      return conflictCount > 5 ? 'medium' : 'low';
    }

    // Text files based on conflict count
    if (conflictCount > 10) return 'high';
    if (conflictCount > 3) return 'medium';
    return 'low';
  }

  private estimateResolutionTime(conflict: GitMergeConflict): number {
    const fileType = this.getFileType(conflict.file);
    const conflictCount = conflict.conflicts.length;

    // Base time in minutes
    let baseTime = 1;

    // Adjust by file type
    if (['png', 'jpg', 'jpeg', 'gif', 'wav', 'mp3'].includes(fileType)) {
      baseTime = 5; // Binary files take longer
    } else if (fileType === 'json') {
      baseTime = 0.5; // JSON files are faster
    }

    // Adjust by conflict count
    return baseTime * conflictCount;
  }

  private async preferNewerStrategy(conflict: GitConflictSection): Promise<string> {
    // Implementation for preferring newer changes
    return conflict.ours.join('\n');
  }

  private async preferOursStrategy(conflict: GitConflictSection): Promise<string> {
    return conflict.ours.join('\n');
  }

  private async preferTheirsStrategy(conflict: GitConflictSection): Promise<string> {
    return conflict.theirs.join('\n');
  }
}

// Factory function
export function createConflictResolutionSystem(): ConflictResolutionSystem {
  return new ConflictResolutionSystem();
}
