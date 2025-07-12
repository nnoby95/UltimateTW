/**
 * Game Utilities
 * Provides game-specific utility functions
 */
class GameUtils {
    /**
     * Get current village ID
     * @returns {string} Village ID
     */
    static getCurrentVillageId() {
        return game_data.village.id.toString();
    }
    
    /**
     * Check if we're on main page
     * @returns {boolean} Is on main page
     */
    static isOnMainPage() {
        return window.location.href.includes('screen=main');
    }
} 