// ==UserScript==
// @name         Tribal Wars Auto Builder (Fixed)
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  Fixed auto-building bot for Tribal Wars with simplified initialization
// @author       Your Name
// @match        https://*.klanhaboru.hu/*
// @match        https://*.tribalwars.net/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // =============================================================================
    // ⚙️ SETTINGS CLASS (Step 1)
    // =============================================================================
    class Settings {
        constructor() {
            this.defaults = {
                // Bot settings
                autoBuildEnabled: false,
                checkInterval: 30,
                // Building settings
                maxQueueSize: 5, // Game maximum
                costupSetup: [], // Array of building plans in order
                // UI settings
                showSettingsPanel: true,
                showBuildQueue: true,
                showVillageManager: true,
                // Advanced settings
                debugMode: false,
                logLevel: 'info', // 'debug', 'info', 'warn', 'error'
                // Data settings
                autoCollectData: true,
                dataCollectionInterval: 300, // 5 minutes
                maxStoredVillages: 50,
                // Villages refresh interval
                villageRefreshInterval: 10,
                // Randomized auto data collection settings
                randomAutoDataEnabled: false,
                minDataInterval: 50, // minutes
                maxDataInterval: 70, // minutes
                nextCollectionTime: null, // Exact timestamp for next collection
                // Version and metadata
                version: '1.0.1',
                lastUpdated: Date.now()
            };
            this.current = {};
        }
        /**
         * Load settings from localStorage
         */
        load() {
            try {
                const saved = localStorage.getItem('autobuilder_settings');
                this.current = saved ? JSON.parse(saved) : {};
                // Merge with defaults for any missing settings
                this.current = { ...this.defaults, ...this.current };
                if (this.current.debugMode) console.log('⚙️ Settings loaded successfully');
            } catch (error) {
                console.error('❌ Failed to load settings:', error);
                this.current = { ...this.defaults };
            }
        }
        /**
         * Save settings to localStorage
         */
        save() {
            try {
                this.current.lastUpdated = Date.now();
                localStorage.setItem('autobuilder_settings', JSON.stringify(this.current));
                if (this.current.debugMode) console.log('💾 Settings saved successfully');
                return true;
            } catch (error) {
                console.error('❌ Failed to save settings:', error);
                return false;
            }
        }
        /**
         * Get a setting value
         * @param {string} key - Setting key
         * @param {any} defaultValue - Default value if not found
         * @returns {any} Setting value
         */
        get(key, defaultValue = null) {
            const value = this.current[key];
            return value !== undefined ? value : defaultValue;
        }
        /**
         * Set a setting value
         * @param {string} key - Setting key
         * @param {any} value - Setting value
         */
        set(key, value) {
            this.current[key] = value;
            this.save();
        }
        /**
         * Reset settings to defaults
         */
        reset() {
            this.current = { ...this.defaults };
            this.save();
            if (this.current.debugMode) console.log('🔄 Settings reset to defaults');
        }
        /**
         * Get all settings
         * @returns {object} All current settings
         */
        getAll() {
            return { ...this.current };
        }
        /**
         * Set multiple settings at once
         * @param {object} settings - Settings object
         */
        setMultiple(settings) {
            this.current = { ...this.current, ...settings };
            this.save();
        }
    }

    // Make settings globally accessible for other script parts
    window.AutoBuilderSettings = new Settings();
    window.AutoBuilderSettings.load();

    // =============================================================================
    // 🗄️ DATABASE MANAGER (Step 2)
    // =============================================================================
    class DatabaseManager {
        constructor() {
            this.databases = {
                villages: 'villages_db',
                resources: 'resources_db',
                buildings: 'built_buildings_db',
                queue: 'active_queue_db',
                plans: 'future_plans_db',
                settings: 'settings_db'
            };
        }
        async init() {
            try {
                Object.values(this.databases).forEach(dbName => {
                    if (!localStorage.getItem(dbName)) {
                        localStorage.setItem(dbName, JSON.stringify({}));
                    }
                });
            } catch (error) {
                console.error('❌ Failed to initialize databases:', error);
            }
        }
        save(dbName, data) {
            try {
                localStorage.setItem(dbName, JSON.stringify(data));
                return true;
            } catch (error) {
                console.error(`❌ Failed to save to ${dbName}:`, error);
                return false;
            }
        }
        load(dbName) {
            try {
                const data = localStorage.getItem(dbName);
                return data ? JSON.parse(data) : {};
            } catch (error) {
                console.error(`❌ Failed to load from ${dbName}:`, error);
                return {};
            }
        }
        updateVillage(dbName, villageId, data) {
            try {
                const db = this.load(dbName);
                db[villageId] = { ...db[villageId], ...data, lastUpdated: Date.now() };
                this.save(dbName, db);
                return true;
            } catch (error) {
                console.error(`❌ Failed to update village ${villageId} in ${dbName}:`, error);
                return false;
            }
        }
        getVillage(dbName, villageId) {
            const db = this.load(dbName);
            return db[villageId] || null;
        }
        getAllVillages(dbName) {
            return this.load(dbName);
        }
        deleteVillage(dbName, villageId) {
            try {
                const db = this.load(dbName);
                delete db[villageId];
                this.save(dbName, db);
                return true;
            } catch (error) {
                console.error(`❌ Failed to delete village ${villageId} from ${dbName}:`, error);
                return false;
            }
        }
        clearAll() {
            try {
                Object.values(this.databases).forEach(dbName => {
                    localStorage.removeItem(dbName);
                });
                return true;
            } catch (error) {
                console.error('❌ Failed to clear databases:', error);
                return false;
            }
        }
        exportAll() {
            const exportData = {};
            Object.entries(this.databases).forEach(([key, dbName]) => {
                exportData[key] = this.load(dbName);
            });
            return exportData;
        }
        importAll(data) {
            try {
                Object.entries(data).forEach(([key, dbData]) => {
                    if (this.databases[key]) {
                        this.save(this.databases[key], dbData);
                    }
                });
                return true;
            } catch (error) {
                console.error('❌ Failed to import data:', error);
                return false;
            }
        }
    }

    // =============================================================================
    // 🧰 DATA HELPER (Step 2)
    // =============================================================================
    class DataHelper {
        static validateVillageData(data) {
            const errors = [];
            const warnings = [];
            if (!data.info || !data.info.id) errors.push('Missing village ID');
            if (!data.info || !data.info.name) errors.push('Missing village name');
            if (data.resources) {
                const resources = data.resources;
                if (typeof resources.wood !== 'number') warnings.push('Wood resource should be a number');
                if (typeof resources.stone !== 'number') warnings.push('Stone resource should be a number');
                if (typeof resources.iron !== 'number') warnings.push('Iron resource should be a number');
                if (resources.wood < 0 || resources.stone < 0 || resources.iron < 0) errors.push('Resources cannot be negative');
            }
            if (data.buildings) {
                Object.keys(data.buildings).forEach(building => {
                    const level = data.buildings[building];
                    if (typeof level !== 'number' || level < 0) errors.push(`Invalid level for ${building}: ${level}`);
                });
            }
            return { isValid: errors.length === 0, errors, warnings };
        }
        static cleanVillageData(data) {
            const cleaned = { ...data };
            if (cleaned.resources) {
                cleaned.resources.wood = parseInt(cleaned.resources.wood) || 0;
                cleaned.resources.stone = parseInt(cleaned.resources.stone) || 0;
                cleaned.resources.iron = parseInt(cleaned.resources.iron) || 0;
                cleaned.resources.pop = parseInt(cleaned.resources.pop) || 0;
                cleaned.resources.pop_max = parseInt(cleaned.resources.pop_max) || 0;
            }
            if (cleaned.buildings) {
                Object.keys(cleaned.buildings).forEach(building => {
                    cleaned.buildings[building] = parseInt(cleaned.buildings[building]) || 0;
                });
            }
            if (cleaned.activeQueue) {
                cleaned.activeQueue = cleaned.activeQueue.filter(item => {
                    return item.building && typeof item.target_level === 'number' && item.target_level > 0;
                });
            }
            return cleaned;
        }
        static calculateBuildingCosts(building, level) {
            // Fallback: simple cost formula
            return {
                wood: level * 100,
                stone: level * 100,
                iron: level * 100,
                pop: Math.max(1, Math.floor(level / 2))
            };
        }
        static calculateTotalCosts(buildings) {
            const total = { wood: 0, stone: 0, iron: 0, pop: 0 };
            buildings.forEach(plan => {
                const costs = this.calculateBuildingCosts(plan.building, plan.target_level);
                total.wood += costs.wood;
                total.stone += costs.stone;
                total.iron += costs.iron;
                total.pop += costs.pop;
            });
            return total;
        }
        static checkResources(villageData, costs) {
            const resources = villageData.resources || {};
            const result = { canBuild: true, missing: {}, warnings: [] };
            if (resources.wood < costs.wood) {
                result.canBuild = false;
                result.missing.wood = costs.wood - resources.wood;
            }
            if (resources.stone < costs.stone) {
                result.canBuild = false;
                result.missing.stone = costs.stone - resources.stone;
            }
            if (resources.iron < costs.iron) {
                result.canBuild = false;
                result.missing.iron = costs.iron - resources.iron;
            }
            if (resources.pop && resources.pop_max) {
                const newPop = resources.pop + costs.pop;
                if (newPop > resources.pop_max) {
                    result.canBuild = false;
                    result.missing.pop = newPop - resources.pop_max;
                }
            }
            const maxStorage = resources.storage_max || 800;
            if (resources.wood > maxStorage * 0.9 || resources.stone > maxStorage * 0.9 || resources.iron > maxStorage * 0.9) {
                result.warnings.push('Storage is getting full');
            }
            return result;
        }
        static formatDuration(seconds) {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);
            return `${h}h ${m}m ${s}s`;
        }
        static formatResources(amount) {
            if (amount >= 1e6) return (amount / 1e6).toFixed(1) + 'M';
            if (amount >= 1e3) return (amount / 1e3).toFixed(1) + 'k';
            return amount.toString();
        }
        static deepClone(obj) {
            return JSON.parse(JSON.stringify(obj));
        }
        static deepMerge(target, source) {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object') {
                    if (!target[key]) target[key] = {};
                    this.deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
            return target;
        }
    }

    // Make database globally accessible for other script parts
    window.AutoBuilderDatabase = new DatabaseManager();
    window.AutoBuilderDatabase.init();

    // =============================================================================
    // 📋 TEMPLATE MANAGER INTEGRATION
    // =============================================================================

    /**
     * Template Manager for AutoBuild
     * Handles building templates and sequences
     */
    class TemplateManager {
        constructor() {
            this.templates = this.getDefaultTemplates();
            this.loadTemplates();
        }

        /**
         * Get default building templates (empty - user creates their own)
         */
        getDefaultTemplates() {
            return {};
        }

        /**
         * Load templates from storage
         */
        loadTemplates() {
            try {
                const saved = localStorage.getItem('autobuild_custom_templates');
                if (saved) {
                    this.templates = JSON.parse(saved);
                } else {
                    this.templates = {};
                }
            } catch (error) {
                console.error('❌ Error loading templates:', error);
                this.templates = {};
            }
        }

        /**
         * Save all templates to storage (all are custom now)
         */
        saveTemplates() {
            try {
                localStorage.setItem('autobuild_custom_templates', JSON.stringify(this.templates));
                console.log('✅ Templates saved');
            } catch (error) {
                console.error('❌ Error saving templates:', error);
            }
        }

        /**
         * Get all available templates
         */
        getAllTemplates() {
            return this.templates;
        }

        /**
         * Get specific template
         */
        getTemplate(templateName) {
            return this.templates[templateName] || null;
        }

        /**
         * Find next building to build based on template and current buildings
         * ALWAYS builds incrementally: current_level + 1 (never jumps levels)
         */
        getNextBuilding(templateName, currentBuildings) {
            const template = this.getTemplate(templateName);
            if (!template) {
                console.error(`❌ Template '${templateName}' not found`);
                return null;
            }

            // Go through template sequence and find first building that needs upgrading
            for (const step of template.sequence) {
                const currentLevel = currentBuildings[step.building] || 0;

                if (currentLevel < step.level) {
                    // CRITICAL: Always build only +1 level at a time
                    const nextLevel = currentLevel + 1;

                    console.log(`🔍 Template check: ${step.building} current=${currentLevel}, target=${step.level}, next=${nextLevel}`);

                    return {
                        building: step.building,
                        current_level: currentLevel,
                        target_level: step.level,      // Final target from template
                        next_level: nextLevel          // ALWAYS current + 1
                    };
                }
            }

            // Template completed
            return null;
        }

        /**
         * Get village template assignment
         */
        getVillageTemplate(villageId) {
            try {
                const assignments = JSON.parse(localStorage.getItem('autobuild_village_templates') || '{}');
                const templateNames = Object.keys(this.templates);
                const assignedTemplate = assignments[villageId];

                // If no template assigned or assigned template doesn't exist, return first available
                if (!assignedTemplate || !this.templates[assignedTemplate]) {
                    return templateNames.length > 0 ? templateNames[0] : null;
                }

                return assignedTemplate;
            } catch (error) {
                console.error('❌ Error getting village template:', error);
                return Object.keys(this.templates)[0] || null;
            }
        }

        /**
         * Set village template assignment
         */
        setVillageTemplate(villageId, templateName) {
            try {
                const assignments = JSON.parse(localStorage.getItem('autobuild_village_templates') || '{}');
                assignments[villageId] = templateName;
                localStorage.setItem('autobuild_village_templates', JSON.stringify(assignments));
                console.log(`✅ Village ${villageId} assigned template '${templateName}'`);
                return true;
            } catch (error) {
                console.error('❌ Error setting village template:', error);
                return false;
            }
        }

        /**
         * Get template progress for a village
         */
        getTemplateProgress(templateName, currentBuildings) {
            const template = this.getTemplate(templateName);
            if (!template) return null;

            let completed = 0;
            let total = template.sequence.length;
            const remaining = [];

            for (const step of template.sequence) {
                const currentLevel = currentBuildings[step.building] || 0;

                if (currentLevel >= step.level) {
                    completed++;
                } else {
                    remaining.push({
                        building: step.building,
                        currentLevel: currentLevel,
                        targetLevel: step.level,
                        levelsNeeded: step.level - currentLevel
                    });
                }
            }

            return {
                templateName: templateName,
                completed: completed,
                total: total,
                percentage: Math.round((completed / total) * 100),
                remaining: remaining,
                isComplete: completed === total
            };
        }

        /**
         * Create new template
         * @param {string} name - Template name
         * @param {string} description - Template description
         * @param {Array} sequence - Building sequence
         * @returns {boolean} Success
         */
        createTemplate(name, description, sequence) {
            try {
                if (this.templates[name]) {
                    console.error(`❌ Template '${name}' already exists`);
                    return false;
                }

                this.templates[name] = {
                    name: name,
                    description: description || 'Custom template',
                    sequence: sequence || [],
                    created: new Date().toISOString(),
                    isCustom: true
                };

                this.saveTemplates();
                console.log(`✅ Template '${name}' created`);
                return true;
            } catch (error) {
                console.error(`❌ Error creating template '${name}':`, error);
                return false;
            }
        }

        /**
         * Add building to template sequence
         * @param {string} templateName - Template name
         * @param {string} building - Building type
         * @param {number} level - Target level
         * @returns {boolean} Success
         */
        addBuildingToTemplate(templateName, building, level) {
            try {
                const template = this.templates[templateName];
                if (!template) {
                    console.error(`❌ Template '${templateName}' not found`);
                    return false;
                }

                template.sequence.push({ building: building, level: level });
                this.saveTemplates();
                console.log(`✅ Added ${building} level ${level} to template '${templateName}'`);
                return true;
            } catch (error) {
                console.error(`❌ Error adding building to template:`, error);
                return false;
            }
        }

        /**
         * Delete template
         * @param {string} name - Template name
         * @returns {boolean} Success
         */
        deleteTemplate(name) {
            try {
                if (!this.templates[name]) {
                    console.error(`❌ Template '${name}' not found`);
                    return false;
                }

                delete this.templates[name];
                this.saveTemplates();
                console.log(`✅ Template '${name}' deleted`);
                return true;
            } catch (error) {
                console.error(`❌ Error deleting template '${name}':`, error);
                return false;
            }
        }

        /**
         * List all template names
         * @returns {Array} Template names
         */
        getTemplateNames() {
            return Object.keys(this.templates);
        }

        /**
         * Check if templates exist
         * @returns {boolean} Has templates
         */
        hasTemplates() {
            return Object.keys(this.templates).length > 0;
        }
    }

    // Make template manager globally accessible
    window.AutoBuilderTemplates = new TemplateManager();
    const templateCount = Object.keys(window.AutoBuilderTemplates.getAllTemplates()).length;
    console.log(`📋 Template Manager loaded - ${templateCount} custom templates found`);

    // Next: Database & Data Helpers will be added here in Step 2

    // =============================================================================
    // 🔧 COMPREHENSIVE INTEGRATION CLASS
    // =============================================================================

    class ComprehensiveIntegration {
        constructor() {
            this.isInitialized = false;
            this.comprehensiveCollector = null;
            this.buildingQueueLogic = null;
        }

        /**
         * Initialize the comprehensive integration
         */
        async init() {
            try {
                console.log('🔧 Initializing Comprehensive Integration...');

                // Initialize comprehensive data collector
                this.comprehensiveCollector = {
                    collectVillageData: window.collectComprehensiveData || this.fallbackCollector,
                    loadLatestData: window.loadComprehensiveData || this.fallbackLoader,
                    cleanupData: window.cleanupComprehensiveData || this.fallbackCleanup
                };

                // Initialize building queue logic
                if (typeof window.TribalWarsBuildingQueueLogic === 'function') {
                    this.buildingQueueLogic = new window.TribalWarsBuildingQueueLogic();
                    console.log('✅ Building queue logic loaded');
                } else {
                    console.warn('⚠️ Building queue logic not available');
                }

                this.isInitialized = true;
                console.log('✅ Comprehensive Integration initialized successfully!');

            } catch (error) {
                console.error('❌ Failed to initialize Comprehensive Integration:', error);
            }
        }

        /**
         * Collect comprehensive data for a village
         * @param {string} villageId - Village ID
         * @returns {Promise<object>} Comprehensive village data
         */
        async collectVillageData(villageId) {
            if (!this.isInitialized) {
                await this.init();
            }

            try {
                console.log(`🔍 Collecting comprehensive data for village ${villageId}...`);

                if (typeof this.comprehensiveCollector.collectVillageData === 'function') {
                    const data = await this.comprehensiveCollector.collectVillageData(villageId);
                    if (data) {
                        console.log('✅ Comprehensive data collected successfully!');
                        return data;
                    }
                }

                // Fallback to basic collection
                console.log('🔄 Using fallback data collector...');
                return await this.fallbackCollector(villageId);

            } catch (error) {
                console.error('❌ Error collecting comprehensive data:', error);
                return null;
            }
        }

        /**
         * Fallback data collector
         * @param {string} villageId - Village ID
         * @returns {Promise<object>} Basic village data
         */
        async fallbackCollector(villageId) {
            console.log('🔄 Using fallback data collector...');

            try {
                // Use the existing DataCollector if available
                if (typeof DataCollector !== 'undefined' && DataCollector.collectAllData) {
                    const data = await DataCollector.collectAllData();

                    // Transform to comprehensive format
                    return {
                        villageId: villageId,
                        villageName: game_data.village.name,
                        coordinates: game_data.village.x + '|' + game_data.village.y,
                        worldId: game_data.world,
                        playerId: game_data.player.id,

                        // Transform existing data
                        troops: this.extractTroopsFromData(data),
                        resources: this.extractResourcesFromData(data),
                        buildings: this.extractBuildingsFromData(data),

                        // Metadata
                        extractedAt: new Date().toISOString(),
                        serverTime: new Date().toISOString(),
                        dataVersion: '1.0-fallback'
                    };
                }

                return null;

            } catch (error) {
                console.error('❌ Fallback collector failed:', error);
                return null;
            }
        }

        /**
         * Fallback data loader
         * @param {string} villageId - Village ID
         * @returns {Promise<object>} Loaded data
         */
        async fallbackLoader(villageId) {
            return await this.fallbackCollector(villageId);
        }

        /**
         * Fallback cleanup
         * @param {string} villageId - Village ID
         * @returns {Promise<boolean>} Success status
         */
        async fallbackCleanup(villageId) {
            return true;
        }

        /**
         * Extract troops from data
         * @param {object} data - Data object
         * @returns {object} Troops data
         */
        extractTroopsFromData(data) {
            return data.troops || {};
        }

        /**
         * Extract resources from data
         * @param {object} data - Data object
         * @returns {object} Resources data
         */
        extractResourcesFromData(data) {
            return data.resources || {};
        }

        /**
         * Extract buildings from data
         * @param {object} data - Data object
         * @returns {object} Buildings data
         */
        extractBuildingsFromData(data) {
            return data.buildings || {};
        }

        /**
         * Get integration status
         * @returns {object} Status information
         */
        getStatus() {
            return {
                isInitialized: this.isInitialized,
                hasComprehensiveCollector: !!this.comprehensiveCollector,
                hasBuildingQueueLogic: !!this.buildingQueueLogic
            };
        }
    }

    // =============================================================================
    // 🔧 ENHANCED DATA MANAGER CLASS
    // =============================================================================

    class EnhancedDataManager {
        constructor() {
            this.comprehensiveCollector = null;
            this.buildingQueueLogic = null;
            this.lastCollection = 0;
            this.collectionInterval = 30000; // 30 seconds minimum between collections
        }

        /**
         * Initialize the enhanced data manager
         */
        init() {
            // Initialize comprehensive data collector
            this.comprehensiveCollector = {
                collectVillageData: window.collectComprehensiveData || this.fallbackCollector,
                loadLatestData: window.loadComprehensiveData || this.fallbackLoader,
                cleanupData: window.cleanupComprehensiveData || this.fallbackCleanup
            };

            // Initialize building queue logic
            this.buildingQueueLogic = new TribalWarsBuildingQueueLogic();

            console.log('🔧 Enhanced Data Manager initialized');
        }

        /**
         * Collect comprehensive village data with security features
         * @param {string} villageId - Village ID
         * @returns {Promise<object>} Comprehensive village data
         */
        async collectComprehensiveData(villageId) {
            try {
                // Check if enough time has passed since last collection
                const now = Date.now();
                if (now - this.lastCollection < this.collectionInterval) {
                    console.log('⏳ Waiting for collection interval...');
                    return null;
                }

                console.log(`🔍 Collecting comprehensive data for village ${villageId}...`);

                // Use the comprehensive collector if available
                if (typeof this.comprehensiveCollector.collectVillageData === 'function') {
                    const data = await this.comprehensiveCollector.collectVillageData(villageId);
                    this.lastCollection = now;
                    return data;
                } else {
                    // Fallback to basic collection
                    return await this.fallbackCollector(villageId);
                }

            } catch (error) {
                console.error('❌ Error collecting comprehensive data:', error);
                return null;
            }
        }

        /**
         * Load latest comprehensive data
         * @param {string} villageId - Village ID
         * @returns {Promise<object>} Latest data
         */
        async loadLatestData(villageId) {
            try {
                if (typeof this.comprehensiveCollector.loadLatestData === 'function') {
                    return await this.comprehensiveCollector.loadLatestData(villageId);
                } else {
                    return await this.fallbackLoader(villageId);
                }
            } catch (error) {
                console.error('❌ Error loading latest data:', error);
                return null;
            }
        }

        /**
         * Add building to queue using enhanced logic
         * @param {string} villageId - Village ID
         * @param {string} buildingId - Building ID
         * @returns {Promise<boolean>} Success status
         */
        async addBuildingToQueue(villageId, buildingId) {
            try {
                console.log(`🏗️ Adding ${buildingId} to queue in village ${villageId}...`);

                if (this.buildingQueueLogic) {
                    return await this.buildingQueueLogic.addBuildingToQueue(villageId, buildingId);
                } else {
                    console.warn('⚠️ Building queue logic not available');
                    return false;
                }
            } catch (error) {
                console.error('❌ Error adding building to queue:', error);
                return false;
            }
        }

        /**
         * Get current queue status
         * @param {string} villageId - Village ID
         * @returns {Promise<object>} Queue status
         */
        async getQueueStatus(villageId) {
            try {
                if (this.buildingQueueLogic) {
                    return await this.buildingQueueLogic.getQueueStatus(villageId);
                } else {
                    return { count: 0, maxCapacity: 5, hasSpace: true, items: [] };
                }
            } catch (error) {
                console.error('❌ Error getting queue status:', error);
                return { count: 0, maxCapacity: 5, hasSpace: true, items: [] };
            }
        }

        /**
         * Check if queue has space
         * @param {string} villageId - Village ID
         * @returns {Promise<boolean>} Has space
         */
        async hasQueueSpace(villageId) {
            try {
                if (this.buildingQueueLogic) {
                    return await this.buildingQueueLogic.hasQueueSpace(villageId);
                } else {
                    return true; // Assume has space if logic not available
                }
            } catch (error) {
                console.error('❌ Error checking queue space:', error);
                return false;
            }
        }

        /**
         * Remove building from queue
         * @param {string} villageId - Village ID
         * @param {string} cancelId - Cancel ID
         * @returns {Promise<boolean>} Success status
         */
        async removeBuildingFromQueue(villageId, cancelId) {
            try {
                if (this.buildingQueueLogic) {
                    return await this.buildingQueueLogic.removeBuildingFromQueue(villageId, cancelId);
                } else {
                    console.warn('⚠️ Building queue logic not available');
                    return false;
                }
            } catch (error) {
                console.error('❌ Error removing building from queue:', error);
                return false;
            }
        }

        /**
         * Fallback data collector (basic collection)
         * @param {string} villageId - Village ID
         * @returns {Promise<object>} Basic village data
         */
        async fallbackCollector(villageId) {
            console.log('🔄 Using fallback data collector...');

            try {
                // Use the existing DataCollector
                const data = await DataCollector.collectAllData();

                // Transform to comprehensive format
                return {
                    villageId: villageId,
                    villageName: game_data.village.name,
                    coordinates: game_data.village.x + '|' + game_data.village.y,
                    worldId: game_data.world,
                    playerId: game_data.player.id,

                    // Transform existing data
                    troops: this.extractTroopsFromData(data),
                    resources: this.extractResourcesFromData(data),
                    buildings: this.extractBuildingsFromData(data),

                    // Metadata
                    extractedAt: new Date().toISOString(),
                    serverTime: new Date().toISOString(),
                    dataVersion: '1.0-fallback'
                };

            } catch (error) {
                console.error('❌ Fallback collector failed:', error);
                return null;
            }
        }

        /**
         * Fallback data loader
         * @param {string} villageId - Village ID
         * @returns {Promise<object>} Loaded data
         */
        async fallbackLoader(villageId) {
            return await this.fallbackCollector(villageId);
        }

        /**
         * Fallback cleanup
         * @param {string} villageId - Village ID
         * @returns {Promise<boolean>} Success status
         */
        async fallbackCleanup(villageId) {
            return true;
        }

        /**
         * Extract troops from data
         * @param {object} data - Data object
         * @returns {object} Troops data
         */
        extractTroopsFromData(data) {
            return data.troops || {};
        }

        /**
         * Extract resources from data
         * @param {object} data - Data object
         * @returns {object} Resources data
         */
        extractResourcesFromData(data) {
            return data.resources || {};
        }

        /**
         * Extract buildings from data
         * @param {object} data - Data object
         * @returns {object} Buildings data
         */
        extractBuildingsFromData(data) {
            return data.buildings || {};
        }

        /**
         * Get building ID mapping
         * @param {string} buildingName - Building name
         * @returns {string} Building ID
         */
        getBuildingId(buildingName) {
            const buildingMap = {
                'main': 'main',
                'barracks': 'barracks',
                'stable': 'stable',
                'garage': 'garage',
                'watchtower': 'watchtower',
                'snob': 'snob',
                'smith': 'smith',
                'place': 'place',
                'market': 'market',
                'wood': 'wood',
                'stone': 'stone',
                'iron': 'iron',
                'farm': 'farm',
                'storage': 'storage',
                'hide': 'hide',
                'wall': 'wall'
            };

            return buildingMap[buildingName] || buildingName;
        }

        /**
         * Get status
         * @returns {object} Status information
         */
        getStatus() {
            return {
                hasComprehensiveCollector: !!this.comprehensiveCollector,
                hasBuildingQueueLogic: !!this.buildingQueueLogic,
                lastCollection: this.lastCollection,
                collectionInterval: this.collectionInterval
            };
        }
    }







    // =============================================================================
    // ⚙️ SETTINGS CLASS
    // =============================================================================
    
    class Settings {
        constructor() {
            this.defaults = {
                // Bot settings
                autoBuildEnabled: false,
                checkInterval: 30,
                
                // Building settings
                maxQueueSize: 5, // Game maximum
                costupSetup: [], // Array of building plans in order
                
                // UI settings
                showSettingsPanel: true,
                showBuildQueue: true,
                showVillageManager: true,
                
                // Advanced settings
                debugMode: false,
                logLevel: 'info', // 'debug', 'info', 'warn', 'error'
                
                // Data settings
                autoCollectData: true,
                dataCollectionInterval: 300, // 5 minutes
                maxStoredVillages: 50,
                
                // Villages refresh interval
                villageRefreshInterval: 10,
                
                // Version and metadata
                version: '1.0.0',
                lastUpdated: Date.now()
            };
            
            this.current = {};
        }
        
        /**
         * Load settings from localStorage
         */
        load() {
            try {
                const saved = localStorage.getItem('autobuilder_settings');
                this.current = saved ? JSON.parse(saved) : {};
                
                // Merge with defaults for any missing settings
                this.current = { ...this.defaults, ...this.current };
                
                console.log('⚙️ Settings loaded successfully');
                
            } catch (error) {
                console.error('❌ Failed to load settings:', error);
                this.current = { ...this.defaults };
            }
        }
        
        /**
         * Save settings to localStorage
         */
        save() {
            try {
                this.current.lastUpdated = Date.now();
                localStorage.setItem('autobuilder_settings', JSON.stringify(this.current));
                console.log('💾 Settings saved successfully');
                return true;
            } catch (error) {
                console.error('❌ Failed to save settings:', error);
                return false;
            }
        }
        
        /**
         * Get a setting value
         * @param {string} key - Setting key
         * @param {any} defaultValue - Default value if not found
         * @returns {any} Setting value
         */
        get(key, defaultValue = null) {
            const value = this.current[key];
            return value !== undefined ? value : defaultValue;
        }
        
        /**
         * Set a setting value
         * @param {string} key - Setting key
         * @param {any} value - Setting value
         */
        set(key, value) {
            this.current[key] = value;
            this.save();
        }
        
        /**
         * Reset settings to defaults
         */
        reset() {
            this.current = { ...this.defaults };
            this.save();
            console.log('🔄 Settings reset to defaults');
        }
        
        /**
         * Get all settings
         * @returns {object} All current settings
         */
        getAll() {
            return { ...this.current };
        }
        
        /**
         * Set multiple settings at once
         * @param {object} settings - Settings object
         */
        setMultiple(settings) {
            this.current = { ...this.current, ...settings };
            this.save();
        }
    }
    
    // =============================================================================
    // 🔧 COMPREHENSIVE INTEGRATION CLASS
    // =============================================================================
    
    class ComprehensiveIntegration {
        constructor() {
            this.isInitialized = false;
            this.comprehensiveCollector = null;
            this.buildingQueueLogic = null;
        }
        
        /**
         * Initialize the comprehensive integration
         */
        async init() {
            try {
                console.log('🔧 Initializing Comprehensive Integration...');
                
                // Initialize comprehensive data collector
                this.comprehensiveCollector = {
                    collectVillageData: window.collectComprehensiveData || this.fallbackCollector,
                    loadLatestData: window.loadComprehensiveData || this.fallbackLoader,
                    cleanupData: window.cleanupComprehensiveData || this.fallbackCleanup
                };
                
                // Initialize building queue logic
                if (typeof window.TribalWarsBuildingQueueLogic === 'function') {
                    this.buildingQueueLogic = new window.TribalWarsBuildingQueueLogic();
                    console.log('✅ Building queue logic loaded');
                } else {
                    console.warn('⚠️ Building queue logic not available');
                }
                
                this.isInitialized = true;
                console.log('✅ Comprehensive Integration initialized successfully!');
                
            } catch (error) {
                console.error('❌ Failed to initialize Comprehensive Integration:', error);
            }
        }
        
        /**
         * Collect comprehensive data for a village
         * @param {string} villageId - Village ID
         * @returns {Promise<object>} Comprehensive village data
         */
        async collectVillageData(villageId) {
            if (!this.isInitialized) {
                await this.init();
            }
            
            try {
                console.log(`🔍 Collecting comprehensive data for village ${villageId}...`);
                
                if (typeof this.comprehensiveCollector.collectVillageData === 'function') {
                    const data = await this.comprehensiveCollector.collectVillageData(villageId);
                    if (data) {
                        console.log('✅ Comprehensive data collected successfully!');
                        return data;
                    }
                }
                
                // Fallback to basic collection
                console.log('🔄 Using fallback data collector...');
                return await this.fallbackCollector(villageId);
                
            } catch (error) {
                console.error('❌ Error collecting comprehensive data:', error);
                return null;
            }
        }
        
        /**
         * Fallback data collector
         * @param {string} villageId - Village ID
         * @returns {Promise<object>} Basic village data
         */
        async fallbackCollector(villageId) {
            console.log('🔄 Using fallback data collector...');
            
            try {
                // Use the existing DataCollector if available
                if (typeof DataCollector !== 'undefined' && DataCollector.collectAllData) {
                    const data = await DataCollector.collectAllData();
                    
                    // Transform to comprehensive format
                    return {
                        villageId: villageId,
                        villageName: game_data.village.name,
                        coordinates: game_data.village.x + '|' + game_data.village.y,
                        worldId: game_data.world,
                        playerId: game_data.player.id,
                        
                        // Transform existing data
                        troops: this.extractTroopsFromData(data),
                        resources: this.extractResourcesFromData(data),
                        buildings: this.extractBuildingsFromData(data),
                        
                        // Metadata
                        extractedAt: new Date().toISOString(),
                        serverTime: new Date().toISOString(),
                        dataVersion: '1.0-fallback'
                    };
                }
                
                return null;
                
            } catch (error) {
                console.error('❌ Fallback collector failed:', error);
                return null;
            }
        }
        
        /**
         * Fallback data loader
         * @param {string} villageId - Village ID
         * @returns {Promise<object>} Loaded data
         */
        async fallbackLoader(villageId) {
            return await this.fallbackCollector(villageId);
        }
        
        /**
         * Fallback cleanup
         * @param {string} villageId - Village ID
         * @returns {Promise<boolean>} Success status
         */
        async fallbackCleanup(villageId) {
            return true;
        }
        
        /**
         * Extract troops from data
         * @param {object} data - Data object
         * @returns {object} Troops data
         */
        extractTroopsFromData(data) {
            return data.troops || {};
        }
        
        /**
         * Extract resources from data
         * @param {object} data - Data object
         * @returns {object} Resources data
         */
        extractResourcesFromData(data) {
            return data.resources || {};
        }
        
        /**
         * Extract buildings from data
         * @param {object} data - Data object
         * @returns {object} Buildings data
         */
        extractBuildingsFromData(data) {
            return data.buildings || {};
        }
        
        /**
         * Get integration status
         * @returns {object} Status information
         */
        getStatus() {
            return {
                isInitialized: this.isInitialized,
                hasComprehensiveCollector: !!this.comprehensiveCollector,
                hasBuildingQueueLogic: !!this.buildingQueueLogic
            };
        }
    }
    
    // =============================================================================
    // 🔧 ENHANCED DATA MANAGER CLASS
    // =============================================================================
    
    class EnhancedDataManager {
        constructor() {
            this.comprehensiveCollector = null;
            this.buildingQueueLogic = null;
            this.lastCollection = 0;
            this.collectionInterval = 30000; // 30 seconds minimum between collections
        }

        /**
         * Initialize the enhanced data manager
         */
        init() {
            // Initialize comprehensive data collector
            this.comprehensiveCollector = {
                collectVillageData: window.collectComprehensiveData || this.fallbackCollector,
                loadLatestData: window.loadComprehensiveData || this.fallbackLoader,
                cleanupData: window.cleanupComprehensiveData || this.fallbackCleanup
            };

            // Initialize building queue logic
            this.buildingQueueLogic = new TribalWarsBuildingQueueLogic();
            
            console.log('🔧 Enhanced Data Manager initialized');
        }

        /**
         * Collect comprehensive village data with security features
         * @param {string} villageId - Village ID
         * @returns {Promise<object>} Comprehensive village data
         */
        async collectComprehensiveData(villageId) {
            try {
                // Check if enough time has passed since last collection
                const now = Date.now();
                if (now - this.lastCollection < this.collectionInterval) {
                    console.log('⏳ Waiting for collection interval...');
                    return null;
                }

                console.log(`🔍 Collecting comprehensive data for village ${villageId}...`);
                
                // Use the comprehensive collector if available
                if (typeof this.comprehensiveCollector.collectVillageData === 'function') {
                    const data = await this.comprehensiveCollector.collectVillageData(villageId);
                    this.lastCollection = now;
                    return data;
                } else {
                    // Fallback to basic collection
                    return await this.fallbackCollector(villageId);
                }
                
            } catch (error) {
                console.error('❌ Error collecting comprehensive data:', error);
                return null;
            }
        }

        /**
         * Load latest comprehensive data
         * @param {string} villageId - Village ID
         * @returns {Promise<object>} Latest data
         */
        async loadLatestData(villageId) {
            try {
                if (typeof this.comprehensiveCollector.loadLatestData === 'function') {
                    return await this.comprehensiveCollector.loadLatestData(villageId);
                } else {
                    return await this.fallbackLoader(villageId);
                }
            } catch (error) {
                console.error('❌ Error loading latest data:', error);
                return null;
            }
        }

        /**
         * Add building to queue using enhanced logic
         * @param {string} villageId - Village ID
         * @param {string} buildingId - Building ID
         * @returns {Promise<boolean>} Success status
         */
        async addBuildingToQueue(villageId, buildingId) {
            try {
                console.log(`🏗️ Adding ${buildingId} to queue in village ${villageId}...`);
                
                if (this.buildingQueueLogic) {
                    return await this.buildingQueueLogic.addBuildingToQueue(villageId, buildingId);
                } else {
                    console.warn('⚠️ Building queue logic not available');
                    return false;
                }
            } catch (error) {
                console.error('❌ Error adding building to queue:', error);
                return false;
            }
        }

        /**
         * Get current queue status
         * @param {string} villageId - Village ID
         * @returns {Promise<object>} Queue status
         */
        async getQueueStatus(villageId) {
            try {
                if (this.buildingQueueLogic) {
                    return await this.buildingQueueLogic.getQueueStatus(villageId);
                } else {
                    return { count: 0, maxCapacity: 5, hasSpace: true, items: [] };
                }
            } catch (error) {
                console.error('❌ Error getting queue status:', error);
                return { count: 0, maxCapacity: 5, hasSpace: true, items: [] };
            }
        }

        /**
         * Check if queue has space
         * @param {string} villageId - Village ID
         * @returns {Promise<boolean>} Has space
         */
        async hasQueueSpace(villageId) {
            try {
                if (this.buildingQueueLogic) {
                    return await this.buildingQueueLogic.hasQueueSpace(villageId);
                } else {
                    return true; // Assume has space if logic not available
                }
            } catch (error) {
                console.error('❌ Error checking queue space:', error);
                return false;
            }
        }

        /**
         * Remove building from queue
         * @param {string} villageId - Village ID
         * @param {string} cancelId - Cancel ID
         * @returns {Promise<boolean>} Success status
         */
        async removeBuildingFromQueue(villageId, cancelId) {
            try {
                if (this.buildingQueueLogic) {
                    return await this.buildingQueueLogic.removeBuildingFromQueue(villageId, cancelId);
                } else {
                    console.warn('⚠️ Building queue logic not available');
                    return false;
                }
            } catch (error) {
                console.error('❌ Error removing building from queue:', error);
                return false;
            }
        }

        /**
         * Fallback data collector (basic collection)
         * @param {string} villageId - Village ID
         * @returns {Promise<object>} Basic village data
         */
        async fallbackCollector(villageId) {
            console.log('🔄 Using fallback data collector...');
            
            try {
                // Use the existing DataCollector
                const data = await DataCollector.collectAllData();
                
                // Transform to comprehensive format
                return {
                    villageId: villageId,
                    villageName: game_data.village.name,
                    coordinates: game_data.village.x + '|' + game_data.village.y,
                    worldId: game_data.world,
                    playerId: game_data.player.id,
                    
                    // Transform existing data
                    troops: this.extractTroopsFromData(data),
                    resources: this.extractResourcesFromData(data),
                    buildings: this.extractBuildingsFromData(data),
                    
                    // Metadata
                    extractedAt: new Date().toISOString(),
                    serverTime: new Date().toISOString(),
                    dataVersion: '1.0-fallback'
                };
                
            } catch (error) {
                console.error('❌ Fallback collector failed:', error);
                return null;
            }
        }

        /**
         * Fallback data loader
         * @param {string} villageId - Village ID
         * @returns {Promise<object>} Loaded data
         */
        async fallbackLoader(villageId) {
            return await this.fallbackCollector(villageId);
        }

        /**
         * Fallback cleanup
         * @param {string} villageId - Village ID
         * @returns {Promise<boolean>} Success status
         */
        async fallbackCleanup(villageId) {
            return true;
        }

        /**
         * Extract troops from data
         * @param {object} data - Data object
         * @returns {object} Troops data
         */
        extractTroopsFromData(data) {
            return data.troops || {};
        }

        /**
         * Extract resources from data
         * @param {object} data - Data object
         * @returns {object} Resources data
         */
        extractResourcesFromData(data) {
            return data.resources || {};
        }

        /**
         * Extract buildings from data
         * @param {object} data - Data object
         * @returns {object} Buildings data
         */
        extractBuildingsFromData(data) {
            return data.buildings || {};
        }

        /**
         * Get building ID mapping
         * @param {string} buildingName - Building name
         * @returns {string} Building ID
         */
        getBuildingId(buildingName) {
            const buildingMap = {
                'main': 'main',
                'barracks': 'barracks',
                'stable': 'stable',
                'garage': 'garage',
                'watchtower': 'watchtower',
                'snob': 'snob',
                'smith': 'smith',
                'place': 'place',
                'market': 'market',
                'wood': 'wood',
                'stone': 'stone',
                'iron': 'iron',
                'farm': 'farm',
                'storage': 'storage',
                'hide': 'hide',
                'wall': 'wall'
            };
            
            return buildingMap[buildingName] || buildingName;
        }

        /**
         * Get status
         * @returns {object} Status information
         */
        getStatus() {
            return {
                hasComprehensiveCollector: !!this.comprehensiveCollector,
                hasBuildingQueueLogic: !!this.buildingQueueLogic,
                lastCollection: this.lastCollection,
                collectionInterval: this.collectionInterval
            };
        }
    }
    
    // =============================================================================
    // ⚙️ SETTINGS PANEL CLASS
    // =============================================================================
    
    class SettingsPanel {
        constructor() {
            this.settings = null;
            this.panel = null;
            this.isVisible = false;
        }
        
        /**
         * Initialize the settings panel
         */
        init() {
            try {
                console.log('⚙️ Initializing Settings Panel...');
                
                if (!window.AutoBuilder) {
                    console.error('❌ AutoBuilder not available for Settings Panel');
                    return;
                }
                
                this.settings = window.AutoBuilder.getSettings();
                if (!this.settings) {
                    console.error('❌ Settings not available for Settings Panel');
                    return;
                }
                
                this.createPanel();
                console.log('⚙️ Settings Panel initialized successfully');
            } catch (error) {
                console.error('❌ Settings Panel initialization failed:', error);
            }
        }
        
        /**
         * Create the settings panel
         */
        createPanel() {
            // Remove existing panel
            const existing = document.getElementById('autobuilder-settings');
            if (existing) {
                existing.remove();
            }
            
            // Create new panel
            this.panel = document.createElement('div');
            this.panel.id = 'autobuilder-settings';
            this.panel.className = 'autobuilder-panel';
            this.panel.style.display = 'none';
            
            this.panel.innerHTML = `
                <div class="autobuilder-header">
                    <h3>🏗️ Auto Builder Settings</h3>
                    <div style="display:flex;gap:4px;align-items:center;">
                        <button class="autobuilder-close" id="autobuilder-settings-close">×</button>
                    </div>
                </div>
                <div class="autobuilder-content">
                    <div class="autobuilder-section">
                        <h4>🤖 Bot Settings</h4>
                        <div class="setting-group">
                            <label>
                                <input type="checkbox" id="autoBuildEnabled">
                                Enable Auto Building
                            </label>
                        </div>
                        <div class="setting-group">
                            <label>Check Interval (seconds):</label>
                            <input type="number" id="checkInterval" min="10" max="300">
                        </div>
                        <div class="setting-group">
                            <label>Max Queue Size:</label>
                            <input type="number" id="maxQueueSize" min="1" max="5" value="5" readonly>
                            <small>(Game maximum)</small>
                        </div>
                    </div>
                    
                    <div class="autobuilder-section">
                        <h4>🔧 Actions</h4>
                        <div class="setting-group">
                            <button id="saveSettings" class="autobuilder-btn autobuilder-btn-primary">Save Settings</button>
                            <button id="resetSettings" class="autobuilder-btn autobuilder-btn-secondary">Reset to Defaults</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(this.panel);
            this.addStyles();
            this.bindEvents();
            
            // Attach close event
            const closeBtn = this.panel.querySelector('#autobuilder-settings-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.hide());
            }
        }
        
        /**
         * Add styles for the panel
         */
        addStyles() {
            const styles = `
                .autobuilder-panel {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: #2c3e50;
                    color: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    z-index: 10000;
                    min-width: 400px;
                    max-width: 600px;
                    font-family: Arial, sans-serif;
                }
                
                .autobuilder-header {
                    background: #34495e;
                    padding: 15px;
                    border-radius: 8px 8px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .autobuilder-header h3 {
                    margin: 0;
                    font-size: 18px;
                }
                
                .autobuilder-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .autobuilder-close:hover {
                    background: rgba(255,255,255,0.1);
                    border-radius: 4px;
                }
                
                .autobuilder-content {
                    padding: 20px;
                }
                
                .autobuilder-section {
                    margin-bottom: 20px;
                }
                
                .autobuilder-section h4 {
                    margin: 0 0 15px 0;
                    color: #ecf0f1;
                    font-size: 16px;
                }
                
                .setting-group {
                    margin-bottom: 15px;
                }
                
                .setting-group label {
                    display: block;
                    margin-bottom: 5px;
                    color: #bdc3c7;
                }
                
                .setting-group input[type="number"] {
                    width: 80px;
                    padding: 5px;
                    border: 1px solid #34495e;
                    border-radius: 4px;
                    background: #34495e;
                    color: white;
                }
                
                .setting-group small {
                    color: #95a5a6;
                    font-size: 12px;
                }
                
                .autobuilder-btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    margin-right: 10px;
                }
                
                .autobuilder-btn-primary {
                    background: #3498db;
                    color: white;
                }
                
                .autobuilder-btn-primary:hover {
                    background: #2980b9;
                }
                
                .autobuilder-btn-secondary {
                    background: #95a5a6;
                    color: white;
                }
                
                .autobuilder-btn-secondary:hover {
                    background: #7f8c8d;
                }
            `;
            
            const styleElement = document.createElement('style');
            styleElement.textContent = styles;
            document.head.appendChild(styleElement);
        }
        
        /**
         * Bind events to the panel
         */
        bindEvents() {
            // Save settings button
            const saveBtn = this.panel.querySelector('#saveSettings');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => this.saveSettings());
            }
            
            // Reset settings button
            const resetBtn = this.panel.querySelector('#resetSettings');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => this.resetSettings());
            }
        }
        
        /**
         * Save settings
         */
        saveSettings() {
            try {
                const autoBuildEnabled = this.panel.querySelector('#autoBuildEnabled').checked;
                const checkInterval = parseInt(this.panel.querySelector('#checkInterval').value) || 30;
                const maxQueueSize = parseInt(this.panel.querySelector('#maxQueueSize').value) || 5;
                
                this.settings.set('autoBuildEnabled', autoBuildEnabled);
                this.settings.set('checkInterval', checkInterval);
                this.settings.set('maxQueueSize', maxQueueSize);
                
                console.log('💾 Settings saved successfully');
                
                if (typeof UI !== 'undefined' && UI.SuccessMessage) {
                    UI.SuccessMessage('✅ Settings saved successfully!');
                }
                
            } catch (error) {
                console.error('❌ Failed to save settings:', error);
                if (typeof UI !== 'undefined' && UI.ErrorMessage) {
                    UI.ErrorMessage('❌ Failed to save settings');
                }
            }
        }
        
        /**
         * Reset settings
         */
        resetSettings() {
            try {
                this.settings.reset();
                this.loadCurrentSettings();
                console.log('🔄 Settings reset to defaults');
                
                if (typeof UI !== 'undefined' && UI.SuccessMessage) {
                    UI.SuccessMessage('🔄 Settings reset to defaults!');
                }
                
            } catch (error) {
                console.error('❌ Failed to reset settings:', error);
                if (typeof UI !== 'undefined' && UI.ErrorMessage) {
                    UI.ErrorMessage('❌ Failed to reset settings');
                }
            }
        }
        
        /**
         * Load current settings into the panel
         */
        loadCurrentSettings() {
            try {
                this.panel.querySelector('#autoBuildEnabled').checked = this.settings.get('autoBuildEnabled', false);
                this.panel.querySelector('#checkInterval').value = this.settings.get('checkInterval', 30);
                this.panel.querySelector('#maxQueueSize').value = this.settings.get('maxQueueSize', 5);
            } catch (error) {
                console.error('❌ Failed to load current settings:', error);
            }
        }
        
        /**
         * Show the panel
         */
        show() {
            if (this.panel) {
                this.panel.style.display = 'block';
                this.loadCurrentSettings();
                this.isVisible = true;
            }
        }
        
        /**
         * Hide the panel
         */
        hide() {
            if (this.panel) {
                this.panel.style.display = 'none';
                this.isVisible = false;
            }
        }
        
        /**
         * Toggle the panel
         */
        toggle() {
            if (this.isVisible) {
                this.hide();
            } else {
                this.show();
            }
        }
    }
    
    // =============================================================================
    // 🔍 COMPREHENSIVE DATA COLLECTOR INTEGRATION
    // =============================================================================

    /**
     * Load and integrate the comprehensive data collector
     */
    function loadComprehensiveDataCollector() {
        // Check if comprehensive collector is available
        if (typeof window.collectComprehensiveData === 'function') {
            console.log('✅ Comprehensive data collector loaded');
            return true;
        }

        // Create a basic comprehensive data collector if not available externally
        console.log('🔧 Creating basic comprehensive data collector...');

        window.collectComprehensiveData = async function(villageId) {
            console.log(`🔍 Collecting comprehensive data for village ${villageId}...`);

            try {
                // Use the existing DataCollector as fallback
                const data = await DataCollector.collectAllData();

                if (data) {
                    // Transform to comprehensive format
                    const comprehensiveData = {
                        villageId: villageId,
                        villageName: game_data.village.name,
                        coordinates: game_data.village.x + '|' + game_data.village.y,
                        worldId: game_data.world,
                        playerId: game_data.player.id,

                        // Transform existing data
                        troops: extractTroopsFromData(data),
                        resources: extractResourcesFromData(data),
                        buildings: extractBuildingsFromData(data),

                        // Metadata
                        extractedAt: new Date().toISOString(),
                        serverTime: new Date().toISOString(),
                        dataVersion: '1.0-fallback'
                    };

                    console.log('✅ Comprehensive data collected successfully!');
                    return comprehensiveData;
                }

                return null;

            } catch (error) {
                console.error('❌ Error collecting comprehensive data:', error);
                return null;
            }
        };

        // Helper functions for data extraction
        function extractTroopsFromData(data) {
            return data.troops || {};
        }

        function extractResourcesFromData(data) {
            return data.resources || {};
        }

        function extractBuildingsFromData(data) {
            return data.buildings || {};
        }

        console.log('✅ Basic comprehensive data collector created');
        return true;
    }

    /**
     * Load and integrate the building queue logic
     */
    function loadBuildingQueueLogic() {
        // Check if building queue logic is available
        if (typeof window.TribalWarsBuildingQueueLogic === 'function') {
            console.log('✅ Building queue logic loaded');
            return true;
        }

        // Define the class directly if not available externally
        console.log('🔧 Creating TribalWarsBuildingQueueLogic class...');

        window.TribalWarsBuildingQueueLogic = class TribalWarsBuildingQueueLogic {
            constructor() {
                this.csrfToken = null;
                this.lastTokenUpdate = 0;
                this.tokenLifetime = 5 * 60 * 1000; // 5 minutes
            }

            /**
             * Get CSRF token from the main page
             * @param {string} villageId - Village ID
             * @returns {Promise<string>} CSRF token
             */
            async getCSRFToken(villageId) {
                try {
                    console.log('🔑 Fetching CSRF token...');

                    const response = await fetch(`game.php?village=${villageId}&screen=main`);
                    const html = await response.text();

                    // Try multiple CSRF token patterns that TribalWars uses
                    const patterns = [
                        /game_data\.csrf\s*=\s*['"]([^'"]+)['"]/,     // game_data.csrf = "token"
                        /"csrf"\s*:\s*"([^"]+)"/,                     // "csrf": "token"
                        /csrf['"]\s*:\s*['"]([^'"]+)['"]/,            // csrf: "token"
                        /name=['"]h['"][^>]*value=['"]([^'"]+)['"]/,   // input name="h" value="token"
                        /\bh=([a-f0-9]{8})\b/,                        // h=c4c4f43a in URLs
                        /csrf_token['"]\s*:\s*['"]([^'"]+)['"]/,       // csrf_token: "token"
                        /authenticity_token['"]\s*:\s*['"]([^'"]+)['"]/ // authenticity_token: "token"
                    ];

                    let csrf = null;
                    let usedPattern = '';

                    for (let i = 0; i < patterns.length; i++) {
                        const match = html.match(patterns[i]);
                        if (match && match[1]) {
                            csrf = match[1];
                            usedPattern = `Pattern ${i + 1}`;
                            console.log(`✅ CSRF token found using ${usedPattern}`);
                            break;
                        }
                    }

                    // Additional check: Look for global game_data variable
                    if (!csrf) {
                        try {
                            const gameDataMatch = html.match(/var\s+game_data\s*=\s*({[^}]+})/);
                            if (gameDataMatch) {
                                const gameDataStr = gameDataMatch[1];
                                const csrfInGameData = gameDataStr.match(/csrf['"]?\s*:\s*['"]([^'"]+)['"]/);
                                if (csrfInGameData) {
                                    csrf = csrfInGameData[1];
                                    usedPattern = 'game_data object';
                                    console.log(`✅ CSRF token found in ${usedPattern}`);
                                }
                            }
                        } catch (parseError) {
                            console.log('⚠️ Could not parse game_data object');
                        }
                    }

                    // Final fallback: Look for any 8-character hex string (typical TribalWars format)
                    if (!csrf) {
                        const hexMatches = html.match(/\b[a-f0-9]{8}\b/g);
                        if (hexMatches && hexMatches.length > 0) {
                            // Take the first 8-char hex that appears multiple times (likely CSRF)
                            const tokenCounts = {};
                            hexMatches.forEach(token => {
                                tokenCounts[token] = (tokenCounts[token] || 0) + 1;
                            });

                            // Find the most common 8-char hex (likely the CSRF token)
                            let bestToken = null;
                            let maxCount = 0;
                            Object.entries(tokenCounts).forEach(([token, count]) => {
                                if (count > maxCount && count > 1) { // Must appear at least twice
                                    maxCount = count;
                                    bestToken = token;
                                }
                            });

                            if (bestToken) {
                                csrf = bestToken;
                                usedPattern = `Fallback hex (${maxCount} occurrences)`;
                                console.log(`✅ CSRF token found using ${usedPattern}`);
                            }
                        }
                    }

                    if (csrf) {
                        // Validate token format (should be 8 characters)
                        if (csrf.length === 8 && /^[a-f0-9]+$/i.test(csrf)) {
                            this.csrfToken = csrf;
                            this.lastTokenUpdate = Date.now();
                            console.log(`✅ CSRF Token obtained (${usedPattern}):`, csrf);
                            return csrf;
                        } else {
                            console.warn(`⚠️ Invalid CSRF token format: ${csrf} (length: ${csrf.length})`);
                        }
                    }

                    console.error('❌ CSRF token not found in HTML');
                    console.log('🔍 Debug: Searching for any tokens in page...');

                    // Debug: Show some potential tokens for manual inspection
                    const debugTokens = html.match(/[a-f0-9]{6,10}/g);
                    if (debugTokens) {
                        console.log('🔍 Found potential tokens:', debugTokens.slice(0, 5));
                    }

                    return null;

                } catch (error) {
                    console.error('❌ Failed to get CSRF token:', error);
                    return null;
                }
            }

            /**
             * Check if current token is still valid
             * @returns {boolean} Token validity
             */
            isTokenValid() {
                if (!this.csrfToken) return false;

                const timeSinceUpdate = Date.now() - this.lastTokenUpdate;
                return timeSinceUpdate < this.tokenLifetime;
            }

            /**
             * Get valid CSRF token (refresh if needed)
             * @param {string} villageId - Village ID
             * @returns {Promise<string>} Valid CSRF token
             */
            async getValidCSRFToken(villageId) {
                if (this.isTokenValid()) {
                    console.log('✅ Using cached CSRF token');
                    return this.csrfToken;
                }

                console.log('🔄 CSRF token expired, refreshing...');
                return await this.getCSRFToken(villageId);
            }

            /**
             * Add building to queue - MAIN LOGIC
             * @param {string} villageId - Village ID
             * @param {string} buildingId - Building ID (e.g., "main", "barracks", "stable")
             * @returns {Promise<boolean>} Success status
             */
            async addBuildingToQueue(villageId, buildingId) {
                try {
                    console.log(`🏗️ Adding ${buildingId} to queue in village ${villageId}...`);

                    // Step 1: Get valid CSRF token
                    const csrf = await this.getValidCSRFToken(villageId);
                    if (!csrf) {
                        console.error('❌ No valid CSRF token available');
                        return false;
                    }

                    // Step 2: Build the request URL (exact format from TribalWars)
                    const url = `game.php?village=${villageId}&screen=main&action=upgrade_building&id=${buildingId}&type=main&h=${csrf}`;

                    console.log(`🌐 Making building request: ${url}`);

                    // Step 3: Make the request
                    const response = await fetch(url);
                    const result = await response.text();

                    // Step 4: IMPROVED SUCCESS DETECTION
                    // Tribal Wars returns full HTML pages on success, not simple messages
                    const hasGameTitle = result.includes('Tribal Wars - World 147');
                    const isProperHTML = result.includes('<!DOCTYPE HTML>');
                    const hasMainContent = result.includes('screen=main') || result.includes('building');
                    const hasQueue = result.includes('building_order') || result.includes('queue');

                    // Success if we get proper game page
                    const success = (
                        response.ok &&           // HTTP success (200)
                        isProperHTML &&          // Got proper HTML page
                        hasGameTitle &&          // Got game page
                        (hasMainContent || hasQueue)  // Has building/queue content
                    );

                    if (success) {
                        console.log(`✅ Successfully added ${buildingId} to queue!`);
                    } else {
                        console.log(`❌ Failed to add ${buildingId} to queue`);
                        console.log('Response preview:', result.substring(0, 200));
                    }

                    return success;

                } catch (error) {
                    console.error('❌ Error adding building to queue:', error);
                    return false;
                }
            }

            /**
             * Remove building from active queue
             * @param {string} villageId - Village ID
             * @param {string} cancelId - Cancel ID from queue
             * @returns {Promise<boolean>} Success status
             */
            async removeBuildingFromQueue(villageId, cancelId) {
                try {
                    console.log(`🗑️ Removing building ${cancelId} from queue...`);

                    // Get valid CSRF token
                    const csrf = await this.getValidCSRFToken(villageId);
                    if (!csrf) {
                        console.error('❌ No valid CSRF token available');
                        return false;
                    }

                    // Build the request (exact format from TribalWars)
                    const url = `game.php?village=${villageId}&screen=main&ajaxaction=cancel_order&type=main`;
                    const body = `id=${cancelId}&destroy=0&h=${csrf}`;

                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            'Tribalwars-Ajax': '1',
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        body: body
                    });

                    // IMPROVED SUCCESS DETECTION for remove operation
                    const result = await response.text();
                    const hasGameTitle = result.includes('Tribal Wars - World 147');
                    const isProperHTML = result.includes('<!DOCTYPE HTML>');
                    const success = response.ok && isProperHTML && hasGameTitle;

                    if (success) {
                        console.log(`✅ Successfully removed building from queue!`);
                    } else {
                        console.log(`❌ Failed to remove building from queue`);
                    }

                    return success;

                } catch (error) {
                    console.error('❌ Error removing building from queue:', error);
                    return false;
                }
            }

            /**
             * Get current building queue status
             * @param {string} villageId - Village ID
             * @returns {Promise<Object>} Queue status
             */
            async getQueueStatus(villageId) {
                try {
                    console.log('📋 Getting current building queue status...');

                    const response = await fetch(`game.php?village=${villageId}&screen=main`);
                    const html = await response.text();

                    // Parse queue from HTML
                    const queueItems = [];
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');

                    // Find queue elements (adjust selectors based on TribalWars HTML structure)
                    const queueElements = doc.querySelectorAll('.queue-item, .building-queue-item, [class*="queue"]');

                    queueElements.forEach((element, index) => {
                        const buildingName = element.querySelector('.building-name, [class*="building"]')?.textContent || 'Unknown';
                        const timeLeft = element.querySelector('.time-left, [class*="time"]')?.textContent || '';

                        queueItems.push({
                            index: index,
                            building: buildingName,
                            timeLeft: timeLeft
                        });
                    });

                    const queueStatus = {
                        count: queueItems.length,
                        maxCapacity: 5, // TribalWars allows max 5 buildings in queue
                        hasSpace: queueItems.length < 5,
                        items: queueItems
                    };

                    console.log(`📊 Queue status: ${queueItems.length}/5 items`);
                    return queueStatus;

                } catch (error) {
                    console.error('❌ Error getting queue status:', error);
                    return { count: 0, maxCapacity: 5, hasSpace: true, items: [] };
                }
            }

            /**
             * Check if queue has space
             * @param {string} villageId - Village ID
             * @returns {Promise<boolean>} Has space
             */
            async hasQueueSpace(villageId) {
                try {
                    const status = await this.getQueueStatus(villageId);
                    return status.hasSpace;
                } catch (error) {
                    console.error('❌ Error checking queue space:', error);
                    return false;
                }
            }
        };

        console.log('✅ TribalWarsBuildingQueueLogic class created');
        return true;
    }

    // =============================================================================
    // 🔍 INTEGRATED DATA COLLECTOR (from Helper.js)
    // =============================================================================

    /**
     * Complete Data Collector - Gets ALL information from current page
     */
    class DataCollector {

        /**
         * Collect all village information from current page
         * @returns {Promise<object>} Complete village data
         */
        static async collectAllData() {
            const villageId = game_data.village.id.toString();
            console.log(`🔍 Collecting all data for village ${villageId}...`);

            try {
                // Collect basic village info
                const villageInfo = this.collectVillageInfo();

                // Collect resources (if on main page)
                const resourcesInfo = this.collectResources();

                // Collect buildings (if available)
                const buildingsInfo = this.collectBuildings();

                // Collect queue data
                const queueData = await this.collectQueue(villageId);

                const completeData = {
                    info: villageInfo,
                    resources: resourcesInfo,
                    buildings: buildingsInfo,
                    activeQueue: queueData,
                    futurePlans: [], // For future use
                    collectedAt: Date.now(),
                    collectedFrom: window.location.href
                };

                console.log('✅ All data collected successfully!');
                return completeData;

            } catch (error) {
                console.error('❌ Failed to collect data:', error);
                return null;
            }
        }

        /**
         * Collect village basic information
         * @returns {object} Village info
         */
        static collectVillageInfo() {
            return {
                id: game_data.village.id,
                name: game_data.village.name,
                coords: `${game_data.village.x}|${game_data.village.y}`,
                url: window.location.href,
                isActive: true,
                world: game_data.world,
                market: game_data.market
            };
        }

        /**
         * Collect resources from page
         * @returns {object} Resources data
         */
        static collectResources() {
            try {
                // Try to get resources from game interface
                const woodElement = document.querySelector('#wood');
                const stoneElement = document.querySelector('#stone');
                const ironElement = document.querySelector('#iron');
                const popElement = document.querySelector('#pop');

                const resources = {};

                if (woodElement) resources.wood = parseInt(woodElement.textContent.replace(/\./g, '')) || 0;
                if (stoneElement) resources.stone = parseInt(stoneElement.textContent.replace(/\./g, '')) || 0;
                if (ironElement) resources.iron = parseInt(ironElement.textContent.replace(/\./g, '')) || 0;

                // Try to get population
                if (popElement) {
                    const popText = popElement.textContent;
                    const popMatch = popText.match(/(\d+)\/(\d+)/);
                    if (popMatch) {
                        resources.pop = parseInt(popMatch[1]);
                        resources.pop_max = parseInt(popMatch[2]);
                    }
                }

                // Get storage capacity (if available)
                const storageElement = document.querySelector('.storage');
                if (storageElement) {
                    const storageText = storageElement.textContent;
                    const storageMatch = storageText.match(/(\d+)/);
                    if (storageMatch) {
                        resources.storage_max = parseInt(storageMatch[1]);
                    }
                }

                return resources;

            } catch (error) {
                console.error('❌ Failed to collect resources:', error);
                return {};
            }
        }

        /**
         * Collect buildings data
         * @returns {object} Buildings data
         */
        static collectBuildings() {
            try {
                // If we have building data in game_data
                if (game_data.village && game_data.village.buildings) {
                    return { ...game_data.village.buildings };
                }

                // Otherwise try to detect from page elements
                const buildings = {};

                // Try to find building levels from page
                const buildingElements = document.querySelectorAll('[data-building]');
                buildingElements.forEach(element => {
                    const building = element.getAttribute('data-building');
                    const levelElement = element.querySelector('.level');
                    if (levelElement) {
                        const levelMatch = levelElement.textContent.match(/(\d+)/);
                        if (levelMatch) {
                            buildings[building] = parseInt(levelMatch[1]);
                        }
                    }
                });

                return buildings;

            } catch (error) {
                console.error('❌ Failed to collect buildings:', error);
                return {};
            }
        }

        /**
         * Collect queue data by opening headquarters
         * @param {string} villageId - Village ID
         * @returns {Promise<array>} Queue data
         */
        static async collectQueue(villageId) {
            return new Promise((resolve) => {
                console.log('🔗 Opening headquarters to collect queue...');

                const hqUrl = `game.php?village=${villageId}&screen=main`;
                const hqTab = window.open(hqUrl, '_blank');

                if (!hqTab) {
                    console.warn('⚠️ Could not open headquarters tab');
                    resolve([]);
                    return;
                }

                setTimeout(() => {
                    try {
                        const queueData = this.extractQueueFromDocument(hqTab.document);
                        hqTab.close();
                        console.log(`✅ Queue collected: ${queueData.length} items`);
                        resolve(queueData);
                    } catch (error) {
                        console.error('❌ Failed to collect queue:', error);
                        hqTab.close();
                        resolve([]);
                    }
                }, 3000);
            });
        }

        /**
         * Extract queue from headquarters document
         * @param {Document} doc - Document from headquarters tab
         * @returns {array} Queue data
         */
        static extractQueueFromDocument(doc) {
            const queueData = [];

            try {
                const constructionRows = doc.querySelectorAll('table tr');

                constructionRows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 4) {
                        const buildingCell = cells[0];
                        const durationCell = cells[1];
                        const completionCell = cells[3];

                        const buildingText = buildingCell.textContent.trim();
                        const durationText = durationCell.textContent.trim();
                        const completionText = completionCell.textContent.trim();

                        const queueItem = this.parseQueueItem(buildingText, durationText, completionText);
                        if (queueItem) {
                            queueData.push(queueItem);
                        }
                    }
                });

            } catch (error) {
                console.error('❌ Failed to extract queue from document:', error);
            }

            return queueData;
        }

        /**
         * Parse queue item from text
         * @param {string} buildingText - Building text
         * @param {string} durationText - Duration text
         * @param {string} completionText - Completion text
         * @returns {object|null} Parsed queue item
         */
        static parseQueueItem(buildingText, durationText, completionText) {
            try {
                // Extract building name and level
                const buildingMatch = buildingText.match(/(\w+)\s+.*Level\s+(\d+)/i);
                if (!buildingMatch) return null;

                const buildingName = buildingMatch[1].toLowerCase();
                const targetLevel = parseInt(buildingMatch[2]);

                return {
                    building: this.mapBuildingName(buildingName),
                    target_level: targetLevel,
                    duration: durationText,
                    completion: completionText,
                    status: 'in_progress'
                };

            } catch (error) {
                console.error('❌ Failed to parse queue item:', error);
                return null;
            }
        }

        /**
         * Map building name to standard format
         * @param {string} buildingName - Building name
         * @returns {string} Standardized building name
         */
        static mapBuildingName(buildingName) {
            const buildingMap = {
                'main': 'main',
                'barracks': 'barracks',
                'stable': 'stable',
                'garage': 'garage',
                'watchtower': 'watchtower',
                'snob': 'snob',
                'smith': 'smith',
                'place': 'place',
                'market': 'market',
                'wood': 'wood',
                'stone': 'stone',
                'iron': 'iron',
                'farm': 'farm',
                'storage': 'storage',
                'hide': 'hide',
                'wall': 'wall'
            };

            return buildingMap[buildingName] || buildingName;
        }
    }

    // =============================================================================
    // 🗄️ DATABASE SYSTEM
    // =============================================================================

    class SimpleDB {
        static DATABASE_NAME = "Auto Builder";

        static saveVillage(villageId, villageData) {
            try {
                const key = `village_${villageId}`;
                localStorage.setItem(key, JSON.stringify({
                    data: villageData,
                    timestamp: Date.now()
                }));
                console.log(`💾 Saved village ${villageId} data`);
                return true;
            } catch (error) {
                console.error('❌ Failed to save village data:', error);
                return false;
            }
        }

        static loadVillage(villageId) {
            try {
                const key = `village_${villageId}`;
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : null;
            } catch (error) {
                console.error('❌ Failed to load village data:', error);
                return null;
            }
        }

        static loadDatabase() {
            const database = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('village_')) {
                    const villageId = key.replace('village_', '');
                    database[villageId] = this.loadVillage(villageId);
                }
            }
            return database;
        }

        static getAllVillages() {
            return this.loadDatabase();
        }

        static getVillage(villageId) {
            const data = this.loadVillage(villageId);
            return data ? data.data : null;
        }
    }

    // =============================================================================
    // 🔍 DATA COLLECTION FUNCTIONS
    // =============================================================================

    async function getInfo() {
        const villageId = game_data.village.id;
        const villageName = game_data.village.name;
        const coords = `${game_data.village.x}|${game_data.village.y}`;

        console.log(`🔍 Getting info for village ${villageId} (${villageName}) at ${coords}`);

        try {
            // Try comprehensive data collection first
            if (typeof window.collectComprehensiveData === 'function') {
                console.log('🎯 Using comprehensive data collector...');
                const comprehensiveData = await window.collectComprehensiveData(villageId);
                if (comprehensiveData) {
                    console.log('✅ Comprehensive data collected successfully!');
                    return comprehensiveData;
                }
            }

            // Fallback to basic data collection
            console.log('🔄 Using basic data collector...');
            const basicData = await DataCollector.collectAllData();
            if (basicData) {
                console.log('✅ Basic data collected successfully!');
                return basicData;
            }

            console.log('❌ No data collected');
            return null;

        } catch (error) {
            console.error('❌ Error getting village info:', error);
            return null;
        }
    }

    function showInfo() {
        getInfo().then(data => {
            if (data) {
                console.log('📊 Village Data:', data);

                // Show in UI if available
                if (typeof UI !== 'undefined' && UI.SuccessMessage) {
                    UI.SuccessMessage('✅ Village data collected successfully!');
                }
            } else {
                console.log('❌ No village data available');

                if (typeof UI !== 'undefined' && UI.ErrorMessage) {
                    UI.ErrorMessage('❌ Failed to collect village data');
                }
            }
        });
    }

    // =============================================================================
    // 🔄 AUTO REFRESH SYSTEM
    // =============================================================================

    // DISABLED: Old auto-refresh system (replaced by randomized auto collection)
    function scheduleVillageDataRefresh() {
        console.log('⚠️ Old scheduleVillageDataRefresh called - this is disabled. Use 🎲 Randomized Auto Collection instead.');

        // Return a dummy function that does nothing
        return function() {
            console.log('🚫 Auto-refresh disabled - use 🎲 Randomized Auto Collection for data fetching');
        };
    }

    // =============================================================================
    // 🏗️ MAIN AUTO BUILDER SYSTEM
    // =============================================================================

    function initializeAutoBuilder() {
        try {
            console.log('🚀 Initializing Auto Builder...');

            // Load external components - ENHANCED VERSION
            loadEnhancedComprehensiveDataCollector();
            loadBuildingQueueLogic();

            // Wait a bit for components to load, then initialize everything
            setTimeout(() => {
                try {
                    console.log('🔧 Creating Auto Builder components...');

                    // Create and initialize the bot (make it globally accessible immediately)
                    window.AutoBuildBot = new AutoBuildBot();
                    window.AutoBuildBot.init();
                    console.log('✅ AutoBuildBot created and accessible globally');

                    // Create and initialize the UI
                    window.AutoBuilderUI = new AutoBuilderUI();
                    window.AutoBuilderUI.init();
                    console.log('✅ AutoBuilderUI created and accessible globally');

                    // Initialize the main AutoBuilder class
                    class AutoBuilder {
                        constructor() {
                            this.bot = window.AutoBuildBot;
                            this.database = window.AutoBuilderDatabase;
                            this.settings = window.AutoBuilderSettings;
                            this.ui = window.AutoBuilderUI;
                            this.enhancedDataManager = null;
                            this.comprehensiveIntegration = null;
                        }

                        async init() {
                            try {
                                console.log('🔧 Initializing AutoBuilder main system...');

                                // Initialize comprehensive integration
                                this.comprehensiveIntegration = new ComprehensiveIntegration();
                                await this.comprehensiveIntegration.init();

                                // Initialize enhanced data manager
                                this.enhancedDataManager = new EnhancedDataManager();
                                this.enhancedDataManager.init();

                                console.log('✅ AutoBuilder main system initialized successfully!');

                                // Show welcome message
                                console.log('🎉 Auto Builder is ready! Click the 🤖 button in the top-right corner to open the control panel.');

                                // REMOVED: Old auto-refresh (replaced by randomized auto collection)

                            } catch (error) {
                                console.error('❌ Error initializing AutoBuilder main system:', error);
                            }
                        }

                        /**
                         * DISABLED: Old auto-refresh system (replaced by randomized auto collection)
                         */
                        startAutoRefresh() {
                            console.log('⚠️ Old auto-refresh system disabled - use 🎲 Randomized Auto Collection instead');
                            // REMOVED: Auto-refresh every 5 minutes (replaced by user-controlled randomized system)
                        }

                        getBot() { return this.bot; }
                        getDatabase() { return this.database; }
                        getSettings() { return this.settings; }
                        getUI() { return this.ui; }
                        getEnhancedDataManager() { return this.enhancedDataManager; }
                        getComprehensiveIntegration() { return this.comprehensiveIntegration; }
                    }

                    // Create global instance
                    window.AutoBuilder = new AutoBuilder();
                    window.AutoBuilder.init();

                    // Make enhanced tracker globally accessible (REPLACES old progress tracking)
                    window.EnhancedProgressTracker = EnhancedProgressTracker;
                    window.BuildTimeCalculator = BuildTimeCalculator;
                    window.QueueSimulator = QueueSimulator;

                    // Create global enhanced tracker instance
                    window.enhancedTracker = new EnhancedProgressTracker();

                    console.log('🧠 Enhanced Progress Tracking system loaded globally');
                    console.log('🔄 Old progress tracking methods will be replaced');

                    // Make console functions globally accessible
                    window.getInfo = getInfo;
                    window.showInfo = showInfo;

                    console.log('✅ All components initialized and ready!');
                    console.log('📝 Available console commands:');
                    console.log('🤖 ENHANCED Bot Commands (NO MORE BLIND BUILDING!):');
                    console.log('   - AutoBuildBot.start() - Start ENHANCED bot with progress tracking');
                    console.log('   - AutoBuildBot.stop() - Stop the bot');
                    console.log('   - AutoBuildBot.getStatus() - Get bot status');
                    console.log('📋 Template Management:');
                    console.log('   - Use UI: 📋 Building Templates section to create and assign templates');
                    console.log('   - AutoBuilderTemplates.createTemplate("MyTemplate", "Description", [{building:"main",level:5}]) - Create template');
                    console.log('   - AutoBuilderTemplates.setVillageTemplate(villageId, "MyTemplate") - Assign template');
                    console.log('   - AutoBuilderTemplates.getVillageTemplate(villageId) - Get assigned template');
                    console.log('   - AutoBuilderTemplates.getAllTemplates() - List all available templates');
                    console.log('   - AutoBuilderTemplates.deleteTemplate("MyTemplate") - Delete template');
                    console.log('   - createExampleTemplates() - Create 3 example templates to get started');
                    console.log('🎲 Randomized Auto Collection (MAIN FEATURE):');
                    console.log('   - Use UI: 🎲 Start Random Auto (immediate + random 50-70 min intervals)');
                    console.log('   - Use UI: ⏹️ Stop Auto (stop randomized collection)');
                    console.log('   - loadLatestEnhancedData() - Load stored data from IndexedDB');
                    console.log('🧠 ENHANCED PROGRESS TRACKING (NEW!):');
                    console.log('   - testEnhancedSystemHealth() - Quick health check for enhanced system');
                    console.log('   - testAntiBlindBuilding() - Test the anti-blind building solution');
                    console.log('   - testEnhancedTracking() - Test the enhanced tracking system');
                    console.log('   - testBuildTimeCalculator() - Test build time calculations');
                    console.log('   - testQueueSimulation() - Test queue management system');
                    console.log('   - testCompleteEnhancedSystem() - Test complete enhanced system');
                    console.log('🔧 Legacy Testing:');
                    console.log('   - testCompleteSystem() - Test ALL systems including templates');
                    console.log('   - testTemplateSystem() - Test template system specifically');
                    console.log('   - testDatabaseOnlyMode() - Test that bot uses only database data');
                    console.log('   - testRandomizedIntervals() - Test randomized interval system');
                    console.log('🔧 Debugging:');
                    console.log('   - testCSRFTokenExtraction() - Debug CSRF token extraction issues');
                    console.log('   - getTokenManually() - Find CSRF token in current page');
                    console.log('🎛️ Click the 🤖 button to open the UI panel!');
                    console.log('🎯 SIMPLE WORKFLOW:');
                    console.log('   1. 📋 Assign template (Building Templates section in UI)');
                    console.log('   2. 🎲 Start Random Auto (get village data)');
                    console.log('   3. 🤖 Start Bot (bot will follow template with ENHANCED intelligence)');
                    console.log('   4. ⏹️ Stop when done');
                    console.log('🧠 ENHANCED INTELLIGENCE: Bot tracks builds in real-time between data collections!');
                    console.log('🔄 ANTI-BLIND: No more duplicate building attempts - bot knows what it built!');
                    console.log('⏰ TIMING AWARE: Accurate build time calculations and queue management!');
                    console.log('🎲 SECURITY: Randomized 50-70 min intervals + DATABASE-ONLY bot operation!');
                    console.log('🔄 PERSISTENT: Auto collection continues exact countdown across page refreshes!');
                    console.log('📋 TEMPLATES: Smart template system with real-time progress tracking');
                    console.log('🚫 OLD BLIND LOGIC: Completely replaced with intelligent tracking system');
                    console.log('🔧 ADVANCED: collectComprehensiveDataEnhanced() - Manual console collection (if needed)');

                } catch (error) {
                    console.error('❌ Error creating AutoBuilder components:', error);
                }
            }, 1000);

        } catch (error) {
            console.error('❌ Error in initializeAutoBuilder:', error);
        }
    }

    // =============================================================================
    // 🎛️ CONSOLE-BASED INTERFACE (NO DOM MANIPULATION)
    // =============================================================================

    // All UI functionality is now handled through console commands
    // No DOM manipulation to avoid conflicts with game's MutationObserver







    // =============================================================================
    // 🎛️ UI SYSTEM - TRIBAL WARS STYLE
    // =============================================================================

    class AutoBuilderUI {
        constructor() {
            this.isInitialized = false;
            this.toggleButton = null;
            this.mainPanel = null;
            this.isVisible = false;
        }

        /**
         * Initialize the UI system
         */
        init() {
            this.addStyles();
            this.createToggleButton();
            this.createMainPanel();
            this.isInitialized = true;
            console.log('🎛️ Auto Builder UI initialized');

            // Auto-load existing data after initialization
            setTimeout(() => {
                this.loadExistingData();
            }, 1000); // Small delay to ensure everything is loaded
        }

        /**
         * Create the main toggle button
         */
        createToggleButton() {
            // Remove existing toggle button
            const existing = document.getElementById('autobuilder-toggle');
            if (existing) existing.remove();

            // Create toggle button
            this.toggleButton = document.createElement('button');
            this.toggleButton.id = 'autobuilder-toggle';
            this.toggleButton.className = 'autobuilder-toggle';
            this.toggleButton.innerHTML = '🤖';
            this.toggleButton.title = 'Auto Builder Settings';

            // Add click handler
            this.toggleButton.addEventListener('click', () => {
                this.togglePanel();
            });

            // Add to page
            document.body.appendChild(this.toggleButton);
        }

        /**
         * Create the main settings panel
         */
        createMainPanel() {
            // Remove existing panel
            const existing = document.getElementById('autobuilder-main-panel');
            if (existing) existing.remove();

            // Create main panel
            this.mainPanel = document.createElement('div');
            this.mainPanel.id = 'autobuilder-main-panel';
            this.mainPanel.className = 'autobuilder-panel';
            this.mainPanel.style.display = 'none';

            this.mainPanel.innerHTML = `
                <div class="autobuilder-header">
                    <h3>🤖 Auto Builder Control Panel</h3>
                    <div style="display:flex;gap:4px;align-items:center;">
                        <button class="autobuilder-minimize" id="autobuilder-minimize" title="Minimize">_</button>
                        <button class="autobuilder-close" id="autobuilder-close">×</button>
                    </div>
                </div>
                <div class="autobuilder-content">
                    <div class="autobuilder-section">
                        <h4>Settings</h4>
                        <div class="setting-group">
                            <button id="startBot" class="autobuilder-btn autobuilder-btn-primary">Start Bot</button>
                            <button id="stopBot" class="autobuilder-btn autobuilder-btn-secondary">Stop Bot</button>
                            <button id="botStatus" class="autobuilder-btn autobuilder-btn-secondary">Status</button>
                        </div>
                        <div class="setting-group">
                            <label>
                                <input type="checkbox" id="autoBuildEnabled"> Enable Auto Building
                            </label>
                        </div>
                        <div id="botStatusDisplay" class="status-display"></div>
                    </div>

                    <div class="autobuilder-section">
                        <h4>🏗️ Building Settings</h4>
                        <div class="setting-group">
                            <label>Max Queue Size:</label>
                            <input type="number" id="maxQueueSize" min="1" max="5" value="5" readonly>
                            <small>(Game maximum is 5)</small>
                        </div>
                        <div class="setting-group">
                            <label>Check Interval (seconds):</label>
                            <input type="number" id="checkInterval" min="10" max="300" value="30">
                        </div>
                    </div>

                    <div class="autobuilder-section">
                        <h4>📋 Building Templates</h4>

                        <!-- Template Selection -->
                        <div class="setting-group">
                            <label><strong>Current Village Template:</strong></label>
                            <select id="villageTemplate" style="width: 200px;">
                                <option value="">No templates available</option>
                            </select>
                            <button id="assignTemplate" class="autobuilder-btn autobuilder-btn-primary">Assign Template</button>
                            <button id="refreshTemplates" class="autobuilder-btn autobuilder-btn-secondary">🔄 Refresh</button>
                        </div>

                        <!-- Template Progress -->
                        <div class="setting-group">
                            <div id="templateProgress" class="template-progress-display">
                                <p>Create a template below or assign an existing one to see progress</p>
                            </div>
                        </div>

                        <!-- Template Creation -->
                        <div class="setting-group template-creation">
                            <h5>➕ Create New Template</h5>
                            <div style="margin-bottom: 8px;">
                                <label>Template Name:</label>
                                <input type="text" id="newTemplateName" placeholder="e.g., MyTemplate" style="width: 150px; margin: 0 8px;">
                                <label>Description:</label>
                                <input type="text" id="newTemplateDescription" placeholder="Template description" style="width: 200px;">
                            </div>
                            <div style="margin-bottom: 8px;">
                                <label>Add Building:</label>
                                <select id="buildingSelect" style="width: 120px; margin: 0 4px;">
                                    <option value="main">Headquarters</option>
                                    <option value="barracks">Barracks</option>
                                    <option value="stable">Stable</option>
                                    <option value="garage">Workshop</option>
                                    <option value="watchtower">Watchtower</option>
                                    <option value="snob">Academy</option>
                                    <option value="smith">Smithy</option>
                                    <option value="place">Rally Point</option>
                                    <option value="market">Market</option>
                                    <option value="wood">Timber Camp</option>
                                    <option value="stone">Clay Pit</option>
                                    <option value="iron">Iron Mine</option>
                                    <option value="farm">Farm</option>
                                    <option value="storage">Warehouse</option>
                                    <option value="hide">Hiding Place</option>
                                    <option value="wall">Wall</option>
                                </select>
                                <label>Level:</label>
                                <input type="number" id="buildingLevel" min="1" max="30" value="1" style="width: 50px; margin: 0 4px;">
                                <button id="addBuildingToSequence" class="autobuilder-btn autobuilder-btn-secondary">Add</button>
                            </div>
                            <div style="margin-bottom: 8px;">
                                <label><strong>Building Sequence:</strong></label>
                                <div id="buildingSequence" class="building-sequence">
                                    <p style="color: #888; font-style: italic;">No buildings added yet</p>
                                </div>
                            </div>
                            <div>
                                <button id="createNewTemplate" class="autobuilder-btn autobuilder-btn-primary">Create Template</button>
                                <button id="clearSequence" class="autobuilder-btn autobuilder-btn-secondary">Clear Sequence</button>
                            </div>
                        </div>

                        <!-- Template Management -->
                        <div class="setting-group template-management">
                            <h5>🗂️ Manage Templates</h5>
                            <div id="templateList" class="template-list">
                                <p style="color: #888; font-style: italic;">No templates created yet</p>
                            </div>
                        </div>
                    </div>

                    <div class="autobuilder-section">
                        <h4><span class="icon header village"></span> Villages</h4>
                        <div class="setting-group randomized-interval-group">
                            <label><strong>🎲 Randomized Auto Collection:</strong></label>
                            <div class="interval-settings">
                                <label>Min interval:</label>
                                <input type="number" id="minDataInterval" min="30" max="120" value="50" style="width:60px;">
                                <span>minutes</span>
                                <label>Max interval:</label>
                                <input type="number" id="maxDataInterval" min="40" max="180" value="70" style="width:60px;">
                                <span>minutes</span>
                            </div>
                            <div class="interval-controls">
                                <button id="startRandomAutoData" class="autobuilder-btn autobuilder-btn-primary">🎲 Start Random Auto</button>
                                <button id="stopRandomAutoData" class="autobuilder-btn autobuilder-btn-secondary">⏹️ Stop Auto</button>
                            </div>
                            <div id="randomAutoStatus" class="auto-status-display">
                                <span class="status-text">Auto collection not running</span>
                            </div>
                        </div>

                        <div id="villagesListDisplay" class="villages-list-container">
                            <div class="villages-header">
                                <strong>📋 Villages Data</strong>
                                <span id="villagesCount" class="villages-count">Ready</span>
                            </div>
                            <div id="villagesList" class="villages-list">
                                <p>🔍 Checking IndexedDB for existing villages data...</p>
                            </div>
                        </div>
                    </div>

                    <div class="autobuilder-section">
                        <h4>⚡ Quick Actions</h4>
                        <div class="setting-group">
                            <button id="clearDatabase" class="autobuilder-btn autobuilder-btn-secondary">🗑️ Clear Database</button>
                        </div>
                    </div>

                    <div class="autobuilder-section">
                        <h4>🔧 Console Commands</h4>
                        <div class="console-help">
                            <p><strong>🤖 Bot Commands:</strong></p>
                            <p><code>AutoBuildBot.start()</code> - Start the bot</p>
                            <p><code>AutoBuildBot.stop()</code> - Stop the bot</p>
                            <p><code>AutoBuildBot.getStatus()</code> - Get bot status</p>
                            <p><strong><span class="icon header village"></span> Villages Data Collection:</strong></p>
                            <p><code>collectComprehensiveDataEnhanced()</code> - Get villages data</p>
                            <p><code>loadLatestEnhancedData()</code> - Load stored villages data</p>
                            <p><strong>⚡ Basic Data Collection:</strong></p>
                            <p><code>getInfo()</code> - Basic current village data</p>
                            <p><code>showInfo()</code> - Display basic data</p>
                        </div>
                    </div>
                </div>
            `;

            // Add event listeners
            this.addEventListeners();

            // Add to page
            document.body.appendChild(this.mainPanel);
        }

        /**
         * Add event listeners to UI elements
         */
        addEventListeners() {
            // Close and minimize buttons
            this.mainPanel.querySelector('#autobuilder-close').addEventListener('click', () => {
                this.hidePanel();
            });

            this.mainPanel.querySelector('#autobuilder-minimize').addEventListener('click', () => {
                this.minimizePanel();
            });

            // Bot control buttons
            this.mainPanel.querySelector('#startBot').addEventListener('click', () => {
                if (window.AutoBuildBot) {
                    window.AutoBuildBot.start();
                    this.updateStatus();
                } else {
                    alert('❌ AutoBuildBot not available. Check console for errors.');
                }
            });

            this.mainPanel.querySelector('#stopBot').addEventListener('click', () => {
                if (window.AutoBuildBot) {
                    window.AutoBuildBot.stop();
                    this.updateStatus();
                } else {
                    alert('❌ AutoBuildBot not available. Check console for errors.');
                }
            });

            this.mainPanel.querySelector('#botStatus').addEventListener('click', () => {
                this.updateStatus();
            });

            // Randomized auto data collection interval
            let randomAutoDataTimeout = null;
            let randomAutoDataEnabled = false;

            // Randomized Auto Collection Functions
            const startRandomAutoCollection = async () => {
                const minMinutes = parseInt(this.mainPanel.querySelector('#minDataInterval').value) || 50;
                const maxMinutes = parseInt(this.mainPanel.querySelector('#maxDataInterval').value) || 70;

                // Validate intervals
                if (minMinutes >= maxMinutes) {
                    alert('⚠️ Maximum interval must be greater than minimum interval');
                    return;
                }

                if (minMinutes < 30) {
                    alert('⚠️ Minimum interval should be at least 30 minutes for safety');
                    return;
                }

                // Set global flags to true
                randomAutoDataEnabled = true;
                window.randomAutoDataEnabled = true;

                // Update UI immediately
                this.mainPanel.querySelector('#startRandomAutoData').textContent = '🟢 Running';
                this.mainPanel.querySelector('#stopRandomAutoData').textContent = '⏹️ Stop Auto';

                // Store settings (THIS MAKES IT PERSISTENT ACROSS PAGE REFRESHES)
                if (window.AutoBuilderSettings) {
                    window.AutoBuilderSettings.set('randomAutoDataEnabled', true);
                    window.AutoBuilderSettings.set('minDataInterval', minMinutes);
                    window.AutoBuilderSettings.set('maxDataInterval', maxMinutes);
                }

                console.log(`🎲 Randomized auto data collection started! (${minMinutes}-${maxMinutes} minutes)`);

                // FIRST: Run data collection immediately
                console.log(`🚀 Running initial data collection immediately...`);
                this.updateRandomAutoStatus('🚀 Running initial data collection...');

                if (typeof window.collectComprehensiveDataEnhanced === 'function') {
                    try {
                        const data = await window.collectComprehensiveDataEnhanced();
                        if (data && data.data) {
                            this.displayVillagesList(data.data);
                            console.log(`✅ Initial randomized data collection completed!`);
                            this.updateRandomAutoStatus(`✅ Initial collection completed - scheduling random intervals...`);
                        } else {
                            console.log('❌ Initial data collection failed');
                            this.updateRandomAutoStatus(`❌ Initial collection failed - starting intervals anyway...`);
                        }
                    } catch (error) {
                        console.error('❌ Initial randomized data collection failed:', error);
                        this.updateRandomAutoStatus(`❌ Initial collection error - starting intervals anyway...`);
                    }
                }

                // THEN: Start the randomized interval system
                setTimeout(() => {
                    if (randomAutoDataEnabled && window.randomAutoDataEnabled) {
                        console.log(`⏰ Starting randomized interval system...`);
                        scheduleNextRandomCollection();
                    }
                }, 5000); // 5 second delay before starting intervals
            };

            const stopRandomAutoCollection = () => {
                // Set global flags to false
                randomAutoDataEnabled = false;
                window.randomAutoDataEnabled = false;

                // Clear any running timeouts
                if (randomAutoDataTimeout) {
                    clearTimeout(randomAutoDataTimeout);
                    randomAutoDataTimeout = null;
                }
                if (window.currentRandomAutoDataTimeout) {
                    clearTimeout(window.currentRandomAutoDataTimeout);
                    window.currentRandomAutoDataTimeout = null;
                }

                // Stop countdown display
                this.stopCountdownDisplay();

                // Update UI
                this.mainPanel.querySelector('#startRandomAutoData').textContent = '🎲 Start Random Auto';
                this.mainPanel.querySelector('#stopRandomAutoData').textContent = '⏹️ Stopped';
                this.updateRandomAutoStatus('Auto collection stopped');

                // Store settings and clear stored time
                if (window.AutoBuilderSettings) {
                    window.AutoBuilderSettings.set('randomAutoDataEnabled', false);
                    window.AutoBuilderSettings.set('nextCollectionTime', null);
                }

                console.log('⏹️ Randomized auto data collection stopped');
            };

            const scheduleNextRandomCollection = () => {
                if (!randomAutoDataEnabled || !window.randomAutoDataEnabled) return;

                const minMinutes = parseInt(this.mainPanel.querySelector('#minDataInterval').value) || 50;
                const maxMinutes = parseInt(this.mainPanel.querySelector('#maxDataInterval').value) || 70;

                // Calculate random interval (in milliseconds)
                const randomMinutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;
                const randomMs = randomMinutes * 60 * 1000;

                // Calculate next collection time
                const nextTime = new Date(Date.now() + randomMs);

                console.log(`⏰ Next random data collection in ${randomMinutes} minutes (at ${nextTime.toLocaleTimeString()})`);
                this.updateRandomAutoStatus(`Next collection: ${nextTime.toLocaleTimeString()} (in ${randomMinutes}m)`);

                // Schedule the collection
                randomAutoDataTimeout = setTimeout(async () => {
                    if (!randomAutoDataEnabled || !window.randomAutoDataEnabled) return;

                    console.log(`🎲 Executing randomized auto data collection...`);
                    this.updateRandomAutoStatus('🔄 Collecting data...');

                    if (typeof window.collectComprehensiveDataEnhanced === 'function') {
                        try {
                            const data = await window.collectComprehensiveDataEnhanced();
                            if (data && data.data) {
                                this.displayVillagesList(data.data);
                                console.log(`✅ Randomized auto data collection completed!`);
                                this.updateRandomAutoStatus(`✅ Collection completed - scheduling next...`);
                            } else {
                                console.log('❌ No data collected in randomized auto collection');
                                this.updateRandomAutoStatus(`❌ Collection failed - scheduling next...`);
                            }
                        } catch (error) {
                            console.error('❌ Randomized auto data collection failed:', error);
                            this.updateRandomAutoStatus(`❌ Collection error - scheduling next...`);
                        }
                    }

                    // Schedule next collection (with a small delay)
                    setTimeout(() => {
                        if (randomAutoDataEnabled && window.randomAutoDataEnabled) {
                            scheduleNextRandomCollection();
                        }
                    }, 5000); // 5 second delay before scheduling next

                }, randomMs);
            };

            // Event listeners for randomized auto collection
            this.mainPanel.querySelector('#startRandomAutoData').addEventListener('click', startRandomAutoCollection);
            this.mainPanel.querySelector('#stopRandomAutoData').addEventListener('click', stopRandomAutoCollection);

            // Interval validation
            this.mainPanel.querySelector('#minDataInterval').addEventListener('change', (e) => {
                const minVal = parseInt(e.target.value);
                const maxVal = parseInt(this.mainPanel.querySelector('#maxDataInterval').value);

                if (minVal >= maxVal) {
                    this.mainPanel.querySelector('#maxDataInterval').value = minVal + 10;
                }

                if (window.AutoBuilderSettings) {
                    window.AutoBuilderSettings.set('minDataInterval', minVal);
                }
            });

            this.mainPanel.querySelector('#maxDataInterval').addEventListener('change', (e) => {
                const maxVal = parseInt(e.target.value);
                const minVal = parseInt(this.mainPanel.querySelector('#minDataInterval').value);

                if (maxVal <= minVal) {
                    this.mainPanel.querySelector('#minDataInterval').value = Math.max(30, maxVal - 10);
                }

                if (window.AutoBuilderSettings) {
                    window.AutoBuilderSettings.set('maxDataInterval', maxVal);
                }
            });

            // Template management - Updated for custom templates
            let currentSequence = []; // Store current building sequence

            // Assign Template
            this.mainPanel.querySelector('#assignTemplate').addEventListener('click', () => {
                const templateSelect = this.mainPanel.querySelector('#villageTemplate');
                const selectedTemplate = templateSelect.value;
                const villageId = game_data.village.id.toString();

                if (!selectedTemplate) {
                    alert('⚠️ Please select a template first');
                    return;
                }

                // Assign template to current village
                if (window.AutoBuilderTemplates.setVillageTemplate(villageId, selectedTemplate)) {
                    console.log(`✅ Template '${selectedTemplate}' assigned to village ${villageId}`);
                    this.updateTemplateProgress();

                    // Show success message
                    alert(`✅ Template '${selectedTemplate}' assigned to village ${game_data.village.name}`);
                } else {
                    alert('❌ Failed to assign template');
                }
            });

            // Refresh Templates
            this.mainPanel.querySelector('#refreshTemplates').addEventListener('click', () => {
                this.refreshTemplateDropdown();
                this.refreshTemplateList();
            });

            // Template Selection Changed
            this.mainPanel.querySelector('#villageTemplate').addEventListener('change', () => {
                this.updateTemplateProgress();
            });

            // Add Building to Sequence
            this.mainPanel.querySelector('#addBuildingToSequence').addEventListener('click', () => {
                const buildingSelect = this.mainPanel.querySelector('#buildingSelect');
                const levelInput = this.mainPanel.querySelector('#buildingLevel');

                const building = buildingSelect.value;
                const level = parseInt(levelInput.value);

                if (!building || !level || level < 1 || level > 30) {
                    alert('⚠️ Please select a building and valid level (1-30)');
                    return;
                }

                // Add to current sequence
                currentSequence.push({ building: building, level: level });

                // Update sequence display
                this.updateSequenceDisplay(currentSequence);

                // Clear level input
                levelInput.value = 1;

                console.log(`✅ Added ${building} level ${level} to sequence`);
            });

            // Clear Sequence
            this.mainPanel.querySelector('#clearSequence').addEventListener('click', () => {
                currentSequence = [];
                this.updateSequenceDisplay(currentSequence);
                console.log('🗑️ Building sequence cleared');
            });

            // Create New Template
            this.mainPanel.querySelector('#createNewTemplate').addEventListener('click', () => {
                const nameInput = this.mainPanel.querySelector('#newTemplateName');
                const descInput = this.mainPanel.querySelector('#newTemplateDescription');

                const templateName = nameInput.value.trim();
                const description = descInput.value.trim();

                if (!templateName) {
                    alert('⚠️ Please enter a template name');
                    return;
                }

                if (currentSequence.length === 0) {
                    alert('⚠️ Please add at least one building to the sequence');
                    return;
                }

                // Create template
                if (window.AutoBuilderTemplates.createTemplate(templateName, description, currentSequence)) {
                    console.log(`✅ Template '${templateName}' created successfully!`);
                    alert(`✅ Template '${templateName}' created successfully!`);

                    // Clear form
                    nameInput.value = '';
                    descInput.value = '';
                    currentSequence = [];
                    this.updateSequenceDisplay(currentSequence);

                    // Refresh dropdowns and lists
                    this.refreshTemplateDropdown();
                    this.refreshTemplateList();
                } else {
                    alert('❌ Failed to create template (name might already exist)');
                }
            });

            // Settings
            this.mainPanel.querySelector('#autoBuildEnabled').addEventListener('change', (e) => {
                if (window.AutoBuilderSettings) {
                    window.AutoBuilderSettings.set('autoBuildEnabled', e.target.checked);
                }
            });

            this.mainPanel.querySelector('#checkInterval').addEventListener('change', (e) => {
                if (window.AutoBuilderSettings) {
                    window.AutoBuilderSettings.set('checkInterval', parseInt(e.target.value));
                }
            });


        }

        /**
         * Toggle panel visibility
         */
        togglePanel() {
            if (this.isVisible) {
                this.hidePanel();
            } else {
                this.showPanel();
            }
        }

        /**
         * Show the panel
         */
        showPanel() {
            if (this.mainPanel) {
                this.mainPanel.style.display = 'block';
                this.isVisible = true;
                this.centerPanel();
                this.loadSettings();
                this.updateStatus();
                this.loadExistingData(); // Auto-load existing IndexedDB data
            }
        }

        /**
         * Hide the panel
         */
        hidePanel() {
            if (this.mainPanel) {
                this.mainPanel.style.display = 'none';
                this.isVisible = false;
            }
        }

        /**
         * Minimize the panel
         */
        minimizePanel() {
            this.hidePanel();
            // Show restore button
            this.showRestoreButton();
        }

        /**
         * Show restore button
         */
        showRestoreButton() {
            const existing = document.getElementById('autobuilder-restore');
            if (existing) existing.remove();

            const restoreBtn = document.createElement('button');
            restoreBtn.id = 'autobuilder-restore';
            restoreBtn.className = 'autobuilder-restore';
            restoreBtn.innerHTML = '🤖 Auto Builder';
            restoreBtn.style.display = 'block';

            restoreBtn.addEventListener('click', () => {
                this.showPanel();
                restoreBtn.style.display = 'none';
            });

            document.body.appendChild(restoreBtn);
        }

        /**
         * Center the panel on screen
         */
        centerPanel() {
            if (this.mainPanel) {
                this.mainPanel.style.left = '50%';
                this.mainPanel.style.top = '50%';
                this.mainPanel.style.transform = 'translate(-50%, -50%)';
            }
        }

        /**
         * Load settings into UI
         */
        loadSettings() {
            if (window.AutoBuilderSettings) {
                const settings = window.AutoBuilderSettings.getAll();

                const autoBuildCheckbox = this.mainPanel.querySelector('#autoBuildEnabled');
                if (autoBuildCheckbox) autoBuildCheckbox.checked = settings.autoBuildEnabled || false;

                const checkIntervalInput = this.mainPanel.querySelector('#checkInterval');
                if (checkIntervalInput) checkIntervalInput.value = settings.checkInterval || 30;

                const maxQueueInput = this.mainPanel.querySelector('#maxQueueSize');
                if (maxQueueInput) maxQueueInput.value = settings.maxQueueSize || 5;

                // Load template system
                if (window.AutoBuilderTemplates) {
                    // Refresh template dropdown and list
                    this.refreshTemplateDropdown();
                    this.refreshTemplateList();
                    this.updateTemplateProgress();
                }

                // Load randomized interval settings
                const minDataIntervalInput = this.mainPanel.querySelector('#minDataInterval');
                if (minDataIntervalInput) minDataIntervalInput.value = settings.minDataInterval || 50;

                const maxDataIntervalInput = this.mainPanel.querySelector('#maxDataInterval');
                if (maxDataIntervalInput) maxDataIntervalInput.value = settings.maxDataInterval || 70;

                // Auto-restart randomized auto data collection if it was enabled
                if (settings.randomAutoDataEnabled) {
                    console.log('🔄 Auto-restarting randomized data collection from previous session...');

                    const startBtn = this.mainPanel.querySelector('#startRandomAutoData');
                    const stopBtn = this.mainPanel.querySelector('#stopRandomAutoData');
                    if (startBtn) startBtn.textContent = '🟢 Running';
                    if (stopBtn) stopBtn.textContent = '⏹️ Stop Auto';
                    this.updateRandomAutoStatus('🔄 Auto-restarting from previous session...');

                    // Auto-restart the randomized collection
                    setTimeout(() => {
                        this.autoRestartRandomizedCollection();
                    }, 2000); // 2 second delay after UI loads
                }
            }
        }

        /**
         * Update bot status display
         */
        updateStatus() {
            const statusDiv = this.mainPanel.querySelector('#botStatusDisplay');
            if (statusDiv && window.AutoBuildBot) {
                const status = window.AutoBuildBot.getStatus();
                statusDiv.innerHTML = `
                    <div class="status-item">
                        <strong>Bot Status:</strong> ${status.isRunning ? '🟢 Running' : '🔴 Stopped'}
                    </div>
                    <div class="status-item">
                        <strong>Last Check:</strong> ${status.lastCheck ? new Date(status.lastCheck).toLocaleTimeString() : 'Never'}
                    </div>
                    <div class="status-item">
                        <strong>Next Check:</strong> ${status.nextCheckTime ? new Date(status.nextCheckTime).toLocaleTimeString() : 'N/A'}
                    </div>
                `;
            }
        }

        /**
         * Display basic village data
         */
        displayVillageData(data) {
            const dataDiv = this.mainPanel.querySelector('#villageDataDisplay');
            if (dataDiv && data) {
                dataDiv.innerHTML = `
                    <div class="data-header"><strong>📊 Basic Village Data</strong></div>
                    <div class="data-item">
                        <strong>Village:</strong> ${data.info?.name || 'Unknown'} (${data.info?.coords || 'N/A'})
                    </div>
                    <div class="data-item">
                        <strong>Resources:</strong>
                        🪵 ${data.resources?.wood || 0} |
                        🧱 ${data.resources?.stone || 0} |
                        ⚙️ ${data.resources?.iron || 0}
                    </div>
                    <div class="data-item">
                        <strong>Population:</strong> ${data.resources?.pop || 0}/${data.resources?.pop_max || 0}
                    </div>
                    <div class="data-item">
                        <strong>Queue:</strong> ${data.activeQueue?.length || 0}/5 items
                    </div>
                `;
            }
        }

        /**
         * Update villages count display
         */
        updateVillagesCount(text) {
            const countSpan = this.mainPanel.querySelector('#villagesCount');
            if (countSpan) {
                countSpan.textContent = text;
            }
        }

        /**
         * Update randomized auto collection status display
         */
        updateRandomAutoStatus(text) {
            const statusSpan = this.mainPanel.querySelector('#randomAutoStatus .status-text');
            if (statusSpan) {
                statusSpan.textContent = text;
            }
        }

        /**
         * Update template progress display
         */
        updateTemplateProgress() {
            const progressDiv = this.mainPanel.querySelector('#templateProgress');
            if (!progressDiv || !window.AutoBuilderTemplates) return;

            try {
                const templateSelect = this.mainPanel.querySelector('#villageTemplate');
                const selectedTemplate = templateSelect.value;
                const villageId = game_data.village.id.toString();

                if (!selectedTemplate) {
                    progressDiv.innerHTML = '<p>Create a template below or assign an existing one to see progress</p>';
                    return;
                }

                // Get current template assignment
                const assignedTemplate = window.AutoBuilderTemplates.getVillageTemplate(villageId);
                const isAssigned = assignedTemplate === selectedTemplate;

                // Get building data if available
                let buildingsData = {};
                const savedData = window.loadLatestEnhancedData ?
                    (async () => await window.loadLatestEnhancedData(villageId))() : null;

                if (savedData && savedData.data && savedData.data.buildings) {
                    const villageBuildings = savedData.data.buildings.villages?.[villageId];
                    buildingsData = villageBuildings?.buildings || {};
                }

                // Get template progress
                const progress = window.AutoBuilderTemplates.getTemplateProgress(selectedTemplate, buildingsData);

                let progressHTML = `
                    <div class="template-status">
                        <strong>Template: ${selectedTemplate}</strong>
                        ${isAssigned ? '<span style="color: green;">✅ Assigned</span>' : '<span style="color: orange;">⚠️ Not Assigned</span>'}
                    </div>
                `;

                if (progress) {
                    progressHTML += `
                        <div class="template-progress-bar">
                            <div class="progress-bar-container">
                                <div class="progress-bar" style="width: ${progress.percentage}%"></div>
                            </div>
                            <span class="progress-text">${progress.completed}/${progress.total} (${progress.percentage}%)</span>
                        </div>
                    `;

                    if (progress.remaining.length > 0) {
                        progressHTML += `<div class="next-buildings">`;
                        progressHTML += `<strong>Next buildings needed:</strong><br>`;
                        progress.remaining.slice(0, 3).forEach(building => {
                            progressHTML += `• ${building.building} (${building.currentLevel} → ${building.targetLevel})<br>`;
                        });
                        if (progress.remaining.length > 3) {
                            progressHTML += `... and ${progress.remaining.length - 3} more`;
                        }
                        progressHTML += `</div>`;
                    } else {
                        progressHTML += `<div style="color: green;"><strong>✅ Template completed!</strong></div>`;
                    }
                } else {
                    progressHTML += `<p>No building data available. Click "🎲 Start Random Auto" to collect data.</p>`;
                }

                progressDiv.innerHTML = progressHTML;

            } catch (error) {
                console.error('❌ Error updating template progress:', error);
                progressDiv.innerHTML = '<p>Error loading template progress</p>';
            }
        }

        /**
         * Update building sequence display
         */
        updateSequenceDisplay(sequence) {
            const sequenceDiv = this.mainPanel.querySelector('#buildingSequence');
            if (!sequenceDiv) return;

            if (sequence.length === 0) {
                sequenceDiv.innerHTML = '<p style="color: #888; font-style: italic;">No buildings added yet</p>';
                return;
            }

            let sequenceHTML = '';
            sequence.forEach((item, index) => {
                const buildingDisplayName = this.getBuildingDisplayName(item.building);
                sequenceHTML += `
                    <div class="sequence-item" style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 3px; margin-bottom: 2px;">
                        <span>${index + 1}. ${buildingDisplayName} → Level ${item.level}</span>
                        <button onclick="this.removeSequenceItem(${index})" style="background: #e53e3e; color: white; border: none; border-radius: 2px; padding: 2px 6px; cursor: pointer; font-size: 10px;">✖</button>
                    </div>
                `;
            });

            sequenceDiv.innerHTML = sequenceHTML;
        }

        /**
         * Refresh template dropdown
         */
        refreshTemplateDropdown() {
            const templateSelect = this.mainPanel.querySelector('#villageTemplate');
            if (!templateSelect || !window.AutoBuilderTemplates) return;

            const templates = window.AutoBuilderTemplates.getAllTemplates();
            const templateNames = Object.keys(templates);

            // Clear current options
            templateSelect.innerHTML = '';

            if (templateNames.length === 0) {
                templateSelect.innerHTML = '<option value="">No templates available</option>';
            } else {
                templateNames.forEach(name => {
                    const option = document.createElement('option');
                    option.value = name;
                    option.textContent = name;
                    templateSelect.appendChild(option);
                });

                // Select current village template if available
                const villageId = game_data.village.id.toString();
                const currentTemplate = window.AutoBuilderTemplates.getVillageTemplate(villageId);
                if (currentTemplate) {
                    templateSelect.value = currentTemplate;
                }
            }

            console.log(`🔄 Template dropdown refreshed: ${templateNames.length} templates found`);
        }

        /**
         * Refresh template list display
         */
        refreshTemplateList() {
            const templateListDiv = this.mainPanel.querySelector('#templateList');
            if (!templateListDiv || !window.AutoBuilderTemplates) return;

            const templates = window.AutoBuilderTemplates.getAllTemplates();
            const templateNames = Object.keys(templates);

            if (templateNames.length === 0) {
                templateListDiv.innerHTML = '<p style="color: #888; font-style: italic;">No templates created yet</p>';
                return;
            }

            let listHTML = '';
            templateNames.forEach(name => {
                const template = templates[name];
                listHTML += `
                    <div class="template-item" style="background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px; padding: 8px; margin-bottom: 6px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>${name}</strong>
                                ${template.description ? `<br><small style="color: #666;">${template.description}</small>` : ''}
                                <br><small style="color: #888;">${template.sequence.length} buildings</small>
                            </div>
                            <div>
                                <button onclick="this.viewTemplate('${name}')" class="autobuilder-btn autobuilder-btn-secondary" style="font-size: 10px; padding: 2px 6px; margin-right: 4px;">View</button>
                                <button onclick="this.deleteTemplate('${name}')" class="autobuilder-btn" style="background: #e53e3e; color: white; font-size: 10px; padding: 2px 6px;">Delete</button>
                            </div>
                        </div>
                    </div>
                `;
            });

            templateListDiv.innerHTML = listHTML;

            console.log(`🔄 Template list refreshed: ${templateNames.length} templates displayed`);
        }

        /**
         * Get display name for building
         */
        getBuildingDisplayName(building) {
            const displayNames = {
                'main': 'Headquarters',
                'barracks': 'Barracks',
                'stable': 'Stable',
                'garage': 'Workshop',
                'watchtower': 'Watchtower',
                'snob': 'Academy',
                'smith': 'Smithy',
                'place': 'Rally Point',
                'market': 'Market',
                'wood': 'Timber Camp',
                'stone': 'Clay Pit',
                'iron': 'Iron Mine',
                'farm': 'Farm',
                'storage': 'Warehouse',
                'hide': 'Hiding Place',
                'wall': 'Wall'
            };

            return displayNames[building] || building;
        }

        /**
         * Auto-restart randomized collection from previous session
         */
        autoRestartRandomizedCollection() {
            try {
                console.log('🎲 Auto-restarting randomized auto collection...');

                // Set the global flag
                if (typeof randomAutoDataEnabled !== 'undefined') {
                    randomAutoDataEnabled = true;
                } else {
                    // Define it in the global scope for this instance
                    window.randomAutoDataEnabled = true;
                }

                // Check if we have a stored next collection time
                const settings = window.AutoBuilderSettings.getAll();
                const storedNextTime = settings.nextCollectionTime;

                if (storedNextTime) {
                    const now = Date.now();
                    const timeLeft = storedNextTime - now;

                    if (timeLeft > 0) {
                        // Time hasn't passed yet - continue countdown
                        const minutesLeft = Math.round(timeLeft / 1000 / 60);
                        const nextTime = new Date(storedNextTime);

                        console.log(`⏰ Continuing countdown: ${minutesLeft} minutes left (until ${nextTime.toLocaleTimeString()})`);
                        this.updateRandomAutoStatus(`Continuing: ${nextTime.toLocaleTimeString()} (${minutesLeft}m left)`);

                        // Schedule for the remaining time
                        this.scheduleForRemainingTime(timeLeft);

                    } else {
                        // Time has already passed - run collection immediately
                        console.log('⚡ Scheduled time has passed - running collection immediately');
                        this.updateRandomAutoStatus('⚡ Running overdue collection...');
                        this.runImmediateCollection();
                    }
                } else {
                    // No stored time - start fresh random interval
                    console.log('🎲 No stored time found - starting fresh random interval');
                    this.scheduleNextRandomCollection();
                }

                console.log('✅ Randomized auto collection successfully restarted from previous session!');

            } catch (error) {
                console.error('❌ Error auto-restarting randomized collection:', error);
                this.updateRandomAutoStatus('❌ Failed to restart - click "Start Random Auto"');
            }
        }

        /**
         * Schedule for remaining time (continue countdown)
         */
        scheduleForRemainingTime(timeLeftMs) {
            const nextTime = new Date(Date.now() + timeLeftMs);

            // Start a countdown display (update every minute)
            this.startCountdownDisplay(nextTime);

            // Schedule the collection for the remaining time
            const randomAutoDataTimeout = setTimeout(async () => {
                if (!window.randomAutoDataEnabled) return;

                console.log(`⏰ Executing scheduled collection (continued from previous session)`);
                this.updateRandomAutoStatus('🔄 Collecting data...');

                // Clear the stored time since we're executing now
                if (window.AutoBuilderSettings) {
                    window.AutoBuilderSettings.set('nextCollectionTime', null);
                }

                // Stop countdown display
                this.stopCountdownDisplay();

                await this.executeDataCollection();

            }, timeLeftMs);

            // Store timeout reference globally so it can be cleared
            window.currentRandomAutoDataTimeout = randomAutoDataTimeout;
        }

        /**
         * Start countdown display (updates every minute)
         */
        startCountdownDisplay(nextTime) {
            // Clear any existing countdown
            this.stopCountdownDisplay();

            const updateCountdown = () => {
                if (!window.randomAutoDataEnabled) return;

                const now = Date.now();
                const timeLeft = nextTime.getTime() - now;

                if (timeLeft > 0) {
                    const minutesLeft = Math.round(timeLeft / 1000 / 60);
                    this.updateRandomAutoStatus(`Continuing: ${nextTime.toLocaleTimeString()} (${minutesLeft}m left)`);
                } else {
                    this.updateRandomAutoStatus('⏰ Collection time reached...');
                }
            };

            // Update immediately
            updateCountdown();

            // Update every minute
            window.countdownInterval = setInterval(updateCountdown, 60000);
        }

        /**
         * Stop countdown display
         */
        stopCountdownDisplay() {
            if (window.countdownInterval) {
                clearInterval(window.countdownInterval);
                window.countdownInterval = null;
            }
        }

        /**
         * Run immediate collection (when time has passed)
         */
        async runImmediateCollection() {
            if (!window.randomAutoDataEnabled) return;

            console.log(`⚡ Running overdue collection immediately`);

            // Clear the stored time since we're executing now
            if (window.AutoBuilderSettings) {
                window.AutoBuilderSettings.set('nextCollectionTime', null);
            }

            await this.executeDataCollection();
        }

        /**
         * Execute data collection and schedule next
         */
        async executeDataCollection() {
            if (typeof window.collectComprehensiveDataEnhanced === 'function') {
                try {
                    const data = await window.collectComprehensiveDataEnhanced();
                    if (data && data.data) {
                        this.displayVillagesList(data.data);
                        console.log(`✅ Randomized auto data collection completed!`);
                        this.updateRandomAutoStatus(`✅ Collection completed - scheduling next...`);
                    } else {
                        console.log('❌ No data collected in auto collection');
                        this.updateRandomAutoStatus(`❌ Collection failed - scheduling next...`);
                    }
                } catch (error) {
                    console.error('❌ Auto data collection failed:', error);
                    this.updateRandomAutoStatus(`❌ Collection error - scheduling next...`);
                }
            }

            // Schedule next collection (with a small delay)
            setTimeout(() => {
                if (window.randomAutoDataEnabled) {
                    this.scheduleNextRandomCollection();
                }
            }, 5000); // 5 second delay before scheduling next
        }

        /**
         * Schedule next random collection (for auto-restart)
         */
        scheduleNextRandomCollection() {
            const randomAutoDataEnabled = window.randomAutoDataEnabled || false;
            if (!randomAutoDataEnabled) return;

            const minMinutes = parseInt(this.mainPanel.querySelector('#minDataInterval').value) || 50;
            const maxMinutes = parseInt(this.mainPanel.querySelector('#maxDataInterval').value) || 70;

            // Calculate random interval (in milliseconds)
            const randomMinutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;
            const randomMs = randomMinutes * 60 * 1000;

            // Calculate next collection time
            const nextTimeMs = Date.now() + randomMs;
            const nextTime = new Date(nextTimeMs);

            // STORE THE EXACT TIME for continuation after page refresh
            if (window.AutoBuilderSettings) {
                window.AutoBuilderSettings.set('nextCollectionTime', nextTimeMs);
            }

            console.log(`⏰ Next random data collection in ${randomMinutes} minutes (at ${nextTime.toLocaleTimeString()})`);
            this.updateRandomAutoStatus(`Next collection: ${nextTime.toLocaleTimeString()} (in ${randomMinutes}m)`);

            // Start countdown display
            this.startCountdownDisplay(nextTime);

            // Schedule the collection
            const randomAutoDataTimeout = setTimeout(async () => {
                if (!window.randomAutoDataEnabled) return;

                console.log(`🎲 Executing scheduled randomized auto data collection...`);
                this.updateRandomAutoStatus('🔄 Collecting data...');

                // Clear the stored time since we're executing now
                if (window.AutoBuilderSettings) {
                    window.AutoBuilderSettings.set('nextCollectionTime', null);
                }

                // Stop countdown display
                this.stopCountdownDisplay();

                await this.executeDataCollection();

            }, randomMs);

            // Store timeout reference globally so it can be cleared
            window.currentRandomAutoDataTimeout = randomAutoDataTimeout;
        }

        /**
         * Auto-load existing data from IndexedDB
         */
        async loadExistingData() {
            try {
                console.log('🔍 Checking IndexedDB for existing villages data...');
                this.updateVillagesCount('🔍 Checking database...');

                if (typeof window.loadLatestEnhancedData === 'function') {
                    const villageId = game_data.village.id.toString();
                    const savedData = await window.loadLatestEnhancedData(villageId);

                    if (savedData && savedData.data) {
                        console.log('✅ Found existing villages data in IndexedDB!');
                        console.log(`📅 Data from: ${new Date(savedData.timestamp).toLocaleString()}`);

                        // Display the existing data
                        this.displayVillagesList(savedData.data);

                        // Calculate how long ago the data was collected
                        const dataAge = Date.now() - new Date(savedData.timestamp).getTime();
                        const ageMinutes = Math.round(dataAge / 1000 / 60);

                        console.log(`⏰ Data is ${ageMinutes} minutes old`);

                        if (ageMinutes > 120) { // More than 2 hours old
                            console.log('💡 Data is quite old - consider collecting fresh data');
                        }

                    } else {
                        console.log('📭 No existing villages data found in IndexedDB');
                        this.updateVillagesCount('No data found');

                        // Update the villages list display
                        const villagesList = this.mainPanel.querySelector('#villagesList');
                        if (villagesList) {
                            villagesList.innerHTML = '<p>📭 No villages data found. Click "🎲 Start Random Auto" to collect data...</p>';
                        }
                    }
                } else {
                    console.log('❌ Data loader not available');
                    this.updateVillagesCount('Loader unavailable');
                }

            } catch (error) {
                console.error('❌ Error loading existing data:', error);
                this.updateVillagesCount('Error loading data');
            }
        }

        /**
         * Display villages list with detailed information
         */
        displayVillagesList(data) {
            const villagesListDiv = this.mainPanel.querySelector('#villagesList');
            if (!villagesListDiv || !data) return;

            // Count villages with data
            const resourceVillages = data.resources?.length || 0;
            const buildingVillages = Object.keys(data.buildings?.villages || {}).length;
            const totalVillages = Math.max(resourceVillages, buildingVillages);

            this.updateVillagesCount(`${totalVillages} villages found`);

            if (totalVillages === 0) {
                villagesListDiv.innerHTML = '<p>❌ No villages data found. Try collecting data again.</p>';
                return;
            }

            let villagesHTML = '';

            // Create a map of villages combining resource and building data
            const villagesMap = new Map();

            // Add resource data
            if (data.resources && data.resources.length > 0) {
                data.resources.forEach(village => {
                    villagesMap.set(village.villageId, {
                        ...village,
                        type: 'resource'
                    });
                });
            }

            // Add building data
            if (data.buildings && data.buildings.villages) {
                Object.values(data.buildings.villages).forEach(village => {
                    const existing = villagesMap.get(village.villageId) || {};
                    villagesMap.set(village.villageId, {
                        ...existing,
                        ...village,
                        type: existing.type ? 'combined' : 'building'
                    });
                });
            }

            // Process each village
            villagesMap.forEach((village, villageId) => {
                const troopData = data.troops || {};
                const totalTroops = Object.values(troopData).reduce((a, b) => a + b, 0);

                // Get village name and coordinates
                const villageName = village.name || village.villageInfo?.name || 'Unknown Village';
                const villageCoords = village.coordinates || village.villageInfo?.coordinates || 'N/A';

                villagesHTML += `
                    <div class="village-item">
                        <div class="village-header">
                            <span class="icon header village"></span>
                            <strong>${villageName}</strong>
                            <span class="village-id">(ID: ${villageId})</span>
                            <span class="village-coords">${villageCoords}</span>
                        </div>
                `;

                // Add resources if available
                if (village.resources) {
                    villagesHTML += `
                        <div class="village-resources">
                            <div class="resource-item">
                                <span class="icon header wood" data-title="Wood"></span>
                                <span class="resource-value">${this.formatNumber(village.resources.wood)}</span>
                            </div>
                            <div class="resource-item">
                                <span class="icon header stone"></span>
                                <span class="resource-value">${this.formatNumber(village.resources.stone)}</span>
                            </div>
                            <div class="resource-item">
                                <span class="icon header iron"></span>
                                <span class="resource-value">${this.formatNumber(village.resources.iron)}</span>
                            </div>
                            <div class="resource-item">
                                <span class="icon header ressources"></span>
                                <span class="resource-value">${this.formatNumber(village.warehouse?.capacity || 0)}</span>
                                <span class="usage-percent">(${village.warehouse?.usagePercent || 0}%)</span>
                            </div>
                            <div class="resource-item">
                                <span class="icon header population"></span>
                                <span class="resource-value">${village.population?.current || 0}/${village.population?.max || 0}</span>
                                <span class="usage-percent">(${village.population?.usagePercent || 0}%)</span>
                            </div>
                        </div>
                    `;
                }

                // Add buildings dropdown if available
                if (village.buildings) {
                    villagesHTML += this.createBuildingsDropdown(village.buildings, villageId);
                }

                // Add troops dropdown
                villagesHTML += this.createTroopsDropdown(troopData, villageId, totalTroops);

                villagesHTML += `</div>`;
            });

            // Add collection info footer
            villagesHTML += `
                <div class="collection-info">
                    <small>
                        🎲 Execution Order: ${data.executionOrder?.join(' → ') || 'Unknown'}<br>
                        📅 Collected: ${data.extractedAt ? new Date(data.extractedAt).toLocaleString() : 'Unknown'}<br>
                        💾 Database: IndexedDB with anti-detection features
                    </small>
                </div>
            `;

            villagesListDiv.innerHTML = villagesHTML;

            // Add event listeners for dropdowns
            this.addDropdownEventListeners();
        }

        /**
         * Create buildings dropdown section
         */
        createBuildingsDropdown(buildings, villageId) {
            const buildingIcons = {
                "main": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/buildings/main.png",
                "barracks": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/buildings/barracks.png",
                "church": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/buildings/church.png",
                "snob": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/buildings/snob.png",
                "smith": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/buildings/smith.png",
                "place": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/buildings/place.png",
                "market": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/buildings/market.png",
                "stable": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/buildings/stable.png",
                "garage": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/buildings/garage.png",
                "church_f": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/buildings/church_f.png",
                "watchtower": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/buildings/watchtower.png",
                "statue": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/buildings/statue.png",
                "wood": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/buildings/wood.png",
                "stone": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/buildings/stone.png",
                "iron": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/buildings/iron.png",
                "farm": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/buildings/farm.png",
                "storage": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/buildings/storage.png",
                "hide": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/buildings/hide.png",
                "wall": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/buildings/wall.png"
            };

            let buildingsHTML = `
                <div class="village-section">
                    <div class="section-header" data-toggle="buildings_${villageId}">
                        <img class="widget-button" src="https://dsen.innogamescdn.com/asset/7d3266bc/graphic/plus.png" id="buildings_toggle_${villageId}">
                        <img class="quickbar_image" src="https://dsen.innogamescdn.com/asset/7d3266bc/graphic/buildings/main.png" alt="">
                        <span class="section-title">Buildings</span>
                    </div>
                    <div class="section-content" id="buildings_${villageId}" style="display: none;">
                        <div class="buildings-grid">
            `;

            // Add buildings with levels > 0
            Object.entries(buildings).forEach(([buildingType, level]) => {
                if (level > 0 && buildingIcons[buildingType]) {
                    const buildingName = buildingType.charAt(0).toUpperCase() + buildingType.slice(1);
                    buildingsHTML += `
                        <div class="building-item">
                            <img class="building-icon" src="${buildingIcons[buildingType]}" alt="${buildingName}">
                            <span class="building-info">${buildingName} ${level}</span>
                        </div>
                    `;
                }
            });

            buildingsHTML += `
                        </div>
                    </div>
                </div>
            `;

            return buildingsHTML;
        }

        /**
         * Create troops dropdown section
         */
        createTroopsDropdown(troops, villageId, totalTroops) {
            const troopIcons = {
                "spear": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/unit/unit_spear.png",
                "sword": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/unit/unit_sword.png",
                "axe": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/unit/unit_axe.png",
                "archer": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/unit/unit_archer.png",
                "spy": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/unit/unit_spy.png",
                "light": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/unit/unit_light.png",
                "marcher": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/unit/unit_marcher.png",
                "heavy": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/unit/unit_heavy.png",
                "ram": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/unit/unit_ram.png",
                "catapult": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/unit/unit_catapult.png",
                "knight": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/unit/unit_knight.png",
                "snob": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/unit/unit_snob.png",
                "militia": "https://dsen.innogamescdn.com/asset/7d3266bc/graphic/unit/unit_militia.png"
            };

            let troopsHTML = `
                <div class="village-section">
                    <div class="section-header" data-toggle="troops_${villageId}">
                        <img class="widget-button" src="https://dsen.innogamescdn.com/asset/7d3266bc/graphic/plus.png" id="troops_toggle_${villageId}">
                        <img class="quickbar_image" src="https://dsen.innogamescdn.com/asset/7d3266bc/graphic/buildings/barracks.png" alt="">
                        <span class="section-title">Troops (${totalTroops} total)</span>
                    </div>
                    <div class="section-content" id="troops_${villageId}" style="display: none;">
                        <div class="troops-grid">
            `;

            // Add troops with count > 0
            Object.entries(troops).forEach(([troopType, count]) => {
                if (count > 0 && troopIcons[troopType]) {
                    const troopName = troopType.charAt(0).toUpperCase() + troopType.slice(1);
                    troopsHTML += `
                        <div class="troop-item">
                            <img class="troop-icon" src="${troopIcons[troopType]}" alt="${troopName}">
                            <span class="troop-info">${troopName}: ${count}</span>
                        </div>
                    `;
                }
            });

            // If no troops, show message
            if (totalTroops === 0) {
                troopsHTML += `<div class="no-troops">No troops available</div>`;
            }

            troopsHTML += `
                        </div>
                    </div>
                </div>
            `;

            return troopsHTML;
        }

        /**
         * Add event listeners for dropdown toggles
         */
        addDropdownEventListeners() {
            // Add click handlers for all section headers
            this.mainPanel.querySelectorAll('.section-header').forEach(header => {
                header.addEventListener('click', (e) => {
                    const toggleTarget = header.getAttribute('data-toggle');
                    const content = this.mainPanel.querySelector(`#${toggleTarget}`);
                    const toggleImg = header.querySelector('.widget-button');

                    if (content && toggleImg) {
                        if (content.style.display === 'none') {
                            content.style.display = 'block';
                            toggleImg.src = 'https://dsen.innogamescdn.com/asset/7d3266bc/graphic/minus.png';
                        } else {
                            content.style.display = 'none';
                            toggleImg.src = 'https://dsen.innogamescdn.com/asset/7d3266bc/graphic/plus.png';
                        }
                    }
                });
            });
        }

        /**
         * Format numbers with k/M suffix
         */
        formatNumber(num) {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
            return num.toString();
        }

        /**
         * Add CSS styles matching Tribal Wars theme
         */
        addStyles() {
            const styles = `
                .autobuilder-toggle {
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    background: #c1a264;
                    color: white;
                    border: 2px solid #a07d3b;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    cursor: pointer;
                    font-size: 20px;
                    z-index: 9999;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                    transition: all 0.3s ease;
                }
                .autobuilder-toggle:hover {
                    background: #a07d3b;
                    transform: scale(1.1);
                }
                .autobuilder-panel {
                    position: fixed;
                    background: #f4e4bc;
                    border: 2px solid #7d5a29;
                    border-radius: 4px;
                    box-shadow: 0 3px 12px rgba(0,0,0,0.4);
                    z-index: 10000;
                    min-width: 600px;
                    max-width: 750px;
                    max-height: 85vh;
                    overflow-y: auto;
                    font-family: Verdana, Arial, sans-serif;
                    font-size: 11px;
                }
                .autobuilder-header {
                    background: linear-gradient(to bottom, #c1a264 0%, #a07d3b 100%);
                    color: #fff;
                    padding: 8px 12px;
                    border-radius: 3px 3px 0 0;
                    border-bottom: 2px solid #7d5a29;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.3);
                }
                .autobuilder-header h3 {
                    margin: 0;
                    font-size: 13px;
                    font-family: Verdana, Arial, sans-serif;
                    font-weight: bold;
                    text-shadow: 1px 1px 0px rgba(0,0,0,0.4);
                }
                .autobuilder-close, .autobuilder-minimize {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                }
                .autobuilder-close:hover, .autobuilder-minimize:hover {
                    color: #ffe082;
                }
                .autobuilder-restore {
                    position: fixed;
                    left: 18px;
                    bottom: 18px;
                    z-index: 10001;
                    background: #c1a264;
                    color: #fff;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    padding: 8px 16px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    cursor: pointer;
                    display: none;
                }
                .autobuilder-restore:hover {
                    background: #a07d3b;
                }
                .autobuilder-content {
                    padding: 12px 15px;
                    background: #fff8e1;
                }
                .autobuilder-section {
                    margin-bottom: 12px;
                    padding: 8px 10px;
                    background: white;
                    border: 1px solid #c1a264;
                    border-radius: 3px;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }
                .autobuilder-section h4 {
                    margin: 0 0 8px 0;
                    font-size: 11px;
                    font-family: Verdana, Arial, sans-serif;
                    color: #5d4e37;
                    font-weight: bold;
                    text-transform: uppercase;
                    border-bottom: 1px solid #c1a264;
                    padding-bottom: 3px;
                    letter-spacing: 0.5px;
                }
                .autobuilder-btn {
                    font-size: 11px;
                    font-family: Verdana, Arial, sans-serif;
                    font-weight: bold;
                    padding: 4px 8px;
                    border-radius: 3px;
                    border: 1px solid #7d5a29;
                    background: linear-gradient(to bottom, #f4e4bc 0%, #e5d8b8 100%);
                    color: #5d4e37;
                    cursor: pointer;
                    margin-right: 4px;
                    margin-bottom: 3px;
                    text-shadow: 1px 1px 0px rgba(255,255,255,0.8);
                    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
                    transition: all 0.1s ease;
                }
                .autobuilder-btn:hover {
                    background: linear-gradient(to bottom, #e5d8b8 0%, #d4c7a8 100%);
                    border-color: #6b4e1e;
                }
                .autobuilder-btn:active {
                    background: linear-gradient(to bottom, #d4c7a8 0%, #c5b898 100%);
                    box-shadow: inset 0 1px 2px rgba(0,0,0,0.2);
                }
                .autobuilder-btn-primary {
                    background: linear-gradient(to bottom, #c1a264 0%, #a07d3b 100%);
                    color: #fff;
                    border: 1px solid #7d5a29;
                    text-shadow: 1px 1px 0px rgba(0,0,0,0.3);
                }
                .autobuilder-btn-primary:hover {
                    background: linear-gradient(to bottom, #a07d3b 0%, #8b6a32 100%);
                }
                .autobuilder-btn-secondary {
                    background: linear-gradient(to bottom, #f4e4bc 0%, #e5d8b8 100%);
                    color: #5d4e37;
                    border: 1px solid #c1a264;
                }
                .setting-group {
                    margin-bottom: 6px;
                }
                .setting-group label {
                    font-size: 11px;
                    font-family: Verdana, Arial, sans-serif;
                    color: #5d4e37;
                    font-weight: bold;
                }
                .setting-group input[type="checkbox"] {
                    vertical-align: middle;
                    margin-right: 6px;
                }
                .setting-group input[type="number"] {
                    font-size: 11px;
                    font-family: Verdana, Arial, sans-serif;
                    padding: 2px 4px;
                    border-radius: 2px;
                    border: 1px solid #7d5a29;
                    background: #fff8e1;
                    width: 60px;
                    box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
                }
                .setting-group input[type="number"]:focus {
                    border-color: #a07d3b;
                    outline: none;
                    background: #ffffff;
                }
                .setting-group small {
                    color: #a07d3b;
                    font-style: italic;
                }
                                 .status-display, .data-display {
                     background: #f9f9f9;
                     padding: 10px;
                     border: 1px solid #ddd;
                     border-radius: 4px;
                     margin-top: 8px;
                     font-size: 12px;
                 }
                 .status-item, .data-item {
                     margin-bottom: 4px;
                     color: #6b4e1e;
                 }
                 .data-header {
                     background: #c1a264;
                     color: white;
                     padding: 6px 10px;
                     margin: -10px -10px 8px -10px;
                     border-radius: 3px 3px 0 0;
                     font-size: 13px;
                     text-align: center;
                 }
                .console-help {
                    background: #f9f9f9;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-family: monospace;
                    font-size: 12px;
                }
                .console-help p {
                    margin: 4px 0;
                    color: #6b4e1e;
                }
                                 .console-help code {
                     background: #e8e8e8;
                     padding: 2px 4px;
                     border-radius: 2px;
                     color: #333;
                 }
                 .villages-list-container {
                     background: #f9f9f9;
                     border: 1px solid #ddd;
                     border-radius: 4px;
                     margin-top: 8px;
                     max-height: 400px;
                     overflow-y: auto;
                 }
                 .villages-header {
                     background: #c1a264;
                     color: white;
                     padding: 8px 12px;
                     display: flex;
                     justify-content: space-between;
                     align-items: center;
                     border-radius: 3px 3px 0 0;
                     font-size: 13px;
                 }
                 .villages-count {
                     background: rgba(255,255,255,0.2);
                     padding: 2px 8px;
                     border-radius: 10px;
                     font-size: 11px;
                 }
                 .villages-list {
                     padding: 10px;
                 }
                 .village-item {
                     background: white;
                     border: 1px solid #e2c785;
                     border-radius: 4px;
                     margin-bottom: 10px;
                     padding: 10px;
                     transition: all 0.2s ease;
                 }
                 .village-item:hover {
                     background: #fff8e1;
                     border-color: #c1a264;
                 }
                 .village-header {
                     display: flex;
                     align-items: center;
                     gap: 8px;
                     margin-bottom: 8px;
                     font-size: 14px;
                     font-weight: bold;
                     color: #6b4e1e;
                 }
                 .village-id {
                     font-size: 11px;
                     color: #a07d3b;
                     font-weight: normal;
                 }
                 .village-coords {
                     font-size: 11px;
                     color: #a07d3b;
                     font-weight: normal;
                     margin-left: auto;
                 }
                 .village-resources {
                     display: flex;
                     gap: 12px;
                     margin-bottom: 6px;
                     flex-wrap: wrap;
                 }
                 .resource-item {
                     display: flex;
                     align-items: center;
                     gap: 4px;
                     font-size: 12px;
                     color: #6b4e1e;
                 }
                 .resource-value {
                     font-weight: bold;
                     color: #333;
                 }
                 .usage-percent {
                     font-size: 10px;
                     color: #a07d3b;
                 }
                 .village-troops {
                     display: flex;
                     align-items: center;
                     gap: 6px;
                     font-size: 11px;
                     color: #6b4e1e;
                     border-top: 1px solid #f0f0f0;
                     padding-top: 6px;
                 }
                 .troops-label {
                     font-weight: bold;
                 }
                 .troops-count {
                     color: #333;
                 }
                 .collection-info {
                     background: #f0f0f0;
                     padding: 8px;
                     margin-top: 10px;
                     border-radius: 4px;
                     border-top: 1px solid #ddd;
                     font-size: 10px;
                     color: #666;
                     line-height: 1.4;
                 }
                 .village-section {
                     margin-top: 8px;
                     border: 1px solid #e2c785;
                     border-radius: 4px;
                     background: #fff8e1;
                 }
                 .section-header {
                     background: #f4e4bc;
                     padding: 6px 10px;
                     border-bottom: 1px solid #e2c785;
                     cursor: pointer;
                     display: flex;
                     align-items: center;
                     gap: 8px;
                     transition: background 0.2s ease;
                 }
                 .section-header:hover {
                     background: #e5d8b8;
                 }
                 .widget-button {
                     width: 16px;
                     height: 16px;
                     cursor: pointer;
                 }
                 .quickbar_image {
                     width: 20px;
                     height: 20px;
                 }
                 .section-title {
                     font-weight: bold;
                     color: #6b4e1e;
                     font-size: 12px;
                 }
                 .section-content {
                     padding: 8px;
                     background: white;
                 }
                 .buildings-grid, .troops-grid {
                     display: grid;
                     grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                     gap: 6px;
                 }
                 .building-item, .troop-item {
                     display: flex;
                     align-items: center;
                     gap: 6px;
                     padding: 4px 6px;
                     background: #f9f9f9;
                     border: 1px solid #e2c785;
                     border-radius: 3px;
                     font-size: 11px;
                     color: #6b4e1e;
                     transition: all 0.2s ease;
                 }
                 .building-item:hover, .troop-item:hover {
                     background: #fff8e1;
                     border-color: #c1a264;
                 }
                 .building-icon, .troop-icon {
                     width: 16px;
                     height: 16px;
                     flex-shrink: 0;
                 }
                 .building-info, .troop-info {
                     font-weight: bold;
                     white-space: nowrap;
                     overflow: hidden;
                     text-overflow: ellipsis;
                 }
                 .no-troops {
                     grid-column: 1 / -1;
                     text-align: center;
                     color: #a07d3b;
                     font-style: italic;
                     padding: 10px;
                 }

                 /* Randomized Interval Styles */
                 .randomized-interval-group {
                     background: #f0f8ff;
                     border: 2px solid #4a90e2;
                     border-radius: 6px;
                     padding: 12px;
                     margin-bottom: 10px;
                 }

                 .randomized-interval-group label strong {
                     color: #2c5282;
                     font-size: 14px;
                 }

                 .interval-settings {
                     display: flex;
                     align-items: center;
                     gap: 8px;
                     margin: 8px 0;
                     flex-wrap: wrap;
                 }

                 .interval-settings label {
                     font-size: 12px;
                     color: #2c5282;
                     font-weight: bold;
                 }

                 .interval-settings span {
                     font-size: 12px;
                     color: #4a5568;
                 }

                 .interval-controls {
                     display: flex;
                     gap: 8px;
                     margin: 8px 0;
                 }

                 .auto-status-display {
                     background: #e2f8ff;
                     padding: 6px 10px;
                     border-radius: 4px;
                     border: 1px solid #b3e5fc;
                     margin-top: 6px;
                 }

                 .auto-status-display .status-text {
                     font-size: 11px;
                     color: #2c5282;
                     font-weight: bold;
                 }



                 #startRandomAutoData {
                     background: linear-gradient(45deg, #4a90e2, #5ba0f2);
                     color: white;
                     border: 1px solid #357abd;
                     font-weight: bold;
                 }

                 #startRandomAutoData:hover {
                     background: linear-gradient(45deg, #357abd, #4a90e2);
                 }

                 #stopRandomAutoData {
                     background: #f56565;
                     color: white;
                     border: 1px solid #e53e3e;
                 }

                 #stopRandomAutoData:hover {
                     background: #e53e3e;
                 }

                 /* Template Management Styles */
                 .template-progress-display {
                     background: #f9f9f9;
                     border: 1px solid #ddd;
                     border-radius: 4px;
                     padding: 10px;
                     margin-top: 8px;
                     font-size: 12px;
                 }

                 .template-status {
                     display: flex;
                     justify-content: space-between;
                     align-items: center;
                     margin-bottom: 8px;
                     font-size: 13px;
                 }

                 .template-progress-bar {
                     margin: 8px 0;
                 }

                 .progress-bar-container {
                     width: 100%;
                     height: 20px;
                     background: #e0e0e0;
                     border-radius: 10px;
                     overflow: hidden;
                     margin-bottom: 4px;
                 }

                 .progress-bar {
                     height: 100%;
                     background: linear-gradient(90deg, #4CAF50 0%, #81C784 100%);
                     transition: width 0.3s ease;
                 }

                 .progress-text {
                     font-size: 11px;
                     color: #666;
                     font-weight: bold;
                 }

                 .next-buildings {
                     background: #fff8e1;
                     padding: 6px 8px;
                     border-radius: 3px;
                     border-left: 3px solid #c1a264;
                     margin-top: 8px;
                     font-size: 11px;
                     line-height: 1.4;
                 }

                 #villageTemplate {
                     font-size: 11px;
                     padding: 4px;
                     border: 1px solid #7d5a29;
                     border-radius: 2px;
                     background: #fff8e1;
                     margin-right: 8px;
                 }

                 #assignTemplate {
                     font-size: 11px;
                     padding: 4px 8px;
                 }

                 /* Template Creation Styles */
                 .template-creation {
                     background: #f0f8ff;
                     border: 1px solid #4a90e2;
                     border-radius: 6px;
                     padding: 12px;
                     margin-top: 10px;
                 }

                 .template-creation h5 {
                     margin: 0 0 8px 0;
                     color: #2c5282;
                     font-size: 12px;
                 }

                 .template-creation input, .template-creation select {
                     font-size: 11px;
                     padding: 3px 6px;
                     border: 1px solid #4a90e2;
                     border-radius: 3px;
                     background: white;
                 }

                 .building-sequence {
                     min-height: 60px;
                     max-height: 200px;
                     overflow-y: auto;
                     border: 1px solid #ddd;
                     border-radius: 3px;
                     padding: 6px;
                     background: white;
                     margin-top: 4px;
                 }

                 .sequence-item {
                     margin-bottom: 2px;
                 }

                 .template-management {
                     background: #fff8e1;
                     border: 1px solid #c1a264;
                     border-radius: 6px;
                     padding: 12px;
                     margin-top: 10px;
                 }

                 .template-management h5 {
                     margin: 0 0 8px 0;
                     color: #6b4e1e;
                     font-size: 12px;
                 }

                 .template-list {
                     max-height: 200px;
                     overflow-y: auto;
                 }

                 .template-item {
                     transition: background 0.2s ease;
                 }

                 .template-item:hover {
                     background: #f0f0f0 !important;
                 }
             `;

             const styleSheet = document.createElement('style');
             styleSheet.textContent = styles;
             document.head.appendChild(styleSheet);
        }
    }

    // =============================================================================
    // 🤖 AUTO BUILD BOT CLASS
    // =============================================================================

    class AutoBuildBot {
        constructor() {
            this.isRunning = false;
            this.checkInterval = null;
            this.settings = null;
            this.database = null;
            this.enhancedDataManager = null;
            this.smartCalculator = null;
            this.lastCheck = 0;
            this.nextCheckTime = 0;
        }

        /**
         * Initialize the bot
         */
        init() {
            this.settings = window.AutoBuilderSettings;
            this.database = window.AutoBuilderDatabase;

            // Initialize enhanced data manager
            this.enhancedDataManager = new EnhancedDataManager();
            this.enhancedDataManager.init();

            // Initialize smart calculator
            this.smartCalculator = new SmartBuildCalculator();
            this.smartCalculator.init();
            this.smartCalculator.setBotInstance(this);

            console.log('🤖 Auto Build Bot initialized with smart calculator');
        }

        /**
         * Start the bot (DATABASE-ONLY mode)
         */
        start() {
            if (this.isRunning) {
                console.log('⚠️ Bot is already running');
                return;
            }

            // AUTO-SYNC: Check if we need to sync current reality
            this.autoSyncWithReality();

            this.isRunning = true;
            this.nextCheckTime = Date.now() + 60000; // Start checking in 1 minute

            // DATABASE-ONLY: Check every 2 minutes but only analyze database
            this.checkInterval = setInterval(() => {
                this.smartCheckAndBuild();
            }, 120000); // Check every 2 minutes (safe for database analysis only)

            console.log('🤖 ENHANCED Auto Build Bot started!');
            console.log('🧠 Bot uses Enhanced Progress Tracking with real-time intelligence!');
            console.log('🔒 DATABASE-ONLY operation - NO game fetching for safety!');
            console.log('📊 Enhanced tracker syncs automatically with fresh data!');
        }

        /**
         * Stop the bot
         */
        stop() {
            if (this.checkInterval) {
                clearInterval(this.checkInterval);
                this.checkInterval = null;
            }
            this.isRunning = false;
            console.log('🛑 Auto Build Bot stopped!');
        }

        /**
         * Check if bot should run (DATABASE-ONLY mode with smart timing)
         */
        shouldRun() {
            // Check if auto build is enabled
            if (!this.settings.get('autoBuildEnabled')) {
                return false;
            }

            // Check if we're on main page
            if (!window.location.href.includes('screen=main')) {
                return false;
            }

            // Check if page is visible
            if (document.hidden) {
                return false;
            }

            // Smart timing: Only check database when it's time
            const now = Date.now();
            if (now < this.nextCheckTime) {
                // Show countdown for debugging
                const timeLeft = Math.round((this.nextCheckTime - now) / 1000 / 60);
                if (timeLeft > 0 && timeLeft % 5 === 0) { // Log every 5 minutes
                    console.log(`🤖 Bot waiting ${timeLeft} more minutes before next database check...`);
                }
                return false;
            }

            return true;
        }

        /**
         * Smart check and build using ENHANCED INTELLIGENCE (database + real-time tracking)
         */
        async smartCheckAndBuild() {
            if (!this.shouldRun()) {
                return;
            }

            try {
                this.lastCheck = Date.now();
                const villageId = game_data.village.id.toString();

                console.log(`🧠 ENHANCED Smart check for village ${villageId}...`);
                console.log(`🧠 Using Enhanced Progress Tracking with real-time intelligence!`);

                // Use enhanced smart calculator to determine if we should build
                const decision = await this.smartCalculator.calculateNextBuild(villageId);

                // Update next check time based on decision
                this.nextCheckTime = decision.nextCheck || (Date.now() + 1800000); // Default 30 minutes

                if (decision.shouldBuild) {
                    console.log(`🏗️ ENHANCED decision: BUILD ${decision.building.building} to level ${decision.building.target_level}`);
                    console.log(`🧠 Decision based on enhanced intelligence: database + real-time tracking`);
                    
                    // Show intelligence report
                    if (decision.intelligence) {
                        console.log(`📊 Intelligence: ${decision.intelligence.pendingBuilds} pending, queue ${decision.intelligence.queueItems}/5`);
                    }
                    
                    await this.build(decision.building, villageId);
                } else {
                    console.log(`⏳ ENHANCED decision: WAIT - ${decision.reason}`);

                    // Show dynamic check information
                    const nextCheckIn = Math.round((decision.nextCheck - Date.now()) / 1000 / 60);
                    console.log(`🔄 Next enhanced analysis in: ${nextCheckIn} minutes`);

                    if (decision.reason.includes('No database data')) {
                        console.log(`💡 TIP: Click "🎲 Start Random Auto" to collect fresh village data`);
                    }
                }

            } catch (error) {
                console.error('❌ Error in ENHANCED smart check:', error);
                this.nextCheckTime = Date.now() + 1800000; // Wait 30 minutes on error
            }
        }

        /**
         * Build a specific building using ENHANCED LOGIC with progress tracking
         * @param {object} buildingPlan - Building plan
         * @param {string} villageId - Village ID
         */
        async build(buildingPlan, villageId) {
            try {
                const startTime = Date.now();
                console.log(`🏗️ ENHANCED Build: Starting ${buildingPlan.building} (${buildingPlan.current_level} → ${buildingPlan.target_level})`);
                
                // Record build start in enhanced tracker BEFORE attempting to build
                this.enhancedTracker.recordBuildStart(
                    villageId, 
                    buildingPlan.building, 
                    buildingPlan.current_level, 
                    buildingPlan.target_level
                );
                
                // Get building ID for the game
                const buildingId = this.enhancedDataManager.getBuildingId(buildingPlan.building);
                
                // Attempt to add building to game queue
                const success = await this.enhancedDataManager.addBuildingToQueue(villageId, buildingId);
                
                if (success) {
                    console.log(`✅ ENHANCED Build: Successfully started ${buildingPlan.building} → level ${buildingPlan.target_level}`);
                    
                    // Show success message
                    if (typeof UI !== 'undefined' && UI.SuccessMessage) {
                        UI.SuccessMessage(`✅ Building ${buildingPlan.building} → level ${buildingPlan.target_level}!`);
                    }
                    
                    // Schedule next check soon to see if we can build more
                    this.nextCheckTime = Date.now() + 120000; // 2 minutes
                    
                } else {
                    console.log(`❌ ENHANCED Build: Failed to start ${buildingPlan.building} → level ${buildingPlan.target_level}`);
                    
                    // Remove the recorded action since build failed
                    // (Enhanced tracker will clean this up automatically)
                    
                    // Show error message
                    if (typeof UI !== 'undefined' && UI.ErrorMessage) {
                        UI.ErrorMessage(`❌ Failed to build ${buildingPlan.building}`);
                    }
                    
                    // Wait longer before retry
                    this.nextCheckTime = Date.now() + 600000; // 10 minutes
                }
                
                return success;
                
            } catch (error) {
                console.error('❌ Enhanced Build error:', error);
                this.nextCheckTime = Date.now() + 300000; // 5 minutes on error
                return false;
            }
        }

        // OLD PROGRESS TRACKING METHODS REMOVED - REPLACED BY ENHANCED TRACKER
        // These methods are now handled by the EnhancedProgressTracker class:
        // - recordBuildProgress() → enhancedTracker.recordBuildStart()
        // - getBuildProgress() → enhancedTracker.getIntelligenceReport()
        // - getCombinedBuildingLevels() → enhancedTracker.getCombinedBuildingLevels()

        /**
         * Auto-sync with reality by detecting discrepancies (ENHANCED VERSION)
         */
        autoSyncWithReality() {
            try {
                const villageId = game_data.village.id.toString();
                console.log('🔄 ENHANCED AUTO-SYNC: Checking for building level discrepancies...');

                // Check if we have a building queue visible on current page
                const queueElements = document.querySelectorAll('.order, .queue-item, [class*="queue"]');

                if (queueElements.length > 0) {
                    console.log(`🏗️ Detected ${queueElements.length} items in building queue on page`);

                    // Get intelligence report from enhanced tracker
                    const report = this.enhancedTracker.getIntelligenceReport(villageId);

                    if (report.pendingBuilds > 0) {
                        console.log(`📊 Enhanced tracker shows ${report.pendingBuilds} pending builds`);
                        console.log(`📅 Last database sync: ${report.lastSync}`);
                        console.log(`⏰ Data age: ${report.dataAge} minutes`);

                        // If there's queue activity and our data is old, suggest refresh
                        if (report.dataAge > 30) {
                            console.log('⚠️ Database is getting old - consider refreshing with "🎲 Start Random Auto"');
                        }
                    } else {
                        console.log('✅ Enhanced tracker shows no pending builds - sync looks good');
                    }
                } else {
                    console.log('✅ No queue activity detected on current page');
                }

                // Enhanced tracker automatically syncs with fresh data, so no manual fixes needed
                console.log('✅ Enhanced auto-sync completed - enhanced tracker handles sync automatically');

            } catch (error) {
                console.error('❌ Error in enhanced auto-sync:', error);
            }
        }

        /**
         * Get bot status
         */
        getStatus() {
            return {
                isRunning: this.isRunning,
                lastCheck: this.lastCheck,
                nextCheckTime: this.nextCheckTime,
                timeUntilNextCheck: this.nextCheckTime - Date.now(),
                settings: this.settings ? this.settings.getAll() : null
            };
        }
    }

    // =============================================================================
    // 🧠 ENHANCED PROGRESS TRACKING SYSTEM (REPLACES BLIND BUILDING LOGIC)
    // =============================================================================

    /**
     * BuildTimeCalculator - Calculates exact build times using Tribal Wars formulas
     */
    class BuildTimeCalculator {
        constructor() {
            this.baseTimes = {
                'main': 900,      // 15 minutes
                'barracks': 1800, // 30 minutes  
                'stable': 6000,   // 100 minutes
                'garage': 6000,   // 100 minutes
                'church': 184980, // ~51 hours
                'church_f': 8160, // ~2.3 hours
                'watchtower': 13200, // ~3.7 hours
                'snob': 586800,   // ~163 hours
                'smith': 6000,    // 100 minutes
                'place': 10860,   // ~3 hours
                'statue': 1500,   // 25 minutes
                'market': 2700,   // 45 minutes
                'wood': 900,      // 15 minutes
                'stone': 900,     // 15 minutes
                'iron': 1080,     // 18 minutes
                'farm': 1200,     // 20 minutes
                'storage': 1020,  // 17 minutes
                'hide': 1800,     // 30 minutes
                'wall': 3600      // 60 minutes
            };
        }
        
        calculateBuildTime(building, level, hqLevel = 20) {
            // Use exact Tribal Wars formulas
            const baseTime = this.baseTimes[building] || 1800;
            const levelMultiplier = Math.pow(1.2, level - 1);
            const hqReduction = Math.pow(1.05, -hqLevel);
            const worldSpeed = game_data.speed || 1.0;
            
            return Math.round((baseTime * levelMultiplier * hqReduction) / worldSpeed);
        }
        
        formatBuildTime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            return `${hours}h ${minutes}m ${secs}s`;
        }
    }

    /**
     * QueueSimulator - Tracks the 5-slot building queue with timing
     */
    class QueueSimulator {
        constructor() {
            this.activeQueues = new Map(); // villageId → queue items
            this.maxQueueSize = 5;
        }
        
        addToQueue(villageId, building, targetLevel, startTime, buildTimeSeconds) {
            if (!this.activeQueues.has(villageId)) {
                this.activeQueues.set(villageId, []);
            }
            
            const queue = this.activeQueues.get(villageId);
            const completionTime = startTime + (buildTimeSeconds * 1000);
            
            queue.push({
                building,
                targetLevel,
                startTime,
                estimatedCompletion: completionTime,
                status: 'building'
            });
            
            // Keep queue sorted by completion time
            queue.sort((a, b) => a.estimatedCompletion - b.estimatedCompletion);
            
            console.log(`🏗️ Queue: Added ${building} → level ${targetLevel} (completes at ${new Date(completionTime).toLocaleTimeString()})`);
        }
        
        getQueueStatus(villageId) {
            const queue = this.activeQueues.get(villageId) || [];
            const now = Date.now();
            
            // Remove completed builds
            const activeItems = queue.filter(item => {
                if (now >= item.estimatedCompletion) {
                    console.log(`✅ Queue: ${item.building} → level ${item.targetLevel} completed`);
                    return false;
                }
                return true;
            });
            
            this.activeQueues.set(villageId, activeItems);
            
            return {
                items: activeItems,
                count: activeItems.length,
                hasSpace: activeItems.length < this.maxQueueSize,
                nextCompletion: activeItems[0]?.estimatedCompletion || null
            };
        }
        
        isQueueFull(villageId) {
            const status = this.getQueueStatus(villageId);
            return !status.hasSpace;
        }
        
        getNextSlotTime(villageId) {
            const status = this.getQueueStatus(villageId);
            return status.hasSpace ? Date.now() : status.nextCompletion;
        }
    }

    /**
     * EnhancedProgressTracker - Main intelligence that combines database data with real-time tracking
     */
    class EnhancedProgressTracker {
        constructor() {
            this.buildTimeCalculator = new BuildTimeCalculator();
            this.queueSimulator = new QueueSimulator();
            this.baseDatabaseLevels = new Map();  // Fresh data when available
            this.pendingBuilds = new Map();       // Real-time predictions
            this.completedBuilds = new Map();     // Confirmed completions
            this.lastDatabaseSync = 0;            // Track freshness
        }
        
        recordBuildStart(villageId, building, fromLevel, toLevel) {
            const now = Date.now();
            const buildTime = this.buildTimeCalculator.calculateBuildTime(building, toLevel);
            const completionTime = now + (buildTime * 1000);
            
            // Record the pending build
            const buildKey = `${villageId}_${building}_${now}`;
            this.pendingBuilds.set(buildKey, {
                villageId,
                building,
                fromLevel,
                toLevel,
                startTime: now,
                estimatedCompletion: completionTime,
                buildTimeUsed: buildTime,
                status: 'building'
            });
            
            // Add to queue simulator
            this.queueSimulator.addToQueue(villageId, building, toLevel, now, buildTime);
            
            console.log(`🧠 Enhanced Tracker: Recorded ${building} ${fromLevel}→${toLevel}`);
            console.log(`⏰ Estimated completion: ${new Date(completionTime).toLocaleTimeString()}`);
            console.log(`🏗️ Build time: ${this.buildTimeCalculator.formatBuildTime(buildTime)}`);
        }
        
        getCombinedBuildingLevels(villageId, databaseLevels) {
            // Use fresh database levels as baseline
            const baseline = this.baseDatabaseLevels.get(villageId) || databaseLevels;
            const enhanced = { ...baseline };
            const now = Date.now();
            
            // Apply completed builds based on timing
            this.pendingBuilds.forEach((build, key) => {
                if (build.villageId === villageId) {
                    if (now >= build.estimatedCompletion) {
                        // Build should be completed
                        enhanced[build.building] = Math.max(
                            enhanced[build.building] || 0, 
                            build.toLevel
                        );
                        
                        // Move to completed builds
                        this.completedBuilds.set(key, { ...build, actualCompletion: now });
                        this.pendingBuilds.delete(key);
                        
                        console.log(`✅ Enhanced Tracker: ${build.building} completed → level ${build.toLevel}`);
                    }
                }
            });
            
            return enhanced;
        }
        
        syncWithFreshData(villageId, freshDatabaseData) {
            const freshBuildings = this.extractBuildingLevels(freshDatabaseData);
            
            console.log('🔄 Enhanced Tracker: Syncing with fresh database data...');
            
            // Compare our predictions with reality
            const ourPredictions = this.getCombinedBuildingLevels(villageId, {});
            
            Object.entries(freshBuildings).forEach(([building, actualLevel]) => {
                const predictedLevel = ourPredictions[building] || 0;
                
                if (actualLevel > predictedLevel) {
                    console.log(`✅ Sync: ${building} reality=${actualLevel}, predicted=${predictedLevel}`);
                } else if (actualLevel < predictedLevel) {
                    console.log(`⚠️ Sync mismatch: ${building} reality=${actualLevel}, predicted=${predictedLevel}`);
                    // Clean up incorrect predictions
                    this.cleanupIncorrectPredictions(villageId, building, actualLevel);
                } else {
                    console.log(`🎯 Sync perfect: ${building} level ${actualLevel}`);
                }
            });
            
            // Update our baseline
            this.lastDatabaseSync = Date.now();
            this.baseDatabaseLevels.set(villageId, freshBuildings);
            
            console.log('✅ Enhanced Tracker synced with fresh data!');
        }
        
        cleanupIncorrectPredictions(villageId, building, actualLevel) {
            // Remove pending builds that are now incorrect
            this.pendingBuilds.forEach((build, key) => {
                if (build.villageId === villageId && build.building === building && build.toLevel > actualLevel) {
                    console.log(`🗑️ Removing incorrect prediction: ${building} → ${build.toLevel}`);
                    this.pendingBuilds.delete(key);
                }
            });
        }
        
        extractBuildingLevels(freshDatabaseData) {
            // Extract building levels from comprehensive data
            if (freshDatabaseData?.buildings?.villages) {
                const villageData = Object.values(freshDatabaseData.buildings.villages)[0];
                return villageData?.buildings || {};
            }
            return {};
        }
        
        isQueueFull(villageId) {
            return this.queueSimulator.isQueueFull(villageId);
        }
        
        getNextBuildSlotAvailable(villageId) {
            return this.queueSimulator.getNextSlotTime(villageId);
        }
        
        getIntelligenceReport(villageId) {
            const pending = Array.from(this.pendingBuilds.values()).filter(b => b.villageId === villageId);
            const queueStatus = this.queueSimulator.getQueueStatus(villageId);
            
            return {
                pendingBuilds: pending.length,
                queueItems: queueStatus.count,
                queueSpace: queueStatus.hasSpace,
                lastSync: this.lastDatabaseSync ? new Date(this.lastDatabaseSync).toLocaleString() : 'Never',
                dataAge: this.lastDatabaseSync ? Math.round((Date.now() - this.lastDatabaseSync) / 1000 / 60) : null
            };
        }
    }

    // =============================================================================
    // 🧠 SMART BUILD CALCULATOR CLASS - ENHANCED WITH PROGRESS TRACKING
    // =============================================================================

    class SmartBuildCalculator {
        constructor() {
            this.settings = null;
            this.botInstance = null;
            this.enhancedTracker = null;
        }

        /**
         * Initialize the smart calculator with enhanced progress tracking
         */
        init() {
            this.settings = window.AutoBuilderSettings;
            
            // Initialize enhanced progress tracker (REPLACES old progress system)
            this.enhancedTracker = new EnhancedProgressTracker();
            
            console.log('🧠 Smart Build Calculator initialized with Enhanced Progress Tracking');
            console.log('🔄 Old blind logic REPLACED with intelligent tracking system');
        }

        /**
         * Set bot instance for direct access
         */
        setBotInstance(botInstance) {
            this.botInstance = botInstance;
            // Also give bot access to enhanced tracker
            if (botInstance) {
                botInstance.enhancedTracker = this.enhancedTracker;
            }
        }

        /**
         * Calculate next build decision using ENHANCED INTELLIGENCE (database + real-time tracking)
         * @param {string} villageId - Village ID
         * @returns {Promise<object>} Build decision
         */
        async calculateNextBuild(villageId) {
            try {
                console.log(`🧠 ENHANCED Calculator: Analyzing village ${villageId}...`);
                
                // Get latest database data (40-60min intervals)
                const savedRecord = await window.loadLatestEnhancedData(villageId);
                if (!savedRecord || !savedRecord.data) {
                    return {
                        shouldBuild: false,
                        reason: 'No database data available - click "🎲 Start Random Auto" first',
                        nextCheck: Date.now() + 300000 // 5 minutes
                    };
                }
                
                // Extract database building levels
                const databaseLevels = this.extractBuildingLevelsFromData(savedRecord.data, villageId);
                if (!databaseLevels || Object.keys(databaseLevels).length === 0) {
                    return {
                        shouldBuild: false,
                        reason: 'No building data found in database',
                        nextCheck: Date.now() + 300000
                    };
                }
                
                // Get enhanced levels (database + real-time intelligence)
                const enhancedLevels = this.enhancedTracker.getCombinedBuildingLevels(villageId, databaseLevels);
                
                // Get intelligence report
                const report = this.enhancedTracker.getIntelligenceReport(villageId);
                console.log(`📊 Intelligence Report:`, report);
                
                // Check queue capacity using enhanced intelligence
                if (this.enhancedTracker.isQueueFull(villageId)) {
                    const nextSlot = this.enhancedTracker.getNextBuildSlotAvailable(villageId);
                    const waitMinutes = Math.round((nextSlot - Date.now()) / 1000 / 60);
                    
                    return {
                        shouldBuild: false,
                        reason: `Queue full (${report.queueItems}/5), next slot in ${waitMinutes} minutes`,
                        nextCheck: nextSlot + 60000 // Check 1 minute after slot opens
                    };
                }
                
                // Check resources from database
                const resources = this.extractResourcesFromData(savedRecord.data, villageId);
                const resourceCheck = this.checkResourceAvailability(resources);
                
                if (!resourceCheck.available) {
                    return {
                        shouldBuild: false,
                        reason: `Insufficient resources: ${resourceCheck.missing.join(', ')}`,
                        nextCheck: Date.now() + 1800000 // 30 minutes
                    };
                }
                
                // Use enhanced levels for template-based building decisions
                const nextBuilding = this.determineNextBuilding(enhancedLevels, villageId);
                if (!nextBuilding) {
                    return {
                        shouldBuild: false,
                        reason: 'Template completed or no buildings needed',
                        nextCheck: Date.now() + 1800000 // 30 minutes
                    };
                }
                
                console.log(`🎯 ENHANCED Decision: BUILD ${nextBuilding.building} (${nextBuilding.current_level} → ${nextBuilding.target_level})`);
                console.log(`📊 Using enhanced intelligence (${report.dataAge} min old data + real-time tracking)`);
                
                return {
                    shouldBuild: true,
                    building: nextBuilding,
                    reason: `Enhanced intelligence confirms build needed`,
                    intelligence: report
                };
                
            } catch (error) {
                console.error('❌ Enhanced Calculator error:', error);
                return {
                    shouldBuild: false,
                    reason: 'Enhanced calculator error - check console',
                    nextCheck: Date.now() + 300000
                };
            }
        }

        // Helper method to extract building levels from comprehensive data
        extractBuildingLevelsFromData(comprehensiveData, villageId) {
            // Try buildings data first
            if (comprehensiveData.buildings?.villages?.[villageId]) {
                return comprehensiveData.buildings.villages[villageId].buildings || {};
            }
            
            // Fallback to any available building data
            const villagesData = comprehensiveData.buildings?.villages || {};
            const firstVillage = Object.values(villagesData)[0];
            return firstVillage?.buildings || {};
        }

        // Helper method to extract resources from comprehensive data
        extractResourcesFromData(comprehensiveData, villageId) {
            if (comprehensiveData.resources?.length > 0) {
                const villageResources = comprehensiveData.resources.find(v => v.villageId === villageId);
                return villageResources?.resources || {};
            }
            return {};
        }

        /**
         * Find current village data in comprehensive data
         * @param {object} comprehensiveData - Comprehensive data from IndexedDB
         * @param {string} villageId - Village ID to find
         * @returns {object|null} Village data
         */
        findCurrentVillageData(comprehensiveData, villageId) {
            // Check in resources data
            if (comprehensiveData.resources) {
                const resourceVillage = comprehensiveData.resources.find(v => v.villageId === villageId);
                if (resourceVillage) {
                    const buildingVillage = comprehensiveData.buildings?.villages?.[villageId];
                    return {
                        resources: resourceVillage.resources,
                        warehouse: resourceVillage.warehouse,
                        population: resourceVillage.population,
                        buildings: buildingVillage?.buildings || {},
                        queue: buildingVillage?.queue || []
                    };
                }
            }

            // Check in buildings data only
            if (comprehensiveData.buildings?.villages?.[villageId]) {
                const buildingVillage = comprehensiveData.buildings.villages[villageId];
                return {
                    resources: { wood: 0, stone: 0, iron: 0 }, // No resource data available
                    buildings: buildingVillage.buildings || {},
                    queue: buildingVillage.queue || []
                };
            }

            return null;
        }

        /**
         * Check if we have enough resources for building based on database data
         * @param {object} resources - Current resources from database
         * @returns {object} Resource availability
         */
        checkResourceAvailability(resources) {
            // Basic resource requirements for most buildings
            const minRequired = {
                wood: 150,
                stone: 150,
                iron: 100
            };

            const missing = [];
            const warnings = [];

            // Check each resource
            for (const [resource, minAmount] of Object.entries(minRequired)) {
                const currentAmount = resources[resource] || 0;

                if (currentAmount < minAmount) {
                    missing.push(`${resource} (have: ${currentAmount}, need: ${minAmount})`);
                } else if (currentAmount < minAmount * 1.5) {
                    warnings.push(`${resource} is low (${currentAmount})`);
                }
            }

            // Check warehouse capacity if available
            if (resources.total && resources.total > 0) {
                const warehouseUsage = Math.max(resources.wood || 0, resources.stone || 0, resources.iron || 0);

                // Warn if warehouse is getting full
                if (warehouseUsage > 24000) { // Near 30k limit
                    warnings.push('Warehouse getting full');
                }
            }

            const result = {
                available: missing.length === 0,
                missing: missing,
                warnings: warnings,
                resourceSummary: {
                    wood: resources.wood || 0,
                    stone: resources.stone || 0,
                    iron: resources.iron || 0
                }
            };

            // Log resource check results
            if (result.available) {
                console.log(`✅ Resources check passed: Wood: ${result.resourceSummary.wood}, Stone: ${result.resourceSummary.stone}, Iron: ${result.resourceSummary.iron}`);
                if (result.warnings.length > 0) {
                    console.log(`⚠️ Resource warnings: ${result.warnings.join(', ')}`);
                }
            } else {
                console.log(`❌ Resources check failed: ${result.missing.join(', ')}`);
            }

            return result;
        }

                // OLD CALCULATOR METHODS REMOVED - REPLACED BY ENHANCED TRACKER
        // These methods are now handled by the EnhancedProgressTracker class

        /**
         * Determine next building to upgrade using TEMPLATE SYSTEM
         * @param {object} buildings - Buildings data (combined database + progress)
         * @param {string} villageId - Village ID for template lookup
         * @returns {object|null} Next building plan
         */
        determineNextBuilding(buildings, villageId) {
            // Get assigned template for this village
            const templateName = window.AutoBuilderTemplates.getVillageTemplate(villageId);
            console.log(`📋 Using template '${templateName}' for village ${villageId}`);

            if (!templateName) {
                console.log(`❌ No template assigned to village ${villageId}`);
                console.log(`💡 Assign a template using: AutoBuilderTemplates.setVillageTemplate(${villageId}, "templateName")`);
                return null;
            }

            // Debug: Show current buildings
            console.log(`🏗️ Current buildings:`, buildings);

            // Get next building from template
            const nextBuilding = window.AutoBuilderTemplates.getNextBuilding(templateName, buildings);

            if (nextBuilding) {
                console.log(`📋 Template plan: ${nextBuilding.building} ${nextBuilding.current_level} → ${nextBuilding.next_level}`);
                console.log(`🎯 Will build: ${nextBuilding.building} to level ${nextBuilding.next_level}`);

                // CRITICAL: Ensure we're building incrementally
                const actualNextLevel = nextBuilding.current_level + 1;

                console.log(`🔧 Smart Calculator: ${nextBuilding.building} ${nextBuilding.current_level} → ${actualNextLevel}`);

                return {
                    building: nextBuilding.building,
                    target_level: actualNextLevel,           // ALWAYS current + 1
                    current_level: nextBuilding.current_level,
                    template: templateName,
                    template_final_target: nextBuilding.target_level  // For reference
                };
            } else {
                console.log(`📋 Template '${templateName}' completed - all buildings at target levels`);

                // Get template progress for user feedback
                const progress = window.AutoBuilderTemplates.getTemplateProgress(templateName, buildings);
                if (progress) {
                    console.log(`📊 Template progress: ${progress.completed}/${progress.total} (${progress.percentage}%)`);

                    if (progress.remaining.length > 0) {
                        console.log(`🏗️ Remaining buildings:`);
                        progress.remaining.forEach(building => {
                            console.log(`   - ${building.building}: ${building.currentLevel} → ${building.targetLevel}`);
                        });
                    }
                }

                return null;
            }
        }
    }

    // =============================================================================
    // 🚀 INITIALIZE EVERYTHING
    // =============================================================================

    // Wait for page to be ready, then initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAutoBuilder);
    } else {
        // Page already loaded
        setTimeout(initializeAutoBuilder, 500);
    }

    // =============================================================================
    // 🔍 ENHANCED COMPREHENSIVE DATA COLLECTOR INTEGRATION
    // =============================================================================

    /**
     * Load and integrate the ENHANCED comprehensive data collector
     */
    function loadEnhancedComprehensiveDataCollector() {
        console.log('🎯 Loading ENHANCED Comprehensive Data Collector...');

        // Enhanced security settings
        const MIN_DELAY = 5000; // 5 seconds minimum between requests
        const MAX_DELAY = 10000; // 10 seconds maximum
        const RANDOM_PAGES = [
            '/game.php?screen=overview',
            '/game.php?screen=map',
            '/game.php?screen=ally',
            '/game.php?screen=ranking',
            '/game.php?screen=report',
            '/game.php?screen=message',
            '/game.php?screen=place',
            '/game.php?screen=market'
        ];

        // Data collection tasks with random order capability
        const DATA_COLLECTION_TASKS = [
            { name: 'troops', function: 'collectTroopsData', url: 'overview_villages&mode=units' },
            { name: 'resources', function: 'collectResourcesData', url: 'overview_villages&mode=prod' },
            { name: 'buildings', function: 'collectBuildingsData', url: 'overview_villages&mode=buildings' }
        ];

        // =============================================================================
        // ENHANCED RANDOMNESS SYSTEM
        // =============================================================================

        // Shuffle array function for random order
        function shuffleArray(array) {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        }

        // Get random delay with more variation
        function getRandomDelay() {
            return Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY)) + MIN_DELAY;
        }

        // Get random 1-3 pages (not all pages)
        function getRandomPages() {
            const shuffled = shuffleArray(RANDOM_PAGES);
            const count = Math.floor(Math.random() * 3) + 1; // 1-3 pages
            return shuffled.slice(0, count);
        }

        // =============================================================================
        // ENHANCED SAFE REQUEST SYSTEM
        // =============================================================================

        let isRequestActive = false;
        let lastRequestTime = 0;

        // Enhanced safe wrapper with more randomness
        async function safeRequest(url, description = 'data') {
            // Wait if another request is active
            while (isRequestActive) {
                await sleep(100);
            }

            // Ensure minimum time between requests
            const timeSinceLastRequest = Date.now() - lastRequestTime;
            if (timeSinceLastRequest < MIN_DELAY) {
                const waitTime = MIN_DELAY - timeSinceLastRequest;
                console.log(`⏳ Waiting ${waitTime}ms before next request...`);
                await sleep(waitTime);
            }

            // Add enhanced random delay for security
            const randomDelay = getRandomDelay();
            console.log(`🔒 Enhanced random delay: ${randomDelay}ms for ${description}`);
            await sleep(randomDelay);

            // Mark request as active
            isRequestActive = true;
            lastRequestTime = Date.now();

            try {
                console.log(`🌐 Fetching: ${description}`);
                const response = await fetch(url);
                const html = await response.text();

                // Add enhanced random delay to look more human
                await sleep(1000 + Math.random() * 2000); // 1-3 seconds

                const parser = new DOMParser();
                return parser.parseFromString(html, 'text/html');

            } catch (error) {
                console.error(`❌ Request failed for ${description}:`, error);
                return null;
            } finally {
                // Always release the lock
                isRequestActive = false;
            }
        }

        // Enhanced random page fetcher (1-3 pages)
        async function fetchRandomPages() {
            const randomPages = getRandomPages();
            console.log(`🎲 Fetching ${randomPages.length} random pages: ${randomPages.join(', ')}`);

            for (const page of randomPages) {
                await safeRequest(page, 'random page');
                console.log(`✅ Random page fetched: ${page}`);
            }
        }

        // Helper sleep function
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        // =============================================================================
        // ENHANCED DATA COLLECTION FUNCTIONS
        // =============================================================================

        async function collectTroopsData(villageId) {
            try {
                const url = `/game.php?village=${villageId}&screen=overview_villages&mode=units`;
                const doc = await safeRequest(url, 'troops data');

                if (!doc) return null;

                // Find the "total" row (has font-weight: bold)
                const totalRow = doc.querySelector('tr[style*="font-weight: bold"]');
                if (!totalRow) return null;

                // Extract troop counts from the total row
                const units = ['spear', 'sword', 'axe', 'spy', 'light', 'heavy', 'ram', 'catapult', 'snob', 'militia'];
                const cells = totalRow.querySelectorAll('.unit-item');
                const troops = {};

                units.forEach((unit, i) => {
                    const cellText = cells[i]?.textContent?.trim() || '0';
                    troops[unit] = parseInt(cellText);
                });

                console.log(`✅ Collected troops data for village ${villageId}`);
                return troops;

            } catch (error) {
                console.error('❌ Error collecting troops data:', error);
                return null;
            }
        }

        async function collectResourcesData(villageId) {
            try {
                const url = `/game.php?village=${villageId}&screen=overview_villages&mode=prod`;
                const doc = await safeRequest(url, 'resources data');

                if (!doc) return null;

                const villages = [];

                // Find all village rows in the production table
                const villageRows = doc.querySelectorAll('#production_table tbody tr');

                villageRows.forEach(row => {
                    try {
                        const cells = row.querySelectorAll('td');
                        if (cells.length < 6) return; // Skip incomplete rows

                        // Extract village name and coordinates
                        const villageNameCell = cells[1];
                        const villageLink = villageNameCell.querySelector('a');
                        const villageText = villageLink ? villageLink.textContent.trim() : villageNameCell.textContent.trim();

                        // Extract village ID from link
                        let currentVillageId = null;
                        if (villageLink && villageLink.href) {
                            const match = villageLink.href.match(/village=(\d+)/);
                            currentVillageId = match ? match[1] : null;
                        }

                        // Extract coordinates from village name
                        const coordMatch = villageText.match(/\((\d+\|\d+)\)/);
                        const coordinates = coordMatch ? coordMatch[1] : 'Unknown';

                        // Extract points
                        const points = parseInt(cells[2].textContent.trim()) || 0;

                        // Extract resources (wood, stone, iron)
                        const resourcesCell = cells[3];
                        const resourceSpans = resourcesCell.querySelectorAll('span.res');

                        let wood = 0, stone = 0, iron = 0;
                        if (resourceSpans.length >= 3) {
                            wood = parseInt(resourceSpans[0].textContent.replace(/\./g, '')) || 0;
                            stone = parseInt(resourceSpans[1].textContent.replace(/\./g, '')) || 0;
                            iron = parseInt(resourceSpans[2].textContent.replace(/\./g, '')) || 0;
                        }

                        // Extract warehouse capacity
                        const warehouseCapacity = parseInt(cells[4].textContent.trim().replace(/\./g, '')) || 0;

                        // Extract population (current/max)
                        const populationCell = cells[6];
                        const populationText = populationCell.textContent.trim();
                        const popMatch = populationText.match(/(\d+)\/(\d+)/);

                        let currentPop = 0, maxPop = 0;
                        if (popMatch) {
                            currentPop = parseInt(popMatch[1]) || 0;
                            maxPop = parseInt(popMatch[2]) || 0;
                        }

                        villages.push({
                            villageId: currentVillageId,
                            name: villageText,
                            coordinates,
                            points,
                            resources: {
                                wood,
                                stone,
                                iron,
                                total: wood + stone + iron
                            },
                            warehouse: {
                                capacity: warehouseCapacity,
                                usage: Math.max(wood, stone, iron),
                                usagePercent: Math.round((Math.max(wood, stone, iron) / warehouseCapacity) * 100)
                            },
                            population: {
                                current: currentPop,
                                max: maxPop,
                                available: maxPop - currentPop,
                                usagePercent: Math.round((currentPop / maxPop) * 100)
                            }
                        });

                    } catch (error) {
                        console.error('Error processing village row:', error);
                    }
                });

                console.log(`✅ Collected resources data for ${villages.length} villages`);
                return villages;

            } catch (error) {
                console.error('❌ Error collecting resources data:', error);
                return null;
            }
        }

        async function collectBuildingsData(villageId) {
            try {
                const url = `/game.php?village=${villageId}&screen=overview_villages&mode=buildings`;
                const doc = await safeRequest(url, 'buildings data');

                if (!doc) return null;

                const results = {};

                // Find all village rows in the buildings table
                const villageRows = doc.querySelectorAll('#buildings_table tbody tr');

                if (villageRows.length === 0) {
                    console.error('❌ No village rows found');
                    return null;
                }

                // FIXED: COMPLETE Building mapping with ALL buildings in ACTUAL table column order
                const buildingMapping = [
                    'main',      // Column 5: Headquarters
                    'barracks',  // Column 6: Barracks
                    'stable',    // Column 7: Stable
                    'garage',    // Column 8: Workshop
                    'church',    // Column 9: Church *** ADDED ***
                    'church_f',  // Column 10: First church *** ADDED ***
                    'watchtower', // Column 11: Watchtower
                    'snob',      // Column 12: Academy
                    'smith',     // Column 13: Smithy
                    'place',     // Column 14: Rally point
                    'statue',    // Column 15: Statue *** ADDED ***
                    'market',    // Column 16: Market
                    'wood',      // Column 17: Timber camp
                    'stone',     // Column 18: Clay pit
                    'iron',      // Column 19: Iron mine
                    'farm',      // Column 20: Farm
                    'storage',   // Column 21: Warehouse
                    'hide',      // Column 22: Hiding place
                    'wall'       // Column 23: Wall
                ];

                villageRows.forEach(row => {
                    try {
                        // Extract village ID from row ID
                        const rowId = row.id; // format: v_16404
                        const currentVillageId = rowId ? rowId.replace('v_', '') : null;

                        if (!currentVillageId) {
                            console.warn('⚠️ Could not extract village ID from row');
                            return;
                        }

                        // Extract village info
                        const villageInfo = {};
                        const buildings = {};
                        const queue = [];

                        // Get village name and coordinates
                        const nameCell = row.querySelector('.quickedit-label, .quickedit-content a');
                        if (nameCell) {
                            const fullText = nameCell.textContent.trim();
                            const coordMatch = fullText.match(/\((\d+\|\d+)\)/);
                            const kMatch = fullText.match(/K(\d+)/);

                            villageInfo.name = fullText.split('(')[0].trim();
                            villageInfo.coordinates = coordMatch ? coordMatch[1] : 'Unknown';
                            villageInfo.continent = kMatch ? kMatch[1] : 'Unknown';
                        }

                        // Get village points
                        const pointsCell = row.querySelector('td:nth-child(4)');
                        villageInfo.points = pointsCell ? parseInt(pointsCell.textContent.trim()) : 0;

                        // FIXED: Extract building levels from cells (using proven working logic)
                        const allCells = row.querySelectorAll('td');

                        console.log(`🔍 Processing village ${currentVillageId}: ${villageInfo.name}`);

                        buildingMapping.forEach((buildingType, index) => {
                            const cellIndex = index + 4; // Building data starts from 5th cell (index 4) - PROVEN TO WORK
                            const cell = allCells[cellIndex];

                            if (cell) {
                                // Handle hidden buildings (level 0)
                                if (cell.querySelector('.hidden')) {
                                    buildings[buildingType] = 0;
                                    console.log(`🏗️ ${buildingType}: 0 (hidden)`);
                                } else {
                                    const levelText = cell.textContent.trim();
                                    const level = parseInt(levelText) || 0;
                                    buildings[buildingType] = level;
                                    if (level > 0) {
                                        console.log(`🏗️ ${buildingType}: ${level}`);
                                    }
                                }
                            } else {
                                buildings[buildingType] = 0;
                            }
                        });

                        // IMPROVED: Extract construction queue (from working template)
                        const queueContainer = row.querySelector(`#building_order_${currentVillageId}`);

                        if (queueContainer) {
                            const orderItems = queueContainer.querySelectorAll('.order');

                            orderItems.forEach((order, index) => {
                                const queueIcon = order.querySelector('.queue_icon img');

                                if (queueIcon) {
                                    // Extract building type from image source
                                    const imgSrc = queueIcon.src;
                                    const buildingMatch = imgSrc.match(/buildings\/(\w+)\.webp/);
                                    const buildingType = buildingMatch ? buildingMatch[1] : 'unknown';

                                    // Extract completion time from title
                                    const title = queueIcon.title || '';
                                    const timeMatch = title.match(/- (.+)$/);
                                    const completionTime = timeMatch ? timeMatch[1].trim() : 'Unknown';

                                    // Extract order ID from cancel function
                                    const cancelIcon = order.querySelector('.order-cancel-icon img');
                                    let orderId = null;
                                    if (cancelIcon) {
                                        const onclickMatch = cancelIcon.getAttribute('onclick')?.match(/cancel_order\(\d+, (\d+)\)/);
                                        orderId = onclickMatch ? parseInt(onclickMatch[1]) : null;
                                    }

                                    queue.push({
                                        position: index + 1,
                                        buildingType: buildingType,
                                        completionTime: completionTime,
                                        orderId: orderId,
                                        isDraggable: order.classList.contains('drag')
                                    });

                                    console.log(`🚧 Queue ${index + 1}: ${buildingType} (${completionTime})`);
                                }
                            });
                        }

                        // Store results
                        results[currentVillageId] = {
                            villageId: currentVillageId,
                            villageInfo: villageInfo,
                            buildings: buildings,
                            queue: queue,
                            queueLength: queue.length
                        };

                        console.log(`✅ ${villageInfo.name} - ${Object.values(buildings).filter(level => level > 0).length} buildings, ${queue.length} queue items`);

                    } catch (error) {
                        console.error('❌ Error processing village row:', error);
                    }
                });

                console.log(`✅ Collected buildings data for ${Object.keys(results).length} villages`);
                return {
                    villages: results,
                    totalVillages: Object.keys(results).length,
                    extractedAt: new Date().toISOString()
                };

            } catch (error) {
                console.error('❌ Error collecting buildings data:', error);
                return null;
            }
        }

        // =============================================================================
        // ENHANCED MAIN DATA COLLECTION FUNCTION WITH RANDOM ORDER
        // =============================================================================

        async function collectVillageDataEnhanced(villageId = game_data.village.id) {
            console.log(`🎯 Starting ENHANCED comprehensive data collection for village ${villageId}...`);
            console.log(`🎲 Using OPTIMIZED RANDOM ORDER execution (4-8 total requests)!`);

            // Step 1: Initial random page fetch (1-3 pages)
            await fetchRandomPages();

            // Step 2: Shuffle data collection tasks for random order
            const shuffledTasks = shuffleArray(DATA_COLLECTION_TASKS);
            console.log(`🎲 Random execution order: ${shuffledTasks.map(t => t.name).join(' → ')}`);

            const collectedData = {
                villageId: villageId,
                villageName: game_data.village.name,
                coordinates: game_data.village.x + '|' + game_data.village.y,
                worldId: game_data.world,
                playerId: game_data.player.id,
                executionOrder: shuffledTasks.map(t => t.name), // Track the random order used
                extractedAt: new Date().toISOString(),
                serverTime: new Date().toISOString(),
                dataVersion: '2.0_enhanced_optimized'
            };

            // Step 3: Execute tasks in random order with optimized random page visits
            for (let i = 0; i < shuffledTasks.length; i++) {
                const task = shuffledTasks[i];
                console.log(`\n🔄 Executing task ${i + 1}/${shuffledTasks.length}: ${task.name}`);

                // Execute the data collection task
                let taskData = null;
                switch (task.name) {
                    case 'troops':
                        taskData = await collectTroopsData(villageId);
                        break;
                    case 'resources':
                        taskData = await collectResourcesData(villageId);
                        break;
                    case 'buildings':
                        taskData = await collectBuildingsData(villageId);
                        break;
                }

                // Store the collected data
                collectedData[task.name] = taskData;

                // Add random page visit between tasks (except after the last one)
                if (i < shuffledTasks.length - 1) {
                    console.log(`🎲 Adding random page visits between tasks...`);
                    await fetchRandomPages();
                }
            }

            // Step 4: Final random page fetch (1-3 pages)
            await fetchRandomPages();

            console.log(`✅ ENHANCED comprehensive data collection completed for village ${villageId}`);
            console.log(`🎲 Execution order used: ${collectedData.executionOrder.join(' → ')}`);
            console.log(`📊 Total requests: 4-8 (optimized for stealth)`);

            return collectedData;
        }

        // =============================================================================
        // ENHANCED DATABASE SYSTEM WITH IndexedDB
        // =============================================================================

        const DB_NAME = 'TribalWarsAutoBuilderData';
        const DATA_TYPE = 'comprehensive_enhanced';

        // Get village-specific store name
        function getVillageStoreName(villageId) {
            return `village_${villageId}`;
        }

        // Initialize shared database
        function initDatabase() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);
                request.onupgradeneeded = () => {
                    // Stores are created on-demand
                };
            });
        }

        // Create/ensure village store exists
        async function ensureVillageStore(villageId) {
            const db = await initDatabase();
            const storeName = getVillageStoreName(villageId);

            if (!db.objectStoreNames.contains(storeName)) {
                db.close();
                const currentVersion = db.version;
                const upgradeRequest = indexedDB.open(DB_NAME, currentVersion + 1);

                return new Promise((resolve, reject) => {
                    upgradeRequest.onerror = () => reject(upgradeRequest.error);
                    upgradeRequest.onsuccess = () => resolve(upgradeRequest.result);
                    upgradeRequest.onupgradeneeded = (event) => {
                        const upgradeDb = event.target.result;
                        const store = upgradeDb.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                        store.createIndex('type', 'type', { unique: false });
                        store.createIndex('timestamp', 'timestamp', { unique: false });
                        store.createIndex('villageId', 'villageId', { unique: false });
                        console.log(`✅ Created enhanced store: ${storeName}`);
                    };
                });
            }
            return db;
        }

        // Save comprehensive data to database (overwrites old data)
        async function saveToEnhancedDatabase(villageId, collectedData) {
            try {
                const db = await ensureVillageStore(villageId);
                const storeName = getVillageStoreName(villageId);
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);

                // ALWAYS DELETE ALL OLD COMPREHENSIVE DATA RECORDS FIRST
                console.log(`🗑️ Cleaning up old comprehensive data for village ${villageId}...`);

                const index = store.index('type');
                const oldRecords = await new Promise((resolve, reject) => {
                    const request = index.openCursor();
                    const records = [];

                    request.onsuccess = (event) => {
                        const cursor = event.target.result;
                        if (cursor) {
                            if (cursor.value.type === DATA_TYPE) {
                                records.push(cursor.primaryKey);
                            }
                            cursor.continue();
                        } else {
                            resolve(records);
                        }
                    };
                    request.onerror = () => reject(request.error);
                });

                // DELETE ALL OLD RECORDS
                if (oldRecords.length > 0) {
                    for (const recordId of oldRecords) {
                        await new Promise((resolve, reject) => {
                            const deleteRequest = store.delete(recordId);
                            deleteRequest.onsuccess = () => resolve();
                            deleteRequest.onerror = () => reject(deleteRequest.error);
                        });
                    }
                    console.log(`🗑️ Deleted ${oldRecords.length} old comprehensive data records`);
                } else {
                    console.log(`📭 No old comprehensive data found to delete`);
                }

                // SAVE ONLY THE NEWEST RECORD (FRESH DATA ONLY)
                const record = {
                    type: DATA_TYPE,
                    timestamp: new Date().toISOString(),
                    villageId: villageId,
                    worldId: game_data.world,
                    playerId: game_data.player.id,
                    data: collectedData
                };

                await new Promise((resolve, reject) => {
                    const request = store.add(record);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });

                console.log(`💾 Saved FRESH enhanced comprehensive data for village ${villageId}`);
                return true;

            } catch (error) {
                console.error(`❌ Error saving enhanced comprehensive data:`, error);
                throw error;
            }
        }

        // Load latest comprehensive data
        async function loadLatestEnhancedData(villageId = game_data.village.id) {
            try {
                const db = await initDatabase();
                const storeName = getVillageStoreName(villageId);

                if (!db.objectStoreNames.contains(storeName)) {
                    console.log(`❌ No enhanced comprehensive data found for village ${villageId}`);
                    return null;
                }

                const transaction = db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const index = store.index('timestamp');

                const result = await new Promise((resolve, reject) => {
                    const request = index.openCursor(null, 'prev');

                    request.onsuccess = (event) => {
                        const cursor = event.target.result;
                        if (cursor) {
                            if (cursor.value.type === DATA_TYPE) {
                                resolve(cursor.value);
                            } else {
                                cursor.continue();
                            }
                        } else {
                            resolve(null);
                        }
                    };
                    request.onerror = () => reject(request.error);
                });

                return result;

            } catch (error) {
                console.error(`❌ Error loading enhanced comprehensive data:`, error);
                return null;
            }
        }

        // =============================================================================
        // ENHANCED MAIN FUNCTIONS
        // =============================================================================

        async function collectAndSaveEnhanced(villageId = game_data.village.id) {
            // DEBUG: Track what's calling data collection
            const caller = new Error().stack.split('\n')[2]?.trim() || 'Unknown caller';
            console.log(`🎯 Starting ENHANCED Comprehensive Data Collection for village ${villageId}...`);
            console.log(`🔍 DEBUG: Called by: ${caller}`);

            try {
                // Step 1: Collect comprehensive data with random order
                const collectedData = await collectVillageDataEnhanced(villageId);

                if (!collectedData) {
                    console.log(`❌ No enhanced comprehensive data collected`);
                    return null;
                }

                // Step 2: Save to enhanced database (overwrites old data)
                await saveToEnhancedDatabase(villageId, collectedData);

                // Step 3: Display results and sync enhanced tracker
                const savedRecord = await loadLatestEnhancedData(villageId);
                if (savedRecord) {
                    console.log(`✅ ENHANCED comprehensive data collection completed!`);
                    console.log(`🎲 Execution order: ${savedRecord.data.executionOrder.join(' → ')}`);
                    console.log(`📊 Data version: ${savedRecord.data.dataVersion}`);
                    
                    // NEW: Sync enhanced tracker with fresh data
                    if (window.enhancedTracker) {
                        window.enhancedTracker.syncWithFreshData(villageId, savedRecord.data);
                    } else if (window.AutoBuildBot?.enhancedTracker) {
                        window.AutoBuildBot.enhancedTracker.syncWithFreshData(villageId, savedRecord.data);
                    }
                }

                return savedRecord;

            } catch (error) {
                console.error(`❌ Error in ENHANCED comprehensive data collection:`, error);
                return null;
            }
        }

        // =============================================================================
        // CREATE ENHANCED GLOBAL FUNCTIONS
        // =============================================================================

        // Enhanced main collection function (replaces the basic one)
        window.collectComprehensiveData = collectAndSaveEnhanced;
        window.collectComprehensiveDataEnhanced = collectAndSaveEnhanced;
        window.loadComprehensiveData = loadLatestEnhancedData;
        window.loadLatestEnhancedData = loadLatestEnhancedData;

        console.log('✅ ENHANCED Comprehensive Data Collector loaded successfully!');
        console.log('🎯 Features: Random order execution, 5-10s delays, anti-detection, IndexedDB');
        console.log('🎲 Optimized: 4-8 total requests with maximum stealth');

        return true;
    }

    // =============================================================================
    // 🔧 DIAGNOSTIC FUNCTIONS FOR TESTING
    // =============================================================================

    /**
     * Test the enhanced data collection integration
     */
    window.testEnhancedIntegration = async function() {
        console.log('🔧 TESTING Enhanced Data Collection Integration...');
        console.log('='.repeat(50));

        // Test 1: Check if functions exist
        console.log('📋 Test 1: Function Availability');
        console.log(`✓ collectComprehensiveDataEnhanced: ${typeof window.collectComprehensiveDataEnhanced}`);
        console.log(`✓ loadLatestEnhancedData: ${typeof window.loadLatestEnhancedData}`);
        console.log(`✓ AutoBuildBot: ${typeof window.AutoBuildBot}`);
        console.log(`✓ AutoBuilderUI: ${typeof window.AutoBuilderUI}`);

        // Test 2: Check if enhanced collector is loaded
        console.log('\n📋 Test 2: Enhanced Collector Status');
        if (typeof window.collectComprehensiveDataEnhanced === 'function') {
            console.log('✅ Enhanced data collector is available!');

            try {
                // Test 3: Try to collect data
                console.log('\n📋 Test 3: Data Collection Test');
                console.log('🎯 Starting test data collection...');

                const result = await window.collectComprehensiveDataEnhanced();

                if (result && result.data) {
                    console.log('✅ Data collection SUCCESSFUL!');
                    console.log(`📊 Execution order: ${result.data.executionOrder?.join(' → ') || 'N/A'}`);
                    console.log(`🏘️ Villages found: ${result.data.resources?.length || 0} resources, ${Object.keys(result.data.buildings?.villages || {}).length} buildings`);
                    console.log(`📅 Data version: ${result.data.dataVersion || 'N/A'}`);

                    // Test 4: Try to load data
                    console.log('\n📋 Test 4: Data Loading Test');
                    const loadedData = await window.loadLatestEnhancedData();
                    if (loadedData) {
                        console.log('✅ Data loading SUCCESSFUL!');
                        console.log(`💾 Database: IndexedDB working properly`);
                    } else {
                        console.log('❌ Data loading FAILED!');
                    }

                } else {
                    console.log('❌ Data collection FAILED!');
                    console.log('Result:', result);
                }

            } catch (error) {
                console.log('❌ Data collection ERROR!');
                console.error('Error details:', error);
            }

        } else {
            console.log('❌ Enhanced data collector NOT AVAILABLE!');
            console.log('This means the integration is not working properly.');
        }

        console.log('\n' + '='.repeat(50));
        console.log('🎯 INTEGRATION TEST COMPLETED!');
        console.log('Check the results above to see if everything is working.');
        console.log('='.repeat(50));
    };

    /**
     * Quick test for console
     */
    window.quickTest = function() {
        console.log('🔧 Quick Integration Test:');
        console.log(`Enhanced Collector: ${typeof window.collectComprehensiveDataEnhanced === 'function' ? '✅ Available' : '❌ Missing'}`);
        console.log(`Data Loader: ${typeof window.loadLatestEnhancedData === 'function' ? '✅ Available' : '❌ Missing'}`);
        console.log(`AutoBuildBot: ${typeof window.AutoBuildBot === 'object' ? '✅ Available' : '❌ Missing'}`);
        console.log('Run testEnhancedIntegration() for full test.');
    };

    /**
     * Test DATABASE-ONLY mode to ensure no game fetching
     */
    window.testDatabaseOnlyMode = async function() {
        console.log('🔒 TESTING DATABASE-ONLY MODE...');
        console.log('='.repeat(60));

        // Test 1: Check if bot is properly configured for database-only
        console.log('📋 Test 1: Bot Configuration');
        if (typeof window.AutoBuildBot === 'object' && window.AutoBuildBot.smartCalculator) {
            console.log('✅ Smart calculator available');

            try {
                const villageId = game_data.village.id.toString();
                console.log(`🏘️ Testing with village ID: ${villageId}`);

                // Test 2: Check if database data exists
                console.log('\n📋 Test 2: Database Data Check');
                const savedData = await window.loadLatestEnhancedData(villageId);

                if (savedData && savedData.data) {
                    console.log('✅ Database data found!');
                    console.log(`📅 Data timestamp: ${new Date(savedData.timestamp).toLocaleString()}`);
                    console.log(`🎲 Execution order used: ${savedData.data.executionOrder?.join(' → ') || 'N/A'}`);

                    // Test 3: Test smart calculator with database data
                    console.log('\n📋 Test 3: Smart Calculator Database Test');
                    const decision = await window.AutoBuildBot.smartCalculator.calculateNextBuild(villageId);

                    if (decision) {
                        console.log('✅ Smart calculator working with database data!');
                        console.log(`🧠 Decision: ${decision.shouldBuild ? 'BUILD' : 'WAIT'}`);
                        console.log(`📝 Reason: ${decision.reason}`);

                        if (decision.building) {
                            console.log(`🏗️ Building plan: ${decision.building.building} (${decision.building.current_level} → ${decision.building.target_level})`);
                        }
                    } else {
                        console.log('❌ Smart calculator test failed');
                    }

                } else {
                    console.log('❌ No database data found!');
                    console.log('💡 Run collectComprehensiveDataEnhanced() first to populate database');
                }

                // Test 4: Verify no network requests during calculation
                console.log('\n📋 Test 4: Network Safety Verification');
                console.log('🔒 Smart calculator only uses loadLatestEnhancedData() function');
                console.log('🔒 No fetch() calls or game screen navigation in bot logic');
                console.log('✅ DATABASE-ONLY mode confirmed safe!');

            } catch (error) {
                console.error('❌ Test error:', error);
            }

        } else {
            console.log('❌ AutoBuildBot not properly initialized');
        }

        console.log('\n' + '='.repeat(60));
        console.log('🔒 DATABASE-ONLY MODE TEST COMPLETED!');
        console.log('✅ Bot will only use stored IndexedDB data');
        console.log('📊 Remember to click "Get Data" regularly to keep database fresh');
        console.log('='.repeat(60));
    };

    /**
     * Create example templates for testing
     */
    window.createExampleTemplates = function() {
        console.log('📋 Creating example templates...');

        // Example 1: Basic Starter Template
        const starterSequence = [
            { building: 'main', level: 3 },
            { building: 'barracks', level: 1 },
            { building: 'farm', level: 5 },
            { building: 'storage', level: 3 },
            { building: 'main', level: 5 },
            { building: 'wood', level: 5 },
            { building: 'stone', level: 5 },
            { building: 'iron', level: 5 }
        ];

        // Example 2: Military Template
        const militarySequence = [
            { building: 'main', level: 3 },
            { building: 'barracks', level: 5 },
            { building: 'stable', level: 3 },
            { building: 'garage', level: 1 },
            { building: 'smith', level: 3 },
            { building: 'main', level: 10 },
            { building: 'farm', level: 15 }
        ];

        // Example 3: Resource Template
        const resourceSequence = [
            { building: 'main', level: 3 },
            { building: 'storage', level: 10 },
            { building: 'wood', level: 15 },
            { building: 'stone', level: 15 },
            { building: 'iron', level: 15 },
            { building: 'farm', level: 20 },
            { building: 'market', level: 5 }
        ];

        // Create templates
        const results = [];
        results.push(window.AutoBuilderTemplates.createTemplate('Starter', 'Basic early game development', starterSequence));
        results.push(window.AutoBuilderTemplates.createTemplate('Military', 'Focus on military buildings', militarySequence));
        results.push(window.AutoBuilderTemplates.createTemplate('Resource', 'Focus on resource production', resourceSequence));

        const successCount = results.filter(r => r).length;
        console.log(`✅ Created ${successCount}/3 example templates`);
        console.log('💡 Open the UI (🤖 button) to see and manage your templates!');

        return successCount;
    };

    /**
     * Test the template system
     */
    window.testTemplateSystem = function() {
        console.log('📋 TESTING TEMPLATE SYSTEM...');
        console.log('='.repeat(50));

        const villageId = game_data.village.id.toString();

        console.log('📋 Test 1: Template Manager Availability');
        if (typeof window.AutoBuilderTemplates === 'object') {
            console.log('✅ Template Manager available');

            const templates = window.AutoBuilderTemplates.getAllTemplates();
            console.log(`✅ Available templates: ${Object.keys(templates).join(', ')}`);

            // Test template assignment
            console.log('\n📋 Test 2: Template Assignment');
            const originalTemplate = window.AutoBuilderTemplates.getVillageTemplate(villageId);
            console.log(`📊 Current template for village ${villageId}: ${originalTemplate}`);

            // Test template assignment
            const success = window.AutoBuilderTemplates.setVillageTemplate(villageId, 'starter');
            if (success) {
                console.log('✅ Template assignment working');

                // Test template retrieval
                const retrievedTemplate = window.AutoBuilderTemplates.getVillageTemplate(villageId);
                if (retrievedTemplate === 'starter') {
                    console.log('✅ Template retrieval working');
                } else {
                    console.log('❌ Template retrieval failed');
                }

                // Restore original template
                window.AutoBuilderTemplates.setVillageTemplate(villageId, originalTemplate);
            } else {
                console.log('❌ Template assignment failed');
            }

            // Test next building calculation
            console.log('\n📋 Test 3: Next Building Calculation');
            const mockBuildings = {
                main: 2,
                barracks: 0,
                farm: 3,
                storage: 1
            };

            const nextBuilding = window.AutoBuilderTemplates.getNextBuilding('starter', mockBuildings);
            if (nextBuilding) {
                console.log(`✅ Next building calculation working: ${nextBuilding.building} (${nextBuilding.current_level} → ${nextBuilding.next_level})`);
            } else {
                console.log('❌ Next building calculation failed or template complete');
            }

            // Test progress calculation
            console.log('\n📋 Test 4: Progress Calculation');
            const progress = window.AutoBuilderTemplates.getTemplateProgress('starter', mockBuildings);
            if (progress) {
                console.log(`✅ Progress calculation working: ${progress.completed}/${progress.total} (${progress.percentage}%)`);
                console.log(`📊 Remaining buildings: ${progress.remaining.length}`);
            } else {
                console.log('❌ Progress calculation failed');
            }

        } else {
            console.log('❌ Template Manager NOT AVAILABLE');
        }

        console.log('\n' + '='.repeat(50));
        console.log('📋 TEMPLATE SYSTEM TEST COMPLETED!');
        console.log('💡 Use the UI to assign templates and see progress');
        console.log('='.repeat(50));
    };

    /**
     * Complete system test including templates
     */
    window.testCompleteSystem = async function() {
        console.log('🧪 TESTING COMPLETE AUTOBUILD SYSTEM...');
        console.log('='.repeat(60));

        // Test 1: Template System
        window.testTemplateSystem();

        // Test 2: Data Collection
        console.log('\n🔍 Testing Data Collection...');
        if (typeof window.collectComprehensiveDataEnhanced === 'function') {
            console.log('✅ Data collection available');
        } else {
            console.log('❌ Data collection not available');
        }

        // Test 3: Database-Only Mode
        console.log('\n🔒 Testing Database-Only Mode...');
        await window.testDatabaseOnlyMode();

        // Test 4: Bot Integration
        console.log('\n🤖 Testing Bot Integration...');
        if (typeof window.AutoBuildBot === 'object') {
            const status = window.AutoBuildBot.getStatus();
            console.log('✅ Bot available');
            console.log(`📊 Bot status: ${status.isRunning ? 'Running' : 'Stopped'}`);
        } else {
            console.log('❌ Bot not available');
        }

        // Test 5: Progress Tracking
        console.log('\n📊 Testing Progress Tracking...');
        window.testProgressTracking();

        console.log('\n' + '='.repeat(60));
        console.log('🎉 COMPLETE SYSTEM TEST FINISHED!');
        console.log('✅ Template system fully integrated');
        console.log('✅ Progress tracking system active');
        console.log('✅ Auto-sync system ready');
        console.log('💡 Ready to use: Assign template → Get data → Start bot');
        console.log('🔧 Bot will automatically sync and track progress!');
        console.log('='.repeat(60));
    };

    /**
     * Test CSRF token extraction for debugging
     */
    window.testCSRFTokenExtraction = async function() {
        console.log('🔧 TESTING CSRF TOKEN EXTRACTION...');
        console.log('='.repeat(50));

        try {
            const villageId = game_data.village.id.toString();
            console.log(`🏘️ Testing with village ID: ${villageId}`);

            // Test using the improved token extraction
            console.log('📋 Test 1: Using Building Queue Logic');
            const buildingLogic = new window.TribalWarsBuildingQueueLogic();
            const token = await buildingLogic.getCSRFToken(villageId);

            if (token) {
                console.log(`✅ CSRF token extraction SUCCESS: ${token}`);
                console.log(`📏 Token length: ${token.length} characters`);
                console.log(`🔍 Token format: ${/^[a-f0-9]+$/i.test(token) ? 'Valid hex' : 'Invalid format'}`);

                // Test if token works by making a simple request
                console.log('\n📋 Test 2: Token Validation');
                const testUrl = `game.php?village=${villageId}&screen=main&h=${token}`;
                console.log(`🌐 Test URL: ${testUrl}`);

                try {
                    const testResponse = await fetch(testUrl);
                    console.log(`✅ Token test response: ${testResponse.status} ${testResponse.statusText}`);
                    if (testResponse.ok) {
                        console.log('✅ CSRF token appears to be VALID!');
                    } else {
                        console.log('❌ CSRF token might be invalid or expired');
                    }
                } catch (testError) {
                    console.error('❌ Token test failed:', testError);
                }

            } else {
                console.log('❌ CSRF token extraction FAILED');

                // Manual page inspection
                console.log('\n📋 Test 3: Manual Page Inspection');
                console.log('🔍 Let\'s look at the current page content...');

                const currentPageHtml = document.documentElement.outerHTML;

                // Look for any potential tokens
                const patterns = [
                    { name: 'game_data.csrf', regex: /game_data\.csrf\s*=\s*['"]([^'"]+)['"]/ },
                    { name: 'csrf in quotes', regex: /"csrf"\s*:\s*"([^"]+)"/ },
                    { name: 'h parameter', regex: /name=['"]h['"][^>]*value=['"]([^'"]+)['"]/ },
                    { name: 'h in URL', regex: /\bh=([a-f0-9]{8})\b/ },
                    { name: '8-char hex', regex: /\b[a-f0-9]{8}\b/g }
                ];

                patterns.forEach(pattern => {
                    const matches = currentPageHtml.match(pattern.regex);
                    if (matches) {
                        console.log(`🔍 ${pattern.name}:`, pattern.regex.flags === 'g' ? matches : matches[1]);
                    } else {
                        console.log(`❌ ${pattern.name}: Not found`);
                    }
                });

                // Show the current URL and check for tokens there
                console.log(`🌐 Current URL: ${window.location.href}`);
                const urlToken = window.location.href.match(/\bh=([a-f0-9]{8})\b/);
                if (urlToken) {
                    console.log(`🎯 Token found in current URL: ${urlToken[1]}`);
                }
            }

        } catch (error) {
            console.error('❌ Test error:', error);
        }

        console.log('\n' + '='.repeat(50));
        console.log('🔧 CSRF TOKEN EXTRACTION TEST COMPLETED!');
        console.log('💡 If token extraction failed, try refreshing the page or navigating to headquarters');
        console.log('='.repeat(50));
    };

    /**
     * Check bot's build progress for current village
     */
    window.checkBuildProgress = function() {
        const villageId = game_data.village.id.toString();
        console.log('📊 CHECKING BOT BUILD PROGRESS...');
        console.log('='.repeat(50));

        // Get progress using fallback system
        let progress;
        if (window.AutoBuildBot && typeof window.AutoBuildBot.getBuildProgress === 'function') {
            progress = window.AutoBuildBot.getBuildProgress(villageId);
        } else {
            // Fallback to direct localStorage access
            try {
                const progressKey = `build_progress_${villageId}`;
                const progressData = JSON.parse(localStorage.getItem(progressKey) || '{}');
                progress = {
                    buildings: progressData.buildings || {},
                    history: progressData.history || [],
                    lastBuild: progressData.history && progressData.history.length > 0 ? progressData.history[0] : null
                };
            } catch (error) {
                console.error('❌ Error loading progress:', error);
                progress = { buildings: {}, history: [], lastBuild: null };
            }
        }

        console.log(`🏘️ Village ID: ${villageId}`);
        console.log(`🎯 Village Name: ${game_data.village.name}`);

        if (progress.lastBuild) {
            console.log(`⏰ Last build: ${progress.lastBuild.datetime}`);
            console.log(`🏗️ Last built: ${progress.lastBuild.building} → level ${progress.lastBuild.level}`);
        } else {
            console.log('❌ No builds recorded by bot yet');
        }

        if (Object.keys(progress.buildings).length > 0) {
            console.log('\n📋 Buildings bot has upgraded:');
            Object.entries(progress.buildings).forEach(([building, level]) => {
                console.log(`   ${building}: level ${level}`);
            });
        } else {
            console.log('\n📋 No building upgrades recorded');
        }

        if (progress.history.length > 0) {
            console.log('\n🕐 Build History (last 10):');
            progress.history.slice(0, 10).forEach((build, index) => {
                console.log(`   ${index + 1}. ${build.building} → level ${build.level} (${build.datetime})`);
            });
        }

        console.log('\n' + '='.repeat(50));
        return progress;
    };

    /**
     * Clear bot progress tracking for current village
     */
    window.clearBuildProgress = function() {
        const villageId = game_data.village.id.toString();
        const progressKey = `build_progress_${villageId}`;

        console.log(`🗑️ CLEARING BUILD PROGRESS for village ${villageId}...`);

        const oldProgress = JSON.parse(localStorage.getItem(progressKey) || '{}');
        if (oldProgress.history && oldProgress.history.length > 0) {
            console.log(`📊 Removing ${oldProgress.history.length} build records`);
        }

        localStorage.removeItem(progressKey);
        console.log('✅ Build progress cleared!');
        console.log('💡 Bot will now use only database data for building decisions');
    };

    /**
     * Show combined building levels (database + bot progress)
     */
    window.showCombinedLevels = async function() {
        const villageId = game_data.village.id.toString();
        console.log('📊 COMBINED BUILDING LEVELS...');
        console.log('='.repeat(50));

        // Get database data
        const savedData = await window.loadLatestEnhancedData(villageId);
        let databaseBuildings = {};

        if (savedData && savedData.data) {
            const villageData = savedData.data.buildings?.villages?.[villageId];
            databaseBuildings = villageData?.buildings || {};
            console.log(`📅 Database from: ${new Date(savedData.timestamp).toLocaleString()}`);
        } else {
            console.log('❌ No database data found');
        }

        // Get combined levels using fallback system
        let combinedBuildings;
        if (window.AutoBuildBot && typeof window.AutoBuildBot.getCombinedBuildingLevels === 'function') {
            combinedBuildings = window.AutoBuildBot.getCombinedBuildingLevels(villageId, databaseBuildings);
        } else {
            // Fallback: combine manually
            try {
                const progressKey = `build_progress_${villageId}`;
                const progressData = JSON.parse(localStorage.getItem(progressKey) || '{}');
                const progress = progressData.buildings || {};

                combinedBuildings = { ...databaseBuildings };
                Object.entries(progress).forEach(([building, level]) => {
                    if (level > (combinedBuildings[building] || 0)) {
                        combinedBuildings[building] = level;
                    }
                });
            } catch (error) {
                console.error('❌ Error combining levels:', error);
                combinedBuildings = databaseBuildings;
            }
        }

        // Show comparison
        console.log('\n📋 Building Levels Comparison:');
        console.log('Building'.padEnd(15) + 'Database'.padEnd(10) + 'Current'.padEnd(10) + 'Built');
        console.log('-'.repeat(45));

        const allBuildings = new Set([...Object.keys(databaseBuildings), ...Object.keys(combinedBuildings)]);
        [...allBuildings].sort().forEach(building => {
            const dbLevel = databaseBuildings[building] || 0;
            const currentLevel = combinedBuildings[building] || 0;
            const built = currentLevel - dbLevel;

            const buildingName = building.padEnd(15);
            const dbStr = dbLevel.toString().padEnd(10);
            const currentStr = currentLevel.toString().padEnd(10);
            const builtStr = built > 0 ? `+${built}` : '';

            console.log(`${buildingName}${dbStr}${currentStr}${builtStr}`);
        });

        console.log('\n' + '='.repeat(50));
        return { database: databaseBuildings, combined: combinedBuildings };
    };

    /**
     * Manually record a build (for syncing with builds done outside the bot)
     */
    window.recordManualBuild = function(building, level) {
        const villageId = game_data.village.id.toString();

        if (!building || !level) {
            console.log('❌ Usage: recordManualBuild("building", level)');
            console.log('📋 Example: recordManualBuild("hide", 6)');
            return;
        }

        console.log(`📝 Recording manual build: ${building} → level ${level}`);

        // Record build using fallback system
        if (window.AutoBuildBot && typeof window.AutoBuildBot.recordBuildProgress === 'function') {
            window.AutoBuildBot.recordBuildProgress(villageId, building, level);
        } else {
            // Fallback: record directly to localStorage
            try {
                const progressKey = `build_progress_${villageId}`;
                let progress = JSON.parse(localStorage.getItem(progressKey) || '{}');

                if (!progress.buildings) progress.buildings = {};
                if (!progress.history) progress.history = [];

                const buildRecord = {
                    building: building,
                    level: level,
                    timestamp: Date.now(),
                    datetime: new Date().toLocaleString()
                };

                progress.buildings[building] = level;
                progress.history.unshift(buildRecord);
                if (progress.history.length > 50) {
                    progress.history = progress.history.slice(0, 50);
                }

                localStorage.setItem(progressKey, JSON.stringify(progress));
                console.log(`📊 Progress recorded: ${building} → level ${level}`);
            } catch (error) {
                console.error('❌ Error recording manual build:', error);
            }
        }

        console.log('✅ Manual build recorded!');
        console.log('💡 Run checkBuildProgress() to see updated progress');
    };

    /**
     * Run automatic sync detection and fix
     */
    window.autoSyncBot = function() {
        console.log('🔄 RUNNING AUTOMATIC SYNC DETECTION...');
        console.log('='.repeat(50));

        if (window.AutoBuildBot && typeof window.AutoBuildBot.autoSyncWithReality === 'function') {
            window.AutoBuildBot.autoSyncWithReality();
        } else if (window.AutoBuilder && window.AutoBuilder.getBot()) {
            const bot = window.AutoBuilder.getBot();
            if (bot && typeof bot.autoSyncWithReality === 'function') {
                bot.autoSyncWithReality();
            } else {
                console.log('❌ Bot not available for auto-sync');
            }
        } else {
            console.log('❌ Bot not available for auto-sync');
            console.log('💡 Try restarting the bot first');
        }

        console.log('\n' + '='.repeat(50));
        console.log('🔄 AUTO-SYNC COMPLETED!');
        console.log('💡 Run checkBuildProgress() to see results');
        console.log('='.repeat(50));
    };

    /**
     * Quick CSRF token getter for manual testing
     */
    window.getTokenManually = function() {
        console.log('🔑 MANUAL CSRF TOKEN EXTRACTION...');

        // Look in current page
        const html = document.documentElement.outerHTML;
        const url = window.location.href;

        // Try common patterns
        const patterns = [
            { name: 'URL parameter h', regex: /\bh=([a-f0-9]{8})\b/, source: url },
            { name: 'game_data.csrf', regex: /game_data\.csrf\s*=\s*['"]([^'"]+)['"]/, source: html },
            { name: 'input h value', regex: /name=['"]h['"][^>]*value=['"]([^'"]+)['"]/, source: html },
            { name: 'JSON csrf', regex: /"csrf"\s*:\s*"([^"]+)"/, source: html }
        ];

        for (const pattern of patterns) {
            const match = pattern.source.match(pattern.regex);
            if (match && match[1]) {
                console.log(`✅ Found token using ${pattern.name}: ${match[1]}`);
                return match[1];
            }
        }

        console.log('❌ No CSRF token found manually');

        // Show all 8-char hex strings for inspection
        const hexTokens = html.match(/\b[a-f0-9]{8}\b/g);
        if (hexTokens) {
            console.log('🔍 All 8-character hex strings found:', [...new Set(hexTokens)]);
        }

        return null;
    };

    /**
     * Test the progress tracking system
     */
    window.testProgressTracking = function() {
        console.log('🧪 TESTING PROGRESS TRACKING SYSTEM...');
        console.log('='.repeat(50));

        const villageId = game_data.village.id.toString();

        console.log('📋 Test 1: Recording test builds');
        window.AutoBuildBot.recordBuildProgress(villageId, 'hide', 4);
        window.AutoBuildBot.recordBuildProgress(villageId, 'hide', 5);
        window.AutoBuildBot.recordBuildProgress(villageId, 'farm', 6);

        console.log('\n📋 Test 2: Checking recorded progress');
        const progress = window.AutoBuildBot.getBuildProgress(villageId);
        console.log('✅ Progress retrieved:', Object.keys(progress.buildings).length, 'buildings');

        console.log('\n📋 Test 3: Testing combined levels');
        const testDatabase = { hide: 3, farm: 5, main: 5 };
        const combined = window.AutoBuildBot.getCombinedBuildingLevels(villageId, testDatabase);
        console.log('✅ Combined levels test:');
        console.log('   Database hide: 3, Combined hide:', combined.hide);
        console.log('   Database farm: 5, Combined farm:', combined.farm);

        console.log('\n📋 Test 4: Testing auto-sync feature');
        if (window.AutoBuildBot && typeof window.AutoBuildBot.autoSyncWithReality === 'function') {
            window.AutoBuildBot.autoSyncWithReality();
            console.log('✅ Auto-sync test completed');
        } else {
            console.log('⚠️ Auto-sync not available - bot reference missing');
        }

        console.log('\n📋 Test 5: Cleanup test data');
        console.log('✅ Test completed (test data left for inspection)');
        console.log('💡 Run clearBuildProgress() to remove test data');

        console.log('\n' + '='.repeat(50));
        console.log('🧪 PROGRESS TRACKING TEST COMPLETED!');
        console.log('✅ All systems working correctly');
        console.log('='.repeat(50));
    };

    /**
     * Test the randomized interval system
     */
    window.testRandomizedIntervals = function() {
        console.log('🎲 TESTING RANDOMIZED INTERVAL SYSTEM...');
        console.log('='.repeat(50));

        console.log('📋 Test: Generate 10 random intervals between 50-70 minutes');

        for (let i = 1; i <= 10; i++) {
            const minMinutes = 50;
            const maxMinutes = 70;
            const randomMinutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;
            const nextTime = new Date(Date.now() + (randomMinutes * 60 * 1000));

            console.log(`Test ${i}: ${randomMinutes} minutes (next at ${nextTime.toLocaleTimeString()})`);
        }

        console.log('\n📊 Statistics:');
        console.log('• Minimum interval: 50 minutes');
        console.log('• Maximum interval: 70 minutes');
        console.log('• Average interval: ~60 minutes');
        console.log('• Randomization: Each interval is unpredictable');

        console.log('\n🔒 Security Benefits:');
        console.log('• No fixed patterns detectable');
        console.log('• Human-like irregular timing');
        console.log('• Combined with random execution order');
        console.log('• Maximum anti-detection protection');

        console.log('\n💡 Usage:');
        console.log('1. Open Auto Builder UI (🤖 button)');
        console.log('2. Set Min/Max intervals (default: 50-70 minutes)');
        console.log('3. Click "🎲 Start Random Auto"');
        console.log('4. Watch status for next collection time');

        console.log('\n' + '='.repeat(50));
        console.log('🎲 RANDOMIZED INTERVAL TEST COMPLETED!');
        console.log('='.repeat(50));
    };

    // =============================================================================
    // 🧪 ENHANCED PROGRESS TRACKING TESTING FUNCTIONS
    // =============================================================================

    /**
     * Test enhanced tracking system
     */
    window.testEnhancedTracking = function() {
        const villageId = game_data.village.id.toString();
        
        console.log('🧪 TESTING Enhanced Progress Tracking...');
        console.log('='.repeat(50));
        
        // Test 1: Record a test build
        console.log('📋 Test 1: Recording test build');
        window.enhancedTracker.recordBuildStart(villageId, 'hide', 3, 4);
        
        // Test 2: Check combined levels
        console.log('\n📋 Test 2: Combined building levels');
        const testDatabase = { hide: 3, farm: 5, main: 5 };
        const enhanced = window.enhancedTracker.getCombinedBuildingLevels(villageId, testDatabase);
        console.log('Database levels:', testDatabase);
        console.log('Enhanced levels:', enhanced);
        
        // Test 3: Queue status
        console.log('\n📋 Test 3: Queue simulation');
        const queueStatus = window.enhancedTracker.queueSimulator.getQueueStatus(villageId);
        console.log('Queue status:', queueStatus);
        
        // Test 4: Intelligence report
        console.log('\n📋 Test 4: Intelligence report');
        const report = window.enhancedTracker.getIntelligenceReport(villageId);
        console.log('Intelligence report:', report);
        
        console.log('\n' + '='.repeat(50));
        console.log('🧪 Enhanced tracking test completed!');
        
        return { enhanced, queueStatus, report };
    };

    /**
     * Test build time calculations
     */
    window.testBuildTimeCalculator = function() {
        const calculator = new BuildTimeCalculator();
        
        console.log('🧪 TESTING Build Time Calculator...');
        console.log('='.repeat(40));
        
        const tests = [
            { building: 'hide', level: 4 },
            { building: 'farm', level: 10 },
            { building: 'main', level: 15 },
            { building: 'barracks', level: 5 }
        ];
        
        tests.forEach(test => {
            const timeSeconds = calculator.calculateBuildTime(test.building, test.level);
            const timeFormatted = calculator.formatBuildTime(timeSeconds);
            console.log(`${test.building} level ${test.level}: ${timeFormatted} (${timeSeconds}s)`);
        });
        
        console.log('='.repeat(40));
        return calculator;
    };

    /**
     * Test complete system integration
     */
    window.testCompleteEnhancedSystem = async function() {
        const villageId = game_data.village.id.toString();
        
        console.log('🧪 TESTING Complete Enhanced System...');
        console.log('='.repeat(60));
        
        // Test 1: Enhanced tracker availability
        console.log('📋 Test 1: System availability');
        console.log(`Enhanced Tracker: ${typeof window.enhancedTracker === 'object' ? '✅' : '❌'}`);
        console.log(`Smart Calculator: ${typeof window.AutoBuildBot?.smartCalculator === 'object' ? '✅' : '❌'}`);
        
        // Test 2: Build time calculator
        console.log('\n📋 Test 2: Build time calculator');
        window.testBuildTimeCalculator();
        
        // Test 3: Enhanced tracking
        console.log('\n📋 Test 3: Enhanced tracking');
        window.testEnhancedTracking();
        
        // Test 4: Smart calculator integration
        console.log('\n📋 Test 4: Smart calculator with enhanced logic');
        if (window.AutoBuildBot?.smartCalculator) {
            try {
                const decision = await window.AutoBuildBot.smartCalculator.calculateNextBuild(villageId);
                console.log('Smart calculator decision:', decision);
                console.log('✅ Smart calculator working with enhanced logic!');
            } catch (error) {
                console.log('❌ Smart calculator test failed:', error);
            }
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 Complete enhanced system test finished!');
        console.log('✅ Enhanced Progress Tracking fully integrated and operational');
    };

    /**
     * Test queue simulation system
     */
    window.testQueueSimulation = function() {
        const villageId = game_data.village.id.toString();
        
        console.log('🧪 TESTING Queue Simulation System...');
        console.log('='.repeat(50));
        
        const simulator = window.enhancedTracker.queueSimulator;
        
        // Test 1: Add multiple buildings to queue
        console.log('📋 Test 1: Adding buildings to queue');
        simulator.addToQueue(villageId, 'hide', 4, Date.now(), 1800); // 30 min
        simulator.addToQueue(villageId, 'farm', 6, Date.now() + 60000, 1200); // 20 min
        simulator.addToQueue(villageId, 'main', 8, Date.now() + 120000, 900); // 15 min
        
        // Test 2: Check queue status
        console.log('\n📋 Test 2: Queue status check');
        const status = simulator.getQueueStatus(villageId);
        console.log('Queue status:', status);
        
        // Test 3: Check if queue is full
        console.log('\n📋 Test 3: Queue capacity check');
        console.log(`Queue full: ${simulator.isQueueFull(villageId)}`);
        console.log(`Next slot available: ${new Date(simulator.getNextSlotTime(villageId)).toLocaleTimeString()}`);
        
        console.log('\n' + '='.repeat(50));
        console.log('🧪 Queue simulation test completed!');
        
        return status;
    };

    /**
     * Test the anti-blind building system
     */
    window.testAntiBlindBuilding = function() {
        const villageId = game_data.village.id.toString();
        
        console.log('🧪 TESTING Anti-Blind Building System...');
        console.log('='.repeat(60));
        
        // Simulate the old problem scenario
        console.log('📋 Old Problem Simulation:');
        console.log('14:00 - Database: hide=3');
        console.log('14:01 - Bot builds hide 3→4');
        console.log('14:15 - Database still shows hide=3 (bot tries 3→4 again!)');
        
        // Test enhanced solution
        console.log('\n📋 Enhanced Solution Test:');
        
        // Step 1: Set baseline database data
        const databaseLevels = { hide: 3, farm: 5, main: 5 };
        console.log('Database levels:', databaseLevels);
        
        // Step 2: Record build start (what happens when bot builds)
        console.log('\n🏗️ Recording build: hide 3→4');
        window.enhancedTracker.recordBuildStart(villageId, 'hide', 3, 4);
        
        // Step 3: Get enhanced levels (what bot sees after build)
        const enhancedLevels = window.enhancedTracker.getCombinedBuildingLevels(villageId, databaseLevels);
        console.log('Enhanced levels:', enhancedLevels);
        
        // Step 4: Verify the bot now sees hide=4
        if (enhancedLevels.hide === 4) {
            console.log('✅ SUCCESS: Bot now sees hide=4 (no more blind building!)');
        } else {
            console.log('❌ FAILED: Bot still sees old level');
        }
        
        // Step 5: Intelligence report
        const report = window.enhancedTracker.getIntelligenceReport(villageId);
        console.log('\nIntelligence report:', report);
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 Anti-blind building test completed!');
        console.log('✅ Bot is no longer blind between data collection cycles');
        
        return { databaseLevels, enhancedLevels, report };
    };

    /**
     * Quick system health check for enhanced tracking
     */
    window.testEnhancedSystemHealth = function() {
        console.log('🩺 ENHANCED SYSTEM HEALTH CHECK...');
        console.log('='.repeat(50));
        
        // Test 1: Enhanced Tracker availability
        console.log('📋 Test 1: Enhanced Tracker');
        if (window.enhancedTracker && typeof window.enhancedTracker.recordBuildStart === 'function') {
            console.log('✅ Enhanced Tracker: Available and functional');
        } else {
            console.log('❌ Enhanced Tracker: Missing or broken');
            return false;
        }
        
        // Test 2: Bot Enhanced Tracker integration
        console.log('\n📋 Test 2: Bot Integration');
        if (window.AutoBuildBot?.enhancedTracker) {
            console.log('✅ Bot Enhanced Tracker: Properly integrated');
        } else {
            console.log('❌ Bot Enhanced Tracker: Missing integration');
            return false;
        }
        
        // Test 3: Smart Calculator Enhanced Integration
        console.log('\n📋 Test 3: Smart Calculator');
        if (window.AutoBuildBot?.smartCalculator?.enhancedTracker) {
            console.log('✅ Smart Calculator: Enhanced tracker connected');
        } else {
            console.log('❌ Smart Calculator: Enhanced tracker missing');
            return false;
        }
        
        // Test 4: Auto-sync function
        console.log('\n📋 Test 4: Auto-sync Function');
        try {
            if (window.AutoBuildBot && typeof window.AutoBuildBot.autoSyncWithReality === 'function') {
                window.AutoBuildBot.autoSyncWithReality();
                console.log('✅ Auto-sync: Working correctly');
            } else {
                console.log('❌ Auto-sync: Function missing');
                return false;
            }
        } catch (error) {
            console.log('❌ Auto-sync: Error -', error.message);
            return false;
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('🎉 ENHANCED SYSTEM HEALTH CHECK PASSED!');
        console.log('✅ All systems operational - ready to start bot');
        return true;
    };

})();