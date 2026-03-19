export enum LogLevel {
  VERBOSE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
  NONE = 6,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  sessionId?: string;
  entityId?: number;
  systemName?: string;
  stackTrace?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableSessionFiles: boolean;
  logDirectory: string;
  maxFileSize: number; // in bytes
  maxFiles: number;
  enableCompression: boolean;
  categories: string[];
  excludedCategories: string[];
  sessionSpecific: boolean;
  compileLogs: boolean;
}

export interface SessionLogger {
  sessionId: string;
  logFile: string;
  startTime: string;
  config: LoggerConfig;
  entries: LogEntry[];
}

export interface LogCompiler {
  enabled: boolean;
  outputFormat: "json" | "csv" | "txt" | "html";
  includeStackTrace: boolean;
  includeSessionInfo: boolean;
  compressionLevel: number;
  outputDirectory: string;
  enableCompression: boolean;
}

export interface LoggingSystem {
  globalConfig: LoggerConfig;
  sessionLoggers: Map<string, SessionLogger>;
  compiler: LogCompiler;
  currentSession: string | null;
}

export interface LogFilter {
  levels: LogLevel[];
  categories: string[];
  sessionIds: string[];
  timeRange?: {
    start: string;
    end: string;
  };
  entities?: number[];
  systems?: string[];
}
