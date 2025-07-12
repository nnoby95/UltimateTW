/**
 * Database Manager for Auto Builder
 * Handles all database operations and data persistence
 */
class DatabaseManager {
    constructor() {
        this.databases = {
            villages: 'villages_db',
            resources: 'resources_db',
            buildings: 'built_buildings_db',
            queue: 'active_queue_db',
            plans: 'future_plans_db',
            settings: 'settings_db'
        };
    }
    
    /**
     * Initialize all databases
     */
    async init() {
        try {
            console.log('🗄️ Initializing databases...');
            
            // Initialize all databases
            Object.values(this.databases).forEach(dbName => {
                if (!localStorage.getItem(dbName)) {
                    localStorage.setItem(dbName, JSON.stringify({}));
                }
            });
            
            console.log('✅ Databases initialized successfully!');
            
        } catch (error) {
            console.error('❌ Failed to initialize databases:', error);
        }
    }
    
    /**
     * Save data to database
     * @param {string} dbName - Database name
     * @param {object} data - Data to save
     */
    save(dbName, data) {
        try {
            localStorage.setItem(dbName, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`❌ Failed to save to ${dbName}:`, error);
            return false;
        }
    }
    
    /**
     * Load data from database
     * @param {string} dbName - Database name
     * @returns {object} Database data
     */
    load(dbName) {
        try {
            const data = localStorage.getItem(dbName);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error(`❌ Failed to load from ${dbName}:`, error);
            return {};
        }
    }
    
    /**
     * Update village data in specific database
     * @param {string} dbName - Database name
     * @param {string} villageId - Village ID
     * @param {object} data - Data to update
     */
    updateVillage(dbName, villageId, data) {
        try {
            const db = this.load(dbName);
            db[villageId] = { 
                ...db[villageId], 
                ...data, 
                lastUpdated: Date.now() 
            };
            this.save(dbName, db);
            return true;
        } catch (error) {
            console.error(`❌ Failed to update village ${villageId} in ${dbName}:`, error);
            return false;
        }
    }
    
    /**
     * Get village data from specific database
     * @param {string} dbName - Database name
     * @param {string} villageId - Village ID
     * @returns {object|null} Village data
     */
    getVillage(dbName, villageId) {
        const db = this.load(dbName);
        return db[villageId] || null;
    }
    
    /**
     * Get all villages from specific database
     * @param {string} dbName - Database name
     * @returns {object} All villages data
     */
    getAllVillages(dbName) {
        return this.load(dbName);
    }
    
    /**
     * Delete village data from specific database
     * @param {string} dbName - Database name
     * @param {string} villageId - Village ID
     */
    deleteVillage(dbName, villageId) {
        try {
            const db = this.load(dbName);
            delete db[villageId];
            this.save(dbName, db);
            return true;
        } catch (error) {
            console.error(`❌ Failed to delete village ${villageId} from ${dbName}:`, error);
            return false;
        }
    }
    
    /**
     * Clear all databases
     */
    clearAll() {
        try {
            Object.values(this.databases).forEach(dbName => {
                localStorage.removeItem(dbName);
            });
            console.log('🗑️ All databases cleared!');
            return true;
        } catch (error) {
            console.error('❌ Failed to clear databases:', error);
            return false;
        }
    }
    
    /**
     * Export all data
     * @returns {object} All database data
     */
    exportAll() {
        const exportData = {};
        Object.entries(this.databases).forEach(([key, dbName]) => {
            exportData[key] = this.load(dbName);
        });
        return exportData;
    }
    
    /**
     * Import all data
     * @param {object} data - Data to import
     */
    importAll(data) {
        try {
            Object.entries(data).forEach(([key, dbData]) => {
                if (this.databases[key]) {
                    this.save(this.databases[key], dbData);
                }
            });
            console.log('📥 Data imported successfully!');
            return true;
        } catch (error) {
            console.error('❌ Failed to import data:', error);
            return false;
        }
    }
} 