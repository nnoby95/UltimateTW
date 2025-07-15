/**
 * Comprehensive Integration
 * Combines comprehensive data collection with building queue logic
 */
class ComprehensiveIntegration {
    constructor() {
        this.comprehensiveCollector = null;
        this.buildingQueueLogic = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the integration
     */
    async init() {
        try {
            console.log('🔧 Initializing Comprehensive Integration...');
            
            // Initialize comprehensive data collector
            this.comprehensiveCollector = {
                collectVillageData: window.collectComprehensiveData || this.fallbackCollector,
                loadLatestData: window.loadComprehensiveData || this.fallbackLoader,
                cleanupData: window.cleanupComprehensiveData || this.fallbackCleanup
            };
            
            // Initialize building queue logic
            if (typeof window.TribalWarsBuildingQueueLogic === 'function') {
                this.buildingQueueLogic = new window.TribalWarsBuildingQueueLogic();
                console.log('✅ Building queue logic initialized');
            } else {
                console.warn('⚠️ Building queue logic not available');
            }
            
            this.isInitialized = true;
            console.log('✅ Comprehensive Integration initialized successfully!');
            
        } catch (error) {
            console.error('❌ Error initializing Comprehensive Integration:', error);
        }
    }

    /**
     * Collect comprehensive data for a village
     * @param {string} villageId - Village ID
     * @returns {Promise<object>} Comprehensive village data
     */
    async collectVillageData(villageId) {
        if (!this.isInitialized) {
            await this.init();
        }
        
        try {
            console.log(`🔍 Collecting comprehensive data for village ${villageId}...`);
            
            if (typeof this.comprehensiveCollector.collectVillageData === 'function') {
                const data = await this.comprehensiveCollector.collectVillageData(villageId);
                if (data) {
                    console.log('✅ Comprehensive data collected successfully!');
                    return data;
                }
            }
            
            // Fallback to basic collection
            console.log('🔄 Using fallback data collector...');
            return await this.fallbackCollector(villageId);
            
        } catch (error) {
            console.error('❌ Error collecting comprehensive data:', error);
            return null;
        }
    }

    /**
     * Add building to queue using enhanced logic
     * @param {string} villageId - Village ID
     * @param {string} buildingId - Building ID
     * @returns {Promise<boolean>} Success status
     */
    async addBuildingToQueue(villageId, buildingId) {
        if (!this.isInitialized) {
            await this.init();
        }
        
        try {
            console.log(`🏗️ Adding ${buildingId} to queue in village ${villageId}...`);
            
            if (this.buildingQueueLogic) {
                const success = await this.buildingQueueLogic.addBuildingToQueue(villageId, buildingId);
                if (success) {
                    console.log(`✅ Successfully added ${buildingId} to queue!`);
                } else {
                    console.log(`❌ Failed to add ${buildingId} to queue`);
                }
                return success;
            } else {
                console.warn('⚠️ Building queue logic not available');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Error adding building to queue:', error);
            return false;
        }
    }

    /**
     * Get current queue status
     * @param {string} villageId - Village ID
     * @returns {Promise<object>} Queue status
     */
    async getQueueStatus(villageId) {
        if (!this.isInitialized) {
            await this.init();
        }
        
        try {
            if (this.buildingQueueLogic) {
                return await this.buildingQueueLogic.getQueueStatus(villageId);
            } else {
                return { count: 0, maxCapacity: 5, hasSpace: true, items: [] };
            }
        } catch (error) {
            console.error('❌ Error getting queue status:', error);
            return { count: 0, maxCapacity: 5, hasSpace: true, items: [] };
        }
    }

    /**
     * Check if queue has space
     * @param {string} villageId - Village ID
     * @returns {Promise<boolean>} Has space
     */
    async hasQueueSpace(villageId) {
        if (!this.isInitialized) {
            await this.init();
        }
        
        try {
            if (this.buildingQueueLogic) {
                return await this.buildingQueueLogic.hasQueueSpace(villageId);
            } else {
                return true; // Assume has space if logic not available
            }
        } catch (error) {
            console.error('❌ Error checking queue space:', error);
            return false;
        }
    }

    /**
     * Remove building from queue
     * @param {string} villageId - Village ID
     * @param {string} cancelId - Cancel ID
     * @returns {Promise<boolean>} Success status
     */
    async removeBuildingFromQueue(villageId, cancelId) {
        if (!this.isInitialized) {
            await this.init();
        }
        
        try {
            if (this.buildingQueueLogic) {
                return await this.buildingQueueLogic.removeBuildingFromQueue(villageId, cancelId);
            } else {
                console.warn('⚠️ Building queue logic not available');
                return false;
            }
        } catch (error) {
            console.error('❌ Error removing building from queue:', error);
            return false;
        }
    }

    /**
     * Get building ID mapping
     * @param {string} buildingName - Building name
     * @returns {string} Building ID
     */
    getBuildingId(buildingName) {
        const buildingMap = {
            'main': 'main',
            'barracks': 'barracks',
            'stable': 'stable',
            'garage': 'garage',
            'watchtower': 'watchtower',
            'snob': 'snob',
            'smith': 'smith',
            'place': 'place',
            'market': 'market',
            'wood': 'wood',
            'stone': 'stone',
            'iron': 'iron',
            'farm': 'farm',
            'storage': 'storage',
            'hide': 'hide',
            'wall': 'wall'
        };
        
        return buildingMap[buildingName] || buildingName;
    }

    /**
     * Fallback data collector
     * @param {string} villageId - Village ID
     * @returns {Promise<object>} Basic village data
     */
    async fallbackCollector(villageId) {
        console.log('🔄 Using fallback data collector...');
        
        try {
            // Use the existing DataCollector if available
            if (typeof DataCollector !== 'undefined' && DataCollector.collectAllData) {
                const data = await DataCollector.collectAllData();
                
                // Transform to comprehensive format
                return {
                    villageId: villageId,
                    villageName: game_data.village.name,
                    coordinates: game_data.village.x + '|' + game_data.village.y,
                    worldId: game_data.world,
                    playerId: game_data.player.id,
                    
                    // Transform existing data
                    troops: this.extractTroopsFromData(data),
                    resources: this.extractResourcesFromData(data),
                    buildings: this.extractBuildingsFromData(data),
                    
                    // Metadata
                    extractedAt: new Date().toISOString(),
                    serverTime: new Date().toISOString(),
                    dataVersion: '1.0-fallback'
                };
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Fallback collector failed:', error);
            return null;
        }
    }

    /**
     * Fallback data loader
     * @param {string} villageId - Village ID
     * @returns {Promise<object>} Loaded data
     */
    async fallbackLoader(villageId) {
        console.log('🔄 Using fallback data loader...');
        
        try {
            // Try to get data from database
            const database = window.AutoBuilder?.getDatabase();
            if (database) {
                const villageData = database.getVillage('villages', villageId);
                if (villageData) {
                    return {
                        type: 'comprehensive',
                        timestamp: new Date().toISOString(),
                        villageId: villageId,
                        data: villageData
                    };
                }
            }
            
            return null;
        } catch (error) {
            console.error('❌ Fallback loader failed:', error);
            return null;
        }
    }

    /**
     * Fallback cleanup function
     * @param {string} villageId - Village ID
     * @returns {Promise<number>} Number of records cleaned
     */
    async fallbackCleanup(villageId) {
        console.log('🔄 Using fallback cleanup...');
        
        try {
            const database = window.AutoBuilder?.getDatabase();
            if (database) {
                // Clear village data
                database.updateVillage('villages', villageId, null);
                database.updateVillage('queue', villageId, []);
                return 2; // Assume 2 records cleaned
            }
            return 0;
        } catch (error) {
            console.error('❌ Fallback cleanup failed:', error);
            return 0;
        }
    }

    /**
     * Extract troops data from basic data
     * @param {object} data - Basic village data
     * @returns {object} Troops data
     */
    extractTroopsFromData(data) {
        // This would need to be implemented based on available data
        // For now, return empty troops object
        return {
            spear: 0,
            sword: 0,
            axe: 0,
            spy: 0,
            light: 0,
            heavy: 0,
            ram: 0,
            catapult: 0,
            snob: 0,
            militia: 0
        };
    }

    /**
     * Extract resources data from basic data
     * @param {object} data - Basic village data
     * @returns {array} Resources data
     */
    extractResourcesFromData(data) {
        if (!data || !data.resources) {
            return [];
        }

        const resources = data.resources;
        return [{
            villageId: data.info?.id,
            name: data.info?.name || 'Unknown',
            coordinates: data.info?.coords || 'Unknown',
            points: 0,
            resources: {
                wood: resources.wood || 0,
                stone: resources.stone || 0,
                iron: resources.iron || 0,
                total: (resources.wood || 0) + (resources.stone || 0) + (resources.iron || 0)
            },
            warehouse: {
                capacity: resources.storage_max || 0,
                usage: Math.max(resources.wood || 0, resources.stone || 0, resources.iron || 0),
                usagePercent: 0
            },
            population: {
                current: resources.pop || 0,
                max: resources.pop_max || 0,
                available: (resources.pop_max || 0) - (resources.pop || 0),
                usagePercent: 0
            }
        }];
    }

    /**
     * Extract buildings data from basic data
     * @param {object} data - Basic village data
     * @returns {object} Buildings data
     */
    extractBuildingsFromData(data) {
        if (!data || !data.buildings) {
            return { villages: {}, totalVillages: 0, extractedAt: new Date().toISOString() };
        }

        const buildings = data.buildings;
        const villageId = data.info?.id;
        
        return {
            villages: {
                [villageId]: {
                    villageId: villageId,
                    villageInfo: {
                        name: data.info?.name || 'Unknown',
                        coordinates: data.info?.coords || 'Unknown',
                        continent: 'Unknown',
                        points: 0
                    },
                    buildings: buildings,
                    queue: data.activeQueue || [],
                    queueLength: (data.activeQueue || []).length
                }
            },
            totalVillages: 1,
            extractedAt: new Date().toISOString()
        };
    }

    /**
     * Get status of comprehensive integration
     * @returns {object} Status information
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            comprehensiveCollector: !!this.comprehensiveCollector,
            buildingQueueLogic: !!this.buildingQueueLogic,
            availableFunctions: {
                collectVillageData: typeof this.comprehensiveCollector?.collectVillageData === 'function',
                addBuildingToQueue: !!this.buildingQueueLogic,
                getQueueStatus: !!this.buildingQueueLogic,
                hasQueueSpace: !!this.buildingQueueLogic
            }
        };
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComprehensiveIntegration;
}

// Auto-initialize if run directly
if (typeof window !== 'undefined') {
    window.ComprehensiveIntegration = ComprehensiveIntegration;
    console.log('🔧 Comprehensive Integration loaded!');
} 