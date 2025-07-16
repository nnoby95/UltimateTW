// ==UserScript==
// @name         Tribal Wars Auto Builder
// @version      1.0.0
// @description  Automated building system for Tribal Wars with clean database architecture
// @author       Your Name
// @include      https://*.klanhaboru.hu/*
// @include      https://*.tribalwars.net/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/src/database/DatabaseManager.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/src/database/DataCollector.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/src/database/EnhancedDataManager.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/src/integration/ComprehensiveIntegration.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/src/bot/SmartBuildCalculator.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/src/bot/AutoBuildBot.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/src/bot/ResourceMonitor.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/src/bot/QueueManager.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/src/ui/SettingsPanel.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/src/ui/BuildQueueUI.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/src/ui/VillageManager.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/src/ui/TemplateManager.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/src/utils/DataHelper.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/src/utils/BuildingCosts.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/src/utils/TimeUtils.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/src/utils/GameUtils.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/src/config/Settings.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/Autobuild-1.0/src/config/BuildingConfig.js
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
        
        // Create a basic comprehensive data collector if not available externally
        console.log('🔧 Creating basic comprehensive data collector...');
        
        window.collectComprehensiveData = async function(villageId) {
            console.log(`🔍 Collecting comprehensive data for village ${villageId}...`);
            
            try {
                // Use the existing DataCollector as fallback
                const data = await DataCollector.collectAllData();
                
                if (data) {
                    // Transform to comprehensive format
                    const comprehensiveData = {
                        villageId: villageId,
                        villageName: game_data.village.name,
                        coordinates: game_data.village.x + '|' + game_data.village.y,
                        worldId: game_data.world,
                        playerId: game_data.player.id,
                        
                        // Transform existing data
                        troops: extractTroopsFromData(data),
                        resources: extractResourcesFromData(data),
                        buildings: extractBuildingsFromData(data),
                        
                        // Metadata
                        extractedAt: new Date().toISOString(),
                        serverTime: new Date().toISOString(),
                        dataVersion: '1.0-fallback'
                    };
                    
                    console.log('✅ Comprehensive data collected successfully!');
                    return comprehensiveData;
                }
                
                return null;
                
            } catch (error) {
                console.error('❌ Error collecting comprehensive data:', error);
                return null;
            }
        };
        
        // Helper functions for data extraction
        function extractTroopsFromData(data) {
            return data.troops || {};
        }
        
        function extractResourcesFromData(data) {
            return data.resources || {};
        }
        
        function extractBuildingsFromData(data) {
            return data.buildings || {};
        }
        
        console.log('✅ Basic comprehensive data collector created');
        return true;
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
        
        // Define the class directly if not available externally
        console.log('🔧 Creating TribalWarsBuildingQueueLogic class...');
        
        window.TribalWarsBuildingQueueLogic = class TribalWarsBuildingQueueLogic {
            constructor() {
                this.csrfToken = null;
                this.lastTokenUpdate = 0;
                this.tokenLifetime = 5 * 60 * 1000; // 5 minutes
            }

            /**
             * Get CSRF token from the main page
             * @param {string} villageId - Village ID
             * @returns {Promise<string>} CSRF token
             */
            async getCSRFToken(villageId) {
                try {
                    console.log('🔑 Fetching CSRF token...');
                    
                    const response = await fetch(`game.php?village=${villageId}&screen=main`);
                    const html = await response.text();
                    
                    // Extract CSRF token from HTML
                    const csrfMatch = html.match(/game_data\.csrf\s*=\s*['"]([^'"]+)['"]/);
                    const csrf = csrfMatch ? csrfMatch[1] : null;
                    
                    if (csrf) {
                        this.csrfToken = csrf;
                        this.lastTokenUpdate = Date.now();
                        console.log('✅ CSRF Token obtained:', csrf.substring(0, 10) + '...');
                        return csrf;
                    } else {
                        console.error('❌ CSRF token not found in HTML');
                        return null;
                    }
                    
                } catch (error) {
                    console.error('❌ Failed to get CSRF token:', error);
                    return null;
                }
            }

            /**
             * Check if current token is still valid
             * @returns {boolean} Token validity
             */
            isTokenValid() {
                if (!this.csrfToken) return false;
                
                const timeSinceUpdate = Date.now() - this.lastTokenUpdate;
                return timeSinceUpdate < this.tokenLifetime;
            }

            /**
             * Get valid CSRF token (refresh if needed)
             * @param {string} villageId - Village ID
             * @returns {Promise<string>} Valid CSRF token
             */
            async getValidCSRFToken(villageId) {
                if (this.isTokenValid()) {
                    console.log('✅ Using cached CSRF token');
                    return this.csrfToken;
                }
                
                console.log('🔄 CSRF token expired, refreshing...');
                return await this.getCSRFToken(villageId);
            }

            /**
             * Add building to queue - MAIN LOGIC
             * @param {string} villageId - Village ID
             * @param {string} buildingId - Building ID (e.g., "main", "barracks", "stable")
             * @returns {Promise<boolean>} Success status
             */
            async addBuildingToQueue(villageId, buildingId) {
                try {
                    console.log(`🏗️ Adding ${buildingId} to queue in village ${villageId}...`);
                    
                    // Step 1: Get valid CSRF token
                    const csrf = await this.getValidCSRFToken(villageId);
                    if (!csrf) {
                        console.error('❌ No valid CSRF token available');
                        return false;
                    }
                    
                    // Step 2: Build the request URL (exact format from TribalWars)
                    const url = `game.php?village=${villageId}&screen=main&action=upgrade_building&id=${buildingId}&type=main&h=${csrf}`;
                    
                    console.log(`🌐 Making building request: ${url}`);
                    
                    // Step 3: Make the request
                    const response = await fetch(url);
                    const result = await response.text();
                    
                    // Step 4: Check if successful
                    const success = !result.includes('error') && !result.includes('Error');
                    
                    if (success) {
                        console.log(`✅ Successfully added ${buildingId} to queue!`);
                    } else {
                        console.log(`❌ Failed to add ${buildingId} to queue`);
                        console.log('Response preview:', result.substring(0, 200));
                    }
                    
                    return success;
                    
                } catch (error) {
                    console.error('❌ Error adding building to queue:', error);
                    return false;
                }
            }

            /**
             * Remove building from active queue
             * @param {string} villageId - Village ID
             * @param {string} cancelId - Cancel ID from queue
             * @returns {Promise<boolean>} Success status
             */
            async removeBuildingFromQueue(villageId, cancelId) {
                try {
                    console.log(`🗑️ Removing building ${cancelId} from queue...`);
                    
                    // Get valid CSRF token
                    const csrf = await this.getValidCSRFToken(villageId);
                    if (!csrf) {
                        console.error('❌ No valid CSRF token available');
                        return false;
                    }
                    
                    // Build the request (exact format from TribalWars)
                    const url = `game.php?village=${villageId}&screen=main&ajaxaction=cancel_order&type=main`;
                    const body = `id=${cancelId}&destroy=0&h=${csrf}`;
                    
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            'Tribalwars-Ajax': '1',
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        body: body
                    });
                    
                    const success = response.ok;
                    
                    if (success) {
                        console.log(`✅ Successfully removed building from queue!`);
                    } else {
                        console.log(`❌ Failed to remove building from queue`);
                    }
                    
                    return success;
                    
                } catch (error) {
                    console.error('❌ Error removing building from queue:', error);
                    return false;
                }
            }

            /**
             * Get current building queue status
             * @param {string} villageId - Village ID
             * @returns {Promise<Object>} Queue status
             */
            async getQueueStatus(villageId) {
                try {
                    console.log('📋 Getting current building queue status...');
                    
                    const response = await fetch(`game.php?village=${villageId}&screen=main`);
                    const html = await response.text();
                    
                    // Parse queue from HTML
                    const queueItems = [];
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    
                    // Find queue elements (adjust selectors based on TribalWars HTML structure)
                    const queueElements = doc.querySelectorAll('.queue-item, .building-queue-item, [class*="queue"]');
                    
                    queueElements.forEach((element, index) => {
                        const buildingName = element.querySelector('.building-name, [class*="building"]')?.textContent || 'Unknown';
                        const timeLeft = element.querySelector('.time-left, [class*="time"]')?.textContent || '';
                        
                        queueItems.push({
                            index: index,
                            building: buildingName,
                            timeLeft: timeLeft
                        });
                    });
                    
                    const queueStatus = {
                        count: queueItems.length,
                        maxCapacity: 5, // TribalWars allows max 5 buildings in queue
                        hasSpace: queueItems.length < 5,
                        items: queueItems
                    };
                    
                    console.log(`📊 Queue status: ${queueItems.length}/5 items`);
                    return queueStatus;
                    
                } catch (error) {
                    console.error('❌ Error getting queue status:', error);
                    return { count: 0, maxCapacity: 5, hasSpace: true, items: [] };
                }
            }

            /**
             * Check if queue has space
             * @param {string} villageId - Village ID
             * @returns {Promise<boolean>} Has space
             */
            async hasQueueSpace(villageId) {
                try {
                    const status = await this.getQueueStatus(villageId);
                    return status.hasSpace;
                } catch (error) {
                    console.error('❌ Error checking queue space:', error);
                    return false;
                }
            }
        };
        
        console.log('✅ TribalWarsBuildingQueueLogic class created');
        return true;
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
                        this.settings.load();
                        
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
