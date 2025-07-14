/*
 * TRIBAL WARS BUILDINGS & QUEUE EXTRACTOR
 * =======================================
 * Extracts building levels and construction queue using DOM scraping
 * Method: Safe DOM scraping with rate limiting
 */

// =============================================================================
// GLOBAL RATE LIMITING SYSTEM
// =============================================================================

let isRequestActive = false;
let lastRequestTime = 0;
const MIN_DELAY_BETWEEN_REQUESTS = 3000; // 3 seconds minimum

// Safe wrapper for all requests
async function safeRequest(url) {
    // Wait if another request is active
    while (isRequestActive) {
        await sleep(100); // Check every 100ms
    }
    
    // Ensure minimum time between requests
    const timeSinceLastRequest = Date.now() - lastRequestTime;
    if (timeSinceLastRequest < MIN_DELAY_BETWEEN_REQUESTS) {
        const waitTime = MIN_DELAY_BETWEEN_REQUESTS - timeSinceLastRequest;
        console.log(`⏳ Waiting ${waitTime}ms before next request...`);
        await sleep(waitTime);
    }
    
    // Mark request as active
    isRequestActive = true;
    lastRequestTime = Date.now();
    
    try {
        console.log(`🌐 Fetching: ${url}`);
        const response = await fetch(url);
        const html = await response.text();
        
        // Add small random delay to look more human
        await sleep(800 + Math.random() * 1200); // 0.8-2 seconds
        
        const parser = new DOMParser();
        return parser.parseFromString(html, 'text/html');
        
    } catch (error) {
        console.error('❌ Request failed:', error);
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

// =============================================================================
// MAIN EXTRACTION FUNCTION
// =============================================================================

/**
 * Extract buildings and queue data - works for single or multiple villages
 * @param {string} villageId - Target village ID (optional, defaults to current village)
 * @returns {Object} Complete building and queue data
 */
async function getBuildingsAndQueue(villageId = game_data.village.id) {
    const url = `/game.php?village=${villageId}&screen=overview_villages&mode=buildings`;
    const doc = await safeRequest(url);
    
    if (!doc) {
        console.error('❌ Failed to load buildings page');
        return null;
    }
    
    console.log(`🏗️ Processing buildings data...`);
    
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
            
            console.log(`✅ ${villageInfo.name} (${villageInfo.coordinates}) - ${queue.length} items in queue`);
            
        } catch (error) {
            console.error('❌ Error processing village row:', error);
        }
    });
    
    const totalVillages = Object.keys(results).length;
    console.log(`🎉 Extracted data from ${totalVillages} villages!`);
    
    return {
        villages: results,
        totalVillages: totalVillages,
        extractedAt: new Date().toISOString()
    };
}

// =============================================================================
// DISPLAY FUNCTION
// =============================================================================

/**
 * Display building data in a readable format
 */
function displayBuildingData(data) {
    if (!data || !data.villages) {
        console.log('❌ No data to display');
        return;
    }
    
    console.log(`\n🏘️ === VILLAGE OVERVIEW (${data.totalVillages} villages) ===`);
    console.log(`📅 Extracted: ${new Date(data.extractedAt).toLocaleString()}\n`);
    
    Object.values(data.villages).forEach(village => {
        console.log(`🏠 ${village.villageInfo.name} (${village.villageInfo.coordinates}) K${village.villageInfo.continent}`);
        console.log(`   ⭐ Points: ${village.villageInfo.points}`);
        
        // Show non-zero buildings
        const nonZeroBuildings = Object.entries(village.buildings)
            .filter(([_, level]) => level > 0)
            .map(([building, level]) => `${building}:${level}`)
            .join(', ');
        
        if (nonZeroBuildings) {
            console.log(`   🏗️ Buildings: ${nonZeroBuildings}`);
        }
        
        if (village.queue.length > 0) {
            console.log(`   🚧 Queue (${village.queue.length}): ${village.queue.map(q => `${q.buildingType}@${q.completionTime}`).join(', ')}`);
        } else {
            console.log(`   🚧 No construction in progress`);
        }
        
        console.log(''); // Empty line between villages
    });
}

// =============================================================================
// LOCAL DATABASE FUNCTIONS
// =============================================================================

/**
 * Save buildings data to IndexedDB
 */
async function saveBuildingsToLocalDB(data) {
    return new Promise((resolve, reject) => {
        const dbName = 'TribalWarsBuildingsDB';
        const storeName = 'buildings';
        
        const dbConnect = indexedDB.open(dbName, 1);
        
        dbConnect.onupgradeneeded = function() {
            const db = dbConnect.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: 'timestamp' });
            }
        };
        
        dbConnect.onsuccess = function() {
            const db = dbConnect.result;
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const saveData = {
                timestamp: Date.now(),
                extractedAt: data.extractedAt,
                totalVillages: data.totalVillages,
                villages: data.villages
            };
            
            store.put(saveData);
            
            transaction.oncomplete = () => {
                console.log('💾 Buildings data saved to local database!');
                resolve(saveData);
            };
            
            transaction.onerror = () => {
                console.error('❌ Failed to save to local database');
                reject(transaction.error);
            };
        };
        
        dbConnect.onerror = () => {
            console.error('❌ Failed to open local database');
            reject(dbConnect.error);
        };
    });
}

/**
 * Load buildings data from IndexedDB
 */
async function loadBuildingsFromLocalDB() {
    return new Promise((resolve, reject) => {
        const dbName = 'TribalWarsBuildingsDB';
        const storeName = 'buildings';
        
        const dbConnect = indexedDB.open(dbName, 1);
        
        dbConnect.onsuccess = function() {
            const db = dbConnect.result;
            
            if (!db.objectStoreNames.contains(storeName)) {
                resolve(null);
                return;
            }
            
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => {
                const results = getAllRequest.result;
                if (results.length > 0) {
                    // Get most recent save
                    const latestData = results.sort((a, b) => b.timestamp - a.timestamp)[0];
                    console.log(`📂 Loaded buildings data from: ${new Date(latestData.extractedAt).toLocaleString()}`);
                    resolve(latestData);
                } else {
                    resolve(null);
                }
            };
            
            getAllRequest.onerror = () => {
                reject(getAllRequest.error);
            };
        };
        
        dbConnect.onerror = () => {
            reject(dbConnect.error);
        };
    });
}

/**
 * Get all saved building records from local DB
 */
async function getAllBuildingRecords() {
    return new Promise((resolve, reject) => {
        const dbName = 'TribalWarsBuildingsDB';
        const storeName = 'buildings';
        
        const dbConnect = indexedDB.open(dbName, 1);
        
        dbConnect.onsuccess = function() {
            const db = dbConnect.result;
            
            if (!db.objectStoreNames.contains(storeName)) {
                resolve([]);
                return;
            }
            
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => {
                const results = getAllRequest.result.sort((a, b) => b.timestamp - a.timestamp);
                console.log(`📊 Found ${results.length} saved building records`);
                resolve(results);
            };
            
            getAllRequest.onerror = () => {
                reject(getAllRequest.error);
            };
        };
        
        dbConnect.onerror = () => {
            reject(dbConnect.error);
        };
    });
}

// =============================================================================
// SIMPLE USAGE
// =============================================================================

/**
 * Quick extraction and display for current village
 */
async function quickBuildingCheck() {
    console.log('🔍 Getting building data...');
    
    const data = await getBuildingsAndQueue();
    
    if (data) {
        displayBuildingData(data);
        
        // Auto-save to local database
        try {
            await saveBuildingsToLocalDB(data);
        } catch (error) {
            console.error('⚠️ Failed to save to local DB:', error);
        }
    }
    
    return data;
}

/**
 * Load and display last saved data
 */
async function showLastSavedData() {
    console.log('📂 Loading last saved building data...');
    
    try {
        const data = await loadBuildingsFromLocalDB();
        
        if (data) {
            displayBuildingData(data);
            const ageMinutes = Math.round((Date.now() - new Date(data.extractedAt).getTime()) / 60000);
            console.log(`📅 Data is ${ageMinutes} minutes old`);
        } else {
            console.log('📭 No saved data found');
        }
        
        return data;
    } catch (error) {
        console.error('❌ Failed to load from local DB:', error);
        return null;
    }
}

/**
 * Show history of all saved building data
 */
async function showBuildingHistory() {
    console.log('📊 Loading building data history...');
    
    try {
        const records = await getAllBuildingRecords();
        
        if (records.length === 0) {
            console.log('📭 No saved records found');
            return;
        }
        
        console.log(`\n📚 === BUILDING DATA HISTORY (${records.length} records) ===\n`);
        
        records.forEach((record, index) => {
            const date = new Date(record.extractedAt).toLocaleString();
            const ageHours = Math.round((Date.now() - new Date(record.extractedAt).getTime()) / 3600000);
            
            console.log(`${index + 1}. ${date} (${ageHours}h ago) - ${record.totalVillages} villages`);
            
            // Show village names for each record
            const villageNames = Object.values(record.villages).map(v => v.villageInfo.name).join(', ');
            console.log(`   Villages: ${villageNames}`);
            console.log('');
        });
        
        return records;
    } catch (error) {
        console.error('❌ Failed to load history:', error);
        return [];
    }
}

// =============================================================================
// READY-TO-USE COMMANDS
// =============================================================================

/*
USAGE EXAMPLES:

// Extract current village and AUTO-SAVE to local database
quickBuildingCheck()

// Load last saved data (no network request needed)
showLastSavedData()

// View all your saved building history
showBuildingHistory()

// Extract specific village (but gets all villages from that page) 
getBuildingsAndQueue('16404').then(data => {
    displayBuildingData(data);
    saveBuildingsToLocalDB(data); // Manual save
});

// Just get raw data without saving
getBuildingsAndQueue().then(data => console.log('Raw data:', data));
*/

console.log('🏗️ Buildings & Queue Extractor loaded! Use quickBuildingCheck() to start.');