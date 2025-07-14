/*
 * COMPREHENSIVE VILLAGE DATA COLLECTOR
 * ====================================
 * Collects troops, resources, and buildings data with security features
 * 
 * SECURITY FEATURES:
 * - Random delays (5-10 seconds) between requests
 * - Random data fetching from different pages to avoid patterns
 * - Overwrites old data instead of accumulating
 * - Timestamped data collection
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const DATA_TYPE = 'comprehensive';
const SCRIPT_NAME = 'Comprehensive Village Data Collector';

// Security settings
const MIN_DELAY = 5000; // 5 seconds minimum between requests
const MAX_DELAY = 10000; // 10 seconds maximum
const RANDOM_PAGES = [
    '/game.php?screen=overview',
    '/game.php?screen=map',
    '/game.php?screen=ally',
    '/game.php?screen=ranking'
];

// =============================================================================
// SHARED DATABASE SYSTEM
// =============================================================================

const DB_NAME = 'TribalWarsGameData';

// Get village-specific store name
function getVillageStoreName(villageId) {
    return `village_${villageId}`;
}

// Initialize shared database
function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = () => {
            // Stores are created on-demand
        };
    });
}

// Create/ensure village store exists
async function ensureVillageStore(villageId) {
    const db = await initDatabase();
    const storeName = getVillageStoreName(villageId);
    
    if (!db.objectStoreNames.contains(storeName)) {
        db.close();
        const currentVersion = db.version;
        const upgradeRequest = indexedDB.open(DB_NAME, currentVersion + 1);
        
        return new Promise((resolve, reject) => {
            upgradeRequest.onerror = () => reject(upgradeRequest.error);
            upgradeRequest.onsuccess = () => resolve(upgradeRequest.result);
            upgradeRequest.onupgradeneeded = (event) => {
                const upgradeDb = event.target.result;
                const store = upgradeDb.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('villageId', 'villageId', { unique: false });
                console.log(`✅ Created store: ${storeName}`);
            };
        });
    }
    return db;
}

// =============================================================================
// SECURITY & RATE LIMITING SYSTEM
// =============================================================================

let isRequestActive = false;
let lastRequestTime = 0;

// Safe wrapper for all requests with randomization
async function safeRequest(url, description = 'data') {
    // Wait if another request is active
    while (isRequestActive) {
        await sleep(100);
    }
    
    // Ensure minimum time between requests
    const timeSinceLastRequest = Date.now() - lastRequestTime;
    if (timeSinceLastRequest < MIN_DELAY) {
        const waitTime = MIN_DELAY - timeSinceLastRequest;
        console.log(`⏳ Waiting ${waitTime}ms before next request...`);
        await sleep(waitTime);
    }
    
    // Add random delay for security
    const randomDelay = Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY)) + MIN_DELAY;
    console.log(`🔒 Random delay: ${randomDelay}ms for ${description}`);
    await sleep(randomDelay);
    
    // Mark request as active
    isRequestActive = true;
    lastRequestTime = Date.now();
    
    try {
        console.log(`🌐 Fetching: ${description}`);
        const response = await fetch(url);
        const html = await response.text();
        
        // Add small random delay to look more human
        await sleep(800 + Math.random() * 1200); // 0.8-2 seconds
        
        const parser = new DOMParser();
        return parser.parseFromString(html, 'text/html');
        
    } catch (error) {
        console.error(`❌ Request failed for ${description}:`, error);
        return null;
    } finally {
        // Always release the lock
        isRequestActive = false;
    }
}

// Helper sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Random page fetcher for pattern avoidance
async function fetchRandomPage() {
    const randomPage = RANDOM_PAGES[Math.floor(Math.random() * RANDOM_PAGES.length)];
    console.log(`🎲 Fetching random page: ${randomPage}`);
    await safeRequest(randomPage, 'random page');
    console.log(`✅ Random page fetched (not saved)`);
}

// =============================================================================
// TROOPS DATA COLLECTION
// =============================================================================

async function collectTroopsData(villageId) {
    try {
        const url = `/game.php?village=${villageId}&screen=overview_villages&mode=units`;
        const doc = await safeRequest(url, 'troops data');
        
        if (!doc) return null;
        
        // Find the "total" row (has font-weight: bold)
        const totalRow = doc.querySelector('tr[style*="font-weight: bold"]');
        if (!totalRow) return null;
        
        // Extract troop counts from the total row
        const units = ['spear', 'sword', 'axe', 'spy', 'light', 'heavy', 'ram', 'catapult', 'snob', 'militia'];
        const cells = totalRow.querySelectorAll('.unit-item');
        const troops = {};
        
        units.forEach((unit, i) => {
            const cellText = cells[i]?.textContent?.trim() || '0';
            troops[unit] = parseInt(cellText);
        });
        
        console.log(`✅ Collected troops data for village ${villageId}`);
        return troops;
        
    } catch (error) {
        console.error('❌ Error collecting troops data:', error);
        return null;
    }
}

// =============================================================================
// RESOURCES DATA COLLECTION
// =============================================================================

async function collectResourcesData(villageId) {
    try {
        const url = `/game.php?village=${villageId}&screen=overview_villages&mode=prod`;
        const doc = await safeRequest(url, 'resources data');
        
        if (!doc) return null;
        
        const villages = [];
        
        // Find all village rows in the production table
        const villageRows = doc.querySelectorAll('#production_table tbody tr');
        
        villageRows.forEach(row => {
            try {
                const cells = row.querySelectorAll('td');
                if (cells.length < 6) return; // Skip incomplete rows
                
                // Extract village name and coordinates
                const villageNameCell = cells[1];
                const villageLink = villageNameCell.querySelector('a');
                const villageText = villageLink ? villageLink.textContent.trim() : villageNameCell.textContent.trim();
                
                // Extract village ID from link
                let currentVillageId = null;
                if (villageLink && villageLink.href) {
                    const match = villageLink.href.match(/village=(\d+)/);
                    currentVillageId = match ? match[1] : null;
                }
                
                // Extract coordinates from village name
                const coordMatch = villageText.match(/\((\d+\|\d+)\)/);
                const coordinates = coordMatch ? coordMatch[1] : 'Unknown';
                
                // Extract points
                const points = parseInt(cells[2].textContent.trim()) || 0;
                
                // Extract resources (wood, stone, iron)
                const resourcesCell = cells[3];
                const resourceSpans = resourcesCell.querySelectorAll('span.res');
                
                let wood = 0, stone = 0, iron = 0;
                if (resourceSpans.length >= 3) {
                    wood = parseInt(resourceSpans[0].textContent.replace(/\./g, '')) || 0;
                    stone = parseInt(resourceSpans[1].textContent.replace(/\./g, '')) || 0;
                    iron = parseInt(resourceSpans[2].textContent.replace(/\./g, '')) || 0;
                }
                
                // Extract warehouse capacity
                const warehouseCapacity = parseInt(cells[4].textContent.trim().replace(/\./g, '')) || 0;
                
                // Extract population (current/max)
                const populationCell = cells[6];
                const populationText = populationCell.textContent.trim();
                const popMatch = populationText.match(/(\d+)\/(\d+)/);
                
                let currentPop = 0, maxPop = 0;
                if (popMatch) {
                    currentPop = parseInt(popMatch[1]) || 0;
                    maxPop = parseInt(popMatch[2]) || 0;
                }
                
                villages.push({
                    villageId: currentVillageId,
                    name: villageText,
                    coordinates,
                    points,
                    resources: {
                        wood,
                        stone,
                        iron,
                        total: wood + stone + iron
                    },
                    warehouse: {
                        capacity: warehouseCapacity,
                        usage: Math.max(wood, stone, iron),
                        usagePercent: Math.round((Math.max(wood, stone, iron) / warehouseCapacity) * 100)
                    },
                    population: {
                        current: currentPop,
                        max: maxPop,
                        available: maxPop - currentPop,
                        usagePercent: Math.round((currentPop / maxPop) * 100)
                    }
                });
                
            } catch (error) {
                console.error('Error processing village row:', error);
            }
        });
        
        console.log(`✅ Collected resources data for ${villages.length} villages`);
        return villages;
        
    } catch (error) {
        console.error('❌ Error collecting resources data:', error);
        return null;
    }
}

// =============================================================================
// BUILDINGS DATA COLLECTION
// =============================================================================

async function collectBuildingsData(villageId) {
    try {
        const url = `/game.php?village=${villageId}&screen=overview_villages&mode=buildings`;
        const doc = await safeRequest(url, 'buildings data');
        
        if (!doc) return null;
        
        const results = {};
        
        // Find all village rows in the buildings table
        const villageRows = doc.querySelectorAll('#buildings_table tbody tr');
        
        if (villageRows.length === 0) {
            console.error('❌ No village rows found');
            return null;
        }
        
        // Building mapping based on table column order
        const buildingMapping = [
            'main',      // Headquarters
            'barracks',  // Barracks  
            'stable',    // Stable
            'garage',    // Workshop
            'watchtower', // Watchtower
            'snob',      // Academy
            'smith',     // Smithy
            'place',     // Rally point
            'market',    // Market
            'wood',      // Timber camp
            'stone',     // Clay pit
            'iron',      // Iron mine
            'farm',      // Farm
            'storage',   // Warehouse
            'hide',      // Hiding place
            'wall'       // Wall
        ];
        
        villageRows.forEach(row => {
            try {
                // Extract village ID from row ID
                const rowId = row.id; // format: v_16404
                const currentVillageId = rowId ? rowId.replace('v_', '') : null;
                
                if (!currentVillageId) {
                    console.warn('⚠️ Could not extract village ID from row');
                    return;
                }
                
                // Extract village info
                const villageInfo = {};
                const buildings = {};
                const queue = [];
                
                // Get village name and coordinates
                const nameCell = row.querySelector('.quickedit-label, .quickedit-content a');
                if (nameCell) {
                    const fullText = nameCell.textContent.trim();
                    const coordMatch = fullText.match(/\((\d+\|\d+)\)/);
                    const kMatch = fullText.match(/K(\d+)/);
                    
                    villageInfo.name = fullText.split('(')[0].trim();
                    villageInfo.coordinates = coordMatch ? coordMatch[1] : 'Unknown';
                    villageInfo.continent = kMatch ? kMatch[1] : 'Unknown';
                }
                
                // Get village points
                const pointsCell = row.querySelector('td:nth-child(4)');
                villageInfo.points = pointsCell ? parseInt(pointsCell.textContent.trim()) : 0;
                
                // Extract building levels from cells
                const allCells = row.querySelectorAll('td');
                
                buildingMapping.forEach((buildingType, index) => {
                    const cellIndex = index + 4; // Building data starts from 5th cell (index 4)
                    const cell = allCells[cellIndex];
                    
                    if (cell) {
                        // Handle hidden buildings (level 0)
                        if (cell.querySelector('.hidden')) {
                            buildings[buildingType] = 0;
                        } else {
                            const levelText = cell.textContent.trim();
                            buildings[buildingType] = parseInt(levelText) || 0;
                        }
                    } else {
                        buildings[buildingType] = 0;
                    }
                });
                
                // Extract construction queue
                const queueContainer = row.querySelector(`#building_order_${currentVillageId}`);
                
                if (queueContainer) {
                    const orderItems = queueContainer.querySelectorAll('.order');
                    
                    orderItems.forEach((order, index) => {
                        const queueIcon = order.querySelector('.queue_icon img');
                        
                        if (queueIcon) {
                            // Extract building type from image source
                            const imgSrc = queueIcon.src;
                            const buildingMatch = imgSrc.match(/buildings\/(\w+)\.webp/);
                            const buildingType = buildingMatch ? buildingMatch[1] : 'unknown';
                            
                            // Extract completion time from title
                            const title = queueIcon.title || '';
                            const timeMatch = title.match(/- (.+)$/);
                            const completionTime = timeMatch ? timeMatch[1].trim() : 'Unknown';
                            
                            // Extract order ID from cancel function
                            const cancelIcon = order.querySelector('.order-cancel-icon img');
                            let orderId = null;
                            if (cancelIcon) {
                                const onclickMatch = cancelIcon.getAttribute('onclick')?.match(/cancel_order\(\d+, (\d+)\)/);
                                orderId = onclickMatch ? parseInt(onclickMatch[1]) : null;
                            }
                            
                            queue.push({
                                position: index + 1,
                                buildingType: buildingType,
                                completionTime: completionTime,
                                orderId: orderId,
                                isDraggable: order.classList.contains('drag')
                            });
                        }
                    });
                }
                
                // Store results
                results[currentVillageId] = {
                    villageId: currentVillageId,
                    villageInfo: villageInfo,
                    buildings: buildings,
                    queue: queue,
                    queueLength: queue.length
                };
                
            } catch (error) {
                console.error('❌ Error processing village row:', error);
            }
        });
        
        console.log(`✅ Collected buildings data for ${Object.keys(results).length} villages`);
        return {
            villages: results,
            totalVillages: Object.keys(results).length,
            extractedAt: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ Error collecting buildings data:', error);
        return null;
    }
}

// =============================================================================
// MAIN DATA COLLECTION FUNCTION
// =============================================================================

async function collectVillageData(villageId = game_data.village.id) {
    console.log(`🎯 Starting comprehensive data collection for village ${villageId}...`);
    
    // Step 1: Random page fetch for pattern avoidance
    await fetchRandomPage();
    
    // Step 2: Collect troops data
    console.log(`⚔️ Collecting troops data...`);
    const troopsData = await collectTroopsData(villageId);
    
    // Step 3: Random page fetch
    await fetchRandomPage();
    
    // Step 4: Collect resources data
    console.log(`📦 Collecting resources data...`);
    const resourcesData = await collectResourcesData(villageId);
    
    // Step 5: Random page fetch
    await fetchRandomPage();
    
    // Step 6: Collect buildings data
    console.log(`🏗️ Collecting buildings data...`);
    const buildingsData = await collectBuildingsData(villageId);
    
    // Step 7: Final random page fetch
    await fetchRandomPage();
    
    // Combine all data
    const comprehensiveData = {
        villageId: villageId,
        villageName: game_data.village.name,
        coordinates: game_data.village.x + '|' + game_data.village.y,
        worldId: game_data.world,
        playerId: game_data.player.id,
        
        // Collected data
        troops: troopsData,
        resources: resourcesData,
        buildings: buildingsData,
        
        // Metadata
        extractedAt: new Date().toISOString(),
        serverTime: new Date().toISOString(),
        dataVersion: '1.0'
    };
    
    console.log(`✅ Comprehensive data collection completed for village ${villageId}`);
    return comprehensiveData;
}

// =============================================================================
// SAVE TO DATABASE (ALWAYS OVERWRITES OLD DATA)
// =============================================================================

async function saveToDatabase(villageId, collectedData) {
    try {
        const db = await ensureVillageStore(villageId);
        const storeName = getVillageStoreName(villageId);
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // ALWAYS DELETE ALL OLD COMPREHENSIVE DATA RECORDS FIRST
        console.log(`🗑️ Cleaning up old comprehensive data for village ${villageId}...`);
        
        const index = store.index('type');
        const oldRecords = await new Promise((resolve, reject) => {
            const request = index.openCursor();
            const records = [];
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.type === DATA_TYPE) {
                        records.push(cursor.primaryKey);
                    }
                    cursor.continue();
                } else {
                    resolve(records);
                }
            };
            request.onerror = () => reject(request.error);
        });
        
        // DELETE ALL OLD RECORDS
        if (oldRecords.length > 0) {
            for (const recordId of oldRecords) {
                await new Promise((resolve, reject) => {
                    const deleteRequest = store.delete(recordId);
                    deleteRequest.onsuccess = () => resolve();
                    deleteRequest.onerror = () => reject(deleteRequest.error);
                });
            }
            console.log(`🗑️ Deleted ${oldRecords.length} old comprehensive data records`);
        } else {
            console.log(`📭 No old comprehensive data found to delete`);
        }
        
        // SAVE ONLY THE NEWEST RECORD (FRESH DATA ONLY)
        const record = {
            type: DATA_TYPE,
            timestamp: new Date().toISOString(),
            villageId: villageId,
            worldId: game_data.world,
            playerId: game_data.player.id,
            data: collectedData
        };
        
        await new Promise((resolve, reject) => {
            const request = store.add(record);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        
        console.log(`💾 Saved FRESH comprehensive data for village ${villageId} (overwrote old data)`);
        
        // VERIFY ONLY ONE RECORD EXISTS
        const verifyRecords = await new Promise((resolve, reject) => {
            const request = index.openCursor();
            const records = [];
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.type === DATA_TYPE) {
                        records.push(cursor.primaryKey);
                    }
                    cursor.continue();
                } else {
                    resolve(records);
                }
            };
            request.onerror = () => reject(request.error);
        });
        
        if (verifyRecords.length === 1) {
            console.log(`✅ Verified: Only 1 comprehensive data record exists (no useless data)`);
        } else {
            console.warn(`⚠️ Warning: Found ${verifyRecords.length} comprehensive data records (should be 1)`);
        }
        
        return true;
        
    } catch (error) {
        console.error(`❌ Error saving comprehensive data:`, error);
        throw error;
    }
}

// =============================================================================
// DATA RETRIEVAL FUNCTIONS
// =============================================================================

// Load latest comprehensive data
async function loadLatestData(villageId = game_data.village.id) {
    try {
        const db = await initDatabase();
        const storeName = getVillageStoreName(villageId);
        
        if (!db.objectStoreNames.contains(storeName)) {
            console.log(`❌ No comprehensive data found for village ${villageId}`);
            return null;
        }
        
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index('timestamp');
        
        const result = await new Promise((resolve, reject) => {
            const request = index.openCursor(null, 'prev');
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.type === DATA_TYPE) {
                        resolve(cursor.value);
                    } else {
                        cursor.continue();
                    }
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
        
        return result;
        
    } catch (error) {
        console.error(`❌ Error loading comprehensive data:`, error);
        return null;
    }
}

// Clean up all comprehensive data for a village (emergency cleanup)
async function cleanupComprehensiveData(villageId = game_data.village.id) {
    try {
        const db = await ensureVillageStore(villageId);
        const storeName = getVillageStoreName(villageId);
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const index = store.index('type');
        const allRecords = await new Promise((resolve, reject) => {
            const request = index.openCursor();
            const records = [];
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.type === DATA_TYPE) {
                        records.push(cursor.primaryKey);
                    }
                    cursor.continue();
                } else {
                    resolve(records);
                }
            };
            request.onerror = () => reject(request.error);
        });
        
        if (allRecords.length > 0) {
            for (const recordId of allRecords) {
                await new Promise((resolve, reject) => {
                    const deleteRequest = store.delete(recordId);
                    deleteRequest.onsuccess = () => resolve();
                    deleteRequest.onerror = () => reject(deleteRequest.error);
                });
            }
            console.log(`🧹 Cleaned up ${allRecords.length} comprehensive data records for village ${villageId}`);
        } else {
            console.log(`📭 No comprehensive data found to clean up for village ${villageId}`);
        }
        
        return allRecords.length;
        
    } catch (error) {
        console.error(`❌ Error cleaning up comprehensive data:`, error);
        throw error;
    }
}

// =============================================================================
// DISPLAY FUNCTIONS
// =============================================================================

function displayComprehensiveData(dataRecord) {
    console.log(`\n=== ${SCRIPT_NAME.toUpperCase()} DATA ===`);
    console.log(`Village: ${dataRecord.villageId} (${dataRecord.data.coordinates})`);
    console.log(`Collected: ${new Date(dataRecord.timestamp).toLocaleString()}`);
    console.log(`World: ${dataRecord.worldId}, Player: ${dataRecord.playerId}`);
    
    const data = dataRecord.data;
    
    // Display troops
    if (data.troops) {
        console.log('\n--- TROOPS ---');
        Object.entries(data.troops).forEach(([unit, count]) => {
            if (count > 0) {
                console.log(`${unit}: ${count}`);
            }
        });
    }
    
    // Display resources
    if (data.resources && data.resources.length > 0) {
        console.log('\n--- RESOURCES ---');
        data.resources.forEach((village, index) => {
            console.log(`${index + 1}. ${village.name} (${village.coordinates})`);
            console.log(`   Resources: ${village.resources.wood} wood, ${village.resources.stone} stone, ${village.resources.iron} iron`);
            console.log(`   Warehouse: ${village.warehouse.usage}/${village.warehouse.capacity} (${village.warehouse.usagePercent}%)`);
            console.log(`   Population: ${village.population.current}/${village.population.max} (${village.population.usagePercent}%)`);
        });
    }
    
    // Display buildings
    if (data.buildings && data.buildings.villages) {
        console.log('\n--- BUILDINGS ---');
        Object.values(data.buildings.villages).forEach(village => {
            console.log(`${village.villageInfo.name} (${village.villageInfo.coordinates})`);
            
            // Show non-zero buildings
            const nonZeroBuildings = Object.entries(village.buildings)
                .filter(([_, level]) => level > 0)
                .map(([building, level]) => `${building}:${level}`)
                .join(', ');
            
            if (nonZeroBuildings) {
                console.log(`   Buildings: ${nonZeroBuildings}`);
            }
            
            if (village.queue.length > 0) {
                console.log(`   Queue (${village.queue.length}): ${village.queue.map(q => `${q.buildingType}@${q.completionTime}`).join(', ')}`);
            }
        });
    }
}

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

async function collectAndSave(villageId = game_data.village.id) {
    console.log(`Starting ${SCRIPT_NAME} for village ${villageId}...`);
    
    try {
        // Step 1: Collect comprehensive data
        const collectedData = await collectVillageData(villageId);
        
        if (!collectedData) {
            console.log(`❌ No comprehensive data collected`);
            return null;
        }
        
        // Step 2: Save to database (overwrites old data)
        await saveToDatabase(villageId, collectedData);
        
        // Step 3: Display results
        const savedRecord = await loadLatestData(villageId);
        if (savedRecord) {
            displayComprehensiveData(savedRecord);
        }
        
        // UI feedback
        if (typeof UI !== 'undefined' && UI.SuccessMessage) {
            UI.SuccessMessage(`✅ ${SCRIPT_NAME} completed for village ${villageId}!`);
        }
        
        return savedRecord;
        
    } catch (error) {
        console.error(`❌ Error in ${SCRIPT_NAME}:`, error);
        if (typeof UI !== 'undefined' && UI.ErrorMessage) {
            UI.ErrorMessage(`❌ ${SCRIPT_NAME} failed: ${error.message}`);
        }
        return null;
    }
}

// =============================================================================
// PUBLIC API
// =============================================================================

// Main collection function
window.collectComprehensiveData = collectAndSave;

// Load latest data
window.loadComprehensiveData = async function(villageId = game_data.village.id) {
    const data = await loadLatestData(villageId);
    if (data) {
        displayComprehensiveData(data);
        return data;
    } else {
        console.log(`❌ No saved comprehensive data found for village ${villageId}`);
        return null;
    }
};

// Emergency cleanup function
window.cleanupComprehensiveData = cleanupComprehensiveData;

// =============================================================================
// USAGE INSTRUCTIONS
// =============================================================================

console.log(`
${SCRIPT_NAME.toUpperCase()} - COMPREHENSIVE VILLAGE DATA COLLECTOR
${'='.repeat(SCRIPT_NAME.length + 40)}

🎯 DATA TYPES: Troops, Resources, Buildings
🔒 SECURITY: Random delays, pattern avoidance
💾 DATABASE: TribalWarsGameData (shared)
📂 STRUCTURE: village_${game_data.village.id} → {type: 'comprehensive', data: {...}}

📊 FUNCTIONS:
- collectComprehensiveData()                    - Collect and save all data types (OVERWRITES OLD DATA)
- loadComprehensiveData()                       - Load latest saved comprehensive data
- cleanupComprehensiveData()                    - Emergency cleanup of all comprehensive data

🔒 SECURITY FEATURES:
✅ Random delays (5-10 seconds) between requests
✅ Random page fetches to avoid detection patterns
✅ ALWAYS OVERWRITES old data (no accumulation)
✅ Verification ensures only 1 record exists
✅ Timestamped data collection

🚀 QUICK START:
collectComprehensiveData()                     // Collect and save all village data (FRESH DATA ONLY)
loadComprehensiveData()                        // View latest saved comprehensive data
cleanupComprehensiveData()                     // Emergency cleanup if needed

💾 DATABASE INTEGRATION:
✅ Uses same database as other village scripts
✅ ALWAYS OVERWRITES old comprehensive data
✅ Verification ensures no useless data accumulation
✅ Village-centric organization
✅ Timestamped historical tracking

🔄 OVERWRITE STRATEGY:
✅ Deletes ALL old comprehensive data before saving
✅ Saves only the newest/fresh data
✅ Verifies only 1 record exists after save
✅ No historical accumulation - always fresh data

Run from any Tribal Wars page!
`);

// =============================================================================
// AUTO-START OPTION (Uncomment to run automatically)
// =============================================================================

// Uncomment the line below to automatically collect data when script loads
// collectComprehensiveData(); 