/**
 * Enhanced commenting system with rich text support
 * Provides comprehensive commenting capabilities for code documentation
 */

export interface RichTextElement {
  type: 'text' | 'bold' | 'italic' | 'code' | 'link' | 'image' | 'list' | 'quote' | 'heading' | 'table' | 'emoji' | 'mention' | 'hashtag';
  content: string;
  attributes?: Record<string, any>;
  children?: RichTextElement[];
}

export interface Comment {
  id: string;
  author: CommentAuthor;
  content: RichTextElement[];
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
  replies?: Comment[];
  reactions: CommentReaction[];
  tags: string[];
  metadata?: CommentMetadata;
  threadId?: string;
  parentId?: string;
  isResolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface CommentAuthor {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  email?: string;
  role: 'developer' | 'designer' | 'tester' | 'user' | 'moderator' | 'admin';
  reputation?: number;
  badges?: string[];
}

export interface CommentReaction {
  type: 'like' | 'dislike' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry' | 'custom';
  emoji?: string;
  count: number;
  users: string[]; // user IDs
  userId?: string;
  custom?: {
    name: string;
    emoji: string;
  };
}

export interface CommentMetadata {
  lineNumbers?: number[];
  filePath?: string;
  functionName?: string;
  className?: string;
  version?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  visibility: 'public' | 'internal' | 'private';
  expiresAt?: Date;
  attachments?: CommentAttachment[];
  references?: CommentReference[];
}

export interface CommentAttachment {
  id: string;
  name: string;
  type: 'image' | 'file' | 'video' | 'link' | 'code';
  url: string;
  size: number;
  mimeType: string;
  thumbnail?: string;
}

export interface CommentReference {
  type: 'issue' | 'pull-request' | 'commit' | 'documentation' | 'tutorial' | 'example';
  id: string;
  title: string;
  url: string;
}

export interface CommentThread {
  id: string;
  title: string;
  rootComment: Comment;
  comments: Comment[];
  metadata: {
    createdAt: Date;
    lastActivity: Date;
    participantCount: number;
    isResolved: boolean;
    resolvedBy?: string;
    resolvedAt?: Date;
  };
}

export interface CommentFilter {
  author?: string[];
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  priority?: ('low' | 'medium' | 'high' | 'critical')[];
  status?: 'all' | 'unresolved' | 'resolved';
  search?: string;
}

export interface CommentConfig {
  enableRichText: boolean;
  enableReactions: boolean;
  enableThreads: boolean;
  enableTags: boolean;
  enableMentions: boolean;
  enableHashtags: boolean;
  enableAttachments: boolean;
  maxCommentLength: number;
  allowedMimeTypes: string[];
  enableModeration: boolean;
  autoSave: boolean;
  saveInterval: number; // milliseconds
}

export interface CommentStats {
  totalComments: number;
  totalThreads: number;
  commentsByAuthor: Map<string, number>;
  commentsByTag: Map<string, number>;
  commentsByPriority: Map<string, number>;
  resolutionRate: number;
  averageResponseTime: number;
  mostActiveAuthors: CommentAuthor[];
  trendingTags: string[];
}

export class CommentingSystem {
  private comments = new Map<string, Comment>();
  private threads = new Map<string, CommentThread>();
  private config: CommentConfig;
  private subscribers = new Set<(event: CommentEvent) => void>();

  constructor(config: Partial<CommentConfig> = {}) {
    this.config = {
      enableRichText: true,
      enableReactions: true,
      enableThreads: true,
      enableTags: true,
      enableMentions: true,
      enableHashtags: true,
      enableAttachments: true,
      maxCommentLength: 10000,
      allowedMimeTypes: [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'text/plain', 'text/markdown', 'text/html',
        'application/pdf', 'application/json',
        'video/mp4', 'video/webm',
      ],
      enableModeration: true,
      autoSave: true,
      saveInterval: 30000, // 30 seconds
      ...config,
    };
  }

  /**
   * Add a comment
   */
  addComment(comment: Omit<Comment, 'id' | 'timestamp'>): Comment {
    const id = this.generateCommentId();
    const fullComment: Comment = {
      id,
      author: comment.author,
      content: this.processRichText(comment.content),
      timestamp: new Date(),
      replies: [],
      reactions: [],
      tags: comment.tags || [],
      metadata: comment.metadata,
      threadId: comment.threadId,
      parentId: comment.parentId,
      isResolved: false,
    };

    this.comments.set(id, fullComment);
    
    // Add to thread if specified
    if (comment.threadId) {
      this.addToThread(comment.threadId, fullComment);
    }

    // Emit event
    this.emitEvent({
      type: 'comment-added',
      comment: fullComment,
      timestamp: new Date(),
    });

    if (this.config.autoSave) {
      this.scheduleAutoSave();
    }

    return fullComment;
  }

  /**
   * Reply to a comment
   */
  addCommentReply(parentId: string, reply: Omit<Comment, 'id' | 'timestamp'>): Comment {
    const parentComment = this.comments.get(parentId);
    if (!parentComment) {
      throw new Error(`Parent comment '${parentId}' not found`);
    }

    const reply = this.addComment({
      ...reply,
      parentId,
      threadId: parentComment.threadId,
    });

    // Add reply to parent
    parentComment.replies!.push(reply);

    // Update thread activity
    if (parentComment.threadId) {
      this.updateThreadActivity(parentComment.threadId);
    }

    this.emitEvent({
      type: 'comment-replied',
      comment: reply,
      parentId,
      timestamp: new Date(),
    });

    return reply;
  }

  /**
   * Edit a comment
   */
  editComment(commentId: string, updates: Partial<Comment>): Comment {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error(`Comment '${commentId}' not found`);
    }

    const updatedComment = {
      ...comment,
      ...updates,
      edited: true,
      editedAt: new Date(),
    };

    this.comments.set(commentId, updatedComment);

    this.emitEvent({
      type: 'comment-edited',
      comment: updatedComment,
      timestamp: new Date(),
    });

    return updatedComment;
  }

  /**
   * Delete a comment
   */
  deleteComment(commentId: string): boolean {
    const comment = this.comments.get(commentId);
    if (!comment) {
      return false;
    }

    // Remove from parent's replies
    if (comment.parentId) {
      const parent = this.comments.get(comment.parentId);
      if (parent && parent.replies) {
        parent.replies = parent.replies.filter(reply => reply.id !== commentId);
      }
    }

    // Remove from thread
    if (comment.threadId) {
      this.removeFromThread(comment.threadId, commentId);
    }

    this.comments.delete(commentId);

    this.emitEvent({
      type: 'comment-deleted',
      comment,
      timestamp: new Date(),
    });

    return true;
  }

  /**
   * Add reaction to comment
   */
  addReaction(commentId: string, reaction: Omit<CommentReaction, 'count' | 'users'>): CommentReaction {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error(`Comment '${commentId}' not found`);
    }

    // Find existing reaction
    const existingReaction = comment.reactions.find(r => r.type === reaction.type);
    
    if (existingReaction) {
      existingReaction.count++;
      if (!existingReaction.users.includes(reaction.userId!)) {
        existingReaction.users.push(reaction.userId!);
      }
    } else {
      const newReaction: CommentReaction = {
        ...reaction,
        count: 1,
        users: [reaction.userId!],
      };
      comment.reactions.push(newReaction);
    }

    this.emitEvent({
      type: 'reaction-added',
      commentId,
      reaction: existingReaction || comment.reactions[comment.reactions.length - 1],
      timestamp: new Date(),
    });

    return existingReaction || comment.reactions[comment.reactions.length - 1];
  }

  /**
   * Remove reaction from comment
   */
  removeReaction(commentId: string, reactionType: string, userId: string): boolean {
    const comment = this.comments.get(commentId);
    if (!comment) {
      return false;
    }

    const reactionIndex = comment.reactions.findIndex(r => r.type === reactionType);
    if (reactionIndex === -1) {
      return false;
    }

    const reaction = comment.reactions[reactionIndex];
    reaction.users = reaction.users.filter(id => id !== userId);
    reaction.count = reaction.users.length;

    if (reaction.count === 0) {
      comment.reactions.splice(reactionIndex, 1);
    }

    this.emitEvent({
      type: 'reaction-removed',
      commentId,
      reaction,
      timestamp: new Date(),
    });

    return true;
  }

  /**
   * Resolve a comment thread
   */
  resolveThread(threadId: string, resolvedBy: string): boolean {
    const thread = this.threads.get(threadId);
    if (!thread) {
      return false;
    }

    thread.metadata.isResolved = true;
    thread.metadata.resolvedBy = resolvedBy;
    thread.metadata.resolvedAt = new Date();

    // Mark root comment as resolved
    thread.rootComment.isResolved = true;
    thread.rootComment.resolvedBy = resolvedBy;
    thread.rootComment.resolvedAt = new Date();

    this.emitEvent({
      type: 'thread-resolved',
      threadId,
      resolvedBy,
      timestamp: new Date(),
    });

    return true;
  }

  /**
   * Get comment by ID
   */
  getComment(commentId: string): Comment | undefined {
    return this.comments.get(commentId);
  }

  /**
   * Get comments by filter
   */
  getComments(filter?: CommentFilter): Comment[] {
    let comments = Array.from(this.comments.values());

    if (!filter) return comments;

    // Filter by author
    if (filter.author?.length) {
      comments = comments.filter(comment => 
        filter.author!.includes(comment.author.id)
      );
    }

    // Filter by tags
    if (filter.tags?.length) {
      comments = comments.filter(comment => 
        filter.tags!.some(tag => comment.tags.includes(tag))
      );
    }

    // Filter by date range
    if (filter.dateRange) {
      comments = comments.filter(comment => 
        comment.timestamp >= filter.dateRange!.start && 
        comment.timestamp <= filter.dateRange!.end
      );
    }

    // Filter by priority
    if (filter.priority?.length) {
      comments = comments.filter(comment => 
        filter.priority!.includes(comment.metadata?.priority || 'medium')
      );
    }

    // Filter by status
    if (filter.status) {
      if (filter.status === 'resolved') {
        comments = comments.filter(comment => comment.isResolved);
      } else if (filter.status === 'unresolved') {
        comments = comments.filter(comment => !comment.isResolved);
      }
    }

    // Filter by search
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      comments = comments.filter(comment => 
        this.richTextToPlainText(comment.content).toLowerCase().includes(searchLower)
      );
    }

    return comments;
  }

  /**
   * Get thread by ID
   */
  getThread(threadId: string): CommentThread | undefined {
    return this.threads.get(threadId);
  }

  /**
   * Get all threads
   */
  getThreads(filter?: CommentFilter): CommentThread[] {
    let threads = Array.from(this.threads.values());

    if (!filter) return threads;

    // Apply same filters as getComments
    if (filter.author?.length) {
      threads = threads.filter(thread => 
        filter.author!.includes(thread.rootComment.author.id)
      );
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      threads = threads.filter(thread => 
        thread.rootComment.content.some(element => 
          this.richTextToPlainText([element]).toLowerCase().includes(searchLower)
        ) ||
        thread.title.toLowerCase().includes(searchLower)
      );
    }

    return threads;
  }

  /**
   * Get comment statistics
   */
  getStats(): CommentStats {
    const comments = Array.from(this.comments.values());
    const threads = Array.from(this.threads.values());

    const commentsByAuthor = new Map<string, number>();
    const commentsByTag = new Map<string, number>();
    const commentsByPriority = new Map<string, number>();

    // Count by author
    for (const comment of comments) {
      const count = commentsByAuthor.get(comment.author.id) || 0;
      commentsByAuthor.set(comment.author.id, count + 1);
    }

    // Count by tags
    for (const comment of comments) {
      for (const tag of comment.tags) {
        const count = commentsByTag.get(tag) || 0;
        commentsByTag.set(tag, count + 1);
      }
    }

    // Count by priority
    for (const comment of comments) {
      const priority = comment.metadata?.priority || 'medium';
      const count = commentsByPriority.get(priority) || 0;
      commentsByPriority.set(priority, count + 1);
    }

    // Calculate resolution rate
    const resolvedComments = comments.filter(c => c.isResolved).length;
    const resolutionRate = comments.length > 0 ? (resolvedComments / comments.length) * 100 : 0;

    // Get most active authors
    const sortedAuthors = Array.from(commentsByAuthor.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    const mostActiveAuthors = sortedAuthors.map(([authorId]) => 
      this.comments.get(Array.from(this.comments.keys()).find(id => 
        this.comments.get(id)?.author.id === authorId
      )!)!.author
    );

    // Get trending tags
    const trendingTags = Array.from(commentsByTag.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag);

    return {
      totalComments: comments.length,
      totalThreads: threads.length,
      commentsByAuthor,
      commentsByTag,
      commentsByPriority,
      resolutionRate,
      averageResponseTime: 0, // Would need to calculate from reply times
      mostActiveAuthors,
      trendingTags,
    };
  }

  /**
   * Subscribe to comment events
   */
  subscribe(callback: (event: CommentEvent) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Render rich text to HTML
   */
  renderToHTML(content: RichTextElement[]): string {
    if (!this.config.enableRichText) {
      return this.richTextToPlainText(content);
    }

    return content.map(element => {
      switch (element.type) {
        case 'text':
          return this.escapeHtml(element.content);
        case 'bold':
          return `<strong>${this.escapeHtml(element.content)}</strong>`;
        case 'italic':
          return `<em>${this.escapeHtml(element.content)}</em>`;
        case 'code':
          return `<code>${this.escapeHtml(element.content)}</code>`;
        case 'link':
          return `<a href="${element.attributes?.url || '#'}" target="_blank">${this.escapeHtml(element.content)}</a>`;
        case 'image':
          return `<img src="${element.attributes?.src || ''}" alt="${element.attributes?.alt || ''}" ${element.attributes?.width ? `width="${element.attributes.width}"` : ''} ${element.attributes?.height ? `height="${element.attributes.height}"` : ''}>`;
        case 'list':
          return `<ul>${element.children?.map(child => `<li>${this.renderToHTML([child])}</li>`).join('')}</ul>`;
        case 'quote':
          return `<blockquote>${this.renderToHTML(element.children || [])}</blockquote>`;
        case 'heading':
          const level = element.attributes?.level || 1;
          return `<h${level}>${this.escapeHtml(element.content)}</h${level}>`;
        case 'table':
          return this.renderTableToHTML(element);
        case 'emoji':
          return element.content;
        case 'mention':
          return `<span class="mention">@${this.escapeHtml(element.content)}</span>`;
        case 'hashtag':
          return `<span class="hashtag">#${this.escapeHtml(element.content)}</span>`;
        default:
          return this.escapeHtml(element.content);
      }
    }).join('');
  }

  /**
   * Render rich text to plain text
   */
  richTextToPlainText(content: RichTextElement[]): string {
    return content.map(element => {
      if (element.type === 'link' && element.attributes?.url) {
        return element.content;
      }
      return element.content;
    }).join('');
  }

  /**
   * Export comments to various formats
   */
  exportComments(format: 'json' | 'csv' | 'html' | 'markdown'): string {
    const comments = Array.from(this.comments.values());

    switch (format) {
      case 'json':
        return JSON.stringify(comments, null, 2);
      
      case 'csv':
        const headers = ['ID', 'Author', 'Content', 'Timestamp', 'Tags', 'Resolved'];
        const rows = comments.map(comment => [
          comment.id,
          comment.author.name,
          this.richTextToPlainText(comment.content),
          comment.timestamp.toISOString(),
          comment.tags.join(';'),
          comment.isResolved ? 'Yes' : 'No',
        ]);
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      
      case 'html':
        return comments.map(comment => `
          <div class="comment" id="${comment.id}">
            <div class="comment-header">
              <strong>${comment.author.name}</strong>
              <span class="timestamp">${comment.timestamp.toLocaleString()}</span>
            </div>
            <div class="comment-content">
              ${this.renderToHTML(comment.content)}
            </div>
            <div class="comment-reactions">
              ${comment.reactions.map(reaction => `
                <span class="reaction" data-type="${reaction.type}">
                  ${reaction.emoji || reaction.type} ${reaction.count}
                </span>
              `).join('')}
            </div>
          </div>
        `).join('\n');
      
      case 'markdown':
        return comments.map(comment => `
          **${comment.author.name}** - ${comment.timestamp.toLocaleString()}
          
          ${this.richTextToMarkdown(comment.content)}
          
          ${comment.tags.length > 0 ? `Tags: ${comment.tags.map(tag => \`#\${tag}\`).join(' ')}` : ''}
          ${comment.isResolved ? '✅ Resolved' : ''}
        `).join('\n\n---\n\n');
      
      default:
        return '';
    }
  }

  // Private methods

  /**
   * Process rich text elements
   */
  private processRichText(content: RichTextElement[]): RichTextElement[] {
    if (!this.config.enableRichText) {
      return [{
        type: 'text',
        content: this.richTextToPlainText(content),
      }];
    }

    return content.map(element => {
      // Process mentions
      if (element.type === 'text' && this.config.enableMentions) {
        element.content = this.processMentions(element.content);
      }

      // Process hashtags
      if (element.type === 'text' && this.config.enableHashtags) {
        element.content = this.processHashtags(element.content);
      }

      return element;
    });
  }

  /**
   * Process mentions in text
   */
  private processMentions(text: string): string {
    if (!this.config.enableMentions) return text;

    const mentionRegex = /@(\w+)/g;
    return text.replace(mentionRegex, '<span class="mention">@$1</span>');
  }

  /**
   * Process hashtags in text
   */
  private processHashtags(text: string): string {
    if (!this.config.enableHashtags) return text;

    const hashtagRegex = /#(\w+)/g;
    return text.replace(hashtagRegex, '<span class="hashtag">#$1</span>');
  }

  /**
   * Render table to HTML
   */
  private renderTableToHTML(element: RichTextElement): string {
    if (!element.children || element.type !== 'table') {
      return '';
    }

    const headers = element.attributes?.headers || [];
    const rows = element.children || [];

    let html = '<table class="rich-table">';
    
    // Render headers
    if (headers.length > 0) {
      html += '<thead><tr>';
      for (const header of headers) {
        html += `<th>${this.escapeHtml(header)}</th>`;
      }
      html += '</tr></thead>';
    }

    // Render rows
    html += '<tbody>';
    for (const row of rows) {
      html += '<tr>';
      for (const cell of row.children || []) {
        html += `<td>${this.renderToHTML([cell])}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table>';

    return html;
  }

  /**
   * Render rich text to markdown
   */
  private richTextToMarkdown(content: RichTextElement[]): string {
    return content.map(element => {
      switch (element.type) {
        case 'text':
          return element.content;
        case 'bold':
          return `**${element.content}**`;
        case 'italic':
          return `*${element.content}*`;
        case 'code':
          return `\`${element.content}\``;
        case 'link':
          return `[${element.content}](${element.attributes?.url || '#'})`;
        case 'image':
          return `![${element.attributes?.alt || ''}](${element.attributes?.src || ''})`;
        case 'list':
          return element.children?.map(child => `- ${this.richTextToMarkdown([child])}`).join('\n') || '';
        case 'quote':
          return element.children?.map(child => `> ${this.richTextToMarkdown([child])}`).join('\n') || '';
        case 'heading':
          const level = element.attributes?.level || 1;
          return `${'#'.repeat(level)} ${element.content}`;
        case 'table':
          return this.renderTableToMarkdown(element);
        case 'emoji':
          return element.content;
        case 'mention':
          return `@${element.content}`;
        case 'hashtag':
          return `#${element.content}`;
        default:
          return element.content;
      }
    }).join('');
  }

  /**
   * Render table to markdown
   */
  private renderTableToMarkdown(element: RichTextElement): string {
    if (!element.children || element.type !== 'table') {
      return '';
    }

    const headers = element.attributes?.headers || [];
    const rows = element.children || [];

    let markdown = '| ' + headers.join(' | ') + ' |\n';
    markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';

    for (const row of rows) {
      markdown += '| ' + (row.children || []).map(child => 
        this.richTextToMarkdown([child])
      ).join(' | ') + ' |\n';
    }

    return markdown;
  }

  /**
   * Escape HTML entities
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML || '';
  }

  /**
   * Generate unique comment ID
   */
  private generateCommentId(): string {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add comment to thread
   */
  private addToThread(threadId: string, comment: Comment): void {
    let thread = this.threads.get(threadId);
    
    if (!thread) {
      // Create new thread
      thread = {
        id: threadId,
        title: `Thread ${threadId}`,
        rootComment: comment,
        comments: [comment],
        metadata: {
          createdAt: new Date(),
          lastActivity: new Date(),
          participantCount: 1,
          isResolved: false,
        },
      };
      this.threads.set(threadId, thread);
    } else {
      // Add to existing thread
      thread.comments.push(comment);
      thread.metadata.lastActivity = new Date();
      thread.metadata.participantCount = new Set(thread.comments.map(c => c.author.id)).size;
    }
  }

  /**
   * Remove comment from thread
   */
  private removeFromThread(threadId: string, commentId: string): void {
    const thread = this.threads.get(threadId);
    if (!thread) return;

    thread.comments = thread.comments.filter(c => c.id !== commentId);
    thread.metadata.lastActivity = new Date();
    thread.metadata.participantCount = new Set(thread.comments.map(c => c.author.id)).size;
  }

  /**
   * Update thread activity
   */
  private updateThreadActivity(threadId: string): void {
    const thread = this.threads.get(threadId);
    if (thread) {
      thread.metadata.lastActivity = new Date();
    }
  }

  /**
   * Emit event to subscribers
   */
  private emitEvent(event: CommentEvent): void {
    for (const callback of this.subscribers) {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in comment event subscriber:', error);
      }
    }
  }

  /**
   * Schedule auto-save
   */
  private scheduleAutoSave(): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.autoSaveTimeout = setTimeout(() => {
      this.saveToStorage();
    }, this.config.saveInterval);
  }

  private autoSaveTimeout: NodeJS.Timeout | null = null;

  /**
   * Save to storage
   */
  private saveToStorage(): void {
    try {
      const data = {
        comments: Array.from(this.comments.entries()),
        threads: Array.from(this.threads.entries()),
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem('commenting_system_data', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save commenting system data:', error);
    }
  }

  /**
   * Load from storage
   */
  loadFromStorage(): void {
    try {
      const savedData = localStorage.getItem('commenting_system_data');
      if (!savedData) return;

      const data = JSON.parse(savedData);
      
      // Restore comments
      if (data.comments) {
        this.comments = new Map(data.comments);
      }

      // Restore threads
      if (data.threads) {
        this.threads = new Map(data.threads);
      }

      console.log('Commenting system data loaded from storage');
    } catch (error) {
      console.error('Failed to load commenting system data:', error);
    }
  }
}

export type CommentEvent = 
  | { type: 'comment-added'; comment: Comment; timestamp: Date }
  | { type: 'comment-edited'; comment: Comment; timestamp: Date }
  | { type: 'comment-deleted'; comment: Comment; timestamp: Date }
  | { type: 'comment-replied'; comment: Comment; parentId: string; timestamp: Date }
  | { type: 'reaction-added'; commentId: string; reaction: CommentReaction; timestamp: Date }
  | { type: 'reaction-removed'; commentId: string; reaction: CommentReaction; timestamp: Date }
  | { type: 'thread-resolved'; threadId: string; resolvedBy: string; timestamp: Date };

// Global commenting system instance
export const commentingSystem = new CommentingSystem();

// Convenience functions
export const addComment = (comment: Omit<Comment, 'id' | 'timestamp'>) => commentingSystem.addComment(comment);
export const addCommentReply = (parentId: string, reply: Omit<Comment, 'id' | 'timestamp'>) => commentingSystem.addCommentReply(parentId, reply);
export const editComment = (commentId: string, updates: Partial<Comment>) => commentingSystem.editComment(commentId, updates);
export const deleteComment = (commentId: string) => commentingSystem.deleteComment(commentId);
export const addReaction = (commentId: string, reaction: Omit<CommentReaction, 'count' | 'users'> & { userId: string }) => commentingSystem.addReaction(commentId, reaction);
export const getComments = (filter?: CommentFilter) => commentingSystem.getComments(filter);
export const getCommentStats = () => commentingSystem.getStats();
