/**
 * Version Control System Index
 * Exports all version control and collaboration features
 */

// Git integration
export * from './GitIntegration';

// Conflict resolution
export * from './ConflictResolution';

// Collaborative editing
export * from './CollaborativeEditing';

// Visual diff system
export * from './VisualDiff';

// Branch management
export * from './BranchManagement';

// Re-export commonly used items
export {
  GitIntegration,
  createGitIntegration,
} from './GitIntegration';

export {
  ConflictResolutionSystem as ConflictResolver,
  createConflictResolutionSystem,
} from './ConflictResolution';

export {
  CollaborativeEditingSystem,
  createCollaborativeEditingSystem,
} from './CollaborativeEditing';

export {
  VisualDiffSystem,
  createVisualDiffSystem,
} from './VisualDiff';

export {
  BranchManagementSystem,
  createBranchManagementSystem,
} from './BranchManagement';
