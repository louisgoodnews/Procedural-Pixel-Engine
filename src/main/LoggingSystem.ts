// Browser-compatible UUID generator
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

import { mkdir, writeFile, appendFile, readFile, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { createGzip } from "node:zlib";
import { pipeline } from "node:stream/promises";
import { Readable, Writable } from "node:stream";
import { LogLevel, LogEntry, LoggerConfig, SessionLogger, LogCompiler, LoggingSystem, LogFilter } from "../shared/types/logging";

export class Logger {
  private static instance: LoggingSystem = {
    globalConfig: {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: true,
      enableSessionFiles: true,
      logDirectory: "./logs",
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      enableCompression: true,
      categories: ["*"], // All categories
      excludedCategories: [],
      sessionSpecific: true,
      compileLogs: true,
    },
    sessionLoggers: new Map(),
    compiler: {
      enabled: true,
      outputFormat: "json",
      includeStackTrace: true,
      includeSessionInfo: true,
      compressionLevel: 6,
      outputDirectory: "./logs/compiled",
      enableCompression: true,
    },
    currentSession: null,
  };

  private static initialized = false;

  static async initialize(config?: Partial<LoggerConfig>): Promise<void> {
    if (this.initialized) return;

    // Merge provided config with defaults
    if (config) {
      this.instance.globalConfig = { ...this.instance.globalConfig, ...config };
    }

    // Ensure log directory exists
    await mkdir(this.instance.globalConfig.logDirectory, { recursive: true });
    await mkdir(this.instance.compiler.outputDirectory, { recursive: true });

    this.initialized = true;
    this.info("LoggingSystem", "Logger initialized", { config: this.instance.globalConfig });
  }

  static createSession(sessionId?: string): string {
    const id = sessionId || generateUUID();
    const logFile = path.join(this.instance.globalConfig.logDirectory, `session-${id}.log`);
    
    const sessionLogger: SessionLogger = {
      sessionId: id,
      logFile,
      startTime: new Date().toISOString(),
      config: { ...this.instance.globalConfig },
      entries: [],
    };

    this.instance.sessionLoggers.set(id, sessionLogger);
    this.instance.currentSession = id;

    this.info("LoggingSystem", `Session created: ${id}`, { logFile });
    return id;
  }

  static closeSession(sessionId?: string): void {
    const id = sessionId || this.instance.currentSession;
    if (!id) return;

    const sessionLogger = this.instance.sessionLoggers.get(id);
    if (sessionLogger) {
      this.info("LoggingSystem", `Session closed: ${id}`, { 
        duration: Date.now() - new Date(sessionLogger.startTime).getTime(),
        entryCount: sessionLogger.entries.length 
      });
      
      if (this.instance.globalConfig.compileLogs) {
        this.compileSessionLogs(id).catch(error => {
          this.error("LoggingSystem", `Failed to compile session logs: ${id}`, error);
        });
      }
    }

    this.instance.sessionLoggers.delete(id);
    if (this.instance.currentSession === id) {
      this.instance.currentSession = null;
    }
  }

  static setLevel(level: LogLevel): void {
    this.instance.globalConfig.level = level;
    this.info("LoggingSystem", `Log level set to: ${LogLevel[level]}`);
  }

  static setCategory(categories: string[], excluded?: string[]): void {
    this.instance.globalConfig.categories = categories;
    this.instance.globalConfig.excludedCategories = excluded || [];
    this.info("LoggingSystem", "Categories updated", { categories, excluded });
  }

  // Logging methods
  static verbose(category: string, message: string, data?: any): void {
    this.log(LogLevel.VERBOSE, category, message, data);
  }

  static debug(category: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  static info(category: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, category, message, data);
  }

  static warn(category: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, category, message, data);
  }

  static error(category: string, message: string, data?: any): void {
    this.log(LogLevel.ERROR, category, message, data);
  }

  static fatal(category: string, message: string, data?: any): void {
    this.log(LogLevel.FATAL, category, message, data);
  }

  private static log(level: LogLevel, category: string, message: string, data?: any): void {
    if (!this.initialized) return;

    // Check if we should log this level
    if (level < this.instance.globalConfig.level) return;

    // Check category filters
    if (!this.shouldLogCategory(category)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      sessionId: this.instance.currentSession || undefined,
      stackTrace: level >= LogLevel.ERROR ? new Error().stack : undefined,
    };

    // Console logging
    if (this.instance.globalConfig.enableConsole) {
      this.logToConsole(entry);
    }

    // File logging
    if (this.instance.globalConfig.enableFile) {
      this.logToFile(entry);
    }

    // Session-specific logging
    if (this.instance.globalConfig.enableSessionFiles && this.instance.currentSession) {
      this.logToSession(entry);
    }
  }

  private static shouldLogCategory(category: string): boolean {
    const { categories, excludedCategories } = this.instance.globalConfig;
    
    // Check exclusions first
    if (excludedCategories.includes(category)) return false;
    
    // Check inclusions
    return categories.includes("*") || categories.includes(category);
  }

  private static logToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const levelName = LogLevel[entry.level];
    const prefix = `[${timestamp}] [${levelName}] [${entry.category}]`;
    
    switch (entry.level) {
      case LogLevel.VERBOSE:
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.data || "");
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.data || "");
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.data || "");
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(prefix, entry.message, entry.data || "");
        if (entry.stackTrace) {
          console.error(entry.stackTrace);
        }
        break;
    }
  }

  private static async logToFile(entry: LogEntry): Promise<void> {
    const logFile = path.join(this.instance.globalConfig.logDirectory, "engine.log");
    
    try {
      const logLine = JSON.stringify(entry) + "\n";
      await appendFile(logFile, logLine, "utf8");
      
      // Check file size and rotate if necessary
      await this.rotateLogFileIfNeeded(logFile);
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }

  private static async logToSession(entry: LogEntry): Promise<void> {
    if (!this.instance.currentSession) return;

    const sessionLogger = this.instance.sessionLoggers.get(this.instance.currentSession);
    if (!sessionLogger) return;

    sessionLogger.entries.push(entry);

    try {
      const logLine = JSON.stringify(entry) + "\n";
      await appendFile(sessionLogger.logFile, logLine, "utf8");
      
      // Check file size and rotate if necessary
      await this.rotateLogFileIfNeeded(sessionLogger.logFile);
    } catch (error) {
      console.error("Failed to write to session log file:", error);
    }
  }

  private static async rotateLogFileIfNeeded(logFile: string): Promise<void> {
    try {
      const stats = await stat(logFile);
      if (stats.size > this.instance.globalConfig.maxFileSize) {
        await this.rotateLogFile(logFile);
      }
    } catch (error) {
      // File might not exist, which is fine
    }
  }

  private static async rotateLogFile(logFile: string): Promise<void> {
    const { maxFiles } = this.instance.globalConfig;
    
    // Rotate existing files
    for (let i = maxFiles - 1; i > 0; i--) {
      const oldFile = `${logFile}.${i}`;
      const newFile = `${logFile}.${i + 1}`;
      
      try {
        await readFile(oldFile);
        await writeFile(newFile, await readFile(oldFile));
      } catch {
        // File doesn't exist, continue
      }
    }

    // Move current file to .1
    try {
      await writeFile(`${logFile}.1`, await readFile(logFile));
      await writeFile(logFile, ""); // Clear current file
    } catch (error) {
      console.error("Failed to rotate log file:", error);
    }

    // Delete oldest file if it exists
    try {
      await readFile(`${logFile}.${maxFiles + 1}`);
      // File exists, delete it (in a real implementation, you'd use unlink)
    } catch {
      // File doesn't exist, which is fine
    }
  }

  static async compileSessionLogs(sessionId?: string): Promise<string[]> {
    const id = sessionId || this.instance.currentSession;
    if (!id) return [];

    const sessionLogger = this.instance.sessionLoggers.get(id);
    if (!sessionLogger || !this.instance.compiler.enabled) return [];

    const outputFiles: string[] = [];
    const { compiler } = this.instance;

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const baseFileName = `session-${id}-${timestamp}`;
      
      switch (compiler.outputFormat) {
        case "json":
          outputFiles.push(await this.compileToJson(sessionLogger, baseFileName));
          break;
        case "csv":
          outputFiles.push(await this.compileToCSV(sessionLogger, baseFileName));
          break;
        case "txt":
          outputFiles.push(await this.compileToText(sessionLogger, baseFileName));
          break;
        case "html":
          outputFiles.push(await this.compileToHTML(sessionLogger, baseFileName));
          break;
      }

      // Compress if enabled
      if (compiler.enableCompression) {
        const compressedFiles = await this.compressLogs(outputFiles);
        outputFiles.push(...compressedFiles);
      }

    } catch (error) {
      this.error("LoggingSystem", `Failed to compile session logs: ${id}`, error);
    }

    return outputFiles;
  }

  private static async compileToJson(sessionLogger: SessionLogger, baseFileName: string): Promise<string> {
    const outputFile = path.join(this.instance.compiler.outputDirectory, `${baseFileName}.json`);
    
    const compiledData = {
      sessionInfo: {
        sessionId: sessionLogger.sessionId,
        startTime: sessionLogger.startTime,
        endTime: new Date().toISOString(),
        entryCount: sessionLogger.entries.length,
        config: sessionLogger.config,
      },
      entries: sessionLogger.entries,
    };

    await writeFile(outputFile, JSON.stringify(compiledData, null, 2));
    return outputFile;
  }

  private static async compileToCSV(sessionLogger: SessionLogger, baseFileName: string): Promise<string> {
    const outputFile = path.join(this.instance.compiler.outputDirectory, `${baseFileName}.csv`);
    
    const headers = ["timestamp", "level", "category", "message", "data", "sessionId", "stackTrace"];
    const csvLines = [headers.join(",")];

    for (const entry of sessionLogger.entries) {
      const row = [
        entry.timestamp,
        LogLevel[entry.level],
        entry.category,
        `"${entry.message.replace(/"/g, '""')}"`, // Escape quotes
        entry.data ? `"${JSON.stringify(entry.data).replace(/"/g, '""')}"` : "",
        entry.sessionId || "",
        entry.stackTrace ? `"${entry.stackTrace.replace(/"/g, '""')}"` : "",
      ];
      csvLines.push(row.join(","));
    }

    await writeFile(outputFile, csvLines.join("\n"));
    return outputFile;
  }

  private static async compileToText(sessionLogger: SessionLogger, baseFileName: string): Promise<string> {
    const outputFile = path.join(this.instance.compiler.outputDirectory, `${baseFileName}.txt`);
    
    const lines = [
      `Session: ${sessionLogger.sessionId}`,
      `Start Time: ${sessionLogger.startTime}`,
      `End Time: ${new Date().toISOString()}`,
      `Total Entries: ${sessionLogger.entries.length}`,
      "",
      "=" .repeat(80),
      "",
    ];

    for (const entry of sessionLogger.entries) {
      lines.push(`[${entry.timestamp}] [${LogLevel[entry.level]}] [${entry.category}] ${entry.message}`);
      
      if (entry.data) {
        lines.push(`  Data: ${JSON.stringify(entry.data, null, 2).split("\n").map(line => `    ${line}`).join("\n")}`);
      }
      
      if (entry.stackTrace) {
        lines.push(`  Stack Trace:\n${entry.stackTrace.split("\n").map(line => `    ${line}`).join("\n")}`);
      }
      
      lines.push("");
    }

    await writeFile(outputFile, lines.join("\n"));
    return outputFile;
  }

  private static async compileToHTML(sessionLogger: SessionLogger, baseFileName: string): Promise<string> {
    const outputFile = path.join(this.instance.compiler.outputDirectory, `${baseFileName}.html`);
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Session Log: ${sessionLogger.sessionId}</title>
    <style>
        body { font-family: monospace; margin: 20px; }
        .header { background: #f0f0f0; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
        .entry { margin-bottom: 10px; padding: 5px; border-left: 3px solid #ccc; }
        .VERBOSE { border-left-color: #888; }
        .DEBUG { border-left-color: #888; }
        .INFO { border-left-color: #0066cc; }
        .WARN { border-left-color: #ff9900; }
        .ERROR { border-left-color: #cc0000; }
        .FATAL { border-left-color: #cc0000; background: #ffeeee; }
        .timestamp { color: #666; font-size: 0.9em; }
        .data { background: #f9f9f9; padding: 5px; margin-top: 5px; border-radius: 3px; }
        .stack { background: #f0f0f0; padding: 5px; margin-top: 5px; font-size: 0.8em; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Session Log: ${sessionLogger.sessionId}</h1>
        <p><strong>Start Time:</strong> ${sessionLogger.startTime}</p>
        <p><strong>End Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>Total Entries:</strong> ${sessionLogger.entries.length}</p>
    </div>
    
    ${sessionLogger.entries.map(entry => `
    <div class="entry ${LogLevel[entry.level]}">
        <span class="timestamp">[${entry.timestamp}] [${LogLevel[entry.level]}] [${entry.category}]</span>
        <div>${entry.message}</div>
        ${entry.data ? `<div class="data">${JSON.stringify(entry.data, null, 2)}</div>` : ""}
        ${entry.stackTrace ? `<div class="stack">${entry.stackTrace}</div>` : ""}
    </div>
    `).join("")}
</body>
</html>`;

    await writeFile(outputFile, html);
    return outputFile;
  }

  private static async compressLogs(files: string[]): Promise<string[]> {
    const compressedFiles: string[] = [];
    
    for (const file of files) {
      try {
        const compressedFile = `${file}.gz`;
        const gzip = createGzip({ level: this.instance.compiler.compressionLevel });
        
        const source = await readFile(file);
        const compressed = await new Promise<Buffer>((resolve, reject) => {
          const chunks: Buffer[] = [];
          gzip.on('data', (chunk) => chunks.push(chunk));
          gzip.on('end', () => resolve(Buffer.concat(chunks)));
          gzip.on('error', reject);
          gzip.write(source);
          gzip.end();
        });
        
        await writeFile(compressedFile, compressed);
        compressedFiles.push(compressedFile);
      } catch (error) {
        this.error("LoggingSystem", `Failed to compress log file: ${file}`, error);
      }
    }
    
    return compressedFiles;
  }

  // Query methods
  static getSessionLogs(sessionId: string): LogEntry[] {
    const sessionLogger = this.instance.sessionLoggers.get(sessionId);
    return sessionLogger ? [...sessionLogger.entries] : [];
  }

  static filterLogs(filter: LogFilter): LogEntry[] {
    const allEntries: LogEntry[] = [];
    
    for (const sessionLogger of this.instance.sessionLoggers.values()) {
      if (filter.sessionIds.length > 0 && !filter.sessionIds.includes(sessionLogger.sessionId)) {
        continue;
      }
      
      allEntries.push(...sessionLogger.entries);
    }

    return allEntries.filter(entry => {
      // Level filter
      if (filter.levels.length > 0 && !filter.levels.includes(entry.level)) {
        return false;
      }
      
      // Category filter
      if (filter.categories.length > 0 && !filter.categories.includes(entry.category)) {
        return false;
      }
      
      // Time range filter
      if (filter.timeRange) {
        const entryTime = new Date(entry.timestamp).getTime();
        const startTime = new Date(filter.timeRange.start).getTime();
        const endTime = new Date(filter.timeRange.end).getTime();
        
        if (entryTime < startTime || entryTime > endTime) {
          return false;
        }
      }
      
      // Entity filter
      if (filter.entities && filter.entities.length > 0) {
        if (!entry.entityId || !filter.entities.includes(entry.entityId)) {
          return false;
        }
      }
      
      // System filter
      if (filter.systems && filter.systems.length > 0) {
        if (!entry.systemName || !filter.systems.includes(entry.systemName)) {
          return false;
        }
      }
      
      return true;
    });
  }

  static getConfig(): LoggerConfig {
    return { ...this.instance.globalConfig };
  }

  static getSessions(): string[] {
    return Array.from(this.instance.sessionLoggers.keys());
  }

  static async cleanup(): Promise<void> {
    // Close all sessions
    for (const sessionId of this.instance.sessionLoggers.keys()) {
      this.closeSession(sessionId);
    }
    
    this.info("LoggingSystem", "Logger cleanup completed");
  }
}
