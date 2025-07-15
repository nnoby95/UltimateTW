/**
 * Test Integration Script
 * Tests the comprehensive integration functionality
 */

// Test function to verify integration
async function testComprehensiveIntegration() {
    console.log('🧪 Testing Comprehensive Integration...');
    
    try {
        // Check if AutoBuilder is available
        if (!window.AutoBuilder) {
            console.error('❌ AutoBuilder not available');
            return false;
        }
        
        // Get comprehensive integration
        const integration = window.AutoBuilder.getComprehensiveIntegration();
        if (!integration) {
            console.error('❌ Comprehensive Integration not available');
            return false;
        }
        
        // Test status
        const status = integration.getStatus();
        console.log('📊 Integration Status:', status);
        
        // Test data collection
        const villageId = game_data.village.id;
        console.log(`🔍 Testing data collection for village ${villageId}...`);
        
        const villageData = await integration.collectVillageData(villageId);
        if (villageData) {
            console.log('✅ Data collection successful!');
            console.log('📊 Village Data:', {
                villageId: villageData.villageId,
                villageName: villageData.villageName,
                coordinates: villageData.coordinates,
                hasTroops: !!villageData.troops,
                hasResources: !!villageData.resources,
                hasBuildings: !!villageData.buildings,
                dataVersion: villageData.dataVersion
            });
        } else {
            console.log('❌ Data collection failed');
        }
        
        // Test queue status
        console.log('📋 Testing queue status...');
        const queueStatus = await integration.getQueueStatus(villageId);
        console.log('📊 Queue Status:', queueStatus);
        
        // Test building ID mapping
        console.log('🏗️ Testing building ID mapping...');
        const testBuildings = ['main', 'barracks', 'stable', 'farm'];
        testBuildings.forEach(building => {
            const buildingId = integration.getBuildingId(building);
            console.log(`   ${building} → ${buildingId}`);
        });
        
        console.log('✅ Comprehensive Integration test completed!');
        return true;
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        return false;
    }
}

// Test function for building queue logic
async function testBuildingQueueLogic() {
    console.log('🧪 Testing Building Queue Logic...');
    
    try {
        const villageId = game_data.village.id;
        
        // Test queue status
        const queueStatus = await window.AutoBuilder.getComprehensiveIntegration().getQueueStatus(villageId);
        console.log('📊 Queue Status:', queueStatus);
        
        // Test queue space
        const hasSpace = await window.AutoBuilder.getComprehensiveIntegration().hasQueueSpace(villageId);
        console.log(`📋 Has queue space: ${hasSpace}`);
        
        console.log('✅ Building Queue Logic test completed!');
        return true;
        
    } catch (error) {
        console.error('❌ Building Queue Logic test failed:', error);
        return false;
    }
}

// Test function for enhanced data manager
async function testEnhancedDataManager() {
    console.log('🧪 Testing Enhanced Data Manager...');
    
    try {
        const villageId = game_data.village.id;
        
        // Test comprehensive data collection
        const data = await window.AutoBuilder.getEnhancedDataManager().collectComprehensiveData(villageId);
        if (data) {
            console.log('✅ Enhanced data collection successful!');
            console.log('📊 Data structure:', {
                hasTroops: !!data.troops,
                hasResources: !!data.resources,
                hasBuildings: !!data.buildings,
                dataVersion: data.dataVersion
            });
        } else {
            console.log('❌ Enhanced data collection failed');
        }
        
        // Test status
        const status = window.AutoBuilder.getEnhancedDataManager().getStatus();
        console.log('📊 Enhanced Data Manager Status:', status);
        
        console.log('✅ Enhanced Data Manager test completed!');
        return true;
        
    } catch (error) {
        console.error('❌ Enhanced Data Manager test failed:', error);
        return false;
    }
}

// Main test function
async function runAllTests() {
    console.log('🚀 Starting AutoBuilder Integration Tests...');
    console.log('═'.repeat(50));
    
    const results = {
        comprehensiveIntegration: false,
        buildingQueueLogic: false,
        enhancedDataManager: false
    };
    
    try {
        // Wait for AutoBuilder to be ready
        let attempts = 0;
        while (!window.AutoBuilder && attempts < 10) {
            console.log('⏳ Waiting for AutoBuilder to initialize...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }
        
        if (!window.AutoBuilder) {
            console.error('❌ AutoBuilder not available after 10 seconds');
            return results;
        }
        
        // Run tests
        results.comprehensiveIntegration = await testComprehensiveIntegration();
        results.buildingQueueLogic = await testBuildingQueueLogic();
        results.enhancedDataManager = await testEnhancedDataManager();
        
        // Summary
        console.log('═'.repeat(50));
        console.log('📊 TEST RESULTS:');
        console.log(`   Comprehensive Integration: ${results.comprehensiveIntegration ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   Building Queue Logic: ${results.buildingQueueLogic ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   Enhanced Data Manager: ${results.enhancedDataManager ? '✅ PASS' : '❌ FAIL'}`);
        
        const allPassed = Object.values(results).every(result => result);
        console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
        
    } catch (error) {
        console.error('❌ Test suite failed:', error);
    }
}

// Make functions globally available
window.testComprehensiveIntegration = testComprehensiveIntegration;
window.testBuildingQueueLogic = testBuildingQueueLogic;
window.testEnhancedDataManager = testEnhancedDataManager;
window.runAllTests = runAllTests;

console.log('🧪 AutoBuilder Integration Tests loaded!');
console.log('📋 Available test functions:');
console.log('   - runAllTests() - Run all integration tests');
console.log('   - testComprehensiveIntegration() - Test comprehensive data collection');
console.log('   - testBuildingQueueLogic() - Test building queue logic');
console.log('   - testEnhancedDataManager() - Test enhanced data manager'); 