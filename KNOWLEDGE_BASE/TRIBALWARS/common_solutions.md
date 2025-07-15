# TribalWars - Common Solutions

## Quick Reference
- Session Management: Cookie-based authentication
- Rate Limiting: Request queuing with delays
- Data Parsing: DOM element extraction
- Error Handling: Retry mechanisms with exponential backoff
- Anti-Detection: Human-like behavior simulation

## Detailed Information

### Session Management
**Problem**: Maintaining valid session across requests
**Solution**: Cookie-based authentication with session validation

```javascript
class SessionManager {
  constructor() {
    this.cookies = new Map();
    this.sessionValid = false;
  }

  async login(username, password) {
    const response = await fetch('/dorf1.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    });

    if (response.ok) {
      this.extractCookies(response);
      this.sessionValid = true;
      return true;
    }
    return false;
  }

  extractCookies(response) {
    const setCookieHeaders = response.headers.get('set-cookie');
    if (setCookieHeaders) {
      const cookies = setCookieHeaders.split(',');
      cookies.forEach(cookie => {
        const [name, value] = cookie.split('=');
        this.cookies.set(name.trim(), value.split(';')[0]);
      });
    }
  }

  getCookieHeader() {
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }

  async validateSession() {
    try {
      const response = await fetch('/dorf1.php', {
        headers: { 'Cookie': this.getCookieHeader() }
      });
      this.sessionValid = response.ok && !response.url.includes('login');
      return this.sessionValid;
    } catch (error) {
      this.sessionValid = false;
      return false;
    }
  }
}
```

### Rate Limiting
**Problem**: Avoiding rate limiting and anti-bot detection
**Solution**: Request queuing with intelligent delays

```javascript
class RequestQueue {
  constructor(maxRequestsPerMinute = 10) {
    this.queue = [];
    this.processing = false;
    this.requestCount = 0;
    this.lastReset = Date.now();
    this.maxRequests = maxRequestsPerMinute;
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
      // Reset counter every minute
      if (Date.now() - this.lastReset > 60000) {
        this.requestCount = 0;
        this.lastReset = Date.now();
      }

      // Check rate limit
      if (this.requestCount >= this.maxRequests) {
        const waitTime = 60000 - (Date.now() - this.lastReset);
        await this.delay(waitTime);
        continue;
      }

      const { requestFn, resolve, reject } = this.queue.shift();
      
      try {
        this.requestCount++;
        const result = await requestFn();
        resolve(result);
        
        // Add random delay between requests (1-3 seconds)
        await this.delay(1000 + Math.random() * 2000);
      } catch (error) {
        reject(error);
      }
    }

    this.processing = false;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Data Parsing
**Problem**: Extracting data from HTML responses
**Solution**: Robust DOM parsing with error handling

```javascript
class DataParser {
  static parseResources(html) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      return {
        wood: this.extractNumber(doc, '#wood'),
        stone: this.extractNumber(doc, '#stone'),
        iron: this.extractNumber(doc, '#iron'),
        population: this.extractNumber(doc, '#pop_current'),
        maxPopulation: this.extractNumber(doc, '#pop_max')
      };
    } catch (error) {
      console.error('Failed to parse resources:', error);
      return null;
    }
  }

  static parseUnits(html) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const units = {};
      const unitSelectors = {
        spear: '.unit-item-spear .unit-count',
        sword: '.unit-item-sword .unit-count',
        axe: '.unit-item-axe .unit-count',
        archer: '.unit-item-archer .unit-count',
        scout: '.unit-item-scout .unit-count',
        light: '.unit-item-light .unit-count',
        heavy: '.unit-item-heavy .unit-count',
        ram: '.unit-item-ram .unit-count',
        catapult: '.unit-item-catapult .unit-count'
      };

      Object.entries(unitSelectors).forEach(([unit, selector]) => {
        units[unit] = this.extractNumber(doc, selector);
      });

      return units;
    } catch (error) {
      console.error('Failed to parse units:', error);
      return null;
    }
  }

  static parseBuildings(html) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const buildings = {};
      const buildingSelectors = {
        main: '.building-main .level',
        barracks: '.building-barracks .level',
        stable: '.building-stable .level',
        workshop: '.building-workshop .level',
        academy: '.building-academy .level',
        smithy: '.building-smithy .level',
        rally_point: '.building-rally_point .level',
        market: '.building-market .level',
        embassy: '.building-embassy .level',
        tower: '.building-tower .level'
      };

      Object.entries(buildingSelectors).forEach(([building, selector]) => {
        buildings[building] = this.extractNumber(doc, selector);
      });

      return buildings;
    } catch (error) {
      console.error('Failed to parse buildings:', error);
      return null;
    }
  }

  static extractNumber(doc, selector) {
    const element = doc.querySelector(selector);
    if (!element) return 0;
    
    const text = element.textContent.trim();
    const number = parseInt(text.replace(/[^\d]/g, ''));
    return isNaN(number) ? 0 : number;
  }
}
```

### Error Handling
**Problem**: Handling network errors and retries
**Solution**: Exponential backoff with retry logic

```javascript
class ErrorHandler {
  static async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms`);
        await this.delay(delay);
      }
    }
  }

  static async handleSessionError(error, sessionManager) {
    if (error.message.includes('session') || error.message.includes('login')) {
      console.log('Session expired, attempting to refresh...');
      const refreshed = await sessionManager.refreshSession();
      if (refreshed) {
        return true; // Retry the original request
      }
    }
    return false;
  }

  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Anti-Detection
**Problem**: Avoiding bot detection
**Solution**: Human-like behavior simulation

```javascript
class AntiDetection {
  static async simulateHumanBehavior() {
    // Random delays between actions
    const delay = 1000 + Math.random() * 3000;
    await this.delay(delay);
    
    // Random mouse movements (if in browser context)
    if (typeof window !== 'undefined') {
      this.simulateMouseMovement();
    }
  }

  static simulateMouseMovement() {
    const events = ['mousemove', 'mouseover', 'click'];
    events.forEach(eventType => {
      const event = new MouseEvent(eventType, {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: Math.random() * window.innerWidth,
        clientY: Math.random() * window.innerHeight
      });
      document.dispatchEvent(event);
    });
  }

  static getRandomUserAgent() {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0'
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Database Management
**Problem**: Storing and retrieving game data
**Solution**: Local storage with structured data

```javascript
class DatabaseManager {
  constructor() {
    this.dbName = 'TribalWarsData';
    this.version = 1;
    this.initDatabase();
  }

  async initDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create villages store
        if (!db.objectStoreNames.contains('villages')) {
          const villageStore = db.createObjectStore('villages', { keyPath: 'id' });
          villageStore.createIndex('player', 'player', { unique: false });
          villageStore.createIndex('coordinates', ['x', 'y'], { unique: false });
        }

        // Create resources store
        if (!db.objectStoreNames.contains('resources')) {
          const resourceStore = db.createObjectStore('resources', { keyPath: 'villageId' });
          resourceStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create units store
        if (!db.objectStoreNames.contains('units')) {
          const unitStore = db.createObjectStore('units', { keyPath: 'villageId' });
          unitStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async saveVillage(village) {
    const transaction = this.db.transaction(['villages'], 'readwrite');
    const store = transaction.objectStore('villages');
    return store.put(village);
  }

  async getVillage(villageId) {
    const transaction = this.db.transaction(['villages'], 'readonly');
    const store = transaction.objectStore('villages');
    return store.get(villageId);
  }

  async saveResources(villageId, resources) {
    const transaction = this.db.transaction(['resources'], 'readwrite');
    const store = transaction.objectStore('resources');
    return store.put({
      villageId,
      ...resources,
      timestamp: Date.now()
    });
  }

  async getResources(villageId) {
    const transaction = this.db.transaction(['resources'], 'readonly');
    const store = transaction.objectStore('resources');
    return store.get(villageId);
  }
}
```

## Common Issues & Solutions

### Problem: Session expires frequently
**Solution**: Implement automatic session refresh
```javascript
// Add to SessionManager
async refreshSession() {
  // Try to refresh session without full login
  const response = await fetch('/dorf1.php', {
    headers: { 'Cookie': this.getCookieHeader() }
  });
  
  if (response.ok) {
    this.extractCookies(response);
    return true;
  }
  
  return false;
}
```

### Problem: Rate limiting despite delays
**Solution**: Implement adaptive delays based on response headers
```javascript
// Add to RequestQueue
async adjustDelay(response) {
  const retryAfter = response.headers.get('Retry-After');
  if (retryAfter) {
    await this.delay(parseInt(retryAfter) * 1000);
  }
}
```

### Problem: Data parsing fails on different game versions
**Solution**: Implement multiple parsing strategies
```javascript
// Add to DataParser
static parseWithFallback(html, selectors) {
  for (const selector of selectors) {
    const result = this.tryParse(html, selector);
    if (result !== null) return result;
  }
  return null;
}
```

Last Updated: 2024-12-19
Created: Initial common solutions documentation 