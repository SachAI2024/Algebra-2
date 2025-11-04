// AI Service for HuggingFace Inference API
// Handles question generation, explanations, and image analysis

class AIService {
  constructor() {
    this.apiKey = '';
    this.baseURL = 'https://api-inference.huggingface.co/models/';
    this.mathModel = 'Qwen/Qwen2.5-Math-72B-Instruct'; // or smaller: Qwen/Qwen2-Math-7B-Instruct
    this.visionModel = 'llava-hf/llava-1.5-7b-hf'; // For image analysis
    this.embeddingModel = 'sentence-transformers/all-MiniLM-L6-v2';
    this.moduleName = 'AIService';

    if (window.logger) {
      logger.info(this.moduleName, 'AIService initialized', {
        mathModel: this.mathModel,
        visionModel: this.visionModel,
        embeddingModel: this.embeddingModel
      });
    }
  }

  setAPIKey(key) {
    this.apiKey = key;
    localStorage.setItem('hf_api_key', key);
    if (window.logger) {
      logger.info(this.moduleName, 'API key configured', {
        keyLength: key ? key.length : 0,
        masked: key ? `${key.substring(0, 8)}...` : 'none'
      });
    }
  }

  getAPIKey() {
    if (!this.apiKey) {
      this.apiKey = localStorage.getItem('hf_api_key') || '';
      if (window.logger) {
        logger.debug(this.moduleName, 'API key loaded from localStorage', {
          hasKey: !!this.apiKey
        });
      }
    }
    return this.apiKey;
  }

  async _callAPI(model, payload, retries = 3) {
    const apiKey = this.getAPIKey();
    if (!apiKey) {
      const error = new Error('HuggingFace API key not set. Please configure in settings.');
      if (window.logger) {
        logger.error(this.moduleName, 'API key missing', { model });
      }
      throw error;
    }

    const startTime = performance.now();
    const endpoint = this.baseURL + model;

    if (window.logger) {
      logger.logAPICall(this.moduleName, endpoint, 'POST', {
        model,
        payloadSize: JSON.stringify(payload).length,
        retries
      });
    }

    for (let i = 0; i < retries; i++) {
      try {
        if (window.logger && i > 0) {
          logger.warn(this.moduleName, `Retry attempt ${i + 1}/${retries}`, { model, endpoint });
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const duration = performance.now() - startTime;

        if (response.status === 503) {
          // Model is loading, wait and retry
          const data = await response.json();
          const waitTime = data.estimated_time || 20;

          if (window.logger) {
            logger.notice(this.moduleName, 'Model loading, waiting for availability', {
              model,
              estimatedWaitTime: `${waitTime}s`,
              attempt: i + 1
            });
          }

          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
          continue;
        }

        if (!response.ok) {
          const error = await response.text();
          const errorMsg = `API Error: ${response.status} - ${error}`;

          if (window.logger) {
            logger.logAPIResponse(this.moduleName, endpoint, response.status, duration, {
              error: error.substring(0, 200),
              attempt: i + 1
            });
          }

          throw new Error(errorMsg);
        }

        const result = await response.json();

        if (window.logger) {
          logger.logAPIResponse(this.moduleName, endpoint, response.status, duration, {
            success: true,
            resultSize: JSON.stringify(result).length
          });

          // Check performance threshold
          if (LogConfig.features?.logPerformance && duration > (LogConfig.performanceThresholds?.apiCall || 5000)) {
            logger.warn(this.moduleName, 'API call exceeded performance threshold', {
              endpoint,
              duration: `${duration.toFixed(2)}ms`,
              threshold: `${LogConfig.performanceThresholds?.apiCall}ms`
            });
          }
        }

        return result;
      } catch (error) {
        if (i === retries - 1) {
          if (window.logger) {
            logger.error(this.moduleName, 'API call failed after all retries', {
              model,
              endpoint,
              attempts: retries,
              error: error.message,
              duration: `${(performance.now() - startTime).toFixed(2)}ms`
            });
          }
          throw error;
        }

        const backoffDelay = 2000 * Math.pow(2, i); // Exponential backoff
        if (window.logger) {
          logger.debug(this.moduleName, 'Retrying after error', {
            attempt: i + 1,
            backoffDelay: `${backoffDelay}ms`,
            error: error.message
          });
        }

        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }

  // Generate embeddings for text chunks
  async generateEmbedding(text) {
    if (window.logger) {
      logger.debug(this.moduleName, 'Generating embedding', {
        textLength: text.length,
        preview: text.substring(0, 50)
      });
    }

    const startTime = performance.now();
    const result = await this._callAPI(this.embeddingModel, {
      inputs: text
    });

    const embedding = Array.isArray(result) ? result[0] : result;

    if (window.logger) {
      const duration = performance.now() - startTime;
      logger.debug(this.moduleName, 'Embedding generated', {
        dimensions: embedding?.length || 0,
        duration: `${duration.toFixed(2)}ms`
      });
    }

    return embedding;
  }

  // Generate embeddings for multiple texts
  async generateEmbeddings(texts) {
    if (window.logger) {
      logger.perfStart('generateEmbeddings');
      logger.info(this.moduleName, 'Batch embedding generation started', {
        totalTexts: texts.length,
        batchSize: 5,
        estimatedBatches: Math.ceil(texts.length / 5)
      });
    }

    const embeddings = [];

    // Batch process to avoid rate limits
    for (let i = 0; i < texts.length; i += 5) {
      const batch = texts.slice(i, i + 5);

      if (window.logger) {
        logger.debug(this.moduleName, `Processing batch ${Math.floor(i / 5) + 1}`, {
          batchStart: i,
          batchSize: batch.length
        });
      }

      const batchResults = await Promise.all(
        batch.map(text => this.generateEmbedding(text))
      );
      embeddings.push(...batchResults);

      // Small delay between batches
      if (i + 5 < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (window.logger) {
      const duration = logger.perfEnd('generateEmbeddings', this.moduleName);
      logger.info(this.moduleName, 'Batch embedding generation completed', {
        totalEmbeddings: embeddings.length,
        totalDuration: `${duration?.toFixed(2)}ms`,
        avgPerEmbedding: `${(duration / embeddings.length).toFixed(2)}ms`
      });
    }

    return embeddings;
  }

  // Generate a math question based on context
  async generateQuestion(context, difficulty, topic) {
    if (window.logger) {
      logger.perfStart('generateQuestion');
      logger.info(this.moduleName, 'Generating question', {
        difficulty,
        topic,
        contextLength: context.length
      });
    }

    const prompt = this._buildQuestionPrompt(context, difficulty, topic);

    const result = await this._callAPI(this.mathModel, {
      inputs: prompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
        top_p: 0.9,
        return_full_text: false
      }
    });

    const response = result[0]?.generated_text || result.generated_text || '';
    const question = this._parseQuestionResponse(response);

    if (window.logger) {
      const duration = logger.perfEnd('generateQuestion', this.moduleName);
      logger.info(this.moduleName, 'Question generated', {
        difficulty,
        topic,
        isGenerated: question.generated,
        duration: `${duration?.toFixed(2)}ms`,
        hasOptions: question.options?.length || 0
      });

      if (LogConfig.features?.logPerformance && duration > (LogConfig.performanceThresholds?.questionGeneration || 5000)) {
        logger.warn(this.moduleName, 'Question generation exceeded performance threshold', {
          duration: `${duration?.toFixed(2)}ms`,
          threshold: `${LogConfig.performanceThresholds?.questionGeneration}ms`
        });
      }
    }

    return question;
  }

  _buildQuestionPrompt(context, difficulty, topic) {
    const difficultyDesc = {
      1: 'very simple, basic understanding',
      2: 'moderate, requires some thinking',
      3: 'challenging, multi-step problem',
      4: 'advanced, complex reasoning required'
    };

    return `You are an Algebra 2 tutor creating practice questions for high school students.

Context from textbook:
${context}

Create a ${difficultyDesc[difficulty]} question about ${topic}.

Requirements:
1. Generate ONE multiple-choice question with 4 options (A, B, C, D)
2. Mark the correct answer
3. Include step-by-step solution
4. Difficulty level: ${difficulty}/4

Format your response EXACTLY as:
QUESTION: [question text]
A) [option A]
B) [option B]
C) [option C]
D) [option D]
CORRECT: [A/B/C/D]
SOLUTION:
[step-by-step solution]

Begin:`;
  }

  _parseQuestionResponse(response) {
    const questionMatch = response.match(/QUESTION:\s*(.+?)(?=\nA\))/s);
    const optionsMatch = response.match(/([ABCD]\).+?)(?=CORRECT:|$)/gs);
    const correctMatch = response.match(/CORRECT:\s*([ABCD])/);
    const solutionMatch = response.match(/SOLUTION:\s*(.+)/s);

    if (!questionMatch || !optionsMatch || !correctMatch) {
      if (window.logger) {
        logger.warn(this.moduleName, 'Failed to parse question response, using fallback', {
          hasQuestion: !!questionMatch,
          hasOptions: !!optionsMatch,
          hasCorrect: !!correctMatch,
          responsePreview: response.substring(0, 100)
        });
      }
      return this._createFallbackQuestion();
    }

    const options = optionsMatch.map(opt => opt.trim().substring(3).trim());
    const correctIndex = correctMatch[1].charCodeAt(0) - 65; // A=0, B=1, etc.

    if (window.logger) {
      logger.debug(this.moduleName, 'Question parsed successfully', {
        optionsCount: options.length,
        correctAnswer: correctMatch[1],
        hasSolution: !!solutionMatch
      });
    }

    return {
      question: questionMatch[1].trim(),
      options,
      correctIndex,
      solution: solutionMatch ? solutionMatch[1].trim() : 'Solution not available',
      generated: true
    };
  }

  _createFallbackQuestion() {
    return {
      question: 'What is the result of (2x + 3)(x - 1)?',
      options: ['2x² + x - 3', '2x² - x + 3', '2x² + 5x - 3', '2x² - 2x - 3'],
      correctIndex: 0,
      solution: 'Using FOIL: First: 2x·x = 2x², Outer: 2x·(-1) = -2x, Inner: 3·x = 3x, Last: 3·(-1) = -3. Combine: 2x² + x - 3',
      generated: false
    };
  }

  // Generate explanation for wrong answer
  async explainMistake(question, userAnswer, correctAnswer, context) {
    if (window.logger) {
      logger.info(this.moduleName, 'Generating mistake explanation', {
        questionPreview: question.substring(0, 50),
        userAnswer,
        correctAnswer
      });
    }

    const prompt = `You are an Algebra 2 tutor helping a student understand their mistake.

Question: ${question}
Student's answer: ${userAnswer}
Correct answer: ${correctAnswer}

Context: ${context}

Explain:
1. Why the student's answer is wrong
2. What concept they misunderstood
3. How to approach this correctly
4. One key tip to remember

Keep it encouraging and educational. Use simple language for high school students.`;

    const startTime = performance.now();
    const result = await this._callAPI(this.mathModel, {
      inputs: prompt,
      parameters: {
        max_new_tokens: 300,
        temperature: 0.5,
        return_full_text: false
      }
    });

    const explanation = result[0]?.generated_text || result.generated_text || 'Focus on understanding the core concept and try again!';

    if (window.logger) {
      const duration = performance.now() - startTime;
      logger.info(this.moduleName, 'Mistake explanation generated', {
        duration: `${duration.toFixed(2)}ms`,
        explanationLength: explanation.length
      });
    }

    return explanation;
  }

  // Generate practice problems after failure
  async generatePracticeProblems(topic, count = 4) {
    if (window.logger) {
      logger.info(this.moduleName, 'Generating practice problems', {
        topic,
        count
      });
    }

    const prompt = `Create ${count} simple practice problems about ${topic} for Algebra 2 students.

For each problem, provide:
- Problem statement
- Answer
- One-line hint

Format:
PROBLEM 1: [problem]
ANSWER: [answer]
HINT: [hint]

Begin:`;

    const startTime = performance.now();
    const result = await this._callAPI(this.mathModel, {
      inputs: prompt,
      parameters: {
        max_new_tokens: 600,
        temperature: 0.8,
        return_full_text: false
      }
    });

    const response = result[0]?.generated_text || result.generated_text || '';
    const problems = this._parsePracticeProblems(response);

    if (window.logger) {
      const duration = performance.now() - startTime;
      logger.info(this.moduleName, 'Practice problems generated', {
        topic,
        problemsGenerated: problems.length,
        duration: `${duration.toFixed(2)}ms`
      });
    }

    return problems;
  }

  _parsePracticeProblems(response) {
    const problemRegex = /PROBLEM \d+:\s*(.+?)\nANSWER:\s*(.+?)\nHINT:\s*(.+?)(?=\nPROBLEM|$)/gs;
    const problems = [];
    let match;

    while ((match = problemRegex.exec(response)) !== null) {
      problems.push({
        problem: match[1].trim(),
        answer: match[2].trim(),
        hint: match[3].trim()
      });
    }

    // Fallback if parsing fails
    if (problems.length === 0) {
      return this._getFallbackPracticeProblems();
    }

    return problems;
  }

  _getFallbackPracticeProblems() {
    return [
      { problem: 'Simplify: 3x² + 2x² - x²', answer: '4x²', hint: 'Combine like terms' },
      { problem: 'Expand: (x + 2)(x + 3)', answer: 'x² + 5x + 6', hint: 'Use FOIL method' },
      { problem: 'Factor: x² - 9', answer: '(x - 3)(x + 3)', hint: 'Difference of squares' },
      { problem: 'Simplify: 2x(3x - 4)', answer: '6x² - 8x', hint: 'Distribute the 2x' }
    ];
  }

  // Analyze image from PDF (if contains diagram/graph)
  async analyzeImage(imageBase64) {
    if (window.logger) {
      logger.info(this.moduleName, 'Analyzing image with vision model', {
        imageSize: imageBase64.length
      });
    }

    try {
      const startTime = performance.now();
      const result = await this._callAPI(this.visionModel, {
        inputs: imageBase64
      });

      const analysis = result[0]?.generated_text || 'Image analyzed';

      if (window.logger) {
        const duration = performance.now() - startTime;
        logger.info(this.moduleName, 'Image analysis completed', {
          duration: `${duration.toFixed(2)}ms`,
          resultLength: analysis.length
        });
      }

      return analysis;
    } catch (error) {
      if (window.logger) {
        logger.warn(this.moduleName, 'Vision model error, using fallback', {
          error: error.message
        });
      }
      return 'Image contains mathematical content (diagram/graph/equation)';
    }
  }

  // Extract topic from text chunk
  extractTopic(text) {
    const topics = [
      'polynomials', 'factoring', 'quadratic equations', 'linear equations',
      'functions', 'graphing', 'systems of equations', 'inequalities',
      'rational expressions', 'radicals', 'complex numbers', 'exponential functions',
      'logarithms', 'sequences', 'series', 'binomial theorem'
    ];

    const textLower = text.toLowerCase();
    const found = topics.filter(topic => textLower.includes(topic));

    const extractedTopic = found.length > 0 ? found[0] : 'algebra';

    if (window.logger) {
      logger.debug(this.moduleName, 'Topic extracted from text', {
        topic: extractedTopic,
        allFound: found,
        textPreview: text.substring(0, 50)
      });
    }

    return extractedTopic;
  }
}

// Global instance
const aiService = new AIService();
