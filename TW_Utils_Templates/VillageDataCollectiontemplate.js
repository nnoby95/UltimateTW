/*
 * VILLAGE DATA COLLECTION TEMPLATE
 * ================================
 * Universal template for adding any data type to the village-centric database
 * 
 * USAGE:
 * 1. Copy this template
 * 2. Replace [DATA_TYPE] with your data type (e.g., 'buildings', 'troops', 'market')
 * 3. Replace scraping function with your data collection logic
 * 4. Customize the data structure as needed
 */

// =============================================================================
// TEMPLATE CONFIGURATION
// =============================================================================

const DATA_TYPE = '[DATA_TYPE]'; // CHANGE THIS: e.g., 'buildings', 'troops', 'market', 'reports'
const SCRIPT_NAME = '[SCRIPT_NAME]'; // CHANGE THIS: e.g., 'Building Scanner', 'Troop Monitor'

// =============================================================================
// SHARED DATABASE SYSTEM (Keep this identical across all scripts)
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
// DATA COLLECTION FUNCTION (Customize this section)
// =============================================================================

async function collectVillageData(villageId = game_data.village.id) {
    /*
     * REPLACE THIS FUNCTION WITH YOUR DATA COLLECTION LOGIC
     * Examples:
     * - Scrape building levels from overview page
     * - Get troop counts from units page  
     * - Collect market prices
     * - Parse reports data
     */
    
    // EXAMPLE: Building levels collection
    try {
        const url = `/game.php?village=${villageId}&screen=overview_villages&mode=buildings`;
        const response = await fetch(url);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // CUSTOMIZE: Extract your specific data here
        const collectedData = {
            // Example structure - modify as needed
            villageId: villageId,
            villageName: 'Village Name', // Extract from page
            coordinates: '123|456',      // Extract from page
            
            // Your specific data structure here
            dataField1: 'value1',
            dataField2: 'value2',
            dataField3: { nested: 'object' },
            
            // Timestamps
            extractedAt: new Date().toISOString(),
            serverTime: 'server-time-if-available'
        };
        
        console.log(`✅ Collected ${DATA_TYPE} data for village ${villageId}`);
        return collectedData;
        
    } catch (error) {
        console.error(`❌ Error collecting ${DATA_TYPE} data:`, error);
        return null;
    }
}

// =============================================================================
// SAVE TO DATABASE (Keep this standardized)
// =============================================================================

async function saveToDatabase(villageId, collectedData) {
    try {
        const db = await ensureVillageStore(villageId);
        const storeName = getVillageStoreName(villageId);
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // Standardized record structure
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
        
        console.log(`💾 Saved ${DATA_TYPE} data for village ${villageId}`);
        
        // Auto-cleanup old records (keep last 20 of this type)
        await cleanupOldRecords(villageId, DATA_TYPE, 20);
        
        return true;
        
    } catch (error) {
        console.error(`❌ Error saving ${DATA_TYPE} data:`, error);
        throw error;
    }
}

// Cleanup old records for this data type
async function cleanupOldRecords(villageId, dataType, keepCount = 20) {
    try {
        const db = await initDatabase();
        const storeName = getVillageStoreName(villageId);
        
        if (!db.objectStoreNames.contains(storeName)) return;
        
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const index = store.index('timestamp');
        
        const allRecords = await new Promise((resolve, reject) => {
            const request = index.openCursor(null, 'prev');
            const records = [];
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.type === dataType) {
                        records.push({ id: cursor.primaryKey, timestamp: cursor.value.timestamp });
                    }
                    cursor.continue();
                } else {
                    resolve(records);
                }
            };
            request.onerror = () => reject(request.error);
        });
        
        if (allRecords.length > keepCount) {
            const recordsToDelete = allRecords.slice(keepCount);
            
            for (const record of recordsToDelete) {
                await new Promise((resolve, reject) => {
                    const deleteRequest = store.delete(record.id);
                    deleteRequest.onsuccess = () => resolve();
                    deleteRequest.onerror = () => reject(deleteRequest.error);
                });
            }
            
            console.log(`🧹 Cleaned up ${recordsToDelete.length} old ${dataType} records`);
        }
        
    } catch (error) {
        console.error(`⚠️ Error cleaning up ${dataType} records:`, error);
    }
}

// =============================================================================
// DATA RETRIEVAL FUNCTIONS (Keep standardized, customize display)
// =============================================================================

// Load latest data for this type
async function loadLatestData(villageId = game_data.village.id) {
    try {
        const db = await initDatabase();
        const storeName = getVillageStoreName(villageId);
        
        if (!db.objectStoreNames.contains(storeName)) {
            console.log(`❌ No ${DATA_TYPE} data found for village ${villageId}`);
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
        console.error(`❌ Error loading ${DATA_TYPE} data:`, error);
        return null;
    }
}

// Load history for this data type
async function loadDataHistory(villageId = game_data.village.id, limit = 10) {
    try {
        const db = await initDatabase();
        const storeName = getVillageStoreName(villageId);
        
        if (!db.objectStoreNames.contains(storeName)) return [];
        
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index('timestamp');
        
        const results = await new Promise((resolve, reject) => {
            const request = index.openCursor(null, 'prev');
            const records = [];
            let count = 0;
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && count < limit) {
                    if (cursor.value.type === DATA_TYPE) {
                        records.push(cursor.value);
                        count++;
                    }
                    cursor.continue();
                } else {
                    resolve(records);
                }
            };
            request.onerror = () => reject(request.error);
        });
        
        return results;
        
    } catch (error) {
        console.error(`❌ Error loading ${DATA_TYPE} history:`, error);
        return [];
    }
}

// =============================================================================
// DISPLAY FUNCTIONS (Customize these for your data type)
// =============================================================================

function displayData(dataRecord) {
    /*
     * CUSTOMIZE THIS FUNCTION TO DISPLAY YOUR DATA TYPE
     * dataRecord.data contains your collected data
     */
    
    console.log(`\n=== ${SCRIPT_NAME.toUpperCase()} DATA ===`);
    console.log(`Village: ${dataRecord.villageId} (${dataRecord.data.coordinates || 'Unknown'})`);
    console.log(`Collected: ${new Date(dataRecord.timestamp).toLocaleString()}`);
    console.log(`World: ${dataRecord.worldId}, Player: ${dataRecord.playerId}`);
    console.log('\n--- Data Details ---');
    
    // CUSTOMIZE: Display your specific data structure
    Object.entries(dataRecord.data).forEach(([key, value]) => {
        if (typeof value === 'object') {
            console.log(`${key}:`, JSON.stringify(value, null, 2));
        } else {
            console.log(`${key}: ${value}`);
        }
    });
}

function displayHistory(historyRecords) {
    console.log(`\n📚 ${SCRIPT_NAME.toUpperCase()} HISTORY (${historyRecords.length} records)`);
    console.log('='.repeat(50));
    
    historyRecords.forEach((record, index) => {
        const date = new Date(record.timestamp).toLocaleString();
        // CUSTOMIZE: Show relevant summary for each record
        console.log(`${index + 1}. ${date} - ${DATA_TYPE} data collected`);
    });
}

// =============================================================================
// MAIN FUNCTIONS (Standard interface)
// =============================================================================

async function collectAndSave(villageId = game_data.village.id) {
    console.log(`Starting ${SCRIPT_NAME} for village ${villageId}...`);
    
    try {
        // Step 1: Collect data
        const collectedData = await collectVillageData(villageId);
        
        if (!collectedData) {
            console.log(`❌ No ${DATA_TYPE} data collected`);
            return null;
        }
        
        // Step 2: Save to database
        await saveToDatabase(villageId, collectedData);
        
        // Step 3: Display results
        const savedRecord = await loadLatestData(villageId);
        if (savedRecord) {
            displayData(savedRecord);
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
// PUBLIC API (Standard across all scripts)
// =============================================================================

// Main collection function
window[`collect${DATA_TYPE.charAt(0).toUpperCase() + DATA_TYPE.slice(1)}`] = collectAndSave;

// Load latest data
window[`load${DATA_TYPE.charAt(0).toUpperCase() + DATA_TYPE.slice(1)}`] = async function(villageId = game_data.village.id) {
    const data = await loadLatestData(villageId);
    if (data) {
        displayData(data);
        return data;
    } else {
        console.log(`❌ No saved ${DATA_TYPE} data found for village ${villageId}`);
        return null;
    }
};

// Show history
window[`show${DATA_TYPE.charAt(0).toUpperCase() + DATA_TYPE.slice(1)}History`] = async function(villageId = game_data.village.id, limit = 10) {
    const history = await loadDataHistory(villageId, limit);
    if (history.length > 0) {
        displayHistory(history);
        return history;
    } else {
        console.log(`❌ No ${DATA_TYPE} history found for village ${villageId}`);
        return [];
    }
};

// =============================================================================
// USAGE INSTRUCTIONS
// =============================================================================

console.log(`
${SCRIPT_NAME.toUpperCase()} - VILLAGE DATA COLLECTOR
${'='.repeat(SCRIPT_NAME.length + 30)}

🎯 DATA TYPE: ${DATA_TYPE}
🏗️ DATABASE: TribalWarsGameData (shared with other village data)
📂 STRUCTURE: village_${game_data.village.id} → {type: '${DATA_TYPE}', data: {...}}

📊 FUNCTIONS:
- collect${DATA_TYPE.charAt(0).toUpperCase() + DATA_TYPE.slice(1)}()                    - Collect and save ${DATA_TYPE} data
- load${DATA_TYPE.charAt(0).toUpperCase() + DATA_TYPE.slice(1)}()                       - Load latest saved ${DATA_TYPE} data  
- show${DATA_TYPE.charAt(0).toUpperCase() + DATA_TYPE.slice(1)}History()                - Show ${DATA_TYPE} history

🚀 QUICK START:
collect${DATA_TYPE.charAt(0).toUpperCase() + DATA_TYPE.slice(1)}()                     // Collect and save current village ${DATA_TYPE}
load${DATA_TYPE.charAt(0).toUpperCase() + DATA_TYPE.slice(1)}()                        // View latest saved ${DATA_TYPE}

💾 DATABASE INTEGRATION:
✅ Uses same database as village resources script
✅ Automatic cleanup (keeps last 20 records)
✅ Village-centric organization
✅ Timestamped historical tracking

Run from any Tribal Wars page!
`);

// =============================================================================
// CUSTOMIZATION CHECKLIST
// =============================================================================

/*
📝 TO CUSTOMIZE THIS TEMPLATE:

1. CHANGE CONFIGURATION:
   - DATA_TYPE: Your data type (e.g., 'buildings', 'troops', 'market')
   - SCRIPT_NAME: Display name (e.g., 'Building Scanner', 'Troop Monitor')

2. MODIFY collectVillageData():
   - Replace example scraping logic with your data collection
   - Update the collectedData object structure
   - Add any specific error handling for your data type

3. CUSTOMIZE DISPLAY FUNCTIONS:
   - displayData(): How to show individual records
   - displayHistory(): How to show historical summary

4. TEST AND VERIFY:
   - Run collectAndSave() to test data collection
   - Check database structure with showDatabaseStats() (from resources script)
   - Verify data appears correctly in village store

5. OPTIONAL ENHANCEMENTS:
   - Add data validation
   - Include more complex data structures
   - Add export/import functionality
   - Create HTML visualization

EXAMPLE IMPLEMENTATIONS:
- Buildings: Scrape building levels from overview
- Troops: Get unit counts from troops page
- Market: Collect trading prices and capacity
- Reports: Parse attack/defense reports
- Incoming: Track incoming attacks
- Commands: Monitor outgoing commands

The template ensures all your data collection scripts work together
in the same village-centric database structure!
*/