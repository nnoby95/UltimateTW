# General Coding - Debugging Checklist

## Quick Reference
- **Console Logging**: Strategic logging and debugging
- **Error Analysis**: Understanding error messages
- **Performance Issues**: Identifying bottlenecks
- **Network Problems**: HTTP and API debugging
- **Browser Issues**: Cross-browser compatibility

## Detailed Information

### Console Logging Strategy
**Purpose**: Effective debugging with console methods
**Logging Levels**:
```javascript
// Debug logging utility
class DebugLogger {
  constructor(level = 'info') {
    this.level = level;
    this.levels = { error: 0, warn: 1, info: 2, debug: 3 };
  }

  error(message, data = null) {
    if (this.levels[this.level] >= 0) {
      console.error(`[ERROR] ${message}`, data);
    }
  }

  warn(message, data = null) {
    if (this.levels[this.level] >= 1) {
      console.warn(`[WARN] ${message}`, data);
    }
  }

  info(message, data = null) {
    if (this.levels[this.level] >= 2) {
      console.info(`[INFO] ${message}`, data);
    }
  }

  debug(message, data = null) {
    if (this.levels[this.level] >= 3) {
      console.debug(`[DEBUG] ${message}`, data);
    }
  }

  // Performance timing
  time(label) {
    console.time(label);
  }

  timeEnd(label) {
    console.timeEnd(label);
  }

  // Table logging for objects
  table(data) {
    console.table(data);
  }

  // Group related logs
  group(label) {
    console.group(label);
  }

  groupEnd() {
    console.groupEnd();
  }
}

// Usage
const logger = new DebugLogger('debug');
logger.info('Application started');
logger.debug('User data loaded', { userId: 123, name: 'John' });
```

### Error Analysis
**Purpose**: Understanding and categorizing errors
**Error Types**:
```javascript
// Error analyzer
class ErrorAnalyzer {
  static analyze(error) {
    const analysis = {
      type: this.getErrorType(error),
      message: error.message,
      stack: error.stack,
      context: this.getContext(error),
      suggestions: this.getSuggestions(error)
    };

    console.group('Error Analysis');
    console.error('Error Type:', analysis.type);
    console.error('Message:', analysis.message);
    console.error('Context:', analysis.context);
    console.error('Suggestions:', analysis.suggestions);
    console.groupEnd();

    return analysis;
  }

  static getErrorType(error) {
    if (error instanceof TypeError) return 'TypeError';
    if (error instanceof ReferenceError) return 'ReferenceError';
    if (error instanceof SyntaxError) return 'SyntaxError';
    if (error instanceof RangeError) return 'RangeError';
    if (error instanceof URIError) return 'URIError';
    if (error instanceof EvalError) return 'EvalError';
    if (error.name === 'NetworkError') return 'NetworkError';
    if (error.name === 'ValidationError') return 'ValidationError';
    return 'UnknownError';
  }

  static getContext(error) {
    return {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      memory: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize
      } : null
    };
  }

  static getSuggestions(error) {
    const suggestions = [];
    
    switch (this.getErrorType(error)) {
      case 'TypeError':
        suggestions.push('Check variable types and null/undefined values');
        suggestions.push('Verify function parameters match expected types');
        break;
      case 'ReferenceError':
        suggestions.push('Check if variable/function is defined');
        suggestions.push('Verify import/export statements');
        break;
      case 'NetworkError':
        suggestions.push('Check network connectivity');
        suggestions.push('Verify API endpoints and authentication');
        break;
      case 'ValidationError':
        suggestions.push('Check input data format');
        suggestions.push('Verify required fields are present');
        break;
    }
    
    return suggestions;
  }
}
```

### Performance Debugging
**Purpose**: Identifying and fixing performance issues
**Performance Monitoring**:
```javascript
// Performance monitor
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
  }

  // Measure function execution time
  measure(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    this.metrics.set(name, {
      duration: end - start,
      timestamp: Date.now()
    });
    
    console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  }

  // Async performance measurement
  async measureAsync(name, fn) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    this.metrics.set(name, {
      duration: end - start,
      timestamp: Date.now()
    });
    
    console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  }

  // Memory usage monitoring
  monitorMemory() {
    if (performance.memory) {
      const memory = performance.memory;
      console.log('Memory Usage:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      });
    }
  }

  // DOM performance monitoring
  monitorDOM() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log('DOM Performance:', {
          name: entry.name,
          duration: entry.duration,
          startTime: entry.startTime
        });
      }
    });
    
    observer.observe({ entryTypes: ['measure', 'navigation'] });
  }

  // Get performance report
  getReport() {
    const report = {
      metrics: Object.fromEntries(this.metrics),
      memory: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null,
      navigation: performance.getEntriesByType('navigation')[0]
    };
    
    console.table(report.metrics);
    return report;
  }
}
```

### Network Debugging
**Purpose**: Debugging HTTP requests and API calls
**Network Monitoring**:
```javascript
// Network debugger
class NetworkDebugger {
  constructor() {
    this.requests = [];
    this.interceptRequests();
  }

  interceptRequests() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const request = {
        url: args[0],
        options: args[1] || {},
        startTime,
        status: null,
        duration: null,
        error: null
      };

      try {
        const response = await originalFetch(...args);
        request.status = response.status;
        request.duration = performance.now() - startTime;
        
        console.group(`🌐 ${request.options.method || 'GET'} ${request.url}`);
        console.log('Status:', response.status);
        console.log('Duration:', `${request.duration.toFixed(2)}ms`);
        console.log('Headers:', Object.fromEntries(response.headers));
        console.groupEnd();
        
        this.requests.push(request);
        return response;
      } catch (error) {
        request.error = error;
        request.duration = performance.now() - startTime;
        
        console.error(`❌ Network Error: ${request.url}`, error);
        this.requests.push(request);
        throw error;
      }
    };
  }

  // Analyze network performance
  analyzeNetwork() {
    const analysis = {
      totalRequests: this.requests.length,
      averageDuration: this.requests.reduce((sum, req) => sum + req.duration, 0) / this.requests.length,
      errors: this.requests.filter(req => req.error).length,
      slowRequests: this.requests.filter(req => req.duration > 1000),
      statusCodes: this.requests.reduce((acc, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
      }, {})
    };

    console.group('Network Analysis');
    console.log('Total Requests:', analysis.totalRequests);
    console.log('Average Duration:', `${analysis.averageDuration.toFixed(2)}ms`);
    console.log('Errors:', analysis.errors);
    console.log('Slow Requests (>1s):', analysis.slowRequests.length);
    console.table(analysis.statusCodes);
    console.groupEnd();

    return analysis;
  }

  // Check API health
  async checkAPIHealth(endpoints) {
    const results = [];
    
    for (const endpoint of endpoints) {
      try {
        const start = performance.now();
        const response = await fetch(endpoint);
        const duration = performance.now() - start;
        
        results.push({
          endpoint,
          status: response.status,
          duration,
          healthy: response.ok
        });
      } catch (error) {
        results.push({
          endpoint,
          status: 'ERROR',
          duration: null,
          healthy: false,
          error: error.message
        });
      }
    }
    
    console.table(results);
    return results;
  }
}
```

### Browser Compatibility Debugging
**Purpose**: Identifying cross-browser issues
**Compatibility Checker**:
```javascript
// Browser compatibility checker
class BrowserCompatibilityChecker {
  constructor() {
    this.browser = this.detectBrowser();
    this.features = this.checkFeatures();
  }

  detectBrowser() {
    const userAgent = navigator.userAgent;
    const browser = {
      name: 'Unknown',
      version: 'Unknown',
      engine: 'Unknown'
    };

    // Chrome
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browser.name = 'Chrome';
      browser.version = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
    }
    // Firefox
    else if (userAgent.includes('Firefox')) {
      browser.name = 'Firefox';
      browser.version = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
    }
    // Safari
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browser.name = 'Safari';
      browser.version = userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown';
    }
    // Edge
    else if (userAgent.includes('Edg')) {
      browser.name = 'Edge';
      browser.version = userAgent.match(/Edg\/(\d+)/)?.[1] || 'Unknown';
    }

    // Engine detection
    if (userAgent.includes('Gecko')) browser.engine = 'Gecko';
    else if (userAgent.includes('WebKit')) browser.engine = 'WebKit';
    else if (userAgent.includes('Blink')) browser.engine = 'Blink';

    return browser;
  }

  checkFeatures() {
    return {
      // ES6+ features
      arrowFunctions: typeof (() => {}) === 'function',
      templateLiterals: typeof `template` === 'string',
      destructuring: (() => {
        try { const { test } = { test: true }; return true; } catch { return false; }
      })(),
      asyncAwait: typeof (async () => {}) === 'function',
      
      // Web APIs
      fetch: typeof fetch === 'function',
      localStorage: typeof localStorage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
      indexedDB: typeof indexedDB !== 'undefined',
      
      // Modern APIs
      intersectionObserver: typeof IntersectionObserver !== 'undefined',
      mutationObserver: typeof MutationObserver !== 'undefined',
      performanceObserver: typeof PerformanceObserver !== 'undefined',
      
      // CSS features
      cssGrid: CSS.supports('display', 'grid'),
      cssFlexbox: CSS.supports('display', 'flex'),
      cssCustomProperties: CSS.supports('--custom-property', 'value')
    };
  }

  generateReport() {
    const report = {
      browser: this.browser,
      features: this.features,
      issues: this.identifyIssues()
    };

    console.group('Browser Compatibility Report');
    console.log('Browser:', this.browser);
    console.log('Features:', this.features);
    console.log('Issues:', report.issues);
    console.groupEnd();

    return report;
  }

  identifyIssues() {
    const issues = [];
    
    if (!this.features.fetch) {
      issues.push('Fetch API not supported - consider polyfill');
    }
    
    if (!this.features.localStorage) {
      issues.push('localStorage not supported - data persistence may fail');
    }
    
    if (!this.features.cssGrid) {
      issues.push('CSS Grid not supported - layout may break');
    }
    
    return issues;
  }
}
```

### Debugging Checklist
**Purpose**: Systematic debugging approach
**Step-by-Step Process**:

```javascript
// Debugging checklist
class DebuggingChecklist {
  constructor() {
    this.steps = [
      '1. Reproduce the issue consistently',
      '2. Check browser console for errors',
      '3. Verify network requests in DevTools',
      '4. Check for JavaScript errors',
      '5. Validate HTML structure',
      '6. Test in different browsers',
      '7. Check for memory leaks',
      '8. Verify API responses',
      '9. Test with different data',
      '10. Check browser compatibility'
    ];
  }

  async runChecklist(issue) {
    console.group('🔍 Debugging Checklist for:', issue);
    
    for (const step of this.steps) {
      console.log(step);
      await this.delay(500); // Simulate checking
    }
    
    console.groupEnd();
  }

  // Common debugging scenarios
  async debugAsyncIssue() {
    console.group('🐛 Async Issue Debugging');
    
    console.log('1. Check if async function is properly awaited');
    console.log('2. Verify Promise rejection handling');
    console.log('3. Check for unhandled promise rejections');
    console.log('4. Verify async/await syntax');
    console.log('5. Check for race conditions');
    
    console.groupEnd();
  }

  async debugPerformanceIssue() {
    console.group('⚡ Performance Issue Debugging');
    
    console.log('1. Use Performance tab in DevTools');
    console.log('2. Check for memory leaks');
    console.log('3. Analyze network requests');
    console.log('4. Check for blocking operations');
    console.log('5. Verify efficient DOM queries');
    
    console.groupEnd();
  }

  async debugNetworkIssue() {
    console.group('🌐 Network Issue Debugging');
    
    console.log('1. Check Network tab in DevTools');
    console.log('2. Verify CORS headers');
    console.log('3. Check authentication tokens');
    console.log('4. Verify API endpoints');
    console.log('5. Check for rate limiting');
    
    console.groupEnd();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Common Issues & Solutions

### Problem: Undefined variables
**Solution**: Check variable scope and hoisting
```javascript
// Add to debugging
function checkVariableScope(variableName) {
  console.log('Variable scope check:', {
    inGlobal: typeof window[variableName] !== 'undefined',
    inCurrentScope: typeof eval(variableName) !== 'undefined'
  });
}
```

### Problem: Network requests failing
**Solution**: Check CORS and authentication
```javascript
// Add to NetworkDebugger
async testCORS(url) {
  try {
    const response = await fetch(url, { method: 'OPTIONS' });
    console.log('CORS headers:', response.headers);
  } catch (error) {
    console.error('CORS error:', error);
  }
}
```

### Problem: Memory leaks
**Solution**: Monitor memory usage and cleanup
```javascript
// Add to PerformanceMonitor
monitorMemoryLeaks() {
  const initialMemory = performance.memory?.usedJSHeapSize || 0;
  
  setInterval(() => {
    const currentMemory = performance.memory?.usedJSHeapSize || 0;
    const increase = currentMemory - initialMemory;
    
    if (increase > 10 * 1024 * 1024) { // 10MB increase
      console.warn('Potential memory leak detected:', {
        increase: `${(increase / 1024 / 1024).toFixed(2)} MB`
      });
    }
  }, 5000);
}
```

Last Updated: 2024-12-19
Created: Initial debugging checklist documentation 