# AutoBuild Project Structure

## 📁 **Project Overview**
AutoBuild is a comprehensive Tribal Wars automation script that provides smart building queue management with dynamic checking and intelligent resource planning.

## 🗂️ **Directory Structure**

```
AutoBuild/
├── 📄 main.user.js                    # Main user script (28KB, 670 lines)
├── 📄 README.md                       # Main project documentation
├── 📄 PROJECT_HANDOFF.md              # Project handoff information
├── 📄 PROJECT_STRUCTURE.md            # This file - project structure overview
│
├── 📁 tests/                          # Test files
│   ├── test_smart_calculator.js       # Smart calculator tests
│   ├── test_dynamic_checking.js       # Dynamic checking tests
│   └── test_integration.js            # Integration tests
│
├── 📁 docs/                           # Documentation
│   ├── SMART_LOGIC_EXPLANATION.md     # Smart logic explanation
│   ├── DYNAMIC_CHECKING_EXPLANATION.md # Dynamic checking explanation
│   ├── IMPLEMENTATION_SUMMARY.md      # Implementation summary
│   └── README_BOT_LOGIC.md            # Bot logic documentation
│
├── 📁 src/                            # Source code
│   ├── 📁 bot/                        # Bot logic components
│   │   ├── AutoBuildBot.js            # Main bot controller (7.6KB)
│   │   ├── SmartBuildCalculator.js    # Smart building logic (17KB)
│   │   ├── QueueManager.js            # Queue management (7.7KB)
│   │   └── ResourceMonitor.js         # Resource monitoring (3.0KB)
│   │
│   ├── 📁 database/                   # Database & data management
│   │   ├── DatabaseManager.js         # Database operations (4.9KB)
│   │   ├── DataCollector.js           # Data collection (10KB)
│   │   └── EnhancedDataManager.js     # Enhanced data handling (13KB)
│   │
│   ├── 📁 config/                     # Configuration management
│   │   ├── Settings.js                # Main settings (18KB, 559 lines)
│   │   ├── TemplateManager.js         # Building templates (11KB)
│   │   └── BuildingConfig.js          # Building configuration (551B)
│   │
│   ├── 📁 utils/                      # Utility functions
│   │   ├── DataHelper.js              # Data helper functions (11KB)
│   │   ├── BuildingCosts.js           # Building cost calculations (18KB)
│   │   ├── BuildingAnalyzer.js        # Building analysis (13KB)
│   │   ├── GameUtils.js               # Game utilities (474B)
│   │   ├── TimeUtils.js               # Time utilities (654B)
│   │   └── 📁 TW_Utils/               # Tribal Wars specific utilities
│   │
│   ├── 📁 ui/                         # User interface components
│   │   ├── SettingsPanel.js           # Settings UI (37KB, 949 lines)
│   │   ├── TemplateManager.js         # Template management UI (31KB)
│   │   ├── VillageManager.js          # Village management UI (855B)
│   │   └── BuildQueueUI.js            # Build queue UI (832B)
│   │
│   └── 📁 integration/                # Integration components
│       └── ComprehensiveIntegration.js # Comprehensive data integration
│
└── 📁 DB_Structure/                   # Database structure
    └── Helper.js                      # Database helper functions (20KB)
```

## 🎯 **Core Components**

### **Main Script**
- **`main.user.js`** - The main user script that loads all components and initializes the AutoBuild system

### **Bot Logic (`src/bot/`)**
- **`AutoBuildBot.js`** - Main bot controller that orchestrates all automation
- **`SmartBuildCalculator.js`** - Intelligent building decision logic with dynamic checking
- **`QueueManager.js`** - Building queue management and manipulation
- **`ResourceMonitor.js`** - Resource monitoring and analysis

### **Database & Data (`src/database/`)**
- **`DatabaseManager.js`** - Core database operations using localStorage
- **`DataCollector.js`** - Comprehensive data collection from Tribal Wars pages
- **`EnhancedDataManager.js`** - Advanced data management with security features

### **Configuration (`src/config/`)**
- **`Settings.js`** - Main settings management with 559 lines of configuration
- **`TemplateManager.js`** - Building template system for automated village development
- **`BuildingConfig.js`** - Building-specific configuration

### **Utilities (`src/utils/`)**
- **`DataHelper.js`** - Data processing and helper functions
- **`BuildingCosts.js`** - Building cost calculations and analysis
- **`BuildingAnalyzer.js`** - Building analysis and optimization
- **`GameUtils.js`** - Game-specific utility functions
- **`TimeUtils.js`** - Time-related utility functions

### **User Interface (`src/ui/`)**
- **`SettingsPanel.js`** - Comprehensive settings UI with 949 lines
- **`TemplateManager.js`** - Template management interface
- **`VillageManager.js`** - Village management interface
- **`BuildQueueUI.js`** - Build queue visualization

## 📊 **File Size Summary**

### **Large Files (>10KB)**
- `main.user.js` - 28KB (Main script)
- `src/ui/SettingsPanel.js` - 37KB (Settings UI)
- `src/ui/TemplateManager.js` - 31KB (Template UI)
- `src/bot/SmartBuildCalculator.js` - 17KB (Smart logic)
- `src/config/Settings.js` - 18KB (Settings)
- `src/utils/BuildingCosts.js` - 18KB (Cost calculations)
- `src/utils/BuildingAnalyzer.js` - 13KB (Building analysis)
- `src/database/EnhancedDataManager.js` - 13KB (Data management)
- `src/utils/DataHelper.js` - 11KB (Data helpers)
- `src/config/TemplateManager.js` - 11KB (Templates)
- `src/database/DataCollector.js` - 10KB (Data collection)
- `DB_Structure/Helper.js` - 20KB (Database helpers)

### **Medium Files (1-10KB)**
- `src/bot/QueueManager.js` - 7.7KB
- `src/bot/AutoBuildBot.js` - 7.6KB
- `src/database/DatabaseManager.js` - 4.9KB
- `src/bot/ResourceMonitor.js` - 3.0KB
- `src/ui/VillageManager.js` - 855B
- `src/ui/BuildQueueUI.js` - 832B
- `src/utils/TimeUtils.js` - 654B
- `src/config/BuildingConfig.js` - 551B
- `src/utils/GameUtils.js` - 474B

## 🧪 **Testing**

### **Test Files (`tests/`)**
- `test_smart_calculator.js` - Tests for smart building logic
- `test_dynamic_checking.js` - Tests for dynamic checking system
- `test_integration.js` - Integration tests for all components

## 📚 **Documentation**

### **Documentation Files (`docs/`)**
- `SMART_LOGIC_EXPLANATION.md` - Detailed explanation of smart building logic
- `DYNAMIC_CHECKING_EXPLANATION.md` - Explanation of dynamic checking system
- `IMPLEMENTATION_SUMMARY.md` - Summary of implementation details
- `README_BOT_LOGIC.md` - Bot logic documentation

## 🔧 **Key Features**

### **Smart Building System**
- Intelligent building decisions based on resource availability
- Dynamic checking intervals instead of blind waiting
- Queue management with CSRF token handling
- Resource monitoring and analysis

### **Data Management**
- Comprehensive data collection from Tribal Wars pages
- Secure data storage using localStorage
- Enhanced data management with security features
- Database structure for villages, resources, buildings, and queues

### **User Interface**
- Comprehensive settings panel
- Template management system
- Village management interface
- Build queue visualization

### **Configuration**
- Flexible settings system
- Building template system
- Configurable building priorities
- Customizable automation parameters

## 🚀 **Usage**

1. **Load the script** - `main.user.js` loads all components
2. **Configure settings** - Use the settings panel to configure automation
3. **Set up templates** - Create building templates for villages
4. **Enable automation** - Start the AutoBuild bot
5. **Monitor progress** - Watch the bot intelligently manage your villages

## 📈 **Development Status**

- ✅ **Core functionality implemented**
- ✅ **Smart building logic working**
- ✅ **Dynamic checking system active**
- ✅ **Database structure complete**
- ✅ **User interface functional**
- ✅ **Documentation comprehensive**
- ✅ **Test files organized**

The project is well-structured, documented, and ready for use with comprehensive automation capabilities for Tribal Wars. 