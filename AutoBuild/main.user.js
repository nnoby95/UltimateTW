// ==UserScript==
// @name         Tribal Wars Auto Builder
// @version      1.0.0
// @description  Automated building system for Tribal Wars with clean database architecture
// @author       Your Name
// @include      https://*.klanhaboru.hu/*
// @include      https://*.tribalwars.net/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/database/DatabaseManager.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/database/DataCollector.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/bot/AutoBuildBot.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/bot/ResourceMonitor.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/bot/QueueManager.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/ui/SettingsPanel.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/ui/BuildQueueUI.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/ui/VillageManager.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/ui/TemplateManager.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/utils/DataHelper.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/utils/BuildingCosts.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/utils/TimeUtils.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/utils/GameUtils.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/config/Settings.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/config/BuildingConfig.js
// ==/UserScript==

(function() {
    'use strict';
    
    // Initialize Auto Builder
    class AutoBuilder {
        constructor() {
            this.isInitialized = false;
            this.settings = new Settings();
            this.database = new DatabaseManager();
            this.collector = new DataCollector();
            this.bot = new AutoBuildBot();
            this.monitor = new ResourceMonitor();
            this.queueManager = new QueueManager();
            this.ui = {
                settings: new SettingsPanel(),
                queue: new BuildQueueUI(),
                village: new VillageManager(),
                templates: new TemplateManager()
            };
        }
        
        async init() {
            try {
                console.log('🏗️ Initializing Auto Builder...');
                
                // Initialize database
                await this.database.init();
                
                // Load settings
                this.settings.load();
                
                // Initialize UI
                this.ui.settings.init();
                this.ui.queue.init();
                this.ui.village.init();
                this.ui.templates.init();
                
                // Start bot if enabled
                if (this.settings.get('autoBuildEnabled')) {
                    this.bot.start();
                }
                
                // Start resource monitoring (passive collection only)
                this.monitor.start();
                
                this.isInitialized = true;
                console.log('✅ Auto Builder initialized successfully!');
                
            } catch (error) {
                console.error('❌ Failed to initialize Auto Builder:', error);
            }
        }
        
        // Public API
        getBot() { return this.bot; }
        getDatabase() { return this.database; }
        getSettings() { return this.settings; }
        getUI() { return this.ui; }
    }
    
    // Global instance
    window.AutoBuilder = new AutoBuilder();
    
    // Initialize when page is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.AutoBuilder.init();
        });
    } else {
        window.AutoBuilder.init();
    }
    
})(); 
