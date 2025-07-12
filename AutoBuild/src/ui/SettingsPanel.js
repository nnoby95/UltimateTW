/**
 * Settings Panel UI
 * Provides user interface for AutoBuilder settings
 */
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
            this.addStyles();
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
                <button class="autobuilder-close" id="autobuilder-settings-close">×</button>
            </div>
            <div class="autobuilder-content">
                <div class="autobuilder-section">
                    <h4>🏘️ Villages</h4>
                    <div id="villageTemplatesTable"></div>
                    <button id="refreshVillagesBtn" class="autobuilder-btn autobuilder-btn-secondary" style="margin-top:8px;">Refresh Villages</button>
                </div>
                
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
                    <h4>🎛️ UI Settings</h4>
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="showSettingsPanel">
                            Show Settings Panel
                        </label>
                    </div>
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="showBuildQueue">
                            Show Build Queue
                        </label>
                    </div>
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="showVillageManager">
                            Show Village Manager
                        </label>
                    </div>
                </div>
                
                <div class="autobuilder-section">
                    <h4>🏘️ Village Templates</h4>
                    <div id="villageTemplatesTable"></div>
                </div>
                
                <div class="autobuilder-section">
                    <h4>🔧 Actions</h4>
                    <div class="setting-group">
                        <button id="saveSettings" class="autobuilder-btn autobuilder-btn-primary">Save Settings</button>
                        <button id="resetSettings" class="autobuilder-btn autobuilder-btn-secondary">Reset to Defaults</button>
                    </div>
                    <div class="setting-group">
                        <button id="exportSettings" class="autobuilder-btn autobuilder-btn-secondary">Export Settings</button>
                        <button id="importSettings" class="autobuilder-btn autobuilder-btn-secondary">Import Settings</button>
                    </div>
                    <div class="setting-group">
                        <button id="openTemplates" class="autobuilder-btn autobuilder-btn-secondary">📋 Manage Templates</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.panel);
        this.renderVillageTemplatesTable();
        this.loadCurrentSettings();
        this.bindEvents();
        // Attach close event
        const closeBtn = this.panel.querySelector('#autobuilder-settings-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }
        // Attach refresh villages event
        const refreshBtn = this.panel.querySelector('#refreshVillagesBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshVillages();
            });
        }
    }
    
    /**
     * Populate building dropdown with all available buildings
     */
    populateBuildingDropdown() {
        const buildingSelect = document.getElementById('buildingType');
        if (!buildingSelect) return;
        
        // Clear existing options
        buildingSelect.innerHTML = '';
        
        // Get all available buildings
        const buildings = window.BuildingCostCalculator ? 
            window.BuildingCostCalculator.getAllBuildings() : 
            ['main', 'barracks', 'stable', 'garage', 'smith', 'market', 'wood', 'stone', 'iron', 'farm', 'storage', 'hide', 'wall'];
        
        // Add building options
        buildings.forEach(building => {
            const option = document.createElement('option');
            option.value = building;
            option.textContent = this.getBuildingDisplayName(building);
            buildingSelect.appendChild(option);
        });
        
        // Add change event to update max level
        buildingSelect.addEventListener('change', () => {
            this.updateMaxLevel();
        });
    }
    
    /**
     * Update max level input based on selected building
     */
    updateMaxLevel() {
        const buildingSelect = document.getElementById('buildingType');
        const levelInput = document.getElementById('targetLevel');
        
        if (!buildingSelect || !levelInput) return;
        
        const selectedBuilding = buildingSelect.value;
        let maxLevel = 30; // Default
        
        if (window.BuildingCostCalculator) {
            maxLevel = window.BuildingCostCalculator.getMaxLevel(selectedBuilding);
        }
        
        levelInput.max = maxLevel;
        levelInput.placeholder = `Target Level (1-${maxLevel})`;
    }
    
    /**
     * Add CSS styles
     */
    addStyles() {
        const styles = `
            .autobuilder-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border: 2px solid #4a90e2;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                z-index: 10000;
                min-width: 500px;
                max-width: 700px;
                max-height: 80vh;
                overflow-y: auto;
                font-family: Arial, sans-serif;
            }
            
            .autobuilder-header {
                background: #4a90e2;
                color: white;
                padding: 15px;
                border-radius: 6px 6px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .autobuilder-header h3 {
                margin: 0;
                font-size: 16px;
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
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .autobuilder-close:hover {
                background: rgba(255,255,255,0.2);
            }
            
            .autobuilder-content {
                padding: 20px;
            }
            
            .autobuilder-section {
                margin-bottom: 25px;
            }
            
            .autobuilder-section h4 {
                margin: 0 0 15px 0;
                color: #333;
                font-size: 14px;
                border-bottom: 1px solid #eee;
                padding-bottom: 5px;
            }
            
            .setting-group {
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .setting-group label {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 13px;
                color: #555;
                min-width: 150px;
            }
            
            .setting-group input[type="checkbox"] {
                margin: 0;
            }
            
            .setting-group input[type="number"] {
                width: 80px;
                padding: 5px;
                border: 1px solid #ddd;
                border-radius: 3px;
                font-size: 12px;
            }
            
            .setting-group small {
                color: #999;
                font-size: 11px;
            }
            
            .costup-setup {
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 15px;
                background: #f9f9f9;
            }
            
            .costup-controls {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
                align-items: center;
            }
            
            .costup-controls select {
                padding: 5px;
                border: 1px solid #ddd;
                border-radius: 3px;
                font-size: 12px;
                min-width: 120px;
            }
            
            .costup-controls input {
                padding: 5px;
                border: 1px solid #ddd;
                border-radius: 3px;
                font-size: 12px;
                width: 80px;
            }
            
            .costup-list h5 {
                margin: 0 0 10px 0;
                font-size: 13px;
                color: #333;
            }
            
            .costup-items {
                max-height: 150px;
                overflow-y: auto;
                border: 1px solid #ddd;
                border-radius: 3px;
                background: white;
                padding: 5px;
            }
            
            .costup-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 5px;
                border-bottom: 1px solid #eee;
                font-size: 12px;
            }
            
            .costup-item:last-child {
                border-bottom: none;
            }
            
            .costup-item .building-info {
                flex: 1;
            }
            
            .costup-item .actions {
                display: flex;
                gap: 5px;
            }
            
            .costup-item .remove-btn {
                background: #ff6b6b;
                color: white;
                border: none;
                border-radius: 3px;
                padding: 2px 6px;
                font-size: 10px;
                cursor: pointer;
            }
            
            .costup-item .move-btn {
                background: #4a90e2;
                color: white;
                border: none;
                border-radius: 3px;
                padding: 2px 6px;
                font-size: 10px;
                cursor: pointer;
            }
            
            .autobuilder-btn {
                padding: 8px 15px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                margin-right: 10px;
                margin-bottom: 5px;
            }
            
            .autobuilder-btn-primary {
                background: #4a90e2;
                color: white;
            }
            
            .autobuilder-btn-primary:hover {
                background: #357abd;
            }
            
            .autobuilder-btn-secondary {
                background: #f5f5f5;
                color: #333;
                border: 1px solid #ddd;
            }
            
            .autobuilder-btn-secondary:hover {
                background: #e5e5e5;
            }
            
            .autobuilder-toggle {
                position: fixed;
                top: 10px;
                right: 10px;
                background: #4a90e2;
                color: white;
                border: none;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                cursor: pointer;
                font-size: 20px;
                z-index: 9999;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            }
            
            .autobuilder-toggle:hover {
                background: #357abd;
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Save settings
        const saveBtn = document.getElementById('saveSettings');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }
        
        // Reset settings
        const resetBtn = document.getElementById('resetSettings');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to reset all settings to defaults?')) {
                    this.settings.reset();
                    this.loadCurrentSettings();
                    alert('Settings reset to defaults!');
                }
            });
        }
        
        // Export settings
        const exportBtn = document.getElementById('exportSettings');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportSettings();
            });
        }
        
        // Import settings
        const importBtn = document.getElementById('importSettings');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.importSettings();
            });
        }
        
        // Open templates
        const templatesBtn = document.getElementById('openTemplates');
        if (templatesBtn) {
            templatesBtn.addEventListener('click', () => {
                window.AutoBuilder.getUI().templates.show();
            });
        }
    }
    
    /**
     * Load current settings into form
     */
    loadCurrentSettings() {
        const settings = this.settings.getAll();
        
        // Bot settings
        const autoBuildEnabled = document.getElementById('autoBuildEnabled');
        if (autoBuildEnabled) autoBuildEnabled.checked = settings.autoBuildEnabled;
        
        const checkInterval = document.getElementById('checkInterval');
        if (checkInterval) checkInterval.value = settings.checkInterval;
        
        const maxQueueSize = document.getElementById('maxQueueSize');
        if (maxQueueSize) maxQueueSize.value = settings.maxQueueSize;
        
        // UI settings
        const showSettingsPanel = document.getElementById('showSettingsPanel');
        if (showSettingsPanel) showSettingsPanel.checked = settings.showSettingsPanel;
        
        const showBuildQueue = document.getElementById('showBuildQueue');
        if (showBuildQueue) showBuildQueue.checked = settings.showBuildQueue;
        
        const showVillageManager = document.getElementById('showVillageManager');
        if (showVillageManager) showVillageManager.checked = settings.showVillageManager;
    }
    
    /**
     * Save settings from form
     */
    saveSettings() {
        try {
            // Bot settings
            const autoBuildEnabled = document.getElementById('autoBuildEnabled');
            if (autoBuildEnabled) this.settings.set('autoBuildEnabled', autoBuildEnabled.checked);
            
            const checkInterval = document.getElementById('checkInterval');
            if (checkInterval) this.settings.set('checkInterval', parseInt(checkInterval.value));
            
            const maxQueueSize = document.getElementById('maxQueueSize');
            if (maxQueueSize) this.settings.set('maxQueueSize', parseInt(maxQueueSize.value));
            
            // UI settings
            const showSettingsPanel = document.getElementById('showSettingsPanel');
            if (showSettingsPanel) this.settings.set('showSettingsPanel', showSettingsPanel.checked);
            
            const showBuildQueue = document.getElementById('showBuildQueue');
            if (showBuildQueue) this.settings.set('showBuildQueue', showBuildQueue.checked);
            
            const showVillageManager = document.getElementById('showVillageManager');
            if (showVillageManager) this.settings.set('showVillageManager', showVillageManager.checked);
            
            alert('Settings saved successfully!');
            
        } catch (error) {
            console.error('❌ Failed to save settings:', error);
            alert('Failed to save settings!');
        }
    }
    
    /**
     * Add building to costup setup
     */
    addToCostup() {
        const buildingType = document.getElementById('buildingType').value;
        const targetLevel = parseInt(document.getElementById('targetLevel').value);
        
        if (!targetLevel || targetLevel < 1) {
            alert('Please enter a valid target level');
            return;
        }
        
        // Check max level
        if (window.BuildingCostCalculator) {
            const maxLevel = window.BuildingCostCalculator.getMaxLevel(buildingType);
            if (targetLevel > maxLevel) {
                alert(`${this.getBuildingDisplayName(buildingType)} maximum level is ${maxLevel}`);
                return;
            }
        }
        
        this.settings.addToCostupSetup(buildingType, targetLevel);
        this.updateCostupList();
        
        // Clear input
        document.getElementById('targetLevel').value = '';
        
        console.log(`✅ Added ${buildingType} level ${targetLevel} to costup setup`);
    }
    
    /**
     * Update costup list display
     */
    updateCostupList() {
        const costupList = document.getElementById('costupList');
        const costupSetup = this.settings.get('costupSetup', []);
        
        if (costupSetup.length === 0) {
            costupList.innerHTML = '<div class="costup-item">No buildings in costup setup</div>';
            return;
        }
        
        costupList.innerHTML = '';
        
        costupSetup.forEach((item, index) => {
            const costupItem = document.createElement('div');
            costupItem.className = 'costup-item';
            costupItem.innerHTML = `
                <div class="building-info">
                    ${this.getBuildingDisplayName(item.building)} → Level ${item.target_level}
                </div>
                <div class="actions">
                    ${index > 0 ? `<button class="move-btn" onclick="window.AutoBuilder.getUI().settings.moveCostupItem(${index}, ${index - 1})">↑</button>` : ''}
                    ${index < costupSetup.length - 1 ? `<button class="move-btn" onclick="window.AutoBuilder.getUI().settings.moveCostupItem(${index}, ${index + 1})">↓</button>` : ''}
                    <button class="remove-btn" onclick="window.AutoBuilder.getUI().settings.removeCostupItem(${index})">×</button>
                </div>
            `;
            costupList.appendChild(costupItem);
        });
    }
    
    /**
     * Get building display name
     */
    getBuildingDisplayName(building) {
        const names = {
            main: 'Main Building',
            barracks: 'Barracks',
            stable: 'Stable',
            garage: 'Workshop',
            church: 'Church',
            watchtower: 'Watchtower',
            snob: 'Academy',
            smith: 'Smithy',
            place: 'Palace',
            statue: 'Statue',
            market: 'Marketplace',
            wood: 'Woodcutter',
            stone: 'Clay Pit',
            iron: 'Iron Mine',
            farm: 'Farm',
            storage: 'Warehouse',
            hide: 'Hiding Place',
            wall: 'Wall'
        };
        return names[building] || building;
    }
    
    /**
     * Remove costup item
     */
    removeCostupItem(index) {
        this.settings.removeFromCostupSetup(index);
        this.updateCostupList();
    }
    
    /**
     * Move costup item
     */
    moveCostupItem(fromIndex, toIndex) {
        this.settings.moveInCostupSetup(fromIndex, toIndex);
        this.updateCostupList();
    }
    
    /**
     * Export settings
     */
    exportSettings() {
        try {
            const exportData = this.settings.export();
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `autobuilder_settings_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('❌ Failed to export settings:', error);
            alert('Failed to export settings!');
        }
    }
    
    /**
     * Import settings
     */
    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        if (this.settings.import(data)) {
                            this.loadCurrentSettings();
                            this.updateCostupList();
                            alert('Settings imported successfully!');
                        } else {
                            alert('Invalid settings file!');
                        }
                    } catch (error) {
                        console.error('❌ Failed to import settings:', error);
                        alert('Failed to import settings!');
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }
    
    /**
     * Show the settings panel
     */
    show() {
        try {
            console.log('🔍 Attempting to show Settings Panel...');
            
            if (!this.panel) {
                console.error('❌ Settings Panel not created yet');
                this.createPanel();
            }
            
            if (!this.panel) {
                console.error('❌ Failed to create Settings Panel');
                alert('Failed to create Settings Panel. Please refresh the page.');
                return;
            }
            
            this.panel.style.display = 'block';
            this.isVisible = true;
            console.log('✅ Settings Panel should now be visible');
            
            // Ensure panel is on top
            this.panel.style.zIndex = '10001';
            
        } catch (error) {
            console.error('❌ Failed to show Settings Panel:', error);
            alert('Failed to show Settings Panel: ' + error.message);
        }
    }
    
    /**
     * Hide the settings panel
     */
    hide() {
        this.panel.style.display = 'none';
        this.isVisible = false;
    }
    
    /**
     * Toggle the settings panel
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    /**
     * Create toggle button
     */
    createToggleButton() {
        const toggle = document.createElement('button');
        toggle.className = 'autobuilder-toggle';
        toggle.innerHTML = '⚙️';
        toggle.title = 'Auto Builder Settings';
        toggle.onclick = () => this.toggle();
        
        document.body.appendChild(toggle);
    }

    async refreshVillages() {
        try {
            console.log('🔄 Refreshing villages...');
            
            // Use the actual working data collection from Helper.js
            if (typeof getInfo === 'function') {
                await getInfo();
                console.log('✅ Village data refreshed using getInfo()');
            } else {
                console.warn('⚠️ getInfo() function not available');
            }
            
            // Re-render the village table
            this.renderVillageTemplatesTable();
            
        } catch (error) {
            console.error('❌ Failed to refresh villages:', error);
        }
    }

    renderVillageTemplatesTable() {
        const tableDiv = document.getElementById('villageTemplatesTable');
        if (!tableDiv) return;
        
        try {
            // Use the actual database from Helper.js
            const villages = typeof SimpleDB !== 'undefined' ? SimpleDB.getAllVillages() : {};
            const settings = window.AutoBuilder.getSettings();
            const templates = settings.getBuildingTemplates();
            const vt = settings.getAllVillageTemplates();
            const villageEntries = Object.entries(villages);
            
            let html = '';
            if (villageEntries.length === 0) {
                html += `<div style="color:#b00;font-size:13px;margin-bottom:8px;">No villages found. Please click 'Refresh Villages' or visit your villages in-game.</div>`;
            } else {
                html += `<table class="vis" style="width:100%;font-size:13px;">
                    <tr><th>Village</th><th>Template</th><th>Status</th></tr>`;
                villageEntries.forEach(([villageId, v]) => {
                    const name = v.info?.name || villageId;
                    const currentTemplate = vt[villageId] || '';
                    html += `<tr>
                        <td>${name} <span style="color:#999;font-size:11px;">(${villageId})</span></td>
                        <td>
                            <select data-village="${villageId}" class="village-template-select" style="font-size:13px;">
                                <option value="">-- Select Template --</option>`;
                    Object.keys(templates).forEach(tname => {
                        html += `<option value="${tname}"${currentTemplate===tname?' selected':''}>${tname}</option>`;
                    });
                    html += `</select>
                        </td>
                        <td>${currentTemplate ? `<span style='color:green;font-weight:bold;'>Active: ${currentTemplate}</span>` : '<span style="color:#999;">None</span>'}</td>
                    </tr>`;
                });
                html += `</table>`;
            }
            tableDiv.innerHTML = html;
            
            // Add event listeners
            tableDiv.querySelectorAll('.village-template-select').forEach(sel => {
                sel.addEventListener('change', (e) => {
                    const villageId = e.target.getAttribute('data-village');
                    const templateName = e.target.value;
                    settings.setVillageTemplate(villageId, templateName);
                    this.renderVillageTemplatesTable();
                });
            });
            
        } catch (error) {
            console.error('❌ Failed to render village templates table:', error);
            tableDiv.innerHTML = `<div style="color:#b00;font-size:13px;">Error loading villages: ${error.message}</div>`;
        }
    }
} 