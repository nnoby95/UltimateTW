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
    
    // Safety check - ensure we don't interfere with game loading
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Wait a bit more to ensure game is fully loaded
            setTimeout(() => {
                initializeAutoBuilder();
            }, 1000);
        });
    } else {
        // Page already loaded, wait a bit for game to settle
        setTimeout(() => {
            initializeAutoBuilder();
        }, 1000);
    }
    
    function initializeAutoBuilder() {
        try {
            // Check if we're on a Tribal Wars page
            if (!window.location.href.includes('tribalwars') && 
                !window.location.href.includes('klanhaboru') && 
                !window.location.href.includes('tribalwars.net')) {
                console.log('🚫 Not on Tribal Wars page, skipping AutoBuilder initialization');
                return;
            }
            
            // Check if game_data exists (Tribal Wars game object)
            if (typeof game_data === 'undefined') {
                console.log('⏳ Waiting for Tribal Wars game to load...');
                setTimeout(initializeAutoBuilder, 2000);
                return;
            }
            
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
                        
                        // Initialize UI with error handling
                        try {
                            this.ui.settings.init();
                        } catch (error) {
                            console.warn('⚠️ Settings Panel initialization failed:', error);
                        }
                        
                        try {
                            this.ui.queue.init();
                        } catch (error) {
                            console.warn('⚠️ Build Queue UI initialization failed:', error);
                        }
                        
                        try {
                            this.ui.village.init();
                        } catch (error) {
                            console.warn('⚠️ Village Manager initialization failed:', error);
                        }
                        
                        try {
                            this.ui.templates.init();
                        } catch (error) {
                            console.warn('⚠️ Template Manager initialization failed:', error);
                        }
                        
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
            window.AutoBuilder.init();
            injectAutoBuilderButton();
            
        } catch (error) {
            console.error('❌ AutoBuilder initialization failed:', error);
        }
    }

    function injectAutoBuilderButton() {
        // Try to find the quest button
        let questBtn = document.querySelector('#questlog') || document.querySelector('.questlog') || document.querySelector('[id^="quest"]');
        if (!questBtn) {
            // Try again after a short delay if not found
            setTimeout(injectAutoBuilderButton, 1000);
            return;
        }

        // Check if button already exists
        if (document.getElementById('autobuilder-toggle-btn')) return;

        // Create the button
        const btn = document.createElement('button');
        btn.id = 'autobuilder-toggle-btn';
        btn.innerHTML = '🏗️ AutoBuilder';
        btn.style.display = 'block';
        btn.style.margin = '8px auto 0 auto';
        btn.style.width = '120px';
        btn.style.background = '#e6c590';
        btn.style.border = '2px solid #b08d57';
        btn.style.borderRadius = '6px';
        btn.style.color = '#5c4320';
        btn.style.fontWeight = 'bold';
        btn.style.fontSize = '14px';
        btn.style.cursor = 'pointer';
        btn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
        btn.style.zIndex = 10001;
        btn.onmouseover = () => btn.style.background = '#f5e1b8';
        btn.onmouseout = () => btn.style.background = '#e6c590';
        btn.onclick = () => {
            try {
                window.AutoBuilder.getUI().settings.show();
            } catch (e) {
                alert('AutoBuilder UI failed to open!');
            }
        };

        // Insert after quest button
        questBtn.parentNode.insertBefore(btn, questBtn.nextSibling);
    }
    
})(); 