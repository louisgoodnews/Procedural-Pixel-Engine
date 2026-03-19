// Enums
export enum SaveType {
    Auto = 0,
    Manual = 1,
    Quick = 2,
    Cloud = 3,
    Backup = 4,
}

export enum SaveCompressionType {
    None = 0,
    Gzip = 1,
    Brotli = 2,
    LZ4 = 3,
    Custom = 4,
}

export enum SaveEncryptionType {
    None = 0,
    AES256 = 1,
    ChaCha20 = 2,
    Custom = 3,
}

export enum SaveStatus {
    Success = 0,
    Error = 1,
    Corrupted = 2,
    Incompatible = 3,
    CloudError = 4,
    EncryptionError = 5,
    CompressionError = 6,
}

export enum CloudProvider {
    None = 0,
    LocalStorage = 1,
    IndexedDB = 2,
    Firebase = 3,
    AWS = 4,
    Custom = 5,
}

// Interfaces
export interface SaveData {
    id: string;
    name: string;
    description: string;
    saveType: SaveType;
    version: string;
    timestamp: number;
    playtime: number; // in seconds
    level: number;
    scene: string;
    playerPosition: [number, number, number];
    playerRotation: [number, number, number, number]; // quaternion
    health: number;
    maxHealth: number;
    experience: number;
    levelExperience: number;
    inventory: InventoryItem[];
    quests: QuestData[];
    worldState: Record<string, string>;
    gameFlags: Record<string, boolean>;
    variables: Record<string, number>;
    screenshot?: string; // base64 encoded
    metadata: SaveMetadata;
    checksum: string;
}

export interface InventoryItem {
    id: string;
    name: string;
    quantity: number;
    quality: number; // 0-100
    durability: number; // 0.0-1.0
    customProperties: Record<string, string>;
}

export interface QuestData {
    id: string;
    name: string;
    status: string; // "active", "completed", "failed"
    progress: number; // 0.0-1.0
    objectives: QuestObjective[];
    rewards: QuestReward[];
    startedTimestamp: number;
    completedTimestamp?: number;
}

export interface QuestObjective {
    id: string;
    description: string;
    completed: boolean;
    progress: number;
    requiredProgress: number;
}

export interface QuestReward {
    id: string;
    type: string; // "experience", "item", "gold", etc.
    amount: number;
    itemId?: string;
}

export interface SaveMetadata {
    gameVersion: string;
    engineVersion: string;
    platform: string;
    compressionType: SaveCompressionType;
    encryptionType: SaveEncryptionType;
    cloudProvider: CloudProvider;
    fileSize: number;
    compressedSize: number;
    encrypted: boolean;
    tags: string[];
    notes: string;
}

export interface SaveSlot {
    id: string;
    name: string;
    description: string;
    saveData?: SaveData;
    createdAt: number;
    updatedAt: number;
    lastPlayed: number;
    playtime: number;
    screenshot?: string;
    isValid: boolean;
    isCorrupted: boolean;
    isCompatible: boolean;
    cloudSynced: boolean;
    tags: string[];
}

export interface SaveConfig {
    autoSaveEnabled: boolean;
    autoSaveInterval: number; // in seconds
    maxAutoSaves: number;
    maxManualSaves: number;
    compressionType: SaveCompressionType;
    encryptionType: SaveEncryptionType;
    cloudProvider: CloudProvider;
    cloudSyncEnabled: boolean;
    validateSaves: boolean;
    backupSaves: boolean;
    maxBackupSaves: number;
    screenshotEnabled: boolean;
    screenshotQuality: number; // 0-100
}

export interface SaveStats {
    totalSaves: number;
    autoSaves: number;
    manualSaves: number;
    cloudSaves: number;
    failedSaves: number;
    corruptedSaves: number;
    totalSize: number;
    compressedSize: number;
    averageSaveTime: number;
    lastSaveTime: number;
    saveSlotsUsed: number;
    saveSlotsTotal: number;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    compatibilityScore: number; // 0.0-1.0
    missingFields: string[];
    versionCompatibility: string;
}

// Main class
export class RustSaveSystem {
    private saveSystem: any;
    private initialized: boolean = false;

    constructor() {
        this.saveSystem = null;
    }

    async initialize(config: SaveConfig): Promise<void> {
        try {
            // Import the WASM module
            const wasmModule = await import('../../pkg/procedural_pixel_engine_core');
            
            // Create the save system
            this.saveSystem = new wasmModule.SaveSystemExport(config);
            this.initialized = true;
            
            console.log('💾 Rust Save System initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Rust Save System:', error);
            throw error;
        }
    }

    isInitialized(): boolean {
        return this.initialized;
    }

    // Configuration
    updateConfig(config: SaveConfig): void {
        if (!this.initialized) {
            throw new Error('Save System not initialized');
        }
        this.saveSystem.update_config(config);
    }

    getConfig(): SaveConfig {
        if (!this.initialized) {
            throw new Error('Save System not initialized');
        }
        return this.saveSystem.get_config();
    }

    // Statistics
    getStats(): SaveStats {
        if (!this.initialized) {
            throw new Error('Save System not initialized');
        }
        return this.saveSystem.get_stats();
    }

    getSaveSystemSummary(): string {
        if (!this.initialized) {
            throw new Error('Save System not initialized');
        }
        return this.saveSystem.get_save_system_summary();
    }

    // Save slot management
    createSaveSlot(id: string, name: string, description: string): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Save System not initialized' };
        }
        try {
            this.saveSystem.create_save_slot(id, name, description);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    deleteSaveSlot(id: string): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Save System not initialized' };
        }
        try {
            this.saveSystem.delete_save_slot(id);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    getSaveSlot(id: string): SaveSlot | null {
        if (!this.initialized) {
            throw new Error('Save System not initialized');
        }
        const slot = this.saveSystem.get_save_slot(id);
        return slot || null;
    }

    getAllSaveSlots(): SaveSlot[] {
        if (!this.initialized) {
            throw new Error('Save System not initialized');
        }
        return this.saveSystem.get_all_save_slots();
    }

    getSaveSlotsByType(saveType: SaveType): SaveSlot[] {
        if (!this.initialized) {
            throw new Error('Save System not initialized');
        }
        const allSlots = this.getAllSaveSlots();
        return allSlots.filter(slot => slot.saveData && slot.saveData.saveType === saveType);
    }

    // Save operations
    saveGame(saveData: SaveData): { success: boolean; saveId?: string; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Save System not initialized' };
        }
        try {
            const saveId = this.saveSystem.save_game(saveData);
            return { success: true, saveId };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    loadGame(saveSlotId: string): { success: boolean; saveData?: SaveData; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Save System not initialized' };
        }
        try {
            const saveData = this.saveSystem.load_game(saveSlotId);
            return { success: true, saveData };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    autoSave(): { success: boolean; saveId?: string; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Save System not initialized' };
        }
        try {
            const saveId = this.saveSystem.auto_save();
            return { success: true, saveId };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    quickSave(): { success: boolean; saveId?: string; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Save System not initialized' };
        }
        try {
            const saveId = this.saveSystem.quick_save();
            return { success: true, saveId };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    // Validation
    validateSaveData(saveData: SaveData): ValidationResult {
        if (!this.initialized) {
            throw new Error('Save System not initialized');
        }
        return this.saveSystem.validate_save_data(saveData);
    }

    // Compatibility checking
    checkCompatibility(saveData: SaveData): ValidationResult {
        if (!this.initialized) {
            throw new Error('Save System not initialized');
        }
        return this.saveSystem.check_compatibility(saveData);
    }

    // Cloud operations
    syncToCloud(): { success: boolean; syncedSaves?: string[]; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Save System not initialized' };
        }
        try {
            const syncedSaves = this.saveSystem.sync_to_cloud();
            return { success: true, syncedSaves };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    downloadFromCloud(saveId: string): { success: boolean; saveData?: SaveData; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Save System not initialized' };
        }
        try {
            const saveData = this.saveSystem.download_from_cloud(saveId);
            return { success: true, saveData };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    // Backup operations
    createBackup(saveSlotId: string): { success: boolean; backupId?: string; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Save System not initialized' };
        }
        try {
            const backupId = this.saveSystem.create_backup(saveSlotId);
            return { success: true, backupId };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    restoreBackup(backupId: string, targetSlotId: string): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Save System not initialized' };
        }
        try {
            this.saveSystem.restore_backup(backupId, targetSlotId);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    // Utility methods
    static createDefaultConfig(): SaveConfig {
        return {
            autoSaveEnabled: true,
            autoSaveInterval: 300, // 5 minutes
            maxAutoSaves: 5,
            maxManualSaves: 20,
            compressionType: SaveCompressionType.Gzip,
            encryptionType: SaveEncryptionType.None,
            cloudProvider: CloudProvider.LocalStorage,
            cloudSyncEnabled: false,
            validateSaves: true,
            backupSaves: true,
            maxBackupSaves: 10,
            screenshotEnabled: true,
            screenshotQuality: 75,
        };
    }

    static createDevelopmentConfig(): SaveConfig {
        return {
            autoSaveEnabled: true,
            autoSaveInterval: 60, // 1 minute
            maxAutoSaves: 10,
            maxManualSaves: 50,
            compressionType: SaveCompressionType.None,
            encryptionType: SaveEncryptionType.None,
            cloudProvider: CloudProvider.LocalStorage,
            cloudSyncEnabled: false,
            validateSaves: true,
            backupSaves: true,
            maxBackupSaves: 20,
            screenshotEnabled: true,
            screenshotQuality: 90,
        };
    }

    static createProductionConfig(): SaveConfig {
        return {
            autoSaveEnabled: true,
            autoSaveInterval: 600, // 10 minutes
            maxAutoSaves: 3,
            maxManualSaves: 10,
            compressionType: SaveCompressionType.Gzip,
            encryptionType: SaveEncryptionType.AES256,
            cloudProvider: CloudProvider.IndexedDB,
            cloudSyncEnabled: true,
            validateSaves: true,
            backupSaves: true,
            maxBackupSaves: 5,
            screenshotEnabled: true,
            screenshotQuality: 50,
        };
    }

    static createMobileConfig(): SaveConfig {
        return {
            autoSaveEnabled: true,
            autoSaveInterval: 900, // 15 minutes
            maxAutoSaves: 2,
            maxManualSaves: 5,
            compressionType: SaveCompressionType.LZ4,
            encryptionType: SaveEncryptionType.AES256,
            cloudProvider: CloudProvider.Firebase,
            cloudSyncEnabled: true,
            validateSaves: true,
            backupSaves: false,
            maxBackupSaves: 3,
            screenshotEnabled: false,
            screenshotQuality: 50,
        };
    }

    // Factory methods
    static createSaveData(
        id: string,
        name: string,
        description: string,
        saveType: SaveType,
        version: string,
        level: number,
        scene: string,
        playerPosition: [number, number, number],
        playerRotation: [number, number, number, number],
        health: number,
        maxHealth: number,
        experience: number,
        levelExperience: number,
        inventory: InventoryItem[],
        quests: QuestData[],
        worldState: Record<string, string>,
        gameFlags: Record<string, boolean>,
        variables: Record<string, number>,
        screenshot?: string,
        tags: string[] = [],
        notes: string = ''
    ): SaveData {
        return {
            id,
            name,
            description,
            saveType,
            version,
            timestamp: Date.now(),
            playtime: 0,
            level,
            scene,
            playerPosition,
            playerRotation,
            health,
            maxHealth,
            experience,
            levelExperience,
            inventory,
            quests,
            worldState,
            gameFlags,
            variables,
            screenshot,
            metadata: {
                gameVersion: version,
                engineVersion: "1.0.0",
                platform: this.detectPlatform(),
                compressionType: SaveCompressionType.None,
                encryptionType: SaveEncryptionType.None,
                cloudProvider: CloudProvider.None,
                fileSize: 0,
                compressedSize: 0,
                encrypted: false,
                tags,
                notes,
            },
            checksum: '',
        };
    }

    static createInventoryItem(
        id: string,
        name: string,
        quantity: number,
        quality: number = 100,
        durability: number = 1.0,
        customProperties: Record<string, string> = {}
    ): InventoryItem {
        return {
            id,
            name,
            quantity,
            quality,
            durability,
            customProperties,
        };
    }

    static createQuestData(
        id: string,
        name: string,
        status: string,
        progress: number,
        objectives: QuestObjective[],
        rewards: QuestReward[]
    ): QuestData {
        return {
            id,
            name,
            status,
            progress,
            objectives,
            rewards,
            startedTimestamp: Date.now(),
            completedTimestamp: undefined,
        };
    }

    static createQuestObjective(
        id: string,
        description: string,
        requiredProgress: number
    ): QuestObjective {
        return {
            id,
            description,
            completed: false,
            progress: 0,
            requiredProgress,
        };
    }

    static createQuestReward(
        id: string,
        type_: string,
        amount: number,
        itemId?: string
    ): QuestReward {
        return {
            id,
            type: type_,
            amount,
            itemId,
        };
    }

    static createSaveSlot(
        id: string,
        name: string,
        description: string,
        tags: string[] = []
    ): SaveSlot {
        const now = Date.now();
        return {
            id,
            name,
            description,
            createdAt: now,
            updatedAt: now,
            lastPlayed: now,
            playtime: 0,
            screenshot: undefined,
            isValid: true,
            isCorrupted: false,
            isCompatible: true,
            cloudSynced: false,
            tags,
        };
    }

    // Platform detection
    private static detectPlatform(): string {
        if (typeof window !== 'undefined') {
            const userAgent = navigator.userAgent.toLowerCase();
            if (userAgent.includes('android')) return 'android';
            if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
            if (userAgent.includes('windows')) return 'windows';
            if (userAgent.includes('mac')) return 'mac';
            if (userAgent.includes('linux')) return 'linux';
        }
        return 'web';
    }

    // Save management
    createNewSave(name: string, description: string): { success: boolean; saveId?: string; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Save System not initialized' };
        }

        const saveId = `save_${Date.now()}`;
        
        // Create save slot
        const slotResult = this.createSaveSlot(saveId, name, description);
        if (!slotResult.success) {
            return { success: false, error: slotResult.error };
        }

        // Create initial save data
        const saveData = this.createSaveData(
            saveId,
            name,
            description,
            SaveType.Manual,
            "1.0.0",
            1,
            "main_menu",
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
            ["new"],
            "New game save"
        );

        return this.saveGame(saveData);
    }

    // Auto save management
    enableAutoSave(interval?: number): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Save System not initialized' };
        }

        const config = this.getConfig();
        config.autoSaveEnabled = true;
        if (interval) {
            config.autoSaveInterval = interval;
        }

        this.updateConfig(config);
        return { success: true };
    }

    disableAutoSave(): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Save System not initialized' };
        }

        const config = this.getConfig();
        config.autoSaveEnabled = false;
        this.updateConfig(config);
        return { success: true };
    }

    // Cloud sync management
    enableCloudSync(provider: CloudProvider): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Save System not initialized' };
        }

        const config = this.getConfig();
        config.cloudSyncEnabled = true;
        config.cloudProvider = provider;
        this.updateConfig(config);
        return { success: true };
    }

    disableCloudSync(): { success: boolean; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Save System not initialized' };
        }

        const config = this.getConfig();
        config.cloudSyncEnabled = false;
        this.updateConfig(config);
        return { success: true };
    }

    // Save validation
    validateAllSaves(): { valid: number; invalid: number; corrupted: number; incompatible: number } {
        if (!this.initialized) {
            throw new Error('Save System not initialized');
        }

        const slots = this.getAllSaveSlots();
        let valid = 0;
        let invalid = 0;
        let corrupted = 0;
        let incompatible = 0;

        for (const slot of slots) {
            if (!slot.saveData) {
                invalid++;
                continue;
            }

            const validation = this.validateSaveData(slot.saveData);
            if (!validation.isValid) {
                if (validation.errors.some(error => error.includes('corrupted'))) {
                    corrupted++;
                } else if (validation.errors.some(error => error.includes('incompatible'))) {
                    incompatible++;
                } else {
                    invalid++;
                }
            } else {
                valid++;
            }
        }

        return { valid, invalid, corrupted, incompatible };
    }

    // Save cleanup
    cleanupOldSaves(maxAge: number, maxCount: number): { deleted: number; error?: string } {
        if (!this.initialized) {
            return { deleted: 0, error: 'Save System not initialized' };
        }

        const slots = this.getAllSaveSlots();
        const now = Date.now();
        let deleted = 0;

        // Sort by last played (oldest first)
        const sortedSlots = slots.sort((a, b) => a.lastPlayed - b.lastPlayed);

        for (const slot of sortedSlots) {
            if (slots.length - deleted <= maxCount) {
                break; // Keep at least maxCount saves
            }

            if (now - slot.lastPlayed > maxAge) {
                const result = this.deleteSaveSlot(slot.id);
                if (result.success) {
                    deleted++;
                }
            }
        }

        return { deleted };
    }

    // Save export/import
    exportSave(saveSlotId: string): { success: boolean; data?: string; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Save System not initialized' };
        }

        const slot = this.getSaveSlot(saveSlotId);
        if (!slot || !slot.saveData) {
            return { success: false, error: 'Save slot not found or empty' };
        }

        try {
            const data = JSON.stringify(slot.saveData, null, 2);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    importSave(data: string): { success: boolean; saveId?: string; error?: string } {
        if (!this.initialized) {
            return { success: false, error: 'Save System not initialized' };
        }

        try {
            const saveData: SaveData = JSON.parse(data);
            
            // Validate imported save
            const validation = this.validateSaveData(saveData);
            if (!validation.isValid) {
                return { success: false, error: `Invalid save data: ${validation.errors.join(', ')}` };
            }

            // Create new save slot for imported save
            const saveId = `imported_${Date.now()}`;
            const slotResult = this.createSaveSlot(saveId, saveData.name, "Imported save");
            if (!slotResult.success) {
                return { success: false, error: slotResult.error };
            }

            // Update save data ID and save
            saveData.id = saveId;
            saveData.saveType = SaveType.Manual;
            
            return this.saveGame(saveData);
        } catch (error) {
            return { success: false, error: `Failed to parse save data: ${String(error)}` };
        }
    }

    // Save statistics and analysis
    getSaveStatistics(): {
        totalSaves: number;
        autoSaves: number;
        manualSaves: number;
        cloudSaves: number;
        averageFileSize: number;
        totalPlaytime: number;
        oldestSave: number;
        newestSave: number;
        mostPlayedSave?: { id: string; name: string; playtime: number };
    } {
        if (!this.initialized) {
            throw new Error('Save System not initialized');
        }

        const stats = this.getStats();
        const slots = this.getAllSaveSlots();
        
        let totalFileSize = 0;
        let totalPlaytime = 0;
        let oldestSave = Date.now();
        let newestSave = 0;
        let mostPlayedSave: { id: string; name: string; playtime: number } | undefined = undefined;

        for (const slot of slots) {
            if (slot.saveData) {
                totalFileSize += slot.saveData.metadata.fileSize;
                totalPlaytime += slot.saveData.playtime;
                
                if (slot.createdAt < oldestSave) {
                    oldestSave = slot.createdAt;
                }
                
                if (slot.createdAt > newestSave) {
                    newestSave = slot.createdAt;
                }
                
                if (!mostPlayedSave || slot.saveData.playtime > mostPlayedSave.playtime) {
                    mostPlayedSave = {
                        id: slot.id,
                        name: slot.name,
                        playtime: slot.saveData.playtime
                    };
                }
            }
        }

        return {
            totalSaves: stats.totalSaves,
            autoSaves: stats.autoSaves,
            manualSaves: stats.manualSaves,
            cloudSaves: stats.cloudSaves,
            averageFileSize: slots.length > 0 ? totalFileSize / slots.length : 0,
            totalPlaytime,
            oldestSave,
            newestSave,
            mostPlayedSave,
        };
    }

    // Save search and filtering
    searchSaves(query: string): SaveSlot[] {
        if (!this.initialized) {
            throw new Error('Save System not initialized');
        }

        const slots = this.getAllSaveSlots();
        const lowerQuery = query.toLowerCase();

        return slots.filter(slot => {
            if (slot.name.toLowerCase().includes(lowerQuery)) return true;
            if (slot.description.toLowerCase().includes(lowerQuery)) return true;
            if (slot.saveData) {
                const save = slot.saveData;
                if (save.name.toLowerCase().includes(lowerQuery)) return true;
                if (save.description.toLowerCase().includes(lowerQuery)) return true;
                if (save.scene.toLowerCase().includes(lowerQuery)) return true;
                if (save.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) return true;
            }
            return false;
        });
    }

    filterSaves(filters: {
        saveType?: SaveType;
        minLevel?: number;
        maxLevel?: number;
        minPlaytime?: number;
        maxPlaytime?: number;
        tags?: string[];
        dateRange?: { start: number; end: number };
    }): SaveSlot[] {
        if (!this.initialized) {
            throw new Error('Save System not initialized');
        }

        const slots = this.getAllSaveSlots();

        return slots.filter(slot => {
            if (!slot.saveData) return false;

            const save = slot.saveData;

            // Filter by save type
            if (filters.saveType && save.saveType !== filters.saveType) return false;

            // Filter by level range
            if (filters.minLevel !== undefined && save.level < filters.minLevel) return false;
            if (filters.maxLevel !== undefined && save.level > filters.maxLevel) return false;

            // Filter by playtime range
            if (filters.minPlaytime !== undefined && save.playtime < filters.minPlaytime) return false;
            if (filters.maxPlaytime !== undefined && save.playtime > filters.maxPlaytime) return false;

            // Filter by tags
            if (filters.tags && filters.tags.length > 0) {
                const hasAllTags = filters.tags.every(tag => save.metadata.tags.includes(tag));
                if (!hasAllTags) return false;
            }

            // Filter by date range
            if (filters.dateRange) {
                if (save.timestamp < filters.dateRange.start || save.timestamp > filters.dateRange.end) {
                    return false;
                }
            }

            return true;
        });
    }

    // Save comparison
    compareSaves(saveId1: string, saveId2: string): { 
        differences: string[]; 
        similarity: number; 
        error?: string 
    } {
        if (!this.initialized) {
            return { differences: [], similarity: 0, error: 'Save System not initialized' };
        }

        const slot1 = this.getSaveSlot(saveId1);
        const slot2 = this.getSaveSlot(saveId2);

        if (!slot1 || !slot1.saveData) {
            return { differences: [], similarity: 0, error: 'Save 1 not found or empty' };
        }

        if (!slot2 || !slot2.saveData) {
            return { differences: [], similarity: 0, error: 'Save 2 not found or empty' };
        }

        const save1 = slot1.saveData;
        const save2 = slot2.saveData;
        const differences: string[] = [];
        let similarity = 0;
        let totalChecks = 0;

        // Compare basic properties
        if (save1.level !== save2.level) {
            differences.push(`Level: ${save1.level} vs ${save2.level}`);
        } else {
            similarity++;
        }
        totalChecks++;

        if (save1.health !== save2.health) {
            differences.push(`Health: ${save1.health} vs ${save2.health}`);
        } else {
            similarity++;
        }
        totalChecks++;

        if (save1.experience !== save2.experience) {
            differences.push(`Experience: ${save1.experience} vs ${save2.experience}`);
        } else {
            similarity++;
        }
        totalChecks++;

        // Compare inventory
        const inv1Size = save1.inventory.length;
        const inv2Size = save2.inventory.length;
        if (inv1Size !== inv2Size) {
            differences.push(`Inventory size: ${inv1Size} vs ${inv2Size}`);
        } else {
            similarity++;
        }
        totalChecks++;

        // Compare quests
        const quest1Size = save1.quests.length;
        const quest2Size = save2.quests.length;
        if (quest1Size !== quest2Size) {
            differences.push(`Quest count: ${quest1Size} vs ${quest2Size}`);
        } else {
            similarity++;
        }
        totalChecks++;

        // Compare world state
        const ws1Size = Object.keys(save1.worldState).length;
        const ws2Size = Object.keys(save2.worldState).length;
        if (ws1Size !== ws2Size) {
            differences.push(`World state size: ${ws1Size} vs ${ws2Size}`);
        } else {
            similarity++;
        }
        totalChecks++;

        return {
            differences,
            similarity: totalChecks > 0 ? similarity / totalChecks : 0
        };
    }
}
