/**
 * Test Dynamic Checking Behavior
 * Demonstrates how the smart calculator now uses dynamic check intervals
 */

// Mock data for testing
const mockVillageData = {
    resources: {
        wood: 1000,
        stone: 500,
        iron: 200
    },
    buildings: {
        main: 10,
        barracks: 5,
        stable: 3
    },
    queue: [
        {
            building: 'barracks',
            target_level: 6,
            completion_time: Date.now() + 3600000 // 1 hour from now
        }
    ],
    last_updated: Date.now()
};

// Test the dynamic check time calculation
function testDynamicCheckTime() {
    console.log('🧪 Testing Dynamic Check Time Calculation...\n');
    
    const now = Date.now();
    
    // Test cases with different wait times
    const testCases = [
        { name: 'Short wait (30 minutes)', waitTime: 30 * 60 * 1000 },
        { name: 'Medium wait (2 hours)', waitTime: 2 * 60 * 60 * 1000 },
        { name: 'Long wait (8 hours)', waitTime: 8 * 60 * 60 * 1000 },
        { name: 'Very long wait (18 hours)', waitTime: 18 * 60 * 60 * 1000 }
    ];
    
    testCases.forEach(testCase => {
        const estimatedTime = now + testCase.waitTime;
        const dynamicCheckTime = calculateDynamicCheckTime(estimatedTime);
        const checkInterval = Math.round((dynamicCheckTime - now) / 1000 / 60);
        const totalWait = Math.round(testCase.waitTime / 1000 / 60);
        
        console.log(`📊 ${testCase.name}:`);
        console.log(`   Total wait time: ${totalWait} minutes`);
        console.log(`   Check interval: ${checkInterval} minutes`);
        console.log(`   Check frequency: ${Math.round(totalWait / checkInterval)}x during wait`);
        console.log('');
    });
}

// Dynamic check time calculation (same as in SmartBuildCalculator)
function calculateDynamicCheckTime(estimatedTime) {
    const now = Date.now();
    const waitTime = estimatedTime - now;
    
    // If wait time is less than 1 hour, check every 30 minutes
    if (waitTime <= 3600000) { // 1 hour
        return now + Math.min(waitTime / 2, 1800000); // Half the wait time or 30 minutes max
    }
    
    // If wait time is 1-6 hours, check every hour
    if (waitTime <= 21600000) { // 6 hours
        return now + Math.min(waitTime / 3, 3600000); // Third of wait time or 1 hour max
    }
    
    // If wait time is 6-24 hours, check every 2 hours
    if (waitTime <= 86400000) { // 24 hours
        return now + Math.min(waitTime / 4, 7200000); // Quarter of wait time or 2 hours max
    }
    
    // For very long waits, check every 4 hours
    return now + Math.min(waitTime / 6, 14400000); // Sixth of wait time or 4 hours max
}

// Test different scenarios
function testScenarios() {
    console.log('🎯 Testing Different Scenarios...\n');
    
    const scenarios = [
        {
            name: 'Resource Shortage - Wood',
            reason: 'insufficient_resources_wood',
            estimatedTime: Date.now() + 4 * 60 * 60 * 1000, // 4 hours
            description: 'Need more wood for building'
        },
        {
            name: 'Queue Full',
            reason: 'queue_full',
            estimatedTime: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
            description: 'Building queue is full'
        },
        {
            name: 'Long Resource Wait',
            reason: 'insufficient_resources_iron',
            estimatedTime: Date.now() + 12 * 60 * 60 * 1000, // 12 hours
            description: 'Need a lot of iron'
        }
    ];
    
    scenarios.forEach(scenario => {
        const dynamicCheckTime = calculateDynamicCheckTime(scenario.estimatedTime);
        const checkInterval = Math.round((dynamicCheckTime - Date.now()) / 1000 / 60);
        const totalWait = Math.round((scenario.estimatedTime - Date.now()) / 1000 / 60);
        
        console.log(`📋 ${scenario.name}:`);
        console.log(`   Reason: ${scenario.reason}`);
        console.log(`   Description: ${scenario.description}`);
        console.log(`   Total wait: ${totalWait} minutes`);
        console.log(`   Check every: ${checkInterval} minutes`);
        console.log(`   Checks during wait: ${Math.round(totalWait / checkInterval)}x`);
        console.log('');
    });
}

// Show benefits of dynamic checking
function showBenefits() {
    console.log('💡 Benefits of Dynamic Checking:\n');
    
    const benefits = [
        '🔄 **Frequent Checks for Short Waits**: 30-minute waits get checked every 15 minutes',
        '⏰ **Hourly Checks for Medium Waits**: 2-6 hour waits get checked every hour',
        '📊 **Smart Scaling**: Longer waits get proportionally fewer checks to avoid spam',
        '🎯 **Early Opportunity Catching**: Can catch resources from other sources or manual actions',
        '🛡️ **Server-Safe**: Database reads are not tracked by server, so we can check freely',
        '⚡ **Responsive**: Much more responsive than waiting for full calculated time',
        '🧠 **Intelligent**: Adapts check frequency based on wait duration'
    ];
    
    benefits.forEach(benefit => {
        console.log(benefit);
    });
    
    console.log('\n📈 **Example**:');
    console.log('   Old way: Wait 14.3 hours, then check');
    console.log('   New way: Check every 2 hours (7 checks during wait)');
    console.log('   Result: Can catch opportunities 12+ hours earlier!');
}

// Run all tests
console.log('🚀 Testing Dynamic Checking Behavior\n');
console.log('=' .repeat(50));

testDynamicCheckTime();
console.log('=' .repeat(50));

testScenarios();
console.log('=' .repeat(50));

showBenefits();

console.log('\n✅ Dynamic checking test completed!');
console.log('💡 The smart calculator now uses intelligent intervals instead of blind waiting.'); 