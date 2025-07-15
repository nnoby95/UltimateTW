# General Coding - JavaScript Snippets

## Quick Reference
- **Async/Await**: Modern promise handling patterns
- **DOM Manipulation**: Element selection and modification
- **Data Processing**: Array and object manipulation
- **Error Handling**: Try-catch and error recovery
- **Utility Functions**: Common helper functions

## Detailed Information

### Async/Await Patterns
**Purpose**: Modern asynchronous programming patterns
**Basic Patterns**:
```javascript
// Basic async function
async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
  }
}

// Parallel execution
async function fetchMultiple(urls) {
  const promises = urls.map(url => fetch(url));
  const responses = await Promise.all(promises);
  return Promise.all(responses.map(r => r.json()));
}

// Sequential execution with delay
async function fetchSequential(urls, delay = 1000) {
  const results = [];
  for (const url of urls) {
    const data = await fetchData(url);
    results.push(data);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return results;
}

// Retry pattern
async function retry(fn, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
}
```

### DOM Manipulation
**Purpose**: Working with HTML elements
**Element Selection**:
```javascript
// Modern element selection
const elements = {
  byId: (id) => document.getElementById(id),
  byClass: (className) => document.getElementsByClassName(className),
  byTag: (tagName) => document.getElementsByTagName(tagName),
  bySelector: (selector) => document.querySelector(selector),
  bySelectorAll: (selector) => document.querySelectorAll(selector),
  byData: (attribute, value) => document.querySelector(`[data-${attribute}="${value}"]`)
};

// Element creation
function createElement(tag, attributes = {}, content = '') {
  const element = document.createElement(tag);
  
  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'textContent') {
      element.textContent = value;
    } else if (key === 'innerHTML') {
      element.innerHTML = value;
    } else {
      element.setAttribute(key, value);
    }
  });
  
  if (content) {
    element.textContent = content;
  }
  
  return element;
}

// Element manipulation
function manipulateElement(selector, operations) {
  const element = document.querySelector(selector);
  if (!element) return false;
  
  Object.entries(operations).forEach(([operation, value]) => {
    switch (operation) {
      case 'text':
        element.textContent = value;
        break;
      case 'html':
        element.innerHTML = value;
        break;
      case 'class':
        element.className = value;
        break;
      case 'style':
        Object.assign(element.style, value);
        break;
      case 'attributes':
        Object.entries(value).forEach(([attr, val]) => {
          element.setAttribute(attr, val);
        });
        break;
    }
  });
  
  return true;
}
```

### Data Processing
**Purpose**: Manipulating arrays and objects
**Array Operations**:
```javascript
// Array utilities
const arrayUtils = {
  // Remove duplicates
  unique: (arr) => [...new Set(arr)],
  
  // Group by property
  groupBy: (arr, key) => {
    return arr.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  },
  
  // Sort by multiple properties
  sortBy: (arr, ...keys) => {
    return arr.sort((a, b) => {
      for (const key of keys) {
        const aVal = a[key];
        const bVal = b[key];
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
      }
      return 0;
    });
  },
  
  // Chunk array
  chunk: (arr, size) => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size)
    );
  },
  
  // Flatten nested arrays
  flatten: (arr) => {
    return arr.reduce((flat, item) => 
      flat.concat(Array.isArray(item) ? flatten(item) : item), []
    );
  }
};

// Object utilities
const objectUtils = {
  // Deep clone
  deepClone: (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  },
  
  // Merge objects deeply
  deepMerge: (target, ...sources) => {
    if (!sources.length) return target;
    const source = sources.shift();
    
    if (isObject(target) && isObject(source)) {
      for (const key in source) {
        if (isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          deepMerge(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
    
    return deepMerge(target, ...sources);
  },
  
  // Pick specific properties
  pick: (obj, keys) => {
    return keys.reduce((result, key) => {
      if (obj.hasOwnProperty(key)) {
        result[key] = obj[key];
      }
      return result;
    }, {});
  },
  
  // Omit specific properties
  omit: (obj, keys) => {
    return Object.keys(obj)
      .filter(key => !keys.includes(key))
      .reduce((result, key) => {
        result[key] = obj[key];
        return result;
      }, {});
  }
};

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}
```

### Error Handling
**Purpose**: Robust error management
**Error Handling Patterns**:
```javascript
// Custom error classes
class CustomError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
  }
}

class ValidationError extends CustomError {
  constructor(message, field, value) {
    super(message, 'VALIDATION_ERROR', { field, value });
  }
}

class NetworkError extends CustomError {
  constructor(message, status, url) {
    super(message, 'NETWORK_ERROR', { status, url });
  }
}

// Error handler
class ErrorHandler {
  static handle(error, context = '') {
    console.error(`Error in ${context}:`, error);
    
    if (error instanceof ValidationError) {
      this.handleValidationError(error);
    } else if (error instanceof NetworkError) {
      this.handleNetworkError(error);
    } else {
      this.handleGenericError(error);
    }
  }
  
  static handleValidationError(error) {
    // Handle validation errors
    console.warn(`Validation failed for field "${error.details.field}":`, error.message);
  }
  
  static handleNetworkError(error) {
    // Handle network errors
    console.error(`Network request failed (${error.details.status}):`, error.message);
  }
  
  static handleGenericError(error) {
    // Handle generic errors
    console.error('An unexpected error occurred:', error.message);
  }
}

// Safe function execution
function safeExecute(fn, fallback = null) {
  try {
    return fn();
  } catch (error) {
    ErrorHandler.handle(error, 'safeExecute');
    return fallback;
  }
}

// Async safe execution
async function safeExecuteAsync(fn, fallback = null) {
  try {
    return await fn();
  } catch (error) {
    ErrorHandler.handle(error, 'safeExecuteAsync');
    return fallback;
  }
}
```

### Utility Functions
**Purpose**: Common helper functions
**General Utilities**:
```javascript
// Debounce function
function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

// Throttle function
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Deep equality check
function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  
  if (typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i])) return false;
      }
      return true;
    }
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }
  
  return false;
}

// Format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Format date
function formatDate(date, format = 'YYYY-MM-DD') {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

// Generate random string
function randomString(length = 8, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

// Sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Event Handling
**Purpose**: Managing DOM events
**Event Utilities**:
```javascript
// Event delegation
function delegateEvent(parent, selector, eventType, handler) {
  parent.addEventListener(eventType, (event) => {
    const target = event.target.closest(selector);
    if (target && parent.contains(target)) {
      handler.call(target, event);
    }
  });
}

// Event emitter
class EventEmitter {
  constructor() {
    this.events = {};
  }
  
  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }
  
  off(event, listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }
  
  emit(event, ...args) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => listener(...args));
  }
  
  once(event, listener) {
    const onceListener = (...args) => {
      listener(...args);
      this.off(event, onceListener);
    };
    this.on(event, onceListener);
  }
}

// Observable pattern
class Observable {
  constructor() {
    this.observers = [];
  }
  
  subscribe(observer) {
    this.observers.push(observer);
    return () => {
      this.observers = this.observers.filter(obs => obs !== observer);
    };
  }
  
  notify(data) {
    this.observers.forEach(observer => observer(data));
  }
}
```

## Common Issues & Solutions

### Problem: Memory leaks in event listeners
**Solution**: Proper cleanup and weak references
```javascript
// Add to EventEmitter
cleanup() {
  this.events = {};
}
```

### Problem: Async operations not properly handled
**Solution**: Use proper error boundaries
```javascript
// Add to async patterns
async function withErrorBoundary(fn, errorHandler) {
  try {
    return await fn();
  } catch (error) {
    errorHandler(error);
    throw error;
  }
}
```

### Problem: DOM queries are slow
**Solution**: Cache selectors and use efficient queries
```javascript
// Add to DOM utilities
const cachedSelectors = new Map();

function cachedQuery(selector) {
  if (!cachedSelectors.has(selector)) {
    cachedSelectors.set(selector, document.querySelector(selector));
  }
  return cachedSelectors.get(selector);
}
```

Last Updated: 2024-12-19
Created: Initial JavaScript snippets documentation 