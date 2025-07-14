// Quick Start Script for Cursor DevTool
// Run this to test the Chrome DevTools integration

const CursorChromeDevTools = require('./Cursor_Chrome_DevTools_Integration.js');

async function quickStart() {
    console.log('🚀 Starting Cursor DevTool Quick Start...');
    
    const devTools = new CursorChromeDevTools();
    
    try {
        // Connect to Chrome
        console.log('🔗 Connecting to Chrome DevTools...');
        const connected = await devTools.connectToChrome();
        
        if (connected) {
            console.log('✅ Successfully connected to Chrome!');
            
            // Test basic functionality
            console.log('🧪 Testing basic functionality...');
            
            // Execute a test script
            await devTools.executeInChrome(`
                console.log('Hello from Cursor DevTool!');
                console.log('Current URL:', window.location.href);
                console.log('Page title:', document.title);
            `);
            
            // Get some basic info
            const networkLog = await devTools.getNetworkLog();
            const consoleLog = await devTools.getConsoleLog();
            
            console.log(`📊 Network requests: ${networkLog.length}`);
            console.log(`📝 Console messages: ${consoleLog.length}`);
            
            // Keep running for a while to show real-time data
            console.log('⏳ Monitoring for 30 seconds... (Press Ctrl+C to stop)');
            
            setTimeout(async () => {
                console.log('📈 Final stats:');
                console.log(`- Network requests: ${(await devTools.getNetworkLog()).length}`);
                console.log(`- Console messages: ${(await devTools.getConsoleLog()).length}`);
                console.log(`- Debug entries: ${(await devTools.getDebugLog()).length}`);
                
                await devTools.disconnect();
                console.log('🔌 Disconnected from Chrome');
                process.exit(0);
            }, 30000);
            
        } else {
            console.error('❌ Failed to connect to Chrome');
            console.log('💡 Make sure Chrome is running with remote debugging enabled:');
            console.log('   chrome.exe --remote-debugging-port=9222');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Error during quick start:', error.message);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    process.exit(0);
});

// Run the quick start
quickStart(); 