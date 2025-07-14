// ========================================
// Tribal Wars Data Collector
// Simple AJAX Request Script
// ========================================

class TribalWarsDataCollector {
    constructor() {
        this.baseUrl = window.location.origin;
        this.villageId = game_data.village.id;
        this.csrfToken = game_data.csrf;
        this.data = {
            player: {},
            villages: [],
            currentVillage: {},
            commands: [],
            villagesTroops: [] // Added for multi-village troop collection
        };
    }

    // ========================================
    // MAIN DATA COLLECTION METHOD
    // ========================================
    async collectAllData() {
        try {
            console.log('🔄 Starting Tribal Wars data collection...');
            
            // Collect player information
            await this.collectPlayerInfo();
            
            // Collect village information
            await this.collectVillageInfo();
            
            // Collect current village details
            await this.collectCurrentVillageDetails();
            
            // Collect commands
            await this.collectCommands();
            
            console.log('✅ Data collection completed!');
            this.displayResults();
            
            return this.data;
            
        } catch (error) {
            console.error('❌ Error collecting data:', error);
            UI.ErrorMessage('Failed to collect data: ' + error.message);
        }
    }

    // ========================================
    // PLAYER INFORMATION
    // ========================================
    async collectPlayerInfo() {
        console.log('📊 Collecting player information...');
        
        this.data.player = {
            id: game_data.player.id,
            name: game_data.player.name,
            points: game_data.player.points,
            rank: game_data.player.rank,
            villages: game_data.player.villages,
            ally: game_data.player.ally,
            date_started: game_data.player.date_started,
            pp: game_data.player.pp,
            incomings: game_data.player.incomings,
            supports: game_data.player.supports,
            new_report: game_data.player.new_report,
            new_quest: game_data.player.new_quest,
            new_igm: game_data.player.new_igm
        };
        
        console.log('✅ Player info collected');
    }

    // ========================================
    // VILLAGE INFORMATION
    // ========================================
    async collectVillageInfo() {
        console.log('🏘️ Collecting village information...');
        
        try {
            // Get all player villages
            const response = await fetch(`${this.baseUrl}/game.php?village=${this.villageId}&screen=overview&ajaxaction=load_player_villages&h=${this.csrfToken}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Extract village data from the response
            const villageRows = doc.querySelectorAll('.village-list .row');
            
            this.data.villages = [];
            
            villageRows.forEach(row => {
                const villageId = row.getAttribute('data-id');
                const villageName = row.querySelector('.name')?.textContent?.trim();
                const coordElement = row.querySelector('.coords');
                const coordinates = coordElement?.textContent?.trim();
                
                if (villageId && villageName && coordinates) {
                    this.data.villages.push({
                        id: villageId,
                        name: villageName,
                        coordinates: coordinates
                    });
                }
            });
            
            console.log(`✅ Found ${this.data.villages.length} villages`);
            
        } catch (error) {
            console.error('❌ Error collecting village info:', error);
            // Fallback: use game_data if available
            if (game_data.village) {
                this.data.villages = [{
                    id: game_data.village.id,
                    name: game_data.village.name,
                    coordinates: game_data.village.coord
                }];
            }
        }
    }

    // ========================================
    // CURRENT VILLAGE DETAILS
    // ========================================
    async collectCurrentVillageDetails() {
        console.log('🏠 Collecting current village details...');
        
        // Basic village info
        this.data.currentVillage = {
            id: game_data.village.id,
            name: game_data.village.name,
            coordinates: game_data.village.coord,
            x: game_data.village.x,
            y: game_data.village.y,
            points: game_data.village.points,
            population: {
                current: game_data.village.pop,
                max: game_data.village.pop_max
            },
            storage: {
                max: game_data.village.storage_max
            }
        };

        // Buildings
        this.data.currentVillage.buildings = game_data.village.buildings;

        // Resources
        this.data.currentVillage.resources = {
            wood: {
                current: game_data.village.wood,
                production: Math.round(game_data.village.wood_prod * 3600), // per hour
                bonus: game_data.village.bonus.wood
            },
            stone: {
                current: game_data.village.stone,
                production: Math.round(game_data.village.stone_prod * 3600), // per hour
                bonus: game_data.village.bonus.stone
            },
            iron: {
                current: game_data.village.iron,
                production: Math.round(game_data.village.iron_prod * 3600), // per hour
                bonus: game_data.village.bonus.iron
            }
        };

        // Collect troops information
        await this.collectTroopsInfo();
        
        console.log('✅ Current village details collected');
    }

    // ========================================
    // TROOPS INFORMATION (ROBUST, MATCHES IN-GAME TABLE, NO COMMANDS)
    // ========================================
    async collectTroopsInfo() {
        console.log('⚔️ Collecting troops information (robust, no commands)...');
        try {
            const response = await fetch(`${this.baseUrl}/game.php?village=${this.villageId}&screen=overview_villages&mode=units&group=0`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Try #units_table first, fallback to .overview_table
            let table = doc.querySelector('#units_table');
            if (!table) table = doc.querySelector('table.vis.overview_table');
            if (!table) throw new Error('Troop table not found!');

            // Unit types in order (as in the game)
            const units = [];
            const headerCells = table.querySelectorAll('thead tr th.unit-item');
            headerCells.forEach(cell => {
                const unit = cell.querySelector('img')?.getAttribute('data-unit') || cell.textContent.trim();
                if (unit) units.push(unit);
            });

            // Find all village rows
            const villageRows = table.querySelectorAll('tr[id^="units_village_"]');
            const villagesTroops = [];
            villageRows.forEach(row => {
                const villageLink = row.querySelector('a[href*="info_village"]');
                if (!villageLink) return;
                const villageId = villageLink.href.match(/id=(\d+)/)?.[1];
                const villageName = villageLink.textContent.trim();
                const coordsMatch = villageName.match(/\((\d+\|\d+)\)/);
                const coords = coordsMatch ? coordsMatch[1] : '';
                // Parse in-village units
                const inVillage = {};
                const unitCells = row.querySelectorAll('.unit-item');
                unitCells.forEach((cell, idx) => {
                    if (idx >= units.length) return;
                    const unitType = units[idx];
                    const count = parseInt(cell.textContent.trim()) || 0;
                    inVillage[unitType] = count;
                });
                // Parse in-transit units (next row with class units_in_village)
                let inTransit = {};
                const transitRow = row.nextElementSibling;
                if (transitRow && transitRow.classList.contains('units_in_village')) {
                    const transitCells = transitRow.querySelectorAll('.unit-item');
                    transitCells.forEach((cell, idx) => {
                        if (idx >= units.length) return;
                        const unitType = units[idx];
                        const count = parseInt(cell.textContent.trim()) || 0;
                        inTransit[unitType] = count;
                    });
                }
                // Calculate totals
                const total = {};
                units.forEach(unitType => {
                    const inV = inVillage[unitType] || 0;
                    const inT = inTransit[unitType] || 0;
                    total[unitType] = inV + inT;
                });
                villagesTroops.push({
                    villageId,
                    name: villageName,
                    coords,
                    inVillage,
                    inTransit,
                    total,
                    lastUpdated: new Date().toISOString()
                });
            });
            this.data.villagesTroops = villagesTroops;
            // If only one village, also set currentVillage.troops for compatibility
            if (villagesTroops.length === 1) {
                this.data.currentVillage.troops = villagesTroops[0];
            }
            console.log(`✅ Troops information collected for ${villagesTroops.length} village(s)`);
        } catch (error) {
            console.error('❌ Error collecting troops info (robust):', error);
            this.data.villagesTroops = [];
        }
    }

    // ========================================
    // REMOVE COMMANDS COLLECTION
    // ========================================
    async collectCommands() {
        // Do nothing
    }

    // ========================================
    // DISPLAY RESULTS (NO COMMANDS)
    // ========================================
    displayResults() {
        const results = this.formatResults();
        
        // Create widget to display results
        const widgetHTML = `
            <div style="max-height: 600px; overflow-y: auto;">
                <h3>📊 Tribal Wars Data Collection Results</h3>
                <div style="font-family: monospace; font-size: 12px; white-space: pre-wrap;">${results}</div>
                <div style="margin-top: 10px;">
                    <button onclick="copyToClipboard()" style="padding: 5px 10px; margin-right: 5px;">📋 Copy to Clipboard</button>
                    <button onclick="downloadData()" style="padding: 5px 10px;">💾 Download JSON</button>
                </div>
            </div>
        `;

        // Use twSDK if available, otherwise create simple widget
        if (typeof twSDK !== 'undefined') {
            twSDK.renderFixedWidget(
                widgetHTML,
                'dataCollectorResults',
                'dataResults',
                '.dataResults { background: #f8f9fa; padding: 15px; border-radius: 5px; }',
                '600px',
                'Data Collection Results'
            );
        } else {
            // Simple widget creation
            const widget = document.createElement('div');
            widget.id = 'dataCollectorResults';
            widget.style.cssText = `
                position: fixed; top: 50px; right: 20px; 
                background: #f8f9fa; padding: 15px; border-radius: 5px;
                border: 1px solid #ddd; z-index: 10000; max-width: 600px;
                font-family: Arial, sans-serif; box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            `;
            widget.innerHTML = widgetHTML;
            document.body.appendChild(widget);
        }

        // Add helper functions
        window.copyToClipboard = () => {
            navigator.clipboard.writeText(results).then(() => {
                alert('Data copied to clipboard!');
            });
        };

        window.downloadData = () => {
            const dataStr = JSON.stringify(this.data, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `tribalwars_data_${Date.now()}.json`;
            link.click();
            URL.revokeObjectURL(url);
        };
    }

    // ========================================
    // FORMAT RESULTS FOR DISPLAY (NO COMMANDS)
    // ========================================
    formatResults() {
        let output = '';

        // Player Information
        output += '👤 PLAYER INFORMATION\n';
        output += '=====================\n';
        output += `Player ID: ${this.data.player.id}\n`;
        output += `Name: ${this.data.player.name}\n`;
        output += `Points: ${this.data.player.points}\n`;
        output += `Rank: ${this.data.player.rank}\n`;
        output += `Villages: ${this.data.player.villages}\n`;
        output += `Alliance: ${this.data.player.ally || 'None'}\n`;
        output += `Premium Points: ${this.data.player.pp}\n`;
        output += `Incoming Attacks: ${this.data.player.incomings}\n`;
        output += `Support Commands: ${this.data.player.supports}\n\n`;

        // Villages List
        output += '🏘️ VILLAGES LIST\n';
        output += '================\n';
        this.data.villages.forEach((village, index) => {
            output += `${index + 1}. ${village.name} (ID: ${village.id})\n`;
            output += `   Coordinates: ${village.coordinates}\n`;
        });
        output += '\n';

        // Current Village Details
        if (this.data.currentVillage) {
            output += '🏠 CURRENT VILLAGE DETAILS\n';
            output += '========================\n';
            output += `Village ID: ${this.data.currentVillage.id}\n`;
            output += `Name: ${this.data.currentVillage.name}\n`;
            output += `Coordinates: ${this.data.currentVillage.coordinates}\n`;
            output += `Points: ${this.data.currentVillage.points}\n`;
            if (this.data.currentVillage.population) {
                output += `Population: ${this.data.currentVillage.population.current}/${this.data.currentVillage.population.max}\n`;
            }
            if (this.data.currentVillage.storage) {
                output += `Storage Max: ${this.data.currentVillage.storage.max}\n`;
            }
            output += '\n';

            // Buildings
            output += '🏗️ BUILDINGS\n';
            output += '============\n';
            if (this.data.currentVillage.buildings) {
                Object.entries(this.data.currentVillage.buildings).forEach(([building, level]) => {
                    if (parseInt(level) > 0) {
                        output += `${building}: Level ${level}\n`;
                    }
                });
            } else {
                output += 'No building data available.\n';
            }
            output += '\n';

            // Resources
            output += '💰 RESOURCES\n';
            output += '============\n';
            const resources = this.data.currentVillage.resources;
            if (resources && resources.wood && resources.stone && resources.iron) {
                output += `Wood: ${resources.wood.current.toLocaleString()} (${resources.wood.production}/hour)\n`;
                output += `Stone: ${resources.stone.current.toLocaleString()} (${resources.stone.production}/hour)\n`;
                output += `Iron: ${resources.iron.current.toLocaleString()} (${resources.iron.production}/hour)\n\n`;
            } else {
                output += 'No resource data available.\n\n';
            }
        }

        // Troops (multi-village aware)
        if (this.data.villagesTroops && this.data.villagesTroops.length > 0) {
            output += '⚔️ TROOPS (ALL VILLAGES)\n';
            output += '========================\n';
            this.data.villagesTroops.forEach((village, idx) => {
                output += `${idx + 1}. ${village.name} (${village.coords})\n`;
                output += '  In Village:\n';
                Object.entries(village.inVillage).forEach(([unit, count]) => {
                    output += `    ${unit}: ${count}\n`;
                });
                output += '  In Transit:\n';
                Object.entries(village.inTransit).forEach(([unit, count]) => {
                    output += `    ${unit}: ${count}\n`;
                });
                output += '  Total:\n';
                Object.entries(village.total).forEach(([unit, count]) => {
                    output += `    ${unit}: ${count}\n`;
                });
                output += '\n';
            });
        } else if (this.data.currentVillage && this.data.currentVillage.troops) {
            // fallback for single village
            const t = this.data.currentVillage.troops;
            output += '⚔️ TROOPS\n';
            output += '==========\n';
            if (t.inVillage) {
                output += 'In Village:\n';
                Object.entries(t.inVillage).forEach(([unit, count]) => {
                    output += `  ${unit}: ${count}\n`;
                });
            }
            if (t.inTransit) {
                output += 'In Transit:\n';
                Object.entries(t.inTransit).forEach(([unit, count]) => {
                    output += `  ${unit}: ${count}\n`;
                });
            }
            if (t.total) {
                output += 'Total:\n';
                Object.entries(t.total).forEach(([unit, count]) => {
                    output += `  ${unit}: ${count}\n`;
                });
            }
            output += '\n';
        } else {
            output += 'No troop data available.\n';
        }

        return output;
    }
}

// ========================================
// USAGE
// ========================================

// Create and run the data collector
const dataCollector = new TribalWarsDataCollector();

// Start data collection
dataCollector.collectAllData().then(data => {
    console.log('🎉 Data collection completed successfully!');
    console.log('Collected data:', data);
}).catch(error => {
    console.error('❌ Data collection failed:', error);
});

// Alternative: Manual trigger
// Uncomment the line below to run manually
// dataCollector.collectAllData(); 