# TribalWars - DOM Manipulation Methods

## Quick Reference
- **Rate Limiting**: Global variables required for proper timing
- **Multi-Step Automation**: Rally point → confirmation patterns
- **What Works**: Opening game pages, form manipulation, element.click()
- **What Doesn't Work**: Direct HTTP POST, AJAX calls, skipping steps
- **Anti-Detection**: Human-like behavior simulation

## Proven Working Patterns

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
    
    // Open game page in new tab
    const gameTab = window.open(gamePageUrl, '_blank');
    
    // Wait for page load, then manipulate DOM
    setTimeout(() => {
        try {
            // DOM manipulation code here
            const form = gameTab.document.forms.units;
            form.axe.value = axes;
            form.attack.click();
        } catch (e) {
            console.error('Action failed:', e);
            actionBusy = false;
        }
    }, 3000);
}
```

### Multi-Step Automation
```javascript
// Step 1: Open game page
const gameTab = window.open(gamePageUrl, '_blank');

// Step 2: Wait for load, then manipulate
setTimeout(() => {
    try {
        const form = gameTab.document.forms.units;
        form.axe.value = axes;
        form.attack.click();
        
        // Step 3: Wait for confirmation page
        setTimeout(() => {
            try {
                const confirmButton = gameTab.document.querySelector('.btn-confirm');
                if (confirmButton) {
                    confirmButton.click();
                }
            } catch (e) {
                console.error('Confirmation failed:', e);
            }
        }, 2000);
    } catch (e) {
        console.error('Action failed:', e);
    }
}, 3000);
```

### Safe DOM Scraping
```javascript
// Global rate limiting system
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

## What Works vs What Doesn't

### ✅ PROVEN WORKING METHODS
- Opening actual game pages in new tabs
- Manipulating form.fieldName.value
- Using element.click() on buttons
- Waiting for page loads with setTimeout
- Multi-step automation (rally → confirm)
- DOM element selection with querySelector
- Form submission through natural flow

### ❌ METHODS THAT DON'T WORK
- Direct HTTP POST to game endpoints
- AJAX calls to game.php
- Custom form submissions
- Skipping the rally point step
- Bypassing confirmation dialogs
- Direct DOM manipulation without page load

## Anti-Detection Strategies

### Browser Restrictions
- **Global lock**: Only one request at a time
- **Minimum delays**: 5+ seconds between requests looks human
- **Random delays**: 1-3 second processing time
- **Error handling**: Graceful failure required

### Human-like Behavior
- **Variable delays**: Random timing between actions
- **Realistic patterns**: Mimic human clicking behavior
- **Session management**: Proper cookie handling
- **Error recovery**: Graceful handling of failures

### Rate Limiting Requirements
- **Minimum delay**: 200ms between requests
- **Variable declarations**: Must be at global scope
- **Error handling**: Always reset busy flags in catch blocks
- **Timing**: 3000ms for page loads, 2000ms for confirmations

## Common Patterns

### Form Manipulation
```javascript
// Fill form fields
const form = document.forms.units;
form.axe.value = 10;
form.sword.value = 5;

// Submit form
form.submit();
// OR
form.querySelector('input[type="submit"]').click();
```

### Element Selection
```javascript
// By ID
const element = document.getElementById('wood');

// By class
const elements = document.querySelectorAll('.unit-count');

// By attribute
const button = document.querySelector('input[value="Attack"]');
```

### Page Navigation
```javascript
// Open new page
window.open('/game.php?village=123&screen=overview', '_blank');

// Navigate in same tab
window.location.href = '/game.php?village=123&screen=overview';
```

## Error Handling

### Try-Catch Pattern
```javascript
function safeDOMAction() {
    try {
        const element = document.querySelector('.target-element');
        if (element) {
            element.click();
        } else {
            console.log('Element not found');
        }
    } catch (error) {
        console.error('DOM action failed:', error);
        // Reset busy flag
        actionBusy = false;
    }
}
```

### Retry Logic
```javascript
function retryAction(action, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return action();
        } catch (error) {
            console.log(`Attempt ${i + 1} failed:`, error);
            if (i === maxRetries - 1) {
                throw error;
            }
            // Wait before retry
            setTimeout(() => {}, 1000 * (i + 1));
        }
    }
}
```

## Performance Optimization

### Efficient DOM Queries
```javascript
// Cache selectors
const woodElement = document.getElementById('wood');
const stoneElement = document.getElementById('stone');

// Use cached elements
function updateResources() {
    woodElement.textContent = newWoodValue;
    stoneElement.textContent = newStoneValue;
}
```

### Batch Operations
```javascript
// Batch multiple operations
function batchUpdate() {
    const updates = [
        { selector: '#wood', value: woodValue },
        { selector: '#stone', value: stoneValue },
        { selector: '#iron', value: ironValue }
    ];
    
    updates.forEach(update => {
        const element = document.querySelector(update.selector);
        if (element) {
            element.textContent = update.value;
        }
    });
}
```

## Security Considerations

### XSS Prevention
```javascript
// Sanitize user input
function sanitizeInput(input) {
    return input.replace(/[<>]/g, '');
}

// Use textContent instead of innerHTML
element.textContent = userInput; // Safe
// element.innerHTML = userInput; // Dangerous
```

### CSRF Protection
```javascript
// Include CSRF token in requests
const csrfToken = game_data.csrf;
const formData = new FormData();
formData.append('h', csrfToken);
formData.append('action', 'attack');
```

## Debugging Techniques

### Console Logging
```javascript
function debugDOMAction() {
    console.log('Starting DOM action');
    
    try {
        const element = document.querySelector('.target');
        console.log('Element found:', element);
        
        element.click();
        console.log('Click successful');
    } catch (error) {
        console.error('Action failed:', error);
    }
}
```

### Element Inspection
```javascript
function inspectElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
        console.log('Element:', element);
        console.log('Text:', element.textContent);
        console.log('HTML:', element.outerHTML);
        console.log('Classes:', element.className);
    } else {
        console.log('Element not found:', selector);
    }
}
```

Last Updated: 2024-12-19
Updated: Added comprehensive DOM manipulation patterns and anti-detection strategies
Created: Initial DOM manipulation documentation 