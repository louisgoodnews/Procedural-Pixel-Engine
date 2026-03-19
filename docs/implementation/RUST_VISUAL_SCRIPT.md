# Rust Visual Script System

## Overview

The Rust Visual Script System is a comprehensive visual programming environment that allows users to create complex logic and behaviors through a node-based interface. Built with performance and extensibility in mind, it provides a powerful visual scripting solution for game development, automation, and interactive applications.

## Features

### 🔧 Node System
- **Math Nodes**: Addition, subtraction, multiplication, division, power, sqrt, abs, min, max, clamp, lerp, trigonometric functions
- **Logic Nodes**: AND, OR, NOT, XOR, equality, comparison operations
- **Flow Control Nodes**: IF statements, switch cases, loops (for, while, foreach), break, continue, return
- **Variable Nodes**: Variable get/set, constants, property access
- **Function Nodes**: Function definition, calls, returns, parameters
- **Array Nodes**: Array operations, element access, length, push/pop
- **Object Nodes**: Property access, manipulation, deletion
- **String Nodes**: String operations, concatenation, substring, case conversion, split/join
- **Custom Nodes**: Extensible system for creating custom node types

### 🐛 Debugging System
- **Breakpoints**: Set breakpoints on any node for step-by-step debugging
- **Step Execution**: Execute scripts step by step with full control
- **Variable Inspection**: View variable values at any point during execution
- **Call Stack**: Track execution flow and call hierarchy
- **Error Reporting**: Detailed error messages with stack traces
- **Debug Console**: Real-time debugging output and logging

### 📊 Performance Profiling
- **Node Performance**: Track execution time for each node
- **Script Statistics**: Comprehensive performance metrics
- **Bottleneck Detection**: Identify slow nodes and optimization opportunities
- **Memory Usage**: Monitor memory consumption during execution
- **Execution Counting**: Track how often nodes are executed
- **Performance Recommendations**: Automated optimization suggestions

### 🔀 Code Generation
- **TypeScript**: Generate TypeScript code from visual scripts
- **JavaScript**: Generate JavaScript code for web deployment
- **Rust**: Generate Rust code for high-performance applications
- **Code Optimization**: Optimized code generation for better performance
- **Custom Templates**: Extensible code generation templates

### 🤝 Collaborative Editing
- **Real-time Collaboration**: Multiple users can edit scripts simultaneously
- **Conflict Resolution**: Automatic conflict detection and resolution
- **Version Control**: Track changes and maintain version history
- **Session Management**: Create and join collaborative editing sessions
- **User Presence**: See who is editing what in real-time

## Quick Start

### Installation

```typescript
import { RustVisualScript } from './rust-wrappers/RustVisualScript';
```

### Basic Setup

```typescript
// Create visual script engine
const visualScript = new RustVisualScript();

// Initialize with configuration
const config = RustVisualScript.createDefaultConfig();
await visualScript.initialize(config);

// Create a new script
const result = visualScript.createScript('my_script', 'My First Script', 'A test script');
if (!result.success) {
    console.error('Failed to create script:', result.message);
}

// Create nodes
const addNode = RustVisualScript.createMathNode(
    'add_1',
    NodeType.Add,
    'Add Numbers',
    { x: 0, y: 0, z: 0 }
);

const constant1 = RustVisualScript.createConstantNode(
    'const_1',
    'Number 5',
    RustVisualScript.createNumberValue(5),
    DataType.Number,
    { x: -100, y: 0, z: 0 }
);

const constant2 = RustVisualScript.createConstantNode(
    'const_2',
    'Number 3',
    RustVisualScript.createNumberValue(3),
    DataType.Number,
    { x: -100, y: 100, z: 0 }
);

// Execute script
const executionResult = visualScript.executeScript('my_script');
if (executionResult.success) {
    console.log('Script executed successfully:', executionResult.result);
} else {
    console.error('Script execution failed:', executionResult.error);
}
```

## API Reference

### RustVisualScript Class

#### Constructor
```typescript
constructor()
```
Creates a new visual script engine instance.

#### Initialization
```typescript
async initialize(config: VisualScriptConfig): Promise<void>
```
Initializes the visual script engine with the specified configuration.

#### Configuration
```typescript
updateConfig(config: VisualScriptConfig): void
getConfig(): VisualScriptConfig
```
Updates or retrieves the current visual script configuration.

#### Statistics
```typescript
getStats(): VisualScriptStats
getScriptSummary(): string
```
Retrieves visual script statistics and generates a comprehensive summary.

### Script Management

#### Create Script
```typescript
createScript(id: string, name: string, description: string): { success: boolean; message: string }
```
Creates a new visual script with the specified parameters.

#### Get Scripts
```typescript
getScripts(): VisualScript[]
```
Retrieves all visual scripts.

### Node Management

#### Add Node
```typescript
addNode(scriptId: string, node: VisualNode): { success: boolean; message: string }
```
Adds a new node to the specified script.

### Execution

#### Execute Script
```typescript
executeScript(scriptId: string): { success: boolean; result?: NodeValue; error?: string }
```
Executes the specified visual script.

### Debugging

#### Set Breakpoint
```typescript
setBreakpoint(scriptId: string, nodeId: string): { success: boolean; message: string }
```
Sets a breakpoint on the specified node.

#### Get Debug Info
```typescript
getDebugInfo(): DebugInfo[]
```
Retrieves debugging information from the last execution.

### Performance Profiling

#### Get Performance Profiles
```typescript
getPerformanceProfiles(): Record<string, PerformanceProfile>
```
Retrieves performance profiles for all nodes.

#### Analyze Performance
```typescript
analyzePerformance(): {
    totalNodes: number;
    averageExecutionTime: number;
    slowestNodes: PerformanceProfile[];
    recommendations: string[];
}
```
Analyzes performance and provides recommendations.

### Code Generation

#### Generate Code
```typescript
generateCode(scriptId: string, language: string): { success: boolean; code?: string; error?: string }
```
Generates code from the specified visual script.

## Node Types

### Math Nodes

#### Add Node
```typescript
const addNode = RustVisualScript.createMathNode(
    'add_1',
    NodeType.Add,
    'Add Numbers',
    { x: 0, y: 0, z: 0 }
);
```
Adds two numeric values.

#### Subtract Node
```typescript
const subtractNode = RustVisualScript.createMathNode(
    'subtract_1',
    NodeType.Subtract,
    'Subtract Numbers',
    { x: 0, y: 0, z: 0 }
);
```
Subtracts the second value from the first.

#### Multiply Node
```typescript
const multiplyNode = RustVisualScript.createMathNode(
    'multiply_1',
    NodeType.Multiply,
    'Multiply Numbers',
    { x: 0, y: 0, z: 0 }
);
```
Multiplies two numeric values.

#### Divide Node
```typescript
const divideNode = RustVisualScript.createMathNode(
    'divide_1',
    NodeType.Divide,
    'Divide Numbers',
    { x: 0, y: 0, z: 0 }
);
```
Divides the first value by the second.

### Logic Nodes

#### AND Node
```typescript
const andNode = RustVisualScript.createLogicNode(
    'and_1',
    NodeType.And,
    'Logical AND',
    { x: 0, y: 0, z: 0 }
);
```
Performs logical AND operation on two boolean values.

#### OR Node
```typescript
const orNode = RustVisualScript.createLogicNode(
    'or_1',
    NodeType.Or,
    'Logical OR',
    { x: 0, y: 0, z: 0 }
);
```
Performs logical OR operation on two boolean values.

#### NOT Node
```typescript
const notNode = RustVisualScript.createLogicNode(
    'not_1',
    NodeType.Not,
    'Logical NOT',
    { x: 0, y: 0, z: 0 }
);
```
Performs logical NOT operation on a boolean value.

### Variable Nodes

#### Get Variable Node
```typescript
const getVarNode = RustVisualScript.createVariableNode(
    'get_var',
    NodeType.GetVariable,
    'Get Variable',
    'myVariable',
    { x: 0, y: 0, z: 0 }
);
```
Retrieves the value of a variable.

#### Set Variable Node
```typescript
const setVarNode = RustVisualScript.createVariableNode(
    'set_var',
    NodeType.SetVariable,
    'Set Variable',
    'myVariable',
    { x: 0, y: 0, z: 0 }
);
```
Sets the value of a variable.

#### Constant Node
```typescript
const constantNode = RustVisualScript.createConstantNode(
    'constant_1',
    'Constant Value',
    RustVisualScript.createNumberValue(42),
    DataType.Number,
    { x: 0, y: 0, z: 0 }
);
```
Creates a constant value node.

### Flow Control Nodes

#### IF Node
```typescript
const ifNode = RustVisualScript.createIfNode(
    'if_1',
    'Conditional Logic',
    { x: 0, y: 0, z: 0 }
);
```
Performs conditional logic based on a boolean condition.

## Data Types

### NodeValue
```typescript
interface NodeValue {
    type: 'number' | 'boolean' | 'string' | 'array' | 'object' | 'null' | 'undefined';
    value: any;
}
```

### Utility Functions
```typescript
// Create different types of values
const numValue = RustVisualScript.createNumberValue(3.14);
const boolValue = RustVisualScript.createBooleanValue(true);
const strValue = RustVisualScript.createStringValue('Hello');
const arrValue = RustVisualScript.createArrayValue([1, 2, 3]);
const objValue = RustVisualScript.createObjectValue({ key: 'value' });
const nullValue = RustVisualScript.createNullValue();
const undefValue = RustVisualScript.createUndefinedValue();
```

## Configuration

### VisualScriptConfig Interface

```typescript
interface VisualScriptConfig {
    enableDebugging: boolean;           // Enable debugging features
    enableProfiling: boolean;          // Enable performance profiling
    enableBreakpoints: boolean;        // Enable breakpoint functionality
    maxExecutionTime: number;          // Maximum execution time in milliseconds
    maxNodes: number;                  // Maximum number of nodes per script
    enableOptimization: boolean;        // Enable script optimization
    enableCodeGeneration: boolean;     // Enable code generation
    enableCollaborativeEditing: boolean; // Enable collaborative editing
    autoSave: boolean;                 // Enable automatic saving
    saveInterval: number;               // Save interval in milliseconds
}
```

### Configuration Presets

#### Default Configuration
```typescript
const config = RustVisualScript.createDefaultConfig();
```
Enables most features with balanced settings.

#### Debug Configuration
```typescript
const config = RustVisualScript.createDebugConfig();
```
Enables all debugging features, disables optimization.

#### Production Configuration
```typescript
const config = RustVisualScript.createProductionConfig();
```
Optimized for production use, disables debugging.

#### Collaborative Configuration
```typescript
const config = RustVisualScript.createCollaborativeConfig();
```
Enables collaborative editing and debugging features.

#### Custom Configuration
```typescript
const config = RustVisualScript.createDefaultConfig();
config.maxNodes = 500;
config.maxExecutionTime = 2500;
config.saveInterval = 45000;
```

## Usage Examples

### Simple Calculator

```typescript
// Create a simple calculator script
const calculator = new RustVisualScript();
await calculator.initialize(RustVisualScript.createDefaultConfig());

// Create script
calculator.createScript('calculator', 'Simple Calculator', 'Basic arithmetic operations');

// Create input constants
const num1 = RustVisualScript.createConstantNode(
    'num1',
    'First Number',
    RustVisualScript.createNumberValue(10),
    DataType.Number,
    { x: -100, y: 0, z: 0 }
);

const num2 = RustVisualScript.createConstantNode(
    'num2',
    'Second Number',
    RustVisualScript.createNumberValue(5),
    DataType.Number,
    { x: -100, y: 100, z: 0 }
);

// Create math operations
const add = RustVisualScript.createMathNode('add', NodeType.Add, 'Add', { x: 0, y: 0, z: 0 });
const multiply = RustVisualScript.createMathNode('multiply', NodeType.Multiply, 'Multiply', { x: 200, y: 0, z: 0 });

// Create connections
const conn1 = RustVisualScript.createConnection('conn1', 'num1', 'num1_output', 'add', 'add_input_a');
const conn2 = RustVisualScript.createConnection('conn2', 'num2', 'num2_output', 'add', 'add_input_b');
const conn3 = RustVisualScript.createConnection('conn3', 'add', 'add_output', 'multiply', 'multiply_input_a');
const conn4 = RustVisualScript.createConnection('conn4', 'num2', 'num2_output', 'multiply', 'multiply_input_b');

// Execute
const result = calculator.executeScript('calculator');
console.log('Calculator result:', result);
```

### Conditional Logic

```typescript
// Create a conditional decision system
const decisionSystem = new RustVisualScript();
await decisionSystem.initialize(RustVisualScript.createDefaultConfig());

decisionSystem.createScript('decision', 'Decision System', 'Conditional logic example');

// Create condition
const healthCheck = RustVisualScript.createConstantNode(
    'health',
    'Player Health',
    RustVisualScript.createNumberValue(75),
    DataType.Number,
    { x: -100, y: 0, z: 0 }
);

const healthThreshold = RustVisualScript.createConstantNode(
    'threshold',
    'Health Threshold',
    RustVisualScript.createNumberValue(50),
    DataType.Number,
    { x: -100, y: 100, z: 0 }
);

// Create comparison (would need a comparison node)
const isHealthy = RustVisualScript.createLogicNode(
    'is_healthy',
    NodeType.And,
    'Is Healthy',
    { x: 0, y: 0, z: 0 }
);

// Create conditional actions
const actionIfTrue = RustVisualScript.createConstantNode(
    'action_true',
    'Healthy Action',
    RustVisualScript.createStringValue('Player is healthy'),
    DataType.String,
    { x: 200, y: -50, z: 0 }
);

const actionIfFalse = RustVisualScript.createConstantNode(
    'action_false',
    'Unhealthy Action',
    RustVisualScript.createStringValue('Player needs healing'),
    DataType.String,
    { x: 200, y: 50, z: 0 }
);

// Create IF node
const decision = RustVisualScript.createIfNode('decision', 'Health Decision', { x: 400, y: 0, z: 0 });

// Execute decision
const result = decisionSystem.executeScript('decision');
console.log('Decision result:', result);
```

### Variable Management

```typescript
// Create a variable management system
const varSystem = new RustVisualScript();
await varSystem.initialize(RustVisualScript.createDefaultConfig());

varSystem.createScript('variables', 'Variable Management', 'Variable operations example');

// Create variable nodes
const setScore = RustVisualScript.createVariableNode(
    'set_score',
    NodeType.SetVariable,
    'Set Score',
    'playerScore',
    { x: 0, y: 0, z: 0 }
);

const getScore = RustVisualScript.createVariableNode(
    'get_score',
    NodeType.GetVariable,
    'Get Score',
    'playerScore',
    { x: 200, y: 0, z: 0 }
);

// Create score value
const scoreValue = RustVisualScript.createConstantNode(
    'score_value',
    'Score Value',
    RustVisualScript.createNumberValue(100),
    DataType.Number,
    { x: -100, y: 0, z: 0 }
);

// Create increment operation
const increment = RustVisualScript.createMathNode(
    'increment',
    NodeType.Add,
    'Increment Score',
    { x: 400, y: 0, z: 0 }
);

const incrementValue = RustVisualScript.createConstantNode(
    'increment_value',
    'Increment Value',
    RustVisualScript.createNumberValue(10),
    DataType.Number,
    { x: 300, y: 100, z: 0 }
);

// Execute variable operations
const result = varSystem.executeScript('variables');
console.log('Variable operation result:', result);
```

## Performance Considerations

### Optimization Tips

1. **Node Count Management**
   - Limit the number of nodes per script for better performance
   - Break complex scripts into smaller, reusable functions
   - Use sub-scripts for modular organization

2. **Execution Optimization**
   - Enable optimization in production configurations
   - Use appropriate execution time limits
   - Monitor performance profiles regularly

3. **Memory Management**
   - Clear unused scripts and nodes
   - Use object pooling for frequently created nodes
   - Monitor memory usage in performance profiles

4. **Debugging Overhead**
   - Disable debugging in production
   - Use breakpoints sparingly during development
   - Profile with debugging disabled for accurate measurements

### Performance Metrics

The visual script system provides comprehensive performance metrics:

- **Execution Time**: Time taken to execute each node
- **Memory Usage**: Memory consumption during execution
- **Node Count**: Total number of nodes in scripts
- **Execution Count**: How many times scripts have been executed
- **Error Rate**: Frequency of execution errors

## Troubleshooting

### Common Issues

#### Script Not Executing
```typescript
// Check if engine is initialized
try {
    visualScript.getConfig();
} catch (error) {
    console.error('Engine not initialized:', error);
}

// Check if script exists
const scripts = visualScript.getScripts();
if (!scripts.find(s => s.id === 'my_script')) {
    console.error('Script not found');
}
```

#### Node Not Working
```typescript
// Check node configuration
const node = RustVisualScript.createMathNode('test', NodeType.Add, 'Test', { x: 0, y: 0, z: 0 });
if (node.inputs.length !== 2) {
    console.error('Node has incorrect input count');
}

// Check data types
if (node.inputs[0].dataType !== DataType.Number) {
    console.error('Node has incorrect data type');
}
```

#### Performance Issues
```typescript
// Analyze performance
const performance = visualScript.analyzePerformance();
console.log('Performance analysis:', performance);

// Check recommendations
if (performance.recommendations.length > 0) {
    console.log('Optimization recommendations:');
    performance.recommendations.forEach(rec => console.log(`- ${rec}`));
}
```

#### Debugging Issues
```typescript
// Check debug info
const debugInfo = visualScript.getDebugInfo();
console.log('Debug information:', debugInfo);

// Check for errors
const errors = debugInfo.filter(info => info.executionState === ExecutionState.Error);
if (errors.length > 0) {
    console.log('Execution errors:');
    errors.forEach(error => console.log(`- ${error.nodeId}: ${error.errorMessage}`));
}
```

### Debug Mode

Enable comprehensive debugging for development:

```typescript
const debugConfig = RustVisualScript.createDebugConfig();
await visualScript.initialize(debugConfig);

// Set breakpoints
visualScript.setBreakpoint('script_id', 'node_id');

// Execute and debug
const result = visualScript.executeScript('script_id');
const debugInfo = visualScript.getDebugInfo();
```

## Best Practices

### Script Organization

1. **Modular Design**
   - Break complex logic into smaller scripts
   - Use function nodes for reusable code
   - Organize nodes by functionality

2. **Naming Conventions**
   - Use descriptive names for scripts and nodes
   - Follow consistent naming patterns
   - Include version numbers for script iterations

3. **Documentation**
   - Add descriptions to scripts and nodes
   - Comment complex logic flows
   - Maintain script documentation

### Performance Optimization

1. **Node Efficiency**
   - Minimize the number of nodes in critical paths
   - Use optimized node types for common operations
   - Avoid unnecessary data conversions

2. **Script Structure**
   - Place frequently used nodes early in execution order
   - Use conditional logic to skip expensive operations
   - Cache results of expensive computations

3. **Memory Management**
   - Clean up unused scripts and variables
   - Use appropriate data types to minimize memory usage
   - Monitor memory consumption in production

### Error Handling

1. **Validation**
   - Validate inputs before processing
   - Check for null/undefined values
   - Use type checking where appropriate

2. **Graceful Degradation**
   - Provide fallback values for missing data
   - Handle errors without crashing the entire script
   - Log errors for debugging purposes

3. **Testing**
   - Test scripts with various input combinations
   - Verify edge cases and boundary conditions
   - Use performance testing for critical scripts

## API Compatibility

### Browser Support

The visual script system requires:
- **WebAssembly**: Modern browsers with WASM support
- **TypeScript**: TypeScript 4.0+ for type safety
- **ES6+**: Modern JavaScript features

### Version Compatibility

- **Rust Visual Script**: 1.0.0+
- **WebAssembly**: Current version
- **TypeScript**: 4.0+

### Breaking Changes

Major versions may include breaking changes. Always check the migration guide when upgrading.

## Contributing

### Development Setup

1. Clone the repository
2. Install Rust and wasm-pack
3. Build the WASM module:
   ```bash
   cd src/rust
   wasm-pack build --target web --out-dir ../../pkg
   ```
4. Run tests:
   ```typescript
   import { RustVisualScriptTest } from './integration/RustVisualScriptTest';
   
   const test = new RustVisualScriptTest();
   await test.runAllTests();
   ```

### Code Style

- Follow Rust naming conventions
- Use TypeScript strict mode
- Include comprehensive documentation
- Write unit tests for new features

### Pull Requests

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Update documentation
5. Submit pull request

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation
- Run the test suite for diagnostics

## Changelog

### Version 1.0.0
- Initial release of visual script system
- Complete node system with math, logic, and flow control
- Comprehensive debugging and profiling features
- Code generation for TypeScript, JavaScript, and Rust
- Collaborative editing support
- Full TypeScript integration
- Comprehensive test suite
- Complete documentation

---

*Last updated: 2026-03-16*
