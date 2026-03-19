/**
 * Script Editor with Syntax Highlighting
 * Provides a rich code editing experience for multiple scripting languages
 */

import { ScriptLanguage, ScriptModule } from './ScriptingSystem';
import { createEngineError, validators } from '../utils/ErrorHandling';

export interface EditorTheme {
  name: string;
  background: string;
  foreground: string;
  selection: string;
  lineNumbers: string;
  keywords: string;
  strings: string;
  comments: string;
  numbers: string;
  operators: string;
  functions: string;
  variables: string;
  errors: string;
  warnings: string;
}

export interface SyntaxRule {
  pattern: RegExp;
  className: string;
  priority?: number;
}

export interface LanguageSyntax {
  language: string;
  keywords: Set<string>;
  builtins: Set<string>;
  operators: Set<string>;
  delimiters: Set<string>;
  rules: SyntaxRule[];
  brackets: BracketPair[];
  autoClosingPairs: AutoClosingPair[];
  folding: FoldingRules;
}

export interface BracketPair {
  open: string;
  close: string;
  color?: string;
}

export interface AutoClosingPair {
  open: string;
  close: string;
  notIn?: string[];
}

export interface FoldingRules {
  offSide: boolean;
  markers?: {
    start?: RegExp;
    end?: RegExp;
  };
}

export interface EditorPosition {
  line: number;
  column: number;
}

export interface EditorSelection {
  start: EditorPosition;
  end: EditorPosition;
  text?: string;
}

export interface EditorAction {
  type: 'insert' | 'delete' | 'replace' | 'format' | 'indent' | 'comment';
  position: EditorPosition;
  text?: string;
  length?: number;
}

export interface EditorState {
  content: string;
  cursor: EditorPosition;
  selection?: EditorSelection;
  scrollPosition: { top: number; left: number };
  language: string;
  theme: string;
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  minimap: boolean;
}

export interface CodeCompletion {
  label: string;
  kind: 'keyword' | 'function' | 'variable' | 'class' | 'module' | 'snippet';
  documentation?: string;
  insertText: string;
  filterText?: string;
  sortText?: string;
  detail?: string;
}

export interface Diagnostic {
  range: { start: EditorPosition; end: EditorPosition };
  severity: 'error' | 'warning' | 'info' | 'hint';
  message: string;
  source: string;
  code?: string;
}

export interface EditorConfiguration {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  tabSize: number;
  insertSpaces: boolean;
  wordWrap: boolean;
  lineNumbers: boolean;
  minimap: boolean;
  scrollBeyondLastLine: boolean;
  renderWhitespace: 'none' | 'boundary' | 'all';
  bracketPairColorization: boolean;
  suggestOnTriggerCharacters: boolean;
  quickSuggestions: boolean;
  parameterHints: { enabled: boolean };
}

export class ScriptEditor {
  private element: HTMLElement;
  private state: EditorState;
  private syntaxes = new Map<string, LanguageSyntax>();
  private themes = new Map<string, EditorTheme>();
  private completions = new Map<string, CodeCompletion[]>();
  private diagnostics: Diagnostic[] = [];
  private undoStack: EditorAction[] = [];
  private redoStack: EditorAction[] = [];
  private eventListeners = new Map<string, Set<(event: EditorEvent) => void>>();

  constructor(container: HTMLElement, options: Partial<EditorConfiguration> = {}) {
    this.element = container;
    this.state = this.createInitialState(options);
    this.initializeDefaultThemes();
    this.initializeDefaultSyntaxes();
    this.render();
    this.setupEventHandlers();
  }

  /**
   * Set editor content
   */
  setContent(content: string, language?: string): void {
    this.state.content = content;
    if (language) {
      this.state.language = language;
    }
    this.render();
    this.emitEvent({ type: 'contentChanged', data: { content, language } });
  }

  /**
   * Get editor content
   */
  getContent(): string {
    return this.state.content;
  }

  /**
   * Set cursor position
   */
  setCursorPosition(position: EditorPosition): void {
    this.state.cursor = position;
    this.updateCursor();
    this.emitEvent({ type: 'cursorChanged', data: { position } });
  }

  /**
   * Get cursor position
   */
  getCursorPosition(): EditorPosition {
    return this.state.cursor;
  }

  /**
   * Set selection
   */
  setSelection(selection: EditorSelection): void {
    this.state.selection = selection;
    this.updateSelection();
    this.emitEvent({ type: 'selectionChanged', data: { selection } });
  }

  /**
   * Get selection
   */
  getSelection(): EditorSelection | undefined {
    return this.state.selection;
  }

  /**
   * Insert text at cursor
   */
  insertText(text: string): void {
    const action: EditorAction = {
      type: 'insert',
      position: this.state.cursor,
      text
    };

    this.applyAction(action);
    this.undoStack.push(action);
    this.redoStack = [];
  }

  /**
   * Delete text at cursor
   */
  deleteText(length: number): void {
    const action: EditorAction = {
      type: 'delete',
      position: this.state.cursor,
      length
    };

    this.applyAction(action);
    this.undoStack.push(action);
    this.redoStack = [];
  }

  /**
   * Undo last action
   */
  undo(): void {
    if (this.undoStack.length === 0) return;

    const action = this.undoStack.pop()!;
    this.redoStack.push(action);
    this.reverseAction(action);
    this.render();
    this.emitEvent({ type: 'undo', data: { action } });
  }

  /**
   * Redo last undone action
   */
  redo(): void {
    if (this.redoStack.length === 0) return;

    const action = this.redoStack.pop()!;
    this.undoStack.push(action);
    this.applyAction(action);
    this.render();
    this.emitEvent({ type: 'redo', data: { action } });
  }

  /**
   * Format code
   */
  formatCode(): void {
    const formatted = this.formatContent(this.state.content, this.state.language);
    this.setContent(formatted);
    this.emitEvent({ type: 'format', data: { formatted } });
  }

  /**
   * Toggle comment at cursor
   */
  toggleComment(): void {
    const lines = this.state.content.split('\n');
    const cursorLine = this.state.cursor.line;
    
    if (cursorLine < lines.length) {
      const line = lines[cursorLine];
      const isCommented = line.trim().startsWith('//') || line.trim().startsWith('#');
      
      if (isCommented) {
        lines[cursorLine] = line.replace(/^\s*\/\/\s*/, '').replace(/^\s*#\s*/, '');
      } else {
        const syntax = this.syntaxes.get(this.state.language);
        const commentChar = syntax?.delimiters.has('#') ? '#' : '//';
        lines[cursorLine] = `${commentChar} ${line}`;
      }
      
      this.setContent(lines.join('\n'));
    }
  }

  /**
   * Get code completions at cursor
   */
  getCompletions(): CodeCompletion[] {
    const language = this.state.language;
    const completions = this.completions.get(language) || [];
    
    // Filter based on current word
    const currentWord = this.getCurrentWord();
    return completions.filter(comp => 
      comp.label.toLowerCase().includes(currentWord.toLowerCase())
    );
  }

  /**
   * Set diagnostics
   */
  setDiagnostics(diagnostics: Diagnostic[]): void {
    this.diagnostics = diagnostics;
    this.render();
    this.emitEvent({ type: 'diagnosticsChanged', data: { diagnostics } });
  }

  /**
   * Get diagnostics
   */
  getDiagnostics(): Diagnostic[] {
    return this.diagnostics;
  }

  /**
   * Set theme
   */
  setTheme(themeName: string): void {
    const theme = this.themes.get(themeName);
    if (!theme) {
      throw createEngineError(
        `Theme '${themeName}' not found`,
        'THEME_NOT_FOUND',
        'system',
        'medium'
      );
    }

    this.state.theme = themeName;
    this.applyTheme(theme);
    this.emitEvent({ type: 'themeChanged', data: { theme: themeName } });
  }

  /**
   * Set language
   */
  setLanguage(language: string): void {
    this.state.language = language;
    this.render();
    this.emitEvent({ type: 'languageChanged', data: { language } });
  }

  /**
   * Add event listener
   */
  addEventListener(eventType: string, callback: (event: EditorEvent) => void): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    
    this.eventListeners.get(eventType)!.add(callback);
    
    return () => {
      this.eventListeners.get(eventType)?.delete(callback);
    };
  }

  // Private methods

  private createInitialState(options: Partial<EditorConfiguration>): EditorState {
    return {
      content: '',
      cursor: { line: 0, column: 0 },
      scrollPosition: { top: 0, left: 0 },
      language: 'javascript',
      theme: 'dark',
      fontSize: options.fontSize || 14,
      tabSize: options.tabSize || 2,
      wordWrap: options.wordWrap || false,
      lineNumbers: options.lineNumbers !== false,
      minimap: options.minimap || false
    };
  }

  private initializeDefaultThemes(): void {
    // Dark theme
    this.themes.set('dark', {
      name: 'Dark',
      background: '#1e1e1e',
      foreground: '#d4d4d4',
      selection: '#264f78',
      lineNumbers: '#858585',
      keywords: '#569cd6',
      strings: '#ce9178',
      comments: '#6a9955',
      numbers: '#b5cea8',
      operators: '#d4d4d4',
      functions: '#dcdcaa',
      variables: '#9cdcfe',
      errors: '#f44747',
      warnings: '#ffcc02'
    });

    // Light theme
    this.themes.set('light', {
      name: 'Light',
      background: '#ffffff',
      foreground: '#000000',
      selection: '#add6ff',
      lineNumbers: '#237893',
      keywords: '#0000ff',
      strings: '#a31515',
      comments: '#008000',
      numbers: '#098658',
      operators: '#000000',
      functions: '#795e26',
      variables: '#001080',
      errors: '#f44747',
      warnings: '#ff8c00'
    });
  }

  private initializeDefaultSyntaxes(): void {
    // JavaScript syntax
    this.syntaxes.set('javascript', {
      language: 'javascript',
      keywords: new Set([
        'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
        'default', 'delete', 'do', 'else', 'export', 'extends', 'finally',
        'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new',
        'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var',
        'void', 'while', 'with', 'yield', 'async', 'await'
      ]),
      builtins: new Set([
        'console', 'Math', 'Date', 'Array', 'Object', 'String', 'Number',
        'Boolean', 'JSON', 'Promise', 'Map', 'Set', 'WeakMap', 'WeakSet'
      ]),
      operators: new Set([
        '+', '-', '*', '/', '%', '=', '+=', '-=', '*=', '/=', '%=', '++', '--',
        '==', '===', '!=', '!==', '>', '<', '>=', '<=', '&&', '||', '!', '!!',
        '&', '|', '^', '~', '<<', '>>', '>>>', '&=', '|=', '^=', '<<=', '>>=', '>>>='
      ]),
      delimiters: new Set([';', ',', '.', ':', '(', ')', '[', ']', '{', '}']),
      rules: [
        { pattern: /\/\/.*$/gm, className: 'comment' },
        { pattern: /\/\*[\s\S]*?\*\//gm, className: 'comment' },
        { pattern: /"([^"\\]|\\.)*"/g, className: 'string' },
        { pattern: /'([^'\\]|\\.)*'/g, className: 'string' },
        { pattern: /`([^`\\]|\\.)*`/g, className: 'string' },
        { pattern: /\b\d+\.?\d*\b/g, className: 'number' },
        { pattern: /\b(true|false|null|undefined)\b/g, className: 'keyword' }
      ],
      brackets: [
        { open: '(', close: ')' },
        { open: '[', close: ']' },
        { open: '{', close: '}' }
      ],
      autoClosingPairs: [
        { open: '(', close: ')' },
        { open: '[', close: ']' },
        { open: '{', close: '}' },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
        { open: '`', close: '`' }
      ],
      folding: { offSide: false }
    });

    // Initialize completions
    this.initializeCompletions();
  }

  private initializeCompletions(): void {
    // JavaScript completions
    const jsCompletions: CodeCompletion[] = [
      // Keywords
      ...Array.from(this.syntaxes.get('javascript')!.keywords).map(keyword => ({
        label: keyword,
        kind: 'keyword' as const,
        insertText: keyword,
        documentation: `JavaScript keyword: ${keyword}`
      })),
      
      // Built-in objects
      ...Array.from(this.syntaxes.get('javascript')!.builtins).map(builtin => ({
        label: builtin,
        kind: 'variable' as const,
        insertText: builtin,
        documentation: `Built-in object: ${builtin}`
      })),

      // Common snippets
      {
        label: 'for',
        kind: 'snippet' as const,
        insertText: 'for (let i = 0; i < ${1:array}.length; i++) {\n  ${2:// body}\n}',
        documentation: 'For loop snippet'
      },
      {
        label: 'function',
        kind: 'snippet' as const,
        insertText: 'function ${1:name}(${2:params}) {\n  ${3:// body}\n}',
        documentation: 'Function declaration snippet'
      },
      {
        label: 'class',
        kind: 'snippet' as const,
        insertText: 'class ${1:Name} {\n  constructor(${2:params}) {\n    ${3:// body}\n  }\n}',
        documentation: 'Class declaration snippet'
      }
    ];

    this.completions.set('javascript', jsCompletions);
  }

  private render(): void {
    const theme = this.themes.get(this.state.theme)!;
    const syntax = this.syntaxes.get(this.state.language);
    
    // Apply syntax highlighting
    const highlightedContent = syntax ? this.applySyntaxHighlighting(this.state.content, syntax) : this.state.content;
    
    // Generate HTML
    const html = this.generateEditorHTML(highlightedContent, theme);
    
    // Set element content
    this.element.innerHTML = html;
    
    // Apply theme
    this.applyTheme(theme);
    
    // Update cursor and selection
    this.updateCursor();
    this.updateSelection();
    
    // Render diagnostics
    this.renderDiagnostics();
  }

  private applySyntaxHighlighting(content: string, syntax: LanguageSyntax): string {
    let highlighted = content;
    
    // Apply syntax rules in priority order
    const rules = [...syntax.rules].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    for (const rule of rules) {
      highlighted = highlighted.replace(rule.pattern, (match) => {
        return `<span class="syntax-${rule.className}">${this.escapeHtml(match)}</span>`;
      });
    }
    
    return highlighted;
  }

  private generateEditorHTML(content: string, theme: EditorTheme): string {
    const lines = content.split('\n');
    const lineNumbers = lines.map((_, i) => i + 1);
    
    return `
      <div class="script-editor" data-theme="${theme.name}">
        <div class="editor-container">
          ${this.state.lineNumbers ? `
            <div class="line-numbers">
              ${lineNumbers.map(n => `<div class="line-number">${n}</div>`).join('')}
            </div>
          ` : ''}
          <div class="editor-content">
            <div class="code-lines">
              ${lines.map(line => `<div class="code-line">${line}</div>`).join('')}
            </div>
            <div class="cursor"></div>
            <div class="selection"></div>
          </div>
        </div>
      </div>
    `;
  }

  private applyTheme(theme: EditorTheme): void {
    const styleId = 'editor-theme-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = `
      .script-editor {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: ${this.state.fontSize}px;
        line-height: ${this.state.lineHeight || 1.4};
        background: ${theme.background};
        color: ${theme.foreground};
        border: 1px solid #ccc;
        border-radius: 4px;
        overflow: auto;
      }
      
      .editor-container {
        display: flex;
        min-height: 300px;
      }
      
      .line-numbers {
        background: ${theme.lineNumbers};
        color: ${theme.foreground};
        padding: 0 10px;
        text-align: right;
        user-select: none;
        border-right: 1px solid #ccc;
      }
      
      .line-number {
        line-height: ${this.state.lineHeight || 1.4};
      }
      
      .editor-content {
        flex: 1;
        position: relative;
        padding: 0 10px;
      }
      
      .code-line {
        white-space: pre-wrap;
        word-break: break-all;
      }
      
      .cursor {
        position: absolute;
        width: 2px;
        height: ${this.state.fontSize}px;
        background: ${theme.foreground};
        animation: blink 1s infinite;
      }
      
      .selection {
        position: absolute;
        background: ${theme.selection};
      }
      
      .syntax-keyword { color: ${theme.keywords}; }
      .syntax-string { color: ${theme.strings}; }
      .syntax-comment { color: ${theme.comments}; }
      .syntax-number { color: ${theme.numbers}; }
      .syntax-operator { color: ${theme.operators}; }
      .syntax-function { color: ${theme.functions}; }
      .syntax-variable { color: ${theme.variables}; }
      
      @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
    `;
  }

  private updateCursor(): void {
    const cursorElement = this.element.querySelector('.cursor') as HTMLElement;
    if (cursorElement) {
      const lineHeight = this.state.fontSize * (this.state.lineHeight || 1.4);
      cursorElement.style.top = `${this.state.cursor.line * lineHeight}px`;
      cursorElement.style.left = `${this.state.cursor.column * this.state.fontSize * 0.6}px`;
    }
  }

  private updateSelection(): void {
    const selectionElement = this.element.querySelector('.selection') as HTMLElement;
    if (selectionElement && this.state.selection) {
      const lineHeight = this.state.fontSize * (this.state.lineHeight || 1.4);
      const start = this.state.selection.start;
      const end = this.state.selection.end;
      
      selectionElement.style.top = `${start.line * lineHeight}px`;
      selectionElement.style.left = `${start.column * this.state.fontSize * 0.6}px`;
      selectionElement.style.width = `${(end.column - start.column) * this.state.fontSize * 0.6}px`;
      selectionElement.style.height = `${(end.line - start.line + 1) * lineHeight}px`;
    }
  }

  private renderDiagnostics(): void {
    // Remove existing diagnostic decorations
    this.element.querySelectorAll('.diagnostic').forEach(el => el.remove());
    
    // Add new diagnostic decorations
    for (const diagnostic of this.diagnostics) {
      const decoration = document.createElement('div');
      decoration.className = `diagnostic diagnostic-${diagnostic.severity}`;
      decoration.title = diagnostic.message;
      
      // Position decoration
      const lineHeight = this.state.fontSize * (this.state.lineHeight || 1.4);
      decoration.style.position = 'absolute';
      decoration.style.top = `${diagnostic.range.start.line * lineHeight}px`;
      decoration.style.left = `${diagnostic.range.start.column * this.state.fontSize * 0.6}px`;
      decoration.style.width = '2px';
      decoration.style.height = `${lineHeight}px`;
      
      this.element.querySelector('.editor-content')?.appendChild(decoration);
    }
  }

  private setupEventHandlers(): void {
    this.element.addEventListener('keydown', (e) => this.handleKeyDown(e));
    this.element.addEventListener('input', (e) => this.handleInput(e));
    this.element.addEventListener('click', (e) => this.handleClick(e));
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'z':
          e.preventDefault();
          this.undo();
          break;
        case 'y':
          e.preventDefault();
          this.redo();
          break;
        case 's':
          e.preventDefault();
          this.emitEvent({ type: 'save', data: {} });
          break;
        case '/':
          e.preventDefault();
          this.toggleComment();
          break;
      }
    } else {
      switch (e.key) {
        case 'Tab':
          e.preventDefault();
          this.insertText(this.state.tabSize === 2 ? '  ' : '    ');
          break;
        case 'Enter':
          e.preventDefault();
          this.handleEnter();
          break;
      }
    }
  }

  private handleInput(e: Event): void {
    // Handle input changes
    this.emitEvent({ type: 'input', data: { event: e } });
  }

  private handleClick(e: MouseEvent): void {
    // Handle click events for cursor positioning
    this.emitEvent({ type: 'click', data: { event: e } });
  }

  private handleEnter(): void {
    // Handle Enter key - auto-indent
    const currentLine = this.state.content.split('\n')[this.state.cursor.line] || '';
    const indent = currentLine.match(/^\s*/)?.[0] || '';
    this.insertText('\n' + indent);
  }

  private applyAction(action: EditorAction): void {
    const lines = this.state.content.split('\n');
    
    switch (action.type) {
      case 'insert':
        if (action.text) {
          const line = lines[action.position.line] || '';
          lines[action.position.line] = 
            line.slice(0, action.position.column) + 
            action.text + 
            line.slice(action.position.column);
          this.state.cursor.column += action.text.length;
        }
        break;
        
      case 'delete':
        if (action.length) {
          const line = lines[action.position.line] || '';
          lines[action.position.line] = 
            line.slice(0, action.position.column) + 
            line.slice(action.position.column + action.length);
        }
        break;
    }
    
    this.state.content = lines.join('\n');
  }

  private reverseAction(action: EditorAction): void {
    // Reverse the action for undo
    const reverseAction: EditorAction = {
      type: action.type === 'insert' ? 'delete' : 'insert',
      position: action.position,
      text: action.text,
      length: action.length
    };
    this.applyAction(reverseAction);
  }

  private formatContent(content: string, language: string): string {
    // Basic formatting - in a real implementation would use proper formatter
    return content;
  }

  private getCurrentWord(): string {
    const lines = this.state.content.split('\n');
    const line = lines[this.state.cursor.line] || '';
    const beforeCursor = line.slice(0, this.state.cursor.column);
    const match = beforeCursor.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);
    return match ? match[0] : '';
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private emitEvent(event: EditorEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const callback of listeners) {
        callback(event);
      }
    }
  }
}

export interface EditorEvent {
  type: string;
  data: any;
}

// Factory function
export function createScriptEditor(container: HTMLElement, options?: Partial<EditorConfiguration>): ScriptEditor {
  return new ScriptEditor(container, options);
}
