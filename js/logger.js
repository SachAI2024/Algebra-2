/**
 * Centralized Logging System for Algebra 2 Tutor
 * Provides Linux-style log levels with configurable output and persistence
 *
 * Log Levels (following syslog/Linux standards):
 * - DEBUG (7): Detailed debug information
 * - INFO (6): Informational messages
 * - NOTICE (5): Normal but significant conditions
 * - WARN (4): Warning conditions
 * - ERROR (3): Error conditions
 * - CRITICAL (2): Critical conditions
 * - ALERT (1): Action must be taken immediately
 * - EMERGENCY (0): System is unusable
 */

class Logger {
    constructor() {
        // Log levels following Linux/syslog conventions
        this.levels = {
            EMERGENCY: 0,
            ALERT: 1,
            CRITICAL: 2,
            ERROR: 3,
            WARN: 4,
            NOTICE: 5,
            INFO: 6,
            DEBUG: 7
        };

        // Level names for display
        this.levelNames = {
            0: 'EMERGENCY',
            1: 'ALERT',
            2: 'CRITICAL',
            3: 'ERROR',
            4: 'WARN',
            5: 'NOTICE',
            6: 'INFO',
            7: 'DEBUG'
        };

        // Console colors for different levels
        this.levelColors = {
            0: '#FF0000', // Red - EMERGENCY
            1: '#FF4500', // OrangeRed - ALERT
            2: '#FF6347', // Tomato - CRITICAL
            3: '#DC143C', // Crimson - ERROR
            4: '#FFA500', // Orange - WARN
            5: '#4169E1', // RoyalBlue - NOTICE
            6: '#32CD32', // LimeGreen - INFO
            7: '#808080'  // Gray - DEBUG
        };

        // Default configuration (will be overridden by LogConfig)
        this.config = {
            enabled: true,
            level: this.levels.INFO,
            console: true,
            persist: true,
            maxLogSize: 1000, // Max logs in localStorage
            includeTimestamp: true,
            includeStackTrace: true,
            modules: {} // Per-module overrides
        };

        // In-memory log buffer
        this.logBuffer = [];
        this.maxBufferSize = 100;

        // Storage key for persisted logs
        this.storageKey = 'a2tutor-logs';

        // Performance tracking
        this.perfMarks = new Map();
    }

    /**
     * Initialize logger with configuration
     * @param {Object} config - Configuration object from LogConfig
     */
    init(config) {
        this.config = { ...this.config, ...config };

        // Load persisted logs if enabled
        if (this.config.persist) {
            this._loadPersistedLogs();
        }

        this.info('Logger', 'Logger initialized', {
            level: this.levelNames[this.config.level],
            persist: this.config.persist,
            console: this.config.console
        });
    }

    /**
     * Check if a log level should be logged
     * @param {number} level - Log level to check
     * @param {string} module - Module name for per-module overrides
     * @returns {boolean}
     */
    _shouldLog(level, module) {
        if (!this.config.enabled) return false;

        // Check per-module override
        if (module && this.config.modules[module]) {
            const moduleConfig = this.config.modules[module];
            if (moduleConfig.enabled === false) return false;
            if (moduleConfig.level !== undefined) {
                return level <= moduleConfig.level;
            }
        }

        return level <= this.config.level;
    }

    /**
     * Core logging method
     * @param {number} level - Log level
     * @param {string} module - Module/component name
     * @param {string} message - Log message
     * @param {Object} context - Additional context data
     */
    _log(level, module, message, context = {}) {
        if (!this._shouldLog(level, module)) return;

        const timestamp = new Date().toISOString();
        const levelName = this.levelNames[level];

        const logEntry = {
            timestamp,
            level,
            levelName,
            module,
            message,
            context,
            ...(this.config.includeStackTrace && level <= this.levels.ERROR && {
                stack: new Error().stack
            })
        };

        // Add to buffer
        this._addToBuffer(logEntry);

        // Console output
        if (this.config.console) {
            this._consoleLog(logEntry);
        }

        // Persist to storage
        if (this.config.persist) {
            this._persistLog(logEntry);
        }

        // Call custom handlers if any
        this._callHandlers(logEntry);
    }

    /**
     * Add log entry to in-memory buffer
     */
    _addToBuffer(logEntry) {
        this.logBuffer.push(logEntry);
        if (this.logBuffer.length > this.maxBufferSize) {
            this.logBuffer.shift(); // Remove oldest
        }
    }

    /**
     * Output to console with formatting
     */
    _consoleLog(entry) {
        const { timestamp, levelName, module, message, context } = entry;
        const timeStr = this.config.includeTimestamp ? `[${timestamp}]` : '';
        const color = this.levelColors[entry.level];

        const prefix = `${timeStr} [${levelName}] [${module}]`;

        // Use appropriate console method
        const consoleMethod = this._getConsoleMethod(entry.level);

        if (Object.keys(context).length > 0) {
            console[consoleMethod](
                `%c${prefix}%c ${message}`,
                `color: ${color}; font-weight: bold`,
                'color: inherit',
                context
            );
        } else {
            console[consoleMethod](
                `%c${prefix}%c ${message}`,
                `color: ${color}; font-weight: bold`,
                'color: inherit'
            );
        }

        // Print stack trace for errors if available
        if (entry.stack && entry.level <= this.levels.ERROR) {
            console[consoleMethod]('Stack trace:', entry.stack);
        }
    }

    /**
     * Get appropriate console method for log level
     */
    _getConsoleMethod(level) {
        if (level <= this.levels.ERROR) return 'error';
        if (level === this.levels.WARN) return 'warn';
        if (level === this.levels.INFO || level === this.levels.NOTICE) return 'info';
        return 'log';
    }

    /**
     * Persist log to localStorage
     */
    _persistLog(entry) {
        try {
            const logs = this._getPersistedLogs();
            logs.push(entry);

            // Trim if exceeds max size
            if (logs.length > this.config.maxLogSize) {
                logs.splice(0, logs.length - this.config.maxLogSize);
            }

            localStorage.setItem(this.storageKey, JSON.stringify(logs));
        } catch (error) {
            console.error('Failed to persist log:', error);
        }
    }

    /**
     * Get persisted logs from localStorage
     */
    _getPersistedLogs() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load persisted logs:', error);
            return [];
        }
    }

    /**
     * Load persisted logs into buffer
     */
    _loadPersistedLogs() {
        const logs = this._getPersistedLogs();
        this.logBuffer = logs.slice(-this.maxBufferSize);
    }

    /**
     * Call custom log handlers
     */
    _callHandlers(entry) {
        if (this.config.handlers && Array.isArray(this.config.handlers)) {
            this.config.handlers.forEach(handler => {
                try {
                    handler(entry);
                } catch (error) {
                    console.error('Log handler error:', error);
                }
            });
        }
    }

    // Public logging methods

    debug(module, message, context) {
        this._log(this.levels.DEBUG, module, message, context);
    }

    info(module, message, context) {
        this._log(this.levels.INFO, module, message, context);
    }

    notice(module, message, context) {
        this._log(this.levels.NOTICE, module, message, context);
    }

    warn(module, message, context) {
        this._log(this.levels.WARN, module, message, context);
    }

    error(module, message, context) {
        this._log(this.levels.ERROR, module, message, context);
    }

    critical(module, message, context) {
        this._log(this.levels.CRITICAL, module, message, context);
    }

    alert(module, message, context) {
        this._log(this.levels.ALERT, module, message, context);
    }

    emergency(module, message, context) {
        this._log(this.levels.EMERGENCY, module, message, context);
    }

    /**
     * Performance tracking - start timer
     * @param {string} label - Performance mark label
     */
    perfStart(label) {
        this.perfMarks.set(label, performance.now());
        this.debug('Performance', `Started: ${label}`);
    }

    /**
     * Performance tracking - end timer and log duration
     * @param {string} label - Performance mark label
     * @param {string} module - Module name
     */
    perfEnd(label, module = 'Performance') {
        const startTime = this.perfMarks.get(label);
        if (!startTime) {
            this.warn('Performance', `No start mark found for: ${label}`);
            return;
        }

        const duration = performance.now() - startTime;
        this.perfMarks.delete(label);

        this.info(module, `Performance: ${label}`, {
            duration: `${duration.toFixed(2)}ms`
        });

        return duration;
    }

    /**
     * Log API call
     */
    logAPICall(module, endpoint, method = 'GET', context = {}) {
        this.info(module, `API Call: ${method} ${endpoint}`, context);
    }

    /**
     * Log API response
     */
    logAPIResponse(module, endpoint, statusCode, duration, context = {}) {
        const level = statusCode >= 400 ? this.levels.ERROR : this.levels.INFO;
        this._log(level, module, `API Response: ${endpoint}`, {
            statusCode,
            duration: `${duration}ms`,
            ...context
        });
    }

    /**
     * Log user action
     */
    logUserAction(module, action, context = {}) {
        this.info(module, `User Action: ${action}`, context);
    }

    /**
     * Log state change
     */
    logStateChange(module, from, to, context = {}) {
        this.debug(module, `State Change: ${from} → ${to}`, context);
    }

    /**
     * Get recent logs
     * @param {number} count - Number of logs to retrieve
     * @param {number} minLevel - Minimum log level to include
     */
    getRecentLogs(count = 50, minLevel = this.levels.DEBUG) {
        return this.logBuffer
            .filter(log => log.level <= minLevel)
            .slice(-count);
    }

    /**
     * Get logs by module
     */
    getLogsByModule(module, count = 50) {
        return this.logBuffer
            .filter(log => log.module === module)
            .slice(-count);
    }

    /**
     * Get logs by level
     */
    getLogsByLevel(level, count = 50) {
        return this.logBuffer
            .filter(log => log.level === level)
            .slice(-count);
    }

    /**
     * Export logs as JSON
     */
    exportLogs() {
        const logs = this._getPersistedLogs();
        const dataStr = JSON.stringify(logs, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `a2tutor-logs-${new Date().toISOString()}.json`;
        link.click();

        URL.revokeObjectURL(url);
        this.info('Logger', 'Logs exported');
    }

    /**
     * Clear all logs
     */
    clearLogs() {
        this.logBuffer = [];
        localStorage.removeItem(this.storageKey);
        this.info('Logger', 'All logs cleared');
    }

    /**
     * Get log statistics
     */
    getStats() {
        const logs = this.logBuffer;
        const stats = {
            total: logs.length,
            byLevel: {},
            byModule: {},
            oldestLog: logs[0]?.timestamp,
            newestLog: logs[logs.length - 1]?.timestamp
        };

        logs.forEach(log => {
            // Count by level
            const levelName = log.levelName;
            stats.byLevel[levelName] = (stats.byLevel[levelName] || 0) + 1;

            // Count by module
            stats.byModule[log.module] = (stats.byModule[log.module] || 0) + 1;
        });

        return stats;
    }

    /**
     * Update configuration at runtime
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.info('Logger', 'Configuration updated', newConfig);
    }

    /**
     * Enable/disable logging
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
        this.info('Logger', `Logging ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Set log level
     */
    setLevel(level) {
        if (typeof level === 'string') {
            level = this.levels[level.toUpperCase()];
        }
        this.config.level = level;
        this.info('Logger', `Log level set to ${this.levelNames[level]}`);
    }

    /**
     * Set module-specific log level
     */
    setModuleLevel(module, level) {
        if (typeof level === 'string') {
            level = this.levels[level.toUpperCase()];
        }
        if (!this.config.modules) {
            this.config.modules = {};
        }
        this.config.modules[module] = { level };
        this.info('Logger', `Module ${module} log level set to ${this.levelNames[level]}`);
    }
}

// Create singleton instance
const logger = new Logger();

// Make it globally available
if (typeof window !== 'undefined') {
    window.logger = logger;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = logger;
}
