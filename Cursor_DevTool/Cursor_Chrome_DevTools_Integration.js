// Cursor + Chrome DevTools Integration
// This script connects Cursor IDE directly to Chrome DevTools Protocol

const CDP = require('chrome-remote-interface');
const fs = require('fs');
const path = require('path');

class CursorChromeDevTools {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.debugLog = [];
        this.networkLog = [];
        this.consoleLog = [];
    }

    async connectToChrome() {
        try {
            // Connect to Chrome DevTools Protocol
            this.client = await CDP();
            this.isConnected = true;
            
            console.log('🔗 Connected to Chrome DevTools Protocol');
            
            // Enable necessary domains
            await this.client.Runtime.enable();
            await this.client.Network.enable();
            await this.client.Console.enable();
            await this.client.Page.enable();
            
            this.setupEventListeners();
            this.setupCursorIntegration();
            
            return true;
        } catch (error) {
            console.error('❌ Failed to connect to Chrome:', error.message);
            return false;
        }
    }

    setupEventListeners() {
        // Monitor console messages
        this.client.Console.messageAdded(({message}) => {
            const logEntry = {
                type: message.type,
                text: message.text,
                timestamp: new Date().toISOString(),
                source: 'console'
            };
            
            this.consoleLog.push(logEntry);
            this.logToCursor('Console', logEntry);
        });

        // Monitor network requests
        this.client.Network.requestWillBeSent(({requestId, request, timestamp}) => {
            const networkEntry = {
                id: requestId,
                url: request.url,
                method: request.method,
                timestamp: timestamp,
                type: 'request'
            };
            
            this.networkLog.push(networkEntry);
            this.logToCursor('Network', networkEntry);
        });

        // Monitor network responses
        this.client.Network.responseReceived(({requestId, response, timestamp}) => {
            const responseEntry = {
                id: requestId,
                status: response.status,
                url: response.url,
                timestamp: timestamp,
                type: 'response'
            };
            
            this.logToCursor('Network', responseEntry);
        });

        // Monitor JavaScript exceptions
        this.client.Runtime.exceptionThrown(({exceptionDetails}) => {
            const errorEntry = {
                text: exceptionDetails.text,
                url: exceptionDetails.url,
                lineNumber: exceptionDetails.lineNumber,
                columnNumber: exceptionDetails.columnNumber,
                timestamp: new Date().toISOString(),
                type: 'error'
            };
            
            this.logToCursor('Error', errorEntry);
        });
    }

    setupCursorIntegration() {
        // Create a file watcher for Cursor integration
        this.watchCursorFiles();
        
        // Setup real-time debugging
        this.setupRealtimeDebugging();
    }

    watchCursorFiles() {
        // Watch for changes in your script files
        const scriptDir = path.join(__dirname, '..', 'AutoBuild', 'src');
        
        if (fs.existsSync(scriptDir)) {
            fs.watch(scriptDir, {recursive: true}, (eventType, filename) => {
                if (filename && filename.endsWith('.js')) {
                    this.logToCursor('FileChange', {
                        event: eventType,
                        file: filename,
                        timestamp: new Date().toISOString()
                    });
                    
                    // Auto-reload script if needed
                    this.autoReloadScript(filename);
                }
            });
        }
    }

    async autoReloadScript(filename) {
        try {
            // Execute script in Chrome context
            const scriptPath = path.join(__dirname, '..', 'AutoBuild', 'src', filename);
            const scriptContent = fs.readFileSync(scriptPath, 'utf8');
            
            await this.client.Runtime.evaluate({
                expression: scriptContent
            });
            
            this.logToCursor('ScriptReload', {
                file: filename,
                status: 'success',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            this.logToCursor('ScriptReload', {
                file: filename,
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    setupRealtimeDebugging() {
        // Setup breakpoints and debugging
        this.setupBreakpoints();
        this.setupPerformanceMonitoring();
    }

    async setupBreakpoints() {
        // Add breakpoints for TribalWars specific functions
        const tribalWarsBreakpoints = [
            'ajax.php',
            'game.php',
            'build.php',
            'dorf.php'
        ];
        
        for (const bp of tribalWarsBreakpoints) {
            try {
                await this.client.Debugger.setBreakpointByUrl({
                    url: bp,
                    lineNumber: 0
                });
            } catch (error) {
                // Breakpoint might not be available yet
            }
        }
    }

    setupPerformanceMonitoring() {
        // Monitor performance metrics
        setInterval(async () => {
            try {
                const metrics = await this.client.Performance.getMetrics();
                this.logToCursor('Performance', {
                    metrics: metrics.metrics,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                // Performance API might not be available
            }
        }, 5000); // Every 5 seconds
    }

    logToCursor(category, data) {
        const logEntry = {
            category,
            data,
            timestamp: new Date().toISOString()
        };
        
        this.debugLog.push(logEntry);
        
        // Write to Cursor-readable log file
        const logFile = path.join(__dirname, 'cursor_debug.log');
        fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
        
        // Console output for Cursor terminal
        console.log(`[${category}]`, data);
    }

    async executeInChrome(expression) {
        try {
            const result = await this.client.Runtime.evaluate({
                expression: expression
            });
            
            this.logToCursor('Execute', {
                expression,
                result: result.result.value,
                timestamp: new Date().toISOString()
            });
            
            return result;
        } catch (error) {
            this.logToCursor('ExecuteError', {
                expression,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    async getNetworkLog() {
        return this.networkLog;
    }

    async getConsoleLog() {
        return this.consoleLog;
    }

    async getDebugLog() {
        return this.debugLog;
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.isConnected = false;
            console.log('🔌 Disconnected from Chrome DevTools');
        }
    }
}

// Export for use in Cursor
module.exports = CursorChromeDevTools;

// Auto-start if run directly
if (require.main === module) {
    const devTools = new CursorChromeDevTools();
    
    devTools.connectToChrome().then(success => {
        if (success) {
            console.log('🚀 Cursor Chrome DevTools Integration Ready!');
            console.log('📊 Monitoring TribalWars in real-time...');
            
            // Keep the connection alive
            process.on('SIGINT', async () => {
                await devTools.disconnect();
                process.exit(0);
            });
        }
    });
} 