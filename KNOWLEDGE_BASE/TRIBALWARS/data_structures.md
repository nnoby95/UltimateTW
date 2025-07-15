# TribalWars - Data Structures

## Quick Reference
- Village Object: `{id, name, x, y, points, player, tribe}`
- Resource Object: `{wood, stone, iron, population, maxPopulation}`
- Unit Object: `{spear, sword, axe, archer, scout, light, heavy, ram, catapult}`
- Building Object: `{level, maxLevel, cost, time, requirements}`

## Detailed Information

### Village Data Structure
**Purpose**: Represent village information
**Structure**:
```javascript
{
  id: number,
  name: string,
  x: number,
  y: number,
  points: number,
  player: {
    id: number,
    name: string,
    tribe: {
      id: number,
      name: string,
      tag: string
    }
  },
  buildings: {
    main: number,
    barracks: number,
    stable: number,
    garage: number,
    church: number,
    watchtower: number,
    snob: number,
    smith: number,
    place: number,
    statue: number,
    market: number,
    wood: number,
    stone: number,
    iron: number,
    farm: number,
    storage: number,
    hide: number,
    wall: number
  },
  resources: {
    wood: number,
    stone: number,
    iron: number,
    population: number,
    maxPopulation: number
  }
}
```

### Unit Data Structure
**Purpose**: Represent army units and their counts
**Structure**:
```javascript
{
  spear: number,      // Spearman
  sword: number,      // Swordsman
  axe: number,        // Axeman
  archer: number,     // Archer
  spy: number,        // Spy
  light: number,      // Light Cavalry
  marcher: number,    // Marcher
  heavy: number,      // Heavy Cavalry
  ram: number,        // Ram
  catapult: number,   // Catapult
  knight: number,     // Knight
  snob: number        // Nobleman
}
```

### Building Queue Structure
**Purpose**: Track building construction progress
**Structure**:
```javascript
{
  current: {
    building: string,
    level: number,
    startTime: Date,
    endTime: Date,
    progress: number // 0-100
  },
  queue: [
    {
      building: string,
      level: number,
      startTime: Date,
      endTime: Date,
      cost: {
        wood: number,
        stone: number,
        iron: number
      }
    }
  ],
  maxQueueLength: number
}
```

### Resource Costs Structure
**Purpose**: Track building and unit costs
**Structure**:
```javascript
{
  wood: number,
  stone: number,
  iron: number,
  population: number, // For units
  time: number        // Build time in seconds
}
```

### Map Data Structure
**Purpose**: Represent world map information
**Structure**:
```javascript
{
  version: number,
  size: number,
  villages: [
    {
      id: number,
      name: string,
      x: number,
      y: number,
      points: number,
      player: string,
      tribe: string,
      type: string // "village", "barbarian", "oasis"
    }
  ],
  players: [
    {
      id: number,
      name: string,
      tribe: string,
      points: number,
      rank: number
    }
  ]
}
```

## Common Data Patterns

### Resource Parsing
**Pattern**: Extract resource values from HTML elements
```javascript
function parseResources(html) {
  return {
    wood: parseInt(document.querySelector('#wood').textContent),
    stone: parseInt(document.querySelector('#stone').textContent),
    iron: parseInt(document.querySelector('#iron').textContent)
  };
}
```

### Unit Count Parsing
**Pattern**: Extract unit counts from HTML tables
```javascript
function parseUnits(html) {
  const units = {};
  const unitElements = document.querySelectorAll('.unit-count');
  unitElements.forEach(element => {
    const unitType = element.dataset.unit;
    const count = parseInt(element.textContent);
    units[unitType] = count;
  });
  return units;
}
```

### Building Level Parsing
**Pattern**: Extract building levels from village overview
```javascript
function parseBuildings(html) {
  const buildings = {};
  const buildingElements = document.querySelectorAll('.building-level');
  buildingElements.forEach(element => {
    const buildingType = element.dataset.building;
    const level = parseInt(element.textContent);
    buildings[buildingType] = level;
  });
  return buildings;
}
```

## Data Validation

### Required Fields
- Village ID must be positive integer
- Coordinates must be within world bounds
- Resource values must be non-negative
- Unit counts must be non-negative integers

### Data Sanitization
```javascript
function sanitizeVillageData(data) {
  return {
    id: Math.max(0, parseInt(data.id) || 0),
    name: String(data.name || ''),
    x: Math.max(0, Math.min(999, parseInt(data.x) || 0)),
    y: Math.max(0, Math.min(999, parseInt(data.y) || 0)),
    points: Math.max(0, parseInt(data.points) || 0)
  };
}
```

## Database Schema (if using local storage)
```sql
-- Villages table
CREATE TABLE villages (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  points INTEGER DEFAULT 0,
  player_id INTEGER,
  tribe_id INTEGER,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resources table
CREATE TABLE resources (
  village_id INTEGER PRIMARY KEY,
  wood INTEGER DEFAULT 0,
  stone INTEGER DEFAULT 0,
  iron INTEGER DEFAULT 0,
  population INTEGER DEFAULT 0,
  max_population INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (village_id) REFERENCES villages(id)
);
```

Last Updated: 2024-12-19
Updated: Corrected building and unit data based on actual TribalWars game data
Created: Initial data structures documentation 