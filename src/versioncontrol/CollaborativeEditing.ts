/**
 * Real-time Collaborative Editing System
 * Provides real-time collaboration features for multiple users
 */

import { createEngineError, safeExecute, validators } from '../utils/ErrorHandling';

export interface CollaborativeUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  cursor?: CursorPosition;
  selection?: SelectionRange;
  color: string;
  isOnline: boolean;
  lastSeen: Date;
  permissions: UserPermissions;
}

export interface CursorPosition {
  file: string;
  line: number;
  column: number;
  visible: boolean;
}

export interface SelectionRange {
  file: string;
  start: { line: number; column: number };
  end: { line: number; column: number };
}

export interface UserPermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canShare: boolean;
  canAdmin: boolean;
}

export interface CollaborativeSession {
  id: string;
  name: string;
  projectId: string;
  users: CollaborativeUser[];
  files: CollaborativeFile[];
  operations: Operation[];
  createdAt: Date;
  updatedAt: Date;
  owner: string;
  isPublic: boolean;
}

export interface CollaborativeFile {
  path: string;
  content: string;
  version: number;
  lastModified: Date;
  modifiedBy: string;
  isLocked: boolean;
  lockedBy?: string;
  locks: FileLock[];
}

export interface FileLock {
  userId: string;
  userName: string;
  reason: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface Operation {
  id: string;
  type: 'insert' | 'delete' | 'retain' | 'format';
  userId: string;
  timestamp: Date;
  file: string;
  position: number;
  content?: string;
  length?: number;
  attributes?: Record<string, any>;
  version: number;
}

export interface OperationTransform {
  operation1: Operation;
  operation2: Operation;
  transformed1: Operation;
  transformed2: Operation;
}

export interface ConflictResolution {
  operation: Operation;
  conflictingOperations: Operation[];
  resolution: 'accept' | 'reject' | 'merge';
  resolvedOperation?: Operation;
}

export class CollaborativeEditingSystem {
  private sessions = new Map<string, CollaborativeSession>();
  private users = new Map<string, CollaborativeUser>();
  private operations = new Map<string, Operation[]>();
  private transformers = new Map<string, OperationTransform[]>();
  private eventListeners = new Map<string, Set<(event: CollaborationEvent) => void>>();

  constructor() {
    this.initializeEventHandlers();
  }

  /**
   * Create a new collaborative session
   */
  async createSession(
    name: string,
    projectId: string,
    owner: CollaborativeUser,
    isPublic = false
  ): Promise<CollaborativeSession> {
    validators.notEmpty(name);
    validators.notEmpty(projectId);
    validators.notNull(owner);

    try {
      const session: CollaborativeSession = {
        id: this.generateId(),
        name,
        projectId,
        users: [owner],
        files: [],
        operations: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: owner.id,
        isPublic
      };

      this.sessions.set(session.id, session);
      this.users.set(owner.id, owner);
      this.operations.set(session.id, []);

      this.emitEvent({
        type: 'session_created',
        sessionId: session.id,
        userId: owner.id,
        timestamp: new Date(),
        data: { session }
      });

      return session;
    } catch (error) {
      throw createEngineError(
        `Failed to create collaborative session: ${error}`,
        'SESSION_CREATE_FAILED',
        'system',
        'high'
      );
    }
  }

  /**
   * Join a collaborative session
   */
  async joinSession(sessionId: string, user: CollaborativeUser): Promise<CollaborativeSession> {
    validators.notEmpty(sessionId);
    validators.notNull(user);

    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw createEngineError(
          `Session ${sessionId} not found`,
          'SESSION_NOT_FOUND',
          'system',
          'high'
        );
      }

      // Check if user already in session
      const existingUser = session.users.find(u => u.id === user.id);
      if (existingUser) {
        // Update existing user
        Object.assign(existingUser, user);
        existingUser.isOnline = true;
        existingUser.lastSeen = new Date();
      } else {
        // Add new user
        session.users.push({
          ...user,
          isOnline: true,
          lastSeen: new Date()
        });
      }

      session.updatedAt = new Date();
      this.users.set(user.id, user);

      this.emitEvent({
        type: 'user_joined',
        sessionId,
        userId: user.id,
        timestamp: new Date(),
        data: { user }
      });

      return session;
    } catch (error) {
      throw createEngineError(
        `Failed to join session ${sessionId}: ${error}`,
        'SESSION_JOIN_FAILED',
        'system',
        'high'
      );
    }
  }

  /**
   * Leave a collaborative session
   */
  async leaveSession(sessionId: string, userId: string): Promise<void> {
    validators.notEmpty(sessionId);
    validators.notEmpty(userId);

    try {
      const session = this.sessions.get(sessionId);
      if (!session) return;

      const userIndex = session.users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        const user = session.users[userIndex];
        user.isOnline = false;
        user.lastSeen = new Date();
        
        // Remove user locks
        this.releaseAllUserLocks(sessionId, userId);
      }

      session.updatedAt = new Date();

      this.emitEvent({
        type: 'user_left',
        sessionId,
        userId,
        timestamp: new Date(),
        data: { userId }
      });
    } catch (error) {
      throw createEngineError(
        `Failed to leave session ${sessionId}: ${error}`,
        'SESSION_LEAVE_FAILED',
        'system',
        'medium'
      );
    }
  }

  /**
   * Apply an operation to a file
   */
  async applyOperation(operation: Operation): Promise<void> {
    validators.notNull(operation);
    validators.notEmpty(operation.file);

    try {
      const session = this.findSessionForFile(operation.file);
      if (!session) {
        throw createEngineError(
          `No session found for file ${operation.file}`,
          'FILE_NOT_IN_SESSION',
          'system',
          'medium'
        );
      }

      // Transform operation against concurrent operations
      const transformedOp = await this.transformOperation(operation, session.id);
      
      // Apply the transformed operation
      await this.applyTransformedOperation(transformedOp, session.id);

      // Store the operation
      const sessionOps = this.operations.get(session.id) || [];
      sessionOps.push(transformedOp);
      this.operations.set(session.id, sessionOps);

      session.updatedAt = new Date();

      this.emitEvent({
        type: 'operation_applied',
        sessionId: session.id,
        userId: operation.userId,
        timestamp: new Date(),
        data: { operation: transformedOp }
      });
    } catch (error) {
      throw createEngineError(
        `Failed to apply operation: ${error}`,
        'OPERATION_APPLY_FAILED',
        'system',
        'high'
      );
    }
  }

  /**
   * Get current file content with all applied operations
   */
  async getFileContent(sessionId: string, filePath: string): Promise<string> {
    validators.notEmpty(sessionId);
    validators.notEmpty(filePath);

    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw createEngineError(
          `Session ${sessionId} not found`,
          'SESSION_NOT_FOUND',
          'system',
          'high'
        );
      }

      const file = session.files.find(f => f.path === filePath);
      if (!file) {
        throw createEngineError(
          `File ${filePath} not found in session`,
          'FILE_NOT_FOUND',
          'system',
          'medium'
        );
      }

      // Apply all operations to get current content
      let content = file.content;
      const operations = this.operations.get(sessionId) || [];
      const fileOps = operations.filter(op => op.file === filePath);

      for (const operation of fileOps) {
        content = this.applyOperationToContent(content, operation);
      }

      return content;
    } catch (error) {
      throw createEngineError(
        `Failed to get file content: ${error}`,
        'FILE_CONTENT_FAILED',
        'system',
        'medium'
      );
    }
  }

  /**
   * Lock a file for editing
   */
  async lockFile(
    sessionId: string,
    filePath: string,
    userId: string,
    reason?: string
  ): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) return;

      const file = session.files.find(f => f.path === filePath);
      if (!file) return;

      const user = this.users.get(userId);
      if (!user) return;

      // Check if file is already locked
      if (file.isLocked && file.lockedBy !== userId) {
        throw createEngineError(
          `File ${filePath} is already locked by ${file.lockedBy}`,
          'FILE_ALREADY_LOCKED',
          'system',
          'medium'
        );
      }

      const lock: FileLock = {
        userId,
        userName: user.name,
        reason: reason || 'Editing',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      };

      file.isLocked = true;
      file.lockedBy = userId;
      file.locks = [lock];

      this.emitEvent({
        type: 'file_locked',
        sessionId,
        userId,
        timestamp: new Date(),
        data: { filePath, lock }
      });
    } catch (error) {
      throw createEngineError(
        `Failed to lock file: ${error}`,
        'FILE_LOCK_FAILED',
        'system',
        'medium'
      );
    }
  }

  /**
   * Unlock a file
   */
  async unlockFile(sessionId: string, filePath: string, userId: string): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) return;

      const file = session.files.find(f => f.path === filePath);
      if (!file) return;

      if (file.isLocked && file.lockedBy === userId) {
        file.isLocked = false;
        file.lockedBy = undefined;
        file.locks = [];

        this.emitEvent({
          type: 'file_unlocked',
          sessionId,
          userId,
          timestamp: new Date(),
          data: { filePath }
        });
      }
    } catch (error) {
      throw createEngineError(
        `Failed to unlock file: ${error}`,
        'FILE_UNLOCK_FAILED',
        'system',
        'medium'
      );
    }
  }

  /**
   * Update user cursor position
   */
  async updateCursor(
    sessionId: string,
    userId: string,
    cursor: CursorPosition
  ): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) return;

      const user = session.users.find(u => u.id === userId);
      if (user) {
        user.cursor = cursor;

        this.emitEvent({
          type: 'cursor_updated',
          sessionId,
          userId,
          timestamp: new Date(),
          data: { cursor }
        });
      }
    } catch (error) {
      throw createEngineError(
        `Failed to update cursor: ${error}`,
        'CURSOR_UPDATE_FAILED',
        'system',
        'low'
      );
    }
  }

  /**
   * Update user selection
   */
  async updateSelection(
    sessionId: string,
    userId: string,
    selection: SelectionRange
  ): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) return;

      const user = session.users.find(u => u.id === userId);
      if (user) {
        user.selection = selection;

        this.emitEvent({
          type: 'selection_updated',
          sessionId,
          userId,
          timestamp: new Date(),
          data: { selection }
        });
      }
    } catch (error) {
      throw createEngineError(
        `Failed to update selection: ${error}`,
        'SELECTION_UPDATE_FAILED',
        'system',
        'low'
      );
    }
  }

  /**
   * Get session information
   */
  getSession(sessionId: string): CollaborativeSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all sessions
   */
  getAllSessions(): CollaborativeSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Add event listener
   */
  addEventListener(
    eventType: string,
    callback: (event: CollaborationEvent) => void
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    
    this.eventListeners.get(eventType)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.eventListeners.get(eventType)?.delete(callback);
    };
  }

  // Private methods

  private initializeEventHandlers(): void {
    // Initialize any default event handlers
  }

  private emitEvent(event: CollaborationEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const callback of listeners) {
        safeExecute(() => callback(event));
      }
    }
  }

  private findSessionForFile(filePath: string): CollaborativeSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.files.some(f => f.path === filePath)) {
        return session;
      }
    }
    return undefined;
  }

  private async transformOperation(
    operation: Operation,
    sessionId: string
  ): Promise<Operation> {
    const operations = this.operations.get(sessionId) || [];
    const concurrentOps = operations.filter(op => 
      op.file === operation.file && 
      op.timestamp > operation.timestamp
    );

    let transformedOp = { ...operation };

    for (const concurrentOp of concurrentOps) {
      const transform = this.transform(transformedOp, concurrentOp);
      transformedOp = transform.transformed1;
    }

    return transformedOp;
  }

  private transform(op1: Operation, op2: Operation): OperationTransform {
    // Simplified operational transformation
    // In a real implementation, this would use proper OT algorithms
    
    if (op1.file !== op2.file) {
      return {
        operation1: op1,
        operation2: op2,
        transformed1: op1,
        transformed2: op2
      };
    }

    // Simple transformation based on operation types
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position <= op2.position) {
        return {
          operation1: op1,
          operation2: op2,
          transformed1: op1,
          transformed2: { ...op2, position: op2.position + (op1.content?.length || 0) }
        };
      } else {
        return {
          operation1: op1,
          operation2: op2,
          transformed1: { ...op1, position: op1.position + (op2.content?.length || 0) },
          transformed2: op2
        };
      }
    }

    // Default case - no transformation needed
    return {
      operation1: op1,
      operation2: op2,
      transformed1: op1,
      transformed2: op2
    };
  }

  private async applyTransformedOperation(
    operation: Operation,
    sessionId: string
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const file = session.files.find(f => f.path === operation.file);
    if (!file) return;

    // Update file content
    file.content = this.applyOperationToContent(file.content, operation);
    file.version++;
    file.lastModified = new Date();
    file.modifiedBy = operation.userId;
  }

  private applyOperationToContent(content: string, operation: Operation): string {
    switch (operation.type) {
      case 'insert':
        return content.slice(0, operation.position) + 
               (operation.content || '') + 
               content.slice(operation.position);
      
      case 'delete':
        return content.slice(0, operation.position) + 
               content.slice(operation.position + (operation.length || 0));
      
      case 'retain':
        return content; // No change
      
      default:
        return content;
    }
  }

  private releaseAllUserLocks(sessionId: string, userId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    for (const file of session.files) {
      if (file.isLocked && file.lockedBy === userId) {
        file.isLocked = false;
        file.lockedBy = undefined;
        file.locks = [];
      }
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export interface CollaborationEvent {
  type: string;
  sessionId: string;
  userId: string;
  timestamp: Date;
  data: any;
}

// Factory function
export function createCollaborativeEditingSystem(): CollaborativeEditingSystem {
  return new CollaborativeEditingSystem();
}
