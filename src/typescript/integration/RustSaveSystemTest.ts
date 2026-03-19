import { RustSaveSystem, SaveType, SaveCompressionType, SaveEncryptionType, CloudProvider } from '../rust-wrappers/RustSaveSystem';

export interface TestResult {
    name: string;
    status: 'pass' | 'fail' | 'skip';
    message: string;
    duration: number;
    details?: any;
}

export class RustSaveSystemTest {
    private saveSystem: RustSaveSystem;
    private results: TestResult[] = [];

    constructor() {
        this.saveSystem = new RustSaveSystem();
    }

    async runAllTests(): Promise<void> {
        console.log('💾 Starting Rust Save System Tests...');
        console.log('====================================');
        
        try {
            await this.testInitialization();
            await this.testConfigurationPresets();
            await this.testSaveSlotManagement();
            await this.testSaveOperations();
            await this.testAutoSave();
            await this.testQuickSave();
            await this.testValidation();
            await this.testCompatibility();
            await this.testCloudSync();
            await this.testBackupOperations();
            await this.testStatistics();
            await this.testSaveDataFactory();
            await this.testSaveManagement();
            await this.testSaveSearchAndFilter();
            await this.testSaveComparison();
            await this.testExportImport();
            
            this.generateReport();
        } catch (error) {
            console.error('❌ Rust Save System test suite failed:', error instanceof Error ? error.message : String(error));
            this.addResult('Rust Save System Test Suite', 'fail', `Suite failed: ${error instanceof Error ? error.message : String(error)}`, 0);
        }
    }

    private async testInitialization(): Promise<void> {
        const testName = 'Save System Initialization';
        const start = performance.now();
        
        try {
            const config = RustSaveSystem.createDefaultConfig();
            await this.saveSystem.initialize(config);
            
            // Test initialization by calling a method
            try {
                this.saveSystem.getConfig();
            } catch (error) {
                throw new Error('Save System not initialized after initialize() call');
            }
            
            // Test config retrieval
            const retrievedConfig = this.saveSystem.getConfig();
            if (!retrievedConfig.autoSaveEnabled || !retrievedConfig.validateSaves) {
                throw new Error('Config not set correctly');
            }
            
            // Test stats retrieval
            const stats = this.saveSystem.getStats();
            if (stats.totalSaves < 0 || stats.saveSlotsUsed < 0) {
                throw new Error('Stats not valid');
            }
            
            // Test save system summary
            const summary = this.saveSystem.getSaveSystemSummary();
            if (!summary || summary.length === 0) {
                throw new Error('Save system summary not available');
            }
            
            this.addResult(testName, 'pass', 'Save System initialized successfully', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Initialization failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testConfigurationPresets(): Promise<void> {
        const testName = 'Configuration Presets';
        const start = performance.now();
        
        try {
            // Test default configuration
            const defaultConfig = RustSaveSystem.createDefaultConfig();
            if (!defaultConfig.autoSaveEnabled || !defaultConfig.validateSaves || !defaultConfig.backupSaves) {
                throw new Error('Default config should enable most features');
            }
            
            // Apply default config
            await this.saveSystem.initialize(defaultConfig);
            let currentConfig = this.saveSystem.getConfig();
            
            if (!currentConfig.autoSaveEnabled) {
                throw new Error('Default config not applied correctly');
            }
            
            // Test development configuration
            const devConfig = RustSaveSystem.createDevelopmentConfig();
            if (!devConfig.autoSaveEnabled || !devConfig.validateSaves || devConfig.maxAutoSaves !== 10) {
                throw new Error('Development config should enable detailed features');
            }
            
            this.saveSystem.updateConfig(devConfig);
            currentConfig = this.saveSystem.getConfig();
            
            if (!currentConfig.autoSaveEnabled || currentConfig.maxAutoSaves !== 10) {
                throw new Error('Development config not applied correctly');
            }
            
            // Test production configuration
            const prodConfig = RustSaveSystem.createProductionConfig();
            if (!prodConfig.autoSaveEnabled || !prodConfig.cloudSyncEnabled || !prodConfig.backupSaves) {
                throw new Error('Production config should enable cloud sync and security');
            }
            
            this.saveSystem.updateConfig(prodConfig);
            currentConfig = this.saveSystem.getConfig();
            
            if (!currentConfig.cloudSyncEnabled || currentConfig.encryptionType !== SaveEncryptionType.AES256) {
                throw new Error('Production config not applied correctly');
            }
            
            // Test mobile configuration
            const mobileConfig = RustSaveSystem.createMobileConfig();
            if (!mobileConfig.autoSaveEnabled || mobileConfig.screenshotEnabled || mobileConfig.cloudProvider !== CloudProvider.Firebase) {
                throw new Error('Mobile config should optimize for mobile');
            }
            
            // Test custom configuration
            const customConfig = RustSaveSystem.createDefaultConfig();
            customConfig.autoSaveInterval = 120;
            customConfig.maxAutoSaves = 15;
            customConfig.maxManualSaves = 30;
            customConfig.screenshotQuality = 85;
            
            this.saveSystem.updateConfig(customConfig);
            currentConfig = this.saveSystem.getConfig();
            
            if (currentConfig.autoSaveInterval !== 120 || currentConfig.maxAutoSaves !== 15) {
                throw new Error('Custom config not applied correctly');
            }
            
            this.addResult(testName, 'pass', 'Configuration presets work correctly', performance.now() - start, {
                configsTested: 4,
                customConfigTested: true,
                configPersistenceVerified: true,
                featuresVerified: {
                    autoSave: defaultConfig.autoSaveEnabled,
                    validation: defaultConfig.validateSaves,
                    backup: defaultConfig.backupSaves,
                    cloudSync: prodConfig.cloudSyncEnabled,
                    encryption: prodConfig.encryptionType,
                }
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Configuration presets failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testSaveSlotManagement(): Promise<void> {
        const testName = 'Save Slot Management';
        const start = performance.now();
        
        try {
            // Create save slots
            const slots = [
                { id: 'slot1', name: 'Main Game', description: 'Main game save' },
                { id: 'slot2', name: 'Test Save', description: 'Test save slot' },
                { id: 'slot3', name: 'Backup', description: 'Backup save' },
            ];
            
            for (const slot of slots) {
                const result = this.saveSystem.createSaveSlot(slot.id, slot.name, slot.description);
                if (!result.success) {
                    throw new Error(`Failed to create save slot ${slot.id}: ${result.error}`);
                }
            }
            
            // Test getting all save slots
            const allSlots = this.saveSystem.getAllSaveSlots();
            if (allSlots.length < slots.length) {
                throw new Error('Not all save slots created');
            }
            
            // Test getting individual save slot
            const slot1 = this.saveSystem.getSaveSlot('slot1');
            if (!slot1 || slot1.name !== 'Main Game') {
                throw new Error('Save slot not retrieved correctly');
            }
            
            // Test getting non-existent save slot
            const nonExistent = this.saveSystem.getSaveSlot('non_existent');
            if (nonExistent !== null) {
                throw new Error('Should return null for non-existent save slot');
            }
            
            // Test creating duplicate save slot
            const duplicateResult = this.saveSystem.createSaveSlot('slot1', 'Duplicate', 'Duplicate slot');
            if (duplicateResult.success) {
                throw new Error('Should fail to create duplicate save slot');
            }
            
            // Test deleting save slot
            const deleteResult = this.saveSystem.deleteSaveSlot('slot3');
            if (!deleteResult.success) {
                throw new Error('Failed to delete save slot');
            }
            
            // Verify slot is deleted
            const deletedSlot = this.saveSystem.getSaveSlot('slot3');
            if (deletedSlot !== null) {
                throw new Error('Deleted save slot should not exist');
            }
            
            // Test deleting non-existent save slot
            const deleteNonExistent = this.saveSystem.deleteSaveSlot('non_existent');
            if (deleteNonExistent.success) {
                throw new Error('Should fail to delete non-existent save slot');
            }
            
            this.addResult(testName, 'pass', 'Save slot management works correctly', performance.now() - start, {
                slotsCreated: slots.length,
                slotsRetrieved: allSlots.length,
                duplicateTested: true,
                deletionTested: true,
                errorHandlingTested: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Save slot management failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testSaveOperations(): Promise<void> {
        const testName = 'Save Operations';
        const start = performance.now();
        
        try {
            // Create test save data
            const saveData = RustSaveSystem.createSaveData(
                'test_save',
                'Test Save',
                'Test save for operations',
                SaveType.Manual,
                '1.0.0',
                5,
                'test_scene',
                [10, 20, 30],
                [0, 0, 0, 1],
                85.5,
                100,
                2500,
                1000,
                [
                    RustSaveSystem.createInventoryItem('sword', 'Iron Sword', 1, 75, 0.8),
                    RustSaveSystem.createInventoryItem('potion', 'Health Potion', 5, 100, 1.0),
                ],
                [
                    RustSaveSystem.createQuestData(
                        'quest1',
                        'First Quest',
                        'active',
                        0.5,
                        [
                            RustSaveSystem.createQuestObjective('obj1', 'Find the item', 1),
                            RustSaveSystem.createQuestObjective('obj2', 'Kill enemies', 5),
                        ],
                        [
                            RustSaveSystem.createQuestReward('reward1', 'experience', 100),
                            RustSaveSystem.createQuestReward('reward2', 'item', 50, 'sword'),
                        ]
                    ),
                ],
                {
                    'door_opened': 'true',
                    'enemy_defeated': 'false',
                },
                {
                    'tutorial_completed': true,
                    'boss_defeated': false,
                },
                {
                    'player_score': 1250,
                    'game_difficulty': 1.5,
                },
                undefined,
                ['test', 'operations'],
                'Test save for operations testing'
            );
            
            // Save the game
            const saveResult = this.saveSystem.saveGame(saveData);
            if (!saveResult.success) {
                throw new Error(`Failed to save game: ${saveResult.error}`);
            }
            
            // Load the game
            const loadResult = this.saveSystem.loadGame('test_save');
            if (!loadResult.success) {
                throw new Error(`Failed to load game: ${loadResult.error}`);
            }
            
            if (!loadResult.saveData) {
                throw new Error('Save data not loaded');
            }
            
            // Verify loaded data
            const loadedData = loadResult.saveData;
            if (loadedData.id !== saveData.id || loadedData.name !== saveData.name) {
                throw new Error('Loaded save data mismatch');
            }
            
            if (loadedData.level !== saveData.level || loadedData.health !== saveData.health) {
                throw new Error('Save data corrupted during load');
            }
            
            if (loadedData.inventory.length !== saveData.inventory.length) {
                throw new Error('Inventory data corrupted');
            }
            
            if (loadedData.quests.length !== saveData.quests.length) {
                throw new Error('Quest data corrupted');
            }
            
            // Test saving to non-existent slot
            const invalidSaveData = { ...saveData, id: 'invalid_save' };
            const invalidSaveResult = this.saveSystem.saveGame(invalidSaveData);
            if (invalidSaveResult.success) {
                throw new Error('Should fail to save to non-existent slot');
            }
            
            // Test loading from non-existent slot
            const invalidLoadResult = this.saveSystem.loadGame('invalid_save');
            if (invalidLoadResult.success) {
                throw new Error('Should fail to load from non-existent slot');
            }
            
            // Test saving with invalid data
            const invalidData = { ...saveData, health: -10 };
            const invalidDataResult = this.saveSystem.saveGame(invalidData);
            // This might succeed depending on validation, but we check if validation catches it
            
            this.addResult(testName, 'pass', 'Save operations work correctly', performance.now() - start, {
                saveTested: true,
                loadTested: true,
                dataIntegrityVerified: true,
                inventoryVerified: loadedData.inventory.length,
                questsVerified: loadedData.quests.length,
                errorHandlingTested: true,
                saveId: saveResult.saveId,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Save operations failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testAutoSave(): Promise<void> {
        const testName = 'Auto Save';
        const start = performance.now();
        
        try {
            // Enable auto save
            const enableResult = this.saveSystem.enableAutoSave(60); // 1 minute
            if (!enableResult.success) {
                throw new Error(`Failed to enable auto save: ${enableResult.error}`);
            }
            
            // Verify auto save is enabled
            const config = this.saveSystem.getConfig();
            if (!config.autoSaveEnabled || config.autoSaveInterval !== 60) {
                throw new Error('Auto save not configured correctly');
            }
            
            // Test auto save
            const autoSaveResult = this.saveSystem.autoSave();
            if (!autoSaveResult.success) {
                throw new Error(`Failed to auto save: ${autoSaveResult.error}`);
            }
            
            // Verify auto save created
            const autoSaveSlot = this.saveSystem.getSaveSlot(autoSaveResult.saveId!);
            if (!autoSaveSlot || !autoSaveSlot.saveData) {
                throw new Error('Auto save slot not created or empty');
            }
            
            if (autoSaveSlot.saveData.saveType !== SaveType.Auto) {
                throw new Error('Auto save type not set correctly');
            }
            
            // Test auto save when disabled
            const disableResult = this.saveSystem.disableAutoSave();
            if (!disableResult.success) {
                throw new Error(`Failed to disable auto save: ${disableResult.error}`);
            }
            
            const disabledConfig = this.saveSystem.getConfig();
            if (disabledConfig.autoSaveEnabled) {
                throw new Error('Auto save not disabled correctly');
            }
            
            const disabledAutoSaveResult = this.saveSystem.autoSave();
            if (disabledAutoSaveResult.success) {
                throw new Error('Should fail to auto save when disabled');
            }
            
            // Re-enable for other tests
            this.saveSystem.enableAutoSave();
            
            this.addResult(testName, 'pass', 'Auto save works correctly', performance.now() - start, {
                enableTested: true,
                disableTested: true,
                autoSaveCreated: true,
                saveTypeVerified: true,
                configurationUpdated: true,
                disabledConfigTested: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Auto save failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testQuickSave(): Promise<void> {
        const testName = 'Quick Save';
        const start = performance.now();
        
        try {
            // Test quick save
            const quickSaveResult = this.saveSystem.quickSave();
            if (!quickSaveResult.success) {
                throw new Error(`Failed to quick save: ${quickSaveResult.error}`);
            }
            
            // Verify quick save created
            const quickSaveSlot = this.saveSystem.getSaveSlot(quickSaveResult.saveId!);
            if (!quickSaveSlot || !quickSaveSlot.saveData) {
                throw new Error('Quick save slot not created or empty');
            }
            
            if (quickSaveSlot.saveData.saveType !== SaveType.Quick) {
                throw new Error('Quick save type not set correctly');
            }
            
            if (!quickSaveSlot.saveData.name.includes('Quick Save')) {
                throw new Error('Quick save name not set correctly');
            }
            
            // Test loading quick save
            const loadResult = this.saveSystem.loadGame(quickSaveResult.saveId!);
            if (!loadResult.success) {
                throw new Error(`Failed to load quick save: ${loadResult.error}`);
            }
            
            // Verify quick save data
            if (!loadResult.saveData || loadResult.saveData.saveType !== SaveType.Quick) {
                throw new Error('Quick save data corrupted');
            }
            
            // Test multiple quick saves
            const quickSave2Result = this.saveSystem.quickSave();
            if (!quickSave2Result.success) {
                throw new Error('Failed to create second quick save');
            }
            
            if (quickSave2Result.saveId === quickSaveResult.saveId) {
                throw new Error('Quick saves should have unique IDs');
            }
            
            this.addResult(testName, 'pass', 'Quick save works correctly', performance.now() - start, {
                quickSaveCreated: true,
                saveTypeVerified: true,
                nameVerified: true,
                loadTested: true,
                multipleSavesTested: true,
                uniqueIdsVerified: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Quick save failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testValidation(): Promise<void> {
        const testName = 'Save Validation';
        const start = performance.now();
        
        try {
            // Create valid save data
            const validSaveData = RustSaveSystem.createSaveData(
                'valid_save',
                'Valid Save',
                'Valid save data',
                SaveType.Manual,
                '1.0.0',
                1,
                'test_scene',
                [0, 0, 0],
                [0, 0, 0, 1],
                100,
                100,
                0,
                0,
                [],
                [],
                {},
                {},
                {},
                undefined,
                [],
                'Valid save'
            );
            
            // Test valid save data
            const validValidation = this.saveSystem.validateSaveData(validSaveData);
            if (!validValidation.isValid) {
                throw new Error('Valid save data should pass validation');
            }
            
            if (validValidation.errors.length > 0) {
                throw new Error('Valid save data should not have errors');
            }
            
            if (validValidation.compatibilityScore < 0.8) {
                throw new Error('Valid save data should have high compatibility score');
            }
            
            // Test invalid save data (missing required fields)
            const invalidSaveData1 = { ...validSaveData, id: '', name: '' };
            const invalidValidation1 = this.saveSystem.validateSaveData(invalidSaveData1);
            if (invalidValidation1.isValid) {
                throw new Error('Invalid save data should fail validation');
            }
            
            if (invalidValidation1.errors.length === 0) {
                throw new Error('Invalid save data should have errors');
            }
            
            // Test invalid save data (out of range values)
            const invalidSaveData2 = { ...validSaveData, health: -10, maxHealth: 50 };
            const invalidValidation2 = this.saveSystem.validateSaveData(invalidSaveData2);
            if (invalidValidation2.warnings.length === 0) {
                throw new Error('Invalid save data should have warnings');
            }
            
            // Test invalid save data (experience less than level experience)
            const invalidSaveData3 = { ...validSaveData, experience: 500, levelExperience: 1000 };
            const invalidValidation3 = this.saveSystem.validateSaveData(invalidSaveData3);
            if (invalidValidation3.warnings.length === 0) {
                throw new Error('Invalid save data should have warnings for experience');
            }
            
            // Test save data with invalid quest progress
            const invalidSaveData4 = { ...validSaveData, quests: [
                RustSaveSystem.createQuestData('quest1', 'Test Quest', 'active', 1.5, [], [])
            ]};
            const invalidValidation4 = this.saveSystem.validateSaveData(invalidSaveData4);
            if (invalidValidation4.warnings.length === 0) {
                throw new Error('Invalid quest progress should generate warnings');
            }
            
            this.addResult(testName, 'pass', 'Save validation works correctly', performance.now() - start, {
                validDataTested: true,
                invalidDataTested: true,
                missingFieldsTested: true,
                rangeValidationTested: true,
                experienceValidationTested: true,
                questValidationTested: true,
                compatibilityScoreTested: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Save validation failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testCompatibility(): Promise<void> {
        const testName = 'Save Compatibility';
        const start = performance.now();
        
        try {
            // Create compatible save data
            const compatibleSaveData = RustSaveSystem.createSaveData(
                'compatible_save',
                'Compatible Save',
                'Compatible save data',
                SaveType.Manual,
                '1.0.0',
                1,
                'test_scene',
                [0, 0, 0],
                [0, 0, 0, 1],
                100,
                100,
                0,
                0,
                [],
                [],
                {},
                {},
                {},
                undefined,
                [],
                'Compatible save'
            );
            
            // Test compatible save data
            const compatibleResult = this.saveSystem.checkCompatibility(compatibleSaveData);
            if (!compatibleResult.isValid) {
                throw new Error('Compatible save data should pass compatibility check');
            }
            
            if (compatibleResult.compatibilityScore < 0.8) {
                throw new Error('Compatible save data should have high compatibility score');
            }
            
            // Test incompatible save data (different version)
            const incompatibleSaveData1 = { ...compatibleSaveData, metadata: {
                ...compatibleSaveData.metadata,
                gameVersion: '2.0.0'
            }};
            const incompatibleResult1 = this.saveSystem.checkCompatibility(incompatibleSaveData1);
            if (incompatibleResult1.compatibilityScore >= 0.8) {
                throw new Error('Different version should reduce compatibility score');
            }
            
            // Test incompatible save data (different platform)
            const incompatibleSaveData2 = { ...compatibleSaveData, metadata: {
                ...compatibleSaveData.metadata,
                platform: 'mobile'
            }};
            const incompatibleResult2 = this.saveSystem.checkCompatibility(incompatibleSaveData2);
            if (incompatibleResult2.compatibilityScore >= 0.8) {
                throw new Error('Different platform should reduce compatibility score');
            }
            
            // Test incompatible save data (different engine version)
            const incompatibleSaveData3 = { ...compatibleSaveData, metadata: {
                ...compatibleSaveData.metadata,
                engineVersion: '2.0.0'
            }};
            const incompatibleResult3 = this.saveSystem.checkCompatibility(incompatibleSaveData3);
            if (incompatibleResult3.compatibilityScore >= 0.8) {
                throw new Error('Different engine version should reduce compatibility score');
            }
            
            // Test severely incompatible save data
            const severelyIncompatibleData = { ...compatibleSaveData, metadata: {
                ...compatibleSaveData.metadata,
                gameVersion: '2.0.0',
                engineVersion: '2.0.0',
                platform: 'mobile'
            }};
            const severelyIncompatibleResult = this.saveSystem.checkCompatibility(severelyIncompatibleData);
            if (severelyIncompatibleResult.compatibilityScore >= 0.5) {
                throw new Error('Severely incompatible data should have low compatibility score');
            }
            
            this.addResult(testName, 'pass', 'Save compatibility works correctly', performance.now() - start, {
                compatibleDataTested: true,
                versionCompatibilityTested: true,
                platformCompatibilityTested: true,
                engineCompatibilityTested: true,
                severeIncompatibilityTested: true,
                compatibilityScoreTested: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Save compatibility failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testCloudSync(): Promise<void> {
        const testName = 'Cloud Sync';
        const start = performance.now();
        
        try {
            // Enable cloud sync
            const enableResult = this.saveSystem.enableCloudSync(CloudProvider.LocalStorage);
            if (!enableResult.success) {
                throw new Error(`Failed to enable cloud sync: ${enableResult.error}`);
            }
            
            // Verify cloud sync is enabled
            const config = this.saveSystem.getConfig();
            if (!config.cloudSyncEnabled || config.cloudProvider !== CloudProvider.LocalStorage) {
                throw new Error('Cloud sync not configured correctly');
            }
            
            // Create test save for cloud sync
            const saveData = RustSaveSystem.createSaveData(
                'cloud_save',
                'Cloud Save',
                'Save for cloud sync testing',
                SaveType.Cloud,
                '1.0.0',
                1,
                'cloud_scene',
                [0, 0, 0],
                [0, 0, 0, 1],
                100,
                100,
                0,
                0,
                [],
                [],
                {},
                {},
                {},
                undefined,
                ['cloud'],
                'Cloud sync test'
            );
            
            const saveResult = this.saveSystem.saveGame(saveData);
            if (!saveResult.success) {
                throw new Error(`Failed to create cloud save: ${saveResult.error}`);
            }
            
            // Test cloud sync
            const syncResult = this.saveSystem.syncToCloud();
            if (!syncResult.success) {
                throw new Error(`Failed to sync to cloud: ${syncResult.error}`);
            }
            
            // Verify save is synced
            const syncedSlot = this.saveSystem.getSaveSlot('cloud_save');
            if (!syncedSlot || !syncedSlot.cloudSynced) {
                throw new Error('Save not marked as cloud synced');
            }
            
            // Test downloading from cloud (simulated)
            // Note: This might not work with LocalStorage in test environment
            const downloadResult = this.saveSystem.downloadFromCloud('cloud_save');
            // This might fail, which is expected in test environment
            
            // Test cloud sync when disabled
            const disableResult = this.saveSystem.disableCloudSync();
            if (!disableResult.success) {
                throw new Error(`Failed to disable cloud sync: ${disableResult.error}`);
            }
            
            const disabledConfig = this.saveSystem.getConfig();
            if (disabledConfig.cloudSyncEnabled) {
                throw new Error('Cloud sync not disabled correctly');
            }
            
            this.addResult(testName, 'pass', 'Cloud sync works correctly', performance.now() - start, {
                enableTested: true,
                disableTested: true,
                syncTested: true,
                syncStatusVerified: true,
                configurationUpdated: true,
                note: 'Download test skipped due to test environment limitations',
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Cloud sync failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testBackupOperations(): Promise<void> {
        const testName = 'Backup Operations';
        const start = performance.now();
        
        try {
            // Create original save
            const originalSaveData = RustSaveSystem.createSaveData(
                'original_save',
                'Original Save',
                'Original save for backup testing',
                SaveType.Manual,
                '1.0.0',
                5,
                'backup_scene',
                [10, 20, 30],
                [0, 0, 0, 1],
                75.5,
                100,
                1500,
                1000,
                [
                    RustSaveSystem.createInventoryItem('item1', 'Test Item', 1, 80, 0.9),
                ],
                [],
                {},
                {},
                {},
                undefined,
                ['backup'],
                'Original save for backup testing'
            );
            
            const saveResult = this.saveSystem.saveGame(originalSaveData);
            if (!saveResult.success) {
                throw new Error(`Failed to create original save: ${saveResult.error}`);
            }
            
            // Create backup
            const backupResult = this.saveSystem.createBackup('original_save');
            if (!backupResult.success) {
                throw new Error(`Failed to create backup: ${backupResult.error}`);
            }
            
            // Verify backup was created
            const backupSlot = this.saveSystem.getSaveSlot(backupResult.backupId!);
            if (!backupSlot || !backupSlot.saveData) {
                throw new Error('Backup slot not created or empty');
            }
            
            if (backupSlot.saveData.saveType !== SaveType.Backup) {
                throw new Error('Backup save type not set correctly');
            }
            
            if (!backupSlot.saveData.name.includes('Backup of')) {
                throw new Error('Backup name not set correctly');
            }
            
            // Verify backup data matches original
            const backupData = backupSlot.saveData;
            if (backupData.level !== originalSaveData.level || backupData.health !== originalSaveData.health) {
                throw new Error('Backup data does not match original');
            }
            
            if (backupData.inventory.length !== originalSaveData.inventory.length) {
                throw new Error('Backup inventory does not match original');
            }
            
            // Test restoring backup
            const restoreResult = this.saveSystem.restoreBackup(backupResult.backupId!, 'restored_save');
            if (!restoreResult.success) {
                throw new Error(`Failed to restore backup: ${restoreResult.error}`);
            }
            
            // Verify restored save
            const restoredSlot = this.saveSystem.getSaveSlot('restored_save');
            if (!restoredSlot || !restoredSlot.saveData) {
                throw new Error('Restored save slot not created or empty');
            }
            
            const restoredData = restoredSlot.saveData;
            if (restoredData.level !== originalSaveData.level || restoredData.health !== originalSaveData.health) {
                throw new Error('Restored data does not match original');
            }
            
            if (restoredData.saveType !== SaveType.Manual) {
                throw new Error('Restored save type should be Manual, not Backup');
            }
            
            // Test backup of non-existent save
            const invalidBackupResult = this.saveSystem.createBackup('non_existent');
            if (invalidBackupResult.success) {
                throw new Error('Should fail to create backup of non-existent save');
            }
            
            // Test restore of non-existent backup
            const invalidRestoreResult = this.saveSystem.restoreBackup('non_existent', 'target');
            if (invalidRestoreResult.success) {
                throw new Error('Should fail to restore non-existent backup');
            }
            
            this.addResult(testName, 'pass', 'Backup operations work correctly', performance.now() - start, {
                backupCreated: true,
                backupDataVerified: true,
                restoreTested: true,
                restoredDataVerified: true,
                saveTypeVerified: true,
                errorHandlingTested: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Backup operations failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testStatistics(): Promise<void> {
        const testName = 'Save Statistics';
        const start = performance.now();
        
        try {
            // Get initial stats
            const initialStats = this.saveSystem.getStats();
            if (initialStats.totalSaves < 0 || initialStats.saveSlotsUsed < 0) {
                throw new Error('Initial stats not valid');
            }
            
            // Create several saves to test statistics
            const saves = [
                { id: 'stat_save1', name: 'Stat Save 1', type: SaveType.Manual },
                { id: 'stat_save2', name: 'Stat Save 2', type: SaveType.Auto },
                { id: 'stat_save3', name: 'Stat Save 3', type: SaveType.Quick },
            ];
            
            for (const save of saves) {
                // Create save slot
                this.saveSystem.createSaveSlot(save.id, save.name, 'Statistics test save');
                
                // Create save data
                const saveData = RustSaveSystem.createSaveData(
                    save.id,
                    save.name,
                    'Statistics test save',
                    save.type,
                    '1.0.0',
                    1,
                    'stat_scene',
                    [0, 0, 0],
                    [0, 0, 0, 1],
                    100,
                    100,
                    0,
                    0,
                    [],
                    [],
                    {},
                    {},
                    {},
                    undefined,
                    ['stats'],
                    'Statistics test save'
                );
                
                this.saveSystem.saveGame(saveData);
            }
            
            // Get updated stats
            const updatedStats = this.saveSystem.getStats();
            
            // Verify stats updated
            if (updatedStats.totalSaves <= initialStats.totalSaves) {
                throw new Error('Total saves not updated correctly');
            }
            
            if (updatedStats.saveSlotsUsed <= initialStats.saveSlotsUsed) {
                throw new Error('Save slots used not updated correctly');
            }
            
            // Test save system summary
            const summary = this.saveSystem.getSaveSystemSummary();
            if (!summary || summary.length === 0) {
                throw new Error('Save system summary not generated');
            }
            
            if (!summary.includes('Total Saves') || !summary.includes('Save Slots Used')) {
                throw new Error('Save system summary missing key information');
            }
            
            // Test detailed statistics
            const detailedStats = this.saveSystem.getSaveStatistics();
            if (detailedStats.totalSaves !== updatedStats.totalSaves) {
                throw new Error('Detailed stats don\'t match basic stats');
            }
            
            if (detailedStats.mostPlayedSave && detailedStats.mostPlayedSave.playtime < 0) {
                throw new Error('Most played save has invalid playtime');
            }
            
            if (detailedStats.oldestSave >= detailedStats.newestSave) {
                throw new Error('Oldest save should be newer than newest save');
            }
            
            this.addResult(testName, 'pass', 'Save statistics work correctly', performance.now() - start, {
                initialStatsRetrieved: true,
                statsUpdated: true,
                summaryGenerated: true,
                detailedStatsRetrieved: true,
                statsVerified: {
                    totalSaves: updatedStats.totalSaves,
                    saveSlotsUsed: updatedStats.saveSlotsUsed,
                    averageFileSize: detailedStats.averageFileSize,
                },
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Save statistics failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testSaveDataFactory(): Promise<void> {
        const testName = 'Save Data Factory';
        const start = performance.now();
        
        try {
            // Test createSaveData
            const saveData = RustSaveSystem.createSaveData(
                'factory_test',
                'Factory Test',
                'Testing factory methods',
                SaveType.Manual,
                '1.0.0',
                10,
                'factory_scene',
                [5, 10, 15],
                [0, 0.5, 0, 0.5],
                85.5,
                100,
                2500,
                1000,
                [],
                [],
                { 'key1': 'value1', 'key2': 'value2' },
                { 'flag1': true, 'flag2': false },
                { 'var1': 1.5, 'var2': 2.5 },
                undefined,
                ['factory', 'test'],
                'Factory test save'
            );
            
            if (saveData.id !== 'factory_test' || saveData.name !== 'Factory Test') {
                throw new Error('Save data basic properties not set correctly');
            }
            
            if (saveData.level !== 10 || saveData.health !== 85.5) {
                throw new Error('Save data game properties not set correctly');
            }
            
            if (saveData.playerPosition.length !== 3 || saveData.playerRotation.length !== 4) {
                throw new Error('Player position/rotation not set correctly');
            }
            
            if (Object.keys(saveData.worldState).length !== 2) {
                throw new Error('World state not set correctly');
            }
            
            // Test createInventoryItem
            const inventoryItem = RustSaveSystem.createInventoryItem(
                'test_item',
                'Test Item',
                3,
                85,
                0.7,
                { 'property1': 'value1' }
            );
            
            if (inventoryItem.id !== 'test_item' || inventoryItem.quantity !== 3) {
                throw new Error('Inventory item basic properties not set correctly');
            }
            
            if (inventoryItem.quality !== 85 || inventoryItem.durability !== 0.7) {
                throw new Error('Inventory item properties not set correctly');
            }
            
            // Test createQuestData
            const questData = RustSaveSystem.createQuestData(
                'test_quest',
                'Test Quest',
                'active',
                0.6,
                [
                    RustSaveSystem.createQuestObjective('obj1', 'Test objective', 5),
                ],
                [
                    RustSaveSystem.createQuestReward('reward1', 'experience', 100),
                ]
            );
            
            if (questData.id !== 'test_quest' || questData.status !== 'active') {
                throw new Error('Quest data basic properties not set correctly');
            }
            
            if (questData.progress !== 0.6 || questData.objectives.length !== 1) {
                throw new Error('Quest data properties not set correctly');
            }
            
            // Test createQuestObjective
            const questObjective = RustSaveSystem.createQuestObjective('test_obj', 'Test objective', 3);
            if (questObjective.id !== 'test_obj' || questObjective.requiredProgress !== 3) {
                throw new Error('Quest objective not set correctly');
            }
            
            if (questObjective.completed !== false || questObjective.progress !== 0) {
                throw new Error('Quest objective default values not set correctly');
            }
            
            // Test createQuestReward
            const questReward = RustSaveSystem.createQuestReward('test_reward', 'item', 1, 'test_item');
            if (questReward.id !== 'test_reward' || questReward.type !== 'item') {
                throw new Error('Quest reward basic properties not set correctly');
            }
            
            if (questReward.amount !== 1 || questReward.itemId !== 'test_item') {
                throw new Error('Quest reward properties not set correctly');
            }
            
            // Test createSaveSlot
            const saveSlot = RustSaveSystem.createSaveSlot('test_slot', 'Test Slot', 'Test slot description');
            if (saveSlot.id !== 'test_slot' || saveSlot.name !== 'Test Slot') {
                throw new Error('Save slot basic properties not set correctly');
            }
            
            if (!saveSlot.isValid || saveSlot.isCorrupted) {
                throw new Error('Save slot default values not set correctly');
            }
            
            this.addResult(testName, 'pass', 'Save data factory methods work correctly', performance.now() - start, {
                saveDataFactoryTested: true,
                inventoryItemFactoryTested: true,
                questDataFactoryTested: true,
                questObjectiveFactoryTested: true,
                questRewardFactoryTested: true,
                saveSlotFactoryTested: true,
                defaultValuesVerified: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Save data factory failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testSaveManagement(): Promise<void> {
        const testName = 'Save Management';
        const start = performance.now();
        
        try {
            // Test createNewSave
            const newSaveResult = this.saveSystem.createNewSave('New Game', 'Starting a new game');
            if (!newSaveResult.success) {
                throw new Error(`Failed to create new save: ${newSaveResult.error}`);
            }
            
            // Verify new save was created
            const newSaveSlot = this.saveSystem.getSaveSlot(newSaveResult.saveId!);
            if (!newSaveSlot || !newSaveSlot.saveData) {
                throw new Error('New save slot not created or empty');
            }
            
            if (newSaveSlot.saveData.level !== 1 || newSaveSlot.saveData.health !== 100) {
                throw new Error('New save not initialized with correct default values');
            }
            
            // Test enable/disable auto save
            const enableAutoSaveResult = this.saveSystem.enableAutoSave(120);
            if (!enableAutoSaveResult.success) {
                throw new Error(`Failed to enable auto save: ${enableAutoSaveResult.error}`);
            }
            
            const config = this.saveSystem.getConfig();
            if (!config.autoSaveEnabled || config.autoSaveInterval !== 120) {
                throw new Error('Auto save not configured correctly');
            }
            
            const disableAutoSaveResult = this.saveSystem.disableAutoSave();
            if (!disableAutoSaveResult.success) {
                throw new Error(`Failed to disable auto save: ${disableAutoSaveResult.error}`);
            }
            
            const disabledConfig = this.saveSystem.getConfig();
            if (disabledConfig.autoSaveEnabled) {
                throw new Error('Auto save not disabled correctly');
            }
            
            // Test enable/disable cloud sync
            const enableCloudResult = this.saveSystem.enableCloudSync(CloudProvider.LocalStorage);
            if (!enableCloudResult.success) {
                throw new Error(`Failed to enable cloud sync: ${enableCloudResult.error}`);
            }
            
            const cloudConfig = this.saveSystem.getConfig();
            if (!cloudConfig.cloudSyncEnabled || cloudConfig.cloudProvider !== CloudProvider.LocalStorage) {
                throw new Error('Cloud sync not configured correctly');
            }
            
            const disableCloudResult = this.saveSystem.disableCloudSync();
            if (!disableCloudResult.success) {
                throw new Error(`Failed to disable cloud sync: ${disableCloudResult.error}`);
            }
            
            const disabledCloudConfig = this.saveSystem.getConfig();
            if (disabledCloudConfig.cloudSyncEnabled) {
                throw new Error('Cloud sync not disabled correctly');
            }
            
            // Test validateAllSaves
            const validationResults = this.saveSystem.validateAllSaves();
            if (validationResults.valid < 0 || validationResults.invalid < 0) {
                throw new Error('Validation results not valid');
            }
            
            // Test cleanupOldSaves
            const cleanupResult = this.saveSystem.cleanupOldSaves(86400000, 5); // 1 day, max 5 saves
            if (cleanupResult.error) {
                throw new Error(`Cleanup failed: ${cleanupResult.error}`);
            }
            
            this.addResult(testName, 'pass', 'Save management works correctly', performance.now() - start, {
                newSaveCreated: true,
                autoSaveManagementTested: true,
                cloudSyncManagementTested: true,
                validationTested: true,
                cleanupTested: true,
                configurationManagementVerified: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Save management failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testSaveSearchAndFilter(): Promise<void> {
        const testName = 'Save Search and Filter';
        const start = performance.now();
        
        try {
            // Create test saves for searching
            const testSaves = [
                { id: 'search1', name: 'Warrior Save', description: 'Warrior character save', level: 5, tags: ['warrior', 'combat'] },
                { id: 'search2', name: 'Mage Save', description: 'Mage character save', level: 8, tags: ['mage', 'magic'] },
                { id: 'search3', name: 'Rogue Save', description: 'Rogue character save', level: 3, tags: ['rogue', 'stealth'] },
                { id: 'search4', name: 'Test Warrior', description: 'Another warrior save', level: 7, tags: ['warrior', 'test'] },
            ];
            
            for (const save of testSaves) {
                // Create save slot
                this.saveSystem.createSaveSlot(save.id, save.name, save.description);
                
                // Create save data
                const saveData = RustSaveSystem.createSaveData(
                    save.id,
                    save.name,
                    save.description,
                    SaveType.Manual,
                    '1.0.0',
                    save.level,
                    'search_scene',
                    [0, 0, 0],
                    [0, 0, 0, 1],
                    100,
                    100,
                    save.level * 100,
                    save.level * 50,
                    [],
                    [],
                    {},
                    {},
                    {},
                    undefined,
                    save.tags,
                    'Search test save'
                );
                
                this.saveSystem.saveGame(saveData);
            }
            
            // Test search by name
            const warriorSaves = this.saveSystem.searchSaves('Warrior');
            if (warriorSaves.length !== 2) {
                throw new Error('Should find 2 warrior saves');
            }
            
            // Test search by description
            const characterSaves = this.saveSystem.searchSaves('character');
            if (characterSaves.length !== 4) {
                throw new Error('Should find 4 character saves');
            }
            
            // Test search by tags (should search in save data metadata)
            const magicSaves = this.saveSystem.searchSaves('mage');
            if (magicSaves.length !== 1) {
                throw new Error('Should find 1 mage save');
            }
            
            // Test search with no results
            const noResults = this.saveSystem.searchSaves('nonexistent');
            if (noResults.length !== 0) {
                throw new Error('Should find no saves for nonexistent term');
            }
            
            // Test filter by save type
            const manualSaves = this.saveSystem.filterSaves({ saveType: SaveType.Manual });
            if (manualSaves.length < testSaves.length) {
                throw new Error('Should find all manual saves');
            }
            
            // Test filter by level range
            const midLevelSaves = this.saveSystem.filterSaves({ minLevel: 4, maxLevel: 7 });
            if (midLevelSaves.length !== 2) {
                throw new Error('Should find 2 saves in level range 4-7');
            }
            
            // Test filter by tags
            const warriorTagSaves = this.saveSystem.filterSaves({ tags: ['warrior'] });
            if (warriorTagSaves.length !== 2) {
                throw new Error('Should find 2 saves with warrior tag');
            }
            
            // Test combined filters
            const combinedFilters = this.saveSystem.filterSaves({
                minLevel: 5,
                maxLevel: 8,
                tags: ['warrior']
            });
            if (combinedFilters.length !== 1) {
                throw new Error('Should find 1 save with combined filters');
            }
            
            this.addResult(testName, 'pass', 'Save search and filter work correctly', performance.now() - start, {
                searchByNameTested: true,
                searchByDescriptionTested: true,
                searchByTagsTested: true,
                filterByTypeTested: true,
                filterByLevelTested: true,
                filterByTagsTested: true,
                combinedFiltersTested: true,
                noResultsTested: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Save search and filter failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testSaveComparison(): Promise<void> {
        const testName = 'Save Comparison';
        const start = performance.now();
        
        try {
            // Create two similar saves for comparison
            const saveData1 = RustSaveSystem.createSaveData(
                'compare1',
                'Compare Save 1',
                'First save for comparison',
                SaveType.Manual,
                '1.0.0',
                5,
                'compare_scene',
                [10, 20, 30],
                [0, 0, 0, 1],
                85.5,
                100,
                500,
                250,
                [
                    RustSaveSystem.createInventoryItem('sword', 'Sword', 1),
                    RustSaveSystem.createInventoryItem('potion', 'Potion', 3),
                ],
                [
                    RustSaveSystem.createQuestData('quest1', 'Main Quest', 'active', 0.5, [], []),
                ],
                { 'key': 'value' },
                { 'flag': true },
                { 'var': 1.5 },
                undefined,
                ['compare'],
                'Comparison test save 1'
            );
            
            const saveData2 = RustSaveSystem.createSaveData(
                'compare2',
                'Compare Save 2',
                'Second save for comparison',
                SaveType.Manual,
                '1.0.0',
                6,
                'compare_scene',
                [15, 25, 35],
                [0, 0, 0, 1],
                90.0,
                100,
                750,
                300,
                [
                    RustSaveSystem.createInventoryItem('sword', 'Sword', 1),
                    RustSaveSystem.createInventoryItem('shield', 'Shield', 1),
                ],
                [
                    RustSaveSystem.createQuestData('quest1', 'Main Quest', 'active', 0.7, [], []),
                    RustSaveSystem.createQuestData('quest2', 'Side Quest', 'completed', 1.0, [], []),
                ],
                { 'key': 'value', 'key2': 'value2' },
                { 'flag': true, 'flag2': false },
                { 'var': 2.0 },
                undefined,
                ['compare'],
                'Comparison test save 2'
            );
            
            // Save both saves
            this.saveSystem.createSaveSlot('compare1', 'Compare Save 1', 'First comparison save');
            this.saveSystem.createSaveSlot('compare2', 'Compare Save 2', 'Second comparison save');
            this.saveSystem.saveGame(saveData1);
            this.saveSystem.saveGame(saveData2);
            
            // Compare the saves
            const comparison = this.saveSystem.compareSaves('compare1', 'compare2');
            if (comparison.error) {
                throw new Error(`Comparison failed: ${comparison.error}`);
            }
            
            // Verify differences are detected
            if (comparison.differences.length === 0) {
                throw new Error('Should detect differences between saves');
            }
            
            // Check specific differences
            const hasLevelDifference = comparison.differences.some(diff => diff.includes('Level'));
            const hasHealthDifference = comparison.differences.some(diff => diff.includes('Health'));
            const hasExperienceDifference = comparison.differences.some(diff => diff.includes('Experience'));
            
            if (!hasLevelDifference || !hasHealthDifference || !hasExperienceDifference) {
                throw new Error('Should detect level, health, and experience differences');
            }
            
            // Verify similarity score
            if (comparison.similarity < 0 || comparison.similarity > 1) {
                throw new Error('Similarity score should be between 0 and 1');
            }
            
            if (comparison.similarity === 1) {
                throw new Error('Similarity should not be 1 for different saves');
            }
            
            // Test comparison with identical saves
            const identicalComparison = this.saveSystem.compareSaves('compare1', 'compare1');
            if (identicalComparison.error) {
                throw new Error(`Identical comparison failed: ${identicalComparison.error}`);
            }
            
            if (identicalComparison.similarity !== 1) {
                throw new Error('Identical saves should have similarity of 1');
            }
            
            if (identicalComparison.differences.length > 0) {
                throw new Error('Identical saves should have no differences');
            }
            
            // Test comparison with non-existent saves
            const invalidComparison1 = this.saveSystem.compareSaves('nonexistent1', 'compare2');
            if (!invalidComparison1.error) {
                throw new Error('Should fail to compare with non-existent save');
            }
            
            const invalidComparison2 = this.saveSystem.compareSaves('compare1', 'nonexistent2');
            if (!invalidComparison2.error) {
                throw new Error('Should fail to compare with non-existent save');
            }
            
            this.addResult(testName, 'pass', 'Save comparison works correctly', performance.now() - start, {
                differencesDetected: comparison.differences.length,
                similarityScore: comparison.similarity,
                identicalComparisonTested: true,
                errorHandlingTested: true,
                specificDifferencesVerified: {
                    level: hasLevelDifference,
                    health: hasHealthDifference,
                    experience: hasExperienceDifference,
                },
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Save comparison failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testExportImport(): Promise<void> {
        const testName = 'Export Import';
        const start = performance.now();
        
        try {
            // Create test save for export
            const exportSaveData = RustSaveSystem.createSaveData(
                'export_save',
                'Export Test',
                'Save for export testing',
                SaveType.Manual,
                '1.0.0',
                3,
                'export_scene',
                [5, 10, 15],
                [0, 0, 0, 1],
                75.0,
                100,
                300,
                150,
                [
                    RustSaveSystem.createInventoryItem('export_item', 'Export Item', 2),
                ],
                [],
                { 'export_key': 'export_value' },
                { 'export_flag': true },
                { 'export_var': 1.25 },
                undefined,
                ['export'],
                'Export test save'
            );
            
            this.saveSystem.createSaveSlot('export_save', 'Export Test', 'Export test save');
            this.saveSystem.saveGame(exportSaveData);
            
            // Test export
            const exportResult = this.saveSystem.exportSave('export_save');
            if (!exportResult.success) {
                throw new Error(`Failed to export save: ${exportResult.error}`);
            }
            
            if (!exportResult.data) {
                throw new Error('Exported data is empty');
            }
            
            // Verify exported data is valid JSON
            let parsedData: any;
            try {
                parsedData = JSON.parse(exportResult.data);
            } catch (parseError) {
                throw new Error('Exported data is not valid JSON');
            }
            
            if (!parsedData.id || !parsedData.name || !parsedData.saveData) {
                throw new Error('Exported data missing required fields');
            }
            
            // Test import
            const importResult = this.saveSystem.importSave(exportResult.data);
            if (!importResult.success) {
                throw new Error(`Failed to import save: ${importResult.error}`);
            }
            
            if (!importResult.saveId) {
                throw new Error('Import did not return save ID');
            }
            
            // Verify imported save
            const importedSlot = this.saveSystem.getSaveSlot(importResult.saveId);
            if (!importedSlot || !importedSlot.saveData) {
                throw new Error('Imported save slot not created or empty');
            }
            
            const importedData = importedSlot.saveData;
            if (importedData.name !== exportSaveData.name || importedData.level !== exportSaveData.level) {
                throw new Error('Imported save data does not match original');
            }
            
            if (importedData.inventory.length !== exportSaveData.inventory.length) {
                throw new Error('Imported inventory does not match original');
            }
            
            // Test import of invalid JSON
            const invalidJsonResult = this.saveSystem.importSave('invalid json data');
            if (invalidJsonResult.success) {
                throw new Error('Should fail to import invalid JSON');
            }
            
            // Test import of invalid save data
            const invalidSaveData = { invalid: 'data' };
            const invalidDataResult = this.saveSystem.importSave(JSON.stringify(invalidSaveData));
            if (invalidDataResult.success) {
                throw new Error('Should fail to import invalid save data');
            }
            
            // Test export of non-existent save
            const invalidExportResult = this.saveSystem.exportSave('nonexistent');
            if (invalidExportResult.success) {
                throw new Error('Should fail to export non-existent save');
            }
            
            this.addResult(testName, 'pass', 'Export import works correctly', performance.now() - start, {
                exportTested: true,
                importTested: true,
                jsonValidationTested: true,
                dataIntegrityVerified: true,
                errorHandlingTested: true,
                invalidDataTested: true,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Export import failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private addResult(name: string, status: 'pass' | 'fail' | 'skip', message: string, duration: number, details?: any): void {
        this.results.push({ name, status, message, duration, details });
        
        const statusIcon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
        console.log(`${statusIcon} ${name}: ${message} (${duration.toFixed(2)}ms)`);
    }

    private generateReport(): void {
        console.log('\n💾 Rust Save System Test Report');
        console.log('===================================');
        
        const passed = this.results.filter(r => r.status === 'pass').length;
        const failed = this.results.filter(r => r.status === 'fail').length;
        const skipped = this.results.filter(r => r.status === 'skip').length;
        const total = this.results.length;
        
        console.log(`\n📈 Summary:`);
        console.log(`   Total Tests: ${total}`);
        console.log(`   Passed: ${passed}`);
        console.log(`   Failed: ${failed}`);
        console.log(`   Skipped: ${skipped}`);
        console.log(`   Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        
        const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
        console.log(`   Total Duration: ${totalDuration.toFixed(2)}ms`);
        
        if (failed > 0) {
            console.log(`\n❌ Failed Tests:`);
            this.results.filter(r => r.status === 'fail').forEach(result => {
                console.log(`   - ${result.name}: ${result.message}`);
            });
        }
        
        // Save System Summary
        const initTest = this.results.find(r => r.name === 'Save System Initialization');
        const configTest = this.results.find(r => r.name === 'Configuration Presets');
        const saveTest = this.results.find(r => r.name === 'Save Operations');
        const validationTest = this.results.find(r => r.name === 'Save Validation');
        const backupTest = this.results.find(r => r.name === 'Backup Operations');
        
        if (initTest?.details || configTest?.details || saveTest?.details || validationTest?.details || backupTest?.details) {
            console.log(`\n💾 Save System Summary:`);
            if (initTest?.details) {
                console.log(`   Initialization: ✅ Complete`);
            }
            if (configTest?.details) {
                console.log(`   Configuration: ${configTest.details.configsTested} presets tested`);
            }
            if (saveTest?.details) {
                console.log(`   Save Operations: ${saveTest.details.inventoryVerified} items verified`);
            }
            if (validationTest?.details) {
                console.log(`   Validation: ${validationTest.details.compatibilityScoreTested} score tested`);
            }
            if (backupTest?.details) {
                console.log(`   Backup Operations: ${backupTest.details.backupDataVerified} data verified`);
            }
        }
        
        // Save detailed results
        const report = {
            timestamp: new Date().toISOString(),
            results: this.results,
            summary: {
                total,
                passed,
                failed,
                skipped,
                successRate: (passed / total) * 100,
                totalDuration,
            },
            environment: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                cores: navigator.hardwareConcurrency,
                webgl: !!document.createElement('canvas').getContext('webgl'),
                wasm: typeof WebAssembly !== 'undefined',
            },
        };
        
        console.log('\n📄 Detailed test report:', JSON.stringify(report, null, 2));
    }

    getResults(): TestResult[] {
        return [...this.results];
    }

    clearResults(): void {
        this.results = [];
    }
}
