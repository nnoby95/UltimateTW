# TribalWars - Calculations

## Quick Reference
- Travel Time: `distance * unit_speed * world_speed`
- Farm Space: `sum(unit_count * unit_farm_space)`
- Attack Power: `unit_attack * unit_count * weapon_bonus`
- Building Cost: `base_cost * (level + 1) ^ 1.5`
- Population: `sum(building_population) - sum(unit_population)`

## Detailed Information

### Travel Time Calculation
**Formula**: `Math.ceil(distance * unit_speed * world_speed)`
**Where**:
- `distance = Math.sqrt((x2-x1)² + (y2-y1)²)`
- `unit_speed = slowest unit in group`
- `world_speed = world configuration (usually 1.0)`

**Example**:
```javascript
function calculateTravelTime(fromVillage, toVillage, units) {
  const distance = Math.sqrt(
    Math.pow(toVillage.x - fromVillage.x, 2) + 
    Math.pow(toVillage.y - fromVillage.y, 2)
  );
  const slowestUnit = Math.min(...units.map(u => u.speed));
  return Math.ceil(distance * slowestUnit * worldSpeed);
}
```

### Farm Space Calculation
**Formula**: `sum(unit_count * unit_farm_space)`
**Unit Farm Spaces**:
- Spearman: 1
- Swordsman: 1
- Axeman: 1
- Archer: 1
- Spy: 2
- Light Cavalry: 4
- Marcher: 5
- Heavy Cavalry: 6
- Ram: 5
- Catapult: 8
- Knight: 10
- Nobleman: 100

**Example**:
```javascript
function calculateFarmSpace(units) {
  const farmSpaces = {
    spear: 1, sword: 1, axe: 1, archer: 1,
    spy: 2, light: 4, marcher: 5, heavy: 6, ram: 5, 
    catapult: 8, knight: 10, snob: 100
  };
  
  return Object.entries(units).reduce((total, [unit, count]) => {
    return total + (count * (farmSpaces[unit] || 0));
  }, 0);
}
```

## DSUtil Library Calculations (Real Working Formulas)

### Building Cost Calculation (from DSUtil.js)
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

### Resource Production (Real Production Rates)
```javascript
// Production by building level (resources per hour on 1x speed)
TERMELES = [5, 30, 35, 41, 47, 55, 64, 74, 86, 100, 117, 136, 158, 184, 214, 249, 289, 337, 391, 455, 530, 616, 717, 833, 969, 1127, 1311, 1525, 1774, 2063, 2400]

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

### Building Points (Complete Arrays)
```javascript
buildingPoints: {
    main: [10, 2, 2, 3, 4, 4, 5, 6, 7, 9, 10, 12, 15, 18, 21, 26, 31, 37, 44, 53, 64, 77, 92, 110, 133, 159, 191, 229, 274, 330],
    barracks: [16, 3, 4, 5, 5, 7, 8, 9, 12, 14, 16, 20, 24, 28, 34, 42, 49, 59, 71, 85, 102, 123, 147, 177, 212],
    // ... complete point values for all buildings
}
```

### Unit Farm Space (Accurate Values)
```javascript
unitsFarmSpace: {
    spear: 1, sword: 1, axe: 1, archer: 1, spy: 2,
    light: 4, marcher: 5, heavy: 6, ram: 5, 
    catapult: 8, knight: 10, snob: 100
}
```

### Village Analysis Methods
```javascript
DSUtil.popUsed(buildingType, level)               // Population used by building
DSUtil.popUsedVillage(buildings)                  // Total village population
DSUtil.pointsVillage(buildings)                   // Total village points
DSUtil.getBuildingObj(type, lvl, hqlvl)           // Complete building analysis
DSUtil.buildingReqirementsMet(buildings, type)    // Check build requirements
```

### Building Cost Calculation (Legacy)
**Formula**: `base_cost * (level + 1) ^ 1.5`
**Base Costs** (Main Building):
- Level 1: 70 wood, 40 stone, 60 iron
- Level 2: 90 wood, 50 stone, 75 iron
- Level 3: 115 wood, 65 stone, 100 iron

**Example**:
```javascript
function calculateBuildingCost(building, level) {
  const baseCosts = {
    main: { wood: 70, stone: 40, iron: 60 },
    barracks: { wood: 210, stone: 140, iron: 260 },
    stable: { wood: 780, stone: 420, iron: 660 }
  };
  
  const baseCost = baseCosts[building];
  const multiplier = Math.pow(level + 1, 1.5);
  
  return {
    wood: Math.floor(baseCost.wood * multiplier),
    stone: Math.floor(baseCost.stone * multiplier),
    iron: Math.floor(baseCost.iron * multiplier)
  };
}
```

### Population Calculation
**Formula**: `sum(building_population) - sum(unit_population)`
**Building Population**:
- Main Building: 5 per level
- Barracks: 1 per level
- Stable: 2 per level
- Garage: 2 per level
- Church: 4 per level
- Watchtower: 1 per level
- Snob: 100 per level
- Smith: 2 per level
- Place: 1 per level
- Statue: 1 per level
- Market: 4 per level
- Wood: 0 per level
- Stone: 0 per level
- Iron: 0 per level
- Farm: 0 per level
- Storage: 0 per level
- Hide: 0 per level
- Wall: 0 per level

**Example**:
```javascript
function calculatePopulation(buildings, units) {
  const buildingPopulation = {
    main: 5, barracks: 1, stable: 2, garage: 2,
    church: 4, watchtower: 1, snob: 100, smith: 2,
    place: 1, statue: 1, market: 4, wood: 0,
    stone: 0, iron: 0, farm: 0, storage: 0,
    hide: 0, wall: 0
  };
  
  const unitPopulation = {
    spear: 1, sword: 1, axe: 1, archer: 1,
    spy: 2, light: 4, marcher: 5, heavy: 6, ram: 5, 
    catapult: 8, knight: 10, snob: 100
  };
  
  const buildingPop = Object.entries(buildings).reduce((total, [building, level]) => {
    return total + (level * (buildingPopulation[building] || 0));
  }, 0);
  
  const unitPop = Object.entries(units).reduce((total, [unit, count]) => {
    return total + (count * (unitPopulation[unit] || 0));
  }, 0);
  
  return buildingPop - unitPop;
}
```

### Attack Power Calculation
**Formula**: `unit_attack * unit_count * weapon_bonus`
**Unit Attack Values**:
- Spearman: 10 (infantry)
- Swordsman: 25 (infantry)
- Axeman: 40 (infantry)
- Archer: 15 (archer)
- Spy: 0 (scout)
- Light Cavalry: 130 (cavalry)
- Marcher: 150 (cavalry)
- Heavy Cavalry: 150 (cavalry)
- Ram: 2 (siege)
- Catapult: 100 (siege)
- Knight: 200 (cavalry)
- Nobleman: 0 (special)

**Example**:
```javascript
function calculateAttackPower(units, weaponBonus = 1.0) {
  const attackValues = {
    spear: 10, sword: 25, axe: 40, archer: 15,
    spy: 0, light: 130, marcher: 150, heavy: 150, ram: 2, 
    catapult: 100, knight: 200, snob: 0
  };
  
  return Object.entries(units).reduce((total, [unit, count]) => {
    return total + (count * (attackValues[unit] || 0) * weaponBonus);
  }, 0);
}
```

### Resource Production Calculation
**Formula**: `base_production * (1 + building_bonus) * world_speed`
**Base Production** (per hour):
- Wood: 1 per level of Wood building
- Stone: 1 per level of Stone building
- Iron: 1 per level of Iron building

**Example**:
```javascript
function calculateResourceProduction(buildings, worldSpeed = 1.0) {
  const woodLevel = buildings.wood || 0;
  const stoneLevel = buildings.stone || 0;
  const ironLevel = buildings.iron || 0;
  
  return {
    wood: Math.floor(woodLevel * worldSpeed),
    stone: Math.floor(stoneLevel * worldSpeed),
    iron: Math.floor(ironLevel * worldSpeed)
  };
}
```

### Building Time Calculation
**Formula**: `base_time * (level + 1) ^ 1.5 / world_speed`
**Base Times** (in seconds):
- Main Building: 60
- Barracks: 40
- Stable: 50
- Workshop: 60

**Example**:
```javascript
function calculateBuildingTime(building, level, worldSpeed = 1.0) {
  const baseTimes = {
    main: 60, barracks: 40, stable: 50, workshop: 60
  };
  
  const baseTime = baseTimes[building] || 60;
  const multiplier = Math.pow(level + 1, 1.5);
  
  return Math.ceil((baseTime * multiplier) / worldSpeed);
}
```

## Common Issues & Solutions

### Problem: Floating point precision errors
**Solution**: Use Math.floor() for resource calculations
```javascript
const wood = Math.floor(woodProduction * timeMultiplier);
```

### Problem: Negative population values
**Solution**: Ensure unit counts don't exceed building population
```javascript
const availablePopulation = buildingPopulation - usedPopulation;
const maxUnits = Math.floor(availablePopulation / unitPopulationCost);
```

### Problem: Travel time rounding errors
**Solution**: Use Math.ceil() for travel time calculations
```javascript
const travelTime = Math.ceil(distance * speed * worldSpeed);
```

Last Updated: 2024-12-19
Updated: Corrected unit farm spaces, population calculations, and resource production based on actual TribalWars game data
Created: Initial calculations documentation 