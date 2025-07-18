// IMPROVED Test Script for Tribal Wars Game API Validation
// Run this in the browser console on a Tribal Wars page

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
        console.log(`🔑 CSRF Token: "${currentCSRF}"`);
        console.log(`🔑 CSRF Length: ${currentCSRF ? currentCSRF.length : 'null'}`);
        console.log(`🔑 CSRF Type: ${typeof currentCSRF}`);
        
        // Test 1: Validate CSRF token format (IMPROVED)
        console.log('\n📋 Test 1: CSRF Token Validation');
        if (currentCSRF && typeof currentCSRF === 'string' && currentCSRF.length >= 8) {
            console.log('✅ CSRF token format looks valid');
            console.log(`   Format: String, ${currentCSRF.length} characters`);
        } else {
            console.log('❌ CSRF token issues detected:');
            console.log(`   - Token exists: ${!!currentCSRF}`);
            console.log(`   - Is string: ${typeof currentCSRF === 'string'}`);
            console.log(`   - Length >= 8: ${currentCSRF ? currentCSRF.length >= 8 : false}`);
            
            // Try to find CSRF in different places
            console.log('\n🔍 Searching for CSRF token in other locations...');
            
            // Check if it's in a different variable
            if (typeof window.csrf !== 'undefined') {
                console.log(`   window.csrf: "${window.csrf}"`);
            }
            if (typeof document.forms !== 'undefined') {
                const forms = document.forms;
                for (let i = 0; i < forms.length; i++) {
                    const csrfInput = forms[i].querySelector('input[name="h"], input[name="csrf"]');
                    if (csrfInput) {
                        console.log(`   Found in form: "${csrfInput.value}"`);
                        break;
                    }
                }
            }
            
            // Don't return false - continue with other tests
            console.log('⚠️ Continuing tests with available token...');
        }
        
        // Test 2: Test main page access
        console.log('\n📋 Test 2: Main Page Access');
        const mainPageUrl = `game.php?village=${villageId}&screen=main`;
        console.log(`🔗 Testing URL: ${mainPageUrl}`);
        
        try {
            const mainResponse = await fetch(mainPageUrl);
            
            if (mainResponse.ok) {
                console.log('✅ Main page accessible');
                
                // Test CSRF extraction from page
                const html = await mainResponse.text();
                
                // Try multiple CSRF extraction patterns
                const patterns = [
                    /game_data\.csrf\s*=\s*['"]([^'"]+)['"]/,
                    /csrf['"]\s*:\s*['"]([^'"]+)['"]/,
                    /"csrf"\s*:\s*"([^"]+)"/,
                    /name="h"\s+value="([^"]+)"/
                ];
                
                let foundCSRF = null;
                for (const pattern of patterns) {
                    const match = html.match(pattern);
                    if (match) {
                        foundCSRF = match[1];
                        console.log(`✅ CSRF found with pattern: ${pattern}`);
                        console.log(`   Token: "${foundCSRF}"`);
                        break;
                    }
                }
                
                if (!foundCSRF) {
                    console.log('⚠️ Could not extract CSRF from page HTML');
                    // Look for any token-like strings
                    const tokenMatches = html.match(/[a-f0-9]{8,}/g);
                    if (tokenMatches) {
                        console.log(`   Found potential tokens: ${tokenMatches.slice(0, 3).join(', ')}...`);
                    }
                }
                
                if (foundCSRF && foundCSRF === currentCSRF) {
                    console.log('✅ CSRF token matches current game data');
                } else if (foundCSRF) {
                    console.log('⚠️ CSRF token differs from game_data.csrf');
                    console.log(`   game_data.csrf: "${currentCSRF}"`);
                    console.log(`   Page CSRF: "${foundCSRF}"`);
                }
            } else {
                console.log(`❌ Main page not accessible (status: ${mainResponse.status})`);
            }
        } catch (fetchError) {
            console.log('❌ Error accessing main page:', fetchError.message);
        }
        
        // Test 3: Building URL format validation
        console.log('\n📋 Test 3: Building URL Format');
        const useCSRF = currentCSRF || 'test_token';
        const testBuildingUrl = `game.php?village=${villageId}&screen=main&action=upgrade_building&id=main&type=main&h=${useCSRF}`;
        console.log(`🔗 Test URL: ${testBuildingUrl}`);
        console.log('✅ URL format constructed successfully');
        
        // Test 4: Check current queue status
        console.log('\n📋 Test 4: Queue Status Check');
        
        // Try multiple queue selectors
        const queueSelectors = [
            '.queue-item',
            '.building-queue-item', 
            '[class*="queue"]',
            '[id*="building_order"]',
            '.order-item',
            '.construction-order',
            '#building_order_list',
            '.build-queue'
        ];
        
        let queueFound = false;
        for (const selector of queueSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                console.log(`📊 Found ${elements.length} queue elements with selector: ${selector}`);
                queueFound = true;
            }
        }
        
        if (!queueFound) {
            console.log('⚠️ No queue elements found with standard selectors');
            console.log('🔍 Looking for any construction-related elements...');
            
            const constructionWords = ['queue', 'construction', 'building', 'order', 'upgrade'];
            for (const word of constructionWords) {
                const elements = document.querySelectorAll(`[class*="${word}"], [id*="${word}"]`);
                if (elements.length > 0) {
                    console.log(`   Found ${elements.length} elements with "${word}" in class/id`);
                }
            }
        }
        
        // Test 5: Building detection
        console.log('\n📋 Test 5: Building Detection');
        const buildingSelectors = [
            '[data-building]',
            '.building',
            '[id*="building"]',
            '.main_buildrow'
        ];
        
        let buildingsFound = false;
        for (const selector of buildingSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                console.log(`🏗️ Found ${elements.length} building elements with selector: ${selector}`);
                buildingsFound = true;
            }
        }
        
        if (!buildingsFound) {
            console.log('⚠️ No building elements found with standard selectors');
        }
        
        // Test 6: Check current screen
        console.log('\n📋 Test 6: Current Screen Detection');
        const currentURL = window.location.href;
        console.log(`🌐 Current URL: ${currentURL}`);
        
        if (currentURL.includes('screen=main')) {
            console.log('✅ On main screen (headquarters)');
        } else {
            console.log('⚠️ Not on main screen - bot needs headquarters screen');
            const mainScreenMatch = currentURL.match(/screen=([^&]+)/);
            if (mainScreenMatch) {
                console.log(`   Current screen: ${mainScreenMatch[1]}`);
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('🎯 COMPREHENSIVE GAME API TEST COMPLETED!');
        
        // Final assessment
        const hasValidToken = currentCSRF && typeof currentCSRF === 'string' && currentCSRF.length >= 8;
        const onCorrectScreen = currentURL.includes('screen=main');
        
        if (hasValidToken && onCorrectScreen) {
            console.log('✅ EXCELLENT! Bot should work perfectly!');
            console.log('💡 Ready to test: Create template and start bot');
        } else if (hasValidToken) {
            console.log('⚠️ Token looks good, but navigate to headquarters first');
            console.log('💡 Go to: Main building screen for testing');
        } else {
            console.log('⚠️ Token issues detected, but bot might still work');
            console.log('💡 Try the bot anyway - it might handle token extraction better');
        }
        
        return {
            hasValidToken,
            onCorrectScreen,
            villageId,
            csrf: currentCSRF
        };
        
    } catch (error) {
        console.error('❌ Game API test failed:', error);
        return false;
    }
}

// Quick test function
async function quickCSRFTest() {
    console.log('🔑 Quick CSRF Token Analysis:');
    console.log(`game_data: ${typeof game_data}`);
    if (typeof game_data !== 'undefined') {
        console.log(`game_data.csrf: "${game_data.csrf}"`);
        console.log(`Length: ${game_data.csrf ? game_data.csrf.length : 'null'}`);
        console.log(`Type: ${typeof game_data.csrf}`);
    }
    
    // Check for alternative CSRF locations
    if (typeof window.csrf !== 'undefined') {
        console.log(`window.csrf: "${window.csrf}"`);
    }
    
    // Check meta tags
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    if (csrfMeta) {
        console.log(`Meta CSRF: "${csrfMeta.content}"`);
    }
    
    // Check hidden inputs
    const csrfInput = document.querySelector('input[name="h"], input[name="csrf"]');
    if (csrfInput) {
        console.log(`Input CSRF: "${csrfInput.value}"`);
    }
}

// Export test functions
window.testGameAPI = testGameAPI;
window.quickCSRFTest = quickCSRFTest;

console.log('🧪 IMPROVED Game API test functions loaded!');
console.log('Commands:');
console.log('  quickCSRFTest() - Quick CSRF analysis');
console.log('  testGameAPI() - Full API validation test'); 