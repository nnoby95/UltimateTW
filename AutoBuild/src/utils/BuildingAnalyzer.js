/**
 * Building Analyzer for AutoBuild
 * Checks building requirements, costs, and build feasibility
 * Simple and focused logic for building decisions
 */
class BuildingAnalyzer {
    constructor() {
        this.buildingCosts = this.getBuildingCosts();
        this.buildingRequirements = this.getBuildingRequirements();
    }

    /**
     * Get building costs for each level
     * @returns {Object} Building costs data
     */
    getBuildingCosts() {
        // Simplified building costs based on TribalWars formulas
        return {
            main: (level) => ({
                wood: Math.floor(90 * Math.pow(1.26, level - 1)),
                stone: Math.floor(80 * Math.pow(1.26, level - 1)),
                iron: Math.floor(70 * Math.pow(1.26, level - 1)),
                population: Math.floor(5 * Math.pow(1.17, level - 1))
            }),
            
            barracks: (level) => ({
                wood: Math.floor(200 * Math.pow(1.26, level - 1)),
                stone: Math.floor(170 * Math.pow(1.26, level - 1)),
                iron: Math.floor(90 * Math.pow(1.26, level - 1)),
                population: Math.floor(7 * Math.pow(1.17, level - 1))
            }),
            
            stable: (level) => ({
                wood: Math.floor(270 * Math.pow(1.26, level - 1)),
                stone: Math.floor(240 * Math.pow(1.26, level - 1)),
                iron: Math.floor(260 * Math.pow(1.26, level - 1)),
                population: Math.floor(8 * Math.pow(1.17, level - 1))
            }),
            
            garage: (level) => ({
                wood: Math.floor(300 * Math.pow(1.26, level - 1)),
                stone: Math.floor(240 * Math.pow(1.26, level - 1)),
                iron: Math.floor(260 * Math.pow(1.26, level - 1)),
                population: Math.floor(8 * Math.pow(1.17, level - 1))
            }),
            
            watchtower: (level) => ({
                wood: Math.floor(700 * Math.pow(1.26, level - 1)),
                stone: Math.floor(840 * Math.pow(1.26, level - 1)),
                iron: Math.floor(600 * Math.pow(1.26, level - 1)),
                population: Math.floor(5 * Math.pow(1.17, level - 1))
            }),
            
            snob: (level) => ({
                wood: Math.floor(15000 * Math.pow(1.26, level - 1)),
                stone: Math.floor(25000 * Math.pow(1.26, level - 1)),
                iron: Math.floor(10000 * Math.pow(1.26, level - 1)),
                population: Math.floor(80 * Math.pow(1.17, level - 1))
            }),
            
            smith: (level) => ({
                wood: Math.floor(220 * Math.pow(1.26, level - 1)),
                stone: Math.floor(180 * Math.pow(1.26, level - 1)),
                iron: Math.floor(240 * Math.pow(1.26, level - 1)),
                population: Math.floor(7 * Math.pow(1.17, level - 1))
            }),
            
            place: (level) => ({
                wood: Math.floor(110 * Math.pow(1.26, level - 1)),
                stone: Math.floor(160 * Math.pow(1.26, level - 1)),
                iron: Math.floor(90 * Math.pow(1.26, level - 1)),
                population: Math.floor(1 * Math.pow(1.17, level - 1))
            }),
            
            market: (level) => ({
                wood: Math.floor(100 * Math.pow(1.26, level - 1)),
                stone: Math.floor(100 * Math.pow(1.26, level - 1)),
                iron: Math.floor(100 * Math.pow(1.26, level - 1)),
                population: Math.floor(20 * Math.pow(1.17, level - 1))
            }),
            
            wood: (level) => ({
                wood: Math.floor(50 * Math.pow(1.26, level - 1)),
                stone: Math.floor(60 * Math.pow(1.26, level - 1)),
                iron: Math.floor(40 * Math.pow(1.26, level - 1)),
                population: Math.floor(5 * Math.pow(1.17, level - 1))
            }),
            
            stone: (level) => ({
                wood: Math.floor(65 * Math.pow(1.26, level - 1)),
                stone: Math.floor(50 * Math.pow(1.26, level - 1)),
                iron: Math.floor(40 * Math.pow(1.26, level - 1)),
                population: Math.floor(10 * Math.pow(1.17, level - 1))
            }),
            
            iron: (level) => ({
                wood: Math.floor(75 * Math.pow(1.26, level - 1)),
                stone: Math.floor(65 * Math.pow(1.26, level - 1)),
                iron: Math.floor(70 * Math.pow(1.26, level - 1)),
                population: Math.floor(10 * Math.pow(1.17, level - 1))
            }),
            
            farm: (level) => ({
                wood: Math.floor(45 * Math.pow(1.26, level - 1)),
                stone: Math.floor(40 * Math.pow(1.26, level - 1)),
                iron: Math.floor(30 * Math.pow(1.26, level - 1)),
                population: 0 // Farm increases population
            }),
            
            storage: (level) => ({
                wood: Math.floor(60 * Math.pow(1.26, level - 1)),
                stone: Math.floor(50 * Math.pow(1.26, level - 1)),
                iron: Math.floor(40 * Math.pow(1.26, level - 1)),
                population: Math.floor(1 * Math.pow(1.17, level - 1))
            }),
            
            hide: (level) => ({
                wood: Math.floor(50 * Math.pow(1.26, level - 1)),
                stone: Math.floor(60 * Math.pow(1.26, level - 1)),
                iron: Math.floor(50 * Math.pow(1.26, level - 1)),
                population: Math.floor(2 * Math.pow(1.17, level - 1))
            }),
            
            wall: (level) => ({
                wood: Math.floor(50 * Math.pow(1.26, level - 1)),
                stone: Math.floor(100 * Math.pow(1.26, level - 1)),
                iron: Math.floor(20 * Math.pow(1.26, level - 1)),
                population: Math.floor(5 * Math.pow(1.17, level - 1))
            })
        };
    }

    /**
     * Get building requirements (prerequisites)
     * @returns {Object} Building requirements
     */
    getBuildingRequirements() {
        return {
            main: {},
            barracks: { main: 3 },
            stable: { main: 10, barracks: 5 },
            garage: { main: 10, smithy: 5 },
            watchtower: {},
            snob: { main: 20 },
            smith: { main: 5, barracks: 1 },
            place: {},
            market: { main: 3 },
            wood: {},
            stone: {},
            iron: {},
            farm: {},
            storage: {},
            hide: {},
            wall: { barracks: 1 }
        };
    }

    /**
     * Get cost for upgrading a building to next level
     * @param {string} building - Building type
     * @param {number} currentLevel - Current level
     * @returns {Object} Cost for next level
     */
    getBuildingCost(building, currentLevel) {
        const costFunction = this.buildingCosts[building];
        if (!costFunction) {
            console.error(`❌ Unknown building type: ${building}`);
            return null;
        }
        
        const nextLevel = currentLevel + 1;
        return costFunction(nextLevel);
    }

    /**
     * Check if building requirements are met
     * @param {string} building - Building to check
     * @param {Object} currentBuildings - Current building levels
     * @returns {boolean} Requirements met
     */
    checkBuildingRequirements(building, currentBuildings) {
        const requirements = this.buildingRequirements[building] || {};
        
        for (const [reqBuilding, reqLevel] of Object.entries(requirements)) {
            const currentLevel = currentBuildings[reqBuilding] || 0;
            if (currentLevel < reqLevel) {
                console.log(`❌ ${building} requires ${reqBuilding} level ${reqLevel} (current: ${currentLevel})`);
                return false;
            }
        }
        
        return true;
    }

    /**
     * Check if resources are sufficient for building
     * @param {Object} cost - Building cost
     * @param {Object} resources - Available resources
     * @returns {boolean} Resources sufficient
     */
    checkResourceRequirements(cost, resources) {
        if (!cost || !resources) return false;
        
        return (
            resources.wood >= cost.wood &&
            resources.stone >= cost.stone &&
            resources.iron >= cost.iron
        );
    }

    /**
     * Check if population is sufficient for building
     * @param {Object} cost - Building cost
     * @param {Object} population - Population info
     * @returns {boolean} Population sufficient
     */
    checkPopulationRequirements(cost, population) {
        if (!cost || !population) return false;
        
        return population.available >= (cost.population || 0);
    }

    /**
     * Main function: Check if building can be constructed
     * @param {string} building - Building type
     * @param {number} currentLevel - Current building level
     * @param {Object} currentBuildings - All current building levels
     * @param {Object} resources - Available resources
     * @param {Object} population - Population info
     * @returns {Object} Analysis result
     */
    canBuild(building, currentLevel, currentBuildings, resources, population) {
        const analysis = {
            building: building,
            currentLevel: currentLevel,
            nextLevel: currentLevel + 1,
            canBuild: false,
            reasons: []
        };

        // Check building requirements
        if (!this.checkBuildingRequirements(building, currentBuildings)) {
            analysis.reasons.push('Building requirements not met');
            return analysis;
        }

        // Get building cost
        const cost = this.getBuildingCost(building, currentLevel);
        if (!cost) {
            analysis.reasons.push('Unknown building type');
            return analysis;
        }

        analysis.cost = cost;

        // Check resource requirements
        if (!this.checkResourceRequirements(cost, resources)) {
            analysis.reasons.push(`Insufficient resources (need: ${cost.wood}w, ${cost.stone}s, ${cost.iron}i)`);
            const missing = {
                wood: Math.max(0, cost.wood - resources.wood),
                stone: Math.max(0, cost.stone - resources.stone),
                iron: Math.max(0, cost.iron - resources.iron)
            };
            analysis.missingResources = missing;
        }

        // Check population requirements
        if (!this.checkPopulationRequirements(cost, population)) {
            analysis.reasons.push(`Insufficient population (need: ${cost.population}, available: ${population.available})`);
            analysis.missingPopulation = cost.population - population.available;
        }

        // If no blocking reasons, can build
        analysis.canBuild = analysis.reasons.length === 0;

        if (analysis.canBuild) {
            console.log(`✅ Can build ${building} level ${analysis.nextLevel}`);
        } else {
            console.log(`❌ Cannot build ${building}: ${analysis.reasons.join(', ')}`);
        }

        return analysis;
    }

    /**
     * Analyze village building potential based on template
     * @param {Object} villageSummary - Village summary from EnhancedDataManager
     * @param {string} templateName - Template to analyze against
     * @param {Object} templateManager - Template manager instance
     * @returns {Object} Analysis result
     */
    analyzeVillageForTemplate(villageSummary, templateName, templateManager) {
        if (!villageSummary) {
            return { error: 'No village data available' };
        }

        // Get next building from template
        const nextBuilding = templateManager.getNextBuilding(templateName, villageSummary.buildings);
        if (!nextBuilding) {
            return { 
                templateComplete: true,
                message: `Template '${templateName}' is complete!`
            };
        }

        // Analyze if we can build the next building
        const buildAnalysis = this.canBuild(
            nextBuilding.building,
            nextBuilding.currentLevel,
            villageSummary.buildings,
            villageSummary.resources,
            villageSummary.population
        );

        // Get template progress
        const progress = templateManager.getTemplateProgress(templateName, villageSummary.buildings);

        return {
            templateName: templateName,
            nextBuilding: nextBuilding,
            buildAnalysis: buildAnalysis,
            queueSpace: villageSummary.hasQueueSpace,
            progress: progress,
            canProceed: buildAnalysis.canBuild && villageSummary.hasQueueSpace
        };
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.BuildingAnalyzer = BuildingAnalyzer;
    console.log('🔍 Building Analyzer loaded!');
} 