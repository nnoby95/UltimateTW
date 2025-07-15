# Web Scraping - Common Patterns

## Quick Reference
- **HTML Parsing**: DOM manipulation and element selection
- **Data Extraction**: Pattern matching and text processing
- **Request Management**: Session handling and rate limiting
- **Error Handling**: Retry logic and fallback strategies
- **Anti-Detection**: User agent rotation and behavior simulation

## Detailed Information

### HTML Parsing Patterns
**Purpose**: Extracting data from HTML documents
**Common Selectors**:
```javascript
const selectors = {
  // Resource extraction
  resources: {
    wood: '#wood',
    stone: '#stone', 
    iron: '#iron',
    population: '#pop_current',
    maxPopulation: '#pop_max'
  },
  
  // Table data extraction
  tableData: {
    rows: 'table tr',
    cells: 'td',
    headers: 'th'
  },
  
  // Form data extraction
  forms: {
    inputs: 'input[name]',
    selects: 'select[name]',
    buttons: 'button[type="submit"]'
  },
  
  // Navigation elements
  navigation: {
    links: 'a[href]',
    pagination: '.pagination a',
    breadcrumbs: '.breadcrumb a'
  }
};
```

**Parsing Functions**:
```javascript
class HTMLParser {
  static parseTable(tableElement) {
    const rows = tableElement.querySelectorAll('tr');
    const data = [];
    
    rows.forEach((row, index) => {
      if (index === 0) return; // Skip header row
      
      const cells = row.querySelectorAll('td');
      const rowData = {};
      
      cells.forEach((cell, cellIndex) => {
        const header = rows[0].querySelectorAll('th')[cellIndex];
        const key = header ? header.textContent.trim() : `column_${cellIndex}`;
        rowData[key] = cell.textContent.trim();
      });
      
      data.push(rowData);
    });
    
    return data;
  }

  static parseForm(formElement) {
    const formData = {};
    const inputs = formElement.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      const name = input.getAttribute('name');
      if (name) {
        if (input.type === 'checkbox' || input.type === 'radio') {
          formData[name] = input.checked ? input.value : '';
        } else {
          formData[name] = input.value;
        }
      }
    });
    
    return formData;
  }

  static extractText(element, selector) {
    const el = element.querySelector(selector);
    return el ? el.textContent.trim() : '';
  }

  static extractNumber(element, selector) {
    const text = this.extractText(element, selector);
    const number = parseInt(text.replace(/[^\d]/g, ''));
    return isNaN(number) ? 0 : number;
  }

  static extractAttribute(element, selector, attribute) {
    const el = element.querySelector(selector);
    return el ? el.getAttribute(attribute) : '';
  }
}
```

### Data Extraction Patterns
**Purpose**: Converting raw HTML into structured data
**Text Processing**:
```javascript
class DataExtractor {
  static cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[\r\n\t]/g, '')
      .trim();
  }

  static extractNumbers(text) {
    const numbers = text.match(/\d+/g);
    return numbers ? numbers.map(n => parseInt(n)) : [];
  }

  static extractCurrency(text) {
    const match = text.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
  }

  static extractDate(text) {
    const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dateMatch) {
      return new Date(dateMatch[3], dateMatch[2] - 1, dateMatch[1]);
    }
    return null;
  }

  static extractTime(text) {
    const timeMatch = text.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (timeMatch) {
      return {
        hours: parseInt(timeMatch[1]),
        minutes: parseInt(timeMatch[2]),
        seconds: timeMatch[3] ? parseInt(timeMatch[3]) : 0
      };
    }
    return null;
  }

  static parseTableToJSON(tableElement) {
    const headers = [];
    const data = [];
    
    // Extract headers
    const headerRow = tableElement.querySelector('tr');
    if (headerRow) {
      headerRow.querySelectorAll('th, td').forEach(cell => {
        headers.push(this.cleanText(cell.textContent));
      });
    }
    
    // Extract data rows
    const rows = tableElement.querySelectorAll('tr');
    rows.forEach((row, index) => {
      if (index === 0) return; // Skip header row
      
      const rowData = {};
      const cells = row.querySelectorAll('td');
      
      cells.forEach((cell, cellIndex) => {
        const header = headers[cellIndex] || `column_${cellIndex}`;
        rowData[header] = this.cleanText(cell.textContent);
      });
      
      data.push(rowData);
    });
    
    return data;
  }
}
```

### Request Management Patterns
**Purpose**: Managing HTTP requests and sessions
**Session Management**:
```javascript
class RequestManager {
  constructor() {
    this.session = new Map();
    this.cookies = new Map();
    this.userAgent = this.getRandomUserAgent();
  }

  async makeRequest(url, options = {}) {
    const defaultOptions = {
      method: 'GET',
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    };

    // Add cookies if available
    if (this.cookies.size > 0) {
      const cookieHeader = Array.from(this.cookies.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');
      defaultOptions.headers['Cookie'] = cookieHeader;
    }

    const finalOptions = { ...defaultOptions, ...options };
    
    try {
      const response = await fetch(url, finalOptions);
      this.extractCookies(response);
      return response;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
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

  getRandomUserAgent() {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/91.0.864.59'
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }
}
```

### Rate Limiting Patterns
**Purpose**: Avoiding rate limiting and detection
**Queue Management**:
```javascript
class RateLimiter {
  constructor(maxRequestsPerMinute = 60) {
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
        
        // Add random delay between requests
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

### Error Handling Patterns
**Purpose**: Handling network errors and retries
**Retry Logic**:
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

  static async handleCommonErrors(error) {
    if (error.message.includes('429')) {
      console.log('Rate limited, waiting 60 seconds...');
      await this.delay(60000);
      return true; // Retry
    }
    
    if (error.message.includes('403')) {
      console.log('Access forbidden, may need to update user agent');
      return false; // Don't retry
    }
    
    if (error.message.includes('500') || error.message.includes('502')) {
      console.log('Server error, retrying...');
      return true; // Retry
    }
    
    return false; // Don't retry
  }

  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Data Validation Patterns
**Purpose**: Ensuring extracted data is valid
**Validation Functions**:
```javascript
class DataValidator {
  static validateRequired(data, requiredFields) {
    const missing = [];
    requiredFields.forEach(field => {
      if (!data[field] || data[field] === '') {
        missing.push(field);
      }
    });
    return missing.length === 0 ? true : missing;
  }

  static validateNumber(value, min = null, max = null) {
    const num = parseInt(value);
    if (isNaN(num)) return false;
    if (min !== null && num < min) return false;
    if (max !== null && num > max) return false;
    return true;
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateDate(date) {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
  }

  static sanitizeString(str) {
    return str
      .replace(/[<>]/g, '') // Remove potential HTML
      .replace(/[&]/g, '&amp;') // Escape ampersands
      .trim();
  }
}
```

## Common Issues & Solutions

### Problem: Site blocks requests
**Solution**: Implement rotating user agents and delays
```javascript
// Add to RequestManager
rotateUserAgent() {
  this.userAgent = this.getRandomUserAgent();
}
```

### Problem: Data parsing fails due to site changes
**Solution**: Implement multiple parsing strategies
```javascript
// Add to HTMLParser
static parseWithFallback(element, selectors) {
  for (const selector of selectors) {
    const result = this.tryParse(element, selector);
    if (result !== null) return result;
  }
  return null;
}
```

### Problem: Session expires during scraping
**Solution**: Implement session refresh mechanism
```javascript
// Add to RequestManager
async refreshSession() {
  // Try to refresh session without full login
  const response = await this.makeRequest('/login', {
    method: 'POST',
    body: 'refresh=true'
  });
  
  return response.ok;
}
```

Last Updated: 2024-12-19
Created: Initial web scraping patterns documentation 