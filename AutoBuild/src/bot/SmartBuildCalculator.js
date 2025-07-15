/**
 * Smart Build Calculator
 * Uses IndexedDB data to calculate optimal building timing
 */
class SmartBuildCalculator {
    constructor() {
        this.database = null;
        this.settings = null;
        this.lastCalculation = 0;
        this.calculationInterval = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Initialize the calculator
     */
    init() {
        this.database = window.AutoBuilder.getDatabase();
        this.settings = window.AutoBuilder.getSettings();
        console.log('🧠 Smart Build Calculator initialized');
    }

    /**
     * Calculate when next building should be added
     * @param {string} villageId - Village ID
     * @returns {Promise<object>} Build decision
     */
    async calculateNextBuild(villageId) {
        try {
            console.log(`🧠 Calculating next build for village ${villageId}...`);
            
            // Get comprehensive data from database
            const villageData = await this.getVillageDataFromDB(villageId);
            if (!villageData) {
                console.log('⚠️ No village data in database, need to collect first');
                return { shouldBuild: false, reason: 'no_data', nextCheck: Date.now() + 60000 };
            }

            // Get template for this village
            const templateName = this.settings.getVillageTemplate(villageId);
            if (!templateName) {
                console.log(`ℹ️ No template assigned to village ${villageId}`);
                return { shouldBuild: false, reason: 'no_template', nextCheck: Date.now() + 300000 };
            }

            // Get next building from template
            const nextBuilding = this.settings.getNextBuildingFromTemplate(templateName, villageData);
            if (!nextBuilding) {
                console.log(`ℹ️ No more buildings to build for template "${templateName}"`);
                return { shouldBuild: false, reason: 'template_complete', nextCheck: Date.now() + 600000 };
            }

            // Calculate build decision
            const decision = await this.calculateBuildDecision(villageData, nextBuilding);
            
            console.log(`🧠 Build decision: ${decision.shouldBuild ? 'BUILD' : 'WAIT'} - ${decision.reason}`);
            return decision;

        } catch (error) {
            console.error('❌ Error calculating next build:', error);
            return { shouldBuild: false, reason: 'error', nextCheck: Date.now() + 300000 };
        }
    }

    /**
     * Calculate build decision based on current data
     * @param {object} villageData - Village data from database
     * @param {object} nextBuilding - Next building to build
     * @returns {Promise<object>} Build decision
     */
    async calculateBuildDecision(villageData, nextBuilding) {
        try {
            const currentTime = Date.now();
            
            // 1. Check if already built to target level
            const currentBuildings = this.getCurrentBuildings(villageData);
            const currentLevel = currentBuildings[nextBuilding.building] || 0;
            
            if (currentLevel >= nextBuilding.target_level) {
                return { 
                    shouldBuild: false, 
                    reason: 'already_built', 
                    nextCheck: Date.now() + 600000 
                };
            }

            // 2. Check if already in queue
            const currentQueue = this.getCurrentQueue(villageData);
            const inQueue = currentQueue.some(item => 
                item.building === nextBuilding.building && 
                item.target_level === nextBuilding.target_level
            );
            
            if (inQueue) {
                return { 
                    shouldBuild: false, 
                    reason: 'already_in_queue', 
                    nextCheck: Date.now() + 300000 
                };
            }

            // 3. Calculate resource availability
            const resourceDecision = this.calculateResourceAvailability(villageData, nextBuilding);
            if (!resourceDecision.canAfford) {
                // Use dynamic checking interval instead of full wait time
                const dynamicCheckTime = this.calculateDynamicCheckTime(resourceDecision.estimatedTime);
                return {
                    shouldBuild: false,
                    reason: `insufficient_resources_${resourceDecision.missingResource}`,
                    nextCheck: dynamicCheckTime,
                    estimatedTime: resourceDecision.estimatedTime
                };
            }

            // 4. Calculate queue availability
            const queueDecision = this.calculateQueueAvailability(villageData);
            if (!queueDecision.hasSpace) {
                // Use dynamic checking interval instead of full wait time
                const dynamicCheckTime = this.calculateDynamicCheckTime(queueDecision.nextAvailableTime);
                return {
                    shouldBuild: false,
                    reason: 'queue_full',
                    nextCheck: dynamicCheckTime,
                    estimatedTime: queueDecision.nextAvailableTime
                };
            }

            // 5. All conditions met - can build!
            return {
                shouldBuild: true,
                reason: 'all_conditions_met',
                building: nextBuilding,
                nextCheck: Date.now() + 60000 // Check again in 1 minute
            };

        } catch (error) {
            console.error('❌ Error calculating build decision:', error);
            return { shouldBuild: false, reason: 'calculation_error', nextCheck: Date.now() + 300000 };
        }
    }

    /**
     * Calculate dynamic check time based on estimated wait time
     * @param {number} estimatedTime - Estimated time when conditions will be met
     * @returns {number} Next check time in milliseconds
     */
    calculateDynamicCheckTime(estimatedTime) {
        const now = Date.now();
        const waitTime = estimatedTime - now;
        
        // If wait time is less than 1 hour, check every 30 minutes
        if (waitTime <= 3600000) { // 1 hour
            return now + Math.min(waitTime / 2, 1800000); // Half the wait time or 30 minutes max
        }
        
        // If wait time is 1-6 hours, check every hour
        if (waitTime <= 21600000) { // 6 hours
            return now + Math.min(waitTime / 3, 3600000); // Third of wait time or 1 hour max
        }
        
        // If wait time is 6-24 hours, check every 2 hours
        if (waitTime <= 86400000) { // 24 hours
            return now + Math.min(waitTime / 4, 7200000); // Quarter of wait time or 2 hours max
        }
        
        // For very long waits, check every 4 hours
        return now + Math.min(waitTime / 6, 14400000); // Sixth of wait time or 4 hours max
    }

    /**
     * Calculate resource availability
     * @param {object} villageData - Village data
     * @param {object} nextBuilding - Next building to build
     * @returns {object} Resource decision
     */
    calculateResourceAvailability(villageData, nextBuilding) {
        try {
            const currentResources = this.getCurrentResources(villageData);
            const costs = DataHelper.calculateBuildingCosts(nextBuilding.building, nextBuilding.target_level);
            
            // Check if we can afford now
            if (currentResources.wood >= costs.wood && 
                currentResources.stone >= costs.stone && 
                currentResources.iron >= costs.iron) {
                return { canAfford: true };
            }

            // Calculate when we'll have enough resources
            const resourceRates = this.calculateResourceRates(villageData);
            const missingWood = Math.max(0, costs.wood - currentResources.wood);
            const missingStone = Math.max(0, costs.stone - currentResources.stone);
            const missingIron = Math.max(0, costs.iron - currentResources.iron);

            // Calculate time needed for each resource
            const woodTime = resourceRates.wood > 0 ? (missingWood / resourceRates.wood) * 3600000 : 0; // hours to ms
            const stoneTime = resourceRates.stone > 0 ? (missingStone / resourceRates.stone) * 3600000 : 0;
            const ironTime = resourceRates.iron > 0 ? (missingIron / resourceRates.iron) * 3600000 : 0;

            const maxTime = Math.max(woodTime, stoneTime, ironTime);
            const estimatedTime = Date.now() + maxTime;

            let missingResource = 'unknown';
            if (woodTime > stoneTime && woodTime > ironTime) missingResource = 'wood';
            else if (stoneTime > ironTime) missingResource = 'stone';
            else missingResource = 'iron';

            return {
                canAfford: false,
                missingResource: missingResource,
                estimatedTime: estimatedTime,
                missing: { wood: missingWood, stone: missingStone, iron: missingIron },
                rates: resourceRates
            };

        } catch (error) {
            console.error('❌ Error calculating resource availability:', error);
            return { canAfford: false, estimatedTime: Date.now() + 3600000 };
        }
    }

    /**
     * Calculate queue availability
     * @param {object} villageData - Village data
     * @returns {object} Queue decision
     */
    calculateQueueAvailability(villageData) {
        try {
            const currentQueue = this.getCurrentQueue(villageData);
            
            // Check if queue has space
            if (currentQueue.length < 5) {
                return { hasSpace: true };
            }

            // Calculate when queue will have space
            const queueEndTimes = currentQueue.map(item => {
                const completionTime = this.parseCompletionTime(item.completion);
                return completionTime ? completionTime.getTime() : Date.now() + 3600000;
            });

            const nextAvailableTime = Math.min(...queueEndTimes);
            
            return {
                hasSpace: false,
                nextAvailableTime: nextAvailableTime,
                queueLength: currentQueue.length
            };

        } catch (error) {
            console.error('❌ Error calculating queue availability:', error);
            return { hasSpace: true };
        }
    }

    /**
     * Calculate resource production rates
     * @param {object} villageData - Village data
     * @returns {object} Resource rates per hour
     */
    calculateResourceRates(villageData) {
        try {
            const buildings = this.getCurrentBuildings(villageData);
            
            // Calculate production rates based on building levels
            const woodRate = this.calculateWoodRate(buildings.wood || 0);
            const stoneRate = this.calculateStoneRate(buildings.stone || 0);
            const ironRate = this.calculateIronRate(buildings.iron || 0);
            
            return {
                wood: woodRate,
                stone: stoneRate,
                iron: ironRate
            };

        } catch (error) {
            console.error('❌ Error calculating resource rates:', error);
            return { wood: 10, stone: 10, iron: 10 }; // Default rates
        }
    }

    /**
     * Calculate wood production rate
     * @param {number} level - Wood building level
     * @returns {number} Wood per hour
     */
    calculateWoodRate(level) {
        // Basic calculation - can be enhanced with actual game formulas
        return level * 10 + 5;
    }

    /**
     * Calculate stone production rate
     * @param {number} level - Stone building level
     * @returns {number} Stone per hour
     */
    calculateStoneRate(level) {
        return level * 10 + 5;
    }

    /**
     * Calculate iron production rate
     * @param {number} level - Iron building level
     * @returns {number} Iron per hour
     */
    calculateIronRate(level) {
        return level * 10 + 5;
    }

    /**
     * Parse completion time from queue item
     * @param {string} completionText - Completion time text
     * @returns {Date|null} Completion time
     */
    parseCompletionTime(completionText) {
        try {
            if (!completionText) return null;
            
            // Handle different time formats
            if (completionText.includes('today')) {
                const timeMatch = completionText.match(/(\d{1,2}):(\d{2})/);
                if (timeMatch) {
                    const now = new Date();
                    const hours = parseInt(timeMatch[1]);
                    const minutes = parseInt(timeMatch[2]);
                    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
                }
            }
            
            if (completionText.includes('tomorrow')) {
                const timeMatch = completionText.match(/(\d{1,2}):(\d{2})/);
                if (timeMatch) {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const hours = parseInt(timeMatch[1]);
                    const minutes = parseInt(timeMatch[2]);
                    return new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), hours, minutes);
                }
            }
            
            return null;
        } catch (error) {
            console.error('❌ Error parsing completion time:', error);
            return null;
        }
    }

    /**
     * Get village data from database
     * @param {string} villageId - Village ID
     * @returns {Promise<object>} Village data
     */
    async getVillageDataFromDB(villageId) {
        try {
            // Try to get from comprehensive integration first
            const integration = window.AutoBuilder.getComprehensiveIntegration();
            if (integration) {
                const data = await integration.loadLatestData(villageId);
                if (data) return data.data;
            }
            
            // Fallback to basic database
            return this.database.getVillage('villages', villageId);
            
        } catch (error) {
            console.error('❌ Error getting village data from DB:', error);
            return null;
        }
    }

    /**
     * Get current buildings from village data
     * @param {object} villageData - Village data
     * @returns {object} Current buildings
     */
    getCurrentBuildings(villageData) {
        if (!villageData || !villageData.buildings || !villageData.buildings.villages) {
            return {};
        }
        
        const villageId = villageData.villageId;
        const villageBuildings = villageData.buildings.villages[villageId];
        
        return villageBuildings ? villageBuildings.buildings : {};
    }

    /**
     * Get current queue from village data
     * @param {object} villageData - Village data
     * @returns {array} Current queue
     */
    getCurrentQueue(villageData) {
        if (!villageData || !villageData.buildings || !villageData.buildings.villages) {
            return [];
        }
        
        const villageId = villageData.villageId;
        const villageBuildings = villageData.buildings.villages[villageId];
        
        return villageBuildings ? villageBuildings.queue : [];
    }

    /**
     * Get current resources from village data
     * @param {object} villageData - Village data
     * @returns {object} Current resources
     */
    getCurrentResources(villageData) {
        if (!villageData || !villageData.resources || !villageData.resources.length) {
            return { wood: 0, stone: 0, iron: 0 };
        }
        
        // Find current village in resources data
        const villageId = villageData.villageId;
        const villageResources = villageData.resources.find(v => v.villageId == villageId);
        
        return villageResources ? villageResources.resources : { wood: 0, stone: 0, iron: 0 };
    }

    /**
     * Get calculator status
     * @returns {object} Status information
     */
    getStatus() {
        return {
            lastCalculation: this.lastCalculation,
            calculationInterval: this.calculationInterval,
            timeSinceLastCalculation: Date.now() - this.lastCalculation
        };
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartBuildCalculator;
}

// Auto-initialize if run directly
if (typeof window !== 'undefined') {
    window.SmartBuildCalculator = SmartBuildCalculator;
    console.log('🧠 Smart Build Calculator loaded!');
} 