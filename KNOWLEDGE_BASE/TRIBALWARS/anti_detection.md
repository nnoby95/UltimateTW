# TribalWars - Anti-Detection Strategies

## Quick Reference
- **Browser Restrictions**: Global locks, minimum delays, human-like behavior
- **Rate Limiting**: 5+ seconds between requests, random processing times
- **What Triggers Detection**: Too fast requests, predictable patterns, missing delays
- **Human Simulation**: Variable timing, realistic patterns, proper error handling
- **Proven Methods**: Documented working vs non-working approaches

## Browser Restrictions & Limitations

### Global Request Locking
```javascript
// Only one request at a time (browser limitation)
let isRequestActive = false;
let lastRequestTime = 0;
const MIN_DELAY_BETWEEN_REQUESTS = 5000;

async function safeRequest(url) {
    // Wait if another request is active
    while (isRequestActive) {
        await sleep(100);
    }
    
    // Ensure minimum time between requests
    const timeSinceLastRequest = Date.now() - lastRequestTime;
    if (timeSinceLastRequest < MIN_DELAY_BETWEEN_REQUESTS) {
        const waitTime = MIN_DELAY_BETWEEN_REQUESTS - timeSinceLastRequest;
        await sleep(waitTime);
    }
    
    isRequestActive = true;
    lastRequestTime = Date.now();
    
    try {
        const response = await fetch(url);
        const html = await response.text();
        return new DOMParser().parseFromString(html, 'text/html');
    } finally {
        isRequestActive = false;
    }
}
```

### Minimum Delay Requirements
- **Between requests**: 5+ seconds looks human
- **Processing time**: 1-3 seconds for realistic behavior
- **Page loads**: 3000ms minimum for game pages
- **Confirmations**: 2000ms minimum for dialogs

### Rate Limiting Variables (MUST be global scope)
```javascript
let actionBusy = false;
let lastActionTime = 0;

function performGameAction(parameters) {
    // Rate limiting check
    if (actionBusy || (Date.now() - lastActionTime < 200)) {
        return;
    }
    
    actionBusy = true;
    lastActionTime = Date.now();
    
    // Action code here...
    
    // Always reset in finally block
    try {
        // Perform action
    } catch (e) {
        console.error('Action failed:', e);
    } finally {
        actionBusy = false;
    }
}
```

## Human-like Behavior Simulation

### Variable Delays
```javascript
// Random delay between actions
function randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
}

// Human-like timing
async function humanLikeAction() {
    await randomDelay(1000, 3000); // 1-3 seconds
    // Perform action
    await randomDelay(500, 1500);  // 0.5-1.5 seconds
    // Next action
}
```

### Realistic Patterns
```javascript
// Mimic human clicking behavior
function humanClick(element) {
    // Random delay before click
    setTimeout(() => {
        element.click();
    }, Math.random() * 1000 + 500); // 0.5-1.5 seconds
}

// Variable form filling
function humanFormFill(form, data) {
    Object.entries(data).forEach(([field, value], index) => {
        setTimeout(() => {
            form[field].value = value;
        }, index * 200 + Math.random() * 300); // Staggered typing
    });
}
```

### Session Management
```javascript
// Proper cookie handling
function maintainSession() {
    // Check session validity
    if (!isSessionValid()) {
        await refreshSession();
    }
    
    // Include session cookies in requests
    const headers = {
        'Cookie': document.cookie,
        'User-Agent': navigator.userAgent
    };
}
```

## What Triggers Detection

### ❌ DETECTION TRIGGERS
- **Too fast requests**: Less than 5 seconds between requests
- **Predictable patterns**: Exact same timing every time
- **Missing delays**: No processing time between actions
- **Unrealistic behavior**: Perfect timing, no errors
- **Direct API calls**: Bypassing normal game flow
- **Bulk operations**: Too many actions at once

### ✅ AVOIDANCE STRATEGIES
- **Variable timing**: Random delays between actions
- **Error simulation**: Occasional failures and retries
- **Human patterns**: Realistic clicking and form filling
- **Session management**: Proper cookie handling
- **Rate limiting**: Global locks and minimum delays
- **Graceful failures**: Handle errors naturally

## Proven Working vs Non-Working Methods

### ✅ PROVEN WORKING METHODS
```javascript
// Opening actual game pages
const gameTab = window.open(gamePageUrl, '_blank');

// Form manipulation
const form = gameTab.document.forms.units;
form.axe.value = 10;
form.attack.click();

// Element clicking
const button = document.querySelector('.btn-confirm');
button.click();

// Multi-step automation
setTimeout(() => {
    // Wait for page load
    performNextStep();
}, 3000);
```

### ❌ METHODS THAT DON'T WORK
```javascript
// Direct HTTP POST (detected)
fetch('/game.php', {
    method: 'POST',
    body: 'action=attack&units=10'
});

// AJAX calls (blocked)
$.ajax({
    url: '/game.php',
    data: { action: 'attack' }
});

// Skipping steps (detected)
// Going directly to confirmation without rally point
```

## Anti-Detection Patterns

### Request Queuing
```javascript
class RequestQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.lastRequest = 0;
    }
    
    async addRequest(requestFn) {
        return new Promise((resolve, reject) => {
            this.queue.push({ requestFn, resolve, reject });
            this.processQueue();
        });
    }
    
    async processQueue() {
        if (this.processing || this.queue.length === 0) return;
        
        this.processing = true;
        
        while (this.queue.length > 0) {
            // Ensure minimum delay
            const timeSinceLast = Date.now() - this.lastRequest;
            if (timeSinceLast < 5000) {
                await this.delay(5000 - timeSinceLast);
            }
            
            const { requestFn, resolve, reject } = this.queue.shift();
            
            try {
                this.lastRequest = Date.now();
                const result = await requestFn();
                resolve(result);
                
                // Random delay between requests
                await this.delay(1000 + Math.random() * 2000);
            } catch (error) {
                reject(error);
            }
        }
        
        this.processing = false;
    }
}
```

### Error Simulation
```javascript
// Simulate human errors occasionally
function humanLikeAction() {
    // 5% chance of "mistake"
    if (Math.random() < 0.05) {
        console.log('Simulating human error...');
        setTimeout(() => {
            // Retry the action
            performAction();
        }, 2000 + Math.random() * 3000);
        return;
    }
    
    performAction();
}
```

### Realistic Timing
```javascript
// Human-like processing time
async function processWithHumanTiming() {
    // Initial delay (human thinking)
    await randomDelay(500, 2000);
    
    // Perform action
    const result = await performAction();
    
    // Processing delay (human reading)
    await randomDelay(1000, 3000);
    
    // Next action
    await performNextAction();
}
```

## Browser-Specific Limitations

### Chrome/Firefox Differences
```javascript
// Chrome: More strict with timing
const CHROME_DELAY = 6000; // 6 seconds minimum

// Firefox: Slightly more lenient
const FIREFOX_DELAY = 5000; // 5 seconds minimum

// Safari: Most strict
const SAFARI_DELAY = 7000; // 7 seconds minimum
```

### Mobile vs Desktop
```javascript
// Mobile: Slower processing expected
const MOBILE_DELAY_MULTIPLIER = 1.5;

// Desktop: Faster but still realistic
const DESKTOP_DELAY_MULTIPLIER = 1.0;
```

## Advanced Techniques

### User Agent Rotation
```javascript
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
];

function getRandomUserAgent() {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}
```

### IP Rotation (if available)
```javascript
// Use different IP addresses if possible
const proxyList = [
    'proxy1.example.com:8080',
    'proxy2.example.com:8080',
    'proxy3.example.com:8080'
];

function getRandomProxy() {
    return proxyList[Math.floor(Math.random() * proxyList.length)];
}
```

### Session Rotation
```javascript
// Rotate between different accounts/sessions
const sessions = [
    { username: 'user1', password: 'pass1' },
    { username: 'user2', password: 'pass2' },
    { username: 'user3', password: 'pass3' }
];

function getRandomSession() {
    return sessions[Math.floor(Math.random() * sessions.length)];
}
```

## Monitoring & Detection

### Self-Monitoring
```javascript
// Monitor your own behavior
class BehaviorMonitor {
    constructor() {
        this.actions = [];
        this.lastAction = 0;
    }
    
    logAction(action) {
        const now = Date.now();
        const timeSinceLast = now - this.lastAction;
        
        this.actions.push({
            action,
            timestamp: now,
            timeSinceLast
        });
        
        this.lastAction = now;
        
        // Check for suspicious patterns
        this.checkPatterns();
    }
    
    checkPatterns() {
        // Too many actions too quickly
        const recentActions = this.actions.filter(a => 
            Date.now() - a.timestamp < 60000
        );
        
        if (recentActions.length > 10) {
            console.warn('Too many actions detected');
            this.pauseActions(30000); // Pause for 30 seconds
        }
    }
}
```

### Detection Avoidance
```javascript
// Avoid common detection patterns
function avoidDetection() {
    // Don't make requests at exact intervals
    const baseDelay = 5000;
    const randomOffset = Math.random() * 2000 - 1000; // ±1 second
    return baseDelay + randomOffset;
    
    // Don't always succeed
    if (Math.random() < 0.02) { // 2% failure rate
        throw new Error('Simulated failure');
    }
}
```

Last Updated: 2024-12-19
Updated: Added comprehensive anti-detection strategies and browser limitations
Created: Initial anti-detection documentation 