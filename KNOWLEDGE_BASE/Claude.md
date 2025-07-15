# TRIBAL WARS REAL KNOWLEDGE BASE
*Based only on provided documentation - no fabricated content*

## 📚 SOURCE DOCUMENTS
- **TribalWars AI Training.json** - twSDK & DSUtil API documentation
- **twSDK.js** - Complete SDK library (89+ methods)
- **DSUtil.js** - Building calculator library (17+ methods) 
- **RedAlert Script Template** - Professional structure pattern
- **DOM Manipulation Method.md** - Automation techniques
- **tribal_wars_presentation.md** - Game mechanics overview
- **SZEM 4.6 Structure Map.md** - Real script analysis
- **DOM Scraping Tutorials** - Data extraction methods

---

## 🌐 DOCUMENTED API ENDPOINTS

### World Data APIs (from twSDK.js)
```javascript
// Core data endpoints
worldInfoInterface: '/interface.php?func=get_config'
unitInfoInterface: '/interface.php?func=get_unit_info'
buildingInfoInterface: '/interface.php?func=get_building_info'
worldDataVillages: '/map/village.txt'
worldDataPlayers: '/map/player.txt'
worldDataTribes: '/map/ally.txt'
worldDataConquests: '/map/conquer_extended.txt'
```

### Data Formats (from AI Training.json)
```javascript
// Village data format: [villageId, villageName, x, y, playerId, points, type]
// Player data format: [playerId, playerName, tribeId, villages, points, rank]  
// Tribe data format: [tribeId, tribeName, tribeTag, players, villages, points, allPoints, rank]
// Conquest data format: [villageId, timestamp, newPlayerId, oldPlayerId, oldTribeId, newTribeId, points]
```

---

## 🧮 REAL CALCULATIONS & FORMULAS

### Building Calculations (from DSUtil.js)
```javascript
// Resource cost calculation
buildCost(building, lvl, res) {
    return Math.round((this.buildConf[building][res]) * 
           (Math.pow(this.buildConf[building][res + '_factor'], (parseInt(lvl) - 1))));
}

// Build time with HQ reduction
buildTime(building, lvl, hqlvl) {
    let build_time = this.buildConf[building]['build_time'] / this.speed;
    let hq_factor = this.hqFactor(hqlvl);
    let calculated_time = hq_factor * build_time * (min_times[lvl - 1]);
    return Math.round(calculated_time);
}

// HQ factor calculation
hqFactor(lvl) {
    return Math.pow(1.05, (-this.checklvl(lvl, 'main')));
}
```

### Distance & Travel (from twSDK.js)
```javascript
// Distance calculation
calculateDistance: function (from, to) {
    const [x1, y1] = from.split('|');
    const [x2, y2] = to.split('|');
    const deltaX = Math.abs(x1 - x2);
    const deltaY = Math.abs(y1 - y2);
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

// Travel time calculation  
calculateTimesByDistance: async function (distance) {
    let travelTime = Math.round((distance * time * 60) / speed / unit_speed);
    return this.secondsToHms(travelTime);
}
```

### Resource Production (from DSUtil.js)
```javascript
// Storage capacity by level
getStorage(lvl) {
    let storage_values = [813, 1000, 1229, 1512, 1859, 2285, 2810, 3454, 4247, 5222, 6420, 7893, 9705, 11932, 14670, 18037, 22177, 27266, 33523, 41217, 50675, 62305, 76604, 94184, 115798, 142373, 175047, 215219, 264611, 325337, 400000];
    return storage_values[this.checklvl(lvl, 'storage')];
}

// Farm capacity by level
getFarm(lvl) {
    let farm_values = [205, 240, 281, 330, 386, 453, 531, 622, 729, 855, 1002, 1175, 1377, 1614, 1891, 2217, 2598, 3046, 3570, 4184, 4904, 5748, 6737, 7897, 9256, 10849, 12716, 14904, 17470, 20476, 24000];
    return farm_values[this.checklvl(lvl, 'farm')];
}
```

---

## 🎮 GAME MECHANICS (from tribal_wars_presentation.md)

### Core Resources
1. **🪵 Wood** - Basic construction material
2. **🧱 Clay/Stone** - Building material  
3. **⚔️ Iron** - Weapons and advanced buildings
4. **🌾 Food** - Population support from farms
5. **📦 Storage** - Warehouse capacity limits

### Unit Types & Farm Space (from twSDK.js)
```javascript
unitsFarmSpace: {
    spear: 1, sword: 1, axe: 1, archer: 1, spy: 2,
    light: 4, marcher: 5, heavy: 6, ram: 5, 
    catapult: 8, knight: 10, snob: 100
}
```

### Building List (from twSDK.js)
```javascript
buildingsList: [
    'main', 'barracks', 'stable', 'garage', 'church', 'church_f', 
    'watchtower', 'snob', 'smith', 'place', 'statue', 'market', 
    'wood', 'stone', 'iron', 'farm', 'storage', 'hide', 'wall'
]
```

### Building Requirements (from DSUtil.js)
```javascript
buildingReqirementsMet(buildings, type) {
    switch (type) {
    case "barracks": return (buildings["main"] >= 3)
    case "stable": return (buildings["main"] >= 10 && buildings["barracks"] >= 5 && buildings["smith"] >= 5)
    case "garage": return (buildings["main"] >= 10 && buildings["smith"] >= 10)
    case "snob": return (buildings["main"] >= 20 && buildings["market"] >= 10 && buildings["smith"] >= 20)
    case "smith": return (buildings["main"] >= 5 && buildings["barracks"] >= 1)
    case "market": return (buildings["main"] >= 3 && buildings["storage"] >= 2)
    case "wall": return (buildings["barracks"] >= 1)
    }
}
```

---

## 💻 PROVEN CODE SOLUTIONS

### twSDK Library Usage (from AI Training.json)
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

### DOM Manipulation Method (from DOM Manipulation Method.md)
```javascript
// Rate limiting variables (MUST be global scope)
let actionBusy = false;
let lastActionTime = 0;

function performGameAction(parameters) {
    // Rate limiting check
    if (actionBusy || (Date.now() - lastActionTime < 200)) {
        return;
    }
    
    actionBusy = true;
    lastActionTime = Date.now();
    
    // Open game page in new tab
    const gameTab = window.open(gamePageUrl, '_blank');
    
    // Wait for page load, then manipulate DOM
    setTimeout(() => {
        try {
            // DOM manipulation code here
            const form = gameTab.document.forms.units;
            form.axe.value = axes;
            form.attack.click();
        } catch (e) {
            console.error('Action failed:', e);
            actionBusy = false;
        }
    }, 3000);
}
```

### Safe DOM Scraping (from Safe DOM Scraping.txt)
```javascript
// Global rate limiting system
let isRequestActive = false;
let lastRequestTime = 0;
const MIN_DELAY_BETWEEN_REQUESTS = 5000;

async function safeRequest(url) {
    // Wait if another request is active
    while (isRequestActive) {
        await sleep(100);
    }
    
    // Ensure minimum time between requests
    const timeSinceLastRequest = Date.now() - lastRequestTime;
    if (timeSinceLastRequest < MIN_DELAY_BETWEEN_REQUESTS) {
        const waitTime = MIN_DELAY_BETWEEN_REQUESTS - timeSinceLastRequest;
        await sleep(waitTime);
    }
    
    isRequestActive = true;
    lastRequestTime = Date.now();
    
    try {
        const response = await fetch(url);
        const html = await response.text();
        return new DOMParser().parseFromString(html, 'text/html');
    } finally {
        isRequestActive = false;
    }
}
```

---

## 🏗️ SCRIPT ARCHITECTURE (from RedAlert Template)

### Professional Structure
```javascript
var scriptData = {
    name: 'Script Template',
    version: 'v1.0',
    author: 'RedAlert',
    authorUrl: 'https://twscripts.ga/',
    helpLink: '#',
};

// Globals
var allowedGameScreens = ['overview_villages'];
var allowedGameModes = ['prod'];

// Translations
var translations = {
    en_DK: { 'Script Template': 'Script Template' },
    en_US: { 'Script Template': 'Script Template' }
};

// Helper: Text Translator
function tt(string) {
    var gameLocale = game_data.locale;
    if (translations[gameLocale] !== undefined) {
        return translations[gameLocale][string];
    } else {
        return translations['en_DK'][string];
    }
}

// Initialize Script
(function () {
    const gameScreen = getParameterByName('screen');
    const gameMode = getParameterByName('mode');
    
    if (allowedGameScreens.includes(gameScreen)) {
        if (allowedGameModes.includes(gameMode)) {
            // Init script logic here
        }
    }
})();
```

---

## 🔧 REAL WORKING LIBRARIES

### twSDK Methods (89+ documented methods)
```javascript
// Data Access
await twSDK.worldDataAPI(entity)                    // Get cached world data
twSDK.calculateDistance(from, to)                   // Calculate distance
twSDK.calculateDistanceFromCurrentVillage(coord)    // Distance from current village
await twSDK.calculateTimesByDistance(distance)      // Travel times for all units

// Coordinate Processing  
twSDK.getCoordFromString(string)                    // Extract first coordinate
twSDK.getLastCoordFromString(string)               // Extract last coordinate
twSDK.getContinentByCoord(coord)                   // Get continent number
twSDK.filterVillagesByPlayerIds(playerIds, villages) // Filter villages by owner

// UI Creation
twSDK.renderFixedWidget(body, id, class, style, width, name) // Floating widget
twSDK.renderBoxWidget(body, id, class, style)      // Inline widget
twSDK.buildUnitsPicker(selected, ignore, type)     // Unit selection interface

// Utilities
twSDK.formatAsNumber(number)                       // Format with thousands separators
twSDK.secondsToHms(timestamp)                      // Convert seconds to HH:MM:SS
twSDK.copyToClipboard(string)                      // Copy text to clipboard
twSDK.getServerDateTime()                          // Get current server time
twSDK.csvToArray(strData, delimiter)               // Parse CSV data
```

### DSUtil Methods (17+ documented methods)
```javascript
// Building Calculations
DSUtil.buildCost(building, lvl, res)               // Resource cost for level
DSUtil.buildCostSum(building, lvl)                 // Total cost (wood+stone+iron)
DSUtil.buildTime(building, lvl, hqlvl)             // Build time with HQ reduction
DSUtil.hqFactor(lvl)                              // HQ time reduction factor

// Capacity Functions
DSUtil.getStorage(lvl)                             // Storage capacity by level
DSUtil.getFarm(lvl)                               // Population capacity by level  
DSUtil.getMarket(lvl)                             // Number of traders by level
DSUtil.getResProduction(lvl, type)                // Hourly production by level

// Village Analysis
DSUtil.popUsed(buildingType, level)               // Population used by building
DSUtil.popUsedVillage(buildings)                  // Total village population
DSUtil.pointsVillage(buildings)                   // Total village points
DSUtil.getBuildingObj(type, lvl, hqlvl)           // Complete building analysis
DSUtil.buildingReqirementsMet(buildings, type)    // Check build requirements

// Utilities
DSUtil.convertSecToTimeString(sec)                // Seconds to time string
DSUtil.convertTimeStringToSec(time)               // Time string to seconds
DSUtil.checklvl(lvl, type)                        // Smart level resolution
```

---

## 🔧 SZEM 4.6 REAL ARCHITECTURE (from Structure Map)

### Worker System
```javascript
// Main worker for async operations
var worker = createWorker(function(t) {
    t.addEventListener("message", function(e) {
        switch(e.data.id) {
            case "farm": szem4_farmolo_motor(); break;
            case "vije": szem4_VIJE_motor(); break;
            case "epit": szem4_EPITO_motor(); break;
            case "adatok": szem4_ADAT_motor(); break;
            case "gyujto": szem4_GYUJTO_motor(); break;
        }
    });
});
```

### Module Structure
```javascript
// Farmer Module Variables
SZEM4_FARM = {
    ALL_UNIT_MOVEMENT: {},    // {villageCoord: [[capacity, arrivalTime, extraRes]]}
    ALL_SPY_MOVEMENTS: {},    // {villageCoord: lastSpyTime}
    DOMINFO_FARMS: {},        // Target villages data
    DOMINFO_FROM: {},         // Source villages data
    OPTIONS: {}               // User settings
}

// Rate limiting
FARM_PAUSE = true
FARM_LEPES = 0              // Current step
FARM_HIBA = 0               // Error counter
```

### Sound System
```javascript
// Sound files used in SZEM 4.6
farmolas_1-11.mp3    // Random farming sounds
farmolas_exp.mp3     // Big haul sound
naplobejegyzes.wav   // Log entry
bot2.wav             // Bot detection alert
bejovo.wav           // Incoming attack
epites.wav           // Building started
```

---

## 📊 GAME CONSTANTS (from source files)

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

---

## 🚀 INITIALIZATION PATTERNS

### twSDK Standard Init (from AI Training.json)
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

### DSUtil Configuration (from AI Training.json)
```javascript
// Configure for current world settings
DSUtil.speed = game_data.speed || 1.0;
DSUtil.datalvl = true; // Use current village data
```

---

## ⚠️ DOCUMENTED LIMITATIONS

### Rate Limiting Requirements (from DOM Manipulation Method.md)
- **Minimum delay**: 200ms between requests
- **Variable declarations**: Must be at global scope
- **Error handling**: Always reset busy flags in catch blocks
- **Timing**: 3000ms for page loads, 2000ms for confirmations

### What Doesn't Work (from DOM Manipulation Method.md)
- ❌ Direct HTTP POST to game endpoints
- ❌ AJAX calls to game.php
- ❌ Custom form submissions
- ❌ Skipping the rally point step

### Browser Restrictions (from Safe DOM Scraping.txt)
- **Global lock**: Only one request at a time
- **Minimum delays**: 5+ seconds between requests looks human
- **Random delays**: 1-3 second processing time
- **Error handling**: Graceful failure required

---

## 🎯 PROVEN SUCCESS PATTERNS

### DOM Manipulation (from DOM Manipulation Method.md)
1. ✅ Opening actual game pages
2. ✅ Manipulating form.fieldName.value
3. ✅ Using element.click() on buttons  
4. ✅ Waiting for page loads with setTimeout
5. ✅ Multi-step automation (rally → confirm)

### Data Access (from twSDK.js)
1. ✅ twSDK.worldDataAPI() for cached world data
2. ✅ Fetch + DOMParser for current data
3. ✅ CSS selectors for element extraction
4. ✅ Rate limiting with global flags

### UI Creation (from twSDK.js)
1. ✅ renderFixedWidget() for floating interfaces
2. ✅ renderBoxWidget() for inline content
3. ✅ buildUnitsPicker() for unit selection
4. ✅ Draggable widgets with jQuery

---

