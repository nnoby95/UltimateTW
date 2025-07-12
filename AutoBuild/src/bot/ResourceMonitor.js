/**
 * Resource Monitor
 * Collects resource data when page loads (no frequent monitoring)
 */
class ResourceMonitor {
    constructor() {
        this.settings = null;
        this.database = null;
    }
    
    /**
     * Initialize the monitor
     */
    init() {
        this.settings = window.AutoBuilder.getSettings();
        this.database = window.AutoBuilder.getDatabase();
        console.log('📊 Resource Monitor initialized');
    }
    
    /**
     * Start monitoring (only collect data when page loads)
     */
    start() {
        console.log('📊 Resource Monitor started - will collect data on page load');
    }
    
    /**
     * Stop monitoring
     */
    stop() {
        console.log('🛑 Resource Monitor stopped!');
    }
    
    /**
     * Collect resources when page loads
     * @param {string} villageId - Village ID
     */
    async collectResources(villageId) {
        try {
            const villageData = this.database.getVillage('villages', villageId);
            if (villageData && villageData.resources) {
                this.updateResourceData(villageId, villageData.resources);
                console.log('📊 Resources collected and saved');
            }
        } catch (error) {
            console.error('❌ Error collecting resources:', error);
        }
    }
    
    /**
     * Update resource data in database
     * @param {string} villageId - Village ID
     * @param {object} resources - Resources data
     */
    updateResourceData(villageId, resources) {
        this.database.updateVillage('resources', villageId, {
            ...resources,
            lastUpdated: Date.now()
        });
    }
    
    /**
     * Get resource status
     * @param {string} villageId - Village ID
     * @returns {object|null} Resource status
     */
    getResourceStatus(villageId) {
        const resources = this.database.getVillage('resources', villageId);
        if (!resources) {
            return null;
        }
        
        const status = {
            wood: { current: resources.wood || 0, max: resources.storage_max || 0 },
            stone: { current: resources.stone || 0, max: resources.storage_max || 0 },
            iron: { current: resources.iron || 0, max: resources.storage_max || 0 },
            population: { current: resources.pop || 0, max: resources.pop_max || 0 }
        };
        
        // Calculate percentages
        Object.keys(status).forEach(resource => {
            if (status[resource].max > 0) {
                status[resource].percent = Math.round((status[resource].current / status[resource].max) * 100);
            } else {
                status[resource].percent = 0;
            }
        });
        
        return status;
    }
    
    /**
     * Get monitor status
     */
    getStatus() {
        return {
            isRunning: true,
            settings: {
                enabled: true,
                mode: 'passive_collection'
            }
        };
    }
} 