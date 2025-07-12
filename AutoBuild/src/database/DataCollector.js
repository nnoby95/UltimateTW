/**
 * Data Collector for Auto Builder
 * Collects all relevant data from the current Tribal Wars page
 */
class DataCollector {
    
    /**
     * Collect all data from current page
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
            return {
                wood: 0,
                stone: 0,
                iron: 0,
                pop: 0,
                pop_max: 0
            };
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
            'hiding': 'hide',
            'church': 'church',
            'palace': 'palace',
            'residence': 'residence'
        };
        
        for (const [key, value] of Object.entries(mappings)) {
            if (buildingName.toLowerCase().includes(key)) {
                return value;
            }
        }
        
        return buildingName.toLowerCase();
    }
} 