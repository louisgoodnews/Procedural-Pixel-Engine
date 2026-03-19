// Vector3 interface (local definition to avoid import issues)
export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

// Enums
export enum NodeType {
    // Math nodes
    Add = 0,
    Subtract = 1,
    Multiply = 2,
    Divide = 3,
    Power = 4,
    Sqrt = 5,
    Abs = 6,
    Min = 7,
    Max = 8,
    Clamp = 9,
    Lerp = 10,
    Sin = 11,
    Cos = 12,
    Tan = 13,
    Asin = 14,
    Acos = 15,
    Atan = 16,
    Atan2 = 17,
    // Logic nodes
    And = 18,
    Or = 19,
    Not = 20,
    Xor = 21,
    Equal = 22,
    NotEqual = 23,
    Greater = 24,
    Less = 25,
    GreaterEqual = 26,
    LessEqual = 27,
    // Flow control nodes
    If = 28,
    Switch = 29,
    ForLoop = 30,
    WhileLoop = 31,
    ForEach = 32,
    Break = 33,
    Continue = 34,
    Return = 35,
    // Variable nodes
    Variable = 36,
    SetVariable = 37,
    GetVariable = 38,
    Constant = 39,
    // Function nodes
    Function = 40,
    CallFunction = 41,
    ReturnFunction = 42,
    // Array nodes
    Array = 43,
    GetArrayElement = 44,
    SetArrayElement = 45,
    ArrayLength = 46,
    ArrayPush = 47,
    ArrayPop = 48,
    // Object nodes
    Object = 49,
    GetProperty = 50,
    SetProperty = 51,
    HasProperty = 52,
    DeleteProperty = 53,
    // String nodes
    String = 54,
    Concat = 55,
    Substring = 56,
    Length = 57,
    ToUpper = 58,
    ToLower = 59,
    Split = 60,
    Join = 61,
    // Custom nodes
    Custom = 62,
}

export enum NodeCategory {
    Math = 0,
    Logic = 1,
    FlowControl = 2,
    Variable = 3,
    Function = 4,
    Array = 5,
    Object = 6,
    String = 7,
    Custom = 8,
    Utility = 9,
}

export enum DataType {
    Number = 0,
    Boolean = 1,
    String = 2,
    Array = 3,
    Object = 4,
    Function = 5,
    Any = 6,
    Void = 7,
}

export enum ExecutionState {
    Ready = 0,
    Running = 1,
    Paused = 2,
    Completed = 3,
    Error = 4,
    Breakpoint = 5,
}

// Interfaces
export interface NodePort {
    id: string;
    name: string;
    dataType: DataType;
    isInput: boolean;
    isConnected: boolean;
    value: NodeValue;
}

export interface NodeValue {
    type: 'number' | 'boolean' | 'string' | 'array' | 'object' | 'null' | 'undefined';
    value: any;
}

export interface VisualNode {
    id: string;
    nodeType: NodeType;
    category: NodeCategory;
    name: string;
    description: string;
    position: Vector3;
    inputs: NodePort[];
    outputs: NodePort[];
    properties: Record<string, NodeValue>;
    isEnabled: boolean;
    hasBreakpoint: boolean;
    executionCount: number;
    lastExecutionTime: number;
}

export interface NodeConnection {
    id: string;
    sourceNodeId: string;
    sourcePortId: string;
    targetNodeId: string;
    targetPortId: string;
    isEnabled: boolean;
}

export interface VisualScript {
    id: string;
    name: string;
    description: string;
    nodes: Record<string, VisualNode>;
    connections: NodeConnection[];
    variables: Record<string, NodeValue>;
    functions: Record<string, VisualFunction>;
    entryPointId?: string;
    isEnabled: boolean;
    autoExecute: boolean;
}

export interface VisualFunction {
    id: string;
    name: string;
    parameters: NodePort[];
    returnType: DataType;
    body: VisualScript;
    isAsync: boolean;
}

export interface DebugInfo {
    nodeId: string;
    executionState: ExecutionState;
    currentValue: NodeValue;
    executionTime: number;
    errorMessage?: string;
    callStack: string[];
}

export interface PerformanceProfile {
    nodeId: string;
    executionCount: number;
    totalTime: number;
    averageTime: number;
    maxTime: number;
    minTime: number;
    memoryUsage: number;
}

export interface VisualScriptConfig {
    enableDebugging: boolean;
    enableProfiling: boolean;
    enableBreakpoints: boolean;
    maxExecutionTime: number;
    maxNodes: number;
    enableOptimization: boolean;
    enableCodeGeneration: boolean;
    enableCollaborativeEditing: boolean;
    autoSave: boolean;
    saveInterval: number;
}

export interface VisualScriptStats {
    totalScripts: number;
    activeScripts: number;
    totalNodes: number;
    activeNodes: number;
    totalConnections: number;
    totalFunctions: number;
    totalVariables: number;
    executionCount: number;
    averageExecutionTime: number;
    totalExecutionTime: number;
    memoryUsage: number;
}

// Main class
export class RustVisualScript {
    private engine: any;
    private initialized: boolean = false;

    constructor() {
        this.engine = null;
    }

    async initialize(config: VisualScriptConfig): Promise<void> {
        try {
            // Import the WASM module
            const wasmModule = await import('../../pkg/procedural_pixel_engine_core');
            
            // Create the visual script engine
            this.engine = new wasmModule.VisualScriptEngineExport(config);
            this.initialized = true;
            
            console.log('✅ Rust Visual Script Engine initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Rust Visual Script Engine:', error);
            throw error;
        }
    }

    isInitialized(): boolean {
        return this.initialized;
    }

    // Configuration
    updateConfig(config: VisualScriptConfig): void {
        if (!this.initialized) {
            throw new Error('Visual Script Engine not initialized');
        }
        this.engine.update_config(config);
    }

    getConfig(): VisualScriptConfig {
        if (!this.initialized) {
            throw new Error('Visual Script Engine not initialized');
        }
        return this.engine.get_config();
    }

    // Statistics
    getStats(): VisualScriptStats {
        if (!this.initialized) {
            throw new Error('Visual Script Engine not initialized');
        }
        return this.engine.get_stats();
    }

    getScriptSummary(): string {
        if (!this.initialized) {
            throw new Error('Visual Script Engine not initialized');
        }
        return this.engine.get_script_summary();
    }

    // Script Management
    createScript(id: string, name: string, description: string): { success: boolean; message: string } {
        if (!this.initialized) {
            return { success: false, message: 'Visual Script Engine not initialized' };
        }
        const result = this.engine.create_script(id, name, description);
        return {
            success: result === 'success',
            message: result
        };
    }

    getScripts(): VisualScript[] {
        if (!this.initialized) {
            throw new Error('Visual Script Engine not initialized');
        }
        return this.engine.get_scripts();
    }

    // Node Management
    addNode(scriptId: string, node: VisualNode): { success: boolean; message: string } {
        if (!this.initialized) {
            return { success: false, message: 'Visual Script Engine not initialized' };
        }
        // This would need to be implemented in the Rust module
        return { success: false, message: 'Not implemented yet' };
    }

    // Execution
    executeScript(scriptId: string): { success: boolean; result?: NodeValue; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Visual Script Engine not initialized' };
        }
        try {
            const result = this.engine.execute_script(scriptId);
            return { success: true, result };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    // Debugging
    setBreakpoint(scriptId: string, nodeId: string): { success: boolean; message: string } {
        if (!this.initialized) {
            return { success: false, message: 'Visual Script Engine not initialized' };
        }
        const result = this.engine.set_breakpoint(scriptId, nodeId);
        return {
            success: result === 'success',
            message: result
        };
    }

    getDebugInfo(): DebugInfo[] {
        if (!this.initialized) {
            throw new Error('Visual Script Engine not initialized');
        }
        return this.engine.get_debug_info();
    }

    // Performance profiling
    getPerformanceProfiles(): Record<string, PerformanceProfile> {
        if (!this.initialized) {
            throw new Error('Visual Script Engine not initialized');
        }
        return this.engine.get_performance_profiles();
    }

    // Code generation
    generateCode(scriptId: string, language: string): { success: boolean; code?: string; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Visual Script Engine not initialized' };
        }
        try {
            const code = this.engine.generate_code(scriptId, language);
            return { success: true, code };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    // Utility methods
    static createDefaultConfig(): VisualScriptConfig {
        return {
            enableDebugging: true,
            enableProfiling: true,
            enableBreakpoints: true,
            maxExecutionTime: 5000.0,
            maxNodes: 1000,
            enableOptimization: true,
            enableCodeGeneration: true,
            enableCollaborativeEditing: false,
            autoSave: true,
            saveInterval: 30000,
        };
    }

    static createDebugConfig(): VisualScriptConfig {
        return {
            enableDebugging: true,
            enableProfiling: true,
            enableBreakpoints: true,
            maxExecutionTime: 10000.0,
            maxNodes: 500,
            enableOptimization: false,
            enableCodeGeneration: false,
            enableCollaborativeEditing: false,
            autoSave: false,
            saveInterval: 0,
        };
    }

    static createProductionConfig(): VisualScriptConfig {
        return {
            enableDebugging: false,
            enableProfiling: false,
            enableBreakpoints: false,
            maxExecutionTime: 1000.0,
            maxNodes: 2000,
            enableOptimization: true,
            enableCodeGeneration: false,
            enableCollaborativeEditing: false,
            autoSave: true,
            saveInterval: 60000,
        };
    }

    static createCollaborativeConfig(): VisualScriptConfig {
        return {
            enableDebugging: true,
            enableProfiling: true,
            enableBreakpoints: true,
            maxExecutionTime: 5000.0,
            maxNodes: 1500,
            enableOptimization: true,
            enableCodeGeneration: true,
            enableCollaborativeEditing: true,
            autoSave: true,
            saveInterval: 15000,
        };
    }

    // Node factory methods
    static createMathNode(
        id: string,
        type: NodeType.Add | NodeType.Subtract | NodeType.Multiply | NodeType.Divide,
        name: string,
        position: Vector3
    ): VisualNode {
        return {
            id,
            nodeType: type,
            category: NodeCategory.Math,
            name,
            description: `${name} math operation`,
            position,
            inputs: [
                {
                    id: `${id}_input_a`,
                    name: 'A',
                    dataType: DataType.Number,
                    isInput: true,
                    isConnected: false,
                    value: { type: 'number', value: 0 }
                },
                {
                    id: `${id}_input_b`,
                    name: 'B',
                    dataType: DataType.Number,
                    isInput: true,
                    isConnected: false,
                    value: { type: 'number', value: 0 }
                }
            ],
            outputs: [
                {
                    id: `${id}_output`,
                    name: 'Result',
                    dataType: DataType.Number,
                    isInput: false,
                    isConnected: false,
                    value: { type: 'number', value: 0 }
                }
            ],
            properties: {},
            isEnabled: true,
            hasBreakpoint: false,
            executionCount: 0,
            lastExecutionTime: 0
        };
    }

    static createLogicNode(
        id: string,
        type: NodeType.And | NodeType.Or | NodeType.Not,
        name: string,
        position: Vector3
    ): VisualNode {
        const inputs: NodePort[] = [];
        
        if (type === NodeType.Not) {
            inputs.push({
                id: `${id}_input`,
                name: 'Input',
                dataType: DataType.Boolean,
                isInput: true,
                isConnected: false,
                value: { type: 'boolean', value: false }
            });
        } else {
            inputs.push(
                {
                    id: `${id}_input_a`,
                    name: 'A',
                    dataType: DataType.Boolean,
                    isInput: true,
                    isConnected: false,
                    value: { type: 'boolean', value: false }
                },
                {
                    id: `${id}_input_b`,
                    name: 'B',
                    dataType: DataType.Boolean,
                    isInput: true,
                    isConnected: false,
                    value: { type: 'boolean', value: false }
                }
            );
        }

        return {
            id,
            nodeType: type,
            category: NodeCategory.Logic,
            name,
            description: `${name} logic operation`,
            position,
            inputs,
            outputs: [
                {
                    id: `${id}_output`,
                    name: 'Result',
                    dataType: DataType.Boolean,
                    isInput: false,
                    isConnected: false,
                    value: { type: 'boolean', value: false }
                }
            ],
            properties: {},
            isEnabled: true,
            hasBreakpoint: false,
            executionCount: 0,
            lastExecutionTime: 0
        };
    }

    static createVariableNode(
        id: string,
        type: NodeType.Variable | NodeType.SetVariable | NodeType.GetVariable,
        name: string,
        variableName: string,
        position: Vector3
    ): VisualNode {
        const inputs: NodePort[] = [];
        const outputs: NodePort[] = [];

        if (type === NodeType.SetVariable) {
            inputs.push({
                id: `${id}_value`,
                name: 'Value',
                dataType: DataType.Any,
                isInput: true,
                isConnected: false,
                value: { type: 'null', value: null }
            });
        } else if (type === NodeType.GetVariable) {
            outputs.push({
                id: `${id}_output`,
                name: 'Value',
                dataType: DataType.Any,
                isInput: false,
                isConnected: false,
                value: { type: 'null', value: null }
            });
        }

        return {
            id,
            nodeType: type,
            category: NodeCategory.Variable,
            name,
            description: `${name} variable operation`,
            position,
            inputs,
            outputs,
            properties: {
                name: { type: 'string', value: variableName }
            },
            isEnabled: true,
            hasBreakpoint: false,
            executionCount: 0,
            lastExecutionTime: 0
        };
    }

    static createConstantNode(
        id: string,
        name: string,
        value: NodeValue,
        dataType: DataType,
        position: Vector3
    ): VisualNode {
        return {
            id,
            nodeType: NodeType.Constant,
            category: NodeCategory.Variable,
            name,
            description: `${name} constant value`,
            position,
            inputs: [],
            outputs: [
                {
                    id: `${id}_output`,
                    name: 'Value',
                    dataType,
                    isInput: false,
                    isConnected: false,
                    value
                }
            ],
            properties: {
                value: value
            },
            isEnabled: true,
            hasBreakpoint: false,
            executionCount: 0,
            lastExecutionTime: 0
        };
    }

    static createIfNode(
        id: string,
        name: string,
        position: Vector3
    ): VisualNode {
        return {
            id,
            nodeType: NodeType.If,
            category: NodeCategory.FlowControl,
            name,
            description: `${name} conditional logic`,
            position,
            inputs: [
                {
                    id: `${id}_condition`,
                    name: 'Condition',
                    dataType: DataType.Boolean,
                    isInput: true,
                    isConnected: false,
                    value: { type: 'boolean', value: false }
                },
                {
                    id: `${id}_true`,
                    name: 'True',
                    dataType: DataType.Any,
                    isInput: true,
                    isConnected: false,
                    value: { type: 'null', value: null }
                },
                {
                    id: `${id}_false`,
                    name: 'False',
                    dataType: DataType.Any,
                    isInput: true,
                    isConnected: false,
                    value: { type: 'null', value: null }
                }
            ],
            outputs: [
                {
                    id: `${id}_output`,
                    name: 'Result',
                    dataType: DataType.Any,
                    isInput: false,
                    isConnected: false,
                    value: { type: 'null', value: null }
                }
            ],
            properties: {},
            isEnabled: true,
            hasBreakpoint: false,
            executionCount: 0,
            lastExecutionTime: 0
        };
    }

    static createConnection(
        id: string,
        sourceNodeId: string,
        sourcePortId: string,
        targetNodeId: string,
        targetPortId: string
    ): NodeConnection {
        return {
            id,
            sourceNodeId,
            sourcePortId,
            targetNodeId,
            targetPortId,
            isEnabled: true
        };
    }

    // Utility functions for node values
    static createNumberValue(value: number): NodeValue {
        return { type: 'number', value };
    }

    static createBooleanValue(value: boolean): NodeValue {
        return { type: 'boolean', value };
    }

    static createStringValue(value: string): NodeValue {
        return { type: 'string', value };
    }

    static createArrayValue(value: any[]): NodeValue {
        return { type: 'array', value };
    }

    static createObjectValue(value: Record<string, any>): NodeValue {
        return { type: 'object', value };
    }

    static createNullValue(): NodeValue {
        return { type: 'null', value: null };
    }

    static createUndefinedValue(): NodeValue {
        return { type: 'undefined', value: undefined };
    }

    // Analysis methods
    analyzePerformance(): {
        totalNodes: number;
        averageExecutionTime: number;
        slowestNodes: PerformanceProfile[];
        recommendations: string[];
    } {
        if (!this.isInitialized) {
            throw new Error('Visual Script Engine not initialized');
        }

        const profiles = this.getPerformanceProfiles();
        const stats = this.getStats();
        
        const profileArray = Object.values(profiles);
        const averageExecutionTime = profileArray.length > 0 
            ? profileArray.reduce((sum, profile) => sum + profile.averageTime, 0) / profileArray.length
            : 0;

        const slowestNodes = profileArray
            .sort((a, b) => b.averageTime - a.averageTime)
            .slice(0, 5);

        const recommendations: string[] = [];
        
        if (averageExecutionTime > 10) {
            recommendations.push('Consider optimizing slow nodes');
        }
        
        if (stats.totalNodes > 500) {
            recommendations.push('Large script detected, consider breaking into smaller functions');
        }
        
        if (slowestNodes.length > 0 && slowestNodes[0].averageTime > 50) {
            recommendations.push(`Slowest node (${slowestNodes[0].nodeId}) takes ${slowestNodes[0].averageTime.toFixed(2)}ms`);
        }

        return {
            totalNodes: stats.totalNodes,
            averageExecutionTime,
            slowestNodes,
            recommendations
        };
    }

    analyzeDebugInfo(): {
        totalExecutions: number;
        errorCount: number;
        breakpointHits: number;
        recentErrors: DebugInfo[];
        recommendations: string[];
    } {
        if (!this.isInitialized) {
            throw new Error('Visual Script Engine not initialized');
        }

        const debugInfo = this.getDebugInfo();
        const stats = this.getStats();
        
        const errorCount = debugInfo.filter(info => info.executionState === ExecutionState.Error).length;
        const breakpointHits = debugInfo.filter(info => info.executionState === ExecutionState.Breakpoint).length;
        const recentErrors = debugInfo
            .filter(info => info.executionState === ExecutionState.Error)
            .slice(-5);

        const recommendations: string[] = [];
        
        if (errorCount > 0) {
            recommendations.push('Fix errors in script execution');
        }
        
        if (breakpointHits > 0) {
            recommendations.push('Breakpoints hit during execution');
        }
        
        if (stats.executionCount > 100 && errorCount / stats.executionCount > 0.1) {
            recommendations.push('High error rate detected, review script logic');
        }

        return {
            totalExecutions: stats.executionCount,
            errorCount,
            breakpointHits,
            recentErrors,
            recommendations
        };
    }

    generateReport(): string {
        if (!this.isInitialized) {
            return 'Visual Script Engine not initialized';
        }

        const stats = this.getStats();
        const performance = this.analyzePerformance();
        const debug = this.analyzeDebugInfo();

        return `
🎨 Visual Script Engine Report
=============================

System Statistics:
- Total Scripts: ${stats.totalScripts}
- Active Scripts: ${stats.activeScripts}
- Total Nodes: ${stats.totalNodes}
- Active Nodes: ${stats.activeNodes}
- Total Connections: ${stats.totalConnections}
- Total Functions: ${stats.totalFunctions}
- Total Variables: ${stats.totalVariables}
- Execution Count: ${stats.executionCount}
- Average Execution Time: ${stats.averageExecutionTime.toFixed(2)}ms
- Total Execution Time: ${stats.totalExecutionTime.toFixed(2)}ms
- Memory Usage: ${stats.memoryUsage} bytes

Performance Analysis:
- Total Nodes: ${performance.totalNodes}
- Average Execution Time: ${performance.averageExecutionTime.toFixed(2)}ms
- Slowest Nodes: ${performance.slowestNodes.length}
${performance.slowestNodes.map(node => `  - ${node.nodeId}: ${node.averageTime.toFixed(2)}ms`).join('\n')}

Recommendations:
${performance.recommendations.map(rec => `  - ${rec}`).join('\n')}

Debug Analysis:
- Total Executions: ${debug.totalExecutions}
- Error Count: ${debug.errorCount}
- Breakpoint Hits: ${debug.breakpointHits}
- Recent Errors: ${debug.recentErrors.length}

Recent Errors:
${debug.recentErrors.map(error => `  - ${error.nodeId}: ${error.errorMessage}`).join('\n')}

Debug Recommendations:
${debug.recommendations.map(rec => `  - ${rec}`).join('\n')}
        `.trim();
    }
}
