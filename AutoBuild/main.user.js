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
    
    // =============================================================================
    // 🔍 INTEGRATED DATA COLLECTOR (from Helper.js)
    // =============================================================================
    
    /**
     * Complete Data Collector - Gets ALL information from current page
     */
    class DataCollector {
        
        /**
         * Collect all village information from current page
         * @returns {Promise<object>} Complete village data
         */
        static async collectAllData() {
            const villageId = game_data.village.id.toString();
            console.log(`🔍 Collecting all data for village ${villageId}...`);
            
            try {
                // Collect basic village info
                const villageInfo = this.collectVillageInfo();
                
                // Collect resources (if on main page)
                const resourcesInfo = this.collectResources();
                
                // Collect buildings (if available)
                const buildingsInfo = this.collectBuildings();
                
                // Collect queue data
                const queueData = await this.collectQueue(villageId);
                
                const completeData = {
                    info: villageInfo,
                    resources: resourcesInfo,
                    buildings: buildingsInfo,
                    activeQueue: queueData,
                    futurePlans: [], // For future use
                    collectedAt: Date.now(),
                    collectedFrom: window.location.href
                };
                
                console.log('✅ All data collected successfully!');
                return completeData;
                
            } catch (error) {
                console.error('❌ Failed to collect data:', error);
                return null;
            }
        }

        /**
         * Collect village basic information
         * @returns {object} Village info
         */
        static collectVillageInfo() {
            return {
                id: game_data.village.id,
                name: game_data.village.name,
                coords: `${game_data.village.x}|${game_data.village.y}`,
                url: window.location.href,
                isActive: true,
                world: game_data.world,
                market: game_data.market
            };
        }

        /**
         * Collect resources from page
         * @returns {object} Resources data
         */
        static collectResources() {
            try {
                // Try to get resources from game interface
                const woodElement = document.querySelector('#wood');
                const stoneElement = document.querySelector('#stone');
                const ironElement = document.querySelector('#iron');
                const popElement = document.querySelector('#pop');
                
                const resources = {};
                
                if (woodElement) resources.wood = parseInt(woodElement.textContent.replace(/\./g, '')) || 0;
                if (stoneElement) resources.stone = parseInt(stoneElement.textContent.replace(/\./g, '')) || 0;
                if (ironElement) resources.iron = parseInt(ironElement.textContent.replace(/\./g, '')) || 0;
                
                // Try to get population
                if (popElement) {
                    const popText = popElement.textContent;
                    const popMatch = popText.match(/(\d+)\/(\d+)/);
                    if (popMatch) {
                        resources.pop = parseInt(popMatch[1]);
                        resources.pop_max = parseInt(popMatch[2]);
                    }
                }
                
                // Get storage capacity (if available)
                const storageElement = document.querySelector('.storage');
                if (storageElement) {
                    const storageText = storageElement.textContent;
                    const storageMatch = storageText.match(/(\d+)/);
                    if (storageMatch) {
                        resources.storage_max = parseInt(storageMatch[1]);
                    }
                }
                
                return resources;
                
            } catch (error) {
                console.error('❌ Failed to collect resources:', error);
                return {};
            }
        }

        /**
         * Collect buildings data
         * @returns {object} Buildings data
         */
        static collectBuildings() {
            try {
                // If we have building data in game_data
                if (game_data.village && game_data.village.buildings) {
                    return { ...game_data.village.buildings };
                }
                
                // Otherwise try to detect from page elements
                const buildings = {};
                
                // Try to find building levels from page
                const buildingElements = document.querySelectorAll('[data-building]');
                buildingElements.forEach(element => {
                    const building = element.getAttribute('data-building');
                    const levelElement = element.querySelector('.level');
                    if (levelElement) {
                        const levelMatch = levelElement.textContent.match(/(\d+)/);
                        if (levelMatch) {
                            buildings[building] = parseInt(levelMatch[1]);
                        }
                    }
                });
                
                return buildings;
                
            } catch (error) {
                console.error('❌ Failed to collect buildings:', error);
                return {};
            }
        }

        /**
         * Collect queue data by opening headquarters
         * @param {string} villageId - Village ID
         * @returns {Promise<array>} Queue data
         */
        static async collectQueue(villageId) {
            return new Promise((resolve) => {
                console.log('🔗 Opening headquarters to collect queue...');
                
                const hqUrl = `game.php?village=${villageId}&screen=main`;
                const hqTab = window.open(hqUrl, '_blank');
                
                if (!hqTab) {
                    console.warn('⚠️ Could not open headquarters tab');
                    resolve([]);
                    return;
                }
                
                setTimeout(() => {
                    try {
                        const queueData = this.extractQueueFromDocument(hqTab.document);
                        hqTab.close();
                        console.log(`✅ Queue collected: ${queueData.length} items`);
                        resolve(queueData);
                    } catch (error) {
                        console.error('❌ Failed to collect queue:', error);
                        hqTab.close();
                        resolve([]);
                    }
                }, 3000);
            });
        }

        /**
         * Extract queue from headquarters document
         * @param {Document} doc - Document from headquarters tab
         * @returns {array} Queue data
         */
        static extractQueueFromDocument(doc) {
            const queueData = [];
            
            try {
                const constructionRows = doc.querySelectorAll('table tr');
                
                constructionRows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 4) {
                        const buildingCell = cells[0];
                        const durationCell = cells[1];
                        const completionCell = cells[3];
                        
                        if (buildingCell && durationCell && completionCell) {
                            const buildingText = buildingCell.textContent.trim();
                            const durationText = durationCell.textContent.trim();
                            const completionText = completionCell.textContent.trim();
                            
                            if (durationText.includes(':') && (completionText.includes('today') || completionText.includes('tomorrow'))) {
                                const queueItem = this.parseQueueItem(buildingText, durationText, completionText);
                                if (queueItem) {
                                    queueData.push(queueItem);
                                }
                            }
                        }
                    }
                });
                
            } catch (error) {
                console.error('❌ Failed to extract queue:', error);
            }
            
            return queueData;
        }

        /**
         * Parse queue item from table row
         * @param {string} buildingText - Building description
         * @param {string} durationText - Duration remaining
         * @param {string} completionText - Completion time
         * @returns {object|null} Parsed queue item
         */
        static parseQueueItem(buildingText, durationText, completionText) {
            try {
                const buildingMatch = buildingText.match(/(\w+)\s+.*Level\s+(\d+)/i);
                if (!buildingMatch) return null;
                
                const buildingName = buildingMatch[1].toLowerCase();
                const targetLevel = parseInt(buildingMatch[2]);
                
                return {
                    building: this.mapBuildingName(buildingName),
                    target_level: targetLevel,
                    current_level: targetLevel - 1,
                    remaining_duration: durationText,
                    completion_text: completionText,
                    status: 'in_progress'
                };
                
            } catch (error) {
                console.error('❌ Failed to parse queue item:', error);
                return null;
            }
        }

        /**
         * Map building names to standard format
         * @param {string} buildingName - Building name from game
         * @returns {string} Standardized building name
         */
        static mapBuildingName(buildingName) {
            const mapping = {
                'main': 'main',
                'barracks': 'barracks',
                'stable': 'stable',
                'garage': 'garage',
                'church': 'church',
                'watchtower': 'watchtower',
                'snob': 'snob',
                'smith': 'smith',
                'place': 'place',
                'statue': 'statue',
                'market': 'market',
                'wood': 'wood',
                'stone': 'stone',
                'iron': 'iron',
                'farm': 'farm',
                'storage': 'storage',
                'hide': 'hide',
                'wall': 'wall',
                'mine': 'iron',
                'clay': 'stone',
                'lumber': 'wood'
            };
            
            return mapping[buildingName.toLowerCase()] || buildingName.toLowerCase();
        }
    }

    /**
     * Simple Database for storing village data
     */
    class SimpleDB {
        static DATABASE_NAME = "Auto Builder";

        /**
         * Save village data
         * @param {string} villageId - Village ID
         * @param {object} villageData - Village data
         * @returns {boolean} Success status
         */
        static saveVillage(villageId, villageData) {
            try {
                let database = this.loadDatabase();
                
                if (!database) {
                    database = {
                        villages: {},
                        settings: {
                            created: Date.now(),
                            version: "1.0"
                        }
                    };
                }
                
                // Save village data
                database.villages[villageId] = {
                    ...villageData,
                    lastUpdated: Date.now()
                };
                
                database.settings.lastSaved = Date.now();
                
                // Save to localStorage
                localStorage.setItem(this.DATABASE_NAME, JSON.stringify(database));
                
                console.log(`💾 Village ${villageId} saved successfully!`);
                console.log(`📊 Database size: ${JSON.stringify(database).length} characters`);
                
                return true;
                
            } catch (error) {
                console.error(`❌ Failed to save village ${villageId}:`, error);
                return false;
            }
        }

        /**
         * Load database
         * @returns {object|null} Database object
         */
        static loadDatabase() {
            try {
                const data = localStorage.getItem(this.DATABASE_NAME);
                return data ? JSON.parse(data) : null;
            } catch (error) {
                console.error('❌ Failed to load database:', error);
                return null;
            }
        }

        /**
         * Get all villages
         * @returns {object} All villages data
         */
        static getAllVillages() {
            const database = this.loadDatabase();
            return database ? database.villages : {};
        }

        /**
         * Get specific village
         * @param {string} villageId - Village ID
         * @returns {object|null} Village data
         */
        static getVillage(villageId) {
            const database = this.loadDatabase();
            return database && database.villages[villageId] ? database.villages[villageId] : null;
        }
    }

    /**
     * COMMAND 1: Get all information and save it
     */
    async function getInfo() {
        console.log('🚀 COMMAND 1: Getting all information...');
        console.log('═'.repeat(50));
        
        try {
            const villageId = game_data.village.id.toString();
            
            // Collect all data
            const villageData = await DataCollector.collectAllData();
            
            if (villageData) {
                // Save to database
                const saveSuccess = SimpleDB.saveVillage(villageId, villageData);
                
                if (saveSuccess) {
                    console.log('✅ SUCCESS: All information collected and saved!');
                    console.log(`📍 Village: ${villageData.info.name} (${villageData.info.coords})`);
                    console.log(`📦 Resources: Wood:${villageData.resources.wood || 'N/A'} Stone:${villageData.resources.stone || 'N/A'} Iron:${villageData.resources.iron || 'N/A'}`);
                    console.log(`🔧 Queue: ${villageData.activeQueue.length} items`);
                    console.log(`⏰ Collected at: ${new Date(villageData.collectedAt).toLocaleString()}`);
                } else {
                    console.error('❌ Failed to save collected data');
                }
            } else {
                console.error('❌ Failed to collect village data');
            }
            
        } catch (error) {
            console.error('❌ Command failed:', error);
        }
        
        console.log('═'.repeat(50));
    }

    /**
     * COMMAND 2: Show all saved information
     */
    function showInfo() {
        console.log('📊 COMMAND 2: Showing saved information...');
        console.log('═'.repeat(50));
        
        try {
            const allVillages = SimpleDB.getAllVillages();
            const villageCount = Object.keys(allVillages).length;
            
            if (villageCount === 0) {
                console.log('❌ No villages in database yet');
                console.log('💡 Run getInfo() first to collect data');
                return;
            }
            
            console.log(`🏰 AUTO BUILDER DATABASE (${villageCount} villages)`);
            console.log('');
            
            Object.entries(allVillages).forEach(([villageId, villageData]) => {
                console.log(`🏘️ VILLAGE ID: ${villageId} | NAME: ${villageData.info.name || 'Unknown'}`);
                console.log('─'.repeat(40));
                
                // Basic info
                if (villageData.info.coords) {
                    console.log(`📌 Coordinates: ${villageData.info.coords}`);
                }
                
                // Resources
                if (villageData.resources && Object.keys(villageData.resources).length > 0) {
                    const res = villageData.resources;
                    console.log(`📦 Resources: Wood:${res.wood || 0} Stone:${res.stone || 0} Iron:${res.iron || 0}`);
                    if (res.pop && res.pop_max) {
                        console.log(`👥 Population: ${res.pop}/${res.pop_max}`);
                    }
                }
                
                // Key buildings
                if (villageData.buildings && Object.keys(villageData.buildings).length > 0) {
                    const buildings = villageData.buildings;
                    const keyBuildings = [];
                    if (buildings.main) keyBuildings.push(`HQ:${buildings.main}`);
                    if (buildings.barracks) keyBuildings.push(`Barracks:${buildings.barracks}`);
                    if (buildings.farm) keyBuildings.push(`Farm:${buildings.farm}`);
                    if (buildings.wall) keyBuildings.push(`Wall:${buildings.wall}`);
                    
                    if (keyBuildings.length > 0) {
                        console.log(`🏗️ Key Buildings: ${keyBuildings.join(' ')}`);
                    }
                }
                
                // Active queue
                if (villageData.activeQueue && villageData.activeQueue.length > 0) {
                    console.log(`🔧 Active Queue (${villageData.activeQueue.length} items):`);
                    villageData.activeQueue.forEach((item, index) => {
                        console.log(`   ${index + 1}. ${item.building} Level ${item.target_level} (${item.remaining_duration || 'Unknown'})`);
                    });
                } else {
                    console.log('🔧 No buildings in queue');
                }
                
                // Last updated
                if (villageData.lastUpdated) {
                    console.log(`⏰ Last Updated: ${new Date(villageData.lastUpdated).toLocaleString()}`);
                }
                
                console.log('─'.repeat(40));
                console.log('');
            });
            
        } catch (error) {
            console.error('❌ Failed to show information:', error);
        }
        
        console.log('═'.repeat(50));
    }

    // Make functions globally available
    window.getInfo = getInfo;
    window.showInfo = showInfo;
    window.DataCollector = DataCollector;
    window.SimpleDB = SimpleDB;
    
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
        async function refreshAll(showMsg) {
            const villages = db.getAllVillages('villages');
            let refreshed = 0;
            for (const villageId of Object.keys(villages)) {
                try {
                    const data = await DataCollector.collectAllData();
                    if (data) {
                        db.updateVillage('villages', villageId, data);
                        refreshed++;
                    }
                } catch (err) {
                    console.error(`❌ Failed to refresh data for village ${villageId}:`, err);
                }
            }
            if (showMsg) alert(`Villages refreshed: ${refreshed}`);
        }
        // Run immediately on load
        refreshAll(false);
        // Then every 1 hour
        setInterval(() => refreshAll(false), 60 * 60 * 1000);
        // Expose for manual refresh
        window.refreshAllVillages = () => refreshAll(true);
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
            // Schedule village data refresh every hour and on start
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
