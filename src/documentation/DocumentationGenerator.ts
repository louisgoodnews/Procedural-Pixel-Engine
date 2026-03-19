/**
 * Auto-documentation generation system
 * Automatically generates comprehensive documentation from source code
 */

export interface DocumentationConfig {
  inputPaths: string[];
  outputPath: string;
  includePrivate: boolean;
  includeInternal: boolean;
  formats: ('html' | 'markdown' | 'json')[];
  templates: {
    class: string;
    interface: string;
    function: string;
    enum: string;
    namespace: string;
  };
  plugins: DocumentationPlugin[];
}

export interface DocumentationPlugin {
  name: string;
  process: (docs: DocumentationData) => DocumentationData;
}

export interface DocumentationData {
  classes: ClassDocumentation[];
  interfaces: InterfaceDocumentation[];
  functions: FunctionDocumentation[];
  enums: EnumDocumentation[];
  namespaces: NamespaceDocumentation[];
  examples: ExampleDocumentation[];
  metadata: {
    generatedAt: Date;
    version: string;
    sourcePaths: string[];
  };
}

export interface ClassDocumentation {
  name: string;
  description: string;
  extends?: string;
  implements?: string[];
  isAbstract: boolean;
  isExported: boolean;
  isGeneric: boolean;
  typeParameters?: TypeParameterDocumentation[];
  properties: PropertyDocumentation[];
  methods: MethodDocumentation[];
  constructors: ConstructorDocumentation[];
  accessors: AccessorDocumentation[];
  examples: ExampleDocumentation[];
  since?: string;
  deprecated?: string;
  seeAlso?: string[];
  tags: string[];
}

export interface InterfaceDocumentation {
  name: string;
  description: string;
  extends?: string[];
  isExported: boolean;
  isGeneric: boolean;
  typeParameters?: TypeParameterDocumentation[];
  properties: PropertyDocumentation[];
  methods: MethodDocumentation[];
  examples: ExampleDocumentation[];
  since?: string;
  deprecated?: string;
  seeAlso?: string[];
  tags: string[];
}

export interface FunctionDocumentation {
  name: string;
  description: string;
  parameters: ParameterDocumentation[];
  returnType: TypeDocumentation;
  isExported: boolean;
  isAsync: boolean;
  isGenerator: boolean;
  overloads?: FunctionDocumentation[];
  examples: ExampleDocumentation[];
  since?: string;
  deprecated?: string;
  seeAlso?: string[];
  tags: string[];
}

export interface MethodDocumentation {
  name: string;
  description: string;
  parameters: ParameterDocumentation[];
  returnType: TypeDocumentation;
  isStatic: boolean;
  isAsync: boolean;
  isGenerator: boolean;
  isPrivate: boolean;
  isProtected: boolean;
  isPublic: boolean;
  isAbstract: boolean;
  overloads?: MethodDocumentation[];
  examples: ExampleDocumentation[];
  since?: string;
  deprecated?: string;
  seeAlso?: string[];
  tags: string[];
}

export interface ConstructorDocumentation {
  name: string;
  description: string;
  parameters: ParameterDocumentation[];
  isPrivate: boolean;
  isProtected: boolean;
  isPublic: boolean;
  examples: ExampleDocumentation[];
  since?: string;
  deprecated?: string;
  seeAlso?: string[];
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
  seeAlso?: string[];
  tags: string[];
}

export interface AccessorDocumentation {
  name: string;
  description: string;
  type: TypeDocumentation;
  getter: MethodDocumentation;
  setter: MethodDocumentation;
  isStatic: boolean;
  isPrivate: boolean;
  isProtected: boolean;
  isPublic: boolean;
  examples: ExampleDocumentation[];
  since?: string;
  deprecated?: string;
  seeAlso?: string[];
  tags: string[];
}

export interface ParameterDocumentation {
  name: string;
  description: string;
  type: TypeDocumentation;
  isOptional: boolean;
  hasDefault: boolean;
  defaultValue?: string;
  examples: ExampleDocumentation[];
  since?: string;
  deprecated?: string;
  seeAlso?: string[];
}

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
  default?: string;
  examples: ExampleDocumentation[];
}

export interface EnumDocumentation {
  name: string;
  description: string;
  isExported: boolean;
  members: EnumMemberDocumentation[];
  examples: ExampleDocumentation[];
  since?: string;
  deprecated?: string;
  seeAlso?: string[];
  tags: string[];
}

export interface EnumMemberDocumentation {
  name: string;
  description: string;
  value: string | number;
  examples: ExampleDocumentation[];
  since?: string;
  deprecated?: string;
  seeAlso?: string[];
}

export interface NamespaceDocumentation {
  name: string;
  description: string;
  isExported: boolean;
  members: (ClassDocumentation | InterfaceDocumentation | FunctionDocumentation | EnumDocumentation | NamespaceDocumentation)[];
  examples: ExampleDocumentation[];
  since?: string;
  deprecated?: string;
  seeAlso?: string[];
  tags: string[];
}

export interface ExampleDocumentation {
  title: string;
  description: string;
  code: string;
  language: string;
  output?: string;
  notes?: string[];
  tags: string[];
}

export class DocumentationGenerator {
  public config: DocumentationConfig;
  private sourceFiles = new Map<string, string>();
  private documentation: DocumentationData;

  constructor(config: DocumentationConfig) {
    this.config = config;
    this.documentation = {
      classes: [],
      interfaces: [],
      functions: [],
      enums: [],
      namespaces: [],
      examples: [],
      metadata: {
        generatedAt: new Date(),
        version: '1.0.0',
        sourcePaths: config.inputPaths,
      },
    };
  }

  /**
   * Generate documentation for all configured source files
   */
  async generate(): Promise<DocumentationData> {
    console.log('Starting documentation generation...');
    
    // Load source files
    await this.loadSourceFiles();
    
    // Parse and extract documentation
    await this.parseSourceFiles();
    
    // Apply plugins
    await this.applyPlugins();
    
    // Generate output files
    await this.generateOutput();
    
    console.log('Documentation generation completed!');
    return this.documentation;
  }

  /**
   * Load all source files
   */
  private async loadSourceFiles(): Promise<void> {
    for (const path of this.config.inputPaths) {
      try {
        const content = await this.loadFile(path);
        this.sourceFiles.set(path, content);
      } catch (error) {
        console.warn(`Failed to load file ${path}:`, error);
      }
    }
  }

  /**
   * Load a single file
   */
  private async loadFile(path: string): Promise<string> {
    // In a real implementation, this would use file system APIs
    // For now, return a mock implementation
    return `// Mock content for ${path}`;
  }

  /**
   * Parse source files and extract documentation
   */
  private async parseSourceFiles(): Promise<void> {
    for (const [path, content] of this.sourceFiles) {
      const parsed = this.parseFile(content, path);
      this.mergeDocumentation(parsed);
    }
  }

  /**
   * Parse a single file for documentation
   */
  private parseFile(content: string, filePath: string): Partial<DocumentationData> {
    const parsed: Partial<DocumentationData> = {
      classes: [],
      interfaces: [],
      functions: [],
      enums: [],
      namespaces: [],
      examples: [],
    };

    // Extract JSDoc comments
    const jsDocComments = this.extractJSDocComments(content);
    
    // Parse TypeScript/JavaScript code structure
    const ast = this.parseToAST(content);
    
    // Extract documentation from AST and comments
    this.extractFromAST(ast, jsDocComments, parsed);
    
    // Extract examples from code
    this.extractExamples(content, parsed);
    
    return parsed;
  }

  /**
   * Extract JSDoc comments from source code
   */
  private extractJSDocComments(content: string): any[] {
    const comments: any[] = [];
    const jsDocRegex = /\/\*\*\s*([\s\S]*?)\*\//g;
    let match;
    
    while ((match = jsDocRegex.exec(content)) !== null) {
      comments.push({
        raw: match[0],
        comment: match[1],
        position: match.index,
      });
    }
    
    return comments;
  }

  /**
   * Parse source code to AST
   */
  private parseToAST(content: string): any {
    // In a real implementation, this would use TypeScript compiler API
    // For now, return a mock AST structure
    return {
      type: 'Program',
      body: [],
    };
  }

  /**
   * Extract documentation from AST and JSDoc comments
   */
  private extractFromAST(ast: any, jsDocComments: any[], parsed: Partial<DocumentationData>): void {
    // Walk through AST nodes and extract documentation
    this.walkAST(ast, (node, parent) => {
      switch (node.type) {
        case 'ClassDeclaration':
          this.extractClassDocumentation(node, jsDocComments, parsed);
          break;
        case 'InterfaceDeclaration':
          this.extractInterfaceDocumentation(node, jsDocComments, parsed);
          break;
        case 'FunctionDeclaration':
        case 'ArrowFunctionExpression':
          this.extractFunctionDocumentation(node, jsDocComments, parsed);
          break;
        case 'TSEnumDeclaration':
          this.extractEnumDocumentation(node, jsDocComments, parsed);
          break;
        case 'TSModuleDeclaration':
          this.extractNamespaceDocumentation(node, jsDocComments, parsed);
          break;
      }
    });
  }

  /**
   * Walk through AST nodes
   */
  private walkAST(ast: any, visitor: (node: any, parent: any) => void): void {
    // Simple AST walker implementation
    const visit = (node: any, parent: any) => {
      if (!node || typeof node !== 'object') return;
      
      visitor(node, parent);
      
      if (node.children) {
        for (const child of node.children) {
          visit(child, node);
        }
      }
    };
    
    visit(ast, null);
  }

  /**
   * Extract class documentation
   */
  private extractClassDocumentation(node: any, jsDocComments: any[], parsed: Partial<DocumentationData>): void {
    if (!this.shouldInclude(node)) return;
    
    const classDoc: ClassDocumentation = {
      name: node.id?.name || 'Anonymous',
      description: this.extractDescription(node, jsDocComments),
      extends: node.superClass?.name,
      implements: node.implements?.map((impl: any) => impl.name),
      isAbstract: node.abstract || false,
      isExported: node.exported || false,
      isGeneric: !!node.typeParameters,
      typeParameters: this.extractTypeParameters(node.typeParameters, jsDocComments),
      properties: this.extractProperties(node.body, jsDocComments),
      methods: this.extractMethods(node.body, jsDocComments),
      constructors: this.extractConstructors(node.body, jsDocComments),
      accessors: this.extractAccessors(node.body, jsDocComments),
      examples: this.extractExamplesForNode(node, jsDocComments),
      since: this.extractSince(jsDocComments),
      deprecated: this.extractDeprecated(jsDocComments),
      seeAlso: this.extractSeeAlso(jsDocComments),
      tags: this.extractTags(jsDocComments),
    };
    
    parsed.classes!.push(classDoc);
  }

  /**
   * Extract interface documentation
   */
  private extractInterfaceDocumentation(node: any, jsDocComments: any[], parsed: Partial<DocumentationData>): void {
    if (!this.shouldInclude(node)) return;
    
    const interfaceDoc: InterfaceDocumentation = {
      name: node.id?.name || 'Anonymous',
      description: this.extractDescription(node, jsDocComments),
      extends: node.extends?.map((ext: any) => ext.name),
      isExported: node.exported || false,
      isGeneric: !!node.typeParameters,
      typeParameters: this.extractTypeParameters(node.typeParameters, jsDocComments),
      properties: this.extractProperties(node.body, jsDocComments),
      methods: this.extractMethods(node.body, jsDocComments),
      examples: this.extractExamplesForNode(node, jsDocComments),
      since: this.extractSince(jsDocComments),
      deprecated: this.extractDeprecated(jsDocComments),
      seeAlso: this.extractSeeAlso(jsDocComments),
      tags: this.extractTags(jsDocComments),
    };
    
    parsed.interfaces!.push(interfaceDoc);
  }

  /**
   * Extract function documentation
   */
  private extractFunctionDocumentation(node: any, jsDocComments: any[], parsed: Partial<DocumentationData>): void {
    if (!this.shouldInclude(node)) return;
    
    const functionDoc: FunctionDocumentation = {
      name: node.id?.name || 'Anonymous',
      description: this.extractDescription(node, jsDocComments),
      parameters: this.extractParameters(node.params, jsDocComments),
      returnType: this.extractType(node.returnType, jsDocComments),
      isExported: node.exported || false,
      isAsync: node.async || false,
      isGenerator: node.generator || false,
      examples: this.extractExamplesForNode(node, jsDocComments),
      since: this.extractSince(jsDocComments),
      deprecated: this.extractDeprecated(jsDocComments),
      seeAlso: this.extractSeeAlso(jsDocComments),
      tags: this.extractTags(jsDocComments),
    };
    
    parsed.functions!.push(functionDoc);
  }

  /**
   * Extract enum documentation
   */
  private extractEnumDocumentation(node: any, jsDocComments: any[], parsed: Partial<DocumentationData>): void {
    if (!this.shouldInclude(node)) return;
    
    const enumDoc: EnumDocumentation = {
      name: node.id?.name || 'Anonymous',
      description: this.extractDescription(node, jsDocComments),
      isExported: node.exported || false,
      members: node.members?.map((member: any) => ({
        name: member.id?.name || 'Unknown',
        description: this.extractDescription(member, jsDocComments),
        value: member.init?.value || 'Unknown',
        examples: this.extractExamplesForNode(member, jsDocComments),
        since: this.extractSince(jsDocComments),
        deprecated: this.extractDeprecated(jsDocComments),
        seeAlso: this.extractSeeAlso(jsDocComments),
      })) || [],
      examples: this.extractExamplesForNode(node, jsDocComments),
      since: this.extractSince(jsDocComments),
      deprecated: this.extractDeprecated(jsDocComments),
      seeAlso: this.extractSeeAlso(jsDocComments),
      tags: this.extractTags(jsDocComments),
    };
    
    parsed.enums!.push(enumDoc);
  }

  /**
   * Extract namespace documentation
   */
  private extractNamespaceDocumentation(node: any, jsDocComments: any[], parsed: Partial<DocumentationData>): void {
    if (!this.shouldInclude(node)) return;
    
    const namespaceDoc: NamespaceDocumentation = {
      name: node.id?.name || 'Anonymous',
      description: this.extractDescription(node, jsDocComments),
      isExported: node.exported || false,
      members: node.body?.map((member: any) => {
        // Recursively extract member documentation
        const memberDoc: any = this.extractMemberDocumentation(member, jsDocComments);
        return memberDoc;
      }) || [],
      examples: this.extractExamplesForNode(node, jsDocComments),
      since: this.extractSince(jsDocComments),
      deprecated: this.extractDeprecated(jsDocComments),
      seeAlso: this.extractSeeAlso(jsDocComments),
      tags: this.extractTags(jsDocComments),
    };
    
    parsed.namespaces!.push(namespaceDoc);
  }

  /**
   * Extract member documentation (recursive helper)
   */
  private extractMemberDocumentation(member: any, jsDocComments: any[]): any {
    switch (member.type) {
      case 'ClassDeclaration':
        return this.extractClassDocumentation(member, jsDocComments, {});
      case 'InterfaceDeclaration':
        return this.extractInterfaceDocumentation(member, jsDocComments, {});
      case 'FunctionDeclaration':
        return this.extractFunctionDocumentation(member, jsDocComments, {});
      case 'TSEnumDeclaration':
        return this.extractEnumDocumentation(member, jsDocComments, {});
      default:
        return null;
    }
  }

  /**
   * Extract properties from class/interface body
   */
  private extractProperties(body: any[], jsDocComments: any[]): PropertyDocumentation[] {
    return body
      .filter((node: any) => node.type === 'PropertyDefinition')
      .map((node: any) => ({
        name: node.key?.name || 'Unknown',
        description: this.extractDescription(node, jsDocComments),
        type: this.extractType(node.value?.type, jsDocComments),
        isStatic: node.static || false,
        isPrivate: this.isPrivate(node),
        isProtected: this.isProtected(node),
        isPublic: this.isPublic(node),
        isReadonly: node.readonly || false,
        isOptional: node.optional || false,
        defaultValue: node.value?.value?.toString(),
        examples: this.extractExamplesForNode(node, jsDocComments),
        since: this.extractSince(jsDocComments),
        deprecated: this.extractDeprecated(jsDocComments),
        seeAlso: this.extractSeeAlso(jsDocComments),
        tags: this.extractTags(jsDocComments),
      }));
  }

  /**
   * Extract methods from class/interface body
   */
  private extractMethods(body: any[], jsDocComments: any[]): MethodDocumentation[] {
    return body
      .filter((node: any) => node.type === 'MethodDefinition')
      .map((node: any) => ({
        name: node.key?.name || 'Unknown',
        description: this.extractDescription(node, jsDocComments),
        parameters: this.extractParameters(node.params, jsDocComments),
        returnType: this.extractType(node.returnType, jsDocComments),
        isStatic: node.static || false,
        isAsync: node.async || false,
        isGenerator: node.generator || false,
        isPrivate: this.isPrivate(node),
        isProtected: this.isProtected(node),
        isPublic: this.isPublic(node),
        isAbstract: node.abstract || false,
        examples: this.extractExamplesForNode(node, jsDocComments),
        since: this.extractSince(jsDocComments),
        deprecated: this.extractDeprecated(jsDocComments),
        seeAlso: this.extractSeeAlso(jsDocComments),
        tags: this.extractTags(jsDocComments),
      }));
  }

  /**
   * Extract constructors from class body
   */
  private extractConstructors(body: any[], jsDocComments: any[]): ConstructorDocumentation[] {
    return body
      .filter((node: any) => node.type === 'Constructor')
      .map((node: any) => ({
        name: 'constructor',
        description: this.extractDescription(node, jsDocComments),
        parameters: this.extractParameters(node.params, jsDocComments),
        isPrivate: this.isPrivate(node),
        isProtected: this.isProtected(node),
        isPublic: this.isPublic(node),
        examples: this.extractExamplesForNode(node, jsDocComments),
        since: this.extractSince(jsDocComments),
        deprecated: this.extractDeprecated(jsDocComments),
        seeAlso: this.extractSeeAlso(jsDocComments),
      }));
  }

  /**
   * Extract accessors (getters/setters) from class body
   */
  private extractAccessors(body: any[], jsDocComments: any[]): AccessorDocumentation[] {
    return body
      .filter((node: any) => node.type === 'Accessor')
      .map((node: any) => ({
        name: node.key?.name || 'Unknown',
        description: this.extractDescription(node, jsDocComments),
        type: this.extractType(node.type, jsDocComments),
        getter: this.extractMemberDocumentation(node.getter, jsDocComments) as MethodDocumentation,
        setter: this.extractMemberDocumentation(node.setter, jsDocComments) as MethodDocumentation,
        isStatic: node.static || false,
        isPrivate: this.isPrivate(node),
        isProtected: this.isProtected(node),
        isPublic: this.isPublic(node),
        examples: this.extractExamplesForNode(node, jsDocComments),
        since: this.extractSince(jsDocComments),
        deprecated: this.extractDeprecated(jsDocComments),
        seeAlso: this.extractSeeAlso(jsDocComments),
        tags: this.extractTags(jsDocComments),
      }));
  }

  /**
   * Extract parameters from function/method
   */
  private extractParameters(params: any[], jsDocComments: any[]): ParameterDocumentation[] {
    return params?.map((param: any) => ({
      name: param.name || 'Unknown',
      description: this.extractDescription(param, jsDocComments),
      type: this.extractType(param.type, jsDocComments),
      isOptional: param.optional || false,
      hasDefault: param.default !== undefined,
      defaultValue: param.default?.toString(),
      examples: this.extractExamplesForNode(param, jsDocComments),
      since: this.extractSince(jsDocComments),
      deprecated: this.extractDeprecated(jsDocComments),
      seeAlso: this.extractSeeAlso(jsDocComments),
    })) || [];
  }

  /**
   * Extract type parameters
   */
  private extractTypeParameters(typeParams: any[], jsDocComments: any[]): TypeParameterDocumentation[] {
    return typeParams?.map((param: any) => ({
      name: param.name || 'Unknown',
      description: this.extractDescription(param, jsDocComments),
      constraint: param.constraint?.name,
      default: param.default?.name,
      examples: this.extractExamplesForNode(param, jsDocComments),
    })) || [];
  }

  /**
   * Extract type documentation
   */
  private extractType(typeNode: any, jsDocComments: any[]): TypeDocumentation {
    if (!typeNode) {
      return {
        name: 'void',
        description: 'No type information available',
        isUnion: false,
        isIntersection: false,
        isArray: false,
        isTuple: false,
        isFunction: false,
        isGeneric: false,
        examples: [],
      };
    }

    return {
      name: typeNode.name || 'Unknown',
      description: this.extractDescription(typeNode, jsDocComments),
      isUnion: typeNode.type === 'TSUnionType',
      isIntersection: typeNode.type === 'TSIntersectionType',
      isArray: typeNode.type === 'TSArrayType',
      isTuple: typeNode.type === 'TSTupleType',
      isFunction: typeNode.type === 'FunctionType',
      isGeneric: !!typeNode.typeParameters,
      typeParameters: this.extractTypeParameters(typeNode.typeParameters, jsDocComments),
      types: typeNode.types?.map((type: any) => this.extractType(type, jsDocComments)),
      constraints: typeNode.constraints?.map((constraint: any) => constraint.name),
      examples: this.extractExamplesForNode(typeNode, jsDocComments),
    };
  }

  /**
   * Extract examples from source code
   */
  private extractExamples(content: string, parsed: Partial<DocumentationData>): void {
    const exampleRegex = /(?:\/\/\s*example:|\/\*\*\s*example[\s\S]*?\*\/)([\s\S]*?)(?=\n\n|\n\/\/|\*\/)/gi;
    let match;
    
    while ((match = exampleRegex.exec(content)) !== null) {
      const example: ExampleDocumentation = {
        title: 'Example',
        description: 'Code example',
        code: match[2] || match[1],
        language: 'typescript',
        tags: ['example'],
      };
      
      parsed.examples!.push(example);
    }
  }

  /**
   * Extract examples for a specific node
   */
  private extractExamplesForNode(node: any, jsDocComments: any[]): ExampleDocumentation[] {
    const examples: ExampleDocumentation[] = [];
    
    // Extract from JSDoc @example tags
    const exampleTags = this.extractJSDocTags(jsDocComments, 'example');
    for (const tag of exampleTags) {
      examples.push({
        title: 'Example',
        description: tag.description || '',
        code: tag.code || '',
        language: 'typescript',
        tags: ['example'],
      });
    }
    
    return examples;
  }

  /**
   * Extract description from JSDoc comments
   */
  private extractDescription(node: any, jsDocComments: any[]): string {
    const comment = this.findJSDocComment(node, jsDocComments);
    if (!comment) return '';
    
    // Extract main description (before tags)
    const descriptionMatch = comment.match(/^\/\*\*\s*([^@]*?)\*?\//);
    return descriptionMatch ? descriptionMatch[1].trim() : '';
  }

  /**
   * Extract @since tag from JSDoc
   */
  private extractSince(jsDocComments: any[]): string | undefined {
    const sinceTag = this.extractJSDocTags(jsDocComments, 'since')[0];
    return sinceTag?.value;
  }

  /**
   * Extract @deprecated tag from JSDoc
   */
  private extractDeprecated(jsDocComments: any[]): string | undefined {
    const deprecatedTag = this.extractJSDocTags(jsDocComments, 'deprecated')[0];
    return deprecatedTag?.value;
  }

  /**
   * Extract @see tags from JSDoc
   */
  private extractSeeAlso(jsDocComments: any[]): string[] {
    const seeTags = this.extractJSDocTags(jsDocComments, 'see');
    return seeTags.map(tag => tag.value);
  }

  /**
   * Extract all tags from JSDoc
   */
  private extractTags(jsDocComments: any[]): string[] {
    const tags: string[] = [];
    const tagRegex = /@(\w+)/g;
    
    for (const comment of jsDocComments) {
      let match;
      while ((match = tagRegex.exec(comment.comment)) !== null) {
        tags.push(match[1]);
      }
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Extract specific JSDoc tags
   */
  private extractJSDocTags(jsDocComments: any[], tagName: string): any[] {
    const tags: any[] = [];
    const tagRegex = new RegExp(`@${tagName}\\s+(.+)`, 'i');
    
    for (const comment of jsDocComments) {
      let match;
      while ((match = tagRegex.exec(comment.comment)) !== null) {
        tags.push({
          name: tagName,
          value: match[1].trim(),
          description: match[1].trim(),
        });
      }
    }
    
    return tags;
  }

  /**
   * Find JSDoc comment for a node
   */
  private findJSDocComment(node: any, jsDocComments: any[]): any {
    if (!node || !node.loc) return null;
    
    // Find the JSDoc comment that comes immediately before the node
    for (const comment of jsDocComments) {
      if (comment.position < node.loc.start) {
        return comment;
      }
    }
    
    return null;
  }

  /**
   * Check if node is private
   */
  private isPrivate(node: any): boolean {
    return node.accessibility === 'private' || node.key?.name?.startsWith('_');
  }

  /**
   * Check if node is protected
   */
  private isProtected(node: any): boolean {
    return node.accessibility === 'protected';
  }

  /**
   * Check if node is public
   */
  private isPublic(node: any): boolean {
    return !this.isPrivate(node) && !this.isProtected(node);
  }

  /**
   * Check if node should be included in documentation
   */
  private shouldInclude(node: any): boolean {
    if (this.config.includePrivate && this.isPrivate(node)) return true;
    if (this.config.includeInternal && this.isProtected(node)) return true;
    if (this.isPrivate(node) && !this.config.includePrivate) return false;
    if (this.isProtected(node) && !this.config.includeInternal) return false;
    
    return true;
  }

  /**
   * Merge parsed documentation
   */
  private mergeDocumentation(parsed: Partial<DocumentationData>): void {
    if (parsed.classes) this.documentation.classes.push(...parsed.classes);
    if (parsed.interfaces) this.documentation.interfaces.push(...parsed.interfaces);
    if (parsed.functions) this.documentation.functions.push(...parsed.functions);
    if (parsed.enums) this.documentation.enums.push(...parsed.enums);
    if (parsed.namespaces) this.documentation.namespaces.push(...parsed.namespaces);
    if (parsed.examples) this.documentation.examples.push(...parsed.examples);
  }

  /**
   * Apply documentation plugins
   */
  private async applyPlugins(): Promise<void> {
    for (const plugin of this.config.plugins) {
      try {
        this.documentation = plugin.process(this.documentation);
      } catch (error) {
        console.warn(`Documentation plugin '${plugin.name}' failed:`, error);
      }
    }
  }

  /**
   * Generate output files
   */
  private async generateOutput(): Promise<void> {
    for (const format of this.config.formats) {
      switch (format) {
        case 'html':
          await this.generateHTML();
          break;
        case 'markdown':
          await this.generateMarkdown();
          break;
        case 'json':
          await this.generateJSON();
          break;
      }
    }
  }

  /**
   * Generate HTML documentation
   */
  private async generateHTML(): Promise<void> {
    const html = this.renderHTMLTemplate();
    // In a real implementation, this would write to file system
    console.log(`HTML documentation generated (${html.length} characters)`);
  }

  /**
   * Generate Markdown documentation
   */
  private async generateMarkdown(): Promise<void> {
    const markdown = this.renderMarkdownTemplate();
    // In a real implementation, this would write to file system
    console.log(`Markdown documentation generated (${markdown.length} characters)`);
  }

  /**
   * Generate JSON documentation
   */
  private async generateJSON(): Promise<void> {
    const json = JSON.stringify(this.documentation, null, 2);
    // In a real implementation, this would write to file system
    console.log(`JSON documentation generated (${json.length} characters)`);
  }

  /**
   * Render HTML template
   */
  private renderHTMLTemplate(): string {
    const template = this.config.templates.class;
    
    // Render classes
    let classesHTML = '';
    for (const classDoc of this.documentation.classes) {
      classesHTML += this.renderClassHTML(classDoc, template);
    }
    
    // Render interfaces
    let interfacesHTML = '';
    for (const interfaceDoc of this.documentation.interfaces) {
      interfacesHTML += this.renderInterfaceHTML(interfaceDoc, template);
    }
    
    // Render functions
    let functionsHTML = '';
    for (const functionDoc of this.documentation.functions) {
      functionsHTML += this.renderFunctionHTML(functionDoc, template);
    }
    
    // Render enums
    let enumsHTML = '';
    for (const enumDoc of this.documentation.enums) {
      enumsHTML += this.renderEnumHTML(enumDoc, template);
    }
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>API Documentation</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .class, .interface, .function, .enum { margin-bottom: 30px; }
        .name { color: #333; font-size: 24px; font-weight: bold; }
        .description { color: #666; margin: 10px 0; }
        .properties, .methods, .constructors { margin: 15px 0; }
        .property, .method, .constructor { margin: 8px 0; padding: 8px; background: #f5f5f5; border-left: 4px solid #007acc; }
        .parameter { color: #666; font-style: italic; }
        .deprecated { color: #c00; text-decoration: line-through; }
        .since { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>API Documentation</h1>
    <p>Generated on ${this.documentation.metadata.generatedAt.toISOString()}</p>
    
    <h2>Classes</h2>
    ${classesHTML}
    
    <h2>Interfaces</h2>
    ${interfacesHTML}
    
    <h2>Functions</h2>
    ${functionsHTML}
    
    <h2>Enums</h2>
    ${enumsHTML}
</body>
</html>`;
  }

  /**
   * Render Markdown template
   */
  private renderMarkdownTemplate(): string {
    let markdown = `# API Documentation\n\n`;
    markdown += `Generated on ${this.documentation.metadata.generatedAt.toISOString()}\n\n`;
    
    // Render classes
    if (this.documentation.classes.length > 0) {
      markdown += `## Classes\n\n`;
      for (const classDoc of this.documentation.classes) {
        markdown += this.renderClassMarkdown(classDoc);
      }
    }
    
    // Render interfaces
    if (this.documentation.interfaces.length > 0) {
      markdown += `## Interfaces\n\n`;
      for (const interfaceDoc of this.documentation.interfaces) {
        markdown += this.renderInterfaceMarkdown(interfaceDoc);
      }
    }
    
    // Render functions
    if (this.documentation.functions.length > 0) {
      markdown += `## Functions\n\n`;
      for (const functionDoc of this.documentation.functions) {
        markdown += this.renderFunctionMarkdown(functionDoc);
      }
    }
    
    // Render enums
    if (this.documentation.enums.length > 0) {
      markdown += `## Enums\n\n`;
      for (const enumDoc of this.documentation.enums) {
        markdown += this.renderEnumMarkdown(enumDoc);
      }
    }
    
    return markdown;
  }

  /**
   * Render class HTML
   */
  private renderClassHTML(classDoc: ClassDocumentation, template: string): string {
    return `
<div class="class">
    <div class="name">${classDoc.name}</div>
    <div class="description">${classDoc.description}</div>
    ${classDoc.deprecated ? `<div class="deprecated">Deprecated: ${classDoc.deprecated}</div>` : ''}
    ${classDoc.since ? `<div class="since">Since: ${classDoc.since}</div>` : ''}
    
    ${classDoc.properties.length > 0 ? `
    <div class="properties">
        <h3>Properties</h3>
        ${classDoc.properties.map(prop => `
            <div class="property">
                <strong>${prop.name}</strong>: ${this.renderTypeHTML(prop.type)}
                ${prop.isOptional ? ' (optional)' : ''}
                <div>${prop.description}</div>
                ${prop.defaultValue ? `<div>Default: ${prop.defaultValue}</div>` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${classDoc.methods.length > 0 ? `
    <div class="methods">
        <h3>Methods</h3>
        ${classDoc.methods.map(method => this.renderMethodHTML(method)).join('')}
    </div>
    ` : ''}
    
    ${classDoc.constructors.length > 0 ? `
    <div class="constructors">
        <h3>Constructors</h3>
        ${classDoc.constructors.map(ctor => this.renderConstructorHTML(ctor)).join('')}
    </div>
    ` : ''}
    
    ${classDoc.examples.length > 0 ? `
    <div class="examples">
        <h3>Examples</h3>
        ${classDoc.examples.map(example => `
            <div>
                <strong>${example.title}</strong>
                <div>${example.description}</div>
                <pre><code>${example.code}</code></pre>
            </div>
        `).join('')}
    </div>
    ` : ''}
</div>`;
  }

  /**
   * Render interface HTML
   */
  private renderInterfaceHTML(interfaceDoc: InterfaceDocumentation, template: string): string {
    return `
<div class="interface">
    <div class="name">${interfaceDoc.name}</div>
    <div class="description">${interfaceDoc.description}</div>
    ${interfaceDoc.deprecated ? `<div class="deprecated">Deprecated: ${interfaceDoc.deprecated}</div>` : ''}
    ${interfaceDoc.since ? `<div class="since">Since: ${interfaceDoc.since}</div>` : ''}
    
    ${interfaceDoc.properties.length > 0 ? `
    <div class="properties">
        <h3>Properties</h3>
        ${interfaceDoc.properties.map(prop => `
            <div class="property">
                <strong>${prop.name}</strong>: ${this.renderTypeHTML(prop.type)}
                ${prop.isOptional ? ' (optional)' : ''}
                <div>${prop.description}</div>
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${interfaceDoc.methods.length > 0 ? `
    <div class="methods">
        <h3>Methods</h3>
        ${interfaceDoc.methods.map(method => this.renderMethodHTML(method)).join('')}
    </div>
    ` : ''}
</div>`;
  }

  /**
   * Render function HTML
   */
  private renderFunctionHTML(functionDoc: FunctionDocumentation, template: string): string {
    return `
<div class="function">
    <div class="name">${functionDoc.name}${functionDoc.isAsync ? ' (async)' : ''}(): ${this.renderTypeHTML(functionDoc.returnType)}</div>
    <div class="description">${functionDoc.description}</div>
    ${functionDoc.deprecated ? `<div class="deprecated">Deprecated: ${functionDoc.deprecated}</div>` : ''}
    ${functionDoc.since ? `<div class="since">Since: ${functionDoc.since}</div>` : ''}
    
    ${functionDoc.parameters.length > 0 ? `
    <div class="parameters">
        <h3>Parameters</h3>
        ${functionDoc.parameters.map(param => `
            <div class="parameter">
                <strong>${param.name}</strong>: ${this.renderTypeHTML(param.type)}
                ${param.isOptional ? ' (optional)' : ''}
                ${param.hasDefault ? ` = ${param.defaultValue}` : ''}
                <div>${param.description}</div>
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${functionDoc.examples.length > 0 ? `
    <div class="examples">
        <h3>Examples</h3>
        ${functionDoc.examples.map(example => `
            <div>
                <strong>${example.title}</strong>
                <div>${example.description}</div>
                <pre><code>${example.code}</code></pre>
            </div>
        `).join('')}
    </div>
    ` : ''}
</div>`;
  }

  /**
   * Render enum HTML
   */
  private renderEnumHTML(enumDoc: EnumDocumentation, template: string): string {
    return `
<div class="enum">
    <div class="name">${enumDoc.name}</div>
    <div class="description">${enumDoc.description}</div>
    ${enumDoc.deprecated ? `<div class="deprecated">Deprecated: ${enumDoc.deprecated}</div>` : ''}
    ${enumDoc.since ? `<div class="since">Since: ${enumDoc.since}</div>` : ''}
    
    <div class="members">
        <h3>Members</h3>
        ${enumDoc.members.map(member => `
            <div class="member">
                <strong>${member.name}</strong> = ${member.value}
                <div>${member.description}</div>
            </div>
        `).join('')}
    </div>
</div>`;
  }

  /**
   * Render method HTML
   */
  private renderMethodHTML(method: MethodDocumentation): string {
    return `
<div class="method">
    <div class="name">${method.name}${method.isAsync ? ' (async)' : ''}(): ${this.renderTypeHTML(method.returnType)}</div>
    <div class="description">${method.description}</div>
    ${method.deprecated ? `<div class="deprecated">Deprecated: ${method.deprecated}</div>` : ''}
    ${method.since ? `<div class="since">Since: ${method.since}</div>` : ''}
    
    ${method.parameters.length > 0 ? `
    <div class="parameters">
        <h3>Parameters</h3>
        ${method.parameters.map(param => `
            <div class="parameter">
                <strong>${param.name}</strong>: ${this.renderTypeHTML(param.type)}
                ${param.isOptional ? ' (optional)' : ''}
                ${param.hasDefault ? ` = ${param.defaultValue}` : ''}
                <div>${param.description}</div>
            </div>
        `).join('')}
    </div>
    ` : ''}
</div>`;
  }

  /**
   * Render constructor HTML
   */
  private renderConstructorHTML(ctor: ConstructorDocumentation): string {
    return `
<div class="constructor">
    <div class="name">constructor()</div>
    <div class="description">${ctor.description}</div>
    ${ctor.deprecated ? `<div class="deprecated">Deprecated: ${ctor.deprecated}</div>` : ''}
    ${ctor.since ? `<div class="since">Since: ${ctor.since}</div>` : ''}
    
    ${ctor.parameters.length > 0 ? `
    <div class="parameters">
        <h3>Parameters</h3>
        ${ctor.parameters.map(param => `
            <div class="parameter">
                <strong>${param.name}</strong>: ${this.renderTypeHTML(param.type)}
                ${param.isOptional ? ' (optional)' : ''}
                ${param.hasDefault ? ` = ${param.defaultValue}` : ''}
                <div>${param.description}</div>
            </div>
        `).join('')}
    </div>
    ` : ''}
</div>`;
  }

  /**
   * Render type HTML
   */
  private renderTypeHTML(type: TypeDocumentation): string {
    const defaultType: TypeDocumentation = {
      name: 'unknown',
      description: '',
      isUnion: false,
      isIntersection: false,
      isArray: false,
      isTuple: false,
      isFunction: false,
      isGeneric: false,
      examples: [],
      parameters: [],
      returnType: undefined,
    };

    if (type.isUnion) {
      return type.types?.map(t => this.renderTypeHTML(t || defaultType)).join(' | ') || 'unknown';
    }
    if (type.isIntersection) {
      return type.types?.map(t => this.renderTypeHTML(t || defaultType)).join(' & ') || 'unknown';
    }
    if (type.isArray) {
      return `${this.renderTypeHTML(type.types?.[0] || defaultType)}[]`;
    }
    if (type.isTuple) {
      return `[${type.types?.map(t => this.renderTypeHTML(t || defaultType)).join(', ')}]`;
    }
    if (type.isFunction) {
      const params = type.parameters?.map(p => p.name).join(', ') || '';
      return `(${params}) => ${this.renderTypeHTML(type.returnType || defaultType)}`;
    }
    return type.name || 'unknown';
  }

  /**
   * Render method Markdown
   */
  private renderMethodMarkdown(method: MethodDocumentation): string {
    let markdown = `##### ${method.name}${method.isAsync ? ' (async)' : ''}\n\n`;
    markdown += `${method.description}\n\n`;
    
    if (method.deprecated) {
      markdown += `> **Deprecated**: ${method.deprecated}\n\n`;
    }
    
    if (method.since) {
      markdown += `**Since**: ${method.since}\n\n`;
    }
    
    if (method.parameters.length > 0) {
      markdown += `###### Parameters\n\n`;
      for (const param of method.parameters) {
        markdown += `- **${param.name}** (${this.renderTypeMarkdown(param.type)}${param.isOptional ? '?' : ''}): ${param.description}\n`;
      }
      markdown += '\n';
    }
    
    return markdown;
  }

  /**
   * Render class Markdown
   */
  private renderClassMarkdown(classDoc: ClassDocumentation): string {
    let markdown = `### ${classDoc.name}\n\n`;
    markdown += `${classDoc.description}\n\n`;
    
    if (classDoc.deprecated) {
      markdown += `> **Deprecated**: ${classDoc.deprecated}\n\n`;
    }
    
    if (classDoc.since) {
      markdown += `**Since**: ${classDoc.since}\n\n`;
    }
    
    if (classDoc.properties.length > 0) {
      markdown += `#### Properties\n\n`;
      for (const prop of classDoc.properties) {
        markdown += `- **${prop.name}** (${this.renderTypeMarkdown(prop.type)}${prop.isOptional ? '?' : ''}): ${prop.description}\n`;
      }
      markdown += '\n';
    }
    
    if (classDoc.methods.length > 0) {
      markdown += `#### Methods\n\n`;
      for (const method of classDoc.methods) {
        markdown += this.renderMethodMarkdown(method);
      }
      markdown += '\n';
    }
    
    return markdown;
  }

  /**
   * Render interface Markdown
   */
  private renderInterfaceMarkdown(interfaceDoc: InterfaceDocumentation): string {
    let markdown = `### ${interfaceDoc.name}\n\n`;
    markdown += `${interfaceDoc.description}\n\n`;
    
    if (interfaceDoc.deprecated) {
      markdown += `> **Deprecated**: ${interfaceDoc.deprecated}\n\n`;
    }
    
    if (interfaceDoc.since) {
      markdown += `**Since**: ${interfaceDoc.since}\n\n`;
    }
    
    if (interfaceDoc.properties.length > 0) {
      markdown += `#### Properties\n\n`;
      for (const prop of interfaceDoc.properties) {
        markdown += `- **${prop.name}** (${this.renderTypeMarkdown(prop.type)}${prop.isOptional ? '?' : ''}): ${prop.description}\n`;
      }
      markdown += '\n';
    }
    
    return markdown;
  }

  /**
   * Render function Markdown
   */
  private renderFunctionMarkdown(functionDoc: FunctionDocumentation): string {
    let markdown = `### ${functionDoc.name}${functionDoc.isAsync ? ' (async)' : ''}\n\n`;
    markdown += `${functionDoc.description}\n\n`;
    
    if (functionDoc.deprecated) {
      markdown += `> **Deprecated**: ${functionDoc.deprecated}\n\n`;
    }
    
    if (functionDoc.since) {
      markdown += `**Since**: ${functionDoc.since}\n\n`;
    }
    
    if (functionDoc.parameters.length > 0) {
      markdown += `#### Parameters\n\n`;
      for (const param of functionDoc.parameters) {
        markdown += `- **${param.name}** (${this.renderTypeMarkdown(param.type)}${param.isOptional ? '?' : ''}): ${param.description}\n`;
      }
      markdown += '\n';
    }
    
    return markdown;
  }

  /**
   * Render enum Markdown
   */
  private renderEnumMarkdown(enumDoc: EnumDocumentation): string {
    let markdown = `### ${enumDoc.name}\n\n`;
    markdown += `${enumDoc.description}\n\n`;
    
    if (enumDoc.deprecated) {
      markdown += `> **Deprecated**: ${enumDoc.deprecated}\n\n`;
    }
    
    if (enumDoc.since) {
      markdown += `**Since**: ${enumDoc.since}\n\n`;
    }
    
    if (enumDoc.members.length > 0) {
      markdown += `#### Members\n\n`;
      for (const member of enumDoc.members) {
        markdown += `- **${member.name}** = ${member.value}: ${member.description}\n`;
      }
      markdown += '\n';
    }
    
    return markdown;
  }

  /**
   * Render type Markdown
   */
  private renderTypeMarkdown(type: TypeDocumentation): string {
    const defaultType: TypeDocumentation = {
      name: 'unknown',
      description: '',
      isUnion: false,
      isIntersection: false,
      isArray: false,
      isTuple: false,
      isFunction: false,
      isGeneric: false,
      examples: [],
      parameters: [],
      returnType: undefined,
    };

    if (type.isUnion) {
      return type.types?.map(t => this.renderTypeMarkdown(t)).join(' | ') || 'unknown';
    }
    if (type.isIntersection) {
      return type.types?.map(t => this.renderTypeMarkdown(t)).join(' & ') || 'unknown';
    }
    if (type.isArray) {
      return `${this.renderTypeMarkdown(type.types?.[0] || defaultType)}[]`;
    }
    if (type.isTuple) {
      return `[${type.types?.map(t => this.renderTypeMarkdown(t)).join(', ')}]`;
    }
    if (type.isFunction) {
      const params = type.parameters?.map(p => p.name).join(', ') || '';
      return `(${params}) => ${this.renderTypeMarkdown(type.returnType || defaultType)}`;
    }
    return type.name || 'unknown';
  }
}

// Default configuration
export const DEFAULT_DOCUMENTATION_CONFIG: DocumentationConfig = {
  inputPaths: ['./src'],
  outputPath: './docs',
  includePrivate: false,
  includeInternal: false,
  formats: ['html', 'markdown'],
  templates: {
    class: 'default',
    interface: 'default',
    function: 'default',
    enum: 'default',
    namespace: 'default',
  },
  plugins: [],
};

// Built-in plugins
export const BUILTIN_PLUGINS: DocumentationPlugin[] = [
  {
    name: 'cross-linker',
    process: (docs) => {
      // Add cross-references between related items
      return docs;
    },
  },
  {
    name: 'search-indexer',
    process: (docs) => {
      // Create search index
      return docs;
    },
  },
];

// Global documentation generator instance
export const documentationGenerator = new DocumentationGenerator(DEFAULT_DOCUMENTATION_CONFIG);

// Convenience functions
export const generateDocumentation = () => documentationGenerator.generate();
export const updateDocumentationConfig = (config: Partial<DocumentationConfig>) => {
  documentationGenerator.config = { ...documentationGenerator.config, ...config };
};
