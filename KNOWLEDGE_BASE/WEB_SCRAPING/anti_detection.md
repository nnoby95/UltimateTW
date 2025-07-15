# Web Scraping - Anti-Detection

## Quick Reference
- **User Agent Rotation**: Multiple browser signatures
- **Request Delays**: Random intervals between requests
- **Session Management**: Proper cookie handling
- **Behavior Simulation**: Human-like interaction patterns
- **Proxy Rotation**: IP address rotation

## Detailed Information

### User Agent Management
**Purpose**: Avoiding detection through browser fingerprinting
**Rotation Strategy**:
```javascript
class UserAgentManager {
  constructor() {
    this.userAgents = [
      // Chrome on Windows
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      
      // Chrome on Mac
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      
      // Firefox on Windows
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
      
      // Firefox on Mac
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0',
      
      // Safari on Mac
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      
      // Edge on Windows
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/119.0.0.0 Safari/537.36'
    ];
    
    this.currentIndex = 0;
    this.lastRotation = Date.now();
    this.rotationInterval = 300000; // 5 minutes
  }

  getCurrentUserAgent() {
    this.checkRotation();
    return this.userAgents[this.currentIndex];
  }

  rotateUserAgent() {
    this.currentIndex = (this.currentIndex + 1) % this.userAgents.length;
    this.lastRotation = Date.now();
    return this.userAgents[this.currentIndex];
  }

  checkRotation() {
    if (Date.now() - this.lastRotation > this.rotationInterval) {
      this.rotateUserAgent();
    }
  }

  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }
}
```

### Request Headers Management
**Purpose**: Mimicking real browser behavior
**Header Configuration**:
```javascript
class HeaderManager {
  constructor() {
    this.baseHeaders = {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0'
    };
  }

  getHeaders(referer = null) {
    const headers = { ...this.baseHeaders };
    
    if (referer) {
      headers['Referer'] = referer;
    }
    
    // Add random Accept-Language variations
    const languages = [
      'en-US,en;q=0.9',
      'en-US,en;q=0.8,es;q=0.7',
      'en-US,en;q=0.9,fr;q=0.8',
      'en-GB,en;q=0.9',
      'en-CA,en;q=0.9'
    ];
    headers['Accept-Language'] = languages[Math.floor(Math.random() * languages.length)];
    
    return headers;
  }

  addReferer(headers, referer) {
    headers['Referer'] = referer;
    return headers;
  }
}
```

### Timing and Delays
**Purpose**: Simulating human browsing patterns
**Delay Strategies**:
```javascript
class TimingManager {
  constructor() {
    this.minDelay = 1000; // 1 second
    this.maxDelay = 5000; // 5 seconds
    this.lastRequest = 0;
  }

  async randomDelay() {
    const delay = this.minDelay + Math.random() * (this.maxDelay - this.minDelay);
    await this.delay(delay);
  }

  async humanLikeDelay() {
    // Simulate human reading time
    const baseDelay = 2000 + Math.random() * 3000;
    const readingTime = Math.random() * 5000; // 0-5 seconds reading
    await this.delay(baseDelay + readingTime);
  }

  async pageLoadDelay() {
    // Simulate page loading time
    const loadTime = 500 + Math.random() * 1500;
    await this.delay(loadTime);
  }

  async scrollDelay() {
    // Simulate scrolling behavior
    const scrollPauses = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < scrollPauses; i++) {
      await this.delay(500 + Math.random() * 1000);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Session Management
**Purpose**: Maintaining realistic session behavior
**Session Handling**:
```javascript
class SessionManager {
  constructor() {
    this.cookies = new Map();
    this.sessionStart = Date.now();
    this.pageHistory = [];
    this.userAgentManager = new UserAgentManager();
  }

  async startSession() {
    // Simulate initial page visit
    await this.simulateInitialVisit();
    this.sessionStart = Date.now();
  }

  async simulateInitialVisit() {
    // Visit homepage first
    const response = await fetch('/', {
      headers: {
        'User-Agent': this.userAgentManager.getCurrentUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    this.extractCookies(response);
    await this.delay(2000 + Math.random() * 3000); // Simulate reading
  }

  extractCookies(response) {
    const setCookieHeaders = response.headers.get('set-cookie');
    if (setCookieHeaders) {
      const cookies = setCookieHeaders.split(',');
      cookies.forEach(cookie => {
        const [name, value] = cookie.split('=');
        if (name && value) {
          this.cookies.set(name.trim(), value.split(';')[0]);
        }
      });
    }
  }

  getCookieHeader() {
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }

  addToHistory(url) {
    this.pageHistory.push({
      url,
      timestamp: Date.now()
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Behavior Simulation
**Purpose**: Mimicking human browsing patterns
**Human Behavior**:
```javascript
class BehaviorSimulator {
  constructor() {
    this.timingManager = new TimingManager();
    this.sessionManager = new SessionManager();
  }

  async simulateHumanBrowsing(url) {
    // Add to page history
    this.sessionManager.addToHistory(url);
    
    // Random delay before request
    await this.timingManager.randomDelay();
    
    // Simulate page load
    await this.timingManager.pageLoadDelay();
    
    // Simulate reading time (longer for content pages)
    if (this.isContentPage(url)) {
      await this.timingManager.humanLikeDelay();
    }
    
    // Simulate scrolling
    await this.timingManager.scrollDelay();
  }

  isContentPage(url) {
    const contentPatterns = [
      '/article/', '/post/', '/news/', '/blog/',
      '/product/', '/item/', '/detail/'
    ];
    return contentPatterns.some(pattern => url.includes(pattern));
  }

  async simulateFormSubmission(formData) {
    // Simulate form filling time
    const fieldCount = Object.keys(formData).length;
    const fillTime = fieldCount * (500 + Math.random() * 1000);
    await this.timingManager.delay(fillTime);
    
    // Simulate form review
    await this.timingManager.delay(1000 + Math.random() * 2000);
  }

  async simulateSearch(searchTerm) {
    // Simulate typing time
    const typingTime = searchTerm.length * (50 + Math.random() * 100);
    await this.timingManager.delay(typingTime);
    
    // Simulate thinking time
    await this.timingManager.delay(500 + Math.random() * 1500);
  }
}
```

### Proxy Management
**Purpose**: Rotating IP addresses to avoid detection
**Proxy Rotation**:
```javascript
class ProxyManager {
  constructor() {
    this.proxies = [
      // Add your proxy list here
      // Format: { host: 'proxy1.com', port: 8080, username: 'user', password: 'pass' }
    ];
    this.currentProxyIndex = 0;
    this.lastRotation = Date.now();
    this.rotationInterval = 600000; // 10 minutes
  }

  getCurrentProxy() {
    this.checkRotation();
    return this.proxies[this.currentProxyIndex];
  }

  rotateProxy() {
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length;
    this.lastRotation = Date.now();
    return this.proxies[this.currentProxyIndex];
  }

  checkRotation() {
    if (Date.now() - this.lastRotation > this.rotationInterval) {
      this.rotateProxy();
    }
  }

  getProxyUrl() {
    const proxy = this.getCurrentProxy();
    if (proxy.username && proxy.password) {
      return `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
    }
    return `http://${proxy.host}:${proxy.port}`;
  }
}
```

### Fingerprint Management
**Purpose**: Avoiding browser fingerprinting detection
**Fingerprint Spoofing**:
```javascript
class FingerprintManager {
  constructor() {
    this.screenResolutions = [
      '1920x1080', '1366x768', '1440x900', '1536x864',
      '1280x720', '1600x900', '1024x768', '1280x800'
    ];
    this.colorDepths = [24, 32];
    this.timezones = [
      'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
      'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo'
    ];
  }

  getRandomFingerprint() {
    return {
      screenResolution: this.screenResolutions[Math.floor(Math.random() * this.screenResolutions.length)],
      colorDepth: this.colorDepths[Math.floor(Math.random() * this.colorDepths.length)],
      timezone: this.timezones[Math.floor(Math.random() * this.timezones.length)],
      language: 'en-US',
      platform: this.getRandomPlatform()
    };
  }

  getRandomPlatform() {
    const platforms = ['Win32', 'MacIntel', 'Linux x86_64'];
    return platforms[Math.floor(Math.random() * platforms.length)];
  }

  generateCanvasFingerprint() {
    // Generate a consistent but random canvas fingerprint
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Canvas fingerprint', 2, 2);
    return canvas.toDataURL();
  }
}
```

## Common Issues & Solutions

### Problem: Site detects automated requests
**Solution**: Implement comprehensive behavior simulation
```javascript
// Add to BehaviorSimulator
async simulateRealisticSession() {
  await this.sessionManager.startSession();
  await this.timingManager.humanLikeDelay();
  await this.simulateMouseMovements();
  await this.simulateScrolling();
}
```

### Problem: IP gets blocked
**Solution**: Implement proxy rotation and request throttling
```javascript
// Add to ProxyManager
async handleBlockedIP() {
  this.rotateProxy();
  await this.delay(300000); // Wait 5 minutes
  return this.getCurrentProxy();
}
```

### Problem: Session gets invalidated
**Solution**: Implement session refresh and cookie management
```javascript
// Add to SessionManager
async refreshSession() {
  const response = await fetch('/login', {
    method: 'POST',
    headers: { 'Cookie': this.getCookieHeader() },
    body: 'refresh=true'
  });
  
  if (response.ok) {
    this.extractCookies(response);
    return true;
  }
  return false;
}
```

Last Updated: 2024-12-19
Created: Initial anti-detection documentation 