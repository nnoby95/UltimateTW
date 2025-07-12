// ==UserScript==
// @name         Tribal Wars Auto Builder
// @version      1.0.0
// @description  Automated building system for Tribal Wars with clean database architecture
// @author       Your Name
// @include      https://*.klanhaboru.hu/*
// @include      https://*.tribalwars.net/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      file:///path/to/AutoBuild/src/database/DatabaseManager.js
// @require      file:///path/to/AutoBuild/src/database/DataCollector.js
// @require      file:///path/to/AutoBuild/src/bot/AutoBuildBot.js
// @require      file:///path/to/AutoBuild/src/bot/ResourceMonitor.js
// @require      file:///path/to/AutoBuild/src/bot/QueueManager.js
// @require      file:///path/to/AutoBuild/src/ui/SettingsPanel.js
// @require      file:///path/to/AutoBuild/src/ui/BuildQueueUI.js
// @require      file:///path/to/AutoBuild/src/ui/VillageManager.js
// @require      file:///path/to/AutoBuild/src/ui/TemplateManager.js
// @require      file:///path/to/AutoBuild/src/utils/DataHelper.js
// @require      file:///path/to/AutoBuild/src/utils/BuildingCosts.js
// @require      file:///path/to/AutoBuild/src/utils/TimeUtils.js
// @require      file:///path/to/AutoBuild/src/utils/GameUtils.js
// @require      file:///path/to/AutoBuild/src/config/Settings.js
// @require      file:///path/to/AutoBuild/src/config/BuildingConfig.js
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