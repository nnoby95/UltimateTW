# 🎯 Tribal Wars Development Reference

> **Complete development toolkit for Tribal Wars automation**  
> **Version**: 1.0.0  
> **Date**: July 2025  
> **Purpose**: Quick reference for Tribal Wars bot development and automation

---

## 📚 **TABLE OF CONTENTS**

1. [Game Data Commands](#-game-data-commands)
2. [Library Reference](#-library-reference)
3. [Integration Patterns](#-integration-patterns)
4. [Common Use Cases](#-common-use-cases)
5. [Best Practices](#-best-practices)
6. [Troubleshooting](#-troubleshooting)
7. [Quick Start Templates](#-quick-start-templates)

---

## 🎮 **GAME DATA COMMANDS**

> **Access all game information from the `game_data` object**  
> **Usage**: Copy these commands into browser console while on any Tribal Wars page

### 👤 **PLAYER INFORMATION**

```javascript
// Basic Player Data
game_data.player.id                    // 849238583 - Unique player ID
game_data.player.name                  // "nnoby95" - Player name
game_data.player.points                // "563" - Current points
game_data.player.rank                  // 2506 - Current rank
game_data.player.pp                    // 2828 - Premium Points
game_data.player.villages              // "1" - Number of villages owned
game_data.player.ally                  // "0" - Tribe ID (0 = no tribe)
game_data.player.date_started          // 1752242900 - Account creation timestamp

// Player Status & Notifications
game_data.player.new_report            // 41 - Unread reports
game_data.player.new_quest             // 1 - Available quests
game_data.player.new_igm               // "0" - Unread in-game messages
game_data.player.new_items             // "0" - New items available
game_data.player.new_forum_post        // 0 - New forum posts
game_data.player.new_ally_application  // 0 - New tribe applications
game_data.player.new_ally_invite       // "0" - New tribe invitations
game_data.player.new_buddy_request     // "0" - New friend requests
game_data.player.new_daily_bonus       // "0" - Daily bonus available

// Player Military & Account Status
game_data.player.incomings             // "0" - Incoming attacks
game_data.player.supports              // "0" - Support commands
game_data.player.knight_location       // null - Knight/Paladin location
game_data.player.knight_unit           // null - Knight/Paladin unit
game_data.player.email_valid           // "1" - Email validation status
game_data.player.is_guest              // "0" - Guest account status
game_data.player.sitter                // "0" - Sitter mode status
game_data.player.sitter_type           // "normal" - Type of sitter access
game_data.player.sleep_start           // "0" - Sleep mode start
game_data.player.sleep_end             // "0" - Sleep mode end
game_data.player.sleep_last            // "0" - Last sleep mode
```

### 🏘️ **VILLAGE INFORMATION**

```javascript
// Basic Village Data
game_data.village.id                   // 16404 - Unique village ID
game_data.village.name                 // "nnoby95's village" - Village name
game_data.village.display_name         // "nnoby95's village (369|493) K43" - Full display name
game_data.village.coord                // "369|493" - Coordinate string
game_data.village.x                    // 369 - X coordinate
game_data.village.y                    // 493 - Y coordinate
game_data.village.points               // 563 - Village points
game_data.village.player_id            // 849238583 - Owner player ID

// Population & Capacity
game_data.village.pop                  // 964 - Current population used
game_data.village.pop_max              // 1376 - Maximum population (farm capacity)
game_data.village.storage_max          // 18037 - Warehouse capacity per resource
game_data.village.trader_away          // 0 - Traders currently away

// Village Status
game_data.village.modifications        // 0 - Village modifications
game_data.village.is_farm_upgradable   // true - Can upgrade farm
game_data.village.last_res_tick        // 1752401279000 - Last resource tick timestamp
game_data.village.bonus_id             // null - Bonus village type ID
```

### 💰 **CURRENT RESOURCES**

```javascript
// Resource Amounts
game_data.village.wood                 // 10037 - Current wood (integer)
game_data.village.stone                // 9297 - Current stone (integer)
game_data.village.iron                 // 8479 - Current iron (integer)

// Precise Resource Values
game_data.village.wood_float           // 10036.936504286754 - Precise wood amount
game_data.village.stone_float          // 9296.936504286754 - Precise stone amount
game_data.village.iron_float           // 8478.936504286754 - Precise iron amount

// Resource Production (per second)
game_data.village.wood_prod            // 0.091546611319846 - Wood production per second
game_data.village.stone_prod           // 0.091546611319846 - Stone production per second
game_data.village.iron_prod            // 0.091546611319846 - Iron production per second

// Production Calculations
Math.round(game_data.village.wood_prod * 3600)   // 330 - Wood per hour
Math.round(game_data.village.stone_prod * 3600)  // 330 - Stone per hour
Math.round(game_data.village.iron_prod * 3600)   // 330 - Iron per hour
Math.round(game_data.village.wood_prod * 86400)  // 7920 - Wood per day
Math.round(game_data.village.stone_prod * 86400) // 7920 - Stone per day
Math.round(game_data.village.iron_prod * 86400)  // 7920 - Iron per day
```

### 🎁 **RESOURCE BONUSES**

```javascript
// Bonus Multipliers
game_data.village.bonus.wood           // 1.12 - Wood bonus (12% increase)
game_data.village.bonus.stone          // 1.12 - Stone bonus (12% increase)
game_data.village.bonus.iron           // 1.12 - Iron bonus (12% increase)

// Bonus Percentage Calculations
((game_data.village.bonus.wood - 1) * 100).toFixed(1)   // "12.0%" - Wood bonus
((game_data.village.bonus.stone - 1) * 100).toFixed(1)  // "12.0%" - Stone bonus
((game_data.village.iron - 1) * 100).toFixed(1)         // "12.0%" - Iron bonus
```

### 🏗️ **BUILDING LEVELS**

```javascript
// Military Buildings
game_data.village.buildings.main       // "15" - Headquarters level
game_data.village.buildings.barracks   // "6" - Barracks level
game_data.village.buildings.stable     // "4" - Stable level
game_data.village.buildings.garage     // "0" - Workshop level
game_data.village.buildings.smith      // "5" - Smithy level
game_data.village.buildings.snob       // "0" - Academy level
game_data.village.buildings.place      // "1" - Rally Point level

// Resource Buildings
game_data.village.buildings.wood       // "13" - Timber Camp level
game_data.village.buildings.stone      // "13" - Clay Pit level
game_data.village.buildings.iron       // "13" - Iron Mine level
game_data.village.buildings.farm       // "12" - Farm level
game_data.village.buildings.storage    // "15" - Warehouse level

// Defensive & Utility Buildings
game_data.village.buildings.wall       // "6" - Wall level
game_data.village.buildings.hide       // "3" - Hiding Place level
game_data.village.buildings.watchtower // "0" - Watchtower level
game_data.village.buildings.market     // "5" - Market level

// Building Checks
parseInt(game_data.village.buildings.garage) > 0      // false - No workshop
parseInt(game_data.village.buildings.snob) > 0        // false - No academy
parseInt(game_data.village.buildings.wall) > 0        // true - Wall exists
parseInt(game_data.village.buildings.main) >= 20      // false - Can't build academy yet
parseInt(game_data.village.buildings.main) >= 10      // true - Can build stable/workshop
parseInt(game_data.village.buildings.barracks) >= 1   // true - Can build wall
```

### 🎮 **GAME WORLD INFORMATION**

```javascript
// World Identity
game_data.world                        // "en148" - World name
game_data.market                       // "en" - Market/language code
game_data.locale                       // "en_DK" - Locale setting
game_data.device                       // "desktop" - Device type

// Game Version & Technical
game_data.version                      // "7d3266bc release_8.397\n" - Full version string
game_data.majorVersion                 // "8.397" - Major version number
game_data.screen                       // "overview" - Current screen
game_data.mode                         // null - Current mode
game_data.pregame                      // false - Pre-game status
game_data.RTL                          // false - Right-to-left layout
game_data.time_generated               // 1752401279982 - Data generation timestamp
```

### ⚔️ **AVAILABLE UNITS**

```javascript
// Unit Array Access
game_data.units                        // Array of all available unit types
game_data.units.length                 // 10 - Number of available unit types

// Individual Unit Access
game_data.units[0]                     // "spear" - Spear fighters
game_data.units[1]                     // "sword" - Swordsmen
game_data.units[2]                     // "axe" - Axemen
game_data.units[3]                     // "spy" - Scouts
game_data.units[4]                     // "light" - Light cavalry
game_data.units[5]                     // "heavy" - Heavy cavalry
game_data.units[6]                     // "ram" - Rams
game_data.units[7]                     // "catapult" - Catapults
game_data.units[8]                     // "snob" - Noblemen
game_data.units[9]                     // "militia" - Militia

// Unit Availability Checks
game_data.units.includes('spear')      // true - Spears available
game_data.units.includes('archer')     // false - Archers not available
game_data.units.includes('knight')     // false - Knights not available
game_data.units.includes('marcher')    // false - Mounted archers not available

// World Type Detection
game_data.units.includes('archer')     // Archer world
game_data.units.includes('knight')     // Paladin world
game_data.units.includes('marcher')    // Archer + Paladin world
```

### 💎 **PREMIUM FEATURES**

```javascript
// Feature Availability
game_data.features.Premium.possible           // true - Premium can be activated
game_data.features.Premium.active             // true - Premium is active
game_data.features.AccountManager.possible    // false - Account Manager not available
game_data.features.AccountManager.active      // false - Account Manager not active
game_data.features.FarmAssistent.possible     // true - Farm Assistant can be activated
game_data.features.FarmAssistent.active       // true - Farm Assistant is active

// Premium Feature Checks
game_data.features.Premium.active             // true - Has Premium Account
game_data.features.FarmAssistent.active       // true - Has Farm Assistant
game_data.features.AccountManager.active      // false - No Account Manager
```

### 🔒 **SECURITY & AUTHENTICATION**

```javascript
// Security Tokens
game_data.csrf                         // "fda1c45b" - CSRF protection token

// CSRF Token Usage
const secureUrl = `/game.php?village=16404&screen=main&action=upgrade&h=${game_data.csrf}`;
const formData = new FormData();
formData.append('h', game_data.csrf);
formData.append('action', 'build');
```

---

## 📚 **LIBRARY REFERENCE**

> **Based on TribalWars_CoreFunctions.json library**

### **twSDK (Tribal Wars JavaScript SDK)**

**Purpose**: Comprehensive framework for UI, data access, world interaction, and utilities

#### **Initialization**
```javascript
await twSDK.init({
  scriptData: {
    name: 'My Script',
    version: '1.0.0',
    author: 'Developer'
  },
  allowedMarkets: ['en', 'de'],
  allowedScreens: ['overview'],
  isDebug: true
});
```

#### **Key Methods**

**World Data API**
```javascript
// Fetch and cache world data
const villages = await twSDK.worldDataAPI('village');
const players = await twSDK.worldDataAPI('player');
const tribes = await twSDK.worldDataAPI('ally');
const conquests = await twSDK.worldDataAPI('conquer');
```

**Distance Calculations**
```javascript
// Calculate distance between coordinates
const distance = twSDK.calculateDistance('123|456', '789|012');

// Calculate distance from current village
const distance = twSDK.calculateDistanceFromCurrentVillage('123|456');

// Calculate travel times for all units
const times = await twSDK.calculateTimesByDistance(15.5);
```

**Coordinate Parsing**
```javascript
// Extract coordinates from text
const coord = twSDK.getCoordFromString('Attack on village (123|456) was successful');
const lastCoord = twSDK.getLastCoordFromString('From (111|222) to (333|444)');

// Get continent from coordinate
const continent = twSDK.getContinentByCoord('123|456'); // Returns "41"
```

**UI Widgets**
```javascript
// Create floating widget
twSDK.renderFixedWidget(
  '<div>Widget content</div>',
  'widgetId',
  'widgetClass',
  '.widgetClass { background: #f0f0f0; }',
  '400px',
  'Widget Title'
);

// Create inline widget
twSDK.renderBoxWidget(
  '<table>Results here</table>',
  'resultsId',
  'resultsClass',
  ''
);
```

**Utilities**
```javascript
// Format numbers
twSDK.formatAsNumber(1234567); // "1.234.567"

// Time conversion
twSDK.secondsToHms(3661); // "01:01:01"

// Copy to clipboard
twSDK.copyToClipboard('123|456');

// Get server time
const serverTime = twSDK.getServerDateTime();
```

### **DSUtil (Dark Souls Utility / Building Calculator)**

**Purpose**: Specialized calculator for game mechanics, buildings, resources, and time calculations

#### **Configuration**
```javascript
DSUtil.speed = game_data.speed || 1.0;
DSUtil.datalvl = true; // Use current village data
```

#### **Key Methods**

**Building Costs**
```javascript
// Calculate building costs
const woodCost = DSUtil.buildCost('main', 15, 'wood');
const [wood, stone, iron] = DSUtil.buildCost('barracks', 10);
const totalCost = DSUtil.buildCostSum('stable', 15);
```

**Build Times**
```javascript
// Calculate build time with HQ reduction
const buildTime = DSUtil.buildTime('farm', 20, 25);
const timeString = DSUtil.convertSecToTimeString(buildTime);

// HQ reduction factor
const reduction = DSUtil.hqFactor(25);
```

**Resource Calculations**
```javascript
// Storage capacity
const storage = DSUtil.getStorage(15);

// Population calculations
const popUsed = DSUtil.popUsedVillage(game_data.village.buildings);
const farmCap = DSUtil.getFarm(game_data.village.buildings.farm || 1);

// Village points
const points = DSUtil.pointsVillage(game_data.village.buildings);
```

**Building Analysis**
```javascript
// Get complete building object
const buildObj = DSUtil.getBuildingObj('main', 20, 15);

// Check if upgrade is possible
if (buildObj.isEnough && buildObj.isPop) {
  console.log('Can upgrade!');
  console.log(`Cost: ${buildObj.sumCost}`);
  console.log(`Time: ${DSUtil.convertSecToTimeString(buildObj.time)}`);
}

// Check building requirements
const canBuild = DSUtil.buildingReqirementsMet('academy', game_data.village.buildings);
```

---

## 🔗 **INTEGRATION PATTERNS**

### **Standard Initialization**
```javascript
// Initialize twSDK first (async)
await twSDK.init({
  scriptData: {
    name: 'My Script',
    version: '1.0.0',
    author: 'Developer'
  },
  allowedMarkets: ['en', 'de'],
  allowedScreens: ['overview']
});

// Configure DSUtil for current world
DSUtil.speed = game_data.speed || 1.0;
DSUtil.datalvl = true;
```

### **Data Access Pattern**
```javascript
// Fetch world data
const villages = await twSDK.worldDataAPI('village');
const players = await twSDK.worldDataAPI('player');

// Process and filter
const playerIds = [123, 456]; // Target player IDs
const targetVillages = twSDK.filterVillagesByPlayerIds(playerIds, villages);

// Calculate distances
const currentCoord = `${game_data.village.x}|${game_data.village.y}`;
const nearbyTargets = targetVillages.filter(coord => {
  const distance = twSDK.calculateDistance(currentCoord, coord);
  return distance <= 20; // Within 20 fields
});
```

### **Building Analysis Pattern**
```javascript
// Get current building levels
const buildings = game_data.village.buildings;

// Analyze potential upgrade
const targetLevel = (buildings.main || 1) + 1;
const buildObj = DSUtil.getBuildingObj('main', targetLevel, buildings.main || 1);

// Check feasibility
if (buildObj.isEnough && buildObj.isPop) {
  const timeString = DSUtil.convertSecToTimeString(buildObj.time);
  console.log(`Can upgrade main to level ${targetLevel}`);
  console.log(`Cost: ${twSDK.formatAsNumber(buildObj.sumCost)} resources`);
  console.log(`Time: ${timeString}`);
} else {
  console.log('Cannot afford upgrade');
}
```

### **UI Creation Pattern**
```javascript
// Calculate village statistics
const totalPoints = DSUtil.pointsVillage(game_data.village.buildings);
const totalPop = DSUtil.popUsedVillage(game_data.village.buildings);
const farmCap = DSUtil.getFarm(game_data.village.buildings.farm || 1);

// Create UI content
const widgetHTML = `
  <h4>Village Statistics</h4>
  <div>Points: ${twSDK.formatAsNumber(totalPoints)}</div>
  <div>Population: ${totalPop}/${farmCap}</div>
  <div>Coordinate: ${game_data.village.x}|${game_data.village.y}</div>
`;

// Render widget
twSDK.renderFixedWidget(
  widgetHTML,
  'villageStats',
  'stats',
  '.stats { background: #f0f0f0; }',
  '300px',
  'Village Stats'
);
```

### **Error Handling Pattern**
```javascript
async function safeOperation() {
  try {
    // Validate inputs
    if (!game_data.village) {
      throw new Error('Village data not available');
    }
    
    // Check library initialization
    if (typeof twSDK === 'undefined') {
      throw new Error('twSDK not loaded');
    }
    
    // Perform operations
    const villages = await twSDK.worldDataAPI('village');
    const buildCost = DSUtil.buildCost('main', 20);
    
    // Success feedback
    UI.SuccessMessage('Operation completed successfully!');
    return { villages, buildCost };
    
  } catch (error) {
    console.error('Operation failed:', error);
    UI.ErrorMessage(`Error: ${error.message}`);
    return null;
  }
}
```

---

## 🎯 **COMMON USE CASES**

### **Village Optimizer**
```javascript
// Calculate optimal building upgrade sequences
const requirements = ["DSUtil for calculations", "twSDK for UI"];
const keyMethods = ["DSUtil.getBuildingObj", "DSUtil.buildingReqirementsMet", "twSDK.renderFixedWidget"];

// Pattern:
// 1. Get current buildings
// 2. Calculate upgrade costs and times
// 3. Check requirements and resources
// 4. Generate optimal sequence
// 5. Display in UI
```

### **Attack Planner**
```javascript
// Find targets and calculate attack logistics
const requirements = ["twSDK for world data", "DSUtil for unit calculations"];
const keyMethods = ["twSDK.worldDataAPI", "twSDK.getDestinationCoordinates", "twSDK.calculateTimesByDistance"];

// Pattern:
// 1. Fetch world data
// 2. Filter targets by criteria
// 3. Calculate distances and travel times
// 4. Generate attack plans
// 5. Create attack links
```

### **Resource Manager**
```javascript
// Monitor production and manage trading
const requirements = ["DSUtil for production", "twSDK for UI and utilities"];
const keyMethods = ["DSUtil.getResProduction", "DSUtil.getStorage", "twSDK.formatAsNumber"];

// Pattern:
// 1. Calculate current production rates
// 2. Determine storage capacity
// 3. Identify surpluses and deficits
// 4. Suggest trading opportunities
// 5. Display forecasts
```

### **Multi-Village Coordination**
```javascript
// Coordinate activities across multiple villages
const requirements = ["Both libraries for comprehensive analysis"];
const keyMethods = ["twSDK.worldDataAPI", "DSUtil.getBuildingObj", "twSDK.calculateDistance"];

// Pattern:
// 1. Load all player villages
// 2. Analyze each village separately
// 3. Identify optimization opportunities
// 4. Coordinate resource transfers
// 5. Bulk operations interface
```

---

## ✅ **BEST PRACTICES**

### **Performance**
- **Caching**: World data APIs cache automatically for 1 hour
- **Rate Limit**: Use `twSDK.delayBetweenRequests` for batch operations
- **Memory**: Clean up event listeners and intervals
- **Async**: Always await `twSDK.worldDataAPI` calls

### **Validation**
- **Coordinates**: Use `twSDK.coordsRegex` to validate coordinate format
- **Building Levels**: Check `DSUtil.buildConf[building].max_level` for limits
- **Resources**: Validate against storage capacity and availability
- **Requirements**: Use `DSUtil.buildingReqirementsMet` before calculations

### **User Experience**
- **Feedback**: Always provide `UI.SuccessMessage`/`UI.ErrorMessage` feedback
- **Progress**: Use `twSDK.startProgressBar` for long operations
- **Responsive**: Test widgets on mobile (`twSDK.isMobile`)
- **Cleanup**: Remove widgets and clear data on script end

### **Debugging**
- **Logging**: Use `console.debug` for development logs
- **Validation**: Check `typeof` for library availability
- **Error Handling**: Wrap all operations in try-catch blocks
- **Testing**: Test with various world types and building combinations

---

## 🔧 **TROUBLESHOOTING**

### **Common Errors**

**Undefined Library**
```javascript
// Error: twSDK is not defined
// Solution: Ensure library is loaded before script execution
if (typeof twSDK === 'undefined') {
  // handle error
}
```

**Not Initialized**
```javascript
// Error: Script not initialized
// Solution: Call await twSDK.init(config) before using other methods
// Check: Track initialization state in script
```

**Invalid Building**
```javascript
// Error: Unknown building type
// Solution: Use only building types from DSUtil.buildingsList or twSDK.buildingsList
if (!DSUtil.buildConf[building]) {
  // invalid building
}
```

**World Data Failed**
```javascript
// Error: Failed to fetch world data
// Solution: Check network connection, retry with exponential backoff
// Handling: Implement proper error handling and user feedback
```

### **Data Validation**
```javascript
// Check if game_data is loaded
typeof game_data !== 'undefined'

// Check if village data exists
game_data && game_data.village

// Check if player data exists  
game_data && game_data.player

// Validate specific data
game_data.village.wood >= 0
game_data.village.pop <= game_data.village.pop_max
```

---

## 🚀 **QUICK START TEMPLATES**

### **Simple Resource Monitor**
```javascript
// Monitor resources and alert when near storage cap
function monitorResources() {
  const nearStorageCap = Math.max(
    game_data.village.wood, 
    game_data.village.stone, 
    game_data.village.iron
  ) > (game_data.village.storage_max * 0.9);

  if (nearStorageCap) {
    console.log("Storage nearly full - need to trade or upgrade!");
    UI.WarningMessage("Storage is nearly full!");
  }
}
```

### **Building Upgrade Checker**
```javascript
// Check what buildings can be upgraded
function checkUpgrades() {
  const buildings = game_data.village.buildings;
  const upgrades = [];

  // Check main building
  if (parseInt(buildings.main) < 30) {
    const cost = DSUtil.buildCost('main', parseInt(buildings.main) + 1);
    if (game_data.village.wood >= cost[0] && 
        game_data.village.stone >= cost[1] && 
        game_data.village.iron >= cost[2]) {
      upgrades.push('main');
    }
  }

  // Check farm
  if (parseInt(buildings.farm) < 30 && game_data.village.is_farm_upgradable) {
    const cost = DSUtil.buildCost('farm', parseInt(buildings.farm) + 1);
    if (game_data.village.wood >= cost[0] && 
        game_data.village.stone >= cost[1] && 
        game_data.village.iron >= cost[2]) {
      upgrades.push('farm');
    }
  }

  return upgrades;
}
```

### **Production Calculator**
```javascript
// Calculate and display production rates
function showProduction() {
  const hourlyWood = Math.round(game_data.village.wood_prod * 3600);
  const hourlyStone = Math.round(game_data.village.stone_prod * 3600);
  const hourlyIron = Math.round(game_data.village.iron_prod * 3600);

  const dailyWood = hourlyWood * 24;
  const dailyStone = hourlyStone * 24;
  const dailyIron = hourlyIron * 24;

  console.log(`Production per hour: ${hourlyWood}/${hourlyStone}/${hourlyIron}`);
  console.log(`Production per day: ${dailyWood}/${dailyStone}/${dailyIron}`);
}
```

### **Village Status Widget**
```javascript
// Create a floating widget with village status
function createStatusWidget() {
  const buildings = game_data.village.buildings;
  const totalPoints = DSUtil.pointsVillage(buildings);
  const totalPop = DSUtil.popUsedVillage(buildings);
  const farmCap = DSUtil.getFarm(buildings.farm || 1);

  const widgetHTML = `
    <h4>Village Status</h4>
    <div>Points: ${twSDK.formatAsNumber(totalPoints)}</div>
    <div>Population: ${totalPop}/${farmCap}</div>
    <div>Resources: ${twSDK.formatAsNumber(game_data.village.wood)}/${twSDK.formatAsNumber(game_data.village.stone)}/${twSDK.formatAsNumber(game_data.village.iron)}</div>
    <div>Storage: ${Math.max(game_data.village.wood, game_data.village.stone, game_data.village.iron)}/${game_data.village.storage_max}</div>
  `;

  twSDK.renderFixedWidget(
    widgetHTML,
    'villageStatus',
    'status',
    '.status { background: #f0f0f0; padding: 10px; }',
    '300px',
    'Village Status'
  );
}
```

### **Target Finder**
```javascript
// Find targets within specified criteria
async function findTargets(maxDistance = 20, minPoints = 100, maxPoints = 5000) {
  try {
    const villages = await twSDK.worldDataAPI('village');
    const currentCoord = `${game_data.village.x}|${game_data.village.y}`;
    
    const targets = villages.filter(village => {
      const distance = twSDK.calculateDistance(currentCoord, `${village[2]}|${village[3]}`);
      const points = village[5];
      
      return distance <= maxDistance && 
             points >= minPoints && 
             points <= maxPoints &&
             village[4] !== game_data.player.id; // Not own village
    });

    console.log(`Found ${targets.length} targets`);
    return targets;
  } catch (error) {
    console.error('Failed to find targets:', error);
    return [];
  }
}
```

---

## 📊 **REFERENCE DATA**

### **Building Max Levels**
```javascript
const buildingMaxLevels = {
  main: 30, barracks: 25, stable: 20, garage: 15,
  church: 3, church_f: 1, watchtower: 20, snob: 1,
  smith: 20, place: 1, statue: 1, market: 25,
  wood: 30, stone: 30, iron: 30, farm: 30,
  storage: 30, hide: 10, wall: 20
};
```

### **Unit Speeds**
```javascript
const unitSpeeds = {
  spear: 18, sword: 22, axe: 18, archer: 18,
  spy: 9, light: 10, marcher: 10, heavy: 11,
  ram: 30, catapult: 30, knight: 10, snob: 35
};
```

### **Coordinate System**
```javascript
const coordinateSystem = {
  format: "x|y where x,y are 0-999",
  continents: "100x100 field areas, numbered YX (y/100)(x/100)",
  sectors: "20x20 field areas within continents",
  fields: "5x5 field areas within sectors"
};
```

### **Game Context Data**
```javascript
const gameContext = {
  gameData: {
    village: "game_data.village - Current village information",
    player: "game_data.player - Current player information",
    world: "game_data.world - World/server information",
    market: "game_data.market - Language/market code",
    speed: "game_data.speed - World speed multiplier",
    units: "game_data.units - Available unit types for this world",
    features: "game_data.features - Active premium features"
  },
  worldTypes: {
    archer: "Has archer and marcher units",
    paladin: "Has knight/paladin units",
    church: "Has church buildings and faith system",
    watchtower: "Has watchtower buildings"
  },
  premiumFeatures: {
    PA: "Premium Account - Additional features and convenience",
    LA: "Farm Assistant - Automated farming",
    AM: "Account Manager - Village templates and automation"
  }
};
```

---

## 💡 **USAGE EXAMPLES**

### **Simple Resource Check**
```javascript
if (game_data.village.wood > 10000) {
  console.log("Enough wood for major upgrade!");
}
```

### **Building Upgrade Check**
```javascript
if (parseInt(game_data.village.buildings.main) < 20) {
  console.log("Need to upgrade HQ to level 20 for academy");
}
```

### **Production Monitoring**
```javascript
const hourlyWood = Math.round(game_data.village.wood_prod * 3600);
console.log(`Producing ${hourlyWood} wood per hour`);
```

### **Feature Detection**
```javascript
if (game_data.features.Premium.active) {
  console.log("Premium features available!");
}
```

---

## 🔍 **DEBUG COMMANDS**

### **Complete Data Dump**
```javascript
// Display all player data in table format
console.table(game_data.player);

// Display all village data in table format  
console.table(game_data.village);

// Display all building levels
console.table(game_data.village.buildings);

// Display resource bonuses
console.table(game_data.village.bonus);

// Complete JSON dump (formatted)
console.log(JSON.stringify(game_data, null, 2));
```

### **Quick Status Check**
```javascript
// One-liner village status
console.log(`Village: ${game_data.village.name} (${game_data.village.coord}) | Points: ${game_data.village.points} | Pop: ${game_data.village.pop}/${game_data.village.pop_max} | Resources: ${game_data.village.wood}/${game_data.village.stone}/${game_data.village.iron}`);

// One-liner player status
console.log(`Player: ${game_data.player.name} | Rank: ${game_data.player.rank} | Points: ${game_data.player.points} | Villages: ${game_data.player.villages} | Reports: ${game_data.player.new_report}`);
```

---

## 📝 **NOTES**

### **Data Types**
- **Strings**: Most IDs and names are strings (even if they look like numbers)
- **Numbers**: Coordinates, amounts, levels are typically numbers
- **Timestamps**: Unix timestamps (seconds or milliseconds)
- **Booleans**: true/false values for features and status

### **Important Considerations**
- **CSRF Token**: Required for all POST requests, changes periodically
- **Building Levels**: Stored as strings, convert with `parseInt()` for calculations
- **Timestamps**: Some are in seconds, others in milliseconds
- **Coordinates**: Stored as both separate x/y numbers and combined "x|y" string
- **Resource Production**: Given per second, multiply by 3600 for hourly rate

### **Common Pitfalls**
- Always check if `game_data` exists before accessing properties
- Building levels are strings - use `parseInt()` for math operations
- Some timestamps are in seconds, others in milliseconds
- Resource production is per second, not per hour
- CSRF token is required for form submissions

---

**💾 Save this reference for quick access to all Tribal Wars development tools!**

*Last updated: July 2025 | Game Version: 8.397 | Library Version: 1.2.3-beta* 