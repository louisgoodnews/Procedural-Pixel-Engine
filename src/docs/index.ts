/**
 * Documentation system index
 * Exports all documentation and API reference tools
 */

// Core documentation systems
export * from './DocumentationGenerator';
export * from './APIDocumentation';

// Global instances
export {
  documentationGenerator,
  apiDocumentationSystem,
} from './DocumentationGenerator';

// Convenience functions
export {
  generateDocumentation,
  updateDocumentationConfig,
} from './DocumentationGenerator';

export {
  loadDocumentation,
  generateFromSource,
  searchDocumentation,
  exportDocumentation,
} from './APIDocumentation';
