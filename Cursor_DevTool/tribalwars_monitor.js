// TribalWars Real-time Monitor
// This script shows you exactly what data is captured from TribalWars

const CursorChromeDevTools = require('./Cursor_Chrome_DevTools_Integration.js');

async function monitorTribalWars() {
    console.log('🎯 Starting TribalWars Monitor...');
    
    const devTools = new CursorChromeDevTools();
    
    try {
        // Connect to Chrome
        const connected = await devTools.connectToChrome();
        
        if (connected) {
            console.log('✅ Connected to Chrome!');
            console.log('🌐 Now open TribalWars in the debug Chrome window...');
            console.log('📊 You will see real-time data below:\n');
            
            // Monitor for 60 seconds
            let counter = 0;
            const interval = setInterval(async () => {
                counter++;
                
                // Get current stats
                const networkLog = await devTools.getNetworkLog();
                const consoleLog = await devTools.getConsoleLog();
                
                console.log(`\n📈 Stats at ${counter * 5}s:`);
                console.log(`   Network requests: ${networkLog.length}`);
                console.log(`   Console messages: ${consoleLog.length}`);
                
                // Show recent TribalWars activity
                const tribalWarsRequests = networkLog.filter(req => 
                    req.url.includes('tribalwars') || 
                    req.url.includes('ajax.php') || 
                    req.url.includes('game.php')
                );
                
                if (tribalWarsRequests.length > 0) {
                    console.log(`   🎮 TribalWars requests: ${tribalWarsRequests.length}`);
                    tribalWarsRequests.slice(-3).forEach(req => {
                        console.log(`      → ${req.method} ${req.url} (${req.status})`);
                    });
                }
                
                // Show recent console activity
                const recentConsole = consoleLog.slice(-3);
                if (recentConsole.length > 0) {
                    console.log(`   📝 Recent console messages:`);
                    recentConsole.forEach(log => {
                        if (log.text) {
                            console.log(`      → ${log.text}`);
                        }
                    });
                }
                
                // Stop after 60 seconds
                if (counter >= 12) {
                    clearInterval(interval);
                    console.log('\n🎉 Monitoring complete!');
                    console.log('\n📊 Final Summary:');
                    console.log(`   Total network requests: ${networkLog.length}`);
                    console.log(`   Total console messages: ${consoleLog.length}`);
                    console.log(`   TribalWars requests: ${tribalWarsRequests.length}`);
                    
                    await devTools.disconnect();
                    process.exit(0);
                }
            }, 5000); // Check every 5 seconds
            
        } else {
            console.error('❌ Failed to connect to Chrome');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Stopping monitor...');
    process.exit(0);
});

// Start monitoring
monitorTribalWars(); 