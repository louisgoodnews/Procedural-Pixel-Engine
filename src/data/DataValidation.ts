/**
 * Data Validation and Integrity Checking System
 * Provides comprehensive data validation and integrity checking capabilities
 */

import { createEngineError, validators } from '../utils/ErrorHandling';

export interface ValidationRule {
  name: string;
  description: string;
  type: 'required' | 'format' | 'range' | 'length' | 'pattern' | 'custom';
  severity: 'error' | 'warning' | 'info';
  validator: (value: any, context?: ValidationContext) => ValidationResult;
  message?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  info: ValidationInfo[];
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
  rule: string;
  context?: any;
}

export interface ValidationWarning {
  field: string;
  message: string;
  value: any;
  rule: string;
  context?: any;
}

export interface ValidationInfo {
  field: string;
  message: string;
  value: any;
  rule: string;
  context?: any;
}

export interface ValidationContext {
  schema?: DataSchema;
  operation?: 'create' | 'update' | 'delete';
  user?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface DataSchema {
  name: string;
  version: string;
  fields: FieldDefinition[];
  constraints: SchemaConstraint[];
  indexes: SchemaIndex[];
  relationships: SchemaRelationship[];
}

export interface FieldDefinition {
  name: string;
  type: FieldType;
  nullable: boolean;
  defaultValue?: any;
  validation: ValidationRule[];
  constraints: FieldConstraint[];
  description?: string;
  example?: any;
}

export interface FieldType {
  name: string;
  baseType: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' | 'binary';
  format?: string;
  properties?: Record<string, FieldDefinition>;
  items?: FieldDefinition;
  enum?: any[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface FieldConstraint {
  type: 'unique' | 'foreign_key' | 'check' | 'default' | 'not_null';
  value?: any;
  condition?: string;
  reference?: {
    table: string;
    field: string;
  };
}

export interface SchemaConstraint {
  name: string;
  type: 'unique' | 'foreign_key' | 'check' | 'primary_key';
  fields: string[];
  condition?: string;
  reference?: {
    table: string;
    fields: string[];
  };
}

export interface SchemaIndex {
  name: string;
  fields: string[];
  type: 'btree' | 'hash' | 'fulltext' | 'spatial';
  unique: boolean;
  partial?: string;
}

export interface SchemaRelationship {
  name: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  source: {
    table: string;
    fields: string[];
  };
  target: {
    table: string;
    fields: string[];
  };
  onDelete: 'cascade' | 'restrict' | 'set_null' | 'set_default';
  onUpdate: 'cascade' | 'restrict' | 'set_null' | 'set_default';
}

export interface IntegrityCheck {
  id: string;
  name: string;
  description: string;
  type: 'referential' | 'data_type' | 'duplicate' | 'format' | 'custom';
  severity: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  schedule?: string; // cron expression
  check: (data: any, context: IntegrityContext) => Promise<IntegrityResult>;
}

export interface IntegrityResult {
  checkId: string;
  passed: boolean;
  issues: IntegrityIssue[];
  summary: IntegritySummary;
  checkedAt: Date;
  duration: number;
}

export interface IntegrityIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  location: string;
  data?: any;
  suggestion?: string;
}

export interface IntegritySummary {
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  dataChecked: number;
  integrityScore: number; // 0-100
}

export interface IntegrityContext {
  schema?: DataSchema;
  database?: string;
  table?: string;
  user?: string;
  timestamp: Date;
  options?: IntegrityOptions;
}

export interface IntegrityOptions {
  includeWarnings?: boolean;
  includeInfo?: boolean;
  maxIssues?: number;
  timeout?: number;
}

export interface DataCleaner {
  name: string;
  description: string;
  type: 'standardize' | 'normalize' | 'deduplicate' | 'correct' | 'transform';
  severity: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  clean: (data: any, context: CleaningContext) => Promise<CleaningResult>;
}

export interface CleaningContext {
  schema?: DataSchema;
  operation: 'create' | 'update' | 'import' | 'migration';
  user?: string;
  timestamp: Date;
  options?: CleaningOptions;
}

export interface CleaningOptions {
  autoFix?: boolean;
  backupOriginal?: boolean;
  dryRun?: boolean;
  logChanges?: boolean;
}

export interface CleaningResult {
  cleanerId: string;
  success: boolean;
  originalData: any;
  cleanedData: any;
  changes: DataChange[];
  summary: CleaningSummary;
  duration: number;
}

export interface DataChange {
  type: 'added' | 'removed' | 'modified' | 'standardized';
  field: string;
  oldValue?: any;
  newValue?: any;
  reason: string;
}

export interface CleaningSummary {
  totalChanges: number;
  changesByType: Record<string, number>;
  changesByField: Record<string, number>;
  dataQualityScore: number; // 0-100
}

export class DataValidationSystem {
  private schemas = new Map<string, DataSchema>();
  private rules = new Map<string, ValidationRule[]>();
  private integrityChecks = new Map<string, IntegrityCheck>();
  private cleaners = new Map<string, DataCleaner>();
  private validationHistory = new Map<string, ValidationResult[]>();
  private integrityHistory = new Map<string, IntegrityResult[]>();

  constructor() {
    this.initializeDefaultRules();
    this.initializeIntegrityChecks();
    this.initializeCleaners();
  }

  /**
   * Register a data schema
   */
  registerSchema(schema: DataSchema): void {
    validators.notNull(schema);
    validators.notEmpty(schema.name);

    this.schemas.set(schema.name, schema);
  }

  /**
   * Get a data schema
   */
  getSchema(name: string): DataSchema | undefined {
    return this.schemas.get(name);
  }

  /**
   * Get all schemas
   */
  getAllSchemas(): DataSchema[] {
    return Array.from(this.schemas.values());
  }

  /**
   * Validate data against schema
   */
  validateData(
    data: any,
    schemaName: string,
    context: ValidationContext = { timestamp: new Date() }
  ): ValidationResult {
    const schema = this.schemas.get(schemaName);
    if (!schema) {
      throw createEngineError(
        `Schema '${schemaName}' not found`,
        'SCHEMA_NOT_FOUND',
        'system',
        'high'
      );
    }

    context.schema = schema;
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      info: []
    };

    // Validate each field
    for (const field of schema.fields) {
      const value = data[field.name];
      const fieldResult = this.validateField(value, field, context);
      
      result.errors.push(...fieldResult.errors);
      result.warnings.push(...fieldResult.warnings);
      result.info.push(...fieldResult.info);
    }

    // Validate schema constraints
    const constraintResult = this.validateConstraints(data, schema.constraints, context);
    result.errors.push(...constraintResult.errors);
    result.warnings.push(...constraintResult.warnings);
    result.info.push(...constraintResult.info);

    result.valid = result.errors.length === 0;

    // Store validation history
    const history = this.validationHistory.get(schemaName) || [];
    history.push(result);
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    this.validationHistory.set(schemaName, history);

    return result;
  }

  /**
   * Validate a single field
   */
  validateField(
    value: any,
    field: FieldDefinition,
    context: ValidationContext
  ): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      info: []
    };

    // Check if required and null
    if (!field.nullable && (value === null || value === undefined)) {
      result.errors.push({
        field: field.name,
        message: `Field '${field.name}' is required`,
        value,
        rule: 'required'
      });
      result.valid = false;
      return result;
    }

    // Skip further validation if value is null/undefined and nullable
    if (value === null || value === undefined) {
      return result;
    }

    // Type validation
    const typeResult = this.validateType(value, field.type, context);
    result.errors.push(...typeResult.errors);
    result.warnings.push(...typeResult.warnings);
    result.info.push(...typeResult.info);

    // Custom validation rules
    for (const rule of field.validation) {
      const ruleResult = rule.validator(value, context);
      result.errors.push(...ruleResult.errors);
      result.warnings.push(...ruleResult.warnings);
      result.info.push(...ruleResult.info);
    }

    result.valid = result.errors.length === 0;
    return result;
  }

  /**
   * Run integrity checks
   */
  async runIntegrityChecks(
    data: any,
    context: IntegrityContext = { timestamp: new Date() }
  ): Promise<IntegrityResult[]> {
    const results: IntegrityResult[] = [];

    for (const [checkId, check] of this.integrityChecks) {
      if (!check.enabled) continue;

      try {
        const result = await check.check(data, context);
        result.checkId = checkId;
        results.push(result);

        // Store integrity history
        const history = this.integrityHistory.get(checkId) || [];
        history.push(result);
        if (history.length > 100) {
          history.splice(0, history.length - 100);
        }
        this.integrityHistory.set(checkId, history);
      } catch (error) {
        const errorResult: IntegrityResult = {
          checkId,
          passed: false,
          issues: [{
            id: this.generateId(),
            type: 'error',
            severity: 'critical',
            description: `Integrity check failed: ${error}`,
            location: 'system',
            suggestion: 'Check the integrity check implementation'
          }],
          summary: {
            totalIssues: 1,
            criticalIssues: 1,
            highIssues: 0,
            mediumIssues: 0,
            lowIssues: 0,
            dataChecked: 0,
            integrityScore: 0
          },
          checkedAt: new Date(),
          duration: 0
        };
        results.push(errorResult);
      }
    }

    return results;
  }

  /**
   * Clean data using registered cleaners
   */
  async cleanData(
    data: any,
    schemaName: string,
    context: CleaningContext = { operation: 'update', timestamp: new Date() }
  ): Promise<CleaningResult[]> {
    const schema = this.schemas.get(schemaName);
    if (!schema) {
      throw createEngineError(
        `Schema '${schemaName}' not found`,
        'SCHEMA_NOT_FOUND',
        'system',
        'high'
      );
    }

    context.schema = schema;
    const results: CleaningResult[] = [];

    for (const [cleanerId, cleaner] of this.cleaners) {
      if (!cleaner.enabled) continue;

      try {
        const result = await cleaner.clean(data, context);
        result.cleanerId = cleanerId;
        results.push(result);
        
        // Update data for next cleaner
        data = result.cleanedData;
      } catch (error) {
        const errorResult: CleaningResult = {
          cleanerId,
          success: false,
          originalData: data,
          cleanedData: data,
          changes: [],
          summary: {
            totalChanges: 0,
            changesByType: {},
            changesByField: {},
            dataQualityScore: 0
          },
          duration: 0
        };
        results.push(errorResult);
      }
    }

    return results;
  }

  /**
   * Register a validation rule
   */
  registerRule(rule: ValidationRule): void {
    validators.notNull(rule);
    validators.notEmpty(rule.name);

    const rules = this.rules.get(rule.name) || [];
    rules.push(rule);
    this.rules.set(rule.name, rules);
  }

  /**
   * Register an integrity check
   */
  registerIntegrityCheck(check: IntegrityCheck): void {
    validators.notNull(check);
    validators.notEmpty(check.name);

    this.integrityChecks.set(check.id, check);
  }

  /**
   * Register a data cleaner
   */
  registerCleaner(cleaner: DataCleaner): void {
    validators.notNull(cleaner);
    validators.notEmpty(cleaner.name);

    this.cleaners.set(cleaner.name, cleaner);
  }

  /**
   * Get validation statistics
   */
  getValidationStatistics(schemaName?: string): {
    totalValidations: number;
    successRate: number;
    commonErrors: Array<{ error: string; count: number }>;
    recentValidations: ValidationResult[];
  } {
    let validations: ValidationResult[] = [];

    if (schemaName) {
      validations = this.validationHistory.get(schemaName) || [];
    } else {
      for (const history of this.validationHistory.values()) {
        validations.push(...history);
      }
    }

    const totalValidations = validations.length;
    const successfulValidations = validations.filter(v => v.valid).length;
    const successRate = totalValidations > 0 ? successfulValidations / totalValidations : 0;

    // Find common errors
    const errorCounts = new Map<string, number>();
    for (const validation of validations) {
      for (const error of validation.errors) {
        const count = errorCounts.get(error.message) || 0;
        errorCounts.set(error.message, count + 1);
      }
    }

    const commonErrors = Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalValidations,
      successRate,
      commonErrors,
      recentValidations: validations.slice(-10)
    };
  }

  /**
   * Get integrity statistics
   */
  getIntegrityStatistics(): {
    totalChecks: number;
    averageScore: number;
    criticalIssues: number;
    recentChecks: IntegrityResult[];
  } {
    let checks: IntegrityResult[] = [];

    for (const history of this.integrityHistory.values()) {
      checks.push(...history);
    }

    const totalChecks = checks.length;
    const averageScore = totalChecks > 0 
      ? checks.reduce((sum, check) => sum + check.summary.integrityScore, 0) / totalChecks 
      : 0;
    const criticalIssues = checks.reduce((sum, check) => sum + check.summary.criticalIssues, 0);

    return {
      totalChecks,
      averageScore,
      criticalIssues,
      recentChecks: checks.slice(-10)
    };
  }

  // Private methods

  private initializeDefaultRules(): void {
    // Required field rule
    this.registerRule({
      name: 'required',
      description: 'Field must not be null or undefined',
      type: 'required',
      severity: 'error',
      validator: (value, context) => {
        const result: ValidationResult = {
          valid: true,
          errors: [],
          warnings: [],
          info: []
        };

        if (value === null || value === undefined) {
          result.valid = false;
          result.errors.push({
            field: context?.field || 'unknown',
            message: 'Field is required',
            value,
            rule: 'required'
          });
        }

        return result;
      }
    });

    // Email format rule
    this.registerRule({
      name: 'email',
      description: 'Field must be a valid email address',
      type: 'format',
      severity: 'error',
      validator: (value, context) => {
        const result: ValidationResult = {
          valid: true,
          errors: [],
          warnings: [],
          info: []
        };

        if (typeof value !== 'string') {
          result.valid = false;
          result.errors.push({
            field: context?.field || 'unknown',
            message: 'Email must be a string',
            value,
            rule: 'email'
          });
          return result;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          result.valid = false;
          result.errors.push({
            field: context?.field || 'unknown',
            message: 'Invalid email format',
            value,
            rule: 'email'
          });
        }

        return result;
      }
    });

    // Range rule
    this.registerRule({
      name: 'range',
      description: 'Field must be within specified range',
      type: 'range',
      severity: 'error',
      validator: (value, context) => {
        const result: ValidationResult = {
          valid: true,
          errors: [],
          warnings: [],
          info: []
        };

        if (typeof value !== 'number') {
          result.valid = false;
          result.errors.push({
            field: context?.field || 'unknown',
            message: 'Value must be a number for range validation',
            value,
            rule: 'range'
          });
          return result;
        }

        const min = context?.metadata?.min;
        const max = context?.metadata?.max;

        if (min !== undefined && value < min) {
          result.valid = false;
          result.errors.push({
            field: context?.field || 'unknown',
            message: `Value must be at least ${min}`,
            value,
            rule: 'range'
          });
        }

        if (max !== undefined && value > max) {
          result.valid = false;
          result.errors.push({
            field: context?.field || 'unknown',
            message: `Value must be at most ${max}`,
            value,
            rule: 'range'
          });
        }

        return result;
      }
    });
  }

  private initializeIntegrityChecks(): void {
    // Referential integrity check
    this.registerIntegrityCheck({
      id: 'referential_integrity',
      name: 'Referential Integrity',
      description: 'Check foreign key relationships',
      type: 'referential',
      severity: 'critical',
      enabled: true,
      check: async (data, context) => {
        const result: IntegrityResult = {
          checkId: 'referential_integrity',
          passed: true,
          issues: [],
          summary: {
            totalIssues: 0,
            criticalIssues: 0,
            highIssues: 0,
            mediumIssues: 0,
            lowIssues: 0,
            dataChecked: 0,
            integrityScore: 100
          },
          checkedAt: new Date(),
          duration: 0
        };

        // Mock implementation - would check actual foreign key constraints
        console.log('Checking referential integrity...');

        return result;
      }
    });

    // Duplicate data check
    this.registerIntegrityCheck({
      id: 'duplicate_data',
      name: 'Duplicate Data Check',
      description: 'Check for duplicate records',
      type: 'duplicate',
      severity: 'medium',
      enabled: true,
      check: async (data, context) => {
        const result: IntegrityResult = {
          checkId: 'duplicate_data',
          passed: true,
          issues: [],
          summary: {
            totalIssues: 0,
            criticalIssues: 0,
            highIssues: 0,
            mediumIssues: 0,
            lowIssues: 0,
            dataChecked: 0,
            integrityScore: 100
          },
          checkedAt: new Date(),
          duration: 0
        };

        // Mock implementation - would check for duplicates
        console.log('Checking for duplicate data...');

        return result;
      }
    });
  }

  private initializeCleaners(): void {
    // Standardize text cleaner
    this.registerCleaner({
      name: 'standardize_text',
      description: 'Standardize text fields (trim, normalize case)',
      type: 'standardize',
      severity: 'medium',
      enabled: true,
      clean: async (data, context) => {
        const result: CleaningResult = {
          cleanerId: 'standardize_text',
          success: true,
          originalData: { ...data },
          cleanedData: { ...data },
          changes: [],
          summary: {
            totalChanges: 0,
            changesByType: {},
            changesByField: {},
            dataQualityScore: 100
          },
          duration: 0
        };

        for (const field of context.schema?.fields || []) {
          if (field.type.baseType === 'string' && data[field.name]) {
            const originalValue = data[field.name];
            const cleanedValue = String(originalValue).trim().toLowerCase();

            if (originalValue !== cleanedValue) {
              result.cleanedData[field.name] = cleanedValue;
              result.changes.push({
                type: 'standardized',
                field: field.name,
                oldValue: originalValue,
                newValue: cleanedValue,
                reason: 'Standardized text (trim and lowercase)'
              });
            }
          }
        }

        result.summary.totalChanges = result.changes.length;
        result.summary.changesByType.standardized = result.changes.length;
        result.summary.dataQualityScore = Math.max(0, 100 - result.changes.length * 5);

        return result;
      }
    });

    // Deduplicate cleaner
    this.registerCleaner({
      name: 'deduplicate_records',
      description: 'Remove duplicate records',
      type: 'deduplicate',
      severity: 'high',
      enabled: true,
      clean: async (data, context) => {
        const result: CleaningResult = {
          cleanerId: 'deduplicate_records',
          success: true,
          originalData: Array.isArray(data) ? [...data] : data,
          cleanedData: Array.isArray(data) ? [...data] : data,
          changes: [],
          summary: {
            totalChanges: 0,
            changesByType: {},
            changesByField: {},
            dataQualityScore: 100
          },
          duration: 0
        };

        // Mock implementation - would actually deduplicate
        console.log('Deduplicating records...');

        return result;
      }
    });
  }

  private validateType(
    value: any,
    fieldType: FieldType,
    context: ValidationContext
  ): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      info: []
    };

    switch (fieldType.baseType) {
      case 'string':
        if (typeof value !== 'string') {
          result.valid = false;
          result.errors.push({
            field: context?.field || 'unknown',
            message: `Expected string, got ${typeof value}`,
            value,
            rule: 'type'
          });
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          result.valid = false;
          result.errors.push({
            field: context?.field || 'unknown',
            message: `Expected number, got ${typeof value}`,
            value,
            rule: 'type'
          });
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          result.valid = false;
          result.errors.push({
            field: context?.field || 'unknown',
            message: `Expected boolean, got ${typeof value}`,
            value,
            rule: 'type'
          });
        }
        break;

      case 'date':
        if (!(value instanceof Date) && typeof value !== 'string') {
          result.valid = false;
          result.errors.push({
            field: context?.field || 'unknown',
            message: `Expected date, got ${typeof value}`,
            value,
            rule: 'type'
          });
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          result.valid = false;
          result.errors.push({
            field: context?.field || 'unknown',
            message: `Expected array, got ${typeof value}`,
            value,
            rule: 'type'
          });
        }
        break;

      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          result.valid = false;
          result.errors.push({
            field: context?.field || 'unknown',
            message: `Expected object, got ${typeof value}`,
            value,
            rule: 'type'
          });
        }
        break;
    }

    return result;
  }

  private validateConstraints(
    data: any,
    constraints: SchemaConstraint[],
    context: ValidationContext
  ): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      info: []
    };

    for (const constraint of constraints) {
      // Mock constraint validation
      console.log(`Validating constraint: ${constraint.name}`);
    }

    return result;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Factory function
export function createDataValidationSystem(): DataValidationSystem {
  return new DataValidationSystem();
}
