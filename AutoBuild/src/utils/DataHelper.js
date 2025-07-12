/**
 * Data Helper Utility
 * Provides data processing, validation, and utility functions
 */
class DataHelper {
    
    /**
     * Validate village data structure
     * @param {object} data - Village data to validate
     * @returns {object} Validation result
     */
    static validateVillageData(data) {
        const errors = [];
        const warnings = [];
        
        // Check required fields
        if (!data.info || !data.info.id) {
            errors.push('Missing village ID');
        }
        
        if (!data.info || !data.info.name) {
            errors.push('Missing village name');
        }
        
        // Check resources
        if (data.resources) {
            const resources = data.resources;
            
            if (typeof resources.wood !== 'number') {
                warnings.push('Wood resource should be a number');
            }
            
            if (typeof resources.stone !== 'number') {
                warnings.push('Stone resource should be a number');
            }
            
            if (typeof resources.iron !== 'number') {
                warnings.push('Iron resource should be a number');
            }
            
            // Check for negative values
            if (resources.wood < 0 || resources.stone < 0 || resources.iron < 0) {
                errors.push('Resources cannot be negative');
            }
        }
        
        // Check buildings
        if (data.buildings) {
            Object.keys(data.buildings).forEach(building => {
                const level = data.buildings[building];
                if (typeof level !== 'number' || level < 0) {
                    errors.push(`Invalid level for ${building}: ${level}`);
                }
            });
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    /**
     * Clean and normalize village data
     * @param {object} data - Raw village data
     * @returns {object} Cleaned data
     */
    static cleanVillageData(data) {
        const cleaned = { ...data };
        
        // Ensure resources are numbers
        if (cleaned.resources) {
            cleaned.resources.wood = parseInt(cleaned.resources.wood) || 0;
            cleaned.resources.stone = parseInt(cleaned.resources.stone) || 0;
            cleaned.resources.iron = parseInt(cleaned.resources.iron) || 0;
            cleaned.resources.pop = parseInt(cleaned.resources.pop) || 0;
            cleaned.resources.pop_max = parseInt(cleaned.resources.pop_max) || 0;
        }
        
        // Ensure building levels are numbers
        if (cleaned.buildings) {
            Object.keys(cleaned.buildings).forEach(building => {
                cleaned.buildings[building] = parseInt(cleaned.buildings[building]) || 0;
            });
        }
        
        // Ensure queue items are valid
        if (cleaned.activeQueue) {
            cleaned.activeQueue = cleaned.activeQueue.filter(item => {
                return item.building && 
                       typeof item.target_level === 'number' && 
                       item.target_level > 0;
            });
        }
        
        return cleaned;
    }
    
    /**
     * Calculate building costs for a specific level using game formulas
     * @param {string} building - Building name
     * @param {number} level - Target level
     * @returns {object} Building costs
     */
    static calculateBuildingCosts(building, level) {
        if (!window.BuildingCostCalculator) {
            console.warn('BuildingCostCalculator not available, using fallback');
            return {
                wood: level * 100,
                stone: level * 100,
                iron: level * 100,
                pop: Math.max(1, Math.floor(level / 2))
            };
        }
        
        const [wood, stone, iron] = window.BuildingCostCalculator.getCost(building, level);
        return {
            wood: wood,
            stone: stone,
            iron: iron,
            pop: Math.max(1, Math.floor(level / 2)) // Population cost estimation
        };
    }
    
    /**
     * Calculate total costs for multiple buildings
     * @param {array} buildings - Array of building plans
     * @returns {object} Total costs
     */
    static calculateTotalCosts(buildings) {
        const total = { wood: 0, stone: 0, iron: 0, pop: 0 };
        
        buildings.forEach(plan => {
            const costs = this.calculateBuildingCosts(plan.building, plan.target_level);
            total.wood += costs.wood;
            total.stone += costs.stone;
            total.iron += costs.iron;
            total.pop += costs.pop;
        });
        
        return total;
    }
    
    /**
     * Check if village has enough resources for building
     * @param {object} villageData - Village data
     * @param {object} costs - Building costs
     * @returns {object} Resource check result
     */
    static checkResources(villageData, costs) {
        const resources = villageData.resources || {};
        const result = {
            canBuild: true,
            missing: {},
            warnings: []
        };
        
        // Check each resource
        if (resources.wood < costs.wood) {
            result.canBuild = false;
            result.missing.wood = costs.wood - resources.wood;
        }
        
        if (resources.stone < costs.stone) {
            result.canBuild = false;
            result.missing.stone = costs.stone - resources.stone;
        }
        
        if (resources.iron < costs.iron) {
            result.canBuild = false;
            result.missing.iron = costs.iron - resources.iron;
        }
        
        // Check population
        if (resources.pop && resources.pop_max) {
            const newPop = resources.pop + costs.pop;
            if (newPop > resources.pop_max) {
                result.canBuild = false;
                result.missing.pop = newPop - resources.pop_max;
            }
        }
        
        // Check storage capacity
        const maxStorage = resources.storage_max || 800;
        if (resources.wood > maxStorage * 0.9 || 
            resources.stone > maxStorage * 0.9 || 
            resources.iron > maxStorage * 0.9) {
            result.warnings.push('Storage is getting full');
        }
        
        return result;
    }
    
    /**
     * Get affordable level for a building with current resources
     * @param {string} building - Building name
     * @param {object} villageData - Village data
     * @returns {number} Highest affordable level
     */
    static getAffordableLevel(building, villageData) {
        if (!window.BuildingCostCalculator) {
            return 1; // Fallback
        }
        
        const resources = villageData.resources || {};
        const currentLevel = villageData.buildings?.[building] || 0;
        
        return window.BuildingCostCalculator.getAffordableLevel(
            building,
            resources.wood || 0,
            resources.stone || 0,
            resources.iron || 0,
            currentLevel
        );
    }
    
    /**
     * Calculate build time for a building
     * @param {string} building - Building name
     * @param {number} level - Target level
     * @param {object} villageData - Village data
     * @returns {number} Build time in seconds
     */
    static calculateBuildTime(building, level, villageData) {
        if (!window.BuildingCostCalculator) {
            return level * 60; // Fallback
        }
        
        const hqLevel = villageData.buildings?.main || 1;
        const worldSpeed = 1; // Default, could be detected from game
        
        return window.BuildingCostCalculator.getBuildTime(building, level, hqLevel, worldSpeed);
    }
    
    /**
     * Sort building plans by priority
     * @param {array} plans - Building plans
     * @param {object} priorities - Building priorities
     * @returns {array} Sorted plans
     */
    static sortPlansByPriority(plans, priorities) {
        return plans.sort((a, b) => {
            const priorityA = priorities[a.building] || 999;
            const priorityB = priorities[b.building] || 999;
            return priorityA - priorityB;
        });
    }
    
    /**
     * Filter building plans by conditions
     * @param {array} plans - Building plans
     * @param {object} conditions - Filter conditions
     * @returns {array} Filtered plans
     */
    static filterPlans(plans, conditions) {
        return plans.filter(plan => {
            // Filter by building type
            if (conditions.buildings && !conditions.buildings.includes(plan.building)) {
                return false;
            }
            
            // Filter by minimum level
            if (conditions.minLevel && plan.target_level < conditions.minLevel) {
                return false;
            }
            
            // Filter by maximum level
            if (conditions.maxLevel && plan.target_level > conditions.maxLevel) {
                return false;
            }
            
            return true;
        });
    }
    
    /**
     * Format time duration
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time
     */
    static formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }
    
    /**
     * Format resources
     * @param {number} amount - Resource amount
     * @returns {string} Formatted amount
     */
    static formatResources(amount) {
        if (amount >= 1000000) {
            return `${(amount / 1000000).toFixed(1)}M`;
        } else if (amount >= 1000) {
            return `${(amount / 1000).toFixed(1)}K`;
        } else {
            return amount.toString();
        }
    }
    
    /**
     * Deep clone object
     * @param {object} obj - Object to clone
     * @returns {object} Cloned object
     */
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    
    /**
     * Merge objects deeply
     * @param {object} target - Target object
     * @param {object} source - Source object
     * @returns {object} Merged object
     */
    static deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }
} 