/**
 * Comprehensive API documentation system
 * Provides detailed API documentation with examples, references, and search capabilities
 */

export interface APIDocumentation {
  name: string;
  version: string;
  description: string;
  modules: ModuleDocumentation[];
  examples: ExampleDocumentation[];
  guides: GuideDocumentation[];
  changelog: ChangelogEntry[];
  searchIndex: SearchIndex;
  metadata: DocumentationMetadata;
}

export interface ModuleDocumentation {
  name: string;
  description: string;
  exports: ExportDocumentation[];
  classes: ClassDocumentation[];
  interfaces: InterfaceDocumentation[];
  enums: EnumDocumentation[];
  functions: FunctionDocumentation[];
  types: TypeAliasDocumentation[];
  namespaces: NamespaceDocumentation[];
  examples: ExampleDocumentation[];
  seeAlso: string[];
  since: string;
  deprecated?: string;
}

export interface ExportDocumentation {
  name: string;
  kind: 'class' | 'interface' | 'function' | 'enum' | 'type' | 'namespace' | 'constant' | 'variable';
  description: string;
  isDefault: boolean;
  isExported: boolean;
  documentation?: string;
  examples: ExampleDocumentation[];
  typeParameters?: TypeParameterDocumentation[];
  parameters?: ParameterDocumentation[];
  returnType?: TypeDocumentation;
  extends?: string[];
  implements?: string[];
  members?: MemberDocumentation[];
}

export interface MemberDocumentation {
  name: string;
  description: string;
  type: TypeDocumentation;
  isStatic: boolean;
  isPrivate: boolean;
  isProtected: boolean;
  isPublic: boolean;
  isReadonly: boolean;
  isOptional: boolean;
  defaultValue?: string;
  examples: ExampleDocumentation[];
  since?: string;
  deprecated?: string;
}

// Missing interfaces that were referenced but not defined
export interface ClassDocumentation {
  name: string;
  description: string;
  extends?: string;
  implements?: string[];
  isAbstract: boolean;
  isExported: boolean;
  isGeneric: boolean;
  typeParameters?: TypeParameterDocumentation[];
  properties: MemberDocumentation[];
  methods: MemberDocumentation[];
  constructors: MemberDocumentation[];
  accessors: MemberDocumentation[];
  examples: ExampleDocumentation[];
  since?: string;
  deprecated?: string;
}

export interface InterfaceDocumentation {
  name: string;
  description: string;
  extends?: string[];
  isExported: boolean;
  isGeneric: boolean;
  typeParameters?: TypeParameterDocumentation[];
  properties: MemberDocumentation[];
  methods: MemberDocumentation[];
  examples: ExampleDocumentation[];
  since?: string;
  deprecated?: string;
}

export interface EnumDocumentation {
  name: string;
  description: string;
  isExported: boolean;
  members: {
    name: string;
    description: string;
    value: string | number;
    examples: ExampleDocumentation[];
    since?: string;
    deprecated?: string;
  }[];
  examples: ExampleDocumentation[];
  since?: string;
  deprecated?: string;
}

export interface FunctionDocumentation {
  name: string;
  description: string;
  parameters: ParameterDocumentation[];
  returnType: TypeDocumentation;
  isExported: boolean;
  isAsync: boolean;
  isGenerator: boolean;
  examples: ExampleDocumentation[];
  since?: string;
  deprecated?: string;
}

export interface PropertyDocumentation {
  name: string;
  description: string;
  type: TypeDocumentation;
  isStatic: boolean;
  isPrivate: boolean;
  isProtected: boolean;
  isPublic: boolean;
  isReadonly: boolean;
  isOptional: boolean;
  defaultValue?: string;
  examples: ExampleDocumentation[];
  since?: string;
  deprecated?: string;
}

export interface ConstructorDocumentation {
  name: string;
  description: string;
  parameters: ParameterDocumentation[];
  examples: ExampleDocumentation[];
  since?: string;
  deprecated?: string;
}

export interface AccessorDocumentation {
  name: string;
  description: string;
  type: TypeDocumentation;
  isStatic: boolean;
  isPrivate: boolean;
  isProtected: boolean;
  isPublic: boolean;
  isReadonly: boolean;
  examples: ExampleDocumentation[];
  since?: string;
  deprecated?: string;
}

export interface TypeAliasDocumentation {
  name: string;
  description: string;
  typeParameters?: TypeParameterDocumentation[];
  definition: TypeDocumentation;
  examples: ExampleDocumentation[];
  since?: string;
  deprecated?: string;
}

export interface NamespaceDocumentation {
  name: string;
  description: string;
  members: ExportDocumentation[];
  examples: ExampleDocumentation[];
  since?: string;
  deprecated?: string;
}

export interface ExampleDocumentation {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  runnable: boolean;
  output?: string;
  notes?: string[];
  tags: string[];
  relatedAPIs: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
}

// Base interfaces that were missing
export interface TypeDocumentation {
  name: string;
  description: string;
  isUnion: boolean;
  isIntersection: boolean;
  isArray: boolean;
  isTuple: boolean;
  isFunction: boolean;
  isGeneric: boolean;
  typeParameters?: TypeParameterDocumentation[];
  types?: TypeDocumentation[];
  constraints?: string[];
  examples: ExampleDocumentation[];
  parameters?: ParameterDocumentation[];
  returnType?: TypeDocumentation;
}

export interface TypeParameterDocumentation {
  name: string;
  description: string;
  constraint?: string;
  defaultValue?: string;
}

export interface ParameterDocumentation {
  name: string;
  description: string;
  type: TypeDocumentation;
  isOptional: boolean;
  defaultValue?: string;
}

export interface SearchOptions {
  maxResults?: number;
  includeContent?: boolean;
  includeCategories?: boolean;
  includeTags?: boolean;
}

export interface SearchResult {
  type: 'term' | 'category' | 'example' | 'module';
  title: string;
  description: string;
  url: string;
  relevance: number;
  context: string[];
}

export interface DocumentationSource {
  type: 'json' | 'generator' | 'custom';
  data?: any;
  generator?: () => Promise<any>;
  loader?: () => Promise<any>;
}

export interface DocumentationConfig {
  includePrivate: boolean;
  includeInternal: boolean;
  includeDeprecated: boolean;
  outputFormats: ('html' | 'markdown' | 'pdf' | 'json')[];
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

export interface GuideDocumentation {
  id: string;
  title: string;
  description: string;
  category: 'getting-started' | 'tutorials' | 'guides' | 'reference' | 'troubleshooting';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
  prerequisites: string[];
  objectives: string[];
  steps: GuideStep[];
  examples: ExampleDocumentation[];
  relatedTopics: string[];
  tags: string[];
  author: string;
  lastUpdated: Date;
}

export interface GuideStep {
  id: string;
  title: string;
  description: string;
  content: GuideContent;
  expectedOutcome?: string;
  examples?: ExampleDocumentation[];
  tips?: string[];
  warnings?: string[];
  troubleshooting?: TroubleshootingItem[];
}

export interface GuideContent {
  type: 'text' | 'code' | 'image' | 'video' | 'interactive';
  data: string;
  language?: string;
  interactive?: InteractiveGuideData;
  code?: {
    editable: boolean;
    copyable: boolean;
    initialCode: string;
    finalCode?: string;
  };
}

export interface InteractiveGuideData {
  type: 'playground' | 'simulation' | 'quiz' | 'wizard';
  config: any;
  initialData?: any;
  expectedState?: any;
}

export interface TroubleshootingItem {
  problem: string;
  cause: string;
  solution: string;
  code?: string;
  prevention?: string;
  relatedIssues?: string[];
}

export interface ChangelogEntry {
  version: string;
  date: Date;
  type: 'major' | 'minor' | 'patch' | 'breaking';
  description: string;
  changes: ChangelogChange[];
  migration?: string;
}

export interface ChangelogChange {
  type: 'added' | 'removed' | 'changed' | 'fixed' | 'deprecated' | 'security';
  description: string;
  items: string[];
  breaking?: boolean;
}

export interface SearchIndex {
  terms: SearchTerm[];
  categories: SearchCategory[];
  tags: SearchTag[];
  examples: ExampleDocumentation[];
}

export interface SearchTerm {
  term: string;
  type: 'function' | 'class' | 'interface' | 'method' | 'property' | 'constant' | 'type' | 'concept';
  description: string;
  url: string;
  relevance: number;
  context: string[];
}

export interface SearchCategory {
  name: string;
  description: string;
  modules: string[];
  examples: ExampleDocumentation[];
}

export interface SearchTag {
  name: string;
  description: string;
  relatedTerms: string[];
  examples: ExampleDocumentation[];
}

export interface DocumentationMetadata {
  title: string;
  description: string;
  version: string;
  buildDate: Date;
  authors: string[];
  license: string;
  repository: string;
  website: string;
  lastUpdated: Date;
  totalExamples: number;
  totalModules: number;
  searchTerms: number;
}

export interface APIConfig {
  enableSearch: boolean;
  enableExamples: boolean;
  enableGuides: boolean;
  enableChangelog: boolean;
  enableVersioning: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  includeInternal: boolean;
  includeDeprecated: boolean;
  maxSearchResults: number;
  enableLiveReload: boolean;
}

export class APIDocumentationSystem {
  private config: APIConfig;
  private documentation: APIDocumentation | null = null;
  private searchIndex: SearchIndex | null = null;
  private currentTheme: 'light' | 'dark' = 'auto';
  private searchHistory: string[] = [];
  private bookmarks = new Set<string>();

  constructor(config: Partial<APIConfig> = {}) {
    this.config = {
      enableSearch: true,
      enableExamples: true,
      enableGuides: true,
      enableChangelog: true,
      enableVersioning: true,
      theme: 'auto',
      language: 'en',
      includeInternal: false,
      includeDeprecated: true,
      maxSearchResults: 50,
      enableLiveReload: false,
      ...config,
    };

    this.initializeTheme();
  }

  /**
   * Load API documentation
   */
  async loadDocumentation(source: string | DocumentationSource): Promise<APIDocumentation> {
    console.log('Loading API documentation...');

    try {
      let data: any;

      if (typeof source === 'string') {
        // Load from URL or file path
        data = await this.fetchFromURL(source);
      } else {
        // Load from DocumentationSource object
        data = await this.loadFromSource(source);
      }

      this.documentation = this.parseDocumentation(data);
      this.buildSearchIndex();
      
      console.log(`API documentation loaded: ${this.documentation.name} v${this.documentation.version}`);
      return this.documentation;

    } catch (error) {
      console.error('Failed to load API documentation:', error);
      throw new Error(`Failed to load documentation: ${(error as Error).message}`);
    }
  }

  /**
   * Generate documentation from source code
   */
  async generateFromSource(sourcePaths: string[], config: Partial<DocumentationConfig> = {}): Promise<APIDocumentation> {
    console.log('Generating documentation from source code...');

    try {
      // Parse source files
      const sourceData = await this.parseSourceFiles(sourcePaths);
      
      // Extract documentation from comments and types
      const documentation = await this.extractDocumentationFromSource(sourceData, config);
      
      this.documentation = documentation;
      this.buildSearchIndex();
      
      console.log(`Documentation generated: ${documentation.name} v${documentation.version}`);
      return documentation;

    } catch (error) {
      console.error('Failed to generate documentation:', error);
      throw new Error(`Failed to generate documentation: ${(error as Error).message}`);
    }
  }

  /**
   * Search documentation
   */
  search(query: string, options?: SearchOptions): SearchResult[] {
    if (!this.documentation || !this.config.enableSearch) {
      return [];
    }

    const searchOptions = {
      maxResults: this.config.maxSearchResults,
      includeExamples: this.config.enableExamples,
      includeGuides: this.config.enableGuides,
      includeInternal: this.config.includeInternal,
      includeDeprecated: this.config.includeDeprecated,
      ...options,
    };

    const results = this.performSearch(query, searchOptions);
    
    // Add to search history
    this.searchHistory.push(query);
    if (this.searchHistory.length > 100) {
      this.searchHistory = this.searchHistory.slice(-50);
    }

    return results;
  }

  /**
   * Get search suggestions
   */
  getSearchSuggestions(query: string): string[] {
    if (!this.searchIndex) return [];

    const suggestions: string[] = [];
    const lowerQuery = query.toLowerCase();

    // Find matching terms
    for (const term of this.searchIndex.terms) {
      if (term.term.toLowerCase().includes(lowerQuery)) {
        suggestions.push(term.term);
      }
    }

    // Find matching categories
    for (const category of this.searchIndex.categories) {
      if (category.name.toLowerCase().includes(lowerQuery)) {
        suggestions.push(category.name);
      }
    }

    // Find matching tags
    for (const tag of this.searchIndex.tags) {
      if (tag.name.toLowerCase().includes(lowerQuery)) {
        suggestions.push(tag.name);
      }
    }

    return [...new Set(suggestions)].slice(0, 10);
  }

  /**
   * Get search history
   */
  getSearchHistory(): string[] {
    return [...this.searchHistory];
  }

  /**
   * Clear search history
   */
  clearSearchHistory(): void {
    this.searchHistory = [];
  }

  /**
   * Add bookmark
   */
  addBookmark(url: string): void {
    this.bookmarks.add(url);
  }

  /**
   * Remove bookmark
   */
  removeBookmark(url: string): void {
    this.bookmarks.delete(url);
  }

  /**
   * Get bookmarks
   */
  getBookmarks(): string[] {
    return Array.from(this.bookmarks);
  }

  /**
   * Set theme
   */
  setTheme(theme: 'light' | 'dark' | 'auto'): void {
    this.currentTheme = theme;
    this.applyTheme(theme);
  }

  /**
   * Get current theme
   */
  getTheme(): 'light' | 'dark' | 'auto' {
    return this.currentTheme;
  }

  /**
   * Export documentation to various formats
   */
  async export(format: 'html' | 'markdown' | 'pdf' | 'json'): Promise<string> {
    if (!this.documentation) {
      throw new Error('No documentation loaded');
    }

    switch (format) {
      case 'html':
        return this.generateHTML();
      case 'markdown':
        return this.generateMarkdown();
      case 'pdf':
        return this.generatePDF();
      case 'json':
        return this.generateJSON();
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Print documentation
   */
  print(): void {
    if (!this.documentation) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(this.generateHTML());
      printWindow.document.close();
      printWindow.print();
    }
  }

  // Private methods

  /**
   * Fetch data from URL
   */
  private async fetchFromURL(url: string): Promise<any> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from ${url}: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Load from DocumentationSource
   */
  private async loadFromSource(source: DocumentationSource): Promise<any> {
    switch (source.type) {
      case 'json':
        return source.data;
      case 'generator':
        return await source.generator();
      case 'custom':
        return await source.loader();
      default:
        throw new Error(`Unsupported source type: ${source.type}`);
    }
  }

  /**
   * Parse documentation data
   */
  private parseDocumentation(data: any): APIDocumentation {
    return {
      name: data.name || 'API Documentation',
      version: data.version || '1.0.0',
      description: data.description || 'Comprehensive API documentation',
      modules: this.parseModules(data.modules || []),
      examples: this.parseExamples(data.examples || []),
      guides: this.parseGuides(data.guides || []),
      changelog: this.parseChangelog(data.changelog || []),
      searchIndex: this.parseSearchIndex(data.searchIndex || {}),
      metadata: this.parseMetadata(data.metadata || {}),
    };
  }

  /**
   * Parse modules
   */
  private parseModules(modules: any[]): ModuleDocumentation[] {
    return modules.map(module => ({
      name: module.name,
      description: module.description,
      exports: this.parseExports(module.exports || []),
      classes: this.parseClasses(module.classes || []),
      interfaces: this.parseInterfaces(module.interfaces || []),
      enums: this.parseEnums(module.enums || []),
      functions: this.parseFunctions(module.functions || []),
      types: this.parseTypes(module.types || []),
      namespaces: this.parseNamespaces(module.namespaces || []),
      examples: this.parseExamples(module.examples || []),
      seeAlso: module.seeAlso || [],
      since: module.since,
      deprecated: module.deprecated,
    }));
  }

  /**
   * Parse exports
   */
  private parseExports(exports: any[]): ExportDocumentation[] {
    return exports.map(exp => ({
      name: exp.name,
      kind: exp.kind,
      description: exp.description,
      isDefault: exp.default || false,
      isExported: exp.exported || true,
      documentation: exp.documentation,
      examples: this.parseExamples(exp.examples || []),
      typeParameters: this.parseTypeParameters(exp.typeParameters || []),
      parameters: this.parseParameters(exp.parameters || []),
      returnType: this.parseType(exp.returnType),
      extends: exp.extends || [],
      implements: exp.implements || [],
      members: this.parseMembers(exp.members || []),
    }));
  }

  /**
   * Parse classes
   */
  private parseClasses(classes: any[]): ClassDocumentation[] {
    return classes.map(cls => ({
      name: cls.name,
      description: cls.description,
      exports: this.parseExports(cls.exports || []),
      properties: this.parseProperties(cls.properties || []),
      methods: this.parseMethods(cls.methods || []),
      constructors: this.parseConstructors(cls.constructors || []),
      accessors: this.parseAccessors(cls.accessors || []),
      examples: this.parseExamples(cls.examples || []),
      since: cls.since,
      deprecated: cls.deprecated,
    }));
  }

  /**
   * Parse interfaces
   */
  private parseInterfaces(interfaces: any[]): InterfaceDocumentation[] {
    return interfaces.map(iface => ({
      name: iface.name,
      description: iface.description,
      exports: this.parseExports(iface.exports || []),
      properties: this.parseProperties(iface.properties || []),
      methods: this.parseMethods(iface.methods || []),
      examples: this.parseExamples(iface.examples || []),
      since: iface.since,
      deprecated: iface.deprecated,
    }));
  }

  /**
   * Parse enums
   */
  private parseEnums(enums: any[]): EnumDocumentation[] {
    return enums.map(enum_ => ({
      name: enum_.name,
      description: enum_.description,
      isExported: enum_.exported || true,
      members: enum_.members?.map(member => ({
        name: member.name,
        description: member.description,
        value: member.value,
        examples: this.parseExamples(member.examples || []),
        since: member.since,
        deprecated: member.deprecated,
      })) || [],
      examples: this.parseExamples(enum_.examples || []),
      since: enum_.since,
      deprecated: enum_.deprecated,
    }));
  }

  /**
   * Parse functions
   */
  private parseFunctions(functions: any[]): FunctionDocumentation[] {
    return functions.map(fn => ({
      name: fn.name,
      description: fn.description,
      parameters: this.parseParameters(fn.parameters || []),
      returnType: this.parseType(fn.returnType),
      isExported: fn.exported || true,
      isAsync: fn.async || false,
      isGenerator: fn.generator || false,
      examples: this.parseExamples(fn.examples || []),
      since: fn.since,
      deprecated: fn.deprecated,
    }));
  }

  /**
   * Parse properties
   */
  private parseProperties(properties: any[]): MemberDocumentation[] {
    return properties.map(prop => ({
      name: prop.name,
      description: prop.description,
      type: this.parseType(prop.type),
      isStatic: prop.static || false,
      isPrivate: prop.private || false,
      isProtected: prop.protected || false,
      isPublic: !prop.private && !prop.protected,
      isReadonly: prop.readonly || false,
      isOptional: prop.optional || false,
      defaultValue: prop.default,
      examples: this.parseExamples(prop.examples || []),
      since: prop.since,
      deprecated: prop.deprecated,
    }));
  }

  /**
   * Parse methods
   */
  private parseMethods(methods: any[]): MemberDocumentation[] {
    return methods.map(method => ({
      name: method.name,
      description: method.description,
      type: this.parseType(method.returnType),
      isStatic: method.static || false,
      isPrivate: method.private || false,
      isProtected: method.protected || false,
      isPublic: !method.private && !method.protected,
      isReadonly: false,
      isOptional: false,
      examples: this.parseExamples(method.examples || []),
      since: method.since,
      deprecated: method.deprecated,
    }));
  }

  /**
   * Parse constructors
   */
  private parseConstructors(constructors: any[]): MemberDocumentation[] {
    return constructors.map(ctor => ({
      name: 'constructor',
      description: ctor.description,
      type: this.parseType(ctor.returnType),
      isStatic: false,
      isPrivate: ctor.private || false,
      isProtected: ctor.protected || false,
      isPublic: !ctor.private && !ctor.protected,
      isReadonly: false,
      isOptional: false,
      examples: this.parseExamples(ctor.examples || []),
      since: ctor.since,
      deprecated: ctor.deprecated,
    }));
  }

  /**
   * Parse accessors
   */
  private parseAccessors(accessors: any[]): MemberDocumentation[] {
    return accessors.map(acc => ({
      name: acc.name,
      description: acc.description,
      type: this.parseType(acc.type),
      isStatic: acc.static || false,
      isPrivate: acc.private || false,
      isProtected: acc.protected || false,
      isPublic: !acc.private && !acc.protected,
      isReadonly: acc.readonly || false,
      isOptional: false,
      examples: this.parseExamples(acc.examples || []),
      since: acc.since,
      deprecated: acc.deprecated,
    }));
  }

  /**
   * Parse type aliases
   */
  private parseTypes(types: any[]): TypeAliasDocumentation[] {
    return types.map(type => ({
      name: type.name,
      description: type.description,
      typeParameters: this.parseTypeParameters(type.typeParameters || []),
      definition: this.parseType(type.definition),
      examples: this.parseExamples(type.examples || []),
      since: type.since,
      deprecated: type.deprecated,
    }));
  }

  /**
   * Parse namespaces
   */
  private parseNamespaces(namespaces: any[]): NamespaceDocumentation[] {
    return namespaces.map(ns => ({
      name: ns.name,
      description: ns.description,
      members: ns.members?.map(member => this.parseExports([member])) || [],
      examples: this.parseExamples(ns.examples || []),
      since: ns.since,
      deprecated: ns.deprecated,
    }));
  }

  /**
   * Parse examples
   */
  private parseExamples(examples: any[]): ExampleDocumentation[] {
    return examples.map(example => ({
      id: example.id,
      title: example.title,
      description: example.description,
      code: example.code,
      language: example.language || 'typescript',
      runnable: example.runnable || false,
      output: example.output,
      notes: example.notes || [],
      tags: example.tags || [],
      relatedAPIs: example.relatedAPIs || [],
      difficulty: example.difficulty || 'beginner',
      category: example.category || 'general',
    }));
  }

  /**
   * Parse guides
   */
  private parseGuides(guides: any[]): GuideDocumentation[] {
    return guides.map(guide => ({
      id: guide.id,
      title: guide.title,
      description: guide.description,
      category: guide.category,
      difficulty: guide.difficulty,
      estimatedTime: guide.estimatedTime,
      prerequisites: guide.prerequisites || [],
      objectives: guide.objectives || [],
      steps: guide.steps?.map(step => ({
        id: step.id,
        title: step.title,
        description: step.description,
        content: this.parseGuideContent(step.content),
        expectedOutcome: step.expectedOutcome,
        examples: this.parseExamples(step.examples || []),
        tips: step.tips || [],
        warnings: step.warnings || [],
        troubleshooting: step.troubleshooting || [],
      })) || [],
      examples: this.parseExamples(guide.examples || []),
      relatedTopics: guide.relatedTopics || [],
      tags: guide.tags || [],
      author: guide.author,
      lastUpdated: new Date(guide.lastUpdated),
    }));
  }

  /**
   * Parse guide content
   */
  private parseGuideContent(content: any): GuideContent {
    return {
      type: content.type || 'text',
      data: content.data || '',
      language: content.language,
      interactive: content.interactive,
      code: content.code,
    };
  }

  /**
   * Parse changelog
   */
  private parseChangelog(changelog: any[]): ChangelogEntry[] {
    return changelog.map(entry => ({
      version: entry.version,
      date: new Date(entry.date),
      type: entry.type,
      description: entry.description,
      changes: entry.changes?.map(change => ({
        type: change.type,
        description: change.description,
        items: change.items || [],
        breaking: change.breaking || false,
      })) || [],
      migration: entry.migration,
    }));
  }

  /**
   * Parse search index
   */
  private parseSearchIndex(index: any): SearchIndex {
    return {
      terms: index.terms?.map(term => ({
        term: term.term,
        type: term.type,
        description: term.description,
        url: term.url,
        relevance: term.relevance || 1,
        context: term.context || [],
      })) || [],
      categories: index.categories?.map(category => ({
        name: category.name,
        description: category.description,
        modules: category.modules || [],
        examples: category.examples || [],
      })) || [],
      tags: index.tags?.map(tag => ({
        name: tag.name,
        description: tag.description,
        relatedTerms: tag.relatedTerms || [],
        examples: tag.examples || [],
      })) || [],
      examples: index.examples || [],
    };
  }

  /**
   * Parse metadata
   */
  private parseMetadata(metadata: any): DocumentationMetadata {
    return {
      title: metadata.title || 'API Documentation',
      description: metadata.description || 'Comprehensive API documentation',
      version: metadata.version || '1.0.0',
      buildDate: new Date(metadata.buildDate),
      authors: metadata.authors || [],
      license: metadata.license || 'MIT',
      repository: metadata.repository || '',
      website: metadata.website || '',
      lastUpdated: new Date(metadata.lastUpdated),
      totalExamples: metadata.totalExamples || 0,
      totalModules: metadata.totalModules || 0,
      searchTerms: metadata.searchTerms || 0,
    };
  }

  /**
   * Build search index
   */
  private buildSearchIndex(): void {
    if (!this.documentation) return;

    this.searchIndex = {
      terms: this.extractSearchTerms(),
      categories: this.extractCategories(),
      tags: this.extractTags(),
      examples: this.documentation.examples,
    };
  }

  /**
   * Extract search terms
   */
  private extractSearchTerms(): SearchTerm[] {
    const terms: SearchTerm[] = [];

    // Extract from modules
    for (const module of this.documentation.modules) {
      // Module names
      terms.push({
        term: module.name,
        type: 'module',
        description: module.description,
        url: `#${module.name}`,
        relevance: 10,
        context: ['module'],
      });

      // Class names
      for (const cls of module.classes) {
        terms.push({
          term: cls.name,
          type: 'class',
          description: cls.description,
          url: `#${module.name}.${cls.name}`,
          relevance: 9,
          context: ['class', module.name],
        });

        // Method names
        for (const method of cls.methods) {
          terms.push({
            term: method.name,
            type: 'method',
            description: method.description,
            url: `#${module.name}.${cls.name}.${method.name}`,
            relevance: 8,
            context: ['method', 'class', module.name],
          });
        }

        // Property names
        for (const prop of cls.properties) {
          terms.push({
            term: prop.name,
            type: 'property',
            description: prop.description,
            url: `#${module.name}.${cls.name}.${prop.name}`,
            relevance: 7,
            context: ['property', 'class', module.name],
          });
        }
      }

      // Function names
      for (const fn of module.functions) {
        terms.push({
          term: fn.name,
          type: 'function',
          description: fn.description,
          url: `#${module.name}.${fn.name}`,
          relevance: 8,
          context: ['function', module.name],
        });
      }

      // Interface names
      for (const iface of module.interfaces) {
        terms.push({
          term: iface.name,
          type: 'interface',
          description: iface.description,
          url: `#${module.name}.${iface.name}`,
          relevance: 8,
          context: ['interface', module.name],
        });
      }

      // Enum names
      for (const enum_ of module.enums) {
        terms.push({
          term: enum_.name,
          type: 'enum',
          description: enum_.description,
          url: `#${module.name}.${enum_.name}`,
          relevance: 7,
          context: ['enum', module.name],
        });
      }
    }

    return terms;
  }

  /**
   * Extract categories
   */
  private extractCategories(): SearchCategory[] {
    const categories: Map<string, SearchCategory> = new Map();

    for (const module of this.documentation.modules) {
      const categoryName = module.name;
      
      if (!categories.has(categoryName)) {
        categories.set(categoryName, {
          name: categoryName,
          description: module.description,
          modules: [module.name],
          examples: module.examples,
        });
      }
    }

    return Array.from(categories.values());
  }

  /**
   * Extract tags
   */
  private extractTags(): SearchTag[] {
    const tags: Map<string, SearchTag> = new Map();

    for (const example of this.documentation.examples) {
      for (const tag of example.tags) {
        if (!tags.has(tag)) {
          tags.set(tag, {
            name: tag,
            description: `Tag: ${tag}`,
            relatedTerms: [],
            examples: [example],
          });
        }
      }
    }

    return Array.from(tags.values());
  }

  /**
   * Perform search
   */
  private performSearch(query: string, options: SearchOptions): SearchResult[] {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Search terms
    for (const term of this.searchIndex.terms) {
      if (term.term.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'term',
          title: term.term,
          description: term.description,
          url: term.url,
          relevance: term.relevance,
          context: term.context,
        });
      }
    }

    // Search categories
    if (options.includeCategories) {
      for (const category of this.searchIndex.categories) {
        if (category.name.toLowerCase().includes(lowerQuery)) {
          results.push({
            type: 'category',
            title: category.name,
            description: category.description,
            url: `#${category.name}`,
            relevance: 9,
            context: ['category'],
          });
        }
      }
    }

    // Search examples
    if (options.includeExamples) {
      for (const example of this.searchIndex.examples) {
        if (
          example.title.toLowerCase().includes(lowerQuery) ||
          example.description.toLowerCase().includes(lowerQuery) ||
          example.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        ) {
          results.push({
            type: 'example',
            title: example.title,
            description: example.description,
            url: `#example-${example.id}`,
            relevance: 7,
            context: ['example'],
          });
        }
      }
    }

    // Sort by relevance and limit results
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, options.maxResults);
  }

  /**
   * Generate HTML output
   */
  private generateHTML(): string {
    if (!this.documentation) return '';

    return `
<!DOCTYPE html>
<html lang="${this.config.language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.documentation.metadata.title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
        .module { margin-bottom: 40px; border: 1px solid #ddd; border-radius: 8px; padding: 20px; }
        .module h2 { color: #333; margin-top: 0; }
        .exports { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-top: 15px; }
        .export { padding: 10px; border: 1px solid #f0f0f0; border-radius: 4px; background: #f8f9fa; }
        .example { background: #f9f9f9; border-left: 4px solid #007acc; padding: 15px; margin: 10px 0; }
        .search { position: sticky; top: 20px; background: white; padding: 15px; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .theme-toggle { position: fixed; top: 20px; right: 20px; background: #007acc; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${this.documentation.metadata.title}</h1>
            <p>${this.documentation.metadata.description}</p>
            <p><strong>Version:</strong> ${this.documentation.metadata.version}</p>
            <p><strong>Authors:</strong> ${this.documentation.metadata.authors.join(', ')}</p>
            <p><strong>License:</strong> ${this.documentation.metadata.license}</p>
        </div>

        <div class="search">
            <input type="text" id="searchInput" placeholder="Search documentation..." style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <button class="theme-toggle" onclick="window.toggleTheme()">🌓</button>
        </div>

        ${this.documentation.modules.map(module => `
            <div class="module">
                <h2 id="${module.name}">${module.name}</h2>
                <p>${module.description}</p>
                ${module.since ? `<p><strong>Since:</strong> ${module.since}</p>` : ''}
                ${module.deprecated ? `<p><strong>Deprecated:</strong> ${module.deprecated}</p>` : ''}
                
                <div class="exports">
                    ${module.exports.map(exp => `
                        <div class="export">
                            <strong>${exp.name}</strong>
                            <span>${exp.kind}</span>
                            <p>${exp.description}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('')}
    </div>

    <script>
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchResults = [];
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            if (query.length < 2) {
                document.getElementById('searchResults').innerHTML = '';
                return;
            }
            
            const results = ${JSON.stringify(this.searchIndex.terms)}.filter(term => 
                term.term.toLowerCase().includes(query) || 
                term.description.toLowerCase().includes(query)
            );
            
            document.getElementById('searchResults').innerHTML = results.map(result => \`
                <div style="padding: 10px; border-bottom: 1px solid #eee;">
                    <strong>\${result.term}</strong> (\${result.type})
                    <p>\${result.description}</p>
                    <a href="\${result.url}">\${result.url}</a>
                </div>
            \`).join('');
        });

        // Theme toggle
        window.toggleTheme = function() {
            document.body.classList.toggle('dark-theme');
        };
    </script>
</body>
</html>`;
  }

  /**
   * Generate Markdown output
   */
  private generateMarkdown(): string {
    if (!this.documentation) return '';

    let markdown = `# ${this.documentation.metadata.title}\n\n`;
    markdown += `${this.documentation.metadata.description}\n\n`;
    markdown += `**Version:** ${this.documentation.metadata.version}\n\n`;
    markdown += `**Authors:** ${this.documentation.metadata.authors.join(', ')}\n\n`;
    markdown += `**License:** ${this.documentation.metadata.license}\n\n`;

    for (const module of this.documentation.modules) {
      markdown += `## ${module.name}\n\n`;
      markdown += `${module.description}\n\n`;
      
      if (module.since) {
        markdown += `**Since:** ${module.since}\n\n`;
      }
      
      if (module.deprecated) {
        markdown += `> ⚠️ **Deprecated:** ${module.deprecated}\n\n`;
      }

      for (const exp of module.exports) {
        markdown += `### ${exp.name} (\${exp.kind})\n\n`;
        markdown += `${exp.description}\n\n`;
        
        if (exp.examples.length > 0) {
          markdown += '**Examples:**\n\n';
          for (const example of exp.examples) {
            markdown += `\`\`\`\`${example.language}\n${example.code}\n\`\`\`\n\n`;
            markdown += `${example.description}\n\n`;
          }
        }
      }
    }

    return markdown;
  }

  /**
   * Generate JSON output
   */
  private generateJSON(): string {
    return JSON.stringify(this.documentation, null, 2);
  }

  /**
   * Generate PDF output
   */
  private generatePDF(): string {
    // In a real implementation, this would use a PDF library
    return 'PDF generation not implemented';
  }

  /**
   * Initialize theme
   */
  private initializeTheme(): void {
    if (this.config.theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentTheme = prefersDark ? 'dark' : 'light';
    } else {
      this.currentTheme = this.config.theme;
    }
    
    this.applyTheme(this.currentTheme);
  }

  /**
   * Apply theme
   */
  private applyTheme(theme: 'light' | 'dark'): void {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(\`\${theme}-theme\`);
  }

  /**
   * Parse source files
   */
  private async parseSourceFiles(sourcePaths: string[]): Promise<any> {
    // In a real implementation, this would parse TypeScript files
    return {
      name: 'Generated Documentation',
      version: '1.0.0',
      description: 'Documentation generated from source code',
      modules: [],
    };
  }

  /**
   * Extract documentation from source
   */
  private async extractDocumentationFromSource(sourceData: any, config: Partial<DocumentationConfig>): Promise<APIDocumentation> {
    // In a real implementation, this would use TypeScript compiler API
    return {
      name: 'Generated Documentation',
      version: '1.0.0',
      description: 'Documentation extracted from source code',
      modules: [],
      examples: [],
      guides: [],
      changelog: [],
      searchIndex: { terms: [], categories: [], tags: [], examples: [] },
      metadata: {
        title: 'API Documentation',
        description: 'Generated from source code',
        version: '1.0.0',
        buildDate: new Date(),
        authors: ['Documentation Generator'],
        license: 'MIT',
        repository: '',
        website: '',
        lastUpdated: new Date(),
        totalExamples: 0,
        totalModules: 0,
        searchTerms: 0,
      },
    };
  }
}

export interface DocumentationSource {
  type: 'json' | 'generator' | 'custom';
  data?: any;
  generator?: () => Promise<any>;
  loader?: () => Promise<any>;
}

export interface DocumentationConfig {
  includePrivate: boolean;
  includeInternal: boolean;
  includeDeprecated: boolean;
  outputFormats: ('html' | 'markdown' | 'pdf' | 'json')[];
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

export interface SearchOptions {
  maxResults?: number;
  includeExamples?: boolean;
  includeGuides?: boolean;
  includeInternal?: boolean;
  includeDeprecated?: boolean;
}

export interface SearchResult {
  type: 'term' | 'category' | 'example' | 'module';
  title: string;
  description: string;
  url: string;
  relevance: number;
  context: string[];
}

export interface TypeAliasDocumentation {
  name: string;
  description: string;
  typeParameters?: TypeParameterDocumentation[];
  definition: TypeDocumentation;
  examples: ExampleDocumentation[];
  since?: string;
  deprecated?: string;
}

// Global API documentation system instance
export const apiDocumentationSystem = new APIDocumentationSystem();

// Convenience functions
export const loadDocumentation = (source: string | DocumentationSource) => apiDocumentationSystem.loadDocumentation(source);
export const generateFromSource = (sourcePaths: string[], config?: Partial<DocumentationConfig>) => apiDocumentationSystem.generateFromSource(sourcePaths, config);
export const searchDocumentation = (query: string, options?: SearchOptions) => apiDocumentationSystem.search(query, options);
export const exportDocumentation = (format: 'html' | 'markdown' | 'pdf' | 'json') => apiDocumentationSystem.export(format);
