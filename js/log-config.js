/**
 * Logging Configuration for Algebra 2 Tutor
 *
 * This file contains the centralized configuration for the logging system.
 * Modify these settings to control logging behavior across the application.
 */

const LogConfig = {
    // ============================================================================
    // GLOBAL SETTINGS
    // ============================================================================

    /**
     * Master switch for all logging
     * Set to false to completely disable logging system-wide
     */
    enabled: true,

    /**
     * Global log level (following Linux/syslog conventions)
     * Only logs at or below this level will be recorded
     *
     * Levels:
     * - EMERGENCY (0): System is unusable
     * - ALERT (1): Action must be taken immediately
     * - CRITICAL (2): Critical conditions
     * - ERROR (3): Error conditions
     * - WARN (4): Warning conditions
     * - NOTICE (5): Normal but significant conditions
     * - INFO (6): Informational messages
     * - DEBUG (7): Detailed debug information
     *
     * Recommended settings:
     * - Production: INFO (6) or WARN (4)
     * - Development: DEBUG (7)
     * - Testing: INFO (6)
     */
    level: 'INFO', // Can be string name or numeric level

    // ============================================================================
    // OUTPUT SETTINGS
    // ============================================================================

    /**
     * Enable console output
     * Logs will be printed to browser console with color coding
     */
    console: true,

    /**
     * Enable persistence to localStorage
     * Logs will be saved and available across sessions
     */
    persist: true,

    /**
     * Maximum number of logs to persist in localStorage
     * Older logs are automatically removed when limit is reached
     */
    maxLogSize: 1000,

    /**
     * Include timestamp in log entries
     */
    includeTimestamp: true,

    /**
     * Include stack traces for ERROR and above
     * Helpful for debugging but increases log size
     */
    includeStackTrace: true,

    // ============================================================================
    // MODULE-SPECIFIC SETTINGS
    // ============================================================================

    /**
     * Per-module logging configuration
     * Override global settings for specific modules
     *
     * Example:
     * modules: {
     *   'AIService': { enabled: true, level: 'DEBUG' },
     *   'RAGEngine': { enabled: true, level: 'INFO' },
     *   'SomeQuietModule': { enabled: false }
     * }
     */
    modules: {
        // Core AI/ML Services (detailed logging for debugging API issues)
        'AIService': {
            enabled: true,
            level: 'INFO' // Use DEBUG for detailed API debugging
        },

        'RAGEngine': {
            enabled: true,
            level: 'INFO' // Use DEBUG for embedding/retrieval debugging
        },

        'SessionManager': {
            enabled: true,
            level: 'INFO' // Use DEBUG for adaptation algorithm debugging
        },

        'PDFProcessor': {
            enabled: true,
            level: 'INFO' // Use DEBUG for chunking/extraction issues
        },

        'FirebaseService': {
            enabled: true,
            level: 'INFO' // Use DEBUG for storage operation debugging
        },

        // Classic Mode Modules (less verbose by default)
        'ClassicMode': {
            enabled: true,
            level: 'NOTICE'
        },

        'QuizEngine': {
            enabled: true,
            level: 'NOTICE'
        },

        'LessonManager': {
            enabled: true,
            level: 'NOTICE'
        },

        // Core Utilities (minimal logging)
        'MathCore': {
            enabled: true,
            level: 'WARN'
        },

        // Performance monitoring
        'Performance': {
            enabled: true,
            level: 'INFO'
        },

        // UI/UX events (can be noisy)
        'UI': {
            enabled: false, // Enable only when debugging UI issues
            level: 'DEBUG'
        }
    },

    // ============================================================================
    // FEATURE FLAGS
    // ============================================================================

    /**
     * Feature-specific logging toggles
     */
    features: {
        // Log all API calls to external services
        logAPICalls: true,

        // Log performance metrics (timing, latency)
        logPerformance: true,

        // Log user actions and interactions
        logUserActions: true,

        // Log state changes and transitions
        logStateChanges: true,

        // Log data processing operations
        logDataProcessing: true,

        // Log storage operations (read/write/delete)
        logStorageOps: true,

        // Log errors and exceptions
        logErrors: true,

        // Log analytics and metrics
        logAnalytics: true
    },

    // ============================================================================
    // PERFORMANCE SETTINGS
    // ============================================================================

    /**
     * Performance logging thresholds
     * Log warnings when operations exceed these times (in milliseconds)
     */
    performanceThresholds: {
        // API call duration warning threshold
        apiCall: 5000, // 5 seconds

        // PDF processing warning threshold
        pdfProcessing: 10000, // 10 seconds

        // Embedding generation warning threshold
        embeddingGeneration: 3000, // 3 seconds

        // Question generation warning threshold
        questionGeneration: 5000, // 5 seconds

        // Database operation warning threshold
        databaseOp: 2000 // 2 seconds
    },

    // ============================================================================
    // CUSTOM HANDLERS
    // ============================================================================

    /**
     * Custom log handlers
     * Array of functions that will be called for each log entry
     *
     * Example:
     * handlers: [
     *   (logEntry) => {
     *     if (logEntry.level <= logger.levels.ERROR) {
     *       // Send to error tracking service
     *       sendToSentry(logEntry);
     *     }
     *   }
     * ]
     */
    handlers: [
        // Example: Send critical errors to Firebase (if configured)
        (logEntry) => {
            if (logEntry.level <= 2 && window.firebaseService && window.firebaseService.isConfigured()) {
                // Only log critical errors (level 2 and below)
                try {
                    window.firebaseService.logError({
                        timestamp: logEntry.timestamp,
                        level: logEntry.levelName,
                        module: logEntry.module,
                        message: logEntry.message,
                        context: logEntry.context
                    });
                } catch (error) {
                    console.error('Failed to send error to Firebase:', error);
                }
            }
        }
    ],

    // ============================================================================
    // DEVELOPMENT/PRODUCTION PROFILES
    // ============================================================================

    /**
     * Pre-defined configuration profiles
     * Use these to quickly switch between common configurations
     */
    profiles: {
        // Development profile: verbose logging everywhere
        development: {
            enabled: true,
            level: 'DEBUG',
            console: true,
            persist: true,
            modules: {
                'AIService': { level: 'DEBUG' },
                'RAGEngine': { level: 'DEBUG' },
                'SessionManager': { level: 'DEBUG' },
                'PDFProcessor': { level: 'DEBUG' },
                'FirebaseService': { level: 'DEBUG' },
                'UI': { enabled: true, level: 'DEBUG' }
            }
        },

        // Production profile: minimal logging, errors only
        production: {
            enabled: true,
            level: 'WARN',
            console: false,
            persist: true,
            maxLogSize: 500,
            modules: {
                'AIService': { level: 'ERROR' },
                'RAGEngine': { level: 'ERROR' },
                'SessionManager': { level: 'ERROR' },
                'PDFProcessor': { level: 'ERROR' },
                'FirebaseService': { level: 'ERROR' },
                'UI': { enabled: false }
            }
        },

        // Testing profile: balanced logging
        testing: {
            enabled: true,
            level: 'INFO',
            console: true,
            persist: true,
            modules: {
                'AIService': { level: 'INFO' },
                'RAGEngine': { level: 'INFO' },
                'SessionManager': { level: 'INFO' },
                'PDFProcessor': { level: 'INFO' },
                'FirebaseService': { level: 'INFO' }
            }
        },

        // Debug API issues profile
        debugAPI: {
            enabled: true,
            level: 'DEBUG',
            console: true,
            modules: {
                'AIService': { level: 'DEBUG' },
                'FirebaseService': { level: 'DEBUG' },
                'Performance': { level: 'DEBUG' }
            }
        },

        // Silent mode: no logging
        silent: {
            enabled: false,
            console: false,
            persist: false
        }
    }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Apply a configuration profile
 * @param {string} profileName - Name of profile to apply
 */
LogConfig.applyProfile = function(profileName) {
    const profile = this.profiles[profileName];
    if (!profile) {
        console.error(`Unknown profile: ${profileName}`);
        return;
    }

    // Deep merge profile into current config
    Object.assign(this, profile);

    // Reinitialize logger if it exists
    if (window.logger) {
        window.logger.init(this);
        window.logger.notice('LogConfig', `Applied profile: ${profileName}`);
    }
};

/**
 * Get current active profile name (best match)
 */
LogConfig.getActiveProfile = function() {
    const profiles = Object.keys(this.profiles);
    for (const profileName of profiles) {
        const profile = this.profiles[profileName];
        if (JSON.stringify(this.level) === JSON.stringify(profile.level) &&
            this.console === profile.console) {
            return profileName;
        }
    }
    return 'custom';
};

/**
 * Enable/disable specific feature logging
 */
LogConfig.setFeature = function(featureName, enabled) {
    if (this.features.hasOwnProperty(featureName)) {
        this.features[featureName] = enabled;
        if (window.logger) {
            window.logger.notice('LogConfig', `Feature ${featureName} ${enabled ? 'enabled' : 'disabled'}`);
        }
    }
};

/**
 * Set module log level
 */
LogConfig.setModuleLevel = function(moduleName, level) {
    if (!this.modules[moduleName]) {
        this.modules[moduleName] = {};
    }
    this.modules[moduleName].level = level;

    if (window.logger) {
        window.logger.setModuleLevel(moduleName, level);
    }
};

/**
 * Enable/disable module logging
 */
LogConfig.setModuleEnabled = function(moduleName, enabled) {
    if (!this.modules[moduleName]) {
        this.modules[moduleName] = {};
    }
    this.modules[moduleName].enabled = enabled;

    if (window.logger) {
        window.logger.notice('LogConfig', `Module ${moduleName} ${enabled ? 'enabled' : 'disabled'}`);
        window.logger.init(this);
    }
};

/**
 * Reset to default configuration
 */
LogConfig.reset = function() {
    this.applyProfile('testing'); // Default to testing profile
};

/**
 * Export current configuration
 */
LogConfig.export = function() {
    const config = {
        enabled: this.enabled,
        level: this.level,
        console: this.console,
        persist: this.persist,
        maxLogSize: this.maxLogSize,
        includeTimestamp: this.includeTimestamp,
        includeStackTrace: this.includeStackTrace,
        modules: this.modules,
        features: this.features
    };
    return JSON.stringify(config, null, 2);
};

/**
 * Import configuration from JSON
 */
LogConfig.import = function(configJSON) {
    try {
        const config = JSON.parse(configJSON);
        Object.assign(this, config);
        if (window.logger) {
            window.logger.init(this);
            window.logger.notice('LogConfig', 'Configuration imported');
        }
    } catch (error) {
        console.error('Failed to import configuration:', error);
    }
};

// ============================================================================
// AUTO-INITIALIZATION
// ============================================================================

// Detect environment and apply appropriate profile
(function autoConfig() {
    // Check if we're in development (localhost or file://)
    const isDev = window.location.hostname === 'localhost' ||
                  window.location.hostname === '127.0.0.1' ||
                  window.location.protocol === 'file:';

    // Check URL parameters for profile override
    const urlParams = new URLSearchParams(window.location.search);
    const profileParam = urlParams.get('logProfile');

    if (profileParam && LogConfig.profiles[profileParam]) {
        LogConfig.applyProfile(profileParam);
    } else if (isDev) {
        // Development environment
        LogConfig.applyProfile('development');
    } else {
        // Production environment (GitHub Pages)
        // Use default configuration (which is already set to reasonable values)
    }

    // Initialize logger when it becomes available
    if (window.logger) {
        window.logger.init(LogConfig);
    } else {
        // Wait for logger to load
        window.addEventListener('load', () => {
            if (window.logger) {
                window.logger.init(LogConfig);
            }
        });
    }
})();

// Make globally available
if (typeof window !== 'undefined') {
    window.LogConfig = LogConfig;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LogConfig;
}
