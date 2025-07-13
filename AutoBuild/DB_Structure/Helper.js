/*
* Auto Builder - 2 Simple Commands
* Command 1: getInfo() - Get all information and save
* Command 2: showInfo() - Show saved information
*/

// =============================================================================
// 🔍 COMPLETE DATA COLLECTOR
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
            return null;
        }
    }

    /**
     * Map building names to standard format
     * @param {string} buildingName - Raw building name
     * @returns {string} Standard building name
     */
    static mapBuildingName(buildingName) {
        const mappings = {
            'clay': 'stone',
            'timber': 'wood',
            'iron': 'iron',
            'headquarters': 'main',
            'barracks': 'barracks',
            'stable': 'stable',
            'workshop': 'garage',
            'academy': 'snob',
            'smithy': 'smith',
            'marketplace': 'market',
            'wall': 'wall',
            'farm': 'farm',
            'warehouse': 'storage',
            'hiding': 'hide'
        };
        
        for (const [key, value] of Object.entries(mappings)) {
            if (buildingName.toLowerCase().includes(key)) {
                return value;
            }
        }
        
        return buildingName.toLowerCase();
    }
}

// =============================================================================
// 🗄️ SIMPLE DATABASE MANAGER
// =============================================================================

/**
 * Simple Database Manager for Auto Builder
 */
class SimpleDB {
    
    static DATABASE_NAME = "Auto Builder";
    
    /**
     * Save village data to database
     * @param {string} villageId - Village ID
     * @param {object} villageData - Complete village data
     * @returns {boolean} Success status
     */
    static saveVillage(villageId, villageData) {
        try {
            // Load existing database
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

// =============================================================================
// 🎯 THE 2 SIMPLE COMMANDS
// =============================================================================

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

// Helper: Wait for page load and game_data
function waitForPageLoad(timeout = 10000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        function check() {
            if (document.readyState === 'complete' && typeof game_data !== 'undefined' && game_data.village) {
                resolve();
            } else if (Date.now() - start > timeout) {
                reject(new Error('Timeout waiting for page load'));
            } else {
                setTimeout(check, 100);
            }
        }
        check();
    });
}

// Helper: Sleep for a random time between minMs and maxMs
function sleepRandom(minMs = 500, maxMs = 2000) {
    const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Get all village IDs (DB first, fallback to manual)
function getAllVillageIds() {
    if (window.SimpleDB && typeof window.SimpleDB.getAllVillages === 'function') {
        const allVillages = window.SimpleDB.getAllVillages();
        const ids = Object.keys(allVillages);
        if (ids.length > 0) return ids;
    }
    // Fallback: manually provide your village IDs here
    return [
        "12345", // Replace with your actual village IDs
        // "23456",
        // "34567"
    ];
}

// Main: Refresh all villages
async function refreshAllVillages() {
    const villageIds = getAllVillageIds();
    const originalVillage = game_data.village.id.toString();
    for (const villageId of villageIds) {
        if (villageId === originalVillage) {
            await getInfo();
        } else {
            window.location.href = `game.php?village=${villageId}&screen=main`;
            await waitForPageLoad();
            await getInfo();
        }
        await sleepRandom(500, 2000);
    }
    // Optionally, return to the original village
    window.location.href = `game.php?village=${originalVillage}&screen=main`;
}

// =============================================================================
// 🏁 AUTO-INITIALIZATION
// =============================================================================

// Initialize when script loads
if (typeof game_data !== 'undefined' && game_data.village) {
    console.log('🏰 Auto Builder - 2 Simple Commands loaded!');
    console.log('');
    console.log('🎯 AVAILABLE COMMANDS:');
    console.log('• getInfo() - Get all information and save it');
    console.log('• showInfo() - Show saved information');
    console.log('');
    console.log('💡 Usage: Run getInfo() first, then showInfo() to see results');
}