# TribalWars - API Endpoints

## Quick Reference
- Village Info: `/game.php?village={id}&screen=overview`
- Units: `/game.php?village={id}&screen=overview_villages&mode=units`
- Resources: `/game.php?village={id}&screen=overview_villages&mode=prod`
- Buildings: `/game.php?village={id}&screen=overview_villages&mode=buildings`
- Building Queue: `/game.php?village={id}&screen=main&action=upgrade_building`
- World Data: `/map.php?v={version}` (villages, players, tribes, conquests)

## Detailed Information

### Village Overview
**Purpose**: Get village resources, population, buildings
**Endpoint**: `/game.php?village={id}&screen=overview`
**Method**: GET
**Response**: HTML page with village data
**Parsing**: Look for `#wood`, `#stone`, `#iron` elements
**Example**:
```javascript
const villageData = await fetchVillageOverview(villageId);
const wood = parseResource(villageData, 'wood');
const stone = parseResource(villageData, 'stone');
const iron = parseResource(villageData, 'iron');
```
**Notes**: Rate limited, requires valid session

### Unit Management
**Purpose**: View/manage army units
**Endpoint**: `/game.php?village={id}&screen=overview_villages&mode=units`
**Method**: GET
**Response**: HTML with unit counts for all villages
**Parsing**: Look for unit count elements in production table
**Example**:
```javascript
const unitData = await fetchUnitData(villageId);
const spearmen = parseUnitCount(unitData, 'spear');
const axemen = parseUnitCount(unitData, 'axe');
```

### Building Queue
**Purpose**: Get current building queue status
**Endpoint**: `/game.php?village={id}&screen=main`
**Method**: GET
**Response**: HTML with queue information
**Parsing**: Look for queue elements and building progress
**Example**:
```javascript
const queueData = await fetchBuildingQueue(villageId);
const currentBuilding = parseCurrentBuilding(queueData);
const queueLength = parseQueueLength(queueData);
```

### Add Building to Queue
**Purpose**: Add building to construction queue
**Endpoint**: `/game.php?village={id}&screen=main&action=upgrade_building&id={buildingId}&type=main&h={csrf}`
**Method**: GET
**Parameters**:
- `buildingId`: Building type (main, barracks, stable, etc.)
- `csrf`: CSRF token from game_data.csrf
**Example**:
```javascript
const csrf = game_data.csrf;
const url = `game.php?village=${villageId}&screen=main&action=upgrade_building&id=main&type=main&h=${csrf}`;
const response = await fetch(url);
```

### World Data API
**Purpose**: Get comprehensive world data
**Endpoint**: `/map.php?v={version}`
**Method**: GET
**Response**: JSON with world data
**Parameters**: 
- `v`: Version number
- `entity`: Data type (village, player, ally, conquer)
**Data Types**:
- **village**: `[[villageId, villageName, x, y, playerId, points, type], ...]`
- **player**: `[[playerId, playerName, tribeId, villages, points, rank], ...]`
- **ally**: `[[tribeId, tribeName, tribeTag, players, villages, points, allPoints, rank], ...]`
- **conquer**: `[[villageId, timestamp, newPlayerId, oldPlayerId, oldTribeId, newTribeId, points], ...]`
**Example**:
```javascript
const villages = await fetchWorldData('village');
const players = await fetchWorldData('player');
const tribes = await fetchWorldData('ally');
```

## Common Issues & Solutions

### Problem: Rate limiting after 10 requests/minute
**Solution**: Add delays between requests, implement request queuing
```javascript
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
await delay(1000); // 1 second delay
```

### Problem: Session expires after 30 minutes
**Solution**: Implement session refresh mechanism
```javascript
if (isSessionExpired(response)) {
    await refreshSession();
    return await retryRequest();
}
```

### Problem: Anti-bot detection
**Solution**: Add realistic delays, rotate user agents, mimic human behavior
```javascript
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
];
```

## twSDK Library API (89+ Methods)

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
twSDK.filterVillagesByPlayerIds(playerIds, villages) // Filter villages
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

### Initialization Pattern
```javascript
await twSDK.init({
    scriptData: { name: 'My Script', version: '1.0.0', author: 'Developer' },
    allowedMarkets: ['en', 'de'],
    allowedScreens: ['overview'],
    isDebug: true,
    enableCountApi: true
});
```

## World Data Formats (from twSDK)
```javascript
// Village data: [villageId, villageName, x, y, playerId, points, type]
// Player data: [playerId, playerName, tribeId, villages, points, rank]  
// Tribe data: [tribeId, tribeName, tribeTag, players, villages, points, allPoints, rank]
// Conquest data: [villageId, timestamp, newPlayerId, oldPlayerId, oldTribeId, newTribeId, points]
```

## Authentication
**Session Management**: Cookies required for authenticated requests
**Login Flow**: POST to login endpoint with credentials
**Session Validation**: Check for valid session before making requests

## Rate Limits
- **Requests per minute**: 10
- **Session timeout**: 30 minutes
- **Recommended delay**: 1-3 seconds between requests

Last Updated: 2024-12-19
Updated: Added complete twSDK API (89+ methods) and world data formats
Created: Initial API endpoints documentation 