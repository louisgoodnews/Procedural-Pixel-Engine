/**
 * Utility functions index
 * Exports all utility modules for error handling, validation, and common operations
 */

// Error handling utilities
export * from './ErrorHandling';

// Validation utilities
export * from './Validation';

// Re-export commonly used items
export {
  EngineError,
  ErrorHandler,
  errorHandler,
  createEngineError,
  handleAsyncError,
  safeExecute,
  validateInput,
  validators,
} from './ErrorHandling';

export {
  Validator,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  commonValidators,
  validatorSets,
  validateUserInput,
  validateEntityData,
  validateTutorialData,
  validateWikiData,
  globalValidator,
} from './Validation';
