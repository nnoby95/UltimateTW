/**
 * Test Smart Build Calculator
 * Tests the smart build calculation functionality
 */

// Test function for smart calculator
async function testSmartCalculator() {
    console.log('🧪 Testing Smart Build Calculator...');
    
    try {
        // Check if AutoBuilder is available
        if (!window.AutoBuilder) {
            console.error('❌ AutoBuilder not available');
            return false;
        }
        
        // Get smart calculator
        const bot = window.AutoBuilder.getBot();
        if (!bot || !bot.smartCalculator) {
            console.error('❌ Smart Calculator not available');
            return false;
        }
        
        const calculator = bot.smartCalculator;
        const villageId = game_data.village.id;
        
        // Test calculation
        console.log(`🧠 Testing calculation for village ${villageId}...`);
        const decision = await calculator.calculateNextBuild(villageId);
        
        console.log('📊 Build Decision:', {
            shouldBuild: decision.shouldBuild,
            reason: decision.reason,
            nextCheck: new Date(decision.nextCheck).toLocaleString(),
            building: decision.building ? `${decision.building.building} → Level ${decision.building.target_level}` : 'None',
            estimatedTime: decision.estimatedTime ? new Date(decision.estimatedTime).toLocaleString() : 'None'
        });
        
        // Test status
        const status = calculator.getStatus();
        console.log('📊 Calculator Status:', status);
        
        console.log('✅ Smart Calculator test completed!');
        return true;
        
    } catch (error) {
        console.error('❌ Smart Calculator test failed:', error);
        return false;
    }
}

// Test function for bot status
function testBotStatus() {
    console.log('🧪 Testing Bot Status...');
    
    try {
        const bot = window.AutoBuilder.getBot();
        if (!bot) {
            console.error('❌ Bot not available');
            return false;
        }
        
        const status = bot.getStatus();
        console.log('📊 Bot Status:', {
            isRunning: status.isRunning,
            lastCheck: status.lastCheck ? new Date(status.lastCheck).toLocaleString() : 'Never',
            nextCheckTime: new Date(status.nextCheckTime).toLocaleString(),
            timeUntilNextCheck: Math.round(status.timeUntilNextCheck / 1000 / 60) + ' minutes',
            smartCalculator: status.smartCalculator ? 'Available' : 'Not Available',
            enhancedDataManager: status.enhancedDataManager ? 'Available' : 'Not Available'
        });
        
        console.log('✅ Bot Status test completed!');
        return true;
        
    } catch (error) {
        console.error('❌ Bot Status test failed:', error);
        return false;
    }
}

// Test function for resource calculation
async function testResourceCalculation() {
    console.log('🧪 Testing Resource Calculation...');
    
    try {
        const bot = window.AutoBuilder.getBot();
        if (!bot || !bot.smartCalculator) {
            console.error('❌ Smart Calculator not available');
            return false;
        }
        
        const calculator = bot.smartCalculator;
        const villageId = game_data.village.id;
        
        // Get village data
        const villageData = await calculator.getVillageDataFromDB(villageId);
        if (!villageData) {
            console.log('⚠️ No village data available for resource calculation test');
            return false;
        }
        
        // Test resource rates calculation
        const resourceRates = calculator.calculateResourceRates(villageData);
        console.log('📊 Resource Rates (per hour):', resourceRates);
        
        // Test resource availability for a sample building
        const sampleBuilding = { building: 'main', target_level: 5 };
        const resourceDecision = calculator.calculateResourceAvailability(villageData, sampleBuilding);
        console.log('📊 Resource Decision:', {
            canAfford: resourceDecision.canAfford,
            missingResource: resourceDecision.missingResource,
            estimatedTime: resourceDecision.estimatedTime ? new Date(resourceDecision.estimatedTime).toLocaleString() : 'None',
            missing: resourceDecision.missing,
            rates: resourceDecision.rates
        });
        
        console.log('✅ Resource Calculation test completed!');
        return true;
        
    } catch (error) {
        console.error('❌ Resource Calculation test failed:', error);
        return false;
    }
}

// Test function for queue calculation
async function testQueueCalculation() {
    console.log('🧪 Testing Queue Calculation...');
    
    try {
        const bot = window.AutoBuilder.getBot();
        if (!bot || !bot.smartCalculator) {
            console.error('❌ Smart Calculator not available');
            return false;
        }
        
        const calculator = bot.smartCalculator;
        const villageId = game_data.village.id;
        
        // Get village data
        const villageData = await calculator.getVillageDataFromDB(villageId);
        if (!villageData) {
            console.log('⚠️ No village data available for queue calculation test');
            return false;
        }
        
        // Test queue availability calculation
        const queueDecision = calculator.calculateQueueAvailability(villageData);
        console.log('📊 Queue Decision:', {
            hasSpace: queueDecision.hasSpace,
            nextAvailableTime: queueDecision.nextAvailableTime ? new Date(queueDecision.nextAvailableTime).toLocaleString() : 'None',
            queueLength: queueDecision.queueLength
        });
        
        // Test completion time parsing
        const testTimes = [
            'today 14:30',
            'tomorrow 09:15',
            '2:30:15',
            'Unknown'
        ];
        
        console.log('📊 Completion Time Parsing:');
        testTimes.forEach(time => {
            const parsed = calculator.parseCompletionTime(time);
            console.log(`   "${time}" → ${parsed ? parsed.toLocaleString() : 'null'}`);
        });
        
        console.log('✅ Queue Calculation test completed!');
        return true;
        
    } catch (error) {
        console.error('❌ Queue Calculation test failed:', error);
        return false;
    }
}

// Main test function
async function runSmartCalculatorTests() {
    console.log('🚀 Starting Smart Calculator Tests...');
    console.log('═'.repeat(50));
    
    const results = {
        smartCalculator: false,
        botStatus: false,
        resourceCalculation: false,
        queueCalculation: false
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
        results.smartCalculator = await testSmartCalculator();
        results.botStatus = testBotStatus();
        results.resourceCalculation = await testResourceCalculation();
        results.queueCalculation = await testQueueCalculation();
        
        // Summary
        console.log('═'.repeat(50));
        console.log('📊 SMART CALCULATOR TEST RESULTS:');
        console.log(`   Smart Calculator: ${results.smartCalculator ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   Bot Status: ${results.botStatus ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   Resource Calculation: ${results.resourceCalculation ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   Queue Calculation: ${results.queueCalculation ? '✅ PASS' : '❌ FAIL'}`);
        
        const allPassed = Object.values(results).every(result => result);
        console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
        
    } catch (error) {
        console.error('❌ Smart Calculator test suite failed:', error);
    }
}

// Make functions globally available
window.testSmartCalculator = testSmartCalculator;
window.testBotStatus = testBotStatus;
window.testResourceCalculation = testResourceCalculation;
window.testQueueCalculation = testQueueCalculation;
window.runSmartCalculatorTests = runSmartCalculatorTests;

console.log('🧪 Smart Calculator Tests loaded!');
console.log('📋 Available test functions:');
console.log('   - runSmartCalculatorTests() - Run all smart calculator tests');
console.log('   - testSmartCalculator() - Test smart build calculation');
console.log('   - testBotStatus() - Test bot status');
console.log('   - testResourceCalculation() - Test resource calculations');
console.log('   - testQueueCalculation() - Test queue calculations'); 