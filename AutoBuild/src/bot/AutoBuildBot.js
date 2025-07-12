/**
 * Auto Build Bot
 * Main bot logic for automatic building
 */
class AutoBuildBot {
    constructor() {
        this.isRunning = false;
        this.checkInterval = null;
        this.settings = null;
        this.database = null;
        this.lastCheck = 0;
    }
    
    /**
     * Initialize the bot
     */
    init() {
        this.settings = window.AutoBuilder.getSettings();
        this.database = window.AutoBuilder.getDatabase();
        console.log('🤖 Auto Build Bot initialized');
    }
    
    /**
     * Start the bot
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️ Bot is already running');
            return;
        }
        
        this.isRunning = true;
        const interval = this.settings.get('checkInterval') || 30;
        this.checkInterval = setInterval(() => {
            this.checkAndBuild();
        }, interval * 1000);
        
        console.log(`🤖 Auto Build Bot started! (checking every ${interval} seconds)`);
    }
    
    /**
     * Stop the bot
     */
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.isRunning = false;
        console.log('🛑 Auto Build Bot stopped!');
    }
    
    /**
     * Check if bot should run
     */
    shouldRun() {
        // Check if auto build is enabled
        if (!this.settings.get('autoBuildEnabled')) {
            return false;
        }
        
        // Check if we're on main page
        if (!window.location.href.includes('screen=main')) {
            return false;
        }
        
        // Check if page is visible
        if (document.hidden) {
            return false;
        }
        
        // Check if enough time has passed since last check
        const now = Date.now();
        const minInterval = (this.settings.get('checkInterval') || 30) * 1000;
        if (now - this.lastCheck < minInterval) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Main bot logic - check and build
     */
    async checkAndBuild() {
        if (!this.shouldRun()) {
            return;
        }
        
        try {
            this.lastCheck = Date.now();
            const villageId = game_data.village.id.toString();
            
            // Get village data
            const villageData = this.database.getVillage('villages', villageId);
            if (!villageData) {
                console.log('⚠️ No village data found, collecting...');
                await this.collectVillageData(villageId);
                return;
            }
            
            // Get current game queue
            const gameQueue = await this.getCurrentGameQueue(villageId);
            console.log(`📋 Current game queue: ${gameQueue.length}/5 buildings`);
            
            // Check if we can add more buildings to game queue
            if (gameQueue.length >= 5) {
                console.log('ℹ️ Game queue is full (5/5), waiting...');
                return;
            }
            
            // Get next building - check templates first, then costup setup
            let nextBuilding = null;
            const activeTemplate = this.settings.get('activeTemplate');
            
            if (activeTemplate) {
                // Use template-based building
                nextBuilding = this.settings.getNextBuildingFromTemplate(activeTemplate, villageData);
                if (nextBuilding) {
                    console.log(`📋 Next building from template "${activeTemplate}": ${nextBuilding.building} → Level ${nextBuilding.target_level}`);
                }
            } else {
                // Use costup setup
                nextBuilding = this.settings.getNextBuildingFromCostup(villageData);
                if (nextBuilding) {
                    console.log(`📋 Next building from costup: ${nextBuilding.building} → Level ${nextBuilding.target_level}`);
                }
            }
            
            if (!nextBuilding) {
                console.log('ℹ️ No more buildings to build');
                return;
            }
            
            // Check if we can build this building
            if (this.canBuild(villageData, nextBuilding, gameQueue)) {
                await this.build(nextBuilding);
            }
            
        } catch (error) {
            console.error('❌ Error in checkAndBuild:', error);
        }
    }
    
    /**
     * Collect village data
     */
    async collectVillageData(villageId) {
        try {
            const villageData = await DataCollector.collectAllData();
            if (villageData) {
                this.database.updateVillage('villages', villageId, villageData);
                console.log('✅ Village data collected and saved');
            }
        } catch (error) {
            console.error('❌ Failed to collect village data:', error);
        }
    }
    
    /**
     * Get current game queue from the page
     * @param {string} villageId - Village ID
     * @returns {Promise<array>} Current game queue
     */
    async getCurrentGameQueue(villageId) {
        return new Promise((resolve) => {
            // Try to get queue from current page first
            const queueFromPage = this.extractQueueFromCurrentPage();
            if (queueFromPage.length > 0) {
                resolve(queueFromPage);
                return;
            }
            
            // If not on main page, open headquarters to check
            console.log('🔗 Opening headquarters to check queue...');
            const hqUrl = `game.php?village=${villageId}&screen=main`;
            const hqTab = window.open(hqUrl, '_blank');
            
            if (!hqTab) {
                console.warn('⚠️ Could not open headquarters tab');
                resolve([]);
                return;
            }
            
            setTimeout(() => {
                try {
                    const queueData = DataCollector.extractQueueFromDocument(hqTab.document);
                    hqTab.close();
                    console.log(`✅ Game queue found: ${queueData.length} items`);
                    resolve(queueData);
                } catch (error) {
                    console.error('❌ Failed to get game queue:', error);
                    hqTab.close();
                    resolve([]);
                }
            }, 3000);
        });
    }
    
    /**
     * Extract queue from current page
     * @returns {array} Queue items from current page
     */
    extractQueueFromCurrentPage() {
        const queue = [];
        
        try {
            // Look for construction queue elements on current page
            const constructionElements = document.querySelectorAll('.constructionQueue, .queue-item, [data-queue]');
            
            constructionElements.forEach(element => {
                const buildingText = element.textContent || '';
                const buildingMatch = buildingText.match(/(\w+)\s+.*Level\s+(\d+)/i);
                
                if (buildingMatch) {
                    const buildingName = buildingMatch[1].toLowerCase();
                    const targetLevel = parseInt(buildingMatch[2]);
                    
                    queue.push({
                        building: DataCollector.mapBuildingName(buildingName),
                        target_level: targetLevel,
                        status: 'in_progress'
                    });
                }
            });
            
        } catch (error) {
            console.error('❌ Failed to extract queue from current page:', error);
        }
        
        return queue;
    }
    
    /**
     * Check if we can build a specific building
     * @param {object} villageData - Village data
     * @param {object} buildingPlan - Building plan
     * @param {array} gameQueue - Current game queue
     * @returns {boolean} Can build
     */
    canBuild(villageData, buildingPlan, gameQueue) {
        try {
            // Check if already built
            const currentLevel = villageData.buildings[buildingPlan.building] || 0;
            if (currentLevel >= buildingPlan.target_level) {
                return false;
            }
            
            // Check if already in game queue
            const inGameQueue = gameQueue.some(item => 
                item.building === buildingPlan.building && 
                item.target_level === buildingPlan.target_level
            );
            if (inGameQueue) {
                return false;
            }
            
            // Check resources
            const resources = villageData.resources || {};
            const costs = DataHelper.calculateBuildingCosts(buildingPlan.building, buildingPlan.target_level);
            
            if (resources.wood < costs.wood || 
                resources.stone < costs.stone || 
                resources.iron < costs.iron) {
                console.log(`❌ Not enough resources for ${buildingPlan.building} level ${buildingPlan.target_level}`);
                return false;
            }
            
            // Check population
            if (resources.pop && resources.pop_max) {
                const popNeeded = costs.pop || 0;
                if (resources.pop + popNeeded > resources.pop_max) {
                    console.log(`❌ Not enough population for ${buildingPlan.building} level ${buildingPlan.target_level}`);
                    return false;
                }
            }
            
            console.log(`✅ Can build ${buildingPlan.building} to level ${buildingPlan.target_level}`);
            return true;
            
        } catch (error) {
            console.error('❌ Error checking if can build:', error);
            return false;
        }
    }
    
    /**
     * Build a specific building
     * @param {object} buildingPlan - Building plan
     */
    async build(buildingPlan) {
        try {
            console.log(`🏗️ Building ${buildingPlan.building} to level ${buildingPlan.target_level}...`);
            
            // Make the building request
            const success = await this.makeBuildRequest(buildingPlan);
            
            if (success) {
                console.log(`✅ Successfully started building ${buildingPlan.building} to level ${buildingPlan.target_level}`);
                
                // Update database
                const villageId = game_data.village.id.toString();
                const queue = this.database.getVillage('queue', villageId) || [];
                queue.push({
                    building: buildingPlan.building,
                    target_level: buildingPlan.target_level,
                    start_time: Date.now(),
                    status: 'in_progress'
                });
                this.database.updateVillage('queue', villageId, queue);
                
            } else {
                console.log(`❌ Failed to build ${buildingPlan.building} to level ${buildingPlan.target_level}`);
            }
            
        } catch (error) {
            console.error('❌ Error building:', error);
        }
    }
    
    /**
     * Make the actual build request to the game
     * @param {object} buildingPlan - Building plan
     * @returns {Promise<boolean>} Success status
     */
    async makeBuildRequest(buildingPlan) {
        return new Promise((resolve) => {
            const villageId = game_data.village.id;
            const buildingId = this.getBuildingId(buildingPlan.building, buildingPlan.target_level);
            
            if (!buildingId) {
                resolve(false);
                return;
            }
            
            const url = `game.php?village=${villageId}&screen=main&action=upgrade_building&id=${buildingId}&type=main&h=${game_data.csrf}`;
            
            fetch(url)
                .then(response => response.text())
                .then(html => {
                    // Check if build was successful
                    const success = !html.includes('error') && !html.includes('Error');
                    resolve(success);
                })
                .catch(error => {
                    console.error('❌ Build request failed:', error);
                    resolve(false);
                });
        });
    }
    
    /**
     * Get building ID for specific building and level
     * @param {string} building - Building name
     * @param {number} level - Target level
     * @returns {string} Building ID
     */
    getBuildingId(building, level) {
        // This would need to be implemented based on game's building system
        // For now, return a placeholder
        return `${building}_${level}`;
    }
    
    /**
     * Get bot status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastCheck: this.lastCheck,
            settings: {
                enabled: this.settings.get('autoBuildEnabled'),
                interval: this.settings.get('checkInterval'),
                maxQueueSize: this.settings.get('maxQueueSize'),
                costupSetup: this.settings.get('costupSetup')
            }
        };
    }
} 