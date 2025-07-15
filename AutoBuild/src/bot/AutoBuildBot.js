/**
 * Auto Build Bot
 * Main bot logic for automatic building using smart calculations
 */
class AutoBuildBot {
    constructor() {
        this.isRunning = false;
        this.checkInterval = null;
        this.settings = null;
        this.database = null;
        this.enhancedDataManager = null;
        this.smartCalculator = null;
        this.lastCheck = 0;
        this.nextCheckTime = 0;
    }
    
    /**
     * Initialize the bot
     */
    init() {
        this.settings = window.AutoBuilder.getSettings();
        this.database = window.AutoBuilder.getDatabase();
        
        // Initialize enhanced data manager
        this.enhancedDataManager = new EnhancedDataManager();
        this.enhancedDataManager.init();
        
        // Initialize smart calculator
        this.smartCalculator = new SmartBuildCalculator();
        this.smartCalculator.init();
        
        console.log('🤖 Auto Build Bot initialized with smart calculator');
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
        this.nextCheckTime = Date.now() + 60000; // Start checking in 1 minute
        
        // Use smart interval based on calculations
        this.checkInterval = setInterval(() => {
            this.smartCheckAndBuild();
        }, 30000); // Check every 30 seconds, but only act when conditions are met
        
        console.log('🤖 Smart Auto Build Bot started!');
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
        
        // Check if it's time for next calculation
        const now = Date.now();
        if (now < this.nextCheckTime) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Smart check and build using database calculations
     */
    async smartCheckAndBuild() {
        if (!this.shouldRun()) {
            return;
        }

        try {
            this.lastCheck = Date.now();
            const villageId = game_data.village.id.toString();

            console.log(`🧠 Smart check for village ${villageId}...`);
            
            // Use smart calculator to determine if we should build
            const decision = await this.smartCalculator.calculateNextBuild(villageId);
            
            // Update next check time based on decision
            this.nextCheckTime = decision.nextCheck || (Date.now() + 300000); // Default 5 minutes
            
            if (decision.shouldBuild) {
                console.log(`🏗️ Smart decision: BUILD ${decision.building.building} to level ${decision.building.target_level}`);
                await this.build(decision.building, villageId);
            } else {
                console.log(`⏳ Smart decision: WAIT - ${decision.reason}`);
                
                // Show dynamic check information
                const nextCheckIn = Math.round((decision.nextCheck - Date.now()) / 1000 / 60);
                console.log(`🔄 Next database check in: ${nextCheckIn} minutes`);
                
                if (decision.estimatedTime) {
                    const waitTime = Math.round((decision.estimatedTime - Date.now()) / 1000 / 60);
                    console.log(`⏰ Estimated completion time: ${waitTime} minutes`);
                    console.log(`💡 Will check database periodically to catch early opportunities!`);
                }
            }

        } catch (error) {
            console.error('❌ Error in smart check and build:', error);
            this.nextCheckTime = Date.now() + 300000; // Wait 5 minutes on error
        }
    }
    
    /**
     * Build a specific building using enhanced logic
     * @param {object} buildingPlan - Building plan
     * @param {string} villageId - Village ID
     */
    async build(buildingPlan, villageId) {
        try {
            console.log(`🏗️ Building ${buildingPlan.building} to level ${buildingPlan.target_level}...`);
            
            // Get building ID for the game
            const buildingId = this.enhancedDataManager.getBuildingId(buildingPlan.building);
            
            // Add building to queue using enhanced logic
            const success = await this.enhancedDataManager.addBuildingToQueue(villageId, buildingId);
            
            if (success) {
                console.log(`✅ Successfully started building ${buildingPlan.building} to level ${buildingPlan.target_level}`);
                
                // Update database
                const queue = this.database.getVillage('queue', villageId) || [];
                queue.push({
                    building: buildingPlan.building,
                    target_level: buildingPlan.target_level,
                    start_time: Date.now(),
                    status: 'in_progress'
                });
                this.database.updateVillage('queue', villageId, queue);
                
                // Show success message
                if (typeof UI !== 'undefined' && UI.SuccessMessage) {
                    UI.SuccessMessage(`✅ Started building ${buildingPlan.building} to level ${buildingPlan.target_level}!`);
                }
                
                // Schedule next check in 1 minute
                this.nextCheckTime = Date.now() + 60000;
                
            } else {
                console.log(`❌ Failed to build ${buildingPlan.building} to level ${buildingPlan.target_level}`);
                
                // Show error message
                if (typeof UI !== 'undefined' && UI.ErrorMessage) {
                    UI.ErrorMessage(`❌ Failed to build ${buildingPlan.building} to level ${buildingPlan.target_level}`);
                }
                
                // Wait 5 minutes before retry
                this.nextCheckTime = Date.now() + 300000;
            }
            
        } catch (error) {
            console.error('❌ Error building:', error);
            this.nextCheckTime = Date.now() + 300000; // Wait 5 minutes on error
        }
    }
    
    /**
     * Get bot status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastCheck: this.lastCheck,
            nextCheckTime: this.nextCheckTime,
            timeUntilNextCheck: this.nextCheckTime - Date.now(),
            enhancedDataManager: this.enhancedDataManager ? this.enhancedDataManager.getStatus() : null,
            smartCalculator: this.smartCalculator ? this.smartCalculator.getStatus() : null,
            settings: {
                enabled: this.settings.get('autoBuildEnabled'),
                interval: this.settings.get('checkInterval'),
                maxQueueSize: this.settings.get('maxQueueSize'),
                costupSetup: this.settings.get('costupSetup')
            }
        };
    }
} 