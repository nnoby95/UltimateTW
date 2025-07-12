/**
 * Pure Building Cost Calculator - No Dependencies
 * Contains all building data and calculation logic
 */

const BuildingCostCalculator = {
    
    // Building configuration data
    buildingData: {
        "main": {
            max_level: 30, wood: 90, stone: 80, iron: 70,
            wood_factor: 1.26, stone_factor: 1.275, iron_factor: 1.26,
            build_time: 900, build_time_factor: 1.2,
            pop: 5, pop_factor: 1.17
        },
        "barracks": {
            max_level: 25, wood: 200, stone: 170, iron: 90,
            wood_factor: 1.26, stone_factor: 1.28, iron_factor: 1.26,
            build_time: 1800, build_time_factor: 1.2,
            pop: 7, pop_factor: 1.17
        },
        "stable": {
            max_level: 20, wood: 270, stone: 240, iron: 260,
            wood_factor: 1.26, stone_factor: 1.28, iron_factor: 1.26,
            build_time: 6000, build_time_factor: 1.2,
            pop: 8, pop_factor: 1.17
        },
        "garage": {
            max_level: 15, wood: 300, stone: 240, iron: 260,
            wood_factor: 1.26, stone_factor: 1.28, iron_factor: 1.26,
            build_time: 6000, build_time_factor: 1.2,
            pop: 8, pop_factor: 1.17
        },
        "church": {
            max_level: 3, wood: 16000, stone: 20000, iron: 5000,
            wood_factor: 1.26, stone_factor: 1.28, iron_factor: 1.26,
            build_time: 184980, build_time_factor: 1.2,
            pop: 5000, pop_factor: 1.55
        },
        "watchtower": {
            max_level: 20, wood: 12000, stone: 14000, iron: 10000,
            wood_factor: 1.17, stone_factor: 1.17, iron_factor: 1.18,
            build_time: 13200, build_time_factor: 1.2,
            pop: 500, pop_factor: 1.18
        },
        "snob": {
            max_level: 1, wood: 15000, stone: 25000, iron: 10000,
            wood_factor: 2, stone_factor: 2, iron_factor: 2,
            build_time: 586800, build_time_factor: 1.2,
            pop: 80, pop_factor: 1.17
        },
        "smith": {
            max_level: 20, wood: 220, stone: 180, iron: 240,
            wood_factor: 1.26, stone_factor: 1.275, iron_factor: 1.26,
            build_time: 6000, build_time_factor: 1.2,
            pop: 20, pop_factor: 1.17
        },
        "place": {
            max_level: 1, wood: 10, stone: 40, iron: 30,
            wood_factor: 1.26, stone_factor: 1.275, iron_factor: 1.26,
            build_time: 10860, build_time_factor: 1.2,
            pop: 0, pop_factor: 1.17
        },
        "statue": {
            max_level: 1, wood: 220, stone: 220, iron: 220,
            wood_factor: 1.26, stone_factor: 1.275, iron_factor: 1.26,
            build_time: 1500, build_time_factor: 1.2,
            pop: 10, pop_factor: 1.17
        },
        "market": {
            max_level: 25, wood: 100, stone: 100, iron: 100,
            wood_factor: 1.26, stone_factor: 1.275, iron_factor: 1.26,
            build_time: 2700, build_time_factor: 1.2,
            pop: 20, pop_factor: 1.17
        },
        "wood": {
            max_level: 30, wood: 50, stone: 60, iron: 40,
            wood_factor: 1.25, stone_factor: 1.275, iron_factor: 1.245,
            build_time: 900, build_time_factor: 1.2,
            pop: 5, pop_factor: 1.155
        },
        "stone": {
            max_level: 30, wood: 65, stone: 50, iron: 40,
            wood_factor: 1.27, stone_factor: 1.265, iron_factor: 1.24,
            build_time: 900, build_time_factor: 1.2,
            pop: 10, pop_factor: 1.14
        },
        "iron": {
            max_level: 30, wood: 75, stone: 65, iron: 70,
            wood_factor: 1.252, stone_factor: 1.275, iron_factor: 1.24,
            build_time: 1080, build_time_factor: 1.2,
            pop: 10, pop_factor: 1.17
        },
        "farm": {
            max_level: 30, wood: 45, stone: 40, iron: 30,
            wood_factor: 1.3, stone_factor: 1.32, iron_factor: 1.29,
            build_time: 1200, build_time_factor: 1.2,
            pop: 0, pop_factor: 1
        },
        "storage": {
            max_level: 30, wood: 60, stone: 50, iron: 40,
            wood_factor: 1.265, stone_factor: 1.27, iron_factor: 1.245,
            build_time: 1020, build_time_factor: 1.2,
            pop: 0, pop_factor: 1.15
        },
        "hide": {
            max_level: 10, wood: 50, stone: 60, iron: 50,
            wood_factor: 1.25, stone_factor: 1.25, iron_factor: 1.25,
            build_time: 1800, build_time_factor: 1.2,
            pop: 2, pop_factor: 1.17
        },
        "wall": {
            max_level: 20, wood: 50, stone: 100, iron: 20,
            wood_factor: 1.26, stone_factor: 1.275, iron_factor: 1.26,
            build_time: 3600, build_time_factor: 1.2,
            pop: 5, pop_factor: 1.17
        }
    },

    /**
     * Calculate total population used by building at specific level
     * @param {string} building - Building type
     * @param {number} level - Building level
     * @returns {number} Total population used by this building level
     */
    getTotalPopulationAtLevel: function(building, level) {
        const data = this.buildingData[building];
        if (!data || level < 1) return 0;
        
        // Formula: basePop * (popFactor^(level-1))
        return Math.round(data.pop * Math.pow(data.pop_factor, level - 1));
    },

    /**
     * Calculate additional population needed for upgrade (what game shows)
     * @param {string} building - Building type
     * @param {number} fromLevel - Current level
     * @param {number} toLevel - Target level (default: fromLevel + 1)
     * @returns {number} Additional population needed for upgrade
     */
    getPopulationForUpgrade: function(building, fromLevel, toLevel = null) {
        if (toLevel === null) toLevel = fromLevel + 1;
        return this.getTotalPopulationAtLevel(building, toLevel) - this.getTotalPopulationAtLevel(building, fromLevel);
    },

    /**
     * Get upgrade population cost (single level up)
     * @param {string} building - Building type  
     * @param {number} currentLevel - Current building level
     * @returns {number} Population needed for next level upgrade
     */
    getUpgradePopulation: function(building, currentLevel) {
        return this.getPopulationForUpgrade(building, currentLevel, currentLevel + 1);
    },

    /**
     * Calculate total population used by all buildings in village
     * @param {object} buildings - {building: level, ...}
     * @returns {number} Total population used by entire village
     */
    getVillageTotalPopulation: function(buildings) {
        let totalPop = 0;
        for (const [building, level] of Object.entries(buildings)) {
            totalPop += this.getTotalPopulationAtLevel(building, level);
        }
        return totalPop;
    },

    /**
     * Get farm capacity for specific level
     * @param {number} level - Farm level
     * @returns {number} Population capacity
     */
    getFarmCapacity: function(level) {
        // Pre-calculated farm capacity values
        const farmCapacities = [
            0, 240, 281, 330, 386, 453, 531, 622, 729, 855, 1002, 
            1175, 1377, 1614, 1891, 2217, 2598, 3046, 3570, 4184, 4904, 
            5748, 6737, 7897, 9256, 10849, 12716, 14904, 17470, 20476, 24000
        ];
        return farmCapacities[level] || 0;
    },

    /**
     * Check if village has enough population for upgrade
     * @param {string} building - Building type
     * @param {number} targetLevel - Target level
     * @param {object} currentBuildings - Current building levels {building: level, ...}
     * @returns {object} Population analysis for upgrade
     */
    checkUpgradePopulation: function(building, targetLevel, currentBuildings) {
        const currentLevel = currentBuildings[building] || 0;
        const popNeeded = this.getPopulationForUpgrade(building, currentLevel, targetLevel);
        const currentVillagePopulation = this.getVillageTotalPopulation(currentBuildings);
        const farmLevel = currentBuildings.farm || 1;
        const farmCapacity = this.getFarmCapacity(farmLevel);
        
        return {
            canAfford: (currentVillagePopulation + popNeeded) <= farmCapacity,
            currentVillagePopulation: currentVillagePopulation,
            upgradePopulationNeeded: popNeeded,
            farmCapacity: farmCapacity,
            availablePopulation: farmCapacity - currentVillagePopulation,
            afterUpgradePopulation: currentVillagePopulation + popNeeded
        };
    },

    /**
     * Get upgrade costs and population (what you see in game)
     * @param {string} building - Building type
     * @param {number} currentLevel - Current building level
     * @returns {object} Complete upgrade information
     */
    getUpgradeInfo: function(building, currentLevel) {
        const targetLevel = currentLevel + 1;
        const maxLevel = this.getMaxLevel(building);
        
        if (currentLevel >= maxLevel) {
            return {
                canUpgrade: false,
                reason: 'Already at maximum level',
                maxLevel: maxLevel
            };
        }
        
        const [wood, stone, iron] = this.getCost(building, targetLevel);
        const totalCost = wood + stone + iron;
        const populationNeeded = this.getUpgradePopulation(building, currentLevel);
        
        return {
            canUpgrade: true,
            fromLevel: currentLevel,
            toLevel: targetLevel,
            costs: {
                wood: wood,
                stone: stone,
                iron: iron,
                total: totalCost
            },
            populationNeeded: populationNeeded,
            maxLevel: maxLevel
        };
    },

    /**
     * Calculate resource costs for building level
     * @param {string} building - Building type
     * @param {number} level - Target level
     * @param {string} resource - 'wood', 'stone', 'iron', or null for all
     * @returns {number|array} Cost for resource or [wood, stone, iron]
     */
    getCost: function(building, level, resource = null) {
        const data = this.buildingData[building];
        if (!data) return resource ? 0 : [0, 0, 0];
        
        if (level < 1 || level > data.max_level) {
            return resource ? 0 : [0, 0, 0];
        }

        if (resource) {
            const baseCost = data[resource];
            const factor = data[resource + '_factor'];
            return Math.round(baseCost * Math.pow(factor, level - 1));
        } else {
            return [
                this.getCost(building, level, 'wood'),
                this.getCost(building, level, 'stone'),
                this.getCost(building, level, 'iron')
            ];
        }
    },

    /**
     * Get total cost (wood + stone + iron)
     * @param {string} building - Building type
     * @param {number} level - Target level
     * @returns {number} Sum of all costs
     */
    getTotalCost: function(building, level) {
        const [wood, stone, iron] = this.getCost(building, level);
        return wood + stone + iron;
    },

    /**
     * Calculate build time
     * @param {string} building - Building type
     * @param {number} level - Target level
     * @param {number} hqLevel - Headquarters level
     * @param {number} worldSpeed - World speed multiplier (default 1)
     * @returns {number} Build time in seconds
     */
    getBuildTime: function(building, level, hqLevel = 1, worldSpeed = 1) {
        const data = this.buildingData[building];
        if (!data) return 0;

        // HQ time reduction factor: 1.05^(-hq_level)
        const hqFactor = Math.pow(1.05, -hqLevel);
        
        // Level time multipliers (game constants)
        const levelMultipliers = [
            0.076531875, 0.008575, 0.1611688357125, 0.49997092217822, 0.95648692484371,
            1.507915906133, 2.1583894342689, 2.9234350042923, 3.8258560762261, 4.8929653630626,
            6.1578892138254, 7.6590657112219, 9.4433064708667, 11.564692858728, 14.087747339219,
            17.087827532738, 20.656815089182, 24.899818499248, 29.943903177098, 35.937391973395,
            43.057125537371, 51.513283593952, 61.553558650789, 73.469813455449, 87.609924818161,
            104.38073172038, 124.27318094664, 147.85747137631, 175.8153675657, 208.94719428012
        ];
        
        const baseTime = data.build_time / worldSpeed;
        const levelMultiplier = levelMultipliers[level - 1] || 1;
        
        return Math.round(hqFactor * baseTime * levelMultiplier);
    },

    /**
     * Get maximum level for building
     * @param {string} building - Building type
     * @returns {number} Maximum level
     */
    getMaxLevel: function(building) {
        return this.buildingData[building]?.max_level || 1;
    },

    /**
     * Check if building exists
     * @param {string} building - Building type
     * @returns {boolean} True if building exists
     */
    isValidBuilding: function(building) {
        return building in this.buildingData;
    },

    /**
     * Get all available buildings
     * @returns {array} Array of building names
     */
    getAllBuildings: function() {
        return Object.keys(this.buildingData);
    },

    /**
     * Calculate costs for multiple levels
     * @param {string} building - Building type
     * @param {number} fromLevel - Starting level
     * @param {number} toLevel - Target level
     * @returns {object} Breakdown of costs per level and totals
     */
    getCostRange: function(building, fromLevel, toLevel) {
        const costs = [];
        let totalWood = 0, totalStone = 0, totalIron = 0;

        for (let level = fromLevel + 1; level <= toLevel; level++) {
            const [wood, stone, iron] = this.getCost(building, level);
            costs.push({ level, wood, stone, iron });
            totalWood += wood;
            totalStone += stone;
            totalIron += iron;
        }

        return {
            levels: costs,
            totals: { wood: totalWood, stone: totalStone, iron: totalIron },
            sum: totalWood + totalStone + totalIron
        };
    },

    /**
     * Find affordable level with given resources
     * @param {string} building - Building type
     * @param {number} wood - Available wood
     * @param {number} stone - Available stone
     * @param {number} iron - Available iron
     * @param {number} currentLevel - Current building level
     * @returns {number} Highest affordable level
     */
    getAffordableLevel: function(building, wood, stone, iron, currentLevel = 0) {
        const maxLevel = this.getMaxLevel(building);
        
        for (let level = currentLevel + 1; level <= maxLevel; level++) {
            const [reqWood, reqStone, reqIron] = this.getCost(building, level);
            if (wood < reqWood || stone < reqStone || iron < reqIron) {
                return level - 1;
            }
        }
        
        return maxLevel;
    },

    /**
     * Check if upgrade is possible considering both resources and population
     * @param {string} building - Building type
     * @param {number} targetLevel - Target level
     * @param {object} currentBuildings - Current building levels
     * @param {object} availableResources - Available resources {wood, stone, iron}
     * @returns {object} Complete upgrade feasibility analysis
     */
    canUpgrade: function(building, targetLevel, currentBuildings, availableResources) {
        const currentLevel = currentBuildings[building] || 0;
        const maxLevel = this.getMaxLevel(building);
        
        // Check if already at max level
        if (currentLevel >= maxLevel) {
            return {
                canUpgrade: false,
                reason: 'Already at maximum level',
                maxLevel: maxLevel
            };
        }
        
        // Check if target level is valid
        if (targetLevel > maxLevel) {
            return {
                canUpgrade: false,
                reason: 'Target level exceeds maximum',
                maxLevel: maxLevel
            };
        }
        
        // Get resource costs
        const [wood, stone, iron] = this.getCost(building, targetLevel);
        
        // Check resource availability
        const hasResources = availableResources.wood >= wood && 
                           availableResources.stone >= stone && 
                           availableResources.iron >= iron;
        
        // Check population availability
        const popCheck = this.checkUpgradePopulation(building, targetLevel, currentBuildings);
        
        return {
            canUpgrade: hasResources && popCheck.canAfford,
            resourceCheck: {
                hasResources: hasResources,
                required: { wood, stone, iron },
                available: availableResources,
                missing: {
                    wood: Math.max(0, wood - availableResources.wood),
                    stone: Math.max(0, stone - availableResources.stone),
                    iron: Math.max(0, iron - availableResources.iron)
                }
            },
            populationCheck: popCheck,
            reason: !hasResources ? 'Insufficient resources' : 
                   !popCheck.canAfford ? 'Insufficient population' : 
                   'Can upgrade'
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BuildingCostCalculator;
} else if (typeof window !== 'undefined') {
    window.BuildingCostCalculator = BuildingCostCalculator;
} 