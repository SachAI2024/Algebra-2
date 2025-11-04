/**
 * Logging Initialization and Instrumentation
 *
 * This script automatically adds logging to key modules that weren't fully instrumented.
 * It wraps critical functions with logging calls.
 */

(function() {
  'use strict';

  // Wait for DOM and logger to be ready
  function initializeLogging() {
    if (!window.logger) {
      console.warn('Logger not available, retrying...');
      setTimeout(initializeLogging, 100);
      return;
    }

    logger.info('LoggingInit', 'Initializing logging system for all modules');

    // SessionManager logging
    if (window.SessionManager) {
      instrumentSessionManager();
    } else if (window.sessionManager) {
      instrumentSessionManagerInstance();
    }

    // PDFProcessor logging
    if (window.PDFProcessor) {
      instrumentPDFProcessor();
    } else if (window.pdfProcessor) {
      instrumentPDFProcessorInstance();
    }

    // FirebaseService logging
    if (window.FirebaseService) {
      instrumentFirebaseService();
    } else if (window.firebaseService) {
      instrumentFirebaseServiceInstance();
    }

    // Classic Mode logging
    instrumentClassicMode();

    // Quiz Engine logging
    instrumentQuizEngine();

    logger.notice('LoggingInit', 'Logging system initialization completed');
  }

  function instrumentSessionManager() {
    logger.debug('LoggingInit', 'Instrumenting SessionManager class');

    const originalSessionManager = window.SessionManager;

    window.SessionManager = class extends originalSessionManager {
      constructor() {
        super();
        this.moduleName = 'SessionManager';
        logger.info(this.moduleName, 'SessionManager instance created');
      }

      async startSession(moduleId, timeLimit = 10, config = {}) {
        logger.perfStart('session-start');
        logger.notice(this.moduleName, 'Starting new session', {
          moduleId,
          timeLimit: `${timeLimit} minutes`,
          config
        });

        try {
          const result = await super.startSession(moduleId, timeLimit, config);
          logger.perfEnd('session-start', this.moduleName);
          logger.notice(this.moduleName, 'Session started successfully', {
            sessionId: this.currentSession?.id,
            moduleId
          });
          return result;
        } catch (error) {
          logger.error(this.moduleName, 'Failed to start session', {
            moduleId,
            error: error.message
          });
          throw error;
        }
      }

      async getNextQuestion() {
        logger.debug(this.moduleName, 'Getting next question');

        try {
          const question = await super.getNextQuestion();
          logger.info(this.moduleName, 'Next question retrieved', {
            questionNumber: this.currentSession?.questionNumber,
            difficulty: this.currentSession?.currentDifficulty
          });
          return question;
        } catch (error) {
          logger.error(this.moduleName, 'Failed to get next question', {
            error: error.message
          });
          throw error;
        }
      }

      async submitAnswer(answer) {
        logger.info(this.moduleName, 'Answer submitted', {
          questionNumber: this.currentSession?.questionNumber,
          answer
        });

        try {
          const result = await super.submitAnswer(answer);
          logger.info(this.moduleName, 'Answer evaluated', {
            correct: result.isCorrect,
            newDifficulty: this.currentSession?.currentDifficulty,
            score: result.score
          });
          return result;
        } catch (error) {
          logger.error(this.moduleName, 'Failed to submit answer', {
            error: error.message
          });
          throw error;
        }
      }

      async endSession() {
        logger.perfStart('session-end');
        logger.info(this.moduleName, 'Ending session');

        try {
          const report = await super.endSession();
          logger.perfEnd('session-end', this.moduleName);
          logger.notice(this.moduleName, 'Session ended', {
            score: report?.score,
            questionsAnswered: report?.totalQuestions,
            accuracy: report?.accuracy
          });
          return report;
        } catch (error) {
          logger.error(this.moduleName, 'Failed to end session', {
            error: error.message
          });
          throw error;
        }
      }
    };
  }

  function instrumentSessionManagerInstance() {
    const sm = window.sessionManager;
    const moduleName = 'SessionManager';

    // Wrap existing methods
    const originalStart = sm.startSession?.bind(sm);
    if (originalStart) {
      sm.startSession = async function(...args) {
        logger.notice(moduleName, 'Starting session', { moduleId: args[0] });
        try {
          const result = await originalStart(...args);
          logger.notice(moduleName, 'Session started successfully');
          return result;
        } catch (error) {
          logger.error(moduleName, 'Session start failed', { error: error.message });
          throw error;
        }
      };
    }

    const originalSubmit = sm.submitAnswer?.bind(sm);
    if (originalSubmit) {
      sm.submitAnswer = async function(...args) {
        logger.info(moduleName, 'Answer submitted');
        const result = await originalSubmit(...args);
        logger.info(moduleName, 'Answer evaluated', { correct: result?.isCorrect });
        return result;
      };
    }

    logger.debug('LoggingInit', 'SessionManager instance instrumented');
  }

  function instrumentPDFProcessor() {
    logger.debug('LoggingInit', 'Instrumenting PDFProcessor class');

    const originalPDFProcessor = window.PDFProcessor;

    window.PDFProcessor = class extends originalPDFProcessor {
      constructor() {
        super();
        this.moduleName = 'PDFProcessor';
        logger.info(this.moduleName, 'PDFProcessor instance created');
      }

      async processPDF(file, options = {}) {
        logger.perfStart(`processPDF-${file.name}`);
        logger.info(this.moduleName, 'Starting PDF processing', {
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(2)} KB`,
          options
        });

        try {
          const result = await super.processPDF(file, options);
          const duration = logger.perfEnd(`processPDF-${file.name}`, this.moduleName);

          logger.notice(this.moduleName, 'PDF processing completed', {
            fileName: file.name,
            pages: result.numPages,
            duration: `${duration?.toFixed(2)}ms`
          });

          if (LogConfig.features?.logPerformance && duration > (LogConfig.performanceThresholds?.pdfProcessing || 10000)) {
            logger.warn(this.moduleName, 'PDF processing exceeded performance threshold', {
              duration: `${duration?.toFixed(2)}ms`,
              threshold: `${LogConfig.performanceThresholds?.pdfProcessing}ms`
            });
          }

          return result;
        } catch (error) {
          logger.error(this.moduleName, 'PDF processing failed', {
            fileName: file.name,
            error: error.message
          });
          throw error;
        }
      }

      chunkText(text, options = {}) {
        logger.debug(this.moduleName, 'Chunking text', {
          textLength: text.length,
          maxChunkSize: options.maxChunkSize,
          overlap: options.overlap
        });

        const chunks = super.chunkText(text, options);

        logger.info(this.moduleName, 'Text chunked', {
          inputLength: text.length,
          chunkCount: chunks.length,
          avgChunkSize: Math.round(chunks.reduce((sum, c) => sum + c.length, 0) / chunks.length)
        });

        return chunks;
      }
    };
  }

  function instrumentPDFProcessorInstance() {
    const pp = window.pdfProcessor;
    const moduleName = 'PDFProcessor';

    const originalProcess = pp.processPDF?.bind(pp);
    if (originalProcess) {
      pp.processPDF = async function(...args) {
        const file = args[0];
        logger.info(moduleName, 'Processing PDF', { fileName: file?.name });
        try {
          const result = await originalProcess(...args);
          logger.notice(moduleName, 'PDF processed', { pages: result?.numPages });
          return result;
        } catch (error) {
          logger.error(moduleName, 'PDF processing failed', { error: error.message });
          throw error;
        }
      };
    }

    logger.debug('LoggingInit', 'PDFProcessor instance instrumented');
  }

  function instrumentFirebaseService() {
    logger.debug('LoggingInit', 'Instrumenting FirebaseService class');

    const originalFirebaseService = window.FirebaseService;

    window.FirebaseService = class extends originalFirebaseService {
      constructor() {
        super();
        this.moduleName = 'FirebaseService';
        logger.info(this.moduleName, 'FirebaseService instance created');
      }

      async uploadPDF(file, moduleId) {
        logger.perfStart(`uploadPDF-${moduleId}`);
        logger.info(this.moduleName, 'Uploading PDF to Firebase', {
          moduleId,
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(2)} KB`
        });

        try {
          const result = await super.uploadPDF(file, moduleId);
          const duration = logger.perfEnd(`uploadPDF-${moduleId}`, this.moduleName);

          logger.notice(this.moduleName, 'PDF uploaded successfully', {
            moduleId,
            duration: `${duration?.toFixed(2)}ms`
          });

          return result;
        } catch (error) {
          logger.error(this.moduleName, 'PDF upload failed', {
            moduleId,
            fileName: file.name,
            error: error.message
          });
          throw error;
        }
      }

      async saveContent(moduleId, content) {
        logger.perfStart(`saveContent-${moduleId}`);
        logger.info(this.moduleName, 'Saving content to storage', {
          moduleId,
          contentSize: JSON.stringify(content).length
        });

        try {
          const result = await super.saveContent(moduleId, content);
          const duration = logger.perfEnd(`saveContent-${moduleId}`, this.moduleName);

          logger.info(this.moduleName, 'Content saved successfully', {
            moduleId,
            duration: `${duration?.toFixed(2)}ms`
          });

          return result;
        } catch (error) {
          logger.error(this.moduleName, 'Content save failed', {
            moduleId,
            error: error.message
          });
          throw error;
        }
      }

      async getContent(moduleId) {
        logger.debug(this.moduleName, 'Retrieving content from storage', { moduleId });

        try {
          const result = await super.getContent(moduleId);
          logger.info(this.moduleName, 'Content retrieved', {
            moduleId,
            found: !!result,
            size: result ? JSON.stringify(result).length : 0
          });
          return result;
        } catch (error) {
          logger.error(this.moduleName, 'Content retrieval failed', {
            moduleId,
            error: error.message
          });
          throw error;
        }
      }
    };
  }

  function instrumentFirebaseServiceInstance() {
    const fs = window.firebaseService;
    const moduleName = 'FirebaseService';

    const originalSave = fs.saveContent?.bind(fs);
    if (originalSave) {
      fs.saveContent = async function(...args) {
        const moduleId = args[0];
        logger.info(moduleName, 'Saving content', { moduleId });
        try {
          const result = await originalSave(...args);
          logger.info(moduleName, 'Content saved successfully', { moduleId });
          return result;
        } catch (error) {
          logger.error(moduleName, 'Content save failed', { moduleId, error: error.message });
          throw error;
        }
      };
    }

    logger.debug('LoggingInit', 'FirebaseService instance instrumented');
  }

  function instrumentClassicMode() {
    const moduleName = 'ClassicMode';

    // Log page navigation
    const originalNavigation = window.navigateToModule;
    if (originalNavigation) {
      window.navigateToModule = function(moduleNumber) {
        logger.logUserAction(moduleName, 'Module navigation', {
          moduleNumber
        });
        return originalNavigation(moduleNumber);
      };
    }

    // Log step completion
    const originalStepComplete = window.completeStep;
    if (originalStepComplete) {
      window.completeStep = function(stepId) {
        logger.logUserAction(moduleName, 'Step completed', {
          stepId
        });
        return originalStepComplete(stepId);
      };
    }

    logger.debug('LoggingInit', 'Classic mode instrumented');
  }

  function instrumentQuizEngine() {
    const moduleName = 'QuizEngine';

    // Log quiz starts
    const originalStartQuiz = window.startQuiz;
    if (originalStartQuiz) {
      window.startQuiz = function(...args) {
        logger.logUserAction(moduleName, 'Quiz started', {
          topic: args[0]
        });
        return originalStartQuiz(...args);
      };
    }

    // Log quiz submissions
    const originalSubmitQuiz = window.submitQuiz;
    if (originalSubmitQuiz) {
      window.submitQuiz = function(...args) {
        logger.logUserAction(moduleName, 'Quiz submitted');
        const result = originalSubmitQuiz(...args);
        logger.info(moduleName, 'Quiz completed', {
          score: result?.score,
          totalQuestions: result?.total
        });
        return result;
      };
    }

    logger.debug('LoggingInit', 'Quiz engine instrumented');
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLogging);
  } else {
    // DOM is already ready
    initializeLogging();
  }

})();
