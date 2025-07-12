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
    
    function scheduleVillageDataRefresh() {
        const db = window.AutoBuilder.getDatabase();
        const villages = db.getAllVillages('villages');
        async function refreshAll() {
            for (const villageId of Object.keys(villages)) {
                try {
                    console.log(`🔄 Refreshing data for village ${villageId}...`);
                    const data = await DataCollector.collectAllData();
                    if (data) {
                        db.updateVillage('villages', villageId, data);
                        console.log(`✅ Data refreshed for village ${villageId}`);
                    }
                } catch (err) {
                    console.error(`❌ Failed to refresh data for village ${villageId}:`, err);
                }
            }
        }
        // Run immediately on load
        refreshAll();
        // Then every 1 hour
        setInterval(refreshAll, 60 * 60 * 1000);
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
            
            // Add global test function for debugging
            window.testAutoBuilder = function() {
                console.log('🧪 Testing AutoBuilder...');
                console.log('AutoBuilder object:', window.AutoBuilder);
                console.log('AutoBuilder UI:', window.AutoBuilder ? window.AutoBuilder.getUI() : 'Not available');
                console.log('Settings:', window.AutoBuilder ? window.AutoBuilder.getSettings() : 'Not available');
                
                if (window.AutoBuilder && window.AutoBuilder.getUI && window.AutoBuilder.getUI().settings) {
                    console.log('✅ AutoBuilder UI is available, testing show()...');
                    window.AutoBuilder.getUI().settings.show();
                } else {
                    console.error('❌ AutoBuilder UI not available');
                }
            };
            
            // Only inject the menu bar button
            injectAutoBuilderButton();
            // Schedule village data refresh every hour
            scheduleVillageDataRefresh();
        } catch (error) {
            console.error('❌ AutoBuilder initialization failed:', error);
        }
    }

    function injectAutoBuilderButton() {
        // Find the menu row and all menu-side <td>s
        const menuRow = document.querySelector('tr#menu_row, tr.menu-row, tr');
        if (!menuRow) {
            console.log('🔍 Menu row not found, retrying in 1 second...');
            setTimeout(injectAutoBuilderButton, 1000);
            return;
        }
        const tds = Array.from(menuRow.querySelectorAll('td.menu-side'));
        // Find the loading bar <td>
        const loadingTd = tds.find(td => td.querySelector('#loading_content'));
        if (!loadingTd) {
            console.log('🔍 Loading bar <td> not found, retrying in 1 second...');
            setTimeout(injectAutoBuilderButton, 1000);
            return;
        }
        // Check if already injected
        if (document.getElementById('autobuilder-menu-btn')) {
            console.log('✅ AutoBuilder menu button already exists');
            return;
        }
        // Create the <td> and button
        const autobuilderTd = document.createElement('td');
        autobuilderTd.className = 'menu-side';
        autobuilderTd.id = 'autobuilder-menu-btn';
        // Use a matching <a> with icon and tooltip
        const autobuilderA = document.createElement('a');
        autobuilderA.href = '#';
        autobuilderA.title = 'AutoBuilder';
        autobuilderA.style.display = 'inline-block';
        autobuilderA.style.height = '32px';
        autobuilderA.style.width = '32px';
        autobuilderA.style.margin = '0 2px';
        autobuilderA.style.verticalAlign = 'middle';
        autobuilderA.innerHTML = '<img src="https://dsen.innogamescdn.com/asset/7fe7ab60/graphic/buildings/mid/main3.png" alt="AutoBuilder" style="width:28px;height:28px;vertical-align:middle;">';
        autobuilderA.onclick = (e) => {
            e.preventDefault();
            try {
                if (window.AutoBuilder && window.AutoBuilder.getUI && window.AutoBuilder.getUI().settings) {
                    window.AutoBuilder.getUI().settings.show();
                } else {
                    alert('AutoBuilder UI not available! Please refresh the page.');
                }
            } catch (err) {
                alert('AutoBuilder UI failed to open! Error: ' + err.message);
            }
        };
        autobuilderTd.appendChild(autobuilderA);
        // Insert before the loading bar <td>
        loadingTd.parentNode.insertBefore(autobuilderTd, loadingTd);
        console.log('✅ AutoBuilder menu button inserted before loading bar');
    }
    
})(); 

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('autobuilder-close')) {
        const panel = e.target.closest('.autobuilder-panel');
        if (panel) panel.style.display = 'none';
    }
}); 
