/**
 * Queue Manager
 * Manages building queues and queue operations
 */
class QueueManager {
    constructor() {
        this.database = null;
        this.settings = null;
    }
    
    /**
     * Initialize the queue manager
     */
    init() {
        this.database = window.AutoBuilder.getDatabase();
        this.settings = window.AutoBuilder.getSettings();
        console.log('📋 Queue Manager initialized');
    }
    
    /**
     * Get queue for a village
     * @param {string} villageId - Village ID
     * @returns {array} Queue items
     */
    getQueue(villageId) {
        return this.database.getVillage('queue', villageId) || [];
    }
    
    /**
     * Add item to queue
     * @param {string} villageId - Village ID
     * @param {object} item - Queue item
     * @returns {boolean} Success status
     */
    addToQueue(villageId, item) {
        try {
            const queue = this.getQueue(villageId);
            
            // Check queue capacity
            const maxSize = this.settings.get('maxQueueSize') || 2;
            if (queue.length >= maxSize) {
                console.warn('⚠️ Queue is full');
                return false;
            }
            
            // Validate item
            if (!this.validateQueueItem(item)) {
                console.error('❌ Invalid queue item');
                return false;
            }
            
            // Add to queue
            queue.push({
                ...item,
                added_at: Date.now(),
                status: 'pending'
            });
            
            this.database.updateVillage('queue', villageId, queue);
            console.log(`✅ Added ${item.building} to queue`);
            return true;
            
        } catch (error) {
            console.error('❌ Failed to add to queue:', error);
            return false;
        }
    }
    
    /**
     * Remove item from queue
     * @param {string} villageId - Village ID
     * @param {number} index - Item index
     * @returns {boolean} Success status
     */
    removeFromQueue(villageId, index) {
        try {
            const queue = this.getQueue(villageId);
            
            if (index >= 0 && index < queue.length) {
                const removed = queue.splice(index, 1)[0];
                this.database.updateVillage('queue', villageId, queue);
                console.log(`🗑️ Removed ${removed.building} from queue`);
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Failed to remove from queue:', error);
            return false;
        }
    }
    
    /**
     * Move item in queue
     * @param {string} villageId - Village ID
     * @param {number} fromIndex - From index
     * @param {number} toIndex - To index
     * @returns {boolean} Success status
     */
    moveInQueue(villageId, fromIndex, toIndex) {
        try {
            const queue = this.getQueue(villageId);
            
            if (fromIndex >= 0 && fromIndex < queue.length && 
                toIndex >= 0 && toIndex < queue.length) {
                
                const item = queue.splice(fromIndex, 1)[0];
                queue.splice(toIndex, 0, item);
                
                this.database.updateVillage('queue', villageId, queue);
                console.log(`🔄 Moved ${item.building} in queue`);
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Failed to move in queue:', error);
            return false;
        }
    }
    
    /**
     * Clear queue
     * @param {string} villageId - Village ID
     * @returns {boolean} Success status
     */
    clearQueue(villageId) {
        try {
            this.database.updateVillage('queue', villageId, []);
            console.log('🗑️ Queue cleared');
            return true;
        } catch (error) {
            console.error('❌ Failed to clear queue:', error);
            return false;
        }
    }
    
    /**
     * Update queue item status
     * @param {string} villageId - Village ID
     * @param {number} index - Item index
     * @param {string} status - New status
     * @returns {boolean} Success status
     */
    updateItemStatus(villageId, index, status) {
        try {
            const queue = this.getQueue(villageId);
            
            if (index >= 0 && index < queue.length) {
                queue[index].status = status;
                queue[index].updated_at = Date.now();
                
                this.database.updateVillage('queue', villageId, queue);
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Failed to update item status:', error);
            return false;
        }
    }
    
    /**
     * Get next item in queue
     * @param {string} villageId - Village ID
     * @returns {object|null} Next queue item
     */
    getNextItem(villageId) {
        const queue = this.getQueue(villageId);
        return queue.find(item => item.status === 'pending') || null;
    }
    
    /**
     * Check if queue is full
     * @param {string} villageId - Village ID
     * @returns {boolean} Is queue full
     */
    isQueueFull(villageId) {
        const queue = this.getQueue(villageId);
        const maxSize = this.settings.get('maxQueueSize') || 2;
        return queue.length >= maxSize;
    }
    
    /**
     * Get queue status
     * @param {string} villageId - Village ID
     * @returns {object} Queue status
     */
    getQueueStatus(villageId) {
        const queue = this.getQueue(villageId);
        const maxSize = this.settings.get('maxQueueSize') || 2;
        
        return {
            current: queue.length,
            max: maxSize,
            isFull: queue.length >= maxSize,
            pending: queue.filter(item => item.status === 'pending').length,
            inProgress: queue.filter(item => item.status === 'in_progress').length,
            completed: queue.filter(item => item.status === 'completed').length
        };
    }
    
    /**
     * Validate queue item
     * @param {object} item - Queue item
     * @returns {boolean} Is valid
     */
    validateQueueItem(item) {
        return item && 
               item.building && 
               typeof item.target_level === 'number' && 
               item.target_level > 0;
    }
    
    /**
     * Get queue statistics
     * @param {string} villageId - Village ID
     * @returns {object} Queue statistics
     */
    getQueueStats(villageId) {
        const queue = this.getQueue(villageId);
        
        const stats = {
            total: queue.length,
            byStatus: {},
            byBuilding: {},
            averageWaitTime: 0
        };
        
        queue.forEach(item => {
            // Count by status
            stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;
            
            // Count by building
            stats.byBuilding[item.building] = (stats.byBuilding[item.building] || 0) + 1;
        });
        
        // Calculate average wait time
        const pendingItems = queue.filter(item => item.status === 'pending');
        if (pendingItems.length > 0) {
            const totalWaitTime = pendingItems.reduce((sum, item) => {
                return sum + (Date.now() - (item.added_at || Date.now()));
            }, 0);
            stats.averageWaitTime = totalWaitTime / pendingItems.length;
        }
        
        return stats;
    }
} 