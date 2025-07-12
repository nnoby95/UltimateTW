// ==UserScript==
// @name         Tribal Wars Auto Builder
// @version      1.0.0
// @description  Automated building system for Tribal Wars with clean database architecture
// @author       Your Name
// @include      https://*.klanhaboru.hu/*
// @include      https://*.tribalwars.net/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/database/DatabaseManager.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/database/DataCollector.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/bot/AutoBuildBot.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/bot/ResourceMonitor.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/bot/QueueManager.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/ui/SettingsPanel.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/ui/BuildQueueUI.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/ui/VillageManager.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/ui/TemplateManager.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/utils/DataHelper.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/utils/BuildingCosts.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/utils/TimeUtils.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/utils/GameUtils.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/config/Settings.js
// @require      https://raw.githubusercontent.com/nnoby95/UltimateTW/main/AutoBuild/src/config/BuildingConfig.js
// ==/UserScript==

(function() {
    'use strict';
    
    // Safety check - ensure we don't interfere with game loading
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Wait a bit more to ensure game is fully loaded
            setTimeout(() => {
                initializeAutoBuilder();
            }, 1000);
        });
    } else {
        // Page already loaded, wait a bit for game to settle
        setTimeout(() => {
            initializeAutoBuilder();
        }, 1000);
    }
    
    function initializeAutoBuilder() {
        try {
            // Check if we're on a Tribal Wars page
            if (!window.location.href.includes('tribalwars') && 
                !window.location.href.includes('klanhaboru') && 
                !window.location.href.includes('tribalwars.net')) {
                console.log('🚫 Not on Tribal Wars page, skipping AutoBuilder initialization');
                return;
            }
            
            // Check if game_data exists (Tribal Wars game object)
            if (typeof game_data === 'undefined') {
                console.log('⏳ Waiting for Tribal Wars game to load...');
                setTimeout(initializeAutoBuilder, 2000);
                return;
            }
            
            // Initialize Auto Builder
            class AutoBuilder {
                constructor() {
                    this.isInitialized = false;
                    this.settings = new Settings();
                    this.database = new DatabaseManager();
                    this.collector = new DataCollector();
                    this.bot = new AutoBuildBot();
                    this.monitor = new ResourceMonitor();
                    this.queueManager = new QueueManager();
                    this.ui = {
                        settings: new SettingsPanel(),
                        queue: new BuildQueueUI(),
                        village: new VillageManager(),
                        templates: new TemplateManager()
                    };
                }
                
                async init() {
                    try {
                        console.log('🏗️ Initializing Auto Builder...');
                        
                        // Initialize database
                        await this.database.init();
                        
                        // Load settings
                        this.settings.load();
                        
                        // Initialize UI with error handling
                        try {
                            this.ui.settings.init();
                        } catch (error) {
                            console.warn('⚠️ Settings Panel initialization failed:', error);
                        }
                        
                        try {
                            this.ui.queue.init();
                        } catch (error) {
                            console.warn('⚠️ Build Queue UI initialization failed:', error);
                        }
                        
                        try {
                            this.ui.village.init();
                        } catch (error) {
                            console.warn('⚠️ Village Manager initialization failed:', error);
                        }
                        
                        try {
                            this.ui.templates.init();
                        } catch (error) {
                            console.warn('⚠️ Template Manager initialization failed:', error);
                        }
                        
                        // Start bot if enabled
                        if (this.settings.get('autoBuildEnabled')) {
                            this.bot.start();
                        }
                        
                        // Start resource monitoring (passive collection only)
                        this.monitor.start();
                        
                        this.isInitialized = true;
                        console.log('✅ Auto Builder initialized successfully!');
                        
                    } catch (error) {
                        console.error('❌ Failed to initialize Auto Builder:', error);
                    }
                }
                
                // Public API
                getBot() { return this.bot; }
                getDatabase() { return this.database; }
                getSettings() { return this.settings; }
                getUI() { return this.ui; }
            }
            
            // Global instance
            window.AutoBuilder = new AutoBuilder();
            window.AutoBuilder.init();
            
            // Add global test function for debugging
            window.testAutoBuilder = function() {
                console.log('🧪 Testing AutoBuilder...');
                console.log('AutoBuilder object:', window.AutoBuilder);
                console.log('AutoBuilder UI:', window.AutoBuilder ? window.AutoBuilder.getUI() : 'Not available');
                console.log('Settings:', window.AutoBuilder ? window.AutoBuilder.getSettings() : 'Not available');
                
                if (window.AutoBuilder && window.AutoBuilder.getUI && window.AutoBuilder.getUI().settings) {
                    console.log('✅ AutoBuilder UI is available, testing show()...');
                    window.AutoBuilder.getUI().settings.show();
                } else {
                    console.error('❌ AutoBuilder UI not available');
                }
            };
            
            // Try to inject button multiple times with different strategies
            injectAutoBuilderButton();
            
            // Fallback: create floating button after 3 seconds if no button found
            setTimeout(() => {
                if (!document.getElementById('autobuilder-toggle-btn')) {
                    console.log('🔄 Creating fallback floating button...');
                    createFloatingButton();
                }
            }, 3000);
            
        } catch (error) {
            console.error('❌ AutoBuilder initialization failed:', error);
        }
    }

    function injectAutoBuilderButton() {
        // Try to find the Settings button in the top bar
        let settingsBtn = Array.from(document.querySelectorAll('a, button')).find(
            el => el.textContent.trim() === 'Settings' || el.title === 'Settings'
        );

        // Fallback to previous logic if not found
        let questBtn = null;
        if (!settingsBtn) {
            questBtn = document.querySelector('#new_quest.quest') ||
                       document.querySelector('#questlog') || 
                       document.querySelector('.questlog') || 
                       document.querySelector('[id^="quest"]') ||
                       document.querySelector('#new_quest') ||
                       document.querySelector('.quest');
        }
        
        // If neither found, try to find a suitable location in the navigation area
        if (!settingsBtn && !questBtn) {
            questBtn = document.querySelector('.navigation') || 
                       document.querySelector('.menu') ||
                       document.querySelector('.header') ||
                       document.querySelector('.topbar');
            if (!questBtn) {
                console.log('🔍 Settings/Quest button not found, retrying in 1 second...');
                setTimeout(injectAutoBuilderButton, 1000);
                return;
            }
        }

        // Check if button already exists
        if (document.getElementById('autobuilder-toggle-btn')) {
            console.log('✅ AutoBuilder button already exists');
            return;
        }

        console.log('🔧 Creating AutoBuilder button...');

        // Create the button
        const btn = document.createElement('button');
        btn.id = 'autobuilder-toggle-btn';
        btn.innerHTML = '🏗️ AutoBuilder';
        btn.style.display = 'inline-block';
        btn.style.margin = '0 0 0 8px';
        btn.style.width = '120px';
        btn.style.background = '#e6c590';
        btn.style.border = '2px solid #b08d57';
        btn.style.borderRadius = '6px';
        btn.style.color = '#5c4320';
        btn.style.fontWeight = 'bold';
        btn.style.fontSize = '14px';
        btn.style.cursor = 'pointer';
        btn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
        btn.style.zIndex = 10001;
        btn.style.position = 'relative';
        btn.onmouseover = () => btn.style.background = '#f5e1b8';
        btn.onmouseout = () => btn.style.background = '#e6c590';
        btn.onclick = () => {
            try {
                console.log('🔘 AutoBuilder button clicked');
                if (window.AutoBuilder && window.AutoBuilder.getUI && window.AutoBuilder.getUI().settings) {
                    window.AutoBuilder.getUI().settings.show();
                    console.log('✅ Settings panel should be visible now');
                } else {
                    console.error('❌ AutoBuilder UI not available');
                    alert('AutoBuilder UI not available! Please refresh the page.');
                }
            } catch (e) {
                console.error('❌ AutoBuilder UI failed to open:', e);
                alert('AutoBuilder UI failed to open! Error: ' + e.message);
            }
        };

        // Insert the button after the Settings button if found
        if (settingsBtn && settingsBtn.parentNode) {
            settingsBtn.parentNode.insertBefore(btn, settingsBtn.nextSibling);
            console.log('✅ AutoBuilder button inserted after Settings button');
        } else if (questBtn && questBtn.parentNode) {
            questBtn.parentNode.insertBefore(btn, questBtn.nextSibling);
            console.log('✅ AutoBuilder button inserted after quest button');
        } else if (questBtn) {
            questBtn.appendChild(btn);
            console.log('✅ AutoBuilder button appended to quest button');
        } else {
            document.body.appendChild(btn);
            console.log('✅ AutoBuilder button appended to body (fallback)');
        }
        
        console.log('🎉 AutoBuilder button created successfully!');
    }

    function createFloatingButton() {
        // Check if floating button already exists
        if (document.getElementById('autobuilder-floating-btn')) {
            return;
        }

        console.log('🎈 Creating floating AutoBuilder button...');

        const floatingBtn = document.createElement('button');
        floatingBtn.id = 'autobuilder-floating-btn';
        floatingBtn.innerHTML = '🏗️';
        floatingBtn.title = 'AutoBuilder Settings';
        floatingBtn.style.position = 'fixed';
        floatingBtn.style.top = '10px';
        floatingBtn.style.right = '10px';
        floatingBtn.style.width = '50px';
        floatingBtn.style.height = '50px';
        floatingBtn.style.background = '#4a90e2';
        floatingBtn.style.color = 'white';
        floatingBtn.style.border = 'none';
        floatingBtn.style.borderRadius = '50%';
        floatingBtn.style.cursor = 'pointer';
        floatingBtn.style.fontSize = '20px';
        floatingBtn.style.zIndex = '10000';
        floatingBtn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
        floatingBtn.style.fontWeight = 'bold';
        
        floatingBtn.onmouseover = () => {
            floatingBtn.style.background = '#357abd';
            floatingBtn.style.transform = 'scale(1.1)';
        };
        
        floatingBtn.onmouseout = () => {
            floatingBtn.style.background = '#4a90e2';
            floatingBtn.style.transform = 'scale(1)';
        };
        
        floatingBtn.onclick = () => {
            try {
                console.log('🔘 Floating AutoBuilder button clicked');
                if (window.AutoBuilder && window.AutoBuilder.getUI && window.AutoBuilder.getUI().settings) {
                    window.AutoBuilder.getUI().settings.show();
                    console.log('✅ Settings panel should be visible now');
                } else {
                    console.error('❌ AutoBuilder UI not available');
                    alert('AutoBuilder UI not available! Please refresh the page.');
                }
            } catch (e) {
                console.error('❌ AutoBuilder UI failed to open:', e);
                alert('AutoBuilder UI failed to open! Error: ' + e.message);
            }
        };

        document.body.appendChild(floatingBtn);
        console.log('🎉 Floating AutoBuilder button created successfully!');
    }
    
})(); 
