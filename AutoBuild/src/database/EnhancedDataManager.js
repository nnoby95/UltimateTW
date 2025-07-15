/**
 * Enhanced Data Manager for AutoBuild
 * Simple interface to work with the enhanced data collector
 * Provides easy access to village data for building decisions
 */
class EnhancedDataManager {
    constructor() {
        this.lastDataUpdate = 0;
        this.dataUpdateInterval = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Get comprehensive village data (fetches fresh data if needed)
     * @param {string} villageId - Village ID to get data for
     * @param {boolean} forceRefresh - Force fresh data collection
     * @returns {Promise<Object>} Complete village data
     */
    async getVillageData(villageId = game_data.village.id, forceRefresh = false) {
        try {
            // Check if we have recent data
            if (!forceRefresh && this.hasRecentData()) {
                const existingData = await this.loadExistingData(villageId);
                if (existingData) {
                    console.log('📊 Using cached village data');
                    return existingData;
                }
            }

            // Collect fresh data using enhanced collector
            console.log('🔄 Collecting fresh village data...');
            
            // Use the enhanced data collector if available
            if (typeof window.collectComprehensiveDataEnhanced === 'function') {
                await window.collectComprehensiveDataEnhanced(villageId);
                this.lastDataUpdate = Date.now();
                
                // Load the fresh data
                return await this.loadExistingData(villageId);
            } else {
                console.error('❌ Enhanced data collector not available');
                return null;
            }

        } catch (error) {
            console.error('❌ Error getting village data:', error);
            return null;
        }
    }

    /**
     * Check if we have recent data
     * @returns {boolean} True if data is recent
     */
    hasRecentData() {
        const timeSinceUpdate = Date.now() - this.lastDataUpdate;
        return timeSinceUpdate < this.dataUpdateInterval;
    }

    /**
     * Load existing data from the enhanced data collector's database
     * @param {string} villageId - Village ID
     * @returns {Promise<Object>} Existing data or null
     */
    async loadExistingData(villageId) {
        try {
            // Access the enhanced data collector's database
            const DB_NAME = 'TribalWarsGameData';
            const storeName = `village_${villageId}`;
            
            const db = await this.openDatabase(DB_NAME);
            if (!db.objectStoreNames.contains(storeName)) {
                return null;
            }

            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index('timestamp');

            const result = await new Promise((resolve, reject) => {
                const request = index.openCursor(null, 'prev');
                
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        if (cursor.value.type === 'comprehensive_enhanced') {
                            resolve(cursor.value);
                        } else {
                            cursor.continue();
                        }
                    } else {
                        resolve(null);
                    }
                };
                request.onerror = () => reject(request.error);
            });

            return result;

        } catch (error) {
            console.error('❌ Error loading existing data:', error);
            return null;
        }
    }

    /**
     * Open database
     * @param {string} dbName - Database name
     * @returns {Promise<IDBDatabase>} Database instance
     */
    openDatabase(dbName) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    /**
     * Get current buildings from village data
     * @param {Object} villageData - Complete village data
     * @returns {Object} Current buildings with levels
     */
    getCurrentBuildings(villageData) {
        if (!villageData || !villageData.data || !villageData.data.buildings) {
            return {};
        }

        const currentVillageId = villageData.villageId;
        const villageBuildings = villageData.data.buildings.villages[currentVillageId];
        
        return villageBuildings ? villageBuildings.buildings : {};
    }

    /**
     * Get current building queue from village data
     * @param {Object} villageData - Complete village data
     * @returns {Array} Current building queue
     */
    getCurrentQueue(villageData) {
        if (!villageData || !villageData.data || !villageData.data.buildings) {
            return [];
        }

        const currentVillageId = villageData.villageId;
        const villageBuildings = villageData.data.buildings.villages[currentVillageId];
        
        return villageBuildings ? villageBuildings.queue : [];
    }

    /**
     * Get current resources from village data
     * @param {Object} villageData - Complete village data
     * @returns {Object} Current resources
     */
    getCurrentResources(villageData) {
        if (!villageData || !villageData.data || !villageData.data.resources) {
            return { wood: 0, stone: 0, iron: 0 };
        }

        // Find current village in resources data
        const currentVillageId = villageData.villageId;
        const villageResources = villageData.data.resources.find(v => v.villageId === currentVillageId);
        
        return villageResources ? villageResources.resources : { wood: 0, stone: 0, iron: 0 };
    }

    /**
     * Get current population from village data
     * @param {Object} villageData - Complete village data
     * @returns {Object} Population info
     */
    getCurrentPopulation(villageData) {
        if (!villageData || !villageData.data || !villageData.data.resources) {
            return { current: 0, max: 0, available: 0 };
        }

        // Find current village in resources data
        const currentVillageId = villageData.villageId;
        const villageResources = villageData.data.resources.find(v => v.villageId === currentVillageId);
        
        return villageResources ? villageResources.population : { current: 0, max: 0, available: 0 };
    }

    /**
     * Get village info summary
     * @param {Object} villageData - Complete village data
     * @returns {Object} Village summary for easy access
     */
    getVillageSummary(villageData) {
        if (!villageData) return null;

        return {
            villageId: villageData.villageId,
            coordinates: villageData.data.coordinates,
            buildings: this.getCurrentBuildings(villageData),
            queue: this.getCurrentQueue(villageData),
            queueCount: this.getCurrentQueue(villageData).length,
            hasQueueSpace: this.getCurrentQueue(villageData).length < 5,
            resources: this.getCurrentResources(villageData),
            population: this.getCurrentPopulation(villageData),
            lastUpdated: villageData.timestamp
        };
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.EnhancedDataManager = EnhancedDataManager;
    console.log('📊 Enhanced Data Manager loaded!');
} 