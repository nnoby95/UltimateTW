# 🚀 AutoBuild - Immediate Action Plan

## **Goal: Get AutoBuild fully working in 1-2 days**

Based on deep analysis, the script is 85% complete with excellent foundation. Here's the focused plan to complete it:

---

## 🎯 **Phase 1: Validation & Testing (4-6 hours)**

### **Step 1: Test Current Game Integration (2 hours)**

```javascript
// 1. Test CSRF token extraction
console.log('Current CSRF token:', game_data.csrf);
console.log('Token type:', typeof game_data.csrf);

// 2. Test building request URL format
const villageId = game_data.village.id;
const testUrl = `game.php?village=${villageId}&screen=main&action=upgrade_building&id=main&type=main&h=${game_data.csrf}`;
console.log('Test URL:', testUrl);

// 3. Test queue HTML parsing
const queueResponse = await fetch(`game.php?village=${villageId}&screen=main`);
const queueHtml = await queueResponse.text();
const parser = new DOMParser();
const doc = parser.parseFromString(queueHtml, 'text/html');

// Check actual queue selectors
console.log('Queue elements found:', doc.querySelectorAll('[id*="queue"]'));
console.log('Building elements found:', doc.querySelectorAll('[class*="build"]'));
```

### **Step 2: Fix Validation Issues (2 hours)**

Based on Step 1 results, update:
- CSRF token regex pattern if needed
- Building request URL format if needed  
- Queue HTML selectors if needed
- Add proper error logging

### **Step 3: Test Data Collection (1 hour)**

```javascript
// Test comprehensive data collection
await window.collectComprehensiveDataEnhanced();

// Verify data quality
const data = await window.loadLatestEnhancedData();
console.log('Data quality check:', data);

// Test smart calculator
await window.testDatabaseOnlyMode();
```

### **Step 4: Basic Error Handling (1 hour)**

Add try-catch blocks and retry logic to critical functions.

---

## 🏗️ **Phase 2: Building Templates (3-4 hours)**

### **Step 5: Implement Basic Template System (3 hours)**

```javascript
// Add to main.user.js
class TemplateManager {
    constructor() {
        this.templates = {};
        this.villageAssignments = {};
    }
    
    createBasicTemplate(name) {
        // Create default early-game template
        this.templates[name] = {
            name: name,
            sequence: [
                { building: 'main', target_level: 5 },
                { building: 'barracks', target_level: 3 },
                { building: 'farm', target_level: 5 },
                { building: 'wood', target_level: 10 },
                { building: 'stone', target_level: 10 },
                { building: 'iron', target_level: 10 },
                { building: 'storage', target_level: 5 }
            ]
        };
        this.saveTemplates();
    }
    
    assignToVillage(villageId, templateName) {
        this.villageAssignments[villageId] = templateName;
        this.saveAssignments();
    }
    
    getVillageTemplate(villageId) {
        const templateName = this.villageAssignments[villageId];
        return this.templates[templateName] || null;
    }
    
    saveTemplates() {
        localStorage.setItem('autobuilder_templates', JSON.stringify(this.templates));
    }
    
    saveAssignments() {
        localStorage.setItem('autobuilder_assignments', JSON.stringify(this.villageAssignments));
    }
    
    loadTemplates() {
        const saved = localStorage.getItem('autobuilder_templates');
        this.templates = saved ? JSON.parse(saved) : {};
    }
    
    loadAssignments() {
        const saved = localStorage.getItem('autobuilder_assignments');
        this.villageAssignments = saved ? JSON.parse(saved) : {};
    }
}

// Initialize global template manager
window.AutoBuilderTemplates = new TemplateManager();
window.AutoBuilderTemplates.loadTemplates();
window.AutoBuilderTemplates.loadAssignments();
```

### **Step 6: Integrate Templates with Smart Calculator (1 hour)**

Update SmartBuildCalculator to use templates:

```javascript
// In determineNextBuilding function
determineNextBuilding(buildings, villageId) {
    // Get village template
    const template = window.AutoBuilderTemplates.getVillageTemplate(villageId);
    if (!template) {
        console.log('No template assigned to village');
        return null;
    }
    
    // Find next building from template
    for (const plan of template.sequence) {
        const currentLevel = buildings[plan.building] || 0;
        if (currentLevel < plan.target_level) {
            return {
                building: plan.building,
                target_level: currentLevel + 1,
                current_level: currentLevel
            };
        }
    }
    
    return null; // Template complete
}
```

---

## 🧪 **Phase 3: Testing & Validation (2 hours)**

### **Step 7: Create Basic Template (30 minutes)**

```javascript
// Create and assign a basic template
window.AutoBuilderTemplates.createBasicTemplate('early_game');
const currentVillageId = game_data.village.id.toString();
window.AutoBuilderTemplates.assignToVillage(currentVillageId, 'early_game');
```

### **Step 8: Test Complete System (1 hour)**

```javascript
// Test full workflow
await window.collectComprehensiveDataEnhanced();  // Get fresh data
await window.testDatabaseOnlyMode();              // Test calculations
const status = window.AutoBuildBot.getStatus();   // Check bot status
console.log('Bot ready:', status);
```

### **Step 9: Careful Live Testing (30 minutes)**

```javascript
// Start bot in safe mode (watch console first)
window.AutoBuildBot.start();

// Monitor for 5-10 minutes, check:
// - Does it make smart decisions?
// - Does it respect queue limits?
// - Does it handle errors gracefully?

// Stop if any issues
window.AutoBuildBot.stop();
```

---

## ✅ **Success Criteria**

After completing these phases, you should have:

1. ✅ **Data Collection Working**: Villages data collected and stored
2. ✅ **Templates Working**: Bot knows what to build per village  
3. ✅ **API Integration Working**: Building requests succeed
4. ✅ **Smart Decisions**: Bot makes intelligent building choices
5. ✅ **Error Handling**: Bot recovers from failures
6. ✅ **Safety**: Bot respects queue limits and resource constraints

---

## 🚨 **Safety Notes**

- **Start with cheap buildings** (main building, farm) for testing
- **Monitor first few builds** to ensure they work correctly
- **Use database-only mode** until confident in game integration
- **Keep backups** of working versions
- **Test on less important villages** first

---

## 📞 **If You Get Stuck**

### **Common Issues & Solutions**:

1. **CSRF token not found**: 
   - Check `game_data.csrf` exists
   - Try alternative token extraction methods
   - Verify game version compatibility

2. **Building requests fail**:
   - Check URL format matches current game
   - Verify CSRF token is valid
   - Test with browser network tab

3. **Queue parsing fails**:
   - Inspect actual game HTML
   - Update CSS selectors
   - Test with empty and full queues

4. **Template not working**:
   - Check template assignment with `console.log`
   - Verify template format is correct
   - Test with simple building sequence

**Estimated total time**: 8-12 hours across 1-2 days
**Expected result**: Fully functional AutoBuild bot! 🎉 