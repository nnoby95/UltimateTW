/**
 * Template Manager UI
 * Provides user interface for managing building templates
 */
class TemplateManager {
    constructor() {
        this.settings = null;
        this.panel = null;
        this.isVisible = false;
    }
    
    /**
     * Initialize the template manager
     */
    init() {
        this.settings = window.AutoBuilder.getSettings();
        this.createPanel();
        this.addStyles();
        console.log('📋 Template Manager initialized');
    }
    
    /**
     * Create the template manager panel
     */
    createPanel() {
        // Remove existing panel
        const existing = document.getElementById('autobuilder-templates');
        if (existing) {
            existing.remove();
        }
        
        // Create new panel
        this.panel = document.createElement('div');
        this.panel.id = 'autobuilder-templates';
        this.panel.className = 'autobuilder-panel';
        this.panel.style.display = 'none';
        
        this.panel.innerHTML = `
            <div class="autobuilder-header">
                <h3>📋 Building Templates</h3>
                <div style="display:flex;gap:4px;align-items:center;">
                    <button class="autobuilder-minimize" id="autobuilder-templates-minimize" title="Minimize">_</button>
                    <button class="autobuilder-close" id="autobuilder-templates-close">×</button>
                </div>
            </div>
            <div class="autobuilder-content">
                <div class="autobuilder-section">
                    <h4>🎯 Active Template</h4>
                    <div class="setting-group">
                        <select id="activeTemplate">
                            <option value="">No template active</option>
                        </select>
                        <button id="applyTemplate" class="autobuilder-btn autobuilder-btn-primary">Apply Template</button>
                    </div>
                </div>
                
                <div class="autobuilder-section">
                    <h4>➕ Create New Template</h4>
                    <div class="template-form">
                        <div class="form-group">
                            <label>Template Name:</label>
                            <input type="text" id="templateName" placeholder="e.g., WarehouseBoost">
                        </div>
                        <div class="form-group">
                            <label>Description:</label>
                            <input type="text" id="templateDescription" placeholder="Template description">
                        </div>
                        <div class="form-group">
                            <label>Building Sequence:</label>
                            <div class="sequence-builder">
                                <div class="sequence-controls">
                                    <select id="sequenceBuilding">
                                        <!-- Building options will be populated -->
                                    </select>
                                    <input type="number" id="sequenceLevel" placeholder="Level" min="1" max="30">
                                    <button id="addToSequence" class="autobuilder-btn autobuilder-btn-secondary">Add to Sequence</button>
                                </div>
                                <div class="sequence-list">
                                    <h5>Current Sequence:</h5>
                                    <div id="sequenceList" class="sequence-items">
                                        <!-- Sequence items will be populated here -->
                                    </div>
                                    <button id="clearSequence" class="autobuilder-btn autobuilder-btn-secondary">Clear Sequence</button>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <button id="createTemplate" class="autobuilder-btn autobuilder-btn-primary">Create Template</button>
                        </div>
                    </div>
                </div>
                
                <div class="autobuilder-section">
                    <h4>📋 Existing Templates</h4>
                    <div id="templatesList" class="templates-list">
                        <!-- Templates will be populated here -->
                    </div>
                </div>
                
                <div class="autobuilder-section">
                    <h4>📊 Template Statistics</h4>
                    <div id="templateStats" class="template-stats">
                        <!-- Template statistics will be shown here -->
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.panel);
        this.makeDraggable(this.panel, this.panel.querySelector('.autobuilder-header'));
        this.populateBuildingDropdown();
        this.bindEvents();
        this.loadTemplates();
        this.updateActiveTemplate();
        // Attach close event
        const closeBtn = this.panel.querySelector('#autobuilder-templates-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }
        if (!document.getElementById('autobuilder-templates-restore')) {
            const restoreBtn = document.createElement('button');
            restoreBtn.id = 'autobuilder-templates-restore';
            restoreBtn.className = 'autobuilder-restore';
            restoreBtn.innerText = 'Building Templates';
            restoreBtn.onclick = () => {
                this.panel.style.display = 'block';
                restoreBtn.style.display = 'none';
            };
            document.body.appendChild(restoreBtn);
        }
    }
    
    /**
     * Populate building dropdown
     */
    populateBuildingDropdown() {
        const buildingSelect = document.getElementById('sequenceBuilding');
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
    }
    
    /**
     * Get building display name
     */
    getBuildingDisplayName(building) {
        const names = {
            'main': 'Main Building',
            'barracks': 'Barracks',
            'stable': 'Stable',
            'garage': 'Workshop',
            'smith': 'Smithy',
            'market': 'Marketplace',
            'wood': 'Timber Camp',
            'stone': 'Clay Pit',
            'iron': 'Iron Mine',
            'farm': 'Farm',
            'storage': 'Warehouse',
            'hide': 'Hiding Place',
            'wall': 'Wall',
            'church': 'Church',
            'watchtower': 'Watchtower',
            'snob': 'Academy',
            'place': 'Palace',
            'statue': 'Statue'
        };
        return names[building] || building;
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Active template selection
        const activeTemplateSelect = document.getElementById('activeTemplate');
        if (activeTemplateSelect) {
            activeTemplateSelect.addEventListener('change', () => {
                this.settings.set('activeTemplate', activeTemplateSelect.value);
                this.updateTemplateStats();
            });
        }
        
        // Apply template button
        const applyTemplateBtn = document.getElementById('applyTemplate');
        if (applyTemplateBtn) {
            applyTemplateBtn.addEventListener('click', () => {
                this.applyTemplate();
            });
        }
        
        // Add to sequence button
        const addToSequenceBtn = document.getElementById('addToSequence');
        if (addToSequenceBtn) {
            addToSequenceBtn.addEventListener('click', () => {
                this.addToSequence();
            });
        }
        
        // Clear sequence button
        const clearSequenceBtn = document.getElementById('clearSequence');
        if (clearSequenceBtn) {
            clearSequenceBtn.addEventListener('click', () => {
                this.clearSequence();
            });
        }
        
        // Create template button
        const createTemplateBtn = document.getElementById('createTemplate');
        if (createTemplateBtn) {
            createTemplateBtn.addEventListener('click', () => {
                this.createTemplate();
            });
        }
        const minimizeBtn = document.getElementById('autobuilder-templates-minimize');
        const restoreBtn = document.getElementById('autobuilder-templates-restore');
        if (minimizeBtn && restoreBtn) {
            minimizeBtn.addEventListener('click', () => {
                this.panel.style.display = 'none';
                restoreBtn.style.display = 'block';
            });
        }
    }
    
    /**
     * Load and display templates
     */
    loadTemplates() {
        const templates = this.settings.getBuildingTemplates();
        const templatesList = document.getElementById('templatesList');
        const activeTemplateSelect = document.getElementById('activeTemplate');
        
        if (!templatesList || !activeTemplateSelect) return;
        
        // Clear existing templates
        templatesList.innerHTML = '';
        activeTemplateSelect.innerHTML = '<option value="">No template active</option>';
        
        // Add templates
        Object.keys(templates).forEach(templateName => {
            const template = templates[templateName];
            
            // Add to active template dropdown
            const option = document.createElement('option');
            option.value = templateName;
            option.textContent = templateName;
            activeTemplateSelect.appendChild(option);
            
            // Add to templates list
            const templateDiv = document.createElement('div');
            templateDiv.className = 'template-item';
            templateDiv.innerHTML = `
                <div class="template-header">
                    <h5>${templateName}</h5>
                    <div class="template-actions">
                        <button class="autobuilder-btn autobuilder-btn-small" onclick="window.AutoBuilder.getUI().templates.editTemplate('${templateName}')">Edit</button>
                        <button class="autobuilder-btn autobuilder-btn-small autobuilder-btn-danger" onclick="window.AutoBuilder.getUI().templates.deleteTemplate('${templateName}')">Delete</button>
                    </div>
                </div>
                <div class="template-info">
                    <p><strong>Description:</strong> ${template.description || 'No description'}</p>
                    <p><strong>Buildings:</strong> ${template.sequence.length}</p>
                    <p><strong>Created:</strong> ${new Date(template.created_at).toLocaleDateString()}</p>
                </div>
                <div class="template-sequence">
                    <strong>Sequence:</strong>
                    <div class="sequence-preview">
                        ${template.sequence.map((plan, index) => 
                            `${index + 1}. ${this.getBuildingDisplayName(plan.building)} → Level ${plan.target_level}`
                        ).join('<br>')}
                    </div>
                </div>
            `;
            
            templatesList.appendChild(templateDiv);
        });
        
        // Set active template
        const activeTemplate = this.settings.get('activeTemplate');
        if (activeTemplate && templates[activeTemplate]) {
            activeTemplateSelect.value = activeTemplate;
        }
    }
    
    /**
     * Update active template dropdown
     */
    updateActiveTemplate() {
        const activeTemplateSelect = document.getElementById('activeTemplate');
        if (!activeTemplateSelect) return;
        
        const activeTemplate = this.settings.get('activeTemplate');
        if (activeTemplate) {
            activeTemplateSelect.value = activeTemplate;
        }
    }
    
    /**
     * Apply selected template
     */
    applyTemplate() {
        const activeTemplateSelect = document.getElementById('activeTemplate');
        if (!activeTemplateSelect || !activeTemplateSelect.value) {
            alert('Please select a template to apply');
            return;
        }
        
        const templateName = activeTemplateSelect.value;
        const success = this.settings.applyBuildingTemplate(templateName);
        
        if (success) {
            alert(`Template "${templateName}" applied successfully!`);
            // Refresh the settings panel if it exists
            const settingsPanel = window.AutoBuilder.getUI().settings;
            if (settingsPanel && settingsPanel.updateCostupList) {
                settingsPanel.updateCostupList();
            }
        } else {
            alert('Failed to apply template');
        }
    }
    
    /**
     * Add building to sequence
     */
    addToSequence() {
        const buildingSelect = document.getElementById('sequenceBuilding');
        const levelInput = document.getElementById('sequenceLevel');
        
        if (!buildingSelect || !levelInput) return;
        
        const building = buildingSelect.value;
        const level = parseInt(levelInput.value);
        
        if (!building || !level || level < 1) {
            alert('Please select a building and enter a valid level');
            return;
        }
        
        // Add to sequence list
        this.addSequenceItem(building, level);
        
        // Clear inputs
        levelInput.value = '';
    }
    
    /**
     * Add item to sequence list
     */
    addSequenceItem(building, level) {
        const sequenceList = document.getElementById('sequenceList');
        if (!sequenceList) return;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'sequence-item';
        itemDiv.innerHTML = `
            <span>${this.getBuildingDisplayName(building)} → Level ${level}</span>
            <button class="autobuilder-btn autobuilder-btn-small autobuilder-btn-danger" onclick="this.parentElement.remove()">Remove</button>
        `;
        
        sequenceList.appendChild(itemDiv);
    }
    
    /**
     * Clear sequence
     */
    clearSequence() {
        const sequenceList = document.getElementById('sequenceList');
        if (sequenceList) {
            sequenceList.innerHTML = '';
        }
    }
    
    /**
     * Create new template
     */
    createTemplate() {
        const nameInput = document.getElementById('templateName');
        const descInput = document.getElementById('templateDescription');
        const sequenceList = document.getElementById('sequenceList');
        
        if (!nameInput || !descInput || !sequenceList) return;
        
        const templateName = nameInput.value.trim();
        const description = descInput.value.trim();
        
        if (!templateName) {
            alert('Please enter a template name');
            return;
        }
        
        // Get sequence from list
        const sequence = [];
        const sequenceItems = sequenceList.querySelectorAll('.sequence-item');
        
        sequenceItems.forEach(item => {
            const text = item.querySelector('span').textContent;
            const match = text.match(/(.+) → Level (\d+)/);
            if (match) {
                const buildingName = this.getBuildingKey(match[1]);
                const level = parseInt(match[2]);
                sequence.push({ building: buildingName, target_level: level });
            }
        });
        
        if (sequence.length === 0) {
            alert('Please add at least one building to the sequence');
            return;
        }
        
        // Create template
        const success = this.settings.createBuildingTemplate(templateName, sequence, description);
        
        if (success) {
            alert(`Template "${templateName}" created successfully!`);
            this.loadTemplates();
            this.clearForm();
        } else {
            alert('Failed to create template');
        }
    }
    
    /**
     * Get building key from display name
     */
    getBuildingKey(displayName) {
        const names = {
            'Main Building': 'main',
            'Barracks': 'barracks',
            'Stable': 'stable',
            'Workshop': 'garage',
            'Smithy': 'smith',
            'Marketplace': 'market',
            'Timber Camp': 'wood',
            'Clay Pit': 'stone',
            'Iron Mine': 'iron',
            'Farm': 'farm',
            'Warehouse': 'storage',
            'Hiding Place': 'hide',
            'Wall': 'wall',
            'Church': 'church',
            'Watchtower': 'watchtower',
            'Academy': 'snob',
            'Palace': 'place',
            'Statue': 'statue'
        };
        return names[displayName] || displayName.toLowerCase();
    }
    
    /**
     * Clear form
     */
    clearForm() {
        const nameInput = document.getElementById('templateName');
        const descInput = document.getElementById('templateDescription');
        
        if (nameInput) nameInput.value = '';
        if (descInput) descInput.value = '';
        this.clearSequence();
    }
    
    /**
     * Edit template
     */
    editTemplate(templateName) {
        const template = this.settings.getBuildingTemplate(templateName);
        if (!template) {
            alert('Template not found');
            return;
        }
        
        // Populate form with template data
        const nameInput = document.getElementById('templateName');
        const descInput = document.getElementById('templateDescription');
        
        if (nameInput) nameInput.value = templateName;
        if (descInput) descInput.value = template.description || '';
        
        // Clear and populate sequence
        this.clearSequence();
        template.sequence.forEach(plan => {
            this.addSequenceItem(plan.building, plan.target_level);
        });
        
        // Change button text
        const createBtn = document.getElementById('createTemplate');
        if (createBtn) {
            createBtn.textContent = 'Update Template';
            createBtn.onclick = () => this.updateTemplate(templateName);
        }
    }
    
    /**
     * Update template
     */
    updateTemplate(templateName) {
        const nameInput = document.getElementById('templateName');
        const descInput = document.getElementById('templateDescription');
        const sequenceList = document.getElementById('sequenceList');
        
        if (!nameInput || !descInput || !sequenceList) return;
        
        const newName = nameInput.value.trim();
        const description = descInput.value.trim();
        
        if (!newName) {
            alert('Please enter a template name');
            return;
        }
        
        // Get sequence from list
        const sequence = [];
        const sequenceItems = sequenceList.querySelectorAll('.sequence-item');
        
        sequenceItems.forEach(item => {
            const text = item.querySelector('span').textContent;
            const match = text.match(/(.+) → Level (\d+)/);
            if (match) {
                const buildingName = this.getBuildingKey(match[1]);
                const level = parseInt(match[2]);
                sequence.push({ building: buildingName, target_level: level });
            }
        });
        
        if (sequence.length === 0) {
            alert('Please add at least one building to the sequence');
            return;
        }
        
        // Update template
        const success = this.settings.updateBuildingTemplate(templateName, sequence, description);
        
        if (success) {
            alert(`Template "${templateName}" updated successfully!`);
            this.loadTemplates();
            this.clearForm();
            
            // Reset button
            const createBtn = document.getElementById('createTemplate');
            if (createBtn) {
                createBtn.textContent = 'Create Template';
                createBtn.onclick = () => this.createTemplate();
            }
        } else {
            alert('Failed to update template');
        }
    }
    
    /**
     * Delete template
     */
    deleteTemplate(templateName) {
        if (!confirm(`Are you sure you want to delete template "${templateName}"?`)) {
            return;
        }
        
        const success = this.settings.deleteBuildingTemplate(templateName);
        
        if (success) {
            alert(`Template "${templateName}" deleted successfully!`);
            this.loadTemplates();
        } else {
            alert('Failed to delete template');
        }
    }
    
    /**
     * Update template statistics
     */
    updateTemplateStats() {
        const activeTemplate = this.settings.get('activeTemplate');
        const statsDiv = document.getElementById('templateStats');
        
        if (!statsDiv) return;
        
        if (!activeTemplate) {
            statsDiv.innerHTML = '<p>No active template</p>';
            return;
        }
        
        const stats = this.settings.getTemplateStats(activeTemplate);
        if (!stats) {
            statsDiv.innerHTML = '<p>Template not found</p>';
            return;
        }
        
        statsDiv.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <strong>Total Buildings:</strong> ${stats.totalBuildings}
                </div>
                <div class="stat-item">
                    <strong>Total Wood:</strong> ${this.formatNumber(stats.totalCosts.wood)}
                </div>
                <div class="stat-item">
                    <strong>Total Stone:</strong> ${this.formatNumber(stats.totalCosts.stone)}
                </div>
                <div class="stat-item">
                    <strong>Total Iron:</strong> ${this.formatNumber(stats.totalCosts.iron)}
                </div>
                <div class="stat-item">
                    <strong>Estimated Time:</strong> ${this.formatDuration(stats.estimatedTime)}
                </div>
            </div>
        `;
    }
    
    /**
     * Format number
     */
    formatNumber(num) {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        } else {
            return num.toString();
        }
    }
    
    /**
     * Format duration
     */
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }
    
    /**
     * Add CSS styles
     */
    addStyles() {
        const styles = `
            .template-item {
                border: 1px solid #ddd;
                border-radius: 4px;
                margin: 10px 0;
                padding: 15px;
                background: #f9f9f9;
            }
            
            .template-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .template-actions {
                display: flex;
                gap: 5px;
            }
            
            .template-info {
                margin-bottom: 10px;
            }
            
            .template-info p {
                margin: 5px 0;
            }
            
            .sequence-preview {
                background: white;
                padding: 10px;
                border-radius: 4px;
                margin-top: 5px;
                font-family: monospace;
                font-size: 12px;
            }
            
            .sequence-builder {
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 15px;
                background: #f9f9f9;
            }
            
            .sequence-controls {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
                align-items: center;
            }
            
            .sequence-items {
                max-height: 200px;
                overflow-y: auto;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 10px;
                background: white;
            }
            
            .sequence-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 5px;
                border-bottom: 1px solid #eee;
            }
            
            .sequence-item:last-child {
                border-bottom: none;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 10px;
            }
            
            .stat-item {
                background: white;
                padding: 10px;
                border-radius: 4px;
                border: 1px solid #ddd;
                text-align: center;
            }
            
            .autobuilder-btn-small {
                padding: 2px 8px;
                font-size: 11px;
            }
            
            .autobuilder-btn-danger {
                background: #dc3545;
                color: white;
            }
            
            .autobuilder-btn-danger:hover {
                background: #c82333;
            }
            .autobuilder-minimize {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0 6px;
                width: 28px;
            }
            .autobuilder-minimize:hover {
                color: #ffe082;
            }
            .autobuilder-restore {
                position: fixed;
                left: 18px;
                bottom: 60px;
                z-index: 10001;
                background: #c1a264;
                color: #fff;
                border: none;
                border-radius: 6px;
                font-size: 18px;
                padding: 6px 16px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                cursor: pointer;
                display: none;
            }
            .autobuilder-restore:hover {
                background: #a07d3b;
            }
        `;
        
        if (!document.getElementById('autobuilder-template-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'autobuilder-template-styles';
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }
    }
    
    /**
     * Show the panel
     */
    show() {
        if (this.panel) {
            this.panel.style.display = 'block';
            this.isVisible = true;
            this.loadTemplates();
            this.updateTemplateStats();
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
     * Toggle panel visibility
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
        const button = document.createElement('button');
        button.className = 'autobuilder-toggle-btn';
        button.innerHTML = '📋 Templates';
        button.onclick = () => this.toggle();
        return button;
    }

    makeDraggable(element, handle) {
        let isDragging = false, startX, startY, startLeft, startTop;
        handle = handle || element;
        handle.style.cursor = 'move';
        handle.onmousedown = (e) => {
            // Only recalculate position if transform is set (first drag)
            if (element.style.transform) {
                const rect = element.getBoundingClientRect();
                element.style.left = rect.left + 'px';
                element.style.top = rect.top + 'px';
                element.style.right = '';
                element.style.bottom = '';
                element.style.position = 'fixed';
                element.style.transform = '';
            }
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = element.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            document.onmousemove = (e2) => {
                if (!isDragging) return;
                const dx = e2.clientX - startX;
                const dy = e2.clientY - startY;
                element.style.left = (startLeft + dx) + 'px';
                element.style.top = (startTop + dy) + 'px';
            };
            document.onmouseup = () => {
                isDragging = false;
                document.onmousemove = null;
                document.onmouseup = null;
            };
        };
    }
} 