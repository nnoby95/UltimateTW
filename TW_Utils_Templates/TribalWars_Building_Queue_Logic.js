// TribalWars Building Queue Logic
// Core functionality for adding buildings to the game queue

/**
 * TribalWars Building Queue Manager
 * Handles CSRF token management and building queue operations
 */
class TribalWarsBuildingQueueLogic {
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
            
            console.log(`📋 Queue status: ${queueItems.length}/5 buildings`);
            return queueStatus;
            
        } catch (error) {
            console.error('❌ Error getting queue status:', error);
            return { count: 0, maxCapacity: 5, hasSpace: true, items: [] };
        }
    }

    /**
     * Check if queue has space for new building
     * @param {string} villageId - Village ID
     * @returns {Promise<boolean>} Has space
     */
    async hasQueueSpace(villageId) {
        const status = await this.getQueueStatus(villageId);
        return status.hasSpace;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TribalWarsBuildingQueueLogic;
}

// Auto-initialize if run directly
if (typeof window !== 'undefined') {
    window.TribalWarsBuildingQueueLogic = TribalWarsBuildingQueueLogic;
    console.log('🏗️ TribalWars Building Queue Logic loaded!');
}

// Usage example:
/*
const buildingLogic = new TribalWarsBuildingQueueLogic();

// Add a building to queue
const villageId = game_data.village.id;
const success = await buildingLogic.addBuildingToQueue(villageId, 'main');

if (success) {
    console.log('✅ Main building added to queue!');
} else {
    console.log('❌ Failed to add building');
}

// Check queue status
const status = await buildingLogic.getQueueStatus(villageId);
console.log(`Queue: ${status.count}/5 buildings`);
*/ 