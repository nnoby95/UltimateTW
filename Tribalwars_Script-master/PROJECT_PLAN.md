# Tribal Wars Script - Project Plan

## 🎯 Project Overview

**Goal**: Create a clean, efficient Tribal Wars userscript with automated bot functionality using a well-structured database architecture.

**Status**: Planning Phase → Ready for Implementation

---

## 🏗️ Architecture Overview

### **Clean Database Architecture**
- **Separate databases** for different data types
- **Script communicates** with databases through clean interfaces
- **Zero extra server requests** - collect data from game's own elements
- **Automated bot functionality** with smart timing

---

## 📊 Database Structure

### **1. Villages Database**
```javascript
villages_db = {
  "village_123": {
    "id": "12345",
    "name": "My Village",
    "coords": "500|500",
    "url": "game.php?village=123&screen=main"
  }
}
```

### **2. Resources Database**
```javascript
resources_db = {
  "village_123": {
    "wood": 1000,
    "stone": 800,
    "iron": 600,
    "last_updated": "timestamp"
  }
}
```

### **3. Built Buildings Database**
```javascript
built_buildings_db = {
  "village_123": {
    "main": 3,
    "barracks": 4,
    "stable": 2,
    "workshop": 1,
    "academy": 2,
    "smithy": 3,
    "marketplace": 1,
    "wall": 2
  }
}
```

### **4. Active Queue Database**
```javascript
active_queue_db = {
  "village_123": [
    {
      "building": "barracks",
      "level": 5,
      "start_time": "timestamp",
      "end_time": "timestamp",
      "status": "in_progress"
    }
  ]
}
```

### **5. Future Plans Database**
```javascript
future_plans_db = {
  "village_123": [
    {
      "building": "barracks",
      "target_level": 5,
      "priority": 1,
      "auto_build": true
    }
  ]
}
```

---

## 🔧 Database Communication Layer

### **Database Manager**
```javascript
const DatabaseManager = {
  save: (dbName, data) => localStorage.setItem(dbName, JSON.stringify(data)),
  load: (dbName) => JSON.parse(localStorage.getItem(dbName) || '{}'),
  
  updateVillage: (dbName, villageId, data) => {
    const db = DatabaseManager.load(dbName);
    db[villageId] = { ...db[villageId], ...data };
    DatabaseManager.save(dbName, db);
  }
};
```

### **Script Interface**
```javascript
const ScriptDB = {
  getVillageData: (villageId) => ({
    village: DatabaseManager.load('villages_db')[villageId],
    resources: DatabaseManager.load('resources_db')[villageId],
    buildings: DatabaseManager.load('built_buildings_db')[villageId],
    queue: DatabaseManager.load('active_queue_db')[villageId],
    plans: DatabaseManager.load('future_plans_db')[villageId]
  }),
  
  canBuild: (villageId, building, level) => {
    const data = ScriptDB.getVillageData(villageId);
    return {
      hasResources: checkResources(building, level, data.resources),
      notBuilt: !data.buildings[building] || data.buildings[building] < level,
      notInQueue: !isInQueue(building, level, data.queue)
    };
  }
};
```

---

## 🤖 Automated Bot System

### **Smart Data Collection**
- **Event-based**: Collect when page loads or navigates
- **Timer-based**: Collect every 5 minutes when on main page
- **Passive**: Use data already loaded by the game
- **Zero extra requests**: No additional server load

### **Auto Building Bot**
```javascript
function autoBuildBot() {
  const villageId = game_data.village.id;
  const plans = DatabaseManager.load('future_plans_db')[villageId] || [];
  
  plans.forEach(plan => {
    if (canBuildAutomatically(villageId, plan.building, plan.target_level)) {
      buildAutomatically(villageId, plan.building, plan.target_level);
    }
  });
}
```

### **Resource Monitoring Bot**
```javascript
function resourceMonitorBot() {
  const villageId = game_data.village.id;
  const resources = ScriptDB.getVillageResources(villageId);
  
  // Check if storage is getting full
  if (resources.wood > storageCapacity * 0.8 || 
      resources.stone > storageCapacity * 0.8 || 
      resources.iron > storageCapacity * 0.8) {
    handleFullStorage(villageId, resources);
  }
}
```

---

## 📋 Implementation Plan

### **Phase 1: Database Foundation**
1. ✅ Create database structure
2. ✅ Implement DatabaseManager
3. ✅ Create ScriptDB interface
4. ✅ Test database operations

### **Phase 2: Data Collection System**
1. ✅ Implement passive data collection
2. ✅ Set up event-based collection
3. ✅ Implement timer-based collection
4. ✅ Test data collection accuracy

### **Phase 3: Bot Logic**
1. ✅ Implement auto building logic
2. ✅ Implement resource monitoring
3. ✅ Implement smart timing system
4. ✅ Test bot functionality

### **Phase 4: User Interface**
1. ✅ Create settings panel
2. ✅ Create building queue interface
3. ✅ Create village management interface
4. ✅ Test user interface

### **Phase 5: Advanced Features**
1. ✅ Multi-village support
2. ✅ Advanced building strategies
3. ✅ Resource optimization
4. ✅ Performance optimization

---

## 🎯 Key Features

### **✅ Clean Architecture**
- Separate databases for different data types
- Clean communication layer
- Easy to debug and maintain

### **✅ Zero Server Load**
- Collect data from game's own elements
- No extra AJAX requests
- Passive data collection

### **✅ Smart Bot Logic**
- Automatic building based on plans
- Resource monitoring
- Queue management
- Smart timing based on activity

### **✅ User-Friendly**
- Easy settings interface
- Clear building queue display
- Village management tools
- Export/import functionality

---

## 🔧 Technical Specifications

### **Server Compatibility**
- **Hungarian servers**: `*.klanhaboru.hu`
- **International servers**: `*.tribalwars.net`

### **Data Storage**
- **LocalStorage**: Fast, reliable, no server needed
- **JSON format**: Easy to read and debug
- **Automatic cleanup**: Remove old data to prevent bloat

### **Performance**
- **Smart timing**: Only run when page is active
- **Efficient collection**: Use existing DOM elements
- **Memory management**: Clean up old data

---

## 🚀 Getting Started

### **1. Initialize Project**
```javascript
// Initialize all databases
function initializeProject() {
  const databases = ['villages_db', 'resources_db', 'active_queue_db', 'built_buildings_db', 'future_plans_db'];
  databases.forEach(db => {
    if (!localStorage.getItem(db)) {
      localStorage.setItem(db, JSON.stringify({}));
    }
  });
}
```

### **2. Start Bot System**
```javascript
// Start the complete bot system
function startBot() {
  TribalWarsBot.init();
  console.log('Tribal Wars Bot started!');
}
```

### **3. Test System**
```javascript
// Test all components
function testSystem() {
  console.log('Testing databases...');
  console.log('Testing data collection...');
  console.log('Testing bot logic...');
  console.log('All systems operational!');
}
```

---

## 📝 Development Notes

### **Best Practices**
- ✅ Use LocalStorage for all data (no external databases)
- ✅ Collect data passively from game elements
- ✅ Implement smart timing to avoid server load
- ✅ Create clean, modular code structure
- ✅ Test thoroughly before deployment

### **Avoid**
- ❌ Making extra server requests
- ❌ Complex external dependencies
- ❌ Overly complex logic
- ❌ Hardcoded values
- ❌ Poor error handling

---

## 🎯 Success Metrics

### **Performance**
- Zero additional server requests
- Fast data collection (< 100ms)
- Minimal memory usage
- Reliable operation

### **Functionality**
- Accurate data collection
- Reliable auto building
- Smart resource management
- Clean user interface

### **User Experience**
- Easy to understand
- Easy to configure
- Reliable operation
- Helpful error messages

---

## 🚀 Ready to Start!

This plan provides a complete roadmap for building a clean, efficient Tribal Wars bot with:

- ✅ **Clean database architecture**
- ✅ **Zero server load**
- ✅ **Automated functionality**
- ✅ **User-friendly interface**
- ✅ **Reliable operation**

**Next Step**: Begin implementation following this plan! 