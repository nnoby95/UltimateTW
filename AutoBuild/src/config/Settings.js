/**
 * Settings Manager for Auto Builder
 * Handles all settings and configuration
 */
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
    
    /**
     * Export settings
     * @returns {object} Settings for export
     */
    export() {
        return {
            settings: this.current,
            exportedAt: Date.now(),
            version: this.current.version
        };
    }
    
    /**
     * Import settings
     * @param {object} data - Settings data to import
     */
    import(data) {
        try {
            if (data.settings) {
                this.current = { ...this.defaults, ...data.settings };
                this.save();
                console.log('📥 Settings imported successfully');
                return true;
            } else {
                console.error('❌ Invalid settings data');
                return false;
            }
        } catch (error) {
            console.error('❌ Failed to import settings:', error);
            return false;
        }
    }
    
    /**
     * Validate settings
     * @returns {object} Validation result
     */
    validate() {
        const errors = [];
        const warnings = [];
        
        // Check required settings
        if (this.get('checkInterval') < 10) {
            errors.push('Check interval must be at least 10 seconds');
        }
        
        if (this.get('maxQueueSize') > 5) {
            errors.push('Max queue size cannot exceed 5 (game limit)');
        }
        
        if (this.get('maxQueueSize') < 1) {
            errors.push('Max queue size must be at least 1');
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    /**
     * Get settings for specific category
     * @param {string} category - Settings category
     * @returns {object} Category settings
     */
    getCategory(category) {
        const categorySettings = {};
        
        Object.keys(this.current).forEach(key => {
            if (key.startsWith(category)) {
                categorySettings[key] = this.current[key];
            }
        });
        
        return categorySettings;
    }
    
    /**
     * Set settings for specific category
     * @param {string} category - Settings category
     * @param {object} settings - Settings to set
     */
    setCategory(category, settings) {
        Object.keys(settings).forEach(key => {
            this.set(`${category}_${key}`, settings[key]);
        });
    }
    
    /**
     * Get bot settings
     * @returns {object} Bot settings
     */
    getBotSettings() {
        return {
            enabled: this.get('autoBuildEnabled'),
            interval: this.get('checkInterval'),
            maxQueueSize: this.get('maxQueueSize'),
            costupSetup: this.get('costupSetup')
        };
    }
    
    /**
     * Get UI settings
     * @returns {object} UI settings
     */
    getUISettings() {
        return {
            showSettingsPanel: this.get('showSettingsPanel'),
            showBuildQueue: this.get('showBuildQueue'),
            showVillageManager: this.get('showVillageManager')
        };
    }
    
    /**
     * Add building to costup setup
     * @param {string} building - Building name
     * @param {number} targetLevel - Target level
     */
    addToCostupSetup(building, targetLevel) {
        const costupSetup = this.get('costupSetup', []);
        costupSetup.push({
            building: building,
            target_level: targetLevel,
            added_at: Date.now()
        });
        this.set('costupSetup', costupSetup);
    }
    
    /**
     * Remove building from costup setup
     * @param {number} index - Index to remove
     */
    removeFromCostupSetup(index) {
        const costupSetup = this.get('costupSetup', []);
        if (index >= 0 && index < costupSetup.length) {
            costupSetup.splice(index, 1);
            this.set('costupSetup', costupSetup);
        }
    }
    
    /**
     * Move building in costup setup
     * @param {number} fromIndex - From index
     * @param {number} toIndex - To index
     */
    moveInCostupSetup(fromIndex, toIndex) {
        const costupSetup = this.get('costupSetup', []);
        if (fromIndex >= 0 && fromIndex < costupSetup.length && 
            toIndex >= 0 && toIndex < costupSetup.length) {
            const item = costupSetup.splice(fromIndex, 1)[0];
            costupSetup.splice(toIndex, 0, item);
            this.set('costupSetup', costupSetup);
        }
    }
    
    /**
     * Clear costup setup
     */
    clearCostupSetup() {
        this.set('costupSetup', []);
    }
    
    /**
     * Get next building from costup setup
     * @param {object} villageData - Current village data
     * @returns {object|null} Next building plan
     */
    getNextBuildingFromCostup(villageData) {
        const costupSetup = this.get('costupSetup', []);
        const currentBuildings = villageData.buildings || {};
        
        for (let i = 0; i < costupSetup.length; i++) {
            const plan = costupSetup[i];
            const currentLevel = currentBuildings[plan.building] || 0;
            
            // Check if this building needs to be upgraded
            if (currentLevel < plan.target_level) {
                // Check prerequisites (all previous buildings must be at their target levels)
                let canBuild = true;
                for (let j = 0; j < i; j++) {
                    const prereq = costupSetup[j];
                    const prereqLevel = currentBuildings[prereq.building] || 0;
                    if (prereqLevel < prereq.target_level) {
                        canBuild = false;
                        break;
                    }
                }
                
                if (canBuild) {
                    return plan;
                }
            }
        }
        
        return null;
    }

    // ===== BUILDING TEMPLATES SYSTEM =====
    
    /**
     * Get all building templates
     * @returns {object} All templates
     */
    getBuildingTemplates() {
        return this.get('buildingTemplates', {});
    }
    
    /**
     * Create a new building template
     * @param {string} templateName - Template name
     * @param {array} buildingSequence - Array of building plans
     * @param {string} description - Template description
     * @returns {boolean} Success status
     */
    createBuildingTemplate(templateName, buildingSequence, description = '') {
        try {
            const templates = this.getBuildingTemplates();
            
            if (templates[templateName]) {
                console.error(`❌ Template "${templateName}" already exists`);
                return false;
            }
            
            // Validate building sequence
            if (!Array.isArray(buildingSequence) || buildingSequence.length === 0) {
                console.error('❌ Invalid building sequence');
                return false;
            }
            
            // Validate each building plan
            for (const plan of buildingSequence) {
                if (!plan.building || typeof plan.target_level !== 'number' || plan.target_level < 1) {
                    console.error('❌ Invalid building plan:', plan);
                    return false;
                }
            }
            
            templates[templateName] = {
                name: templateName,
                description: description,
                sequence: buildingSequence,
                created_at: Date.now(),
                updated_at: Date.now()
            };
            
            this.set('buildingTemplates', templates);
            console.log(`✅ Template "${templateName}" created successfully`);
            return true;
            
        } catch (error) {
            console.error('❌ Failed to create template:', error);
            return false;
        }
    }
    
    /**
     * Update an existing building template
     * @param {string} templateName - Template name
     * @param {array} buildingSequence - New building sequence
     * @param {string} description - New description
     * @returns {boolean} Success status
     */
    updateBuildingTemplate(templateName, buildingSequence, description = null) {
        try {
            const templates = this.getBuildingTemplates();
            
            if (!templates[templateName]) {
                console.error(`❌ Template "${templateName}" not found`);
                return false;
            }
            
            // Validate building sequence
            if (!Array.isArray(buildingSequence) || buildingSequence.length === 0) {
                console.error('❌ Invalid building sequence');
                return false;
            }
            
            // Validate each building plan
            for (const plan of buildingSequence) {
                if (!plan.building || typeof plan.target_level !== 'number' || plan.target_level < 1) {
                    console.error('❌ Invalid building plan:', plan);
                    return false;
                }
            }
            
            templates[templateName] = {
                ...templates[templateName],
                sequence: buildingSequence,
                description: description !== null ? description : templates[templateName].description,
                updated_at: Date.now()
            };
            
            this.set('buildingTemplates', templates);
            console.log(`✅ Template "${templateName}" updated successfully`);
            return true;
            
        } catch (error) {
            console.error('❌ Failed to update template:', error);
            return false;
        }
    }
    
    /**
     * Delete a building template
     * @param {string} templateName - Template name
     * @returns {boolean} Success status
     */
    deleteBuildingTemplate(templateName) {
        try {
            const templates = this.getBuildingTemplates();
            
            if (!templates[templateName]) {
                console.error(`❌ Template "${templateName}" not found`);
                return false;
            }
            
            delete templates[templateName];
            this.set('buildingTemplates', templates);
            console.log(`✅ Template "${templateName}" deleted successfully`);
            return true;
            
        } catch (error) {
            console.error('❌ Failed to delete template:', error);
            return false;
        }
    }
    
    /**
     * Get a specific building template
     * @param {string} templateName - Template name
     * @returns {object|null} Template data
     */
    getBuildingTemplate(templateName) {
        const templates = this.getBuildingTemplates();
        return templates[templateName] || null;
    }
    
    /**
     * Apply a building template to costup setup
     * @param {string} templateName - Template name
     * @returns {boolean} Success status
     */
    applyBuildingTemplate(templateName) {
        try {
            const template = this.getBuildingTemplate(templateName);
            
            if (!template) {
                console.error(`❌ Template "${templateName}" not found`);
                return false;
            }
            
            // Clear current costup setup
            this.clearCostupSetup();
            
            // Add all buildings from template sequence
            template.sequence.forEach(plan => {
                this.addToCostupSetup(plan.building, plan.target_level);
            });
            
            console.log(`✅ Template "${templateName}" applied to costup setup`);
            return true;
            
        } catch (error) {
            console.error('❌ Failed to apply template:', error);
            return false;
        }
    }
    
    /**
     * Get next building from template (with prerequisite checking)
     * @param {string} templateName - Template name
     * @param {object} villageData - Current village data
     * @returns {object|null} Next building plan
     */
    getNextBuildingFromTemplate(templateName, villageData) {
        try {
            const template = this.getBuildingTemplate(templateName);
            
            if (!template) {
                console.error(`❌ Template "${templateName}" not found`);
                return null;
            }
            
            const currentBuildings = villageData.buildings || {};
            
            for (let i = 0; i < template.sequence.length; i++) {
                const plan = template.sequence[i];
                const currentLevel = currentBuildings[plan.building] || 0;
                
                // Check if this building needs to be upgraded
                if (currentLevel < plan.target_level) {
                    // Check prerequisites (all previous buildings must be at their target levels)
                    let canBuild = true;
                    for (let j = 0; j < i; j++) {
                        const prereq = template.sequence[j];
                        const prereqLevel = currentBuildings[prereq.building] || 0;
                        if (prereqLevel < prereq.target_level) {
                            canBuild = false;
                            console.log(`⏳ Waiting for ${prereq.building} to reach level ${prereq.target_level} (currently ${prereqLevel})`);
                            break;
                        }
                    }
                    
                    if (canBuild) {
                        return plan;
                    }
                }
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Failed to get next building from template:', error);
            return null;
        }
    }
    
    /**
     * Validate a building template
     * @param {string} templateName - Template name
     * @returns {object} Validation result
     */
    validateBuildingTemplate(templateName) {
        const template = this.getBuildingTemplate(templateName);
        const errors = [];
        const warnings = [];
        
        if (!template) {
            errors.push(`Template "${templateName}" not found`);
            return { isValid: false, errors, warnings };
        }
        
        if (!template.sequence || !Array.isArray(template.sequence)) {
            errors.push('Invalid building sequence');
        } else {
            template.sequence.forEach((plan, index) => {
                if (!plan.building) {
                    errors.push(`Building ${index + 1}: Missing building name`);
                }
                if (typeof plan.target_level !== 'number' || plan.target_level < 1) {
                    errors.push(`Building ${index + 1}: Invalid target level`);
                }
                if (plan.target_level > 30) {
                    warnings.push(`Building ${index + 1}: Target level ${plan.target_level} is very high`);
                }
            });
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    /**
     * Get template statistics
     * @param {string} templateName - Template name
     * @returns {object} Template statistics
     */
    getTemplateStats(templateName) {
        const template = this.getBuildingTemplate(templateName);
        
        if (!template) {
            return null;
        }
        
        let totalWood = 0, totalStone = 0, totalIron = 0;
        const buildingCounts = {};
        
        template.sequence.forEach(plan => {
            if (window.BuildingCostCalculator) {
                const [wood, stone, iron] = window.BuildingCostCalculator.getCost(plan.building, plan.target_level);
                totalWood += wood;
                totalStone += stone;
                totalIron += iron;
            }
            
            buildingCounts[plan.building] = (buildingCounts[plan.building] || 0) + 1;
        });
        
        return {
            totalBuildings: template.sequence.length,
            totalCosts: { wood: totalWood, stone: totalStone, iron: totalIron },
            buildingCounts: buildingCounts,
            estimatedTime: template.sequence.length * 3600 // Rough estimate
        };
    }

    /**
     * Get the template assigned to a specific village
     * @param {string} villageId
     * @returns {string|null} Template name
     */
    getVillageTemplate(villageId) {
        const vt = this.get('villageTemplates', {});
        return vt[villageId] || null;
    }

    /**
     * Assign a template to a specific village
     * @param {string} villageId
     * @param {string} templateName
     */
    setVillageTemplate(villageId, templateName) {
        const vt = this.get('villageTemplates', {});
        vt[villageId] = templateName;
        this.set('villageTemplates', vt);
    }

    /**
     * Get all village-template assignments
     * @returns {object} { [villageId]: templateName }
     */
    getAllVillageTemplates() {
        return this.get('villageTemplates', {});
    }
} 