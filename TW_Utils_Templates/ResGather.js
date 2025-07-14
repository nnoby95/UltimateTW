/*
 * Village Resources & Capacity Monitor
 * ===================================
 * Extracts resources, warehouse, and population data from production overview
 */

// =============================================================================
// SAFE REQUEST SYSTEM
// =============================================================================

let isRequestActive = false;
let lastRequestTime = 0;
const MIN_DELAY_BETWEEN_REQUESTS = 5000; // 5 seconds minimum

async function safeRequest(url) {
    // Wait if another request is active
    while (isRequestActive) {
        await sleep(100);
    }
    
    // Ensure minimum time between requests
    const timeSinceLastRequest = Date.now() - lastRequestTime;
    if (timeSinceLastRequest < MIN_DELAY_BETWEEN_REQUESTS) {
        const waitTime = MIN_DELAY_BETWEEN_REQUESTS - timeSinceLastRequest;
        console.log(`Waiting ${waitTime}ms before next request...`);
        await sleep(waitTime);
    }
    
    isRequestActive = true;
    lastRequestTime = Date.now();
    
    try {
        console.log(`Fetching: ${url}`);
        const response = await fetch(url);
        const html = await response.text();
        
        await sleep(1000 + Math.random() * 2000); // 1-3 seconds
        
        const parser = new DOMParser();
        return parser.parseFromString(html, 'text/html');
        
    } catch (error) {
        console.error('Request failed:', error);
        return null;
    } finally {
        isRequestActive = false;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// EXTRACT VILLAGE DATA FROM PRODUCTION OVERVIEW
// =============================================================================

async function getVillageResourcesAndCapacity() {
    const url = `/game.php?village=${game_data.village.id}&screen=overview_villages&mode=prod`;
    const doc = await safeRequest(url);
    
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
            let villageId = null;
            if (villageLink && villageLink.href) {
                const match = villageLink.href.match(/village=(\d+)/);
                villageId = match ? match[1] : null;
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
                villageId,
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
                    usage: Math.max(wood, stone, iron), // Highest resource amount
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
    
    return villages;
}

// =============================================================================
// DISPLAY FUNCTIONS
// =============================================================================

function displayVillageData(villages) {
    console.log('\n=== VILLAGE RESOURCES & CAPACITY OVERVIEW ===\n');
    
    villages.forEach((village, index) => {
        console.log(`${index + 1}. ${village.name} (${village.coordinates})`);
        console.log(`   Points: ${village.points.toLocaleString()}`);
        console.log(`   Resources: ${village.resources.wood.toLocaleString()} wood, ${village.resources.stone.toLocaleString()} stone, ${village.resources.iron.toLocaleString()} iron`);
        console.log(`   Total Resources: ${village.resources.total.toLocaleString()}`);
        console.log(`   Warehouse: ${village.warehouse.usage.toLocaleString()}/${village.warehouse.capacity.toLocaleString()} (${village.warehouse.usagePercent}% full)`);
        console.log(`   Population: ${village.population.current}/${village.population.max} (${village.population.usagePercent}% used, ${village.population.available} available)`);
        console.log('');
    });
    
    // Summary
    const totalResources = villages.reduce((sum, v) => sum + v.resources.total, 0);
    const totalWarehouse = villages.reduce((sum, v) => sum + v.warehouse.capacity, 0);
    const totalPopUsed = villages.reduce((sum, v) => sum + v.population.current, 0);
    const totalPopMax = villages.reduce((sum, v) => sum + v.population.max, 0);
    
    console.log('=== TOTALS ===');
    console.log(`Villages: ${villages.length}`);
    console.log(`Total Resources: ${totalResources.toLocaleString()}`);
    console.log(`Total Warehouse Capacity: ${totalWarehouse.toLocaleString()}`);
    console.log(`Total Population: ${totalPopUsed}/${totalPopMax} (${Math.round((totalPopUsed/totalPopMax)*100)}% used)`);
}

function createResourcesTable(villages) {
    let table = `
<style>
.resources-table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
.resources-table th, .resources-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
.resources-table th { background-color: #f2f2f2; font-weight: bold; }
.resources-table tr:nth-child(even) { background-color: #f9f9f9; }
.high-usage { color: #d9534f; font-weight: bold; }
.medium-usage { color: #f0ad4e; }
.low-usage { color: #5cb85c; }
</style>
<table class="resources-table">
<thead>
<tr>
    <th>Village</th>
    <th>Wood</th>
    <th>Stone</th>
    <th>Iron</th>
    <th>Warehouse</th>
    <th>Population</th>
</tr>
</thead>
<tbody>`;

    villages.forEach(village => {
        const warehouseClass = village.warehouse.usagePercent >= 80 ? 'high-usage' : 
                              village.warehouse.usagePercent >= 60 ? 'medium-usage' : 'low-usage';
        const popClass = village.population.usagePercent >= 90 ? 'high-usage' : 
                        village.population.usagePercent >= 70 ? 'medium-usage' : 'low-usage';
        
        table += `
<tr>
    <td>${village.name}</td>
    <td>${village.resources.wood.toLocaleString()}</td>
    <td>${village.resources.stone.toLocaleString()}</td>
    <td>${village.resources.iron.toLocaleString()}</td>
    <td class="${warehouseClass}">${village.warehouse.usage.toLocaleString()}/${village.warehouse.capacity.toLocaleString()} (${village.warehouse.usagePercent}%)</td>
    <td class="${popClass}">${village.population.current}/${village.population.max} (${village.population.usagePercent}%)</td>
</tr>`;
    });

    table += `
</tbody>
</table>`;

    return table;
}

// =============================================================================
// INDEXEDDB STORAGE SYSTEM
// =============================================================================

const DB_NAME = 'TribalWarsVillageData';
const DB_VERSION = 1;
const STORE_NAME = 'villageResources';

// Initialize IndexedDB
function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create object store if it doesn't exist
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                
                // Create indexes for efficient querying
                store.createIndex('villageId', 'villageId', { unique: false });
                store.createIndex('coordinates', 'coordinates', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('worldId', 'worldId', { unique: false });
            }
        };
    });
}

// Save village data to IndexedDB
async function saveVillageData(villages) {
    try {
        const db = await initDatabase();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const worldId = game_data.world;
        const playerId = game_data.player.id;
        const timestamp = new Date().toISOString();
        
        // Create a snapshot record
        const snapshot = {
            worldId,
            playerId,
            timestamp,
            villageCount: villages.length,
            villages: villages,
            summary: {
                totalResources: villages.reduce((sum, v) => sum + v.resources.total, 0),
                totalWarehouseCapacity: villages.reduce((sum, v) => sum + v.warehouse.capacity, 0),
                totalPopulation: villages.reduce((sum, v) => sum + v.population.current, 0),
                maxPopulation: villages.reduce((sum, v) => sum + v.population.max, 0)
            }
        };
        
        const result = await new Promise((resolve, reject) => {
            const request = store.add(snapshot);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        
        console.log(`✅ Village data saved to IndexedDB with ID: ${result}`);
        console.log(`📊 Saved ${villages.length} villages at ${timestamp}`);
        
        // Clean up old records (keep only last 50 entries)
        await cleanupOldRecords(db, 50);
        
        return result;
        
    } catch (error) {
        console.error('❌ Error saving to IndexedDB:', error);
        throw error;
    }
}

// Clean up old records to prevent database bloat
async function cleanupOldRecords(db, keepCount = 50) {
    try {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('timestamp');
        
        // Get all records ordered by timestamp (newest first)
        const allRecords = await new Promise((resolve, reject) => {
            const request = index.openCursor(null, 'prev');
            const records = [];
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    records.push({ id: cursor.primaryKey, timestamp: cursor.value.timestamp });
                    cursor.continue();
                } else {
                    resolve(records);
                }
            };
            request.onerror = () => reject(request.error);
        });
        
        // Delete old records if we have more than keepCount
        if (allRecords.length > keepCount) {
            const recordsToDelete = allRecords.slice(keepCount);
            
            for (const record of recordsToDelete) {
                await new Promise((resolve, reject) => {
                    const deleteRequest = store.delete(record.id);
                    deleteRequest.onsuccess = () => resolve();
                    deleteRequest.onerror = () => reject(deleteRequest.error);
                });
            }
            
            console.log(`🧹 Cleaned up ${recordsToDelete.length} old records`);
        }
        
    } catch (error) {
        console.error('⚠️ Error cleaning up old records:', error);
    }
}

// Load latest village data from IndexedDB
async function loadLatestVillageData() {
    try {
        const db = await initDatabase();
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('timestamp');
        
        const result = await new Promise((resolve, reject) => {
            const request = index.openCursor(null, 'prev'); // Get latest first
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    resolve(cursor.value);
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
        
        return result;
        
    } catch (error) {
        console.error('❌ Error loading from IndexedDB:', error);
        return null;
    }
}

// Load all village data history
async function loadVillageDataHistory(limit = 10) {
    try {
        const db = await initDatabase();
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('timestamp');
        
        const results = await new Promise((resolve, reject) => {
            const request = index.openCursor(null, 'prev');
            const records = [];
            let count = 0;
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && count < limit) {
                    records.push(cursor.value);
                    count++;
                    cursor.continue();
                } else {
                    resolve(records);
                }
            };
            request.onerror = () => reject(request.error);
        });
        
        return results;
        
    } catch (error) {
        console.error('❌ Error loading history from IndexedDB:', error);
        return [];
    }
}

// Get database statistics
async function getDatabaseStats() {
    try {
        const db = await initDatabase();
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        
        const count = await new Promise((resolve, reject) => {
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        
        const oldestRecord = await new Promise((resolve, reject) => {
            const index = store.index('timestamp');
            const request = index.openCursor(null, 'next'); // Oldest first
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                resolve(cursor ? cursor.value : null);
            };
            request.onerror = () => reject(request.error);
        });
        
        const latestRecord = await new Promise((resolve, reject) => {
            const index = store.index('timestamp');
            const request = index.openCursor(null, 'prev'); // Latest first
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                resolve(cursor ? cursor.value : null);
            };
            request.onerror = () => reject(request.error);
        });
        
        return {
            totalRecords: count,
            oldestRecord: oldestRecord ? oldestRecord.timestamp : null,
            latestRecord: latestRecord ? latestRecord.timestamp : null,
            worldId: game_data.world,
            playerId: game_data.player.id
        };
        
    } catch (error) {
        console.error('❌ Error getting database stats:', error);
        return null;
    }
}

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

async function scanAllVillages(saveToDb = true) {
    console.log('Starting village scan...');
    
    try {
        const villages = await getVillageResourcesAndCapacity();
        
        if (!villages || villages.length === 0) {
            console.log('No villages found or error occurred.');
            return;
        }
        
        displayVillageData(villages);
        
        // Save to IndexedDB if requested
        if (saveToDb) {
            try {
                await saveVillageData(villages);
                if (typeof UI !== 'undefined' && UI.SuccessMessage) {
                    UI.SuccessMessage(`✅ Scanned ${villages.length} villages and saved to database!`);
                }
            } catch (dbError) {
                console.error('Failed to save to database:', dbError);
                if (typeof UI !== 'undefined' && UI.ErrorMessage) {
                    UI.ErrorMessage('⚠️ Scan successful but failed to save to database');
                }
            }
        } else {
            if (typeof UI !== 'undefined' && UI.InfoMessage) {
                UI.InfoMessage(`📊 Scanned ${villages.length} villages (not saved to database)`);
            }
        }
        
        // Create HTML table for easy viewing
        const htmlTable = createResourcesTable(villages);
        
        return {
            villages,
            htmlTable,
            summary: {
                totalVillages: villages.length,
                totalResources: villages.reduce((sum, v) => sum + v.resources.total, 0),
                totalWarehouseCapacity: villages.reduce((sum, v) => sum + v.warehouse.capacity, 0),
                totalPopulation: villages.reduce((sum, v) => sum + v.population.current, 0),
                maxPopulation: villages.reduce((sum, v) => sum + v.population.max, 0)
            }
        };
        
    } catch (error) {
        console.error('Error scanning villages:', error);
        if (typeof UI !== 'undefined' && UI.ErrorMessage) {
            UI.ErrorMessage('❌ Error scanning villages: ' + error.message);
        }
    }
}

// =============================================================================
// QUICK ACCESS FUNCTIONS
// =============================================================================

// Quick scan and display (saves to DB by default)
window.scanVillages = () => scanAllVillages(true);

// Scan without saving to database
window.scanVillagesOnly = () => scanAllVillages(false);

// Load and display latest saved data
window.loadLatestData = async function() {
    console.log('Loading latest village data from database...');
    
    const data = await loadLatestVillageData();
    if (data) {
        console.log(`\n📅 Latest data from: ${data.timestamp}`);
        console.log(`🌍 World: ${data.worldId}, Player: ${data.playerId}`);
        displayVillageData(data.villages);
        
        if (typeof UI !== 'undefined' && UI.SuccessMessage) {
            UI.SuccessMessage(`Loaded data from ${new Date(data.timestamp).toLocaleString()}`);
        }
        
        return data;
    } else {
        console.log('❌ No saved data found in database');
        if (typeof UI !== 'undefined' && UI.InfoMessage) {
            UI.InfoMessage('No saved village data found');
        }
        return null;
    }
};

// Show database statistics
window.showDatabaseStats = async function() {
    console.log('Getting database statistics...');
    
    const stats = await getDatabaseStats();
    if (stats) {
        console.log('\n📊 DATABASE STATISTICS');
        console.log('======================');
        console.log(`Total Records: ${stats.totalRecords}`);
        console.log(`World ID: ${stats.worldId}`);
        console.log(`Player ID: ${stats.playerId}`);
        console.log(`Oldest Record: ${stats.oldestRecord ? new Date(stats.oldestRecord).toLocaleString() : 'None'}`);
        console.log(`Latest Record: ${stats.latestRecord ? new Date(stats.latestRecord).toLocaleString() : 'None'}`);
        
        if (typeof UI !== 'undefined' && UI.InfoMessage) {
            UI.InfoMessage(`Database contains ${stats.totalRecords} records`);
        }
        
        return stats;
    } else {
        console.log('❌ Could not get database statistics');
        return null;
    }
};

// Show historical data
window.showHistory = async function(limit = 5) {
    console.log(`Loading last ${limit} records from database...`);
    
    const history = await loadVillageDataHistory(limit);
    if (history && history.length > 0) {
        console.log(`\n📚 VILLAGE DATA HISTORY (Last ${history.length} records)`);
        console.log('==========================================');
        
        history.forEach((record, index) => {
            const date = new Date(record.timestamp).toLocaleString();
            console.log(`${index + 1}. ${date} - ${record.villageCount} villages, ${record.summary.totalResources.toLocaleString()} total resources`);
        });
        
        if (typeof UI !== 'undefined' && UI.InfoMessage) {
            UI.InfoMessage(`Showing ${history.length} historical records`);
        }
        
        return history;
    } else {
        console.log('❌ No historical data found');
        if (typeof UI !== 'undefined' && UI.InfoMessage) {
            UI.InfoMessage('No historical data found');
        }
        return [];
    }
};

// Export data as JSON
window.exportVillageData = async function() {
    const data = await loadLatestVillageData();
    if (data) {
        const jsonData = JSON.stringify(data, null, 2);
        
        // Create download link
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `village-data-${data.worldId}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('✅ Village data exported as JSON file');
        if (typeof UI !== 'undefined' && UI.SuccessMessage) {
            UI.SuccessMessage('Village data exported!');
        }
        
        return data;
    } else {
        console.log('❌ No data to export');
        if (typeof UI !== 'undefined' && UI.ErrorMessage) {
            UI.ErrorMessage('No data to export');
        }
        return null;
    }
};

// Clear all database data
window.clearVillageDatabase = async function() {
    if (!confirm('⚠️ Are you sure you want to delete ALL saved village data? This cannot be undone!')) {
        return;
    }
    
    try {
        const db = await initDatabase();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        await new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
        
        console.log('🗑️ All village data cleared from database');
        if (typeof UI !== 'undefined' && UI.SuccessMessage) {
            UI.SuccessMessage('All village data cleared!');
        }
        
    } catch (error) {
        console.error('❌ Error clearing database:', error);
        if (typeof UI !== 'undefined' && UI.ErrorMessage) {
            UI.ErrorMessage('Error clearing database');
        }
    }
};

// Display HTML table in new window
window.showVillageTable = async function(useLatestData = false) {
    let data;
    
    if (useLatestData) {
        const savedData = await loadLatestVillageData();
        if (savedData) {
            data = {
                villages: savedData.villages,
                htmlTable: createResourcesTable(savedData.villages),
                summary: savedData.summary
            };
        } else {
            console.log('No saved data found, scanning fresh...');
            data = await scanAllVillages(true);
        }
    } else {
        data = await scanAllVillages(true);
    }
    
    if (data && data.htmlTable) {
        const newWindow = window.open('', '_blank', 'width=1000,height=700');
        newWindow.document.write(`
            <html>
            <head><title>Village Resources & Capacity</title></head>
            <body>
                <h2>Village Resources & Capacity Overview</h2>
                <p><em>Generated: ${new Date().toLocaleString()}</em></p>
                ${data.htmlTable}
                <br>
                <h3>Summary</h3>
                <p><strong>Villages:</strong> ${data.summary.totalVillages}</p>
                <p><strong>Total Resources:</strong> ${data.summary.totalResources.toLocaleString()}</p>
                <p><strong>Total Warehouse Capacity:</strong> ${data.summary.totalWarehouseCapacity.toLocaleString()}</p>
                <p><strong>Total Population:</strong> ${data.summary.totalPopulation.toLocaleString()}/${data.summary.maxPopulation.toLocaleString()}</p>
            </body>
            </html>
        `);
        newWindow.document.close();
    }
};

// =============================================================================
// USAGE INSTRUCTIONS
// =============================================================================

console.log(`
VILLAGE RESOURCES & CAPACITY MONITOR WITH INDEXEDDB
==================================================

📊 SCANNING FUNCTIONS:
- scanVillages()           - Scan all villages and save to database
- scanVillagesOnly()       - Scan villages without saving to database  
- showVillageTable()       - Scan and show results in new window

💾 DATABASE FUNCTIONS:
- loadLatestData()         - Load and display latest saved data
- showHistory(5)           - Show last 5 historical records
- showDatabaseStats()      - Display database statistics
- exportVillageData()      - Download latest data as JSON file
- clearVillageDatabase()   - Delete all saved data (with confirmation)

🎯 FEATURES:
✅ Extracts resources, warehouse capacity, population per village
✅ Saves to IndexedDB with timestamps for historical tracking
✅ Automatic cleanup (keeps last 50 records)
✅ Export data as JSON
✅ Color-coded usage indicators (red/orange/green)
✅ Safe rate limiting (5+ second delays)

📁 DATABASE STRUCTURE:
- Database: TribalWarsVillageData
- Store: villageResources  
- Indexes: villageId, coordinates, timestamp, worldId
- Auto-cleanup: Keeps last 50 snapshots

🚀 QUICK START:
scanVillages()            // Scan and save current village data
loadLatestData()          // View your latest saved data
showHistory()             // See your scanning history

Run from any Tribal Wars page!
`);

// Auto-initialize database on load
initDatabase().then(() => {
    console.log('✅ IndexedDB initialized successfully');
}).catch(error => {
    console.error('❌ Failed to initialize IndexedDB:', error);
});

// Auto-run on load (optional - uncomment to scan immediately)
// scanAllVillages();
