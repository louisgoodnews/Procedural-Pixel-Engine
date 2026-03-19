/**
 * Documentation system index
 * Exports all documentation generation and management tools
 */

// Core documentation system
export * from './DocumentationGenerator';

// Global instances
export {
  documentationGenerator,
  DEFAULT_DOCUMENTATION_CONFIG,
  BUILTIN_PLUGINS,
} from './DocumentationGenerator';

// Convenience functions
export {
  generateDocumentation,
  updateDocumentationConfig,
} from './DocumentationGenerator';
