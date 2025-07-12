/**
 * Building Configuration
 * Provides building-related configuration and data
 */
class BuildingConfig {
    /**
     * Get building priorities
     * @returns {object} Building priorities
     */
    static getPriorities() {
        return {
            main: 1,
            barracks: 2,
            stable: 3,
            workshop: 4,
            academy: 5,
            smithy: 6,
            marketplace: 7,
            wall: 8,
            farm: 9,
            warehouse: 10,
            hiding: 11
        };
    }
} 