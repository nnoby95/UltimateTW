/**
 * Template Manager for AutoBuild
 * Handles building templates and sequences
 * Simple and focused on building order logic
 */
class TemplateManager {
    constructor() {
        this.templates = this.getDefaultTemplates();
        this.loadCustomTemplates();
    }

    /**
     * Get default building templates
     * @returns {Object} Default templates
     */
    getDefaultTemplates() {
        return {
            // Basic starter template
            'starter': {
                name: 'Starter Village',
                description: 'Basic template for new villages',
                sequence: [
                    { building: 'main', level: 3 },
                    { building: 'barracks', level: 1 },
                    { building: 'farm', level: 5 },
                    { building: 'warehouse', level: 3 },
                    { building: 'main', level: 5 },
                    { building: 'barracks', level: 3 },
                    { building: 'stable', level: 1 },
                    { building: 'farm', level: 10 },
                    { building: 'warehouse', level: 5 },
                    { building: 'market', level: 1 }
                ]
            },

            // Military focused template
            'military': {
                name: 'Military Focus',
                description: 'Focus on military buildings and production',
                sequence: [
                    { building: 'main', level: 3 },
                    { building: 'barracks', level: 1 },
                    { building: 'farm', level: 5 },
                    { building: 'warehouse', level: 3 },
                    { building: 'barracks', level: 5 },
                    { building: 'stable', level: 3 },
                    { building: 'garage', level: 1 },
                    { building: 'smith', level: 3 },
                    { building: 'main', level: 10 },
                    { building: 'farm', level: 15 },
                    { building: 'barracks', level: 10 },
                    { building: 'stable', level: 10 }
                ]
            },

            // Resource focused template
            'resource': {
                name: 'Resource Focus',
                description: 'Focus on resource production and storage',
                sequence: [
                    { building: 'main', level: 3 },
                    { building: 'warehouse', level: 5 },
                    { building: 'farm', level: 10 },
                    { building: 'wood', level: 10 },
                    { building: 'stone', level: 10 },
                    { building: 'iron', level: 10 },
                    { building: 'market', level: 3 },
                    { building: 'warehouse', level: 10 },
                    { building: 'main', level: 10 },
                    { building: 'farm', level: 20 }
                ]
            },

            // Balanced template
            'balanced': {
                name: 'Balanced Development',
                description: 'Balanced approach to village development',
                sequence: [
                    { building: 'main', level: 3 },
                    { building: 'barracks', level: 1 },
                    { building: 'farm', level: 5 },
                    { building: 'warehouse', level: 3 },
                    { building: 'wood', level: 5 },
                    { building: 'stone', level: 5 },
                    { building: 'iron', level: 5 },
                    { building: 'main', level: 5 },
                    { building: 'barracks', level: 3 },
                    { building: 'stable', level: 1 },
                    { building: 'farm', level: 10 },
                    { building: 'warehouse', level: 5 },
                    { building: 'market', level: 1 },
                    { building: 'smith', level: 1 },
                    { building: 'wall', level: 3 }
                ]
            }
        };
    }

    /**
     * Load custom templates from storage
     */
    loadCustomTemplates() {
        try {
            const saved = localStorage.getItem('autobuild_custom_templates');
            if (saved) {
                const customTemplates = JSON.parse(saved);
                this.templates = { ...this.templates, ...customTemplates };
            }
        } catch (error) {
            console.error('❌ Error loading custom templates:', error);
        }
    }

    /**
     * Save custom templates to storage
     */
    saveCustomTemplates() {
        try {
            // Only save non-default templates
            const customTemplates = {};
            const defaultNames = Object.keys(this.getDefaultTemplates());
            
            Object.entries(this.templates).forEach(([name, template]) => {
                if (!defaultNames.includes(name)) {
                    customTemplates[name] = template;
                }
            });

            localStorage.setItem('autobuild_custom_templates', JSON.stringify(customTemplates));
            console.log('✅ Custom templates saved');
        } catch (error) {
            console.error('❌ Error saving custom templates:', error);
        }
    }

    /**
     * Get all available templates
     * @returns {Object} All templates
     */
    getAllTemplates() {
        return this.templates;
    }

    /**
     * Get specific template
     * @param {string} templateName - Template name
     * @returns {Object} Template data
     */
    getTemplate(templateName) {
        return this.templates[templateName] || null;
    }

    /**
     * Find next building to build based on template and current buildings
     * @param {string} templateName - Template to use
     * @param {Object} currentBuildings - Current building levels
     * @returns {Object} Next building to build or null
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
                return {
                    building: step.building,
                    currentLevel: currentLevel,
                    targetLevel: step.level,
                    nextLevel: currentLevel + 1
                };
            }
        }

        // Template completed
        return null;
    }

    /**
     * Check template completion progress
     * @param {string} templateName - Template to check
     * @param {Object} currentBuildings - Current building levels
     * @returns {Object} Progress information
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
     * Add custom template
     * @param {string} name - Template name
     * @param {Object} templateData - Template data
     * @returns {boolean} Success
     */
    addTemplate(name, templateData) {
        try {
            this.templates[name] = {
                name: templateData.name || name,
                description: templateData.description || 'Custom template',
                sequence: templateData.sequence || [],
                isCustom: true
            };
            
            this.saveCustomTemplates();
            console.log(`✅ Template '${name}' added`);
            return true;
        } catch (error) {
            console.error(`❌ Error adding template '${name}':`, error);
            return false;
        }
    }

    /**
     * Delete custom template
     * @param {string} name - Template name
     * @returns {boolean} Success
     */
    deleteTemplate(name) {
        // Don't allow deleting default templates
        const defaultNames = Object.keys(this.getDefaultTemplates());
        if (defaultNames.includes(name)) {
            console.error(`❌ Cannot delete default template '${name}'`);
            return false;
        }

        try {
            delete this.templates[name];
            this.saveCustomTemplates();
            console.log(`✅ Template '${name}' deleted`);
            return true;
        } catch (error) {
            console.error(`❌ Error deleting template '${name}':`, error);
            return false;
        }
    }

    /**
     * Get village template assignment
     * @param {string} villageId - Village ID
     * @returns {string} Assigned template name
     */
    getVillageTemplate(villageId) {
        try {
            const assignments = JSON.parse(localStorage.getItem('autobuild_village_templates') || '{}');
            return assignments[villageId] || 'balanced'; // Default to balanced
        } catch (error) {
            console.error('❌ Error getting village template:', error);
            return 'balanced';
        }
    }

    /**
     * Set village template assignment
     * @param {string} villageId - Village ID
     * @param {string} templateName - Template name
     * @returns {boolean} Success
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
}

// Export for use
if (typeof window !== 'undefined') {
    window.TemplateManager = TemplateManager;
    console.log('📋 Template Manager loaded!');
} 