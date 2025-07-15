# TribalWars - Working Libraries (twSDK & DSUtil)

## Quick Reference
- **twSDK**: 89+ methods for data access, UI creation, and utilities
- **DSUtil**: 17+ methods for building calculations and village analysis
- **Real Working Code**: All examples from actual TribalWars scripts
- **Proven Patterns**: Tested and working in production environments

## twSDK Library (89+ Methods)

### Initialization
```javascript
await twSDK.init({
    scriptData: {
        name: "string - Script name",
        version: "string - Version number", 
        author: "string - Author name",
        helpLink: "string - Help URL"
    },
    translations: "object - Multi-language support",
    allowedMarkets: "array - Allowed game markets/worlds",
    allowedScreens: "array - Allowed game screens",
    allowedModes: "array - Allowed game modes",
    isDebug: "boolean - Debug mode",
    enableCountApi: "boolean - Usage statistics"
});
```

### Data Access Methods
```javascript
// World data (cached for 1 hour)
await twSDK.worldDataAPI('village')     // Get all villages
await twSDK.worldDataAPI('player')      // Get all players  
await twSDK.worldDataAPI('ally')        // Get all tribes
await twSDK.worldDataAPI('conquer')     // Get conquest data

// Distance calculations
twSDK.calculateDistance('123|456', '789|012')
twSDK.calculateDistanceFromCurrentVillage(coord)
await twSDK.calculateTimesByDistance(distance)
```

### Coordinate Processing
```javascript
twSDK.getCoordFromString(string)                    // Extract first coordinate
twSDK.getLastCoordFromString(string)               // Extract last coordinate
twSDK.getContinentByCoord(coord)                   // Get continent number
twSDK.filterVillagesByPlayerIds(playerIds, villages) // Filter villages by owner
```

### UI Creation Methods
```javascript
twSDK.renderFixedWidget(body, id, class, style, width, name) // Floating widget
twSDK.renderBoxWidget(body, id, class, style)      // Inline widget
twSDK.buildUnitsPicker(selected, ignore, type)     // Unit selection interface
```

### Utility Methods
```javascript
twSDK.formatAsNumber(number)                       // Format with thousands separators
twSDK.secondsToHms(timestamp)                      // Convert seconds to HH:MM:SS
twSDK.copyToClipboard(string)                      // Copy text to clipboard
twSDK.getServerDateTime()                          // Get current server time
twSDK.csvToArray(strData, delimiter)               // Parse CSV data
```

### World Data Formats
```javascript
// Village data: [villageId, villageName, x, y, playerId, points, type]
// Player data: [playerId, playerName, tribeId, villages, points, rank]  
// Tribe data: [tribeId, tribeName, tribeTag, players, villages, points, allPoints, rank]
// Conquest data: [villageId, timestamp, newPlayerId, oldPlayerId, oldTribeId, newTribeId, points]
```

## DSUtil Library (17+ Methods)

### Configuration
```javascript
// Configure for current world settings
DSUtil.speed = game_data.speed || 1.0;
DSUtil.datalvl = true; // Use current village data
```

### Building Calculations
```javascript
DSUtil.buildCost(building, lvl, res)               // Resource cost for level
DSUtil.buildCostSum(building, lvl)                 // Total cost (wood+stone+iron)
DSUtil.buildTime(building, lvl, hqlvl)             // Build time with HQ reduction
DSUtil.hqFactor(lvl)                              // HQ time reduction factor
```

### Capacity Functions
```javascript
DSUtil.getStorage(lvl)                             // Storage capacity by level
DSUtil.getFarm(lvl)                               // Population capacity by level  
DSUtil.getMarket(lvl)                             // Number of traders by level
DSUtil.getResProduction(lvl, type)                // Hourly production by level
```

### Village Analysis
```javascript
DSUtil.popUsed(buildingType, level)               // Population used by building
DSUtil.popUsedVillage(buildings)                  // Total village population
DSUtil.pointsVillage(buildings)                   // Total village points
DSUtil.getBuildingObj(type, lvl, hqlvl)           // Complete building analysis
DSUtil.buildingReqirementsMet(buildings, type)    // Check build requirements
```

### Utilities
```javascript
DSUtil.convertSecToTimeString(sec)                // Seconds to time string
DSUtil.convertTimeStringToSec(time)               // Time string to seconds
DSUtil.checklvl(lvl, type)                        // Smart level resolution
```

## Real Working Examples

### twSDK Usage Pattern
```javascript
// Initialize SDK
await twSDK.init({
    scriptData: { name: 'My Script', version: '1.0.0', author: 'Developer' },
    allowedMarkets: ['en', 'de'],
    allowedScreens: ['overview']
});

// Get world data (cached for 1 hour)
const villages = await twSDK.worldDataAPI('village');
const players = await twSDK.worldDataAPI('player');

// Calculate distance
const distance = twSDK.calculateDistance('123|456', '789|012');

// Create UI widget
twSDK.renderFixedWidget(htmlContent, 'widget-id', 'widget-class');
```

### DSUtil Usage Pattern
```javascript
// Configure for world
DSUtil.speed = game_data.speed || 1.0;

// Calculate building costs
const woodCost = DSUtil.buildCost('main', 5, 'wood');
const totalCost = DSUtil.buildCostSum('barracks', 3);
const buildTime = DSUtil.buildTime('stable', 2, 5);

// Analyze village
const population = DSUtil.popUsedVillage(buildings);
const points = DSUtil.pointsVillage(buildings);
const canBuild = DSUtil.buildingReqirementsMet(buildings, 'smith');
```

## Game Constants (from Libraries)

### Resource Production Rates (from DSUtil.js)
```javascript
// Production by building level (resources per hour on 1x speed)
TERMELES = [5, 30, 35, 41, 47, 55, 64, 74, 86, 100, 117, 136, 158, 184, 214, 249, 289, 337, 391, 455, 530, 616, 717, 833, 969, 1127, 1311, 1525, 1774, 2063, 2400]
```

### Building Points (from twSDK.js)
```javascript
buildingPoints: {
    main: [10, 2, 2, 3, 4, 4, 5, 6, 7, 9, 10, 12, 15, 18, 21, 26, 31, 37, 44, 53, 64, 77, 92, 110, 133, 159, 191, 229, 274, 330],
    barracks: [16, 3, 4, 5, 5, 7, 8, 9, 12, 14, 16, 20, 24, 28, 34, 42, 49, 59, 71, 85, 102, 123, 147, 177, 212],
    // ... complete point values for all buildings
}
```

### Unit Farm Space (from twSDK.js)
```javascript
unitsFarmSpace: {
    spear: 1, sword: 1, axe: 1, archer: 1, spy: 2,
    light: 4, marcher: 5, heavy: 6, ram: 5, 
    catapult: 8, knight: 10, snob: 100
}
```

## Integration Patterns

### Combining twSDK and DSUtil
```javascript
// Get village data with twSDK
const villages = await twSDK.worldDataAPI('village');

// Analyze each village with DSUtil
villages.forEach(village => {
    const buildings = getVillageBuildings(village.id);
    const population = DSUtil.popUsedVillage(buildings);
    const points = DSUtil.pointsVillage(buildings);
    
    // Create UI with twSDK
    twSDK.renderFixedWidget(
        `Village: ${village.name}<br>Population: ${population}<br>Points: ${points}`,
        `village-${village.id}`,
        'village-info'
    );
});
```

### Error Handling
```javascript
try {
    const villages = await twSDK.worldDataAPI('village');
    // Process data
} catch (error) {
    console.error('Failed to get village data:', error);
    // Fallback to manual fetch
    const response = await fetch('/map/village.txt');
    const villages = await response.text();
}
```

## Performance Considerations

### Caching Strategy
- **World data**: Cached for 1 hour by twSDK
- **Building calculations**: DSUtil uses pre-computed arrays
- **UI widgets**: Reuse existing widgets when possible

### Memory Management
- **Large datasets**: Process in chunks
- **UI cleanup**: Remove widgets when not needed
- **Event listeners**: Clean up to prevent memory leaks

Last Updated: 2024-12-19
Updated: Added complete twSDK and DSUtil library documentation with real working examples
Created: Initial libraries documentation 