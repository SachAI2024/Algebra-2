# Logging Quick Reference

## Quick Commands (Browser Console)

### Toggle Logging
```javascript
LogConfig.enabled = false;          // Disable logging
LogConfig.enabled = true;           // Enable logging
```

### Change Log Level
```javascript
LogConfig.level = 'DEBUG';          // See everything
LogConfig.level = 'INFO';           // Normal (default)
LogConfig.level = 'WARN';           // Warnings and errors only
LogConfig.level = 'ERROR';          // Errors only
```

### Apply Profiles
```javascript
LogConfig.applyProfile('development');  // Verbose logging
LogConfig.applyProfile('production');   // Minimal logging
LogConfig.applyProfile('silent');       // No logging
LogConfig.applyProfile('debugAPI');     // Debug API issues
```

### View Logs
```javascript
logger.getRecentLogs(50);                    // Last 50 logs
logger.getLogsByModule('AIService', 100);    // Logs from specific module
logger.getLogsByLevel(logger.levels.ERROR);  // Error logs only
logger.getStats();                           // Log statistics
logger.exportLogs();                         // Download logs as JSON
```

### Clear Logs
```javascript
logger.clearLogs();                 // Clear all logs
```

### Module-Specific
```javascript
logger.setModuleLevel('AIService', 'DEBUG');     // Debug AI service
LogConfig.modules['RAGEngine'].enabled = false;  // Disable RAG logs
```

---

## Log Levels

| Level | Number | Use For |
|-------|--------|---------|
| `EMERGENCY` | 0 | System unusable |
| `ALERT` | 1 | Immediate action needed |
| `CRITICAL` | 2 | Critical failures |
| `ERROR` | 3 | Error conditions |
| `WARN` | 4 | Warning conditions |
| `NOTICE` | 5 | Important events |
| `INFO` | 6 | General info (default) |
| `DEBUG` | 7 | Detailed debug info |

---

## Usage in Code

### Basic Logging
```javascript
logger.debug('Module', 'Debug message', { data: value });
logger.info('Module', 'Info message', { data: value });
logger.warn('Module', 'Warning message', { data: value });
logger.error('Module', 'Error message', { error: err.message });
```

### Performance Tracking
```javascript
logger.perfStart('operationName');
// ... do work ...
logger.perfEnd('operationName', 'ModuleName');
```

### API Logging
```javascript
logger.logAPICall('Module', endpoint, 'POST', { data });
logger.logAPIResponse('Module', endpoint, status, duration);
```

### User Actions
```javascript
logger.logUserAction('Module', 'Button clicked', { buttonName });
```

---

## URL Parameters

```
?logProfile=development    # Development mode
?logProfile=production     # Production mode
?logProfile=silent         # Silent mode
?logProfile=debugAPI       # Debug API issues
```

---

## Configuration File

Edit `js/log-config.js`:

```javascript
LogConfig = {
  enabled: true,              // Master switch
  level: 'INFO',              // Global level
  console: true,              // Console output
  persist: true,              // localStorage
  maxLogSize: 1000,           // Max logs to keep

  modules: {
    'AIService': { enabled: true, level: 'INFO' },
    'RAGEngine': { enabled: true, level: 'INFO' }
  }
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No logs appearing | Check `LogConfig.enabled` and `LogConfig.level` |
| Too many logs | Set `LogConfig.level = 'WARN'` or `'ERROR'` |
| Module not logging | Check `LogConfig.modules['ModuleName'].enabled` |
| Performance impact | Use production profile or disable console/persist |
| Logs not persisting | Check `LogConfig.persist = true` |

---

## Performance Thresholds

Default thresholds (configurable in `log-config.js`):

```javascript
performanceThresholds: {
  apiCall: 5000,              // 5 seconds
  pdfProcessing: 10000,       // 10 seconds
  embeddingGeneration: 3000,  // 3 seconds
  questionGeneration: 5000,   // 5 seconds
  databaseOp: 2000            // 2 seconds
}
```

Operations exceeding thresholds trigger warnings.

---

## Module Names

- `AIService` - HuggingFace API calls
- `RAGEngine` - PDF processing & retrieval
- `SessionManager` - Learning sessions
- `PDFProcessor` - PDF extraction
- `FirebaseService` - Cloud storage
- `ClassicMode` - Guided lessons
- `QuizEngine` - Quiz system
- `Performance` - Performance tracking
- `UI` - User interface events

---

## Best Practices

✅ **DO:**
- Use appropriate log levels
- Include context with logs
- Use performance tracking
- Sanitize sensitive data
- Use profiles for environments

❌ **DON'T:**
- Log passwords or API keys
- Use INFO for everything
- Log in tight loops without rate limiting
- Leave DEBUG enabled in production
- Include personally identifiable information

---

## Examples

### Debug a Slow API Call
```javascript
// Enable API debugging
LogConfig.applyProfile('debugAPI');

// Watch console for:
// - API call timing
// - Retry attempts
// - Performance warnings

// Export logs when done
logger.exportLogs();
```

### Find Recent Errors
```javascript
// Get errors from last 100 logs
const errors = logger.getRecentLogs(100)
  .filter(log => log.level <= logger.levels.ERROR);

console.table(errors);
```

### Monitor Specific Module
```javascript
// Set specific module to DEBUG
logger.setModuleLevel('RAGEngine', 'DEBUG');

// Get logs from that module
const ragLogs = logger.getLogsByModule('RAGEngine', 50);
console.table(ragLogs);
```

### Production Setup
```javascript
// Minimal logging for production
LogConfig.applyProfile('production');

// Or manually configure
LogConfig.level = 'ERROR';
LogConfig.console = false;  // Don't clutter console
LogConfig.persist = true;   // But keep for debugging
```

---

## Integration

### HTML Files Updated
- ✅ `session.html` - Session/AI mode
- ✅ `upload.html` - PDF upload
- ✅ `lessons.html` - Classic mode

### JavaScript Modules with Logging
- ✅ `js/logger.js` - Core logger
- ✅ `js/log-config.js` - Configuration
- ✅ `js/logging-init.js` - Auto-instrumentation
- ✅ `js/ai-service.js` - Full logging
- ✅ `js/rag-engine.js` - Full logging

### Documentation
- 📖 `LOGGING_GUIDE.md` - Complete guide
- 📖 `LOGGING_QUICK_REFERENCE.md` - This file

---

For complete documentation, see **[LOGGING_GUIDE.md](./LOGGING_GUIDE.md)**
