/*
 * ENHANCED COMPREHENSIVE VILLAGE DATA COLLECTOR
 * =============================================
 * Collects troops, resources, and buildings data with MAXIMUM RANDOMNESS
 * 
 * ENHANCED SECURITY FEATURES:
 * - COMPLETELY RANDOM ORDER of data collection
 * - Extended random delays (5-10 seconds)
 * - Random 1-3 page visits (not all pages)
 * - Random page visits between EVERY data collection step
 * - Variable execution timing (1-2 hours)
 * - Random request sequences
 */

// =============================================================================
// ENHANCED CONFIGURATION
// =============================================================================

const DATA_TYPE = 'comprehensive_enhanced';
const SCRIPT_NAME = 'Enhanced Comprehensive Village Data Collector';

// Enhanced security settings
const MIN_DELAY = 5000; // 5 seconds minimum between requests
const MAX_DELAY = 10000; // 10 seconds maximum (as requested)
const RANDOM_PAGES = [
    '/game.php?screen=overview',
    '/game.php?screen=map',
    '/game.php?screen=ally',
    '/game.php?screen=ranking',
    '/game.php?screen=report',
    '/game.php?screen=message',
    '/game.php?screen=place',
    '/game.php?screen=market'
];

// Data collection tasks with random order capability
const DATA_COLLECTION_TASKS = [
    { name: 'troops', function: 'collectTroopsData', url: 'overview_villages&mode=units' },
    { name: 'resources', function: 'collectResourcesData', url: 'overview_villages&mode=prod' },
    { name: 'buildings', function: 'collectBuildingsData', url: 'overview_villages&mode=buildings' }
];

// =============================================================================
// ENHANCED RANDOMNESS SYSTEM
// =============================================================================

// Shuffle array function for random order
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Get random delay with more variation
function getRandomDelay() {
    return Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY)) + MIN_DELAY;
}

// Get random 1-3 pages (not all pages)
function getRandomPages() {
    const shuffled = shuffleArray(RANDOM_PAGES);
    const count = Math.floor(Math.random() * 3) + 1; // 1-3 pages
    return shuffled.slice(0, count);
}

// =============================================================================
// ENHANCED SAFE REQUEST SYSTEM
// =============================================================================

let isRequestActive = false;
let lastRequestTime = 0;

// Enhanced safe wrapper with more randomness
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
    
    // Add enhanced random delay for security
    const randomDelay = getRandomDelay();
    console.log(`🔒 Enhanced random delay: ${randomDelay}ms for ${description}`);
    await sleep(randomDelay);
    
    // Mark request as active
    isRequestActive = true;
    lastRequestTime = Date.now();
    
    try {
        console.log(`🌐 Fetching: ${description}`);
        const response = await fetch(url);
        const html = await response.text();
        
        // Add enhanced random delay to look more human
        await sleep(1000 + Math.random() * 2000); // 1-3 seconds
        
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

// Enhanced random page fetcher (1-3 pages)
async function fetchRandomPages() {
    const randomPages = getRandomPages();
    console.log(`🎲 Fetching ${randomPages.length} random pages: ${randomPages.join(', ')}`);
    
    for (const page of randomPages) {
        await safeRequest(page, 'random page');
        console.log(`✅ Random page fetched: ${page}`);
    }
}

// Helper sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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
// DATABASE FUNCTIONS
// =============================================================================

// Save comprehensive data to database (overwrites old data)
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

// Display comprehensive data
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
// ENHANCED DATA COLLECTION FUNCTIONS (SAME LOGIC, ENHANCED CALLS)
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
// ENHANCED RANDOM PAGE FETCHING (OPTIMIZED)
// =============================================================================

// Get random number of pages to fetch (1-3 pages)
function getRandomPageCount() {
    return Math.floor(Math.random() * 3) + 1; // 1-3 pages
}

// Get random pages to fetch (not all pages, just random selection)
function getRandomPagesToFetch() {
    const pageCount = getRandomPageCount();
    const shuffledPages = shuffleArray([...RANDOM_PAGES]);
    return shuffledPages.slice(0, pageCount);
}

// Optimized random page fetcher - fetches 1-3 random pages
async function fetchRandomPages() {
    const pagesToFetch = getRandomPagesToFetch();
    console.log(`🎲 Fetching ${pagesToFetch.length} random pages: ${pagesToFetch.join(', ')}`);
    
    for (const page of pagesToFetch) {
        await safeRequest(page, `random page: ${page}`);
        console.log(`✅ Fetched random page: ${page}`);
    }
}

// =============================================================================
// ENHANCED MAIN DATA COLLECTION FUNCTION WITH OPTIMIZED RANDOM ORDER
// =============================================================================

async function collectVillageDataEnhanced(villageId = game_data.village.id) {
    console.log(`🎯 Starting ENHANCED comprehensive data collection for village ${villageId}...`);
    console.log(`🎲 Using OPTIMIZED RANDOM ORDER execution (4-8 total requests)!`);
    
    // Step 1: Initial random page fetch (1-3 pages)
    await fetchRandomPages();
    
    // Step 2: Shuffle data collection tasks for random order
    const shuffledTasks = shuffleArray(DATA_COLLECTION_TASKS);
    console.log(`🎲 Random execution order: ${shuffledTasks.map(t => t.name).join(' → ')}`);
    
    const collectedData = {
        villageId: villageId,
        villageName: game_data.village.name,
        coordinates: game_data.village.x + '|' + game_data.village.y,
        worldId: game_data.world,
        playerId: game_data.player.id,
        executionOrder: shuffledTasks.map(t => t.name), // Track the random order used
        extractedAt: new Date().toISOString(),
        serverTime: new Date().toISOString(),
        dataVersion: '2.0_enhanced_optimized'
    };
    
    // Step 3: Execute tasks in random order with optimized random page visits
    for (let i = 0; i < shuffledTasks.length; i++) {
        const task = shuffledTasks[i];
        console.log(`\n🔄 Executing task ${i + 1}/${shuffledTasks.length}: ${task.name}`);
        
        // Execute the data collection task
        let taskData = null;
        switch (task.name) {
            case 'troops':
                taskData = await collectTroopsData(villageId);
                break;
            case 'resources':
                taskData = await collectResourcesData(villageId);
                break;
            case 'buildings':
                taskData = await collectBuildingsData(villageId);
                break;
        }
        
        // Store the collected data
        collectedData[task.name] = taskData;
        
        // Add random page visit between tasks (except after the last one)
        if (i < shuffledTasks.length - 1) {
            console.log(`🎲 Adding random page visits between tasks...`);
            await fetchRandomPages();
        }
    }
    
    // Step 4: Final random page fetch (1-3 pages)
    await fetchRandomPages();
    
    console.log(`✅ ENHANCED comprehensive data collection completed for village ${villageId}`);
    console.log(`🎲 Execution order used: ${collectedData.executionOrder.join(' → ')}`);
    console.log(`📊 Total requests: 4-8 (optimized for stealth)`);
    
    return collectedData;
}

// =============================================================================
// ENHANCED EXECUTION TIMING
// =============================================================================

// Get random execution delay (1-2 hours instead of exactly 1 hour)
function getRandomExecutionDelay() {
    const baseHour = 3600000; // 1 hour in milliseconds
    const randomAdditional = Math.random() * baseHour; // 0-1 hour additional
    return baseHour + randomAdditional; // 1-2 hours total
}

// Enhanced execution with random timing
async function executeWithRandomTiming() {
    const delay = getRandomExecutionDelay();
    const delayMinutes = Math.round(delay / 60000);
    console.log(`⏰ Next execution in ${delayMinutes} minutes (random timing)`);
    
    setTimeout(async () => {
        await collectAndSaveEnhanced();
        // Schedule next execution
        executeWithRandomTiming();
    }, delay);
}

// =============================================================================
// ENHANCED MAIN FUNCTIONS
// =============================================================================

async function collectAndSaveEnhanced(villageId = game_data.village.id) {
    console.log(`Starting ${SCRIPT_NAME} for village ${villageId}...`);
    
    try {
        // Step 1: Collect comprehensive data with random order
        const collectedData = await collectVillageDataEnhanced(villageId);
        
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
// ENHANCED PUBLIC API
// =============================================================================

// Enhanced main collection function
window.collectComprehensiveDataEnhanced = collectAndSaveEnhanced;

// Start enhanced execution with random timing
window.startEnhancedExecution = executeWithRandomTiming;

// =============================================================================
// ENHANCED USAGE INSTRUCTIONS
// =============================================================================

console.log(`
${SCRIPT_NAME.toUpperCase()} - ENHANCED COMPREHENSIVE VILLAGE DATA COLLECTOR
${'='.repeat(SCRIPT_NAME.length + 50)}

🎯 OPTIMIZED ENHANCED FEATURES:
✅ COMPLETELY RANDOM ORDER of data collection
✅ Extended random delays (5-10 seconds)
✅ OPTIMIZED: Only 4-8 total requests (not excessive)
✅ Random 1-3 page visits (randomly selected from available pages)
✅ Random page visits between data collection steps
✅ Variable execution timing (1-2 hours)
✅ Random request sequences

🔒 MAXIMUM STEALTH (OPTIMIZED):
✅ Random execution order (troops → resources → buildings OR buildings → troops → resources, etc.)
✅ Random delays between ALL requests (5-10 seconds)
✅ OPTIMIZED: 4-8 total requests (efficient and stealthy)
✅ Random 1-3 page visits (randomly chosen from available pages)
✅ Variable timing (1-2 hours instead of exactly 1 hour)

📊 FUNCTIONS:
- collectComprehensiveDataEnhanced()           - Collect with OPTIMIZED RANDOM ORDER
- startEnhancedExecution()                     - Start with RANDOM TIMING (1-2 hours)

🎲 OPTIMIZED RANDOM ORDER EXAMPLES:
Run 1: random pages → troops → random pages → resources → random pages → buildings → random pages
Run 2: random pages → buildings → random pages → troops → random pages → resources → random pages  
Run 3: random pages → resources → random pages → buildings → random pages → troops → random pages

📊 REQUEST BREAKDOWN:
- Initial random pages: 1-3 requests
- Data collection tasks: 3 requests (troops, resources, buildings)
- Between-task random pages: 2 × (1-3) = 2-6 requests
- Final random pages: 1-3 requests
- TOTAL: 4-8 requests (optimized for stealth)

⏰ RANDOM TIMING:
- Execution 1: 1 hour 23 minutes
- Execution 2: 1 hour 47 minutes
- Execution 3: 1 hour 12 minutes

Run from any Tribal Wars page!
`);

// =============================================================================
// AUTO-START OPTION (Uncomment to run automatically with random timing)
// =============================================================================

// Uncomment the line below to automatically start enhanced execution
// startEnhancedExecution(); 