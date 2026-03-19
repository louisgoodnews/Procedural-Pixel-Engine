/**
 * Comprehensive error handling utilities
 * Provides consistent error handling patterns across the engine
 */

export class EngineError extends Error {
  public readonly code: string;
  public readonly category: 'engine' | 'rendering' | 'audio' | 'input' | 'physics' | 'system' | 'user' | 'network';
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    category: EngineError['category'],
    severity: EngineError['severity'] = 'medium',
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'EngineError';
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.timestamp = new Date();
    this.context = context;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
    };
  }
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: EngineError[] = [];
  private maxLogSize = 1000;
  private subscribers = new Set<(error: EngineError) => void>();

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle an error
   */
  handleError(error: EngineError | Error | string, context?: Record<string, any>): void {
    let engineError: EngineError;

    if (error instanceof EngineError) {
      engineError = error;
    } else if (error instanceof Error) {
      engineError = new EngineError(
        error.message,
        'UNKNOWN_ERROR',
        'system',
        'medium',
        { originalError: error, ...context }
      );
    } else {
      engineError = new EngineError(
        error,
        'UNKNOWN_ERROR',
        'system',
        'medium',
        context
      );
    }

    // Log the error
    this.logError(engineError);

    // Notify subscribers
    this.notifySubscribers(engineError);

    // Handle based on severity
    this.handleBySeverity(engineError);
  }

  /**
   * Subscribe to error notifications
   */
  subscribe(callback: (error: EngineError) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Get error log
   */
  getErrors(category?: EngineError['category'], severity?: EngineError['severity']): EngineError[] {
    let errors = [...this.errorLog];

    if (category) {
      errors = errors.filter(error => error.category === category);
    }

    if (severity) {
      errors = errors.filter(error => error.severity === severity);
    }

    return errors;
  }

  /**
   * Clear error log
   */
  clearErrors(): void {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byCategory: Record<EngineError['category'], number>;
    bySeverity: Record<EngineError['severity'], number>;
    recent: EngineError[];
  } {
    const byCategory: Record<EngineError['category'], number> = {
      engine: 0,
      rendering: 0,
      audio: 0,
      input: 0,
      physics: 0,
      system: 0,
      user: 0,
      network: 0,
    };

    const bySeverity: Record<EngineError['severity'], number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    for (const error of this.errorLog) {
      byCategory[error.category]++;
      bySeverity[error.severity]++;
    }

    return {
      total: this.errorLog.length,
      byCategory,
      bySeverity,
      recent: this.errorLog.slice(-10),
    };
  }

  // Private methods

  private logError(error: EngineError): void {
    this.errorLog.push(error);

    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Console logging based on severity
    const logMethod = this.getLogMethod(error.severity);
    logMethod(`[${error.category.toUpperCase()}] ${error.code}: ${error.message}`, error);
  }

  private notifySubscribers(error: EngineError): void {
    for (const callback of this.subscribers) {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error in error subscriber callback:', callbackError);
      }
    }
  }

  private handleBySeverity(error: EngineError): void {
    switch (error.severity) {
      case 'critical':
        // Critical errors might require immediate action
        console.error('CRITICAL ERROR DETECTED - Consider shutting down gracefully');
        break;
      case 'high':
        // High errors should be logged prominently
        console.error('HIGH SEVERITY ERROR DETECTED');
        break;
      case 'medium':
        // Medium errors are normal operational errors
        break;
      case 'low':
        // Low errors are minor issues
        break;
    }
  }

  private getLogMethod(severity: EngineError['severity']): (message: string, error?: EngineError) => void {
    switch (severity) {
      case 'critical':
      case 'high':
        return console.error;
      case 'medium':
        return console.warn;
      case 'low':
        return console.log;
      default:
        return console.log;
    }
  }
}

// Utility functions for common error scenarios
export function createEngineError(
  message: string,
  code: string,
  category: EngineError['category'],
  severity?: EngineError['severity'],
  context?: Record<string, any>
): EngineError {
  return new EngineError(message, code, category, severity, context);
}

export function handleAsyncError<T>(
  promise: Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  return promise.catch((error) => {
    ErrorHandler.getInstance().handleError(error, context);
    throw error;
  });
}

export function safeExecute<T>(
  fn: () => T,
  fallback?: T,
  context?: Record<string, any>
): T | undefined {
  try {
    return fn();
  } catch (error) {
    ErrorHandler.getInstance().handleError(error as Error, context);
    return fallback;
  }
}

export function validateInput<T>(
  value: T,
  validator: (value: T) => boolean,
  errorMessage: string,
  context?: Record<string, any>
): T {
  if (!validator(value)) {
    throw createEngineError(
      errorMessage,
      'VALIDATION_ERROR',
      'user',
      'medium',
      { value, ...context }
    );
  }
  return value;
}

// Common validators
export const validators = {
  notNull: <T>(value: T): value is NonNullable<T> => value != null,
  notEmpty: (value: string): boolean => value.trim().length > 0,
  positiveNumber: (value: number): boolean => value > 0,
  nonNegativeNumber: (value: number): boolean => value >= 0,
  validId: (value: string | number): boolean => {
    const str = String(value);
    return str.length > 0 && /^[a-zA-Z0-9_-]+$/.test(str);
  },
  arrayNotEmpty: <T>(value: T[]): boolean => Array.isArray(value) && value.length > 0,
  objectNotEmpty: (value: Record<string, any>): boolean => {
    return typeof value === 'object' && value != null && Object.keys(value).length > 0;
  },
};

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();

// Global error handling for unhandled errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorHandler.handleError(event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handleError(
      new Error(`Unhandled promise rejection: ${event.reason}`),
      { reason: event.reason }
    );
  });
} else if (typeof global !== 'undefined') {
  // Node.js environment
  global.addEventListener?.('uncaughtException', (error) => {
    errorHandler.handleError(error);
  });

  global.addEventListener?.('unhandledRejection', (reason) => {
    errorHandler.handleError(
      new Error(`Unhandled promise rejection: ${reason}`),
      { reason }
    );
  });
}
