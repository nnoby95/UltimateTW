# TribalWars - Game Mechanics

## Quick Reference
- **World Speed**: Affects travel time and production rates
- **Farm Space**: Limits total army size per village
- **Building Requirements**: Prerequisites for constructing buildings
- **Unit Training**: Requires barracks/stables and population
- **Resource Production**: Based on building levels and world speed

## Detailed Information

### World Mechanics
**Purpose**: Understanding game world configuration and its effects
**Key Parameters**:
- **World Speed**: Multiplier for travel time and production (1.0 = normal)
- **Unit Speed**: Multiplier for unit movement speed (1.0 = normal)
- **Trade Speed**: Multiplier for market transactions (1.0 = normal)
- **Night Bonus**: Attack/defense bonus during night (0.5 = 50% bonus)

**Example**:
```javascript
const worldConfig = {
  speed: 1.0,        // Normal speed
  unitSpeed: 1.0,    // Normal unit speed
  tradeSpeed: 1.0,   // Normal trade speed
  nightBonus: 0.5    // 50% night bonus
};
```

### Village Mechanics
**Purpose**: Understanding village structure and limitations
**Village Components**:
- **Buildings**: 22 different building types
- **Resources**: Wood, Stone, Iron production
- **Population**: Limited by building levels
- **Farm Space**: Limited by village level

**Building Categories**:
```javascript
const buildingCategories = {
  resource: ['wood', 'stone', 'iron'],
  military: ['barracks', 'stable', 'garage', 'smith'],
  infrastructure: ['main', 'place', 'market', 'statue'],
  defense: ['wall', 'watchtower'],
  special: ['church', 'snob'],
  storage: ['storage', 'hide'],
  population: ['farm']
};
```

### Resource Mechanics
**Purpose**: Understanding resource production and consumption
**Production Formula**: `base_production * building_level * world_speed`
**Base Production Rates**:
- Wood: 1 per hour per woodcutter level
- Stone: 1 per hour per clay pit level
- Iron: 1 per hour per iron mine level

**Storage Limits**:
- Level 1 Warehouse: 800 resources
- Level 2 Warehouse: 1000 resources
- Level 3 Warehouse: 1200 resources
- Formula: `800 + (level - 1) * 200`

**Example**:
```javascript
function calculateResourceProduction(buildings, worldSpeed) {
  return {
    wood: Math.floor((buildings.woodcutter || 0) * worldSpeed),
    stone: Math.floor((buildings.clay_pit || 0) * worldSpeed),
    iron: Math.floor((buildings.iron_mine || 0) * worldSpeed)
  };
}
```

### Population Mechanics
**Purpose**: Understanding population limits and management
**Population Sources**:
- **Buildings**: Each building provides population based on level
- **Units**: Each unit consumes population
- **Formula**: `building_population - unit_population`

**Population by Building**:
```javascript
const buildingPopulation = {
  main: 5, barracks: 1, stable: 2, garage: 2,
  church: 4, watchtower: 1, snob: 100, smith: 2,
  place: 1, statue: 1, market: 4, wood: 0,
  stone: 0, iron: 0, farm: 0, storage: 0,
  hide: 0, wall: 0
};
```

### Farm Space Mechanics
**Purpose**: Understanding army size limitations
**Farm Space Formula**: `sum(unit_count * unit_farm_space)`
**Unit Farm Spaces**:
```javascript
const unitFarmSpaces = {
  spear: 1, sword: 1, axe: 1, archer: 1,
  spy: 2, light: 4, marcher: 5, heavy: 6, ram: 5, 
  catapult: 8, knight: 10, snob: 100
};
```

**Farm Space Limits**:
- Level 1 Main Building: 80 farm space
- Level 2 Main Building: 90 farm space
- Level 3 Main Building: 100 farm space
- Formula: `80 + (level - 1) * 10`

### Building Requirements
**Purpose**: Understanding building prerequisites
**Building Dependencies**:
```javascript
const buildingRequirements = {
  barracks: { main: 3 },
  stable: { main: 3, barracks: 1 },
  garage: { main: 3, stable: 1 },
  smith: { main: 3, barracks: 1 },
  church: { main: 3, barracks: 1 },
  watchtower: { main: 1 },
  place: { main: 1 },
  market: { main: 3, place: 1 },
  statue: { main: 1 },
  wall: { main: 1 },
  storage: { main: 1 },
  hide: { main: 1 },
  farm: { main: 1 },
  snob: { main: 15, church: 1 }
};
```

### Unit Training Mechanics
**Purpose**: Understanding unit training requirements
**Training Requirements**:
```javascript
const unitTrainingRequirements = {
  spear: { barracks: 1, resources: { wood: 50, stone: 30, iron: 10 } },
  sword: { barracks: 3, resources: { wood: 30, stone: 30, iron: 70 } },
  axe: { barracks: 2, resources: { wood: 60, stone: 30, iron: 40 } },
  archer: { barracks: 5, resources: { wood: 100, stone: 30, iron: 60 } },
  spy: { stable: 1, resources: { wood: 40, stone: 50, iron: 20 } },
  light: { stable: 3, resources: { wood: 125, stone: 100, iron: 250 } },
  marcher: { stable: 5, resources: { wood: 250, stone: 100, iron: 150 } },
  heavy: { stable: 10, resources: { wood: 200, stone: 150, iron: 600 } },
  ram: { garage: 2, resources: { wood: 300, stone: 200, iron: 200 } },
  catapult: { garage: 8, resources: { wood: 320, stone: 400, iron: 100 } },
  knight: { church: 1, resources: { wood: 400, stone: 500, iron: 600 } },
  snob: { snob: 1, resources: { wood: 40000, stone: 50000, iron: 50000 } }
};
```

### Combat Mechanics
**Purpose**: Understanding battle calculations
**Attack Power Formula**: `unit_attack * unit_count * weapon_bonus`
**Unit Attack Values**:
```javascript
const unitAttackValues = {
  spear: 10, sword: 25, axe: 40, archer: 15,
  spy: 0, light: 130, marcher: 150, heavy: 150, ram: 2, 
  catapult: 100, knight: 200, snob: 0
};
```

**Defense Values**:
```javascript
const unitDefenseValues = {
  spear: { infantry: 15, cavalry: 45, archer: 50 },
  sword: { infantry: 50, cavalry: 15, archer: 40 },
  axe: { infantry: 10, cavalry: 5, archer: 10 },
  archer: { infantry: 10, cavalry: 5, archer: 50 },
  scout: { infantry: 0, cavalry: 0, archer: 0 },
  light: { infantry: 30, cavalry: 40, archer: 50 },
  heavy: { infantry: 200, cavalry: 80, archer: 180 },
  ram: { infantry: 20, cavalry: 50, archer: 20 },
  catapult: { infantry: 100, cavalry: 50, archer: 100 }
};
```

### Travel Mechanics
**Purpose**: Understanding movement and timing
**Travel Time Formula**: `distance * unit_speed * world_speed`
**Unit Speeds**:
```javascript
const unitSpeeds = {
  spear: 18, sword: 22, axe: 18, archer: 18,
  spy: 9, light: 10, marcher: 10, heavy: 11, ram: 30, 
  catapult: 30, knight: 10, snob: 35
};
```

**Distance Calculation**:
```javascript
function calculateDistance(fromVillage, toVillage) {
  return Math.sqrt(
    Math.pow(toVillage.x - fromVillage.x, 2) + 
    Math.pow(toVillage.y - fromVillage.y, 2)
  );
}
```

### Building Queue Mechanics
**Purpose**: Understanding construction timing and limits
**Queue Limits**:
- **Free Account**: 1 building at a time
- **Premium Account**: Up to 5 buildings in queue
- **Queue Management**: Can cancel and reorder

**Building Time Formula**: `base_time * (level + 1) ^ 1.5 / world_speed`
**Base Building Times**:
```javascript
const baseBuildingTimes = {
  main: 60, barracks: 40, stable: 50, garage: 60,
  church: 60, watchtower: 40, snob: 60, smith: 60,
  place: 40, statue: 40, market: 60, wood: 60,
  stone: 60, iron: 60, farm: 60, storage: 60,
  hide: 60, wall: 60
};
```

### Market Mechanics
**Purpose**: Understanding resource trading
**Trade Ratios**:
- **Default**: 1:1 ratio for all resources
- **Market Level**: Affects trade capacity
- **Distance**: Affects trade time
- **Premium**: Allows better ratios

**Trade Capacity**:
```javascript
const tradeCapacity = {
  1: 100, 2: 200, 3: 400, 4: 600, 5: 800,
  6: 1000, 7: 1200, 8: 1400, 9: 1600, 10: 1800
};
```

### Alliance Mechanics
**Purpose**: Understanding tribe/alliance features
**Alliance Benefits**:
- **Internal Trade**: Better trade ratios
- **Support**: Can send troops to allies
- **Diplomacy**: Can declare war/peace with other alliances
- **Coordination**: Shared forums and messaging

**Alliance Levels**:
```javascript
const allianceLevels = {
  member: 'Can participate in alliance activities',
  diplomat: 'Can negotiate with other alliances',
  leader: 'Can manage alliance settings and members'
};
```

## Common Issues & Solutions

### Problem: Building queue is full
**Solution**: Check premium status and queue management
```javascript
function canAddToQueue(currentQueue, isPremium) {
  const maxQueue = isPremium ? 5 : 1;
  return currentQueue.length < maxQueue;
}
```

### Problem: Not enough population for units
**Solution**: Check building levels and unit counts
```javascript
function canTrainUnits(availablePopulation, unitCost, currentUnits) {
  const totalUnitPopulation = Object.values(currentUnits).reduce((sum, count) => sum + count, 0);
  return (totalUnitPopulation + unitCost) <= availablePopulation;
}
```

### Problem: Farm space limit reached
**Solution**: Check farm space usage and limits
```javascript
function canAddUnits(currentFarmSpace, unitFarmSpace, maxFarmSpace) {
  return (currentFarmSpace + unitFarmSpace) <= maxFarmSpace;
}
```

Last Updated: 2024-12-19
Updated: Corrected building categories, requirements, unit training, and game mechanics based on actual TribalWars game data
Created: Initial game mechanics documentation 