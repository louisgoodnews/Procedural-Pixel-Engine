/**
 * Data Management & Analytics System Index
 * Exports all data management and analytics features
 */

// Core data management
export * from './DataManagement';

// Cloud storage integration
export * from './CloudStorage';

// Data validation and integrity
export * from './DataValidation';

// Data synchronization
export * from './DataSynchronization';

// Data export/import
export * from './DataExportImport';

// Data security and encryption
export * from './DataSecurity';

// Re-export commonly used items
export {
  DataManagementSystem,
  createDataManagementSystem,
} from './DataManagement';

export {
  CloudStorageSystem,
  createCloudStorageSystem,
} from './CloudStorage';

export {
  DataValidationSystem,
  createDataValidationSystem,
} from './DataValidation';

export {
  DataSynchronizationSystem,
  createDataSynchronizationSystem,
} from './DataSynchronization';

export {
  DataExportImportSystem,
  createDataExportImportSystem,
} from './DataExportImport';

export {
  DataSecuritySystem,
  createDataSecuritySystem,
} from './DataSecurity';
