/**
 * Simple Debug Logger
 * 
 * Fallback logging system for debugging UI loading issues
 */

export class DebugLogger {
  private static logs: string[] = [];
  
  static log(level: string, category: string, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] [${category}] ${message}`;
    
    this.logs.push(logEntry);
    console.log(logEntry);
    
    if (data) {
      console.log('Data:', data);
    }
    
    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs.shift();
    }
  }
  
  static debug(category: string, message: string, data?: any): void {
    this.log('DEBUG', category, message, data);
  }
  
  static info(category: string, message: string, data?: any): void {
    this.log('INFO', category, message, data);
  }
  
  static warn(category: string, message: string, data?: any): void {
    this.log('WARN', category, message, data);
  }
  
  static error(category: string, message: string, data?: any): void {
    this.log('ERROR', category, message, data);
  }
  
  static exportLogs(): string[] {
    return [...this.logs];
  }
}
