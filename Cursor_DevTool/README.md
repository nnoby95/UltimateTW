# Cursor DevTool - Chrome DevTools Integration for TribalWars

## 🎯 Overview

This tool connects **Cursor IDE directly to Chrome DevTools Protocol** for real-time debugging and development of TribalWars scripts. You can now debug, monitor, and develop your TribalWars scripts directly from Cursor with live feedback from the browser.

## 🚀 Features

- **🔗 Direct Chrome Connection** - Connect Cursor to Chrome DevTools Protocol
- **📊 Real-time Network Monitoring** - See all TribalWars API calls live
- **🐛 Live Debugging** - Set breakpoints and debug in real-time
- **📝 Console Log Capture** - All browser console messages in Cursor
- **⚡ Performance Monitoring** - Memory usage and execution times
- **🔄 Auto-reload Scripts** - Scripts reload when you save in Cursor
- **📁 File Watching** - Monitor script changes automatically

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **Google Chrome** browser
- **Cursor IDE**
- **TribalWars account** (for testing)

## 🛠️ Installation

### Step 1: Install Dependencies

```bash
cd Cursor_DevTool
npm install
```

### Step 2: Start Chrome with Remote Debugging

#### Windows:
```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%TEMP%\chrome-debug"
```

#### Or use the batch script:
```bash
setup_cursor_devtools.bat
```

#### macOS:
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug"
```

#### Linux:
```bash
google-chrome --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug"
```

### Step 3: Start the Integration

```bash
npm start
```

## 🎮 Usage

### Basic Usage

1. **Start the integration** (see installation above)
2. **Open TribalWars** in the Chrome instance with remote debugging
3. **Open Cursor IDE** and start debugging
4. **Press F5** in Cursor to start debugging with Chrome

### Debug Configuration

In Cursor, you can use these debug configurations:

- **"Cursor Chrome DevTools"** - Main integration
- **"Debug TribalWars Scripts"** - Debug your scripts
- **"Attach to Chrome"** - Attach to running Chrome instance

### Code Examples

#### Monitor Network Requests
```javascript
const devTools = require('./Cursor_Chrome_DevTools_Integration.js');
const instance = new devTools();

// Connect to Chrome
await instance.connectToChrome();

// Get network logs
const networkLog = await instance.getNetworkLog();
console.log('Recent requests:', networkLog.slice(-10));
```

#### Execute Code in Chrome
```javascript
// Execute JavaScript in Chrome context
await instance.executeInChrome('console.log("Hello from Cursor!")');

// Monitor TribalWars resources
await instance.executeInChrome(`
    const resources = {
        wood: document.querySelector('.wood')?.textContent,
        stone: document.querySelector('.stone')?.textContent,
        iron: document.querySelector('.iron')?.textContent
    };
    console.log('Resources:', resources);
`);
```

#### Real-time Script Monitoring
```javascript
// Monitor your TribalWars scripts
const scriptCode = `
    // Your TribalWars script here
    console.log('Script executed at:', new Date());
    
    // Monitor building queue
    const queue = document.querySelector('.buildingQueue');
    if (queue) {
        console.log('Building queue items:', queue.children.length);
    }
`;

await instance.executeInChrome(scriptCode);
```

## 🔧 Configuration

### Launch Configuration

The `.vscode/launch.json` file contains debug configurations:

```json
{
    "name": "Cursor Chrome DevTools",
    "type": "node",
    "request": "launch",
    "program": "${workspaceFolder}/Cursor_DevTool/Cursor_Chrome_DevTools_Integration.js"
}
```

### Environment Variables

- `NODE_ENV=development` - Development mode
- `TRIBALWARS_DEBUG=true` - Enable TribalWars debugging

## 📊 Monitoring Features

### Network Monitoring
- **All HTTP requests** to TribalWars servers
- **Request/Response timing** and status codes
- **API endpoint tracking** for TribalWars functions

### Console Monitoring
- **All console.log messages** from TribalWars
- **Error tracking** with stack traces
- **Warning messages** and debug info

### Performance Monitoring
- **Memory usage** tracking
- **Script execution times**
- **Resource loading** performance

### File Watching
- **Auto-reload scripts** when saved in Cursor
- **File change detection** in your script directory
- **Hot reloading** for development

## 🐛 Debugging Features

### Breakpoints
- **Set breakpoints** directly in Cursor
- **Conditional breakpoints** for specific conditions
- **Logpoint breakpoints** for logging without stopping

### Step-through Debugging
- **Step over** function calls
- **Step into** function definitions
- **Step out** of current function
- **Continue** execution

### Variable Inspection
- **Inspect variables** in real-time
- **Watch expressions** for specific values
- **Call stack** inspection

## 📁 File Structure

```
Cursor_DevTool/
├── Cursor_Chrome_DevTools_Integration.js  # Main integration script
├── package.json                            # Dependencies
├── setup_cursor_devtools.bat              # Windows setup script
├── .vscode/
│   └── launch.json                        # Debug configurations
└── README.md                              # This file
```

## 🔍 Troubleshooting

### Common Issues

1. **Chrome not starting with remote debugging**
   - Check Chrome path in setup script
   - Ensure port 9222 is not in use
   - Try different user data directory

2. **Connection failed**
   - Ensure Chrome is running with `--remote-debugging-port=9222`
   - Check if Chrome is accessible at `http://localhost:9222`
   - Restart Chrome and try again

3. **Scripts not reloading**
   - Check file paths in `watchCursorFiles()`
   - Ensure script directory exists
   - Check file permissions

4. **Performance issues**
   - Reduce log frequency in `setupPerformanceMonitoring()`
   - Clear logs periodically
   - Monitor memory usage

### Debug Commands

```javascript
// Check connection status
console.log('Connected:', instance.isConnected);

// Get current logs
const networkLog = await instance.getNetworkLog();
const consoleLog = await instance.getConsoleLog();
const debugLog = await instance.getDebugLog();

// Disconnect safely
await instance.disconnect();
```

## 🚀 Advanced Usage

### Custom Breakpoints
```javascript
// Set breakpoints for specific TribalWars functions
await instance.client.Debugger.setBreakpointByUrl({
    url: 'ajax.php',
    lineNumber: 0
});
```

### Performance Profiling
```javascript
// Start performance profiling
await instance.client.Performance.enable();

// Get performance metrics
const metrics = await instance.client.Performance.getMetrics();
console.log('Performance metrics:', metrics);
```

### Network Filtering
```javascript
// Filter specific network requests
const filteredRequests = networkLog.filter(req => 
    req.url.includes('ajax.php') || req.url.includes('game.php')
);
```

## 📚 API Reference

### Main Class: `CursorChromeDevTools`

#### Methods:
- `connectToChrome()` - Connect to Chrome DevTools Protocol
- `executeInChrome(expression)` - Execute JavaScript in Chrome
- `getNetworkLog()` - Get network request log
- `getConsoleLog()` - Get console message log
- `getDebugLog()` - Get debug log
- `disconnect()` - Disconnect from Chrome

#### Properties:
- `isConnected` - Connection status
- `client` - Chrome DevTools client
- `debugLog` - Debug log array
- `networkLog` - Network log array
- `consoleLog` - Console log array

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the console output for error messages
3. Ensure all prerequisites are installed
4. Test with a simple script first
5. Check Chrome DevTools Protocol documentation

## 🎉 Next Steps

1. **Start with basic monitoring** - Watch network requests and console logs
2. **Add breakpoints** - Debug specific TribalWars functions
3. **Monitor performance** - Optimize your scripts based on metrics
4. **Integrate with your scripts** - Add debugging to your existing code
5. **Share insights** - Help the TribalWars community with your findings

---

**Happy Debugging! 🚀** 