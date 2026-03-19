/**
 * Visual Diff System
 * Provides visual diff capabilities for assets and scenes
 */

import { GitDiff, GitDiffHunk, GitDiffLine } from './GitIntegration';
import { createEngineError, validators } from '../utils/ErrorHandling';

export interface VisualDiffOptions {
  showWhitespace?: boolean;
  ignoreWhitespace?: boolean;
  contextLines?: number;
  sideBySide?: boolean;
  highlightSyntax?: boolean;
  wordDiff?: boolean;
}

export interface DiffResult {
  file: string;
  type: 'text' | 'image' | 'binary' | 'scene' | 'asset';
  oldContent?: string;
  newContent?: string;
  hunks: VisualDiffHunk[];
  statistics: DiffStatistics;
  renderable: RenderableDiff;
}

export interface VisualDiffHunk {
  oldStart: number;
  oldLinesCount: number;
  newStart: number;
  newLinesCount: number;
  oldLines: VisualDiffLine[];
  newLines: VisualDiffLine[];
  changes: DiffChange[];
}

export interface VisualDiffLine extends GitDiffLine {
  lineNumber?: number;
  content: string;
  htmlContent?: string;
  changes?: DiffChange[];
}

export interface DiffChange {
  type: 'addition' | 'deletion' | 'modification';
  position: number;
  oldContent?: string;
  newContent?: string;
  wordChanges?: WordChange[];
}

export interface WordChange {
  type: 'addition' | 'deletion';
  word: string;
  position: number;
}

export interface DiffStatistics {
  additions: number;
  deletions: number;
  modifications: number;
  totalChanges: number;
  similarity: number;
}

export interface RenderableDiff {
  html: string;
  css: string;
  javascript?: string;
  metadata: DiffMetadata;
}

export interface DiffMetadata {
  generatedAt: Date;
  generator: string;
  options: VisualDiffOptions;
  fileType: string;
  encoding: string;
}

export interface ImageDiff {
  oldImage?: string; // base64 or URL
  newImage?: string; // base64 or URL
  comparison: ImageComparison;
  renderable: RenderableImageDiff;
}

export interface ImageComparison {
  dimensions: { old: { width: number; height: number }; new: { width: number; height: number } };
  format: { old: string; new: string };
  size: { old: number; new: number };
  similarity: number;
  diffImage?: string; // base64
}

export interface RenderableImageDiff {
  html: string;
  css: string;
  slider?: boolean; // side-by-side slider comparison
  overlay?: boolean; // overlay comparison
  animation?: boolean; // fade between images
}

export interface SceneDiff {
  oldScene?: SceneData;
  newScene?: SceneData;
  entityChanges: EntityChange[];
  componentChanges: ComponentChange[];
  renderable: RenderableSceneDiff;
}

export interface SceneData {
  entities: EntityData[];
  components: ComponentData[];
  metadata: SceneMetadata;
}

export interface EntityData {
  id: string;
  type: string;
  components: Record<string, any>;
  children?: string[];
}

export interface ComponentData {
  type: string;
  data: any;
  schema?: ComponentSchema;
}

export interface ComponentSchema {
  properties: Record<string, PropertySchema>;
}

export interface PropertySchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  default?: any;
}

export interface SceneMetadata {
  name: string;
  version: string;
  created: Date;
  modified: Date;
}

export interface EntityChange {
  type: 'added' | 'removed' | 'modified';
  entityId: string;
  oldEntity?: EntityData;
  newEntity?: EntityData;
  componentChanges: ComponentChange[];
}

export interface ComponentChange {
  type: 'added' | 'removed' | 'modified';
  componentType: string;
  entityId: string;
  oldComponent?: ComponentData;
  newComponent?: ComponentData;
  propertyChanges: PropertyChange[];
}

export interface PropertyChange {
  type: 'added' | 'removed' | 'modified';
  property: string;
  oldValue?: any;
  newValue?: any;
  changeType: 'primitive' | 'object' | 'array' | 'string' | 'number' | 'boolean';
}

export interface RenderableSceneDiff {
  html: string;
  css: string;
  javascript: string;
  interactive: boolean;
  components: SceneDiffComponent[];
}

export interface SceneDiffComponent {
  type: 'entity-tree' | 'component-inspector' | 'property-diff' | '3d-viewport';
  data: any;
}

export class VisualDiffSystem {
  private diffCache = new Map<string, DiffResult>();
  private imageCache = new Map<string, ImageDiff>();
  private sceneCache = new Map<string, SceneDiff>();

  constructor() {
    this.initializeDefaultOptions();
  }

  /**
   * Create visual diff for Git diff
   */
  async createDiff(gitDiff: GitDiff, options: VisualDiffOptions = {}): Promise<DiffResult> {
    validators.notNull(gitDiff);
    validators.notEmpty(gitDiff.file);

    try {
      const cacheKey = this.generateCacheKey(gitDiff, options);
      
      if (this.diffCache.has(cacheKey)) {
        return this.diffCache.get(cacheKey)!;
      }

      const fileType = this.detectFileType(gitDiff.file);
      let result: DiffResult;

      switch (fileType) {
        case 'image':
          result = await this.createImageDiff(gitDiff, options);
          break;
        case 'scene':
          result = await this.createSceneDiff(gitDiff, options);
          break;
        case 'text':
        default:
          result = await this.createTextDiff(gitDiff, options);
          break;
      }

      this.diffCache.set(cacheKey, result);
      return result;
    } catch (error) {
      throw createEngineError(
        `Failed to create visual diff for ${gitDiff.file}: ${error}`,
        'VISUAL_DIFF_FAILED',
        'system',
        'medium'
      );
    }
  }

  /**
   * Create text diff with visual highlighting
   */
  async createTextDiff(
    gitDiff: GitDiff,
    options: VisualDiffOptions = {}
  ): Promise<DiffResult> {
    const mergedOptions = { ...this.getDefaultOptions(), ...options };

    try {
      const hunks = await this.processTextHunks(gitDiff.hunks, mergedOptions);
      const statistics = this.calculateStatistics(hunks);
      const renderable = await this.renderTextDiff(gitDiff.file, hunks, mergedOptions);

      return {
        file: gitDiff.file,
        type: 'text',
        hunks,
        statistics,
        renderable
      };
    } catch (error) {
      throw createEngineError(
        `Failed to create text diff: ${error}`,
        'TEXT_DIFF_FAILED',
        'system',
        'medium'
      );
    }
  }

  /**
   * Create image diff with visual comparison
   */
  async createImageDiff(
    gitDiff: GitDiff,
    options: VisualDiffOptions = {}
  ): Promise<DiffResult> {
    try {
      const imageDiff = await this.compareImages(gitDiff.oldPath || gitDiff.file, gitDiff.newPath || gitDiff.file);
      const renderable = await this.renderImageDiff(imageDiff, options);

      return {
        file: gitDiff.file,
        type: 'image',
        hunks: [],
        statistics: {
          additions: 0,
          deletions: 0,
          modifications: 1,
          totalChanges: 1,
          similarity: imageDiff.comparison.similarity
        },
        renderable
      };
    } catch (error) {
      throw createEngineError(
        `Failed to create image diff: ${error}`,
        'IMAGE_DIFF_FAILED',
        'system',
        'medium'
      );
    }
  }

  /**
   * Create scene diff for entity-component system data
   */
  async createSceneDiff(
    gitDiff: GitDiff,
    options: VisualDiffOptions = {}
  ): Promise<DiffResult> {
    try {
      const oldContent = gitDiff.oldPath ? await this.readFile(gitDiff.oldPath) : '';
      const newContent = gitDiff.newPath ? await this.readFile(gitDiff.newPath) : '';

      const oldScene = oldContent ? this.parseSceneData(oldContent) : undefined;
      const newScene = newContent ? this.parseSceneData(newContent) : undefined;

      const sceneDiff = this.compareScenes(oldScene, newScene);
      const renderable = await this.renderSceneDiff(sceneDiff, options);

      return {
        file: gitDiff.file,
        type: 'scene',
        oldContent,
        newContent,
        hunks: [],
        statistics: this.calculateSceneStatistics(sceneDiff),
        renderable
      };
    } catch (error) {
      throw createEngineError(
        `Failed to create scene diff: ${error}`,
        'SCENE_DIFF_FAILED',
        'system',
        'medium'
      );
    }
  }

  /**
   * Create side-by-side comparison
   */
  async createSideBySideDiff(
    oldContent: string,
    newContent: string,
    options: VisualDiffOptions = {}
  ): Promise<DiffResult> {
    try {
      const hunks = await this.createSideBySideHunks(oldContent, newContent, options);
      const statistics = this.calculateStatistics(hunks);
      const renderable = await this.renderSideBySideDiff(hunks, options);

      return {
        file: 'side-by-side',
        type: 'text',
        oldContent,
        newContent,
        hunks,
        statistics,
        renderable
      };
    } catch (error) {
      throw createEngineError(
        `Failed to create side-by-side diff: ${error}`,
        'SIDE_BY_SIDE_DIFF_FAILED',
        'system',
        'medium'
      );
    }
  }

  /**
   * Generate diff statistics
   */
  generateStatistics(diffs: DiffResult[]): {
    totalFiles: number;
    totalChanges: number;
    additions: number;
    deletions: number;
    modifications: number;
    fileTypes: Record<string, number>;
  } {
    const stats = {
      totalFiles: diffs.length,
      totalChanges: 0,
      additions: 0,
      deletions: 0,
      modifications: 0,
      fileTypes: {} as Record<string, number>
    };

    for (const diff of diffs) {
      stats.totalChanges += diff.statistics.totalChanges;
      stats.additions += diff.statistics.additions;
      stats.deletions += diff.statistics.deletions;
      stats.modifications += diff.statistics.modifications;

      const fileType = this.detectFileType(diff.file);
      stats.fileTypes[fileType] = (stats.fileTypes[fileType] || 0) + 1;
    }

    return stats;
  }

  /**
   * Clear diff cache
   */
  clearCache(): void {
    this.diffCache.clear();
    this.imageCache.clear();
    this.sceneCache.clear();
  }

  // Private methods

  private initializeDefaultOptions(): void {
    // Initialize any default options
  }

  private getDefaultOptions(): VisualDiffOptions {
    return {
      showWhitespace: false,
      ignoreWhitespace: false,
      contextLines: 3,
      sideBySide: false,
      highlightSyntax: true,
      wordDiff: false
    };
  }

  private generateCacheKey(gitDiff: GitDiff, options: VisualDiffOptions): string {
    return `${gitDiff.file}-${JSON.stringify(options)}-${gitDiff.hunks.length}`;
  }

  private detectFileType(filename: string): 'text' | 'image' | 'scene' | 'binary' | 'asset' {
    const ext = filename.split('.').pop()?.toLowerCase();

    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'].includes(ext || '')) {
      return 'image';
    }

    if (['scene', 'entity', 'component'].includes(ext || '')) {
      return 'scene';
    }

    if (['json', 'js', 'ts', 'md', 'txt', 'html', 'css', 'xml', 'yaml', 'yml'].includes(ext || '')) {
      return 'text';
    }

    return 'binary';
  }

  private async processTextHunks(
    hunks: GitDiffHunk[],
    options: VisualDiffOptions
  ): Promise<VisualDiffHunk[]> {
    const visualHunks: VisualDiffHunk[] = [];

    for (const hunk of hunks) {
      const visualHunk: VisualDiffHunk = {
        ...hunk,
        oldLines: [],
        newLines: [],
        changes: []
      };

      // Process lines based on diff type
      let oldLineNumber = hunk.oldStart;
      let newLineNumber = hunk.newStart;

      for (const line of hunk.lines) {
        const visualLine: VisualDiffLine = {
          ...line,
          lineNumber: line.type === 'removed' ? oldLineNumber : newLineNumber,
          content: line.content,
          htmlContent: this.escapeHtml(line.content)
        };

        if (line.type === 'removed') {
          visualHunk.oldLines.push(visualLine);
          oldLineNumber++;
        } else if (line.type === 'added') {
          visualHunk.newLines.push(visualLine);
          newLineNumber++;
        } else {
          visualHunk.oldLines.push(visualLine);
          visualHunk.newLines.push(visualLine);
          oldLineNumber++;
          newLineNumber++;
        }
      }

      // Generate changes
      visualHunk.changes = this.generateChanges(visualHunk);
      visualHunks.push(visualHunk);
    }

    return visualHunks;
  }

  private generateChanges(hunk: VisualDiffHunk): DiffChange[] {
    const changes: DiffChange[] = [];

    // Simple change generation - could be enhanced with word diff
    for (let i = 0; i < Math.max(hunk.oldLines.length, hunk.newLines.length); i++) {
      const oldLine = hunk.oldLines[i];
      const newLine = hunk.newLines[i];

      if (!oldLine && newLine) {
        changes.push({
          type: 'addition',
          position: i,
          newContent: newLine.content
        });
      } else if (oldLine && !newLine) {
        changes.push({
          type: 'deletion',
          position: i,
          oldContent: oldLine.content
        });
      } else if (oldLine && newLine && oldLine.content !== newLine.content) {
        changes.push({
          type: 'modification',
          position: i,
          oldContent: oldLine.content,
          newContent: newLine.content
        });
      }
    }

    return changes;
  }

  private calculateStatistics(hunks: VisualDiffHunk[]): DiffStatistics {
    let additions = 0;
    let deletions = 0;
    let modifications = 0;

    for (const hunk of hunks) {
      for (const change of hunk.changes) {
        switch (change.type) {
          case 'addition':
            additions++;
            break;
          case 'deletion':
            deletions++;
            break;
          case 'modification':
            modifications++;
            break;
        }
      }
    }

    const totalChanges = additions + deletions + modifications;
    const similarity = totalChanges === 0 ? 1 : Math.max(0, 1 - totalChanges / 1000);

    return {
      additions,
      deletions,
      modifications,
      totalChanges,
      similarity
    };
  }

  private async renderTextDiff(
    filename: string,
    hunks: VisualDiffHunk[],
    options: VisualDiffOptions
  ): Promise<RenderableDiff> {
    const html = this.generateTextDiffHtml(filename, hunks, options);
    const css = this.generateTextDiffCss(options);

    return {
      html,
      css,
      metadata: {
        generatedAt: new Date(),
        generator: 'VisualDiffSystem',
        options,
        fileType: this.detectFileType(filename),
        encoding: 'utf-8'
      }
    };
  }

  private generateTextDiffHtml(
    filename: string,
    hunks: VisualDiffHunk[],
    options: VisualDiffOptions
  ): string {
    let html = `<div class="visual-diff" data-file="${filename}">`;
    html += `<div class="diff-header">`;
    html += `<h3>${filename}</h3>`;
    html += `<div class="diff-stats">`;
    
    const stats = this.calculateStatistics(hunks);
    html += `<span class="additions">+${stats.additions}</span>`;
    html += `<span class="deletions">-${stats.deletions}</span>`;
    html += `<span class="modifications">~${stats.modifications}</span>`;
    
    html += `</div></div>`;
    html += `<div class="diff-content">`;

    for (const hunk of hunks) {
      html += `<div class="diff-hunk" data-start="${hunk.oldStart}" data-end="${hunk.oldStart + hunk.oldLines.length}">`;
      html += `<div class="hunk-header">`;
      html += `@@ -${hunk.oldStart},${hunk.oldLines.length} +${hunk.newStart},${hunk.newLines.length} @@`;
      html += `</div>`;

      if (options.sideBySide) {
        html += this.renderSideBySideHunk(hunk);
      } else {
        html += this.renderUnifiedHunk(hunk);
      }

      html += `</div>`;
    }

    html += `</div></div>`;
    return html;
  }

  private renderUnifiedHunk(hunk: VisualDiffHunk): string {
    let html = '<div class="unified-diff">';
    
    const maxLines = Math.max(hunk.oldLines.length, hunk.newLines.length);
    for (let i = 0; i < maxLines; i++) {
      const oldLine = hunk.oldLines[i];
      const newLine = hunk.newLines[i];

      if (oldLine && newLine) {
        if (oldLine.type === 'context' && newLine.type === 'context') {
          html += `<div class="line context">${oldLine.htmlContent}</div>`;
        } else if (oldLine.type === 'removed' && newLine.type === 'added') {
          html += `<div class="line removed">${oldLine.htmlContent}</div>`;
          html += `<div class="line added">${newLine.htmlContent}</div>`;
        }
      } else if (oldLine) {
        html += `<div class="line removed">${oldLine.htmlContent}</div>`;
      } else if (newLine) {
        html += `<div class="line added">${newLine.htmlContent}</div>`;
      }
    }

    html += '</div>';
    return html;
  }

  private renderSideBySideHunk(hunk: VisualDiffHunk): string {
    let html = '<div class="side-by-side-diff">';
    html += '<div class="old-content">';
    
    for (const line of hunk.oldLines) {
      html += `<div class="line ${line.type}">${line.htmlContent}</div>`;
    }
    
    html += '</div><div class="new-content">';
    
    for (const line of hunk.newLines) {
      html += `<div class="line ${line.type}">${line.htmlContent}</div>`;
    }
    
    html += '</div></div>';
    return html;
  }

  private generateTextDiffCss(options: VisualDiffOptions): string {
    return `
      .visual-diff {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 12px;
        line-height: 1.4;
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: hidden;
      }
      
      .diff-header {
        background: #f5f5f5;
        padding: 8px 12px;
        border-bottom: 1px solid #ddd;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .diff-stats span {
        margin-left: 12px;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 11px;
      }
      
      .additions { background: #d4edda; color: #155724; }
      .deletions { background: #f8d7da; color: #721c24; }
      .modifications { background: #fff3cd; color: #856404; }
      
      .diff-content {
        max-height: 500px;
        overflow-y: auto;
      }
      
      .diff-hunk {
        border-bottom: 1px solid #eee;
      }
      
      .hunk-header {
        background: #f8f9fa;
        padding: 4px 12px;
        font-size: 11px;
        color: #666;
        border-bottom: 1px solid #eee;
      }
      
      .line {
        padding: 0 12px;
        white-space: pre-wrap;
        word-break: break-all;
      }
      
      .line.context { background: transparent; }
      .line.added { background: #e6ffed; }
      .line.removed { background: #ffeef0; }
      
      .side-by-side-diff {
        display: flex;
      }
      
      .old-content, .new-content {
        flex: 1;
      }
      
      .old-content {
        border-right: 1px solid #ddd;
      }
    `;
  }

  private async compareImages(oldPath: string, newPath: string): Promise<ImageDiff> {
    // Mock implementation - in reality would use image processing libraries
    return {
      oldImage: oldPath,
      newImage: newPath,
      comparison: {
        dimensions: {
          old: { width: 100, height: 100 },
          new: { width: 100, height: 100 }
        },
        format: { old: 'png', new: 'png' },
        size: { old: 1024, new: 1024 },
        similarity: 0.95
      },
      renderable: {
        html: '<div class="image-diff">Image comparison placeholder</div>',
        css: '.image-diff { border: 1px solid #ccc; }',
        slider: true,
        overlay: true,
        animation: true
      }
    };
  }

  private async renderImageDiff(imageDiff: ImageDiff, options: VisualDiffOptions): Promise<RenderableDiff> {
    return {
      html: imageDiff.renderable.html,
      css: imageDiff.renderable.css,
      metadata: {
        generatedAt: new Date(),
        generator: 'VisualDiffSystem',
        options,
        fileType: 'image',
        encoding: 'binary'
      }
    };
  }

  private parseSceneData(content: string): SceneData {
    try {
      return JSON.parse(content);
    } catch (error) {
      throw createEngineError(
        `Failed to parse scene data: ${error}`,
        'SCENE_PARSE_FAILED',
        'system',
        'medium'
      );
    }
  }

  private compareScenes(oldScene?: SceneData, newScene?: SceneData): SceneDiff {
    const entityChanges: EntityChange[] = [];
    const componentChanges: ComponentChange[] = [];

    if (oldScene && newScene) {
      // Compare entities
      const oldEntities = new Map(oldScene.entities.map(e => [e.id, e]));
      const newEntities = new Map(newScene.entities.map(e => [e.id, e]));

      // Find added entities
      for (const [id, entity] of newEntities) {
        if (!oldEntities.has(id)) {
          entityChanges.push({
            type: 'added',
            entityId: id,
            newEntity: entity,
            componentChanges: []
          });
        }
      }

      // Find removed entities
      for (const [id, entity] of oldEntities) {
        if (!newEntities.has(id)) {
          entityChanges.push({
            type: 'removed',
            entityId: id,
            oldEntity: entity,
            componentChanges: []
          });
        }
      }

      // Find modified entities
      for (const [id, oldEntity] of oldEntities) {
        const newEntity = newEntities.get(id);
        if (newEntity) {
          const componentChanges = this.compareEntityComponents(oldEntity, newEntity);
          if (componentChanges.length > 0) {
            entityChanges.push({
              type: 'modified',
              entityId: id,
              oldEntity,
              newEntity,
              componentChanges
            });
          }
        }
      }
    }

    return {
      oldScene,
      newScene,
      entityChanges,
      componentChanges,
      renderable: {
        html: '<div class="scene-diff">Scene diff placeholder</div>',
        css: '.scene-diff { border: 1px solid #ccc; }',
        javascript: '',
        interactive: true,
        components: []
      }
    };
  }

  private compareEntityComponents(oldEntity: EntityData, newEntity: EntityData): ComponentChange[] {
    const changes: ComponentChange[] = [];

    const oldComponents = oldEntity.components;
    const newComponents = newEntity.components;

    // Find added components
    for (const [type, data] of Object.entries(newComponents)) {
      if (!(type in oldComponents)) {
        changes.push({
          type: 'added',
          componentType: type,
          entityId: oldEntity.id,
          newComponent: { type, data },
          propertyChanges: []
        });
      }
    }

    // Find removed components
    for (const [type, data] of Object.entries(oldComponents)) {
      if (!(type in newComponents)) {
        changes.push({
          type: 'removed',
          componentType: type,
          entityId: oldEntity.id,
          oldComponent: { type, data },
          propertyChanges: []
        });
      }
    }

    // Find modified components
    for (const [type, oldData] of Object.entries(oldComponents)) {
      if (type in newComponents) {
        const newData = newComponents[type];
        if (JSON.stringify(oldData) !== JSON.stringify(newData)) {
          changes.push({
            type: 'modified',
            componentType: type,
            entityId: oldEntity.id,
            oldComponent: { type, data: oldData },
            newComponent: { type, data: newData },
            propertyChanges: this.compareComponentProperties(oldData, newData)
          });
        }
      }
    }

    return changes;
  }

  private compareComponentProperties(oldData: any, newData: any): PropertyChange[] {
    const changes: PropertyChange[] = [];

    const oldKeys = new Set(Object.keys(oldData));
    const newKeys = new Set(Object.keys(newData));

    // Find added properties
    for (const key of newKeys) {
      if (!oldKeys.has(key)) {
        changes.push({
          type: 'added',
          property: key,
          newValue: newData[key],
          changeType: typeof newData[key]
        });
      }
    }

    // Find removed properties
    for (const key of oldKeys) {
      if (!newKeys.has(key)) {
        changes.push({
          type: 'removed',
          property: key,
          oldValue: oldData[key],
          changeType: typeof oldData[key]
        });
      }
    }

    // Find modified properties
    for (const key of oldKeys) {
      if (newKeys.has(key)) {
        const oldValue = oldData[key];
        const newValue = newData[key];
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes.push({
            type: 'modified',
            property: key,
            oldValue,
            newValue,
            changeType: typeof newValue
          });
        }
      }
    }

    return changes;
  }

  private calculateSceneStatistics(sceneDiff: SceneDiff): DiffStatistics {
    let additions = 0;
    let deletions = 0;
    let modifications = 0;

    for (const change of sceneDiff.entityChanges) {
      switch (change.type) {
        case 'added':
          additions++;
          break;
        case 'removed':
          deletions++;
          break;
        case 'modified':
          modifications++;
          break;
      }
    }

    const totalChanges = additions + deletions + modifications;
    const similarity = totalChanges === 0 ? 1 : Math.max(0, 1 - totalChanges / 100);

    return {
      additions,
      deletions,
      modifications,
      totalChanges,
      similarity
    };
  }

  private async renderSceneDiff(sceneDiff: SceneDiff, options: VisualDiffOptions): Promise<RenderableDiff> {
    return {
      html: sceneDiff.renderable.html,
      css: sceneDiff.renderable.css,
      javascript: sceneDiff.renderable.javascript,
      metadata: {
        generatedAt: new Date(),
        generator: 'VisualDiffSystem',
        options,
        fileType: 'scene',
        encoding: 'utf-8'
      }
    };
  }

  private async createSideBySideHunks(
    oldContent: string,
    newContent: string,
    options: VisualDiffOptions
  ): Promise<VisualDiffHunk[]> {
    // Simplified side-by-side hunk creation
    // In reality would use proper diff algorithm
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');

    const hunk: VisualDiffHunk = {
      oldStart: 1,
      oldLines: oldLines.length,
      newStart: 1,
      newLines: newLines.length,
      lines: [],
      oldLines: oldLines.map((line, i) => ({
        type: 'context',
        content: line,
        lineNumber: i + 1,
        htmlContent: this.escapeHtml(line)
      })),
      newLines: newLines.map((line, i) => ({
        type: 'context',
        content: line,
        lineNumber: i + 1,
        htmlContent: this.escapeHtml(line)
      })),
      changes: []
    };

    return [hunk];
  }

  private async renderSideBySideDiff(hunks: VisualDiffHunk[], options: VisualDiffOptions): Promise<RenderableDiff> {
    const html = this.generateSideBySideHtml(hunks, options);
    const css = this.generateTextDiffCss(options);

    return {
      html,
      css,
      metadata: {
        generatedAt: new Date(),
        generator: 'VisualDiffSystem',
        options,
        fileType: 'text',
        encoding: 'utf-8'
      }
    };
  }

  private generateSideBySideHtml(hunks: VisualDiffHunk[], options: VisualDiffOptions): string {
    let html = '<div class="side-by-side-comparison">';
    html += '<div class="old-panel"><h4>Old Version</h4>';

    for (const hunk of hunks) {
      html += this.renderSideBySideHunk(hunk);
    }

    html += '</div><div class="new-panel"><h4>New Version</h4>';

    for (const hunk of hunks) {
      html += this.renderSideBySideHunk(hunk);
    }

    html += '</div></div>';
    return html;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private async readFile(path: string): Promise<string> {
    // Mock implementation - in reality would read from file system
    return '';
  }
}

// Factory function
export function createVisualDiffSystem(): VisualDiffSystem {
  return new VisualDiffSystem();
}
