/**
 * Time Utilities
 * Provides time-related utility functions
 */
class TimeUtils {
    /**
     * Format time duration
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time
     */
    static formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }
} 