/**
 * Scripting Language Support Index
 * Exports all scripting language features
 */

// Core scripting system
export * from './ScriptingSystem';

// Script editor
export * from './ScriptEditor';

// Documentation and examples
export * from './ScriptDocumentation';

// Re-export commonly used items
export {
  ScriptingSystem,
  createScriptingSystem,
} from './ScriptingSystem';

export {
  ScriptEditor,
  createScriptEditor,
} from './ScriptEditor';

export {
  ScriptDocumentation,
  createScriptDocumentation,
} from './ScriptDocumentation';
