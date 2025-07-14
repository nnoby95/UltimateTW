# ComprehensiveVillageDataCollector.js

## Overview

The `ComprehensiveVillageDataCollector.js` script is a robust, secure, and unified data collector for Tribal Wars villages. It gathers **troops**, **resources**, and **buildings** data for a specific village, and stores all this information in a single, fresh record in the browser's IndexedDB.

---

## How It Works

### 1. **Data Collection**
- **Troops:** Fetches all unit counts (spear, sword, axe, spy, light, heavy, ram, catapult, snob, militia).
- **Resources:** Gathers wood, stone, iron, warehouse capacity, and population data.
- **Buildings:** Collects all building levels and construction queue information.

### 2. **Security Features**
- **Random Delays:** Waits 5-10 seconds between requests to mimic human behavior.
- **Pattern Avoidance:** Fetches random pages between main data requests to avoid detection.
- **Overwrites Old Data:** Always deletes previous comprehensive data before saving new data.
- **Verification:** Ensures only one comprehensive record exists per village.

### 3. **Database Integration**
- Uses the shared `TribalWarsGameData` IndexedDB database.
- Each village has its own object store: `village_<villageId>`.
- Only one record of type `comprehensive` is kept per village (always the latest data).

---

## Data Structure Example

Each record in IndexedDB (for a village) looks like this:

```json
{
  "type": "comprehensive",
  "timestamp": "2025-07-14T08:10:37.512Z",
  "villageId": 16404,
  "worldId": "en148",
  "playerId": 849238583,
  "data": {
    "villageId": 16404,
    "villageName": "nnoby95's village",
    "coordinates": "369|493",
    "worldId": "en148",
    "playerId": 849238583,
    "troops": { ... },
    "resources": [ ... ],
    "buildings": { ... },
    "extractedAt": "2025-07-14T08:10:37.512Z",
    "serverTime": "2025-07-14T08:10:37.512Z",
    "dataVersion": "1.0"
  }
}
```

- **type:** Always `comprehensive` for this script
- **timestamp:** When the data was collected
- **data:** Contains all collected data (troops, resources, buildings, etc.)

---

## Usage

### Collect and Save Data
```js
collectComprehensiveData(); // Collects and saves fresh data (overwrites old)
```

### Load Latest Data
```js
loadComprehensiveData(); // Loads and displays the latest saved data
```

### Emergency Cleanup
```js
cleanupComprehensiveData(); // Removes all comprehensive data for the village
```

---

## Key Points
- **Always fresh:** Only the latest data is kept (no useless accumulation)
- **Unified:** All data types are stored together in one record
- **Secure:** Randomization and pattern avoidance built-in
- **Easy to use:** Simple API for collection, loading, and cleanup

---

## Where is the data stored?
- **Database:** `TribalWarsGameData` (IndexedDB)
- **Store:** `village_<villageId>` (e.g., `village_16404`)
- **Record:** Only one with `type: "comprehensive"` is kept per village

---

## Maintenance
- Old data is automatically deleted before saving new data
- You can manually clean up with `cleanupComprehensiveData()` if needed

---

## Example: Viewing in DevTools
- Open DevTools → Application → IndexedDB → TribalWarsGameData → `village_<villageId>`
- You should see only one record of type `comprehensive` (the latest data)

---

**This system ensures you always have the freshest, unified data for each village, with no clutter!** 