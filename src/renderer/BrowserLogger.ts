/**
 * Browser-Compatible Logger
 * 
 * Logging system that works in browser environment without Node.js dependencies
 */

export enum LogLevel {
  VERBOSE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
}

export class BrowserLogger {
  private static logs: LogEntry[] = [];
  private static maxLogs = 1000;
  private static currentLevel: LogLevel = LogLevel.INFO;

  static setLevel(level: LogLevel): void {
    BrowserLogger.currentLevel = level;
    console.log(`[BrowserLogger] Log level set to: ${LogLevel[level]}`);
  }

  static verbose(category: string, message: string, data?: any): void {
    BrowserLogger.log(LogLevel.VERBOSE, category, message, data);
  }

  static debug(category: string, message: string, data?: any): void {
    BrowserLogger.log(LogLevel.DEBUG, category, message, data);
  }

  static info(category: string, message: string, data?: any): void {
    BrowserLogger.log(LogLevel.INFO, category, message, data);
  }

  static warn(category: string, message: string, data?: any): void {
    BrowserLogger.log(LogLevel.WARN, category, message, data);
  }

  static error(category: string, message: string, data?: any): void {
    BrowserLogger.log(LogLevel.ERROR, category, message, data);
  }

  static fatal(category: string, message: string, data?: any): void {
    BrowserLogger.log(LogLevel.FATAL, category, message, data);
  }

  private static log(level: LogLevel, category: string, message: string, data?: any): void {
    if (level < BrowserLogger.currentLevel) return;

    const timestamp = new Date().toISOString();
    const entry: LogEntry = {
      timestamp,
      level,
      category,
      message,
      data
    };

    // Add to memory buffer
    BrowserLogger.logs.push(entry);
    if (BrowserLogger.logs.length > BrowserLogger.maxLogs) {
      BrowserLogger.logs.shift();
    }

    // Output to console
    const levelName = LogLevel[level].padEnd(5);
    const categoryStr = category.padEnd(20);
    const logMessage = `[${timestamp}] [${levelName}] [${categoryStr}] ${message}`;

    switch (level) {
      case LogLevel.VERBOSE:
      case LogLevel.DEBUG:
        console.debug(logMessage, data);
        break;
      case LogLevel.INFO:
        console.info(logMessage, data);
        break;
      case LogLevel.WARN:
        console.warn(logMessage, data);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(logMessage, data);
        break;
    }
  }

  static getRecentLogs(count: number = 100): LogEntry[] {
    return BrowserLogger.logs.slice(-count);
  }

  static getLogsByCategory(category: string): LogEntry[] {
    return BrowserLogger.logs.filter(entry => entry.category === category);
  }

  static exportLogs(): string {
    return JSON.stringify(BrowserLogger.logs, null, 2);
  }

  static clearLogs(): void {
    BrowserLogger.logs = [];
    console.log("[BrowserLogger] Logs cleared");
  }

  static downloadLogs(): void {
    const logsData = BrowserLogger.exportLogs();
    const blob = new Blob([logsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `engine-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
