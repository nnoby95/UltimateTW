# Dynamic Checking System

## Overview

The Smart Build Calculator now uses **dynamic checking intervals** instead of blind waiting. Instead of waiting for the full calculated time (e.g., 14.3 hours), the system checks the database periodically to catch early opportunities.

## How It Works

### Old Logic (Dangerous & Inefficient)
```
❌ Calculate wait time: 14.3 hours
❌ Wait full 14.3 hours
❌ Check again only after full wait
❌ Miss opportunities from other sources
```

### New Logic (Smart & Responsive)
```
✅ Calculate wait time: 14.3 hours
✅ Check database every 2 hours (7 checks during wait)
✅ Catch opportunities 12+ hours earlier
✅ Adapt check frequency based on wait duration
```

## Dynamic Check Intervals

| Wait Duration | Check Interval | Example |
|---------------|----------------|---------|
| < 1 hour | Every 30 minutes | 30min wait → check every 15min |
| 1-6 hours | Every hour | 4hr wait → check every 1hr |
| 6-24 hours | Every 2 hours | 12hr wait → check every 2hr |
| > 24 hours | Every 4 hours | 48hr wait → check every 4hr |

## Benefits

### 🎯 **Early Opportunity Catching**

- Market trades
- Village transfers
- External events

### 🛡️ **Server-Safe**
- Database reads are not tracked by server
- No rate limiting concerns
- Can check as frequently as needed

### ⚡ **Responsive**
- Much faster response to changing conditions
- No more blind waiting
- Intelligent adaptation to wait duration

### 🧠 **Smart Scaling**
- Short waits get frequent checks
- Long waits get proportional checks
- Avoids unnecessary spam

## Example Scenarios

### Scenario 1: Short Resource Wait (2 hours)
```
Old way: Wait 2 hours, then check
New way: Check every hour (2 checks during wait)
Result: Can catch opportunities 1 hour earlier
```

### Scenario 2: Long Resource Wait (14 hours)
```
Old way: Wait 14 hours, then check
New way: Check every 2 hours (7 checks during wait)
Result: Can catch opportunities 12+ hours earlier
```

### Scenario 3: Very Long Wait (48 hours)
```
Old way: Wait 48 hours, then check
New way: Check every 4 hours (12 checks during wait)
Result: Can catch opportunities 44+ hours earlier
```

## Implementation Details

### SmartBuildCalculator Changes
```javascript
// Old: Return full wait time
return {
    shouldBuild: false,
    reason: 'insufficient_resources_wood',
    nextCheck: resourceDecision.estimatedTime // Full 14.3 hours
};

// New: Return dynamic check time
return {
    shouldBuild: false,
    reason: 'insufficient_resources_wood',
    nextCheck: this.calculateDynamicCheckTime(resourceDecision.estimatedTime) // 2 hours
};
```

### Dynamic Check Time Calculation
```javascript
calculateDynamicCheckTime(estimatedTime) {
    const waitTime = estimatedTime - Date.now();
    
    if (waitTime <= 3600000) { // < 1 hour
        return Date.now() + Math.min(waitTime / 2, 1800000); // 30min max
    }
    
    if (waitTime <= 21600000) { // 1-6 hours
        return Date.now() + Math.min(waitTime / 3, 3600000); // 1hr max
    }
    
    if (waitTime <= 86400000) { // 6-24 hours
        return Date.now() + Math.min(waitTime / 4, 7200000); // 2hr max
    }
    
    return Date.now() + Math.min(waitTime / 6, 14400000); // 4hr max
}
```

## Console Output

The bot now provides detailed information about dynamic checking:

```
⏳ Smart decision: WAIT - insufficient_resources_wood
🔄 Next database check in: 120 minutes
⏰ Estimated completion time: 840 minutes
💡 Will check database periodically to catch early opportunities!
```

## Testing

Run the test script to see dynamic checking in action:

```javascript
// In browser console
loadScript('AutoBuild/test_dynamic_checking.js');
```

## Summary

The dynamic checking system transforms the AutoBuild bot from a blind waiter into an intelligent, responsive system that:

1. **Catches opportunities early** - Checks database periodically instead of waiting full time
2. **Adapts to wait duration** - Uses appropriate check intervals based on wait length
3. **Stays server-safe** - Database reads don't trigger rate limits
4. **Provides transparency** - Shows exactly when next check will happen
5. **Maximizes efficiency** - Balances responsiveness with resource usage

This makes the bot much more effective at catching building opportunities as soon as they become available, rather than waiting for the full calculated time. 