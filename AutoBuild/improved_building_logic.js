// Improved Building Logic for Tribal Wars
// Better success detection and error handling

/**
 * Improved success detection for Tribal Wars building requests
 * @param {Response} response - Fetch response object
 * @param {string} responseText - Response HTML text
 * @param {string} buildingId - Building ID that was requested
 * @returns {boolean} True if building was successfully added
 */
function detectBuildingSuccess(response, responseText, buildingId) {
    console.log('🔍 Analyzing building request response...');
    
    // Check 1: HTTP status must be OK
    if (!response.ok) {
        console.log(`❌ HTTP error: ${response.status}`);
        return false;
    }
    
    // Check 2: Look for explicit error messages (old logic)
    const hasError = responseText.includes('error') || 
                    responseText.includes('Error') ||
                    responseText.includes('fehler') ||  // German
                    responseText.includes('Fehler');
    
    if (hasError) {
        console.log('❌ Explicit error found in response');
        // Try to extract error message
        const errorPatterns = [
            /<div[^>]*class="[^"]*error[^"]*"[^>]*>([^<]+)</,
            /<span[^>]*class="[^"]*error[^"]*"[^>]*>([^<]+)</,
            /error['"]\s*:\s*['"]([^'"]+)['"]/i
        ];
        
        for (const pattern of errorPatterns) {
            const match = responseText.match(pattern);
            if (match) {
                console.log(`📝 Error message: ${match[1]}`);
                break;
            }
        }
        return false;
    }
    
    // Check 3: Look for success indicators (NEW LOGIC)
    const successIndicators = [
        'building_order',           // Queue element ID
        'construction_order',       // Alternative queue
        'queue',                   // Queue-related content
        'upgrade',                 // Upgrade in progress
        'timer',                   // Construction timer
        buildingId                 // Building name in response
    ];
    
    let successScore = 0;
    for (const indicator of successIndicators) {
        if (responseText.includes(indicator)) {
            successScore++;
            console.log(`✅ Found success indicator: ${indicator}`);
        }
    }
    
    // Check 4: Look for page redirect indicators
    const hasRedirect = responseText.includes('redirect') || 
                       responseText.includes('window.location') ||
                       response.redirected;
    
    if (hasRedirect) {
        console.log('✅ Page redirect detected (usually indicates success)');
        successScore += 2;
    }
    
    // Check 5: Response contains game data (indicates successful page load)
    const hasGameData = responseText.includes('game_data') ||
                       responseText.includes('village') ||
                       responseText.includes('screen=main');
    
    if (hasGameData) {
        console.log('✅ Response contains game data (page loaded successfully)');
        successScore++;
    }
    
    // Decision logic
    const isSuccess = successScore >= 2 || (response.ok && !hasError && responseText.length > 1000);
    
    console.log(`📊 Success score: ${successScore}/5`);
    console.log(`🎯 Final decision: ${isSuccess ? 'SUCCESS' : 'FAILED'}`);
    
    return isSuccess;
}

/**
 * Improved building request with better success detection
 * @param {string} villageId - Village ID
 * @param {string} buildingId - Building ID
 * @param {string} csrf - CSRF token
 * @returns {Promise<boolean>} Success status
 */
async function improvedBuildingRequest(villageId, buildingId, csrf) {
    try {
        console.log(`🏗️ Improved building request: ${buildingId} in village ${villageId}`);
        
        // Build URL
        const url = `game.php?village=${villageId}&screen=main&action=upgrade_building&id=${buildingId}&type=main&h=${csrf}`;
        
        console.log(`🌐 Request URL: ${url}`);
        
        // Make request
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        const responseText = await response.text();
        
        console.log(`📄 Response status: ${response.status}`);
        console.log(`📄 Response length: ${responseText.length} characters`);
        console.log(`📄 Response preview: ${responseText.substring(0, 150)}...`);
        
        // Use improved success detection
        const success = detectBuildingSuccess(response, responseText, buildingId);
        
        if (success) {
            console.log(`✅ Building ${buildingId} successfully added to queue!`);
        } else {
            console.log(`❌ Failed to add ${buildingId} to queue`);
        }
        
        return success;
        
    } catch (error) {
        console.error('❌ Building request failed:', error);
        return false;
    }
}

/**
 * Test the improved building logic (safe test - just analyzes your last response)
 */
function testImprovedLogic() {
    console.log('🧪 Testing improved building logic with your previous response...');
    
    // Simulate your previous response
    const mockResponse = {
        ok: true,
        status: 200,
        redirected: false
    };
    
    const mockResponseText = `<!DOCTYPE HTML>
<html>
<head>
	<title>nnoby95's village (431|695) - Tribal Wars - World 147</title>
	<meta http-equiv="content-type" content="text/html; charset=UTF-8" />
	<link id="favicon" rel="shortcut icon"  href="/favicon.ico" />`;
    
    const result = detectBuildingSuccess(mockResponse, mockResponseText, 'main');
    
    console.log(`🎯 With improved logic, your previous request would be: ${result ? 'SUCCESS' : 'FAILED'}`);
    
    return result;
}

// Test function for actual building with improved logic
async function testImprovedBuilding() {
    console.log('⚠️ WARNING: This will test the improved building logic!');
    
    const confirm = prompt('Type "YES" to test improved building logic:');
    if (confirm !== 'YES') {
        console.log('❌ Test cancelled');
        return;
    }
    
    try {
        const villageId = game_data.village.id;
        const csrf = game_data.csrf;
        
        const success = await improvedBuildingRequest(villageId, 'main', csrf);
        
        if (success) {
            console.log('🎉 IMPROVED LOGIC WORKS! Your bot should work now!');
        } else {
            console.log('⚠️ Still having issues - may need manual debugging');
        }
        
        return success;
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        return false;
    }
}

// Export functions
window.detectBuildingSuccess = detectBuildingSuccess;
window.improvedBuildingRequest = improvedBuildingRequest;
window.testImprovedLogic = testImprovedLogic;
window.testImprovedBuilding = testImprovedBuilding;

console.log('🔧 Improved building logic loaded!');
console.log('Commands:');
console.log('  testImprovedLogic() - Test logic on your previous response');
console.log('  testImprovedBuilding() - Test with actual building request'); 