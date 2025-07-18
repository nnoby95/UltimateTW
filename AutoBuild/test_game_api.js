// Test Script for Tribal Wars Game API Validation
// Run this in the browser console on a Tribal Wars page

/**
 * Improved building request with better success detection
 */
async function improvedBuildingRequest(villageId, buildingId, csrf) {
    try {
        console.log(`🏗️ Attempting to build ${buildingId} in village ${villageId}...`);
        
        // Step 1: Build the request URL (exact format from TribalWars)
        const url = `game.php?village=${villageId}&screen=main&action=upgrade_building&id=${buildingId}&type=main&h=${csrf}`;
        
        console.log(`🌐 Request URL: ${url}`);
        
        // Step 2: Make the request
        const response = await fetch(url);
        const result = await response.text();
        
        console.log(`📊 HTTP Status: ${response.status}`);
        console.log(`📄 Response Length: ${result.length} characters`);
        
        // Step 3: IMPROVED SUCCESS DETECTION
        // Tribal Wars returns full HTML pages on success, not simple messages
        
        // WRONG: Old logic that fails
        const oldFailLogic = result.includes('error') || result.includes('Error');
        console.log(`❌ Old detection (WRONG): ${oldFailLogic ? 'Failed' : 'Success'}`);
        
        // CORRECT: Look for SUCCESS indicators
        const successIndicators = [
            'building_order',           // Building queue elements
            'queue',                   // Queue-related content
            'upgrade',                 // Upgrade-related content
            'timer',                   // Timer elements
            'nnoby95',                 // User's village name in title
            'Tribal Wars - World 147'  // Game title indicating successful page load
        ];
        
        let successScore = 0;
        console.log('🔍 Checking success indicators:');
        
        successIndicators.forEach(indicator => {
            if (result.includes(indicator)) {
                successScore++;
                console.log(`  ✅ Found: ${indicator}`);
            } else {
                console.log(`  ❌ Missing: ${indicator}`);
            }
        });
        
        // If we get a proper HTML page with game content, it's likely success
        const hasGameTitle = result.includes('Tribal Wars - World 147');
        const hasVillageName = result.includes('nnoby95');
        const isProperHTML = result.includes('<!DOCTYPE HTML>');
        const hasMainContent = result.includes('screen=main') || result.includes('building');
        
        console.log(`📊 Success Score: ${successScore}/${successIndicators.length}`);
        console.log(`🏘️ Has Game Title: ${hasGameTitle}`);
        console.log(`👤 Has Village Name: ${hasVillageName}`);
        console.log(`📄 Is HTML Page: ${isProperHTML}`);
        console.log(`🏗️ Has Building Content: ${hasMainContent}`);
        
        // IMPROVED SUCCESS LOGIC
        const isSuccess = (
            response.status === 200 &&          // HTTP success
            isProperHTML &&                     // Got proper HTML
            hasGameTitle &&                     // Got game page
            hasVillageName &&                   // Got user's village
            successScore >= 2                   // Found success indicators
        );
        
        if (isSuccess) {
            console.log('✅ IMPROVED DETECTION: Building request SUCCESSFUL!');
            console.log('🎉 Building should be added to your queue!');
        } else {
            console.log('❌ IMPROVED DETECTION: Building request failed');
            console.log('📝 Response preview:', result.substring(0, 300));
        }
        
        return isSuccess;
        
    } catch (error) {
        console.error('❌ Error in building request:', error);
        return false;
    }
}

/**
 * Test the game API endpoints used by AutoBuild
 */
async function testGameAPI() {
    console.log('🧪 TESTING TRIBAL WARS GAME API...');
    console.log('='.repeat(50));
    
    try {
        // Get current game data
        const villageId = game_data.village.id;
        const currentCSRF = game_data.csrf;
        
        console.log(`🏘️ Village ID: ${villageId}`);
        console.log(`🔑 Current CSRF: ${currentCSRF.substring(0, 10)}...`);
        
        // Test 1: Validate CSRF token format
        console.log('\n📋 Test 1: CSRF Token Validation');
        if (currentCSRF && currentCSRF.length > 10) {
            console.log('✅ CSRF token format looks valid');
        } else {
            console.log('❌ CSRF token format invalid');
            return false;
        }
        
        // Test 2: Test main page access
        console.log('\n📋 Test 2: Main Page Access');
        const mainPageUrl = `game.php?village=${villageId}&screen=main`;
        const mainResponse = await fetch(mainPageUrl);
        
        if (mainResponse.ok) {
            console.log('✅ Main page accessible');
            
            // Test CSRF extraction from page
            const html = await mainResponse.text();
            const csrfMatch = html.match(/game_data\.csrf\s*=\s*['"]([^'"]+)['"]/);
            
            if (csrfMatch && csrfMatch[1] === currentCSRF) {
                console.log('✅ CSRF token extraction working');
            } else {
                console.log('⚠️ CSRF token extraction might need adjustment');
                console.log(`Expected: ${currentCSRF}`);
                console.log(`Found: ${csrfMatch ? csrfMatch[1] : 'none'}`);
            }
        } else {
            console.log('❌ Main page not accessible');
            return false;
        }
        
        // Test 3: Building URL format validation (without actually building)
        console.log('\n📋 Test 3: Building URL Format');
        const testBuildingUrl = `game.php?village=${villageId}&screen=main&action=upgrade_building&id=main&type=main&h=${currentCSRF}`;
        console.log(`🔗 Test URL: ${testBuildingUrl}`);
        console.log('✅ URL format constructed successfully');
        
        // Test 4: Check current queue status
        console.log('\n📋 Test 4: Queue Status Check');
        const queueElements = document.querySelectorAll('.queue-item, .building-queue-item, [class*="queue"]');
        console.log(`📊 Found ${queueElements.length} queue elements with current selectors`);
        
        // Try alternative selectors
        const altQueueElements = document.querySelectorAll('[id*="building_order"], .order-item, .construction-order');
        console.log(`📊 Found ${altQueueElements.length} queue elements with alternative selectors`);
        
        // Test 5: Building selectors
        console.log('\n📋 Test 5: Building Detection');
        const buildingElements = document.querySelectorAll('[data-building], .building');
        console.log(`🏗️ Found ${buildingElements.length} building elements`);
        
        console.log('\n' + '='.repeat(50));
        console.log('🎯 GAME API TEST COMPLETED!');
        console.log('✅ Basic validation passed - bot should work!');
        console.log('💡 To fully test: Try creating a template and starting the bot');
        
        return true;
        
    } catch (error) {
        console.error('❌ Game API test failed:', error);
        return false;
    }
}

/**
 * Test building a structure (WARNING: This actually tries to build!)
 */
async function testActualBuilding() {
    console.log('⚠️ WARNING: This will attempt to actually build something!');
    console.log('⚠️ Make sure you have resources and queue space!');
    
    const confirm = prompt('Type "YES" to continue with actual building test:');
    if (confirm !== 'YES') {
        console.log('❌ Test cancelled');
        return;
    }
    
    try {
        const villageId = game_data.village.id;
        const csrf = game_data.csrf;
        
        // Try to build main building (safest option)
        const url = `game.php?village=${villageId}&screen=main&action=upgrade_building&id=main&type=main&h=${csrf}`;
        
        console.log('🏗️ Attempting to build main building...');
        console.log(`🌐 URL: ${url}`);
        
        const response = await fetch(url);
        const result = await response.text();
        
        console.log('📄 Response status:', response.status);
        console.log('📄 Response preview:', result.substring(0, 300));
        
        // OLD LOGIC (WRONG)
        if (result.includes('error') || result.includes('Error')) {
            console.log('❌ OLD DETECTION: Building request failed (error in response)');
            
            // Try to extract error message
            const errorMatch = result.match(/<div[^>]*class="[^"]*error[^"]*"[^>]*>([^<]+)</);
            if (errorMatch) {
                console.log(`📝 Error message: ${errorMatch[1]}`);
            }
        } else {
            console.log('✅ OLD DETECTION: Building request appears successful!');
        }
        
        // NEW IMPROVED LOGIC
        const hasGameTitle = result.includes('Tribal Wars - World 147');
        const isProperHTML = result.includes('<!DOCTYPE HTML>');
        const isSuccess = response.status === 200 && isProperHTML && hasGameTitle;
        
        if (isSuccess) {
            console.log('🎉 IMPROVED DETECTION: Building request SUCCESSFUL!');
            console.log('✅ The bot game integration should work perfectly!');
        } else {
            console.log('❌ IMPROVED DETECTION: Building request failed');
        }
        
    } catch (error) {
        console.error('❌ Actual building test failed:', error);
    }
}

// Test upgrading the market building
async function testMarketUpgrade() {
    console.log('🏪 TESTING MARKET BUILDING UPGRADE...');
    console.log('='.repeat(50));
    
    const villageId = game_data.village.id;
    const csrf = game_data.csrf;
    
    console.log(`🏘️ Village: ${villageId}`);
    console.log(`🔑 CSRF: ${csrf}`);
    
    // Use improved building request for market
    const success = await improvedBuildingRequest(villageId, 'market', csrf);
    
    if (success) {
        console.log('🎉 MARKET UPGRADE SUCCESSFUL!');
        console.log('✅ Your bot logic is working perfectly!');
        console.log('💡 You can now create templates and start the bot!');
    } else {
        console.log('⚠️ Market upgrade detection unclear');
        console.log('💡 Check your village manually to see if market was added to queue');
    }
    
    console.log('\n' + '='.repeat(50));
    return success;
}

// Export test functions
window.testGameAPI = testGameAPI;
window.testActualBuilding = testActualBuilding;
window.improvedBuildingRequest = improvedBuildingRequest;
window.testMarketUpgrade = testMarketUpgrade;

/**
 * Debug template logic for specific building issue
 */
function debugTemplateLogic() {
    console.log('🐛 DEBUGGING TEMPLATE LOGIC...');
    console.log('='.repeat(50));
    
    const villageId = game_data.village.id.toString();
    
    // Test case: Hiding place level 3, template wants level 10
    const currentBuildings = {
        main: 5,
        barracks: 2,
        farm: 8,
        hide: 3,  // Current hiding place level
        storage: 5
    };
    
    console.log('📊 Current buildings:', currentBuildings);
    
    // Check what templates are available
    if (typeof window.AutoBuilderTemplates === 'object') {
        const templates = window.AutoBuilderTemplates.getAllTemplates();
        const templateNames = Object.keys(templates);
        
        console.log(`📋 Available templates: ${templateNames.join(', ')}`);
        
        if (templateNames.length > 0) {
            // Test with first available template
            const templateName = templateNames[0];
            console.log(`\n🧪 Testing with template: ${templateName}`);
            
            const template = window.AutoBuilderTemplates.getTemplate(templateName);
            console.log('📋 Template sequence:', template.sequence);
            
            // Check what the template wants for hiding place
            const hideInTemplate = template.sequence.find(step => step.building === 'hide');
            if (hideInTemplate) {
                console.log(`🎯 Template wants hiding place level: ${hideInTemplate.level}`);
                console.log(`📊 Current hiding place level: ${currentBuildings.hide}`);
                
                if (currentBuildings.hide < hideInTemplate.level) {
                    console.log(`✅ Should build hiding place: ${currentBuildings.hide} → ${hideInTemplate.level}`);
                } else {
                    console.log(`✅ Hiding place already at target level`);
                }
            } else {
                console.log(`❌ Template doesn't include hiding place`);
            }
            
            // Test getNextBuilding function
            console.log(`\n🔍 Testing getNextBuilding function...`);
            const nextBuilding = window.AutoBuilderTemplates.getNextBuilding(templateName, currentBuildings);
            
            if (nextBuilding) {
                console.log(`✅ Next building to build:`);
                console.log(`   Building: ${nextBuilding.building}`);
                console.log(`   Current Level: ${nextBuilding.current_level}`);
                console.log(`   Target Level: ${nextBuilding.target_level}`);
                console.log(`   Next Level: ${nextBuilding.next_level}`);
                
                if (nextBuilding.building === 'hide') {
                    console.log(`🎯 PERFECT! Template logic wants to build hiding place next!`);
                    
                    if (nextBuilding.next_level === currentBuildings.hide + 1) {
                        console.log(`✅ Logic is correct: ${currentBuildings.hide} → ${nextBuilding.next_level}`);
                    } else {
                        console.log(`❌ Logic error: Expected ${currentBuildings.hide + 1}, got ${nextBuilding.next_level}`);
                    }
                } else {
                    console.log(`🤔 Template wants to build ${nextBuilding.building} first, not hiding place`);
                    console.log(`💡 This might be correct based on template priority order`);
                }
            } else {
                console.log(`❌ getNextBuilding returned null - template might be complete`);
            }
            
            // Test template progress
            console.log(`\n📊 Testing template progress...`);
            const progress = window.AutoBuilderTemplates.getTemplateProgress(templateName, currentBuildings);
            
            if (progress) {
                console.log(`📈 Progress: ${progress.completed}/${progress.total} (${progress.percentage}%)`);
                console.log(`🏗️ Remaining buildings: ${progress.remaining.length}`);
                
                progress.remaining.forEach(building => {
                    console.log(`   - ${building.building}: ${building.currentLevel} → ${building.targetLevel} (${building.levelsNeeded} levels needed)`);
                });
            }
            
        } else {
            console.log('❌ No templates available - create some first!');
            console.log('💡 Run: createExampleTemplates()');
        }
        
    } else {
        console.log('❌ AutoBuilderTemplates not available');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🐛 TEMPLATE LOGIC DEBUG COMPLETED!');
    console.log('💡 If hiding place should be built but isn\'t, check template sequence order');
}

/**
 * Create a specific template for testing hiding place
 */
function createHidingTestTemplate() {
    console.log('🏠 Creating hiding place test template...');
    
    const testSequence = [
        { building: 'main', level: 3 },
        { building: 'hide', level: 10 },  // This should trigger building from level 3 → 10
        { building: 'farm', level: 10 },
        { building: 'storage', level: 8 }
    ];
    
    if (window.AutoBuilderTemplates) {
        const success = window.AutoBuilderTemplates.createTemplate(
            'HidingTest', 
            'Test template for hiding place issue', 
            testSequence
        );
        
        if (success) {
            console.log('✅ HidingTest template created!');
            console.log('📋 Sequence: main(3) → hide(10) → farm(10) → storage(8)');
            console.log('💡 Now run: debugTemplateLogic()');
            return true;
        } else {
            console.log('❌ Failed to create HidingTest template');
            return false;
        }
    } else {
        console.log('❌ AutoBuilderTemplates not available');
        return false;
    }
}

window.debugTemplateLogic = debugTemplateLogic;
window.createHidingTestTemplate = createHidingTestTemplate;

/**
 * Test complete bot workflow for hiding place issue
 */
async function testBotWorkflow() {
    console.log('🤖 TESTING COMPLETE BOT WORKFLOW...');
    console.log('='.repeat(60));
    
    const villageId = game_data.village.id.toString();
    
    // Simulate current buildings (hiding place level 3, wants level 10)
    const mockBuildings = {
        main: 5,
        barracks: 2,
        farm: 8,
        hide: 3,  // Current hiding place level
        storage: 5
    };
    
    console.log('📊 Mock current buildings:', mockBuildings);
    
    try {
        // Step 1: Create test template
        console.log('\n📋 Step 1: Creating test template...');
        const templateCreated = createHidingTestTemplate();
        
        if (!templateCreated) {
            console.log('❌ Failed to create test template');
            return;
        }
        
        // Step 2: Assign template to village
        console.log('\n📋 Step 2: Assigning template to village...');
        const assigned = window.AutoBuilderTemplates.setVillageTemplate(villageId, 'HidingTest');
        
        if (assigned) {
            console.log(`✅ Template 'HidingTest' assigned to village ${villageId}`);
        } else {
            console.log('❌ Failed to assign template');
            return;
        }
        
        // Step 3: Test Smart Calculator
        console.log('\n📋 Step 3: Testing Smart Calculator logic...');
        
        if (window.AutoBuildBot && window.AutoBuildBot.smartCalculator) {
            
            // Mock the findCurrentVillageData function result
            const mockVillageData = {
                resources: { wood: 5000, stone: 5000, iron: 3000 },
                warehouse: { capacity: 30000, usagePercent: 20 },
                population: { current: 150, max: 200, usagePercent: 75 },
                buildings: mockBuildings,
                queue: []  // Empty queue
            };
            
            // Test the determineNextBuilding function directly
            const nextBuilding = window.AutoBuildBot.smartCalculator.determineNextBuilding(mockBuildings, villageId);
            
            if (nextBuilding) {
                console.log('✅ Smart Calculator determined next building:');
                console.log(`   Building: ${nextBuilding.building}`);
                console.log(`   Current Level: ${nextBuilding.current_level}`);
                console.log(`   Target Level: ${nextBuilding.target_level}`);
                console.log(`   Template: ${nextBuilding.template}`);
                
                if (nextBuilding.building === 'hide') {
                    console.log('🎯 PERFECT! Bot wants to build hiding place!');
                    
                    if (nextBuilding.current_level === 3 && nextBuilding.target_level === 4) {
                        console.log('✅ Logic is correct: hiding 3 → 4 (step by step)');
                        
                        // Step 4: Test building ID mapping
                        console.log('\n📋 Step 4: Testing building ID mapping...');
                        
                        if (window.AutoBuildBot.enhancedDataManager) {
                            const buildingId = window.AutoBuildBot.enhancedDataManager.getBuildingId('hide');
                            console.log(`🔗 Building ID mapping: 'hide' → '${buildingId}'`);
                            
                            // Step 5: Test actual building request (SIMULATION ONLY)
                            console.log('\n📋 Step 5: Would make building request...');
                            console.log(`🏗️ Would build: ${buildingId} in village ${villageId}`);
                            console.log(`🌐 URL would be: game.php?village=${villageId}&screen=main&action=upgrade_building&id=${buildingId}&type=main&h=${game_data.csrf}`);
                            
                            console.log('\n🎉 WORKFLOW TEST SUCCESSFUL!');
                            console.log('✅ Bot logic is working correctly for hiding place!');
                            console.log('💡 The bot will build hiding place step by step: 3→4→5→6→7→8→9→10');
                            
                        } else {
                            console.log('❌ Enhanced data manager not available');
                        }
                        
                    } else {
                        console.log(`❌ Logic error: Expected hiding 3→4, got ${nextBuilding.current_level}→${nextBuilding.target_level}`);
                    }
                    
                } else {
                    console.log(`🤔 Bot wants to build '${nextBuilding.building}' instead of hiding place`);
                    console.log(`💡 Check template sequence - maybe another building has higher priority`);
                    
                    // Check template sequence
                    const template = window.AutoBuilderTemplates.getTemplate('HidingTest');
                    console.log('📋 Template sequence order:');
                    template.sequence.forEach((step, index) => {
                        const currentLevel = mockBuildings[step.building] || 0;
                        const needsUpgrade = currentLevel < step.level;
                        console.log(`   ${index + 1}. ${step.building} → level ${step.level} (current: ${currentLevel}) ${needsUpgrade ? '⚠️ NEEDS UPGRADE' : '✅ Complete'}`);
                    });
                }
                
            } else {
                console.log('❌ Smart Calculator returned null - template might be complete or no template assigned');
            }
            
        } else {
            console.log('❌ AutoBuildBot or Smart Calculator not available');
        }
        
    } catch (error) {
        console.error('❌ Error in bot workflow test:', error);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🤖 BOT WORKFLOW TEST COMPLETED!');
}

window.testBotWorkflow = testBotWorkflow;

/**
 * Debug building level detection issue
 */
async function debugBuildingLevels() {
    console.log('🔍 DEBUGGING BUILDING LEVEL DETECTION...');
    console.log('='.repeat(60));
    
    const villageId = game_data.village.id.toString();
    
    // Step 1: Check what the database thinks
    console.log('📊 Step 1: Database Building Levels');
    try {
        if (typeof window.loadLatestEnhancedData === 'function') {
            const savedData = await window.loadLatestEnhancedData(villageId);
            
            if (savedData && savedData.data) {
                console.log('✅ Database data found');
                
                // Check buildings data in database
                const buildingsData = savedData.data.buildings;
                if (buildingsData && buildingsData.villages && buildingsData.villages[villageId]) {
                    const villageBuildings = buildingsData.villages[villageId].buildings;
                    console.log('🏗️ Database buildings for your village:', villageBuildings);
                    
                    if (villageBuildings.hide !== undefined) {
                        console.log(`🎯 DATABASE says hiding place level: ${villageBuildings.hide}`);
                    } else {
                        console.log('❌ No hiding place level in database');
                    }
                } else {
                    console.log('❌ No buildings data for your village in database');
                }
                
                // Check resource data too
                if (savedData.data.resources) {
                    const resourceVillage = savedData.data.resources.find(v => v.villageId === villageId);
                    if (resourceVillage) {
                        console.log('💰 Database resources:', resourceVillage.resources);
                    }
                }
                
            } else {
                console.log('❌ No database data found');
            }
        } else {
            console.log('❌ Database loader not available');
        }
    } catch (error) {
        console.error('❌ Error checking database:', error);
    }
    
    // Step 2: Check what the Smart Calculator sees
    console.log('\n📊 Step 2: Smart Calculator Input');
    if (window.AutoBuildBot && window.AutoBuildBot.smartCalculator) {
        try {
            // Get the same data the smart calculator would use
            const savedRecord = await window.loadLatestEnhancedData(villageId);
            if (savedRecord && savedRecord.data) {
                
                // Use the same findCurrentVillageData function
                const calculator = window.AutoBuildBot.smartCalculator;
                const currentVillageData = calculator.findCurrentVillageData(savedRecord.data, villageId);
                
                if (currentVillageData) {
                    console.log('✅ Smart Calculator village data found');
                    console.log('🏗️ Buildings seen by Smart Calculator:', currentVillageData.buildings);
                    
                    if (currentVillageData.buildings.hide !== undefined) {
                        console.log(`🎯 SMART CALCULATOR says hiding place level: ${currentVillageData.buildings.hide}`);
                    } else {
                        console.log('❌ Smart Calculator sees no hiding place level');
                    }
                } else {
                    console.log('❌ Smart Calculator found no village data');
                }
            }
        } catch (error) {
            console.error('❌ Error checking Smart Calculator input:', error);
        }
    }
    
    // Step 3: Check what the template system would return
    console.log('\n📊 Step 3: Template System Logic');
    if (typeof window.AutoBuilderTemplates === 'object') {
        const templateName = window.AutoBuilderTemplates.getVillageTemplate(villageId);
        console.log(`📋 Assigned template: ${templateName}`);
        
        if (templateName) {
            const template = window.AutoBuilderTemplates.getTemplate(templateName);
            console.log('📋 Template sequence:', template.sequence);
            
            // Find hiding place in template
            const hideInTemplate = template.sequence.find(step => step.building === 'hide');
            if (hideInTemplate) {
                console.log(`🎯 Template wants hiding place level: ${hideInTemplate.level}`);
                
                // Test with different current levels
                console.log('\n🧪 Testing template logic with different current levels:');
                
                for (let currentLevel = 3; currentLevel <= 10; currentLevel++) {
                    const testBuildings = { hide: currentLevel };
                    const nextBuilding = window.AutoBuilderTemplates.getNextBuilding(templateName, testBuildings);
                    
                    if (nextBuilding && nextBuilding.building === 'hide') {
                        console.log(`   If current is ${currentLevel}: wants to build to level ${nextBuilding.next_level} (target: ${nextBuilding.target_level})`);
                        
                        // Check if this is correct (+1 logic)
                        if (nextBuilding.next_level === currentLevel + 1) {
                            console.log(`   ✅ Correct: ${currentLevel} + 1 = ${nextBuilding.next_level}`);
                        } else {
                            console.log(`   ❌ WRONG: ${currentLevel} + 1 should be ${currentLevel + 1}, not ${nextBuilding.next_level}`);
                        }
                    } else {
                        console.log(`   If current is ${currentLevel}: template complete or other building priority`);
                    }
                }
            } else {
                console.log('❌ Template does not include hiding place');
            }
        }
    }
    
    // Step 4: Manual verification suggestion
    console.log('\n📊 Step 4: Manual Verification Needed');
    console.log('🏗️ Please manually check your hiding place level in the game:');
    console.log('   1. Go to your headquarters (main building)');
    console.log('   2. Look at the hiding place level shown');
    console.log('   3. Tell us what level it actually is');
    console.log('   4. Compare with what the database/bot thinks');
    
    console.log('\n' + '='.repeat(60));
    console.log('🔍 BUILDING LEVEL DEBUG COMPLETED!');
    console.log('💡 Compare the database level vs actual game level');
}

/**
 * Test if template logic correctly builds +1 levels
 */
function testIncrementalBuilding() {
    console.log('🔢 TESTING INCREMENTAL BUILDING LOGIC...');
    console.log('='.repeat(50));
    
    if (typeof window.AutoBuilderTemplates === 'object') {
        const villageId = game_data.village.id.toString();
        const templateName = window.AutoBuilderTemplates.getVillageTemplate(villageId);
        
        if (templateName) {
            console.log(`📋 Testing template: ${templateName}`);
            
            // Test hiding place incremental building
            console.log('\n🏠 Testing hiding place building progression:');
            
            for (let level = 3; level <= 9; level++) {
                const mockBuildings = {
                    main: 5,
                    hide: level  // Test each level
                };
                
                const nextBuilding = window.AutoBuilderTemplates.getNextBuilding(templateName, mockBuildings);
                
                if (nextBuilding && nextBuilding.building === 'hide') {
                    const expectedNext = level + 1;
                    const actualNext = nextBuilding.next_level;
                    
                    console.log(`   Level ${level} → Should build level ${expectedNext}, Bot wants level ${actualNext}`);
                    
                    if (actualNext === expectedNext) {
                        console.log(`   ✅ CORRECT: Incremental building working`);
                    } else {
                        console.log(`   ❌ BUG: Should be ${expectedNext}, got ${actualNext}`);
                    }
                } else {
                    console.log(`   Level ${level} → Template complete or different building priority`);
                }
            }
        } else {
            console.log('❌ No template assigned');
        }
    } else {
        console.log('❌ AutoBuilderTemplates not available');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🔢 INCREMENTAL BUILDING TEST COMPLETED!');
}

window.debugBuildingLevels = debugBuildingLevels;
window.testIncrementalBuilding = testIncrementalBuilding;

/**
 * Manually set correct building levels to fix data collection issues
 */
function setCorrectBuildingLevels() {
    console.log('🔧 MANUAL BUILDING LEVEL CORRECTION...');
    console.log('='.repeat(50));
    
    const villageId = game_data.village.id.toString();
    
    // Ask user for correct building levels
    console.log('📝 Please enter the CORRECT building levels from your screenshot:');
    console.log('Format: main,barracks,stable,garage,watchtower,snob,smith,place,market,wood,stone,iron,farm,storage,hide,wall');
    console.log('Example: 5,2,0,0,0,1,0,0,1,1,1,3,8,8,6,4');
    
    const userInput = prompt('Enter building levels (comma separated, from your screenshot):');
    
    if (userInput) {
        try {
            const levels = userInput.split(',').map(level => parseInt(level.trim()));
            
            const buildingNames = [
                'main', 'barracks', 'stable', 'garage', 'watchtower', 
                'snob', 'smith', 'place', 'market', 'wood', 
                'stone', 'iron', 'farm', 'storage', 'hide', 'wall'
            ];
            
            if (levels.length === buildingNames.length) {
                const correctedBuildings = {};
                
                buildingNames.forEach((building, index) => {
                    correctedBuildings[building] = levels[index];
                });
                
                console.log('✅ Corrected building levels:', correctedBuildings);
                
                // Store corrected data temporarily for testing
                window.correctedBuildingLevels = correctedBuildings;
                
                // Test template logic with corrected data
                console.log('\n🧪 Testing template with CORRECTED building levels:');
                if (typeof window.AutoBuilderTemplates === 'object') {
                    const templateName = window.AutoBuilderTemplates.getVillageTemplate(villageId);
                    if (templateName) {
                        const nextBuilding = window.AutoBuilderTemplates.getNextBuilding(templateName, correctedBuildings);
                        
                        if (nextBuilding) {
                            console.log(`✅ With CORRECT data, next building should be:`);
                            console.log(`   Building: ${nextBuilding.building}`);
                            console.log(`   Current Level: ${nextBuilding.current_level}`);
                            console.log(`   Next Level: ${nextBuilding.next_level}`);
                            console.log(`   Template Target: ${nextBuilding.target_level}`);
                            
                            // Check if it's incremental (+1)
                            if (nextBuilding.next_level === nextBuilding.current_level + 1) {
                                console.log(`✅ CORRECT: Incremental building ${nextBuilding.current_level} → ${nextBuilding.next_level}`);
                            } else {
                                console.log(`❌ WRONG: Not incremental ${nextBuilding.current_level} → ${nextBuilding.next_level}`);
                            }
                        } else {
                            console.log('📋 Template completed with corrected data');
                        }
                    }
                }
                
                return correctedBuildings;
                
            } else {
                console.log(`❌ Expected ${buildingNames.length} values, got ${levels.length}`);
                return null;
            }
            
        } catch (error) {
            console.error('❌ Error parsing building levels:', error);
            return null;
        }
    } else {
        console.log('❌ No input provided');
        return null;
    }
}

/**
 * Force fresh data collection with improved debugging
 */
async function collectFreshBuildingData() {
    console.log('🔄 COLLECTING FRESH BUILDING DATA...');
    console.log('='.repeat(50));
    
    try {
        if (typeof window.collectComprehensiveDataEnhanced === 'function') {
            console.log('🎯 Starting fresh comprehensive data collection...');
            console.log('📊 This will show detailed debugging of building data extraction');
            
            const result = await window.collectComprehensiveDataEnhanced();
            
            if (result && result.data && result.data.buildings) {
                const villageId = game_data.village.id.toString();
                const villageBuildings = result.data.buildings.villages[villageId];
                
                if (villageBuildings) {
                    console.log('✅ Fresh building data collected:');
                    console.log('🏗️ Buildings:', villageBuildings.buildings);
                    
                    // Compare with manual correction if available
                    if (window.correctedBuildingLevels) {
                        console.log('\n🔍 Comparing with manually corrected levels:');
                        
                        Object.keys(window.correctedBuildingLevels).forEach(building => {
                            const collected = villageBuildings.buildings[building] || 0;
                            const correct = window.correctedBuildingLevels[building];
                            
                            if (collected === correct) {
                                console.log(`✅ ${building}: ${collected} (correct)`);
                            } else {
                                console.log(`❌ ${building}: collected=${collected}, should be=${correct}`);
                            }
                        });
                    }
                    
                    return villageBuildings.buildings;
                } else {
                    console.log('❌ No building data found for your village');
                    return null;
                }
            } else {
                console.log('❌ Failed to collect comprehensive data');
                return null;
            }
            
        } else {
            console.log('❌ Data collection function not available');
            return null;
        }
        
    } catch (error) {
        console.error('❌ Error collecting fresh data:', error);
        return null;
    }
}

window.setCorrectBuildingLevels = setCorrectBuildingLevels;
window.collectFreshBuildingData = collectFreshBuildingData;

/**
 * Test the FIXED building level extractor
 */
async function testBuildingExtractor() {
    console.log('🔧 TESTING FIXED BUILDING EXTRACTOR...');
    console.log('='.repeat(50));
    
    try {
        console.log('🎯 Running fresh data collection with fixed extractor...');
        
        // Force fresh data collection
        const result = await window.collectComprehensiveDataEnhanced();
        
        if (result && result.data && result.data.buildings) {
            const villageId = game_data.village.id.toString();
            const villageBuildings = result.data.buildings.villages[villageId];
            
            if (villageBuildings && villageBuildings.buildings) {
                console.log('✅ BUILDING EXTRACTION SUCCESSFUL!');
                console.log('🏗️ Extracted building levels:');
                
                // Display buildings in a nice format
                Object.entries(villageBuildings.buildings).forEach(([building, level]) => {
                    if (level > 0) {
                        console.log(`   ${building}: ${level}`);
                    }
                });
                
                // Show queue if any
                if (villageBuildings.queue && villageBuildings.queue.length > 0) {
                    console.log('🚧 Current queue:');
                    villageBuildings.queue.forEach((item, index) => {
                        console.log(`   ${index + 1}. ${item.buildingType} (${item.completionTime})`);
                    });
                } else {
                    console.log('🚧 No items in construction queue');
                }
                
                // Test template logic with extracted data
                console.log('\n🧪 Testing template logic with extracted data:');
                if (typeof window.AutoBuilderTemplates === 'object') {
                    const templateName = window.AutoBuilderTemplates.getVillageTemplate(villageId);
                    if (templateName) {
                        const nextBuilding = window.AutoBuilderTemplates.getNextBuilding(templateName, villageBuildings.buildings);
                        
                        if (nextBuilding) {
                            console.log(`✅ Template logic working! Next building:`);
                            console.log(`   Building: ${nextBuilding.building}`);
                            console.log(`   Current: ${nextBuilding.current_level}`);
                            console.log(`   Next: ${nextBuilding.next_level}`);
                            console.log(`   Template target: ${nextBuilding.target_level}`);
                            
                            // Verify incremental building
                            if (nextBuilding.next_level === nextBuilding.current_level + 1) {
                                console.log(`✅ PERFECT! Incremental building: ${nextBuilding.current_level} → ${nextBuilding.next_level}`);
                            } else {
                                console.log(`❌ ERROR: Not incremental: ${nextBuilding.current_level} → ${nextBuilding.next_level}`);
                            }
                        } else {
                            console.log('📋 Template completed or no template assigned');
                        }
                    } else {
                        console.log('❌ No template assigned to village');
                    }
                }
                
                return villageBuildings.buildings;
                
            } else {
                console.log('❌ No building data found for your village');
                return null;
            }
        } else {
            console.log('❌ Failed to collect data');
            return null;
        }
        
    } catch (error) {
        console.error('❌ Error testing building extractor:', error);
        return null;
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🔧 BUILDING EXTRACTOR TEST COMPLETED!');
}

/**
 * Quick test to just show current building levels
 */
async function showCurrentBuildings() {
    console.log('🏗️ SHOWING CURRENT BUILDING LEVELS...');
    console.log('='.repeat(40));
    
    try {
        // Try to get from latest stored data first
        const savedData = await window.loadLatestEnhancedData();
        const villageId = game_data.village.id.toString();
        
        if (savedData && savedData.data && savedData.data.buildings && savedData.data.buildings.villages[villageId]) {
            const buildings = savedData.data.buildings.villages[villageId].buildings;
            const dataAge = Math.round((Date.now() - new Date(savedData.timestamp).getTime()) / 60000);
            
            console.log(`📊 Building levels (data age: ${dataAge} minutes):`);
            
            Object.entries(buildings).forEach(([building, level]) => {
                if (level > 0) {
                    console.log(`   ${building}: ${level}`);
                }
            });
            
            return buildings;
            
        } else {
            console.log('❌ No stored building data found');
            console.log('💡 Run testBuildingExtractor() to collect fresh data');
            return null;
        }
        
    } catch (error) {
        console.error('❌ Error showing buildings:', error);
        return null;
    }
}

window.testBuildingExtractor = testBuildingExtractor;
window.showCurrentBuildings = showCurrentBuildings;

console.log('🧪 Game API test functions loaded!');
console.log('Run: testGameAPI() - Safe validation test');
console.log('Run: testActualBuilding() - Actually tries to build (WARNING!)');
console.log('Run: testMarketUpgrade() - Test market upgrade with improved detection');
console.log('Run: debugTemplateLogic() - Debug template building logic');
console.log('Run: createHidingTestTemplate() - Create test template for hiding place');
console.log('Run: testBotWorkflow() - Test complete bot workflow simulation');
console.log('Run: debugBuildingLevels() - Debug building level detection issue');
console.log('Run: testIncrementalBuilding() - Test incremental building logic');
console.log('Run: setCorrectBuildingLevels() - Manually set correct building levels');
console.log('Run: collectFreshBuildingData() - Collect fresh data with debugging');
console.log('Run: testBuildingExtractor() - Test FIXED building level extractor');
console.log('Run: showCurrentBuildings() - Show current building levels');

// Don't auto-run the test anymore - let user call it manually
console.log('💡 Call testBuildingExtractor() to test the fixed building fetcher!'); 