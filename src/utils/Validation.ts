/**
 * Input validation utilities
 * Provides comprehensive validation for user inputs and API parameters
 */

import { createEngineError, validators } from './ErrorHandling';

export interface ValidationRule<T = any> {
  name: string;
  validator: (value: T) => boolean;
  message: string;
  severity?: 'low' | 'medium' | 'high';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
  rule: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  value: any;
  rule: string;
}

export class Validator {
  private rules = new Map<string, ValidationRule[]>();

  /**
   * Add a validation rule for a field
   */
  addRule<T>(field: string, rule: ValidationRule<T>): void {
    if (!this.rules.has(field)) {
      this.rules.set(field, []);
    }
    this.rules.get(field)!.push(rule);
  }

  /**
   * Add multiple validation rules for a field
   */
  addRules<T>(field: string, rules: ValidationRule<T>[]): void {
    for (const rule of rules) {
      this.addRule(field, rule);
    }
  }

  /**
   * Validate a value against its rules
   */
  validate<T>(field: string, value: T): ValidationResult {
    const fieldRules = this.rules.get(field) || [];
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const rule of fieldRules) {
      if (!rule.validator(value)) {
        const issue = {
          field,
          message: rule.message,
          value,
          rule: rule.name,
        };

        if (rule.severity === 'high') {
          errors.push(issue);
        } else {
          warnings.push(issue);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate an object with multiple fields
   */
  validateObject(obj: Record<string, any>): ValidationResult {
    let allErrors: ValidationError[] = [];
    let allWarnings: ValidationWarning[] = [];
    let isValid = true;

    for (const [field, value] of Object.entries(obj)) {
      const result = this.validate(field, value);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
      if (!result.isValid) {
        isValid = false;
      }
    }

    return {
      isValid,
      errors: allErrors,
      warnings: allWarnings,
    };
  }

  /**
   * Validate and throw error if invalid
   */
  validateAndThrow<T>(field: string, value: T, context?: Record<string, any>): T {
    const result = this.validate(field, value);
    
    if (!result.isValid) {
      const errorMessages = result.errors.map(e => `${field}: ${e.message}`).join('; ');
      throw createEngineError(
        `Validation failed: ${errorMessages}`,
        'VALIDATION_ERROR',
        'user',
        'medium',
        { field, value, errors: result.errors, ...context }
      );
    }

    return value;
  }

  /**
   * Get all rules for a field
   */
  getRules(field: string): ValidationRule[] {
    return this.rules.get(field) || [];
  }

  /**
   * Remove all rules for a field
   */
  clearRules(field: string): void {
    this.rules.delete(field);
  }

  /**
   * Remove all rules
   */
  clearAllRules(): void {
    this.rules.clear();
  }
}

// Predefined validators for common use cases
export const commonValidators = {
  // String validators
  required: (field: string): ValidationRule<string> => ({
    name: 'required',
    validator: validators.notEmpty,
    message: `${field} is required`,
    severity: 'high',
  }),

  minLength: (field: string, min: number): ValidationRule<string> => ({
    name: 'minLength',
    validator: (value) => value.length >= min,
    message: `${field} must be at least ${min} characters long`,
    severity: 'medium',
  }),

  maxLength: (field: string, max: number): ValidationRule<string> => ({
    name: 'maxLength',
    validator: (value) => value.length <= max,
    message: `${field} must be no more than ${max} characters long`,
    severity: 'medium',
  }),

  email: (field: string): ValidationRule<string> => ({
    name: 'email',
    validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: `${field} must be a valid email address`,
    severity: 'high',
  }),

  url: (field: string): ValidationRule<string> => ({
    name: 'url',
    validator: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message: `${field} must be a valid URL`,
    severity: 'high',
  }),

  // Number validators
  positiveNumber: (field: string): ValidationRule<number> => ({
    name: 'positiveNumber',
    validator: validators.positiveNumber,
    message: `${field} must be a positive number`,
    severity: 'high',
  }),

  nonNegativeNumber: (field: string): ValidationRule<number> => ({
    name: 'nonNegativeNumber',
    validator: validators.nonNegativeNumber,
    message: `${field} must be a non-negative number`,
    severity: 'medium',
  }),

  range: (field: string, min: number, max: number): ValidationRule<number> => ({
    name: 'range',
    validator: (value) => value >= min && value <= max,
    message: `${field} must be between ${min} and ${max}`,
    severity: 'high',
  }),

  integer: (field: string): ValidationRule<number> => ({
    name: 'integer',
    validator: (value) => Number.isInteger(value),
    message: `${field} must be an integer`,
    severity: 'medium',
  }),

  // Array validators
  nonEmptyArray: (field: string): ValidationRule<any[]> => ({
    name: 'nonEmptyArray',
    validator: validators.arrayNotEmpty,
    message: `${field} must not be empty`,
    severity: 'high',
  }),

  maxArrayLength: (field: string, max: number): ValidationRule<any[]> => ({
    name: 'maxArrayLength',
    validator: (value) => value.length <= max,
    message: `${field} must contain no more than ${max} items`,
    severity: 'medium',
  }),

  // Object validators
  nonEmptyObject: (field: string): ValidationRule<Record<string, any>> => ({
    name: 'nonEmptyObject',
    validator: validators.objectNotEmpty,
    message: `${field} must not be empty`,
    severity: 'high',
  }),

  hasProperty: (field: string, property: string): ValidationRule<Record<string, any>> => ({
    name: 'hasProperty',
    validator: (value) => value && typeof value === 'object' && property in value,
    message: `${field} must have property ${property}`,
    severity: 'high',
  }),

  // ID validators
  validId: (field: string): ValidationRule<string | number> => ({
    name: 'validId',
    validator: validators.validId,
    message: `${field} must be a valid ID (alphanumeric, underscore, or hyphen only)`,
    severity: 'high',
  }),

  // Custom validators
  regex: (field: string, pattern: RegExp, message?: string): ValidationRule<string> => ({
    name: 'regex',
    validator: (value) => pattern.test(value),
    message: message || `${field} must match the required pattern`,
    severity: 'medium',
  }),

  enum: <T extends string>(field: string, values: T[]): ValidationRule<T> => ({
    name: 'enum',
    validator: (value) => values.includes(value),
    message: `${field} must be one of: ${values.join(', ')}`,
    severity: 'high',
  }),

  custom: <T>(field: string, validator: (value: T) => boolean, message: string): ValidationRule<T> => ({
    name: 'custom',
    validator,
    message,
    severity: 'medium',
  }),
};

// Predefined validator sets for common scenarios
export const validatorSets = {
  user: {
    username: [
      commonValidators.required('username'),
      commonValidators.minLength('username', 3),
      commonValidators.maxLength('username', 20),
      commonValidators.regex('username', /^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
    ],
    email: [
      commonValidators.required('email'),
      commonValidators.email('email'),
    ],
    password: [
      commonValidators.required('password'),
      commonValidators.minLength('password', 8),
      commonValidators.regex('password', /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    ],
  },

  entity: {
    id: [
      commonValidators.required('id'),
      commonValidators.validId('id'),
    ],
    position: {
      x: [
        commonValidators.required('x'),
        commonValidators.nonNegativeNumber('x'),
      ],
      y: [
        commonValidators.required('y'),
        commonValidators.nonNegativeNumber('y'),
      ],
    },
    velocity: {
      x: [
        commonValidators.required('x'),
        commonValidators.custom('x', (value) => typeof value === 'number', 'Velocity x must be a number'),
      ],
      y: [
        commonValidators.required('y'),
        commonValidators.custom('y', (value) => typeof value === 'number', 'Velocity y must be a number'),
      ],
    },
  },

  tutorial: {
    title: [
      commonValidators.required('title'),
      commonValidators.minLength('title', 5),
      commonValidators.maxLength('title', 100),
    ],
    difficulty: [
      commonValidators.required('difficulty'),
      commonValidators.enum('difficulty', ['beginner', 'intermediate', 'advanced']),
    ],
    estimatedTime: [
      commonValidators.required('estimatedTime'),
      commonValidators.positiveNumber('estimatedTime'),
      commonValidators.integer('estimatedTime'),
    ],
  },

  wiki: {
    title: [
      commonValidators.required('title'),
      commonValidators.minLength('title', 3),
      commonValidators.maxLength('title', 200),
    ],
    category: [
      commonValidators.required('category'),
      commonValidators.minLength('category', 2),
      commonValidators.maxLength('category', 50),
    ],
    tags: [
      commonValidators.custom('tags', (value) => Array.isArray(value), 'Tags must be an array'),
      commonValidators.maxArrayLength('tags', 10),
    ],
  },
};

// Convenience functions for common validation scenarios
export function validateUserInput(data: Record<string, any>): ValidationResult {
  const validator = new Validator();
  
  // Add user validation rules
  Object.entries(validatorSets.user).forEach(([field, rules]) => {
    validator.addRules(field, rules as ValidationRule<any>[]);
  });

  return validator.validateObject(data);
}

export function validateEntityData(data: Record<string, any>): ValidationResult {
  const validator = new Validator();
  
  // Add entity validation rules
  Object.entries(validatorSets.entity).forEach(([field, rules]) => {
    if (typeof rules === 'object' && !Array.isArray(rules)) {
      // Nested object rules
      Object.entries(rules).forEach(([subField, subRules]) => {
        validator.addRules(`${field}.${subField}`, subRules as ValidationRule<any>[]);
      });
    } else {
      // Direct rules
      validator.addRules(field, rules as ValidationRule<any>[]);
    }
  });

  return validator.validateObject(data);
}

export function validateTutorialData(data: Record<string, any>): ValidationResult {
  const validator = new Validator();
  
  // Add tutorial validation rules
  Object.entries(validatorSets.tutorial).forEach(([field, rules]) => {
    validator.addRules(field, rules as ValidationRule<any>[]);
  });

  return validator.validateObject(data);
}

export function validateWikiData(data: Record<string, any>): ValidationResult {
  const validator = new Validator();
  
  // Add wiki validation rules
  Object.entries(validatorSets.wiki).forEach(([field, rules]) => {
    validator.addRules(field, rules as ValidationRule<any>[]);
  });

  return validator.validateObject(data);
}

// Global validator instance
export const globalValidator = new Validator();
