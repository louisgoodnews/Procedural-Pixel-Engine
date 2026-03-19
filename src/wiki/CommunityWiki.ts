/**
 * Community wiki system for user contributions
 * Provides collaborative documentation, tutorials, and knowledge base
 */

export interface WikiPage {
  id: string;
  title: string;
  content: WikiContent[];
  author: WikiAuthor;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  tags: string[];
  category: string;
  status: 'draft' | 'published' | 'archived' | 'deleted';
  visibility: 'public' | 'private' | 'restricted';
  permissions: WikiPermissions;
  metadata: WikiPageMetadata;
  revisions: WikiRevision[];
  comments: WikiComment[];
  relatedPages: string[];
  attachments: WikiAttachment[];
}

export interface WikiContent {
  type: 'text' | 'markdown' | 'code' | 'image' | 'video' | 'table' | 'toc' | 'warning' | 'note' | 'example' | 'snippet';
  data: string;
  language?: string;
  attributes?: Record<string, any>;
  children?: WikiContent[];
}

export interface WikiAuthor {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatar?: string;
  bio?: string;
  reputation: number;
  badges: string[];
  role: 'admin' | 'moderator' | 'editor' | 'contributor' | 'viewer';
  joinedAt: Date;
  lastActive: Date;
  contributions: number;
  socialLinks?: SocialLink[];
}

export interface SocialLink {
  platform: 'github' | 'twitter' | 'linkedin' | 'website' | 'discord' | 'youtube' | 'twitch';
  url: string;
  username?: string;
}

export interface WikiPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canComment: boolean;
  canCreate: boolean;
  canModerate: boolean;
  canUpload: boolean;
  canManageUsers: boolean;
  canChangeCategory: boolean;
  canChangeTags: boolean;
}

export interface WikiPageMetadata {
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedReadTime: number; // minutes
  prerequisites: string[];
  learningObjectives: string[];
  relatedTopics: string[];
  lastReviewedBy?: string;
  lastReviewedAt?: Date;
  reviewScore: number;
  featured: boolean;
  pinned: boolean;
  archivedAt?: Date;
  views?: number;
}

export interface WikiRevision {
  id: string;
  author: WikiAuthor;
  timestamp: Date;
  message: string;
  changes: WikiChange[];
  version: number;
  isMinor: boolean;
  isAutoSave: boolean;
}

export interface WikiChange {
  type: 'created' | 'updated' | 'deleted' | 'moved' | 'restored' | 'merged';
  description: string;
  oldContent?: string;
  newContent?: string;
  oldTitle?: string;
  newTitle?: string;
  category?: string;
  tags?: string[];
}

export interface WikiComment {
  id: string;
  author: WikiAuthor;
  content: string;
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
  replies: WikiComment[];
  reactions: CommentReaction[];
  parentId?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface CommentReaction {
  type: 'like' | 'dislike' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry' | 'custom';
  emoji?: string;
  count: number;
  users: string[];
}

export interface WikiAttachment {
  id: string;
  name: string;
  type: 'image' | 'file' | 'video' | 'audio' | 'document' | 'archive';
  url: string;
  size: number;
  mimeType: string;
  description?: string;
  uploadedBy: WikiAuthor;
  uploadedAt: Date;
  downloads: number;
}

export interface WikiCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  parent?: string;
  children: WikiCategory[];
  pages: string[];
  permissions: WikiPermissions;
  sortOrder: number;
}

export interface WikiSearchResult {
  page: WikiPage;
  score: number;
  highlights: string[];
  snippet: string;
  category: string;
  tags: string[];
}

export interface WikiConfig {
  enableEditing: boolean;
  enableComments: boolean;
  enableReactions: boolean;
  enableVersioning: boolean;
  enableAutoSave: boolean;
  autoSaveInterval: number; // milliseconds
  maxFileSize: number; // bytes
  allowedFileTypes: string[];
  enableModeration: boolean;
  requireApproval: boolean;
  enableNotifications: boolean;
  defaultVisibility: 'public' | 'private' | 'restricted';
  enableAnalytics: boolean;
  enableSearch: boolean;
  enableCategories: boolean;
  enableTags: boolean;
  maxRevisions: number;
  enableRealTimeCollaboration: boolean;
}

export interface WikiStats {
  totalPages: number;
  totalAuthors: number;
  totalComments: number;
  totalViews: number;
  totalEdits: number;
  totalRevisions: number;
  topContributors: WikiAuthor[];
  popularPages: WikiPage[];
  recentActivity: WikiActivity[];
  categories: WikiCategory[];
  tags: { [key: string]: number };
}

export interface WikiActivity {
  type: 'page_created' | 'page_updated' | 'page_deleted' | 'comment_added' | 'comment_updated' | 'user_joined' | 'user_left';
  timestamp: Date;
  author?: WikiAuthor;
  pageId?: string;
  commentId?: string;
  description: string;
}

export class CommunityWiki {
  private pages = new Map<string, WikiPage>();
  private categories = new Map<string, WikiCategory>();
  private users = new Map<string, WikiAuthor>();
  private config: WikiConfig;
  private currentUser: WikiAuthor | null = null;
  private searchIndex: Map<string, WikiPage[]> = new Map();
  private subscribers = new Set<(event: WikiEvent) => void>();
  private autoSaveTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<WikiConfig> = {}) {
    this.config = {
      enableEditing: true,
      enableComments: true,
      enableReactions: true,
      enableVersioning: true,
      enableAutoSave: true,
      autoSaveInterval: 30000, // 30 seconds
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedFileTypes: [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'text/plain', 'text/markdown', 'text/html',
        'application/pdf', 'application/json',
        'video/mp4', 'video/webm',
      ],
      enableModeration: true,
      requireApproval: false,
      enableNotifications: true,
      defaultVisibility: 'public',
      enableAnalytics: true,
      enableSearch: true,
      enableCategories: true,
      enableTags: true,
      maxRevisions: 50,
      enableRealTimeCollaboration: true,
      ...config,
    };
  }

  /**
   * Create a new wiki page
   */
  async createPage(page: Omit<WikiPage, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'revisions' | 'comments'>): Promise<WikiPage> {
    if (!this.config.enableEditing) {
      throw new Error('Wiki editing is disabled');
    }

    if (!this.currentUser) {
      throw new Error('User must be logged in to create pages');
    }

    const id = this.generatePageId();
    const now = new Date();
    
    const newPage: WikiPage = {
      id,
      title: page.title,
      content: page.content,
      author: this.currentUser,
      createdAt: now,
      updatedAt: now,
      version: 1,
      tags: page.tags || [],
      category: page.category || 'general',
      status: 'draft',
      visibility: page.visibility || this.config.defaultVisibility,
      permissions: this.getUserPermissions(),
      metadata: {
        ...page.metadata,
        difficulty: page.metadata?.difficulty || 'beginner',
        estimatedReadTime: page.metadata?.estimatedReadTime || 5,
      },
      revisions: [],
      comments: [],
      relatedPages: [],
      attachments: page.attachments || [],
    };

    this.pages.set(id, newPage);
    
    // Add to category
    this.addPageToCategory(newPage);
    
    // Update search index
    this.updateSearchIndex(newPage);
    
    // Start auto-save
    this.startAutoSave();
    
    this.emitEvent({
      type: 'page_created',
      timestamp: now,
      author: this.currentUser,
      pageId: id,
      description: `Created page: ${page.title}`,
    });

    return newPage;
  }

  /**
   * Update an existing wiki page
   */
  async updatePage(pageId: string, updates: Partial<WikiPage>): Promise<WikiPage> {
    if (!this.config.enableEditing) {
      throw new Error('Wiki editing is disabled');
    }

    const page = this.pages.get(pageId);
    if (!page) {
      throw new Error(`Page '${pageId}' not found`);
    }

    if (!this.canEdit(page)) {
      throw new Error('No permission to edit this page');
    }

    const now = new Date();
    const oldContent = JSON.stringify(page.content);
    const oldTitle = page.title;
    
    const updatedPage: WikiPage = {
      ...page,
      ...updates,
      updatedAt: now,
      version: page.version + 1,
      status: updates.status || page.status,
    };

    // Create revision
    const revision: WikiRevision = {
      id: this.generateRevisionId(),
      author: this.currentUser!,
      timestamp: now,
      message: this.generateRevisionMessage(updates, page),
      changes: this.generateChanges(updates, page),
      version: updatedPage.version,
      isMinor: (updates as any).isMinorChange || false,
      isAutoSave: false,
    };

    updatedPage.revisions = [revision, ...page.revisions].slice(0, this.config.maxRevisions - 1);

    this.pages.set(pageId, updatedPage);
    
    // Update search index
    this.updateSearchIndex(updatedPage);
    
    // Update category if changed
    if (updates.category && updates.category !== page.category) {
      this.removePageFromCategory(page);
      this.addPageToCategory(updatedPage);
    }

    this.emitEvent({
      type: 'page_updated',
      timestamp: now,
      author: this.currentUser!,
      pageId,
      description: `Updated page: ${page.title}`,
    });

    return updatedPage;
  }

  /**
   * Delete a wiki page
   */
  async deletePage(pageId: string): Promise<boolean> {
    const page = this.pages.get(pageId);
    if (!page) {
      return false;
    }

    if (!this.canDelete(page)) {
      throw new Error('No permission to delete this page');
    }

    // Remove from category
    this.removePageFromCategory(page);
    
    // Delete page
    this.pages.delete(pageId);
    
    // Update search index
    this.removeFromSearchIndex(pageId);

    this.emitEvent({
      type: 'page_deleted',
      timestamp: new Date(),
      author: this.currentUser!,
      pageId,
      description: `Deleted page: ${page.title}`,
    });

    return true;
  }

  /**
   * Get a wiki page by ID
   */
  getPage(pageId: string): WikiPage | undefined {
    return this.pages.get(pageId);
  }

  /**
   * Get all wiki pages
   */
  getAllPages(): WikiPage[] {
    return Array.from(this.pages.values());
  }

  /**
   * Get pages by category
   */
  getPagesByCategory(categoryId: string): WikiPage[] {
    const category = this.categories.get(categoryId);
    if (!category) return [];

    return category.pages
      .filter(pageId => this.pages.has(pageId))
      .map(pageId => this.pages.get(pageId)!)
      .filter(page => page !== undefined);
  }

  /**
   * Search wiki pages
   */
  searchPages(query: string, options?: WikiSearchOptions): WikiSearchResult[] {
    if (!this.config.enableSearch) {
      return [];
    }

    const searchOptions = {
      maxResults: 50,
      includeContent: true,
      includeCategories: true,
      includeTags: true,
      ...options,
    };

    const results: WikiSearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Search in titles
    for (const [pageId, page] of this.pages) {
      if (page.title.toLowerCase().includes(lowerQuery)) {
        const score = this.calculateSearchScore(page, query);
        if (score > 0) {
          results.push({
            page,
            score,
            highlights: this.highlightSearchTerms(page, query),
            snippet: this.generateSnippet(page, query),
            category: page.category,
            tags: page.tags,
          });
        }
      }
    }

    // Search in content
    for (const [pageId, page] of this.pages) {
      const contentText = this.extractTextFromContent(page.content);
      if (contentText.toLowerCase().includes(lowerQuery)) {
        const score = this.calculateSearchScore(page, query);
        if (score > 0) {
          results.push({
            page,
            score,
            highlights: this.highlightSearchTerms(page, query),
            snippet: this.generateSnippet(page, query),
            category: page.category,
            tags: page.tags,
          });
        }
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, searchOptions.maxResults);
  }

  /**
   * Create a new category
   */
  async createCategory(category: Omit<WikiCategory, 'id' | 'pages'>): Promise<WikiCategory> {
    if (!this.currentUser) {
      throw new Error('User must be logged in to create categories');
    }

    const id = this.generateCategoryId();
    const now = new Date();
    
    const newCategory: WikiCategory = {
      id,
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
      parent: category.parent,
      children: [],
      pages: [],
      permissions: this.getUserPermissions(),
      sortOrder: Date.now(),
    };

    this.categories.set(id, newCategory);

    this.emitEvent({
      type: 'category_created',
      timestamp: now,
      author: this.currentUser,
      description: `Created category: ${category.name}`,
    });

    return newCategory;
  }

  /**
   * Get all categories
   */
  getAllCategories(): WikiCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * Add comment to page
   */
  async addComment(pageId: string, comment: Omit<WikiComment, 'id' | 'timestamp'>): Promise<WikiComment> {
    const page = this.pages.get(pageId);
    if (!page) {
      throw new Error(`Page '${pageId}' not found`);
    }

    if (!this.config.enableComments) {
      throw new Error('Comments are disabled');
    }

    const id = this.generateCommentId();
    const now = new Date();
    
    const newComment: WikiComment = {
      id,
      author: this.currentUser!,
      content: comment.content,
      timestamp: now,
      replies: [],
      reactions: [],
      parentId: comment.parentId,
      resolved: false,
    };

    // Add comment to page
    page.comments = [...page.comments, newComment];
    
    this.emitEvent({
      type: 'comment_added',
      timestamp: now,
      author: this.currentUser!,
      commentId: id,
      pageId,
      description: `Added comment to page: ${page.title}`,
    });

    return newComment;
  }

  /**
   * Get wiki statistics
   */
  getStats(): WikiStats {
    const pages = Array.from(this.pages.values());
    const authors = Array.from(this.users.values());
    
    // Calculate statistics
    const totalPages = pages.length;
    const totalAuthors = authors.length;
    const totalComments = pages.reduce((sum, page) => sum + page.comments.length, 0);
    const totalViews = pages.reduce((sum, page) => sum + (page.metadata?.views || 0), 0);
    const totalEdits = pages.reduce((sum, page) => sum + page.revisions.length, 0);
    const totalRevisions = totalEdits;

    // Get top contributors
    const contributions = new Map<string, number>();
    for (const author of authors) {
      contributions.set(author.id, 0);
    }
    
    for (const page of pages) {
      const count = contributions.get(page.author.id) || 0;
      contributions.set(page.author.id, count + 1);
    }

    const topContributors = Array.from(contributions.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([authorId, count]) => authors.find(author => author.id === authorId)!);

    // Get popular pages
    const popularPages = pages
      .sort((a, b) => (b.metadata?.views || 0) - (a.metadata?.views || 0))
      .slice(0, 10);

    // Get recent activity
    const recentActivity = this.generateRecentActivity();

    // Get categories
    const categories = Array.from(this.categories.values());

    // Get tag counts
    const tags: { [key: string]: number } = {};
    for (const page of pages) {
      for (const tag of page.tags) {
        tags[tag] = (tags[tag] || 0) + 1;
      }
    }

    return {
      totalPages,
      totalAuthors,
      totalComments,
      totalViews,
      totalEdits,
      totalRevisions,
      topContributors,
      popularPages,
      recentActivity,
      categories,
      tags,
    };
  }

  /**
   * Subscribe to wiki events
   */
  subscribe(callback: (event: WikiEvent) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Set current user
   */
  setCurrentUser(user: WikiAuthor): void {
    this.currentUser = user;
  }

  /**
   * Get current user
   */
  getCurrentUser(): WikiAuthor | null {
    return this.currentUser;
  }

  /**
   * Export wiki data
   */
  async export(format: 'json' | 'markdown' | 'html'): Promise<string> {
    const data = {
      pages: Array.from(this.pages.entries()),
      categories: Array.from(this.categories.entries()),
      users: Array.from(this.users.entries()),
      stats: this.getStats(),
      exportedAt: new Date().toISOString(),
    };

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'markdown':
        return this.generateMarkdownExport(data);
      case 'html':
        return this.generateHTMLExport(data);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Private methods

  /**
   * Generate page ID
   */
  private generatePageId(): string {
    return `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate category ID
   */
  private generateCategoryId(): string {
    return `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate comment ID
   */
  private generateCommentId(): string {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate revision ID
   */
  private generateRevisionId(): string {
    return `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if user can edit page
   */
  private canEdit(page: WikiPage): boolean {
    if (!this.currentUser) return false;
    if (page.author.id === this.currentUser.id) return true;
    return page.permissions.canEdit;
  }

  /**
   * Check if user can delete page
   */
  private canDelete(page: WikiPage): boolean {
    if (!this.currentUser) return false;
    if (page.author.id === this.currentUser.id) return true;
    return page.permissions.canDelete;
  }

  /**
   * Get user permissions
   */
  private getUserPermissions(): WikiPermissions {
    if (!this.currentUser) {
      return {
        canEdit: false,
        canDelete: false,
        canComment: false,
        canCreate: false,
        canModerate: false,
        canUpload: false,
        canManageUsers: false,
        canChangeCategory: false,
        canChangeTags: false,
      };
    }

    // In a real implementation, this would check user role and permissions
    const role = this.currentUser.role;
    switch (role) {
      case 'admin':
        return {
          canEdit: true,
          canDelete: true,
          canComment: true,
          canCreate: true,
          canModerate: true,
          canUpload: true,
          canManageUsers: true,
          canChangeCategory: true,
          canChangeTags: true,
        };
      case 'moderator':
        return {
          canEdit: true,
          canDelete: true,
          canComment: true,
          canCreate: true,
          canModerate: true,
          canUpload: true,
          canManageUsers: false,
          canChangeCategory: true,
          canChangeTags: true,
        };
      case 'editor':
        return {
          canEdit: true,
          canDelete: false,
          canComment: true,
          canCreate: true,
          canModerate: false,
          canUpload: true,
          canManageUsers: false,
          canChangeCategory: true,
          canChangeTags: true,
        };
      case 'contributor':
        return {
          canEdit: true,
          canDelete: false,
          canComment: true,
          canCreate: true,
          canModerate: false,
          canUpload: false,
          canManageUsers: false,
          canChangeCategory: false,
          canChangeTags: true,
        };
      default: // viewer
        return {
          canEdit: false,
          canDelete: false,
          canComment: true,
          canCreate: false,
          canModerate: false,
          canUpload: false,
          canManageUsers: false,
          canChangeCategory: false,
          canChangeTags: false,
        };
    }
  }

  /**
   * Add page to category
   */
  private addPageToCategory(page: WikiPage): void {
    const category = this.categories.get(page.category);
    if (category && !category.pages.includes(page.id)) {
      category.pages.push(page.id);
    }
  }

  /**
   * Remove page from category
   */
  private removePageFromCategory(page: WikiPage): void {
    const category = this.categories.get(page.category);
    if (category) {
      category.pages = category.pages.filter(id => id !== page.id);
    }
  }

  /**
   * Update search index
   */
  private updateSearchIndex(page: WikiPage): void {
    const terms = this.extractSearchTerms(page);
    
    for (const term of terms) {
      if (!this.searchIndex.has(term)) {
        this.searchIndex.set(term, []);
      }
      
      const pages = this.searchIndex.get(term)!;
      if (!pages.find(p => p.id === page.id)) {
        pages.push(page);
      }
    }
  }

  /**
   * Remove from search index
   */
  private removeFromSearchIndex(pageId: string): void {
    for (const [term, pages] of this.searchIndex) {
      this.searchIndex.set(term, pages.filter(p => p.id !== pageId));
    }
  }

  /**
   * Extract search terms from page
   */
  private extractSearchTerms(page: WikiPage): string[] {
    const terms = new Set<string>();
    
    // Add title terms
    const titleWords = page.title.toLowerCase().split(/\s+/);
    for (const word of titleWords) {
      if (word.length > 2) {
        terms.add(word);
      }
    }
    
    // Add tag terms
    for (const tag of page.tags) {
      terms.add(tag.toLowerCase());
    }
    
    // Add content terms
    const contentText = this.extractTextFromContent(page.content);
    const contentWords = contentText.toLowerCase().split(/\s+/);
    for (const word of contentWords) {
      if (word.length > 3) {
        terms.add(word);
      }
    }
    
    return Array.from(terms);
  }

  /**
   * Extract text from content
   */
  private extractTextFromContent(content: WikiContent[]): string {
    return content
      .filter(item => item.type === 'text' || item.type === 'markdown')
      .map(item => item.data)
      .join(' ');
  }

  /**
   * Calculate search score
   */
  private calculateSearchScore(page: WikiPage, query: string): number {
    let score = 0;
    const lowerQuery = query.toLowerCase();
    
    // Title match
    if (page.title.toLowerCase() === lowerQuery) {
      score += 100;
    }
    
    // Tag matches
    for (const tag of page.tags) {
      if (tag.toLowerCase() === lowerQuery) {
        score += 50;
      }
    }
    
    // Content matches
    const contentText = this.extractTextFromContent(page.content);
    if (contentText.toLowerCase().includes(lowerQuery)) {
      score += 25;
    }
    
    return score;
  }

  /**
   * Highlight search terms
   */
  private highlightSearchTerms(page: WikiPage, query: string): string[] {
    const highlights: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    // Highlight in title
    const titleWords = page.title.toLowerCase().split(/\s+/);
    for (const word of titleWords) {
      if (word === lowerQuery) {
        highlights.push(`**${word}**`);
      }
    }
    
    // Highlight in tags
    for (const tag of page.tags) {
      if (tag.toLowerCase() === lowerQuery) {
        highlights.push(`\`${tag}\``);
      }
    }
    
    return highlights;
  }

  /**
   * Generate search snippet
   */
  private generateSnippet(page: WikiPage, query: string): string {
    const contentText = this.extractTextFromContent(page.content);
    const lowerQuery = query.toLowerCase();
    
    // Find first occurrence in content
    const index = contentText.toLowerCase().indexOf(lowerQuery);
    if (index === -1) {
      return page.title;
    }
    
    // Get context around match
    const start = Math.max(0, index - 50);
    const end = Math.min(contentText.length, index + query.length + 50);
    
    return contentText.substring(start, end) + '...';
  }

  /**
   * Generate revision message
   */
  private generateRevisionMessage(updates: Partial<WikiPage>, original: WikiPage): string {
    const changes: string[] = [];
    
    if (updates.title && updates.title !== original.title) {
      changes.push(`Title changed from "${original.title}" to "${updates.title}"`);
    }
    
    if (updates.content) {
      changes.push('Content updated');
    }
    
    if (updates.category && updates.category !== original.category) {
      changes.push(`Category changed from "${original.category}" to "${updates.category}"`);
    }
    
    if (updates.tags && !this.arraysEqual(updates.tags, original.tags)) {
      changes.push('Tags updated');
    }
    
    return changes.length > 0 ? changes.join(', ') : 'Page updated';
  }

  /**
   * Generate changes array
   */
  private generateChanges(updates: Partial<WikiPage>, original: WikiPage): WikiChange[] {
    const changes: WikiChange[] = [];
    
    if (updates.title && updates.title !== original.title) {
      changes.push({
        type: 'updated',
        description: `Title changed from "${original.title}" to "${updates.title}"`,
        oldTitle: original.title,
        newTitle: updates.title,
      });
    }
    
    if (updates.content) {
      changes.push({
        type: 'updated',
        description: 'Content updated',
        oldContent: JSON.stringify(original.content),
        newContent: JSON.stringify(updates.content),
      });
    }
    
    if (updates.category && updates.category !== original.category) {
      changes.push({
        type: 'moved',
        description: `Moved from "${original.category}" to "${updates.category}"`,
        oldContent: original.category,
        newContent: updates.category,
      });
    }
    
    if (updates.tags && !this.arraysEqual(updates.tags, original.tags)) {
      changes.push({
        type: 'updated',
        description: 'Tags updated',
        oldContent: original.tags.join(', '),
        newContent: updates.tags.join(', '),
      });
    }
    
    return changes;
  }

  /**
   * Check if arrays are equal
   */
  private arraysEqual(a: string[] | undefined, b: string[] | undefined): boolean {
    if (!a || !b) return a === b;
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }

  /**
   * Generate recent activity
   */
  private generateRecentActivity(): WikiActivity[] {
    const activities: WikiActivity[] = [];
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Add recent page activities
    for (const page of Array.from(this.pages.values())) {
      if (page.updatedAt && page.updatedAt > oneWeekAgo) {
        activities.push({
          type: 'page_updated',
          timestamp: page.updatedAt,
          author: page.author,
          pageId: page.id,
          description: `Page updated: ${page.title}`,
        });
      }
    }
    
    // Add recent comment activities
    for (const page of Array.from(this.pages.values())) {
      for (const comment of page.comments) {
        if (comment.timestamp > oneWeekAgo) {
          activities.push({
            type: 'comment_added',
            timestamp: comment.timestamp,
            author: comment.author,
            commentId: comment.id,
            pageId: page.id,
            description: `Comment added to page: ${page.title}`,
          });
        }
      }
    }
    
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20);
  }

  /**
   * Generate markdown export
   */
  private generateMarkdownExport(data: any): string {
    let markdown = '# Community Wiki Export\n\n';
    markdown += `Generated: ${new Date().toISOString()}\n\n`;
    
    // Export categories
    markdown += '## Categories\n\n';
    for (const [id, category] of data.categories) {
      markdown += `### ${category.name}\n\n`;
      markdown += `${category.description}\n\n`;
      markdown += `**Pages:** ${category.pages.length}\n\n`;
    }
    
    // Export pages
    markdown += '## Pages\n\n';
    for (const [id, page] of data.pages) {
      markdown += `### ${page.title}\n\n`;
      markdown += `**Author:** ${page.author.name}\n\n`;
      markdown += `**Created:** ${page.createdAt.toISOString()}\n\n`;
      markdown += `**Updated:** ${page.updatedAt.toISOString()}\n\n`;
      markdown += `**Category:** ${page.category}\n\n`;
      markdown += `**Tags:** ${page.tags.join(', ')}\n\n`;
      markdown += `**Status:** ${page.status}\n\n`;
      
      if (page.content.length > 0) {
        markdown += '## Content\n\n';
        for (const content of page.content) {
          markdown += this.exportContentToMarkdown(content);
        }
      }
      
      markdown += '---\n\n';
    }
    
    return markdown;
  }

  /**
   * Export content to markdown
   */
  private exportContentToMarkdown(content: WikiContent): string {
    switch (content.type) {
      case 'text':
      case 'markdown':
        return content.data;
      case 'code':
        return `\`\`\`${content.language}\n${content.data}\n\`\`\``;
      case 'image':
        return `![${content.attributes?.alt || ''}](${content.attributes?.src || ''})\n`;
      case 'table':
        return this.exportTableToMarkdown(content);
      default:
        return content.data;
    }
  }

  /**
   * Export table to markdown
   */
  private exportTableToMarkdown(content: WikiContent): string {
    if (!content.children || content.type !== 'table') return '';
    
    const headers = content.attributes?.headers || [];
    const rows = content.children || [];
    
    let markdown = '| ' + headers.join(' | ') + ' |\n';
    markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
    
    for (const row of rows) {
      markdown += '| ' + (row.children || []).map(child => 
        this.exportContentToMarkdown(child)
      ).join(' | ') + ' |\n';
    }
    
    return markdown + '\n';
  }

  /**
   * Generate HTML export
   */
  private generateHTMLExport(data: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Community Wiki Export</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
        .wiki-page { margin-bottom: 30px; border: 1px solid #ddd; border-radius: 8px; padding: 20px; }
        .wiki-page h2 { color: #333; margin-top: 0; }
        .wiki-content { margin-top: 15px; }
        .wiki-meta { color: #666; font-size: 0.9em; margin-top: 10px; }
    </style>
</head>
<body>
    <h1>Community Wiki</h1>
    <p>Generated: ${new Date().toISOString()}</p>
    
    ${data.categories.map(([id, category]: [string, any]) => `
        <div class="wiki-category">
            <h2>${category.name}</h2>
            <p>${category.description}</p>
            <div class="wiki-meta">Pages: ${category.pages.length}</div>
        </div>
    `).join('')}
    
    ${data.pages.map(([id, page]: [string, any]) => `
        <div class="wiki-page">
            <h2>${page.title}</h2>
            <div class="wiki-meta">
                <p><strong>Author:</strong> ${page.author.name}</p>
                <p><strong>Created:</strong> ${page.createdAt.toLocaleString()}</p>
                <p><strong>Updated:</strong> ${page.updatedAt.toLocaleString()}</p>
                <p><strong>Category:</strong> ${page.category}</p>
                <p><strong>Tags:</strong> ${page.tags.join(', ')}</p>
                <p><strong>Status:</strong> ${page.status}</p>
            </div>
            <div class="wiki-content">
                ${page.content.map((content: any) => this.exportContentToHTML(content)).join('')}
            </div>
        </div>
    `).join('')}
</body>
</html>`;
  }

  /**
   * Export content to HTML
   */
  private exportContentToHTML(content: WikiContent): string {
    switch (content.type) {
      case 'text':
      case 'markdown':
        return `<div class="wiki-text">${content.data}</div>`;
      case 'code':
        return `<pre><code class="wiki-code language-${content.language || 'text'}">${content.data}</code></pre>`;
      case 'image':
        return `<img src="${content.attributes?.src || ''}" alt="${content.attributes?.alt || ''}" class="wiki-image" />`;
      case 'table':
        return this.exportTableToHTML(content);
      default:
        return `<div class="wiki-content">${content.data}</div>`;
    }
  }

  /**
   * Export table to HTML
   */
  private exportTableToHTML(content: WikiContent): string {
    if (!content.children || content.type !== 'table') return '';
    
    const headers = content.attributes?.headers || [];
    const rows = content.children || [];
    
    let html = '<table class="wiki-table">';
    
    // Render headers
    if (headers.length > 0) {
      html += '<thead><tr>';
      for (const header of headers) {
        html += `<th>${header}</th>`;
      }
      html += '</tr></thead>';
    }
    
    // Render rows
    html += '<tbody>';
    for (const row of rows) {
      html += '<tr>';
      for (const cell of row.children || []) {
        html += `<td>${this.exportContentToHTML(cell)}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    
    return html;
  }

  /**
   * Emit event to subscribers
   */
  private emitEvent(event: WikiEvent): void {
    for (const callback of this.subscribers) {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in wiki event subscriber:', error);
      }
    }
  }

  /**
   * Start auto-save
   */
  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(() => {
      this.saveToStorage();
    }, this.config.autoSaveInterval);
  }

  /**
   * Save to storage
   */
  private saveToStorage(): void {
    try {
      const data = {
        pages: Array.from(this.pages.entries()),
        categories: Array.from(this.categories.entries()),
        users: Array.from(this.users.entries()),
        stats: this.getStats(),
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem('community_wiki_data', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save wiki data:', error);
    }
  }

  /**
   * Load from storage
   */
  loadFromStorage(): void {
    try {
      const savedData = localStorage.getItem('community_wiki_data');
      if (!savedData) return;

      const data = JSON.parse(savedData);
      
      // Restore pages
      if (data.pages) {
        this.pages = new Map(data.pages);
      }

      // Restore categories
      if (data.categories) {
        this.categories = new Map(data.categories);
      }

      // Restore users
      if (data.users) {
        this.users = new Map(data.users);
      }

      console.log('Wiki data loaded from storage');
    } catch (error) {
      console.error('Failed to load wiki data:', error);
    }
  }
}

export interface WikiSearchOptions {
  maxResults?: number;
  includeContent?: boolean;
  includeCategories?: boolean;
  includeTags?: boolean;
}

export type WikiEvent = 
  | { type: 'page_created'; timestamp: Date; author: WikiAuthor; pageId: string; description: string }
  | { type: 'page_updated'; timestamp: Date; author: WikiAuthor; pageId: string; description: string }
  | { type: 'page_deleted'; timestamp: Date; author: WikiAuthor; pageId: string; description: string }
  | { type: 'comment_added'; timestamp: Date; author: WikiAuthor; commentId: string; pageId: string; description: string }
  | { type: 'category_created'; timestamp: Date; author: WikiAuthor; description: string }
  | { type: 'user_joined'; timestamp: Date; author: WikiAuthor; description: string }
  | { type: 'user_left'; timestamp: Date; author: WikiAuthor; description: string };

// Global community wiki instance
export const communityWiki = new CommunityWiki();

// Convenience functions
export const createWikiPage = (page: Omit<WikiPage, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'revisions' | 'comments'>) => communityWiki.createPage(page);
export const updateWikiPage = (pageId: string, updates: Partial<WikiPage>) => communityWiki.updatePage(pageId, updates);
export const deleteWikiPage = (pageId: string) => communityWiki.deletePage(pageId);
export const getWikiPage = (pageId: string) => communityWiki.getPage(pageId);
export const getAllWikiPages = () => communityWiki.getAllPages();
export const searchWikiPages = (query: string, options?: WikiSearchOptions) => communityWiki.searchPages(query, options);
export const getWikiStats = () => communityWiki.getStats();
export const setWikiUser = (user: WikiAuthor) => communityWiki.setCurrentUser(user);
export const getWikiUser = () => communityWiki.getCurrentUser();
export const exportWiki = (format: 'json' | 'markdown' | 'html') => communityWiki.export(format);
