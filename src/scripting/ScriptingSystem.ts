/**
 * Scripting Language Support System
 * Provides multi-language scripting capabilities for the engine
 */

import { createEngineError, validators } from '../utils/ErrorHandling';

export interface ScriptLanguage {
  name: string;
  version: string;
  extensions: string[];
  mimeType: string;
  isCompiled: boolean;
  isInterpreted: boolean;
  supportsHotReload: boolean;
  supportsDebugging: boolean;
}

export interface ScriptContext {
  id: string;
  language: ScriptLanguage;
  sandbox: boolean;
  timeout: number;
  memoryLimit: number;
  allowedAPIs: string[];
  globals: Record<string, any>;
  modules: Map<string, any>;
}

export interface ScriptModule {
  name: string;
  content: string;
  language: ScriptLanguage;
  compiled: boolean;
  exports: any;
  dependencies: string[];
  metadata: ScriptMetadata;
}

export interface ScriptMetadata {
  version: string;
  author: string;
  description: string;
  tags: string[];
  created: Date;
  modified: Date;
  dependencies: string[];
  engines: Record<string, string>;
}

export interface ScriptExecution {
  id: string;
  moduleId: string;
  contextId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'error' | 'timeout' | 'cancelled';
  result?: any;
  error?: Error;
  performance: ExecutionPerformance;
}

export interface ExecutionPerformance {
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  apiCalls: number;
  errors: number;
}

export interface ScriptDebugger {
  breakpoints: Set<string>;
  stepMode: 'none' | 'step' | 'stepOver' | 'stepOut';
  currentLine?: number;
  currentFile?: string;
  variables: Record<string, any>;
  callStack: CallFrame[];
}

export interface CallFrame {
  function: string;
  file: string;
  line: number;
  variables: Record<string, any>;
}

export interface ScriptProfiler {
  enabled: boolean;
  samples: ProfileSample[];
  functions: Map<string, ProfileFunction>;
  totalExecutionTime: number;
  memoryProfile: MemoryProfile;
}

export interface ProfileSample {
  timestamp: number;
  stack: string[];
  memory: number;
}

export interface ProfileFunction {
  name: string;
  calls: number;
  totalTime: number;
  averageTime: number;
  maxTime: number;
  minTime: number;
}

export interface MemoryProfile {
  totalAllocated: number;
  totalFreed: number;
  currentUsage: number;
  peakUsage: number;
  allocations: Map<string, number>;
}

export class ScriptingSystem {
  private languages = new Map<string, ScriptLanguage>();
  private contexts = new Map<string, ScriptContext>();
  private modules = new Map<string, ScriptModule>();
  private executions = new Map<string, ScriptExecution>();
  private debuggers = new Map<string, ScriptDebugger>();
  private profilers = new Map<string, ScriptProfiler>();
  private hotReloadWatchers = new Map<string, any>();

  constructor() {
    this.initializeDefaultLanguages();
  }

  /**
   * Register a scripting language
   */
  registerLanguage(language: ScriptLanguage): void {
    validators.notNull(language);
    validators.notEmpty(language.name);

    this.languages.set(language.name.toLowerCase(), language);
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): ScriptLanguage[] {
    return Array.from(this.languages.values());
  }

  /**
   * Create a script context
   */
  createContext(
    language: string,
    options: {
      sandbox?: boolean;
      timeout?: number;
      memoryLimit?: number;
      allowedAPIs?: string[];
      globals?: Record<string, any>;
    } = {}
  ): ScriptContext {
    const lang = this.languages.get(language.toLowerCase());
    if (!lang) {
      throw createEngineError(
        `Scripting language '${language}' not supported`,
        'LANGUAGE_NOT_SUPPORTED',
        'system',
        'high'
      );
    }

    const context: ScriptContext = {
      id: this.generateId(),
      language: lang,
      sandbox: options.sandbox ?? true,
      timeout: options.timeout ?? 30000,
      memoryLimit: options.memoryLimit ?? 50 * 1024 * 1024, // 50MB
      allowedAPIs: options.allowedAPIs ?? this.getDefaultAPIs(),
      globals: options.globals ?? {},
      modules: new Map()
    };

    this.contexts.set(context.id, context);
    return context;
  }

  /**
   * Load a script module
   */
  async loadModule(
    name: string,
    content: string,
    language: string,
    metadata?: Partial<ScriptMetadata>
  ): Promise<ScriptModule> {
    const lang = this.languages.get(language.toLowerCase());
    if (!lang) {
      throw createEngineError(
        `Scripting language '${language}' not supported`,
        'LANGUAGE_NOT_SUPPORTED',
        'system',
        'high'
      );
    }

    const module: ScriptModule = {
      name,
      content,
      language: lang,
      compiled: false,
      exports: {},
      dependencies: [],
      metadata: {
        version: '1.0.0',
        author: 'Unknown',
        description: '',
        tags: [],
        created: new Date(),
        modified: new Date(),
        dependencies: [],
        engines: {},
        ...metadata
      }
    };

    // Parse dependencies
    module.dependencies = this.parseDependencies(content, language);

    // Compile if necessary
    if (lang.isCompiled) {
      await this.compileModule(module);
    }

    this.modules.set(name, module);
    return module;
  }

  /**
   * Execute a script
   */
  async executeScript(
    moduleName: string,
    contextId: string,
    functionName?: string,
    ...args: any[]
  ): Promise<ScriptExecution> {
    const module = this.modules.get(moduleName);
    if (!module) {
      throw createEngineError(
        `Script module '${moduleName}' not found`,
        'MODULE_NOT_FOUND',
        'system',
        'high'
      );
    }

    const context = this.contexts.get(contextId);
    if (!context) {
      throw createEngineError(
        `Script context '${contextId}' not found`,
        'CONTEXT_NOT_FOUND',
        'system',
        'high'
      );
    }

    const execution: ScriptExecution = {
      id: this.generateId(),
      moduleId: moduleName,
      contextId,
      startTime: new Date(),
      status: 'running',
      performance: {
        executionTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        apiCalls: 0,
        errors: 0
      }
    };

    this.executions.set(execution.id, execution);

    try {
      // Set up profiler if enabled
      const profiler = this.profilers.get(contextId);
      if (profiler?.enabled) {
        this.startProfiling(profiler, execution);
      }

      // Execute the script
      const result = await this.executeModule(module, context, functionName, args, execution);
      
      execution.result = result;
      execution.status = 'completed';
    } catch (error) {
      execution.error = error as Error;
      execution.status = 'error';
      execution.performance.errors++;
    } finally {
      execution.endTime = new Date();
      execution.performance.executionTime = execution.endTime.getTime() - execution.startTime.getTime();
    }

    return execution;
  }

  /**
   * Enable hot reload for a module
   */
  enableHotReload(moduleName: string, filePath: string): void {
    this.disableHotReload(moduleName);

    // In a real implementation, would set up file system watcher
    const watcher = {
      filePath,
      enabled: true,
      lastModified: Date.now()
    };

    this.hotReloadWatchers.set(moduleName, watcher);
    console.log(`Hot reload enabled for module '${moduleName}' watching '${filePath}'`);
  }

  /**
   * Disable hot reload for a module
   */
  disableHotReload(moduleName: string): void {
    const watcher = this.hotReloadWatchers.get(moduleName);
    if (watcher) {
      watcher.enabled = false;
      this.hotReloadWatchers.delete(moduleName);
      console.log(`Hot reload disabled for module '${moduleName}'`);
    }
  }

  /**
   * Create debugger for context
   */
  createScriptDebugger(contextId: string): ScriptDebugger {
    const scriptDebugger: ScriptDebugger = {
      breakpoints: new Set(),
      stepMode: 'none',
      variables: {},
      callStack: []
    };

    this.debuggers.set(contextId, scriptDebugger);
    return scriptDebugger;
  }

  /**
   * Create profiler for context
   */
  createProfiler(contextId: string): ScriptProfiler {
    const profiler: ScriptProfiler = {
      enabled: false,
      samples: [],
      functions: new Map(),
      totalExecutionTime: 0,
      memoryProfile: {
        totalAllocated: 0,
        totalFreed: 0,
        currentUsage: 0,
        peakUsage: 0,
        allocations: new Map()
      }
    };

    this.profilers.set(contextId, profiler);
    return profiler;
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(contextId?: string): {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    totalExecutionTime: number;
    memoryUsage: number;
  } {
    let executions = Array.from(this.executions.values());
    
    if (contextId) {
      executions = executions.filter(e => e.contextId === contextId);
    }

    const successful = executions.filter(e => e.status === 'completed');
    const failed = executions.filter(e => e.status === 'error');
    const totalTime = executions.reduce((sum, e) => sum + e.performance.executionTime, 0);
    const avgTime = executions.length > 0 ? totalTime / executions.length : 0;
    const memoryUsage = executions.reduce((sum, e) => sum + e.performance.memoryUsage, 0);

    return {
      totalExecutions: executions.length,
      successfulExecutions: successful.length,
      failedExecutions: failed.length,
      averageExecutionTime: avgTime,
      totalExecutionTime: totalTime,
      memoryUsage
    };
  }

  // Private methods

  private initializeDefaultLanguages(): void {
    // JavaScript/TypeScript
    this.registerLanguage({
      name: 'javascript',
      version: 'ES2022',
      extensions: ['.js', '.mjs', '.ts'],
      mimeType: 'application/javascript',
      isCompiled: false,
      isInterpreted: true,
      supportsHotReload: true,
      supportsDebugging: true
    });

    // Lua
    this.registerLanguage({
      name: 'lua',
      version: '5.4',
      extensions: ['.lua'],
      mimeType: 'text/x-lua',
      isCompiled: false,
      isInterpreted: true,
      supportsHotReload: true,
      supportsDebugging: true
    });

    // Python
    this.registerLanguage({
      name: 'python',
      version: '3.11',
      extensions: ['.py'],
      mimeType: 'text/x-python',
      isCompiled: false,
      isInterpreted: true,
      supportsHotReload: true,
      supportsDebugging: true
    });
  }

  private getDefaultAPIs(): string[] {
    return [
      'console.log',
      'console.warn',
      'console.error',
      'Math.*',
      'Date.*',
      'Array.*',
      'Object.*',
      'String.*',
      'Number.*',
      'Boolean.*',
      'JSON.*'
    ];
  }

  private parseDependencies(content: string, language: string): string[] {
    const dependencies: string[] = [];

    switch (language.toLowerCase()) {
      case 'javascript':
      case 'typescript':
        // Parse import statements
        const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
          dependencies.push(match[1]);
        }
        break;

      case 'lua':
        // Parse require statements
        const requireRegex = /require\s*\(['"]([^'"]+)['"]\)/g;
        while ((match = requireRegex.exec(content)) !== null) {
          dependencies.push(match[1]);
        }
        break;

      case 'python':
        // Parse import statements
        const pythonImportRegex = /(?:import|from)\s+([^\s]+)/g;
        while ((match = pythonImportRegex.exec(content)) !== null) {
          dependencies.push(match[1]);
        }
        break;
    }

    return dependencies;
  }

  private async compileModule(module: ScriptModule): Promise<void> {
    // In a real implementation, would compile based on language
    console.log(`Compiling module '${module.name}' (${module.language.name})`);
    module.compiled = true;
  }

  private async executeModule(
    module: ScriptModule,
    context: ScriptContext,
    functionName?: string,
    args: any[] = [],
    execution: ScriptExecution
  ): Promise<any> {
    switch (module.language.name.toLowerCase()) {
      case 'javascript':
      case 'typescript':
        return this.executeJavaScript(module, context, functionName, args, execution);
      case 'lua':
        return this.executeLua(module, context, functionName, args, execution);
      case 'python':
        return this.executePython(module, context, functionName, args, execution);
      default:
        throw createEngineError(
          `Execution not implemented for language '${module.language.name}'`,
          'EXECUTION_NOT_IMPLEMENTED',
          'system',
          'high'
        );
    }
  }

  private async executeJavaScript(
    module: ScriptModule,
    context: ScriptContext,
    functionName?: string,
    args: any[] = [],
    execution: ScriptExecution
  ): Promise<any> {
    // Create sandboxed execution environment
    const sandbox = this.createSandbox(context, execution);
    
    // Execute the module
    const moduleFunction = new Function(...Object.keys(sandbox), module.content);
    const result = moduleFunction(...Object.values(sandbox));

    // If specific function requested, call it
    if (functionName && typeof result === 'object' && result[functionName]) {
      return result[functionName](...args);
    }

    return result;
  }

  private async executeLua(
    module: ScriptModule,
    context: ScriptContext,
    functionName?: string,
    args: any[] = [],
    execution: ScriptExecution
  ): Promise<any> {
    // In a real implementation, would use Lua interpreter
    console.log(`Executing Lua module '${module.name}'`);
    return { luaResult: 'mock' };
  }

  private async executePython(
    module: ScriptModule,
    context: ScriptContext,
    functionName?: string,
    args: any[] = [],
    execution: ScriptExecution
  ): Promise<any> {
    // In a real implementation, would use Python interpreter
    console.log(`Executing Python module '${module.name}'`);
    return { pythonResult: 'mock' };
  }

  private createSandbox(context: ScriptContext, execution: ScriptExecution): Record<string, any> {
    const sandbox: Record<string, any> = {
      ...context.globals,
      console: {
        log: (...args: any[]) => {
          console.log(`[${context.id}]`, ...args);
          execution.performance.apiCalls++;
        },
        warn: (...args: any[]) => {
          console.warn(`[${context.id}]`, ...args);
          execution.performance.apiCalls++;
        },
        error: (...args: any[]) => {
          console.error(`[${context.id}]`, ...args);
          execution.performance.apiCalls++;
          execution.performance.errors++;
        }
      },
      require: (moduleName: string) => {
        const module = this.modules.get(moduleName);
        if (!module) {
          throw new Error(`Module '${moduleName}' not found`);
        }
        execution.performance.apiCalls++;
        return module.exports;
      }
    };

    // Add allowed APIs
    for (const api of context.allowedAPIs) {
      if (api.includes('*')) {
        const pattern = api.replace('*', '.*');
        const regex = new RegExp(`^${pattern}$`);
        // Add matching global objects
        for (const [key, value] of Object.entries(globalThis)) {
          if (regex.test(key)) {
            sandbox[key] = value;
          }
        }
      } else if (api in globalThis) {
        sandbox[api] = (globalThis as any)[api];
      }
    }

    return sandbox;
  }

  private startProfiling(profiler: ScriptProfiler, execution: ScriptExecution): void {
    profiler.enabled = true;
    profiler.samples = [];
    profiler.totalExecutionTime = 0;

    // Start sampling
    const sampleInterval = setInterval(() => {
      if (execution.status === 'running') {
        profiler.samples.push({
          timestamp: Date.now(),
          stack: ['mock_stack'], // In real implementation, would capture actual stack
          memory: performance.memory?.usedJSHeapSize || 0
        });
      } else {
        clearInterval(sampleInterval);
      }
    }, 100); // Sample every 100ms
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Factory function
export function createScriptingSystem(): ScriptingSystem {
  return new ScriptingSystem();
}
