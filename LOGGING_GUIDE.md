# Logging System Documentation

## Overview

The Algebra 2 Tutor application now includes a comprehensive logging system with Linux-style log levels, configurable output, and performance tracking. This guide explains how to use, configure, and troubleshoot the logging system.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Log Levels](#log-levels)
3. [Configuration](#configuration)
4. [Usage Examples](#usage-examples)
5. [Viewing Logs](#viewing-logs)
6. [Performance Monitoring](#performance-monitoring)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Features](#advanced-features)

---

## Quick Start

### Enabling/Disabling Logging

The logging system is enabled by default. To toggle it:

```javascript
// Disable all logging
LogConfig.enabled = false;

// Re-enable logging
LogConfig.enabled = true;
```

### Changing Log Level

```javascript
// Set to DEBUG for maximum verbosity
LogConfig.level = 'DEBUG';  // or logger.levels.DEBUG

// Set to ERROR for errors only
LogConfig.level = 'ERROR';

// Set to INFO (recommended for production)
LogConfig.level = 'INFO';
```

### Quick Profile Switch

```javascript
// Development mode (verbose)
LogConfig.applyProfile('development');

// Production mode (errors only)
LogConfig.applyProfile('production');

// Silent mode (no logging)
LogConfig.applyProfile('silent');

// Debug API issues
LogConfig.applyProfile('debugAPI');
```

---

## Log Levels

The logging system uses Linux/syslog-style log levels:

| Level | Number | Description | Use Case |
|-------|--------|-------------|----------|
| `EMERGENCY` | 0 | System is unusable | Critical failures, data loss |
| `ALERT` | 1 | Action must be taken immediately | Immediate attention required |
| `CRITICAL` | 2 | Critical conditions | Critical component failures |
| `ERROR` | 3 | Error conditions | Recoverable errors, failed operations |
| `WARN` | 4 | Warning conditions | Potential issues, deprecated usage |
| `NOTICE` | 5 | Normal but significant | Important state changes |
| `INFO` | 6 | Informational messages | General information, status updates |
| `DEBUG` | 7 | Detailed debug information | Debugging, development |

### When to Use Each Level

**EMERGENCY/ALERT/CRITICAL** (0-2): Reserved for catastrophic failures
- Database corruption
- Security breaches
- Total system failure

**ERROR** (3): Operation failures that need attention
```javascript
logger.error('AIService', 'API call failed after all retries', {
  endpoint: '/generate-question',
  attempts: 3,
  error: error.message
});
```

**WARN** (4): Something unexpected but recoverable
```javascript
logger.warn('RAGEngine', 'No chunks found for module', {
  moduleId,
  fallbackUsed: true
});
```

**NOTICE** (5): Important status changes
```javascript
logger.notice('SessionManager', 'Session started successfully', {
  sessionId: session.id,
  moduleId: 'algebra-1'
});
```

**INFO** (6): General operational information
```javascript
logger.info('AIService', 'Question generated', {
  topic: 'polynomials',
  difficulty: 3
});
```

**DEBUG** (7): Detailed debugging information
```javascript
logger.debug('RAGEngine', 'Chunk similarity scores calculated', {
  topScore: 0.87,
  matchCount: 3
});
```

---

## Configuration

### Global Configuration File

Edit `js/log-config.js` to change default settings:

```javascript
const LogConfig = {
  enabled: true,              // Master switch
  level: 'INFO',              // Global log level
  console: true,              // Output to browser console
  persist: true,              // Save logs to localStorage
  maxLogSize: 1000,           // Max logs to persist
  includeTimestamp: true,     // Add timestamps
  includeStackTrace: true,    // Include stack traces for errors

  // Module-specific settings
  modules: {
    'AIService': {
      enabled: true,
      level: 'INFO'
    },
    'RAGEngine': {
      enabled: true,
      level: 'INFO'
    }
    // ... more modules
  },

  // Feature flags
  features: {
    logAPICalls: true,
    logPerformance: true,
    logUserActions: true,
    logStateChanges: true
  }
};
```

### Runtime Configuration

Change settings at runtime via browser console:

```javascript
// Change global log level
logger.setLevel('DEBUG');

// Change module-specific level
logger.setModuleLevel('AIService', 'DEBUG');
logger.setModuleLevel('RAGEngine', 'WARN');

// Enable/disable logging
logger.setEnabled(false);  // Disable
logger.setEnabled(true);   // Enable

// Update configuration
logger.updateConfig({
  level: logger.levels.DEBUG,
  console: true,
  persist: false
});
```

### URL Parameter Override

Override log settings via URL:

```
# Load with development profile
https://your-app.com/session.html?logProfile=development

# Load with production profile
https://your-app.com/session.html?logProfile=production

# Load in silent mode
https://your-app.com/session.html?logProfile=silent
```

---

## Usage Examples

### Basic Logging

```javascript
// In your module
class MyModule {
  constructor() {
    this.moduleName = 'MyModule';
    logger.info(this.moduleName, 'Module initialized');
  }

  async processData(data) {
    logger.debug(this.moduleName, 'Processing data', {
      dataSize: data.length,
      type: typeof data
    });

    try {
      const result = await someAsyncOperation(data);

      logger.info(this.moduleName, 'Data processed successfully', {
        resultSize: result.length
      });

      return result;
    } catch (error) {
      logger.error(this.moduleName, 'Data processing failed', {
        error: error.message,
        dataSize: data.length
      });
      throw error;
    }
  }
}
```

### API Call Logging

```javascript
async function callAPI(endpoint, payload) {
  const startTime = performance.now();

  // Log API call
  logger.logAPICall('MyService', endpoint, 'POST', {
    payloadSize: JSON.stringify(payload).length
  });

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const duration = performance.now() - startTime;

    // Log API response
    logger.logAPIResponse('MyService', endpoint, response.status, duration, {
      success: true
    });

    return await response.json();
  } catch (error) {
    const duration = performance.now() - startTime;

    logger.logAPIResponse('MyService', endpoint, 0, duration, {
      error: error.message
    });

    throw error;
  }
}
```

### Performance Tracking

```javascript
async function processLargeFile(file) {
  // Start performance tracking
  logger.perfStart('processLargeFile');

  const result = await heavyProcessing(file);

  // End tracking and log duration
  const duration = logger.perfEnd('processLargeFile', 'FileProcessor');

  // Duration is automatically logged
  // Returns duration in milliseconds

  return result;
}
```

### User Action Logging

```javascript
function handleButtonClick(buttonName) {
  logger.logUserAction('UI', 'Button clicked', {
    buttonName,
    timestamp: Date.now()
  });

  // Handle the click
  performAction();
}
```

### State Change Logging

```javascript
function updateState(newState) {
  const oldState = this.currentState;
  this.currentState = newState;

  logger.logStateChange('StateMachine', oldState, newState, {
    reason: 'User input',
    timestamp: Date.now()
  });
}
```

---

## Viewing Logs

### Browser Console

Logs are automatically displayed in the browser console with color coding:

- 🔴 **Red**: EMERGENCY, ALERT, CRITICAL, ERROR
- 🟠 **Orange**: WARN
- 🔵 **Blue**: NOTICE
- 🟢 **Green**: INFO
- ⚪ **Gray**: DEBUG

### Retrieving Logs Programmatically

```javascript
// Get last 50 logs
const recentLogs = logger.getRecentLogs(50);

// Get logs by module
const aiLogs = logger.getLogsByModule('AIService', 100);

// Get error logs only
const errors = logger.getLogsByLevel(logger.levels.ERROR, 50);

// Get log statistics
const stats = logger.getStats();
console.log('Total logs:', stats.total);
console.log('By level:', stats.byLevel);
console.log('By module:', stats.byModule);
```

### Exporting Logs

```javascript
// Export logs as JSON file (downloads automatically)
logger.exportLogs();

// Get logs as JSON string
const logsJSON = JSON.stringify(logger.getRecentLogs(1000), null, 2);

// Copy to clipboard
navigator.clipboard.writeText(logsJSON);
```

### Clearing Logs

```javascript
// Clear all logs (both memory and localStorage)
logger.clearLogs();
```

---

## Performance Monitoring

### Automatic Performance Warnings

The system automatically warns when operations exceed thresholds:

```javascript
// Configured in log-config.js
performanceThresholds: {
  apiCall: 5000,              // 5 seconds
  pdfProcessing: 10000,       // 10 seconds
  embeddingGeneration: 3000,  // 3 seconds
  questionGeneration: 5000,   // 5 seconds
  databaseOp: 2000            // 2 seconds
}
```

When an operation exceeds the threshold:

```
⚠️ [WARN] [AIService] API call exceeded performance threshold
{
  duration: "7432.50ms",
  threshold: "5000ms",
  endpoint: "/generate-question"
}
```

### Custom Performance Tracking

```javascript
// Track any operation
logger.perfStart('myOperation');

await doSomething();

const duration = logger.perfEnd('myOperation', 'MyModule');
console.log(`Operation took ${duration}ms`);
```

---

## Troubleshooting

### Issue: Logs Not Appearing

**Check 1**: Is logging enabled?
```javascript
console.log('Logging enabled:', LogConfig.enabled);
```

**Check 2**: Is the log level too restrictive?
```javascript
console.log('Current log level:', LogConfig.level);
// If set to ERROR, you won't see INFO or DEBUG logs
LogConfig.level = 'DEBUG';  // See everything
```

**Check 3**: Is the module enabled?
```javascript
console.log('Module config:', LogConfig.modules['AIService']);
```

### Issue: Too Many Logs

**Solution 1**: Increase log level
```javascript
LogConfig.level = 'WARN';  // Only warnings and errors
```

**Solution 2**: Disable noisy modules
```javascript
LogConfig.modules['UI'] = { enabled: false };
LogConfig.modules['MathCore'] = { enabled: false };
```

**Solution 3**: Use a production profile
```javascript
LogConfig.applyProfile('production');
```

### Issue: Logs Not Persisting

**Check**: Is persistence enabled?
```javascript
console.log('Persist enabled:', LogConfig.persist);
```

**Fix**: Enable persistence
```javascript
LogConfig.persist = true;
logger.init(LogConfig);
```

**Check**: localStorage quota
```javascript
// Check localStorage size
let total = 0;
for (let key in localStorage) {
  total += localStorage[key].length;
}
console.log('localStorage used:', (total / 1024).toFixed(2), 'KB');
```

### Issue: Performance Impact

Logging can impact performance. To minimize:

```javascript
// Use production profile
LogConfig.applyProfile('production');

// Disable console output (fastest)
LogConfig.console = false;

// Disable persistence
LogConfig.persist = false;

// Disable performance logging
LogConfig.features.logPerformance = false;

// Set level to ERROR only
LogConfig.level = 'ERROR';
```

---

## Advanced Features

### Custom Log Handlers

Add custom handlers to send logs to external services:

```javascript
// Add a handler to send errors to an analytics service
LogConfig.handlers.push((logEntry) => {
  if (logEntry.level <= logger.levels.ERROR) {
    // Send to error tracking service (e.g., Sentry)
    sendToErrorTracker({
      message: logEntry.message,
      level: logEntry.levelName,
      module: logEntry.module,
      context: logEntry.context,
      timestamp: logEntry.timestamp
    });
  }
});

// Reinitialize logger
logger.init(LogConfig);
```

### Per-Module Configuration

Fine-tune logging for specific modules:

```javascript
// Verbose logging for AI components
LogConfig.modules['AIService'] = {
  enabled: true,
  level: 'DEBUG'
};

LogConfig.modules['RAGEngine'] = {
  enabled: true,
  level: 'DEBUG'
};

// Minimal logging for UI
LogConfig.modules['UI'] = {
  enabled: true,
  level: 'WARN'
};

// Disable logging for utilities
LogConfig.modules['MathCore'] = {
  enabled: false
};

logger.init(LogConfig);
```

### Configuration Import/Export

```javascript
// Export current configuration
const configJSON = LogConfig.export();
console.log(configJSON);

// Save to file or share
// ...

// Import configuration
const savedConfig = '{"enabled":true,"level":"DEBUG",...}';
LogConfig.import(savedConfig);
```

### Filtering Logs

```javascript
// Get only errors from the last hour
const recentErrors = logger.getLogsByLevel(logger.levels.ERROR)
  .filter(log => {
    const logTime = new Date(log.timestamp);
    const hourAgo = new Date(Date.now() - 3600000);
    return logTime > hourAgo;
  });

// Get logs matching specific criteria
const apiFailures = logger.getRecentLogs(1000)
  .filter(log =>
    log.module === 'AIService' &&
    log.message.includes('API') &&
    log.level <= logger.levels.ERROR
  );
```

---

## Best Practices

### 1. Use Appropriate Log Levels

```javascript
// ❌ Bad: Everything is INFO
logger.info('MyModule', 'Variable x is 5');
logger.info('MyModule', 'Starting loop');
logger.info('MyModule', 'Critical database error!');

// ✅ Good: Appropriate levels
logger.debug('MyModule', 'Variable x is 5', { x: 5 });
logger.debug('MyModule', 'Starting loop iteration', { i: 0 });
logger.error('MyModule', 'Database connection failed', {
  error: error.message,
  retries: 3
});
```

### 2. Include Context

```javascript
// ❌ Bad: No context
logger.error('MyModule', 'Operation failed');

// ✅ Good: Rich context
logger.error('MyModule', 'Operation failed', {
  operation: 'processData',
  input: data.substring(0, 100),
  error: error.message,
  timestamp: Date.now(),
  userId: currentUser.id
});
```

### 3. Use Performance Tracking

```javascript
// ❌ Bad: Manual timing
const start = Date.now();
await processData();
console.log('Took:', Date.now() - start, 'ms');

// ✅ Good: Built-in performance tracking
logger.perfStart('processData');
await processData();
logger.perfEnd('processData', 'MyModule');
// Automatically logs with proper formatting and threshold warnings
```

### 4. Don't Log Sensitive Data

```javascript
// ❌ Bad: Logging sensitive data
logger.info('Auth', 'User logged in', {
  username: user.username,
  password: user.password,  // Never log passwords!
  apiKey: user.apiKey       // Never log API keys!
});

// ✅ Good: Sanitized logging
logger.info('Auth', 'User logged in', {
  username: user.username,
  passwordLength: user.password.length,  // Log length, not value
  hasApiKey: !!user.apiKey              // Log presence, not value
});
```

### 5. Use Profiles for Different Environments

```javascript
// Development
if (window.location.hostname === 'localhost') {
  LogConfig.applyProfile('development');
}

// Production
if (window.location.hostname === 'yourdomain.com') {
  LogConfig.applyProfile('production');
}

// Testing
if (window.location.search.includes('test=1')) {
  LogConfig.applyProfile('testing');
}
```

---

## Module Reference

### Modules with Logging

| Module | Default Level | Key Operations Logged |
|--------|---------------|----------------------|
| `AIService` | INFO | API calls, embeddings, question generation |
| `RAGEngine` | INFO | PDF processing, chunk retrieval, similarity search |
| `SessionManager` | INFO | Session lifecycle, answer evaluation, adaptation |
| `PDFProcessor` | INFO | PDF extraction, chunking, image processing |
| `FirebaseService` | INFO | Upload/download, storage operations, fallbacks |
| `ClassicMode` | NOTICE | Module navigation, step completion |
| `QuizEngine` | NOTICE | Quiz starts, submissions, scoring |
| `Performance` | INFO | Timing metrics, threshold warnings |
| `UI` | DEBUG (disabled) | User interactions, state changes |

---

## Support

### Getting Help

1. **Check the console**: Most logging issues are visible in the browser console
2. **Enable DEBUG mode**: `LogConfig.level = 'DEBUG'` for maximum visibility
3. **Export logs**: `logger.exportLogs()` to share logs for debugging
4. **Check configuration**: `console.log(LogConfig)` to see current settings

### Reporting Issues

When reporting logging-related issues, include:

1. Browser and version
2. Log configuration (`LogConfig.export()`)
3. Recent logs (`logger.getRecentLogs(50)`)
4. Steps to reproduce
5. Expected vs actual behavior

---

## Changelog

### Version 1.0.0 (2025-10)

- Initial release
- Linux-style log levels (EMERGENCY to DEBUG)
- Configurable output (console, localStorage)
- Per-module configuration
- Performance tracking
- URL parameter overrides
- Configuration profiles
- Log export/import
- Custom handlers
- Automatic instrumentation

---

## License

This logging system is part of the Algebra 2 Tutor project and is available under the same license.
