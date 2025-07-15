// ==UserScript==
// @name         Tribal Wars Auto Builder
// @version      1.0.0
// @description  Automated building system for Tribal Wars with clean database architecture
// @author       Your Name
// @include      https://*.klanhaboru.hu/*
// @include      https://*.tribalwars.net/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/AutoBuild/src/database/DatabaseManager.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/AutoBuild/src/database/DataCollector.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/AutoBuild/src/database/EnhancedDataManager.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/AutoBuild/src/integration/ComprehensiveIntegration.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/AutoBuild/src/bot/SmartBuildCalculator.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/AutoBuild/src/bot/AutoBuildBot.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/AutoBuild/src/bot/ResourceMonitor.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/AutoBuild/src/bot/QueueManager.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/AutoBuild/src/ui/SettingsPanel.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/AutoBuild/src/ui/BuildQueueUI.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/AutoBuild/src/ui/VillageManager.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/AutoBuild/src/ui/TemplateManager.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/AutoBuild/src/utils/DataHelper.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/AutoBuild/src/utils/BuildingCosts.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/AutoBuild/src/utils/TimeUtils.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/AutoBuild/src/utils/GameUtils.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/AutoBuild/src/config/Settings.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/AutoBuild/src/config/BuildingConfig.js
// ==/UserScript==

(function() {
    'use strict';
    
    // =============================================================================
    // 🔍 COMPREHENSIVE DATA COLLECTOR INTEGRATION
    // =============================================================================
    
    /**
     * Load and integrate the comprehensive data collector
     */
    function loadComprehensiveDataCollector() {
        // Check if comprehensive collector is available
        if (typeof window.collectComprehensiveData === 'function') {
            console.log('✅ Comprehensive data collector loaded');
            return true;
        }
        
        // Try to load from external source if not available
        console.log('🔄 Loading comprehensive data collector...');
        
        const script = document.createElement('script');
        script.src = 'https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/AutoBuild/TW_Utils_Templates/ComprehensiveVillageDataCollector.js';
        script.onload = () => {
            console.log('✅ Comprehensive data collector loaded externally');
        };
        script.onerror = () => {
            console.warn('⚠️ Could not load comprehensive data collector externally');
        };
        document.head.appendChild(script);
        
        return false;
    }
    
    /**
     * Load and integrate the building queue logic
     */
    function loadBuildingQueueLogic() {
        // Check if building queue logic is available
        if (typeof window.TribalWarsBuildingQueueLogic === 'function') {
            console.log('✅ Building queue logic loaded');
            return true;
        }
        
        // Try to load from external source if not available
        console.log('🔄 Loading building queue logic...');
        
        const script = document.createElement('script');
        script.src = 'https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/AutoBuild/TW_Utils_Templates/TribalWars_Building_Queue_Logic.js';
        script.onload = () => {
            console.log('✅ Building queue logic loaded externally');
        };
        script.onerror = () => {
            console.warn('⚠️ Could not load building queue logic externally');
        };
        document.head.appendChild(script);
        
        return false;
    }
    
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
                        
                        const buildingText = buildingCell.textContent.trim();
                        const durationText = durationCell.textContent.trim();
                        const completionText = completionCell.textContent.trim();
                        
                        const queueItem = this.parseQueueItem(buildingText, durationText, completionText);
                        if (queueItem) {
                            queueData.push(queueItem);
                        }
                    }
                });
                
            } catch (error) {
                console.error('❌ Failed to extract queue from document:', error);
            }
            
            return queueData;
        }

        /**
         * Parse queue item from text
         * @param {string} buildingText - Building text
         * @param {string} durationText - Duration text
         * @param {string} completionText - Completion text
         * @returns {object|null} Parsed queue item
         */
        static parseQueueItem(buildingText, durationText, completionText) {
            try {
                // Extract building name and level
                const buildingMatch = buildingText.match(/(\w+)\s+.*Level\s+(\d+)/i);
                if (!buildingMatch) return null;
                
                const buildingName = buildingMatch[1].toLowerCase();
                const targetLevel = parseInt(buildingMatch[2]);
                
                return {
                    building: this.mapBuildingName(buildingName),
                    target_level: targetLevel,
                    duration: durationText,
                    completion: completionText,
                    status: 'in_progress'
                };
                
            } catch (error) {
                console.error('❌ Failed to parse queue item:', error);
                return null;
            }
        }

        /**
         * Map building name to standard format
         * @param {string} buildingName - Building name
         * @returns {string} Standardized building name
         */
        static mapBuildingName(buildingName) {
            const buildingMap = {
                'main': 'main',
                'barracks': 'barracks',
                'stable': 'stable',
                'garage': 'garage',
                'watchtower': 'watchtower',
                'snob': 'snob',
                'smith': 'smith',
                'place': 'place',
                'market': 'market',
                'wood': 'wood',
                'stone': 'stone',
                'iron': 'iron',
                'farm': 'farm',
                'storage': 'storage',
                'hide': 'hide',
                'wall': 'wall'
            };
            
            return buildingMap[buildingName] || buildingName;
        }
    }

    // =============================================================================
    // 🗄️ DATABASE SYSTEM
    // =============================================================================

    class SimpleDB {
        static DATABASE_NAME = "Auto Builder";
        
        static saveVillage(villageId, villageData) {
            try {
                const key = `village_${villageId}`;
                localStorage.setItem(key, JSON.stringify({
                    data: villageData,
                    timestamp: Date.now()
                }));
                console.log(`💾 Saved village ${villageId} data`);
                return true;
            } catch (error) {
                console.error('❌ Failed to save village data:', error);
                return false;
            }
        }
        
        static loadVillage(villageId) {
            try {
                const key = `village_${villageId}`;
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : null;
            } catch (error) {
                console.error('❌ Failed to load village data:', error);
                return null;
            }
        }
        
        static loadDatabase() {
            const database = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('village_')) {
                    const villageId = key.replace('village_', '');
                    database[villageId] = this.loadVillage(villageId);
                }
            }
            return database;
        }
        
        static getAllVillages() {
            return this.loadDatabase();
        }
        
        static getVillage(villageId) {
            const data = this.loadVillage(villageId);
            return data ? data.data : null;
        }
    }

    // =============================================================================
    // 🔍 DATA COLLECTION FUNCTIONS
    // =============================================================================

    async function getInfo() {
        const villageId = game_data.village.id;
        const villageName = game_data.village.name;
        const coords = `${game_data.village.x}|${game_data.village.y}`;
        
        console.log(`🔍 Getting info for village ${villageId} (${villageName}) at ${coords}`);
        
        try {
            // Try comprehensive data collection first
            if (typeof window.collectComprehensiveData === 'function') {
                console.log('🎯 Using comprehensive data collector...');
                const comprehensiveData = await window.collectComprehensiveData(villageId);
                if (comprehensiveData) {
                    console.log('✅ Comprehensive data collected successfully!');
                    return comprehensiveData;
                }
            }
            
            // Fallback to basic data collection
            console.log('🔄 Using basic data collector...');
            const basicData = await DataCollector.collectAllData();
            if (basicData) {
                console.log('✅ Basic data collected successfully!');
                return basicData;
            }
            
            console.log('❌ No data collected');
            return null;
            
        } catch (error) {
            console.error('❌ Error getting village info:', error);
            return null;
        }
    }

    function showInfo() {
        getInfo().then(data => {
            if (data) {
                console.log('📊 Village Data:', data);
                
                // Show in UI if available
                if (typeof UI !== 'undefined' && UI.SuccessMessage) {
                    UI.SuccessMessage('✅ Village data collected successfully!');
                }
            } else {
                console.log('❌ No village data available');
                
                if (typeof UI !== 'undefined' && UI.ErrorMessage) {
                    UI.ErrorMessage('❌ Failed to collect village data');
                }
            }
        });
    }

    // =============================================================================
    // 🔄 AUTO REFRESH SYSTEM
    // =============================================================================

    function scheduleVillageDataRefresh() {
        async function refreshAll(showMsg) {
            try {
                console.log('🔄 Refreshing village data...');
                
                // Try comprehensive data collection
                if (typeof window.collectComprehensiveData === 'function') {
                    const villageId = game_data.village.id;
                    const comprehensiveData = await window.collectComprehensiveData(villageId);
                    if (comprehensiveData) {
                        console.log('✅ Comprehensive data refreshed successfully!');
                        if (showMsg && typeof UI !== 'undefined' && UI.SuccessMessage) {
                            UI.SuccessMessage('✅ Village data refreshed with comprehensive collector!');
                        }
                        return;
                    }
                }
                
                // Fallback to basic collection
                const data = await getInfo();
                if (data) {
                    console.log('✅ Basic data refreshed successfully!');
                    if (showMsg && typeof UI !== 'undefined' && UI.SuccessMessage) {
                        UI.SuccessMessage('✅ Village data refreshed!');
                    }
                }
                
            } catch (error) {
                console.error('❌ Error refreshing village data:', error);
                if (showMsg && typeof UI !== 'undefined' && UI.ErrorMessage) {
                    UI.ErrorMessage('❌ Failed to refresh village data');
                }
            }
        }
        
        return refreshAll;
    }

    // =============================================================================
    // 🏗️ MAIN AUTO BUILDER SYSTEM
    // =============================================================================

    function initializeAutoBuilder() {
        console.log('🚀 Initializing Auto Builder...');
        
        // Load external components
        loadComprehensiveDataCollector();
        loadBuildingQueueLogic();
        
        // Wait a bit for components to load
        setTimeout(() => {
            try {
                // Initialize the main AutoBuilder class
                class AutoBuilder {
                    constructor() {
                        this.bot = null;
                        this.database = null;
                        this.settings = null;
                        this.ui = null;
                        this.enhancedDataManager = null;
                    }
                    
                    async init() {
                        console.log('🔧 Initializing AutoBuilder components...');
                        
                        // Initialize database
                        this.database = SimpleDB;
                        
                        // Initialize settings
                        this.settings = new Settings();
                        this.settings.init();
                        
                        // Initialize comprehensive integration
                        this.comprehensiveIntegration = new ComprehensiveIntegration();
                        await this.comprehensiveIntegration.init();
                        
                        // Initialize enhanced data manager
                        this.enhancedDataManager = new EnhancedDataManager();
                        this.enhancedDataManager.init();
                        
                        // Initialize bot
                        this.bot = new AutoBuildBot();
                        this.bot.init();
                        
                        // Initialize UI
                        this.ui = new SettingsPanel();
                        this.ui.init();
                        
                        console.log('✅ AutoBuilder initialized successfully!');
                        
                        // Show welcome message
                        if (typeof UI !== 'undefined' && UI.SuccessMessage) {
                            UI.SuccessMessage('🤖 Auto Builder loaded successfully! Check the settings panel to get started.');
                        }
                    }
                    
                    getBot() { return this.bot; }
                    getDatabase() { return this.database; }
                    getSettings() { return this.settings; }
                    getUI() { return this.ui; }
                    getEnhancedDataManager() { return this.enhancedDataManager; }
                    getComprehensiveIntegration() { return this.comprehensiveIntegration; }
                }
                
                // Create global instance
                window.AutoBuilder = new AutoBuilder();
                window.AutoBuilder.init();
                
            } catch (error) {
                console.error('❌ Error initializing AutoBuilder:', error);
            }
        }, 1000);
    }

    // =============================================================================
    // 🎛️ UI INJECTION
    // =============================================================================

    function injectAutoBuilderButton() {
        // Create the main button
        const button = document.createElement('div');
        button.id = 'auto-builder-button';
        button.innerHTML = `
            <div style="
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 9999;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 10px 15px;
                border-radius: 25px;
                cursor: pointer;
                font-family: Arial, sans-serif;
                font-size: 14px;
                font-weight: bold;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                transition: all 0.3s ease;
                user-select: none;
            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                🤖 Auto Builder
            </div>
        `;
        
        button.addEventListener('click', () => {
            if (window.AutoBuilder && window.AutoBuilder.getUI()) {
                window.AutoBuilder.getUI().toggle();
            } else {
                console.log('⚠️ AutoBuilder UI not ready yet');
            }
        });
        
        document.body.appendChild(button);
        console.log('🎛️ Auto Builder button injected');
    }

    // =============================================================================
    // 🚀 STARTUP
    // =============================================================================

    // Wait for page to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initializeAutoBuilder();
            injectAutoBuilderButton();
        });
    } else {
        initializeAutoBuilder();
        injectAutoBuilderButton();
    }

    // =============================================================================
    // 🌐 GLOBAL FUNCTIONS
    // =============================================================================

    // Make functions globally available
    window.getVillageInfo = getInfo;
    window.showVillageInfo = showInfo;
    window.refreshVillageData = scheduleVillageDataRefresh();
    
    // Enhanced data collection functions
    window.collectComprehensiveData = window.collectComprehensiveData || null;
    window.loadComprehensiveData = window.loadComprehensiveData || null;
    window.cleanupComprehensiveData = window.cleanupComprehensiveData || null;
    
    console.log('🚀 Auto Builder script loaded successfully!');
    console.log('📊 Available functions: getVillageInfo(), showVillageInfo(), refreshVillageData()');
    console.log('🤖 Auto Builder will initialize automatically');

})(); 
