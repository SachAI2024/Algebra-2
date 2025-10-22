// AI Service for HuggingFace Inference API
// Handles question generation, explanations, and image analysis

class AIService {
  constructor() {
    this.apiKey = '';
    this.baseURL = 'https://api-inference.huggingface.co/models/';
    this.mathModel = 'Qwen/Qwen2.5-Math-72B-Instruct'; // or smaller: Qwen/Qwen2-Math-7B-Instruct
    this.visionModel = 'llava-hf/llava-1.5-7b-hf'; // For image analysis
    this.embeddingModel = 'sentence-transformers/all-MiniLM-L6-v2';
  }

  setAPIKey(key) {
    this.apiKey = key;
    localStorage.setItem('hf_api_key', key);
  }

  getAPIKey() {
    if (!this.apiKey) {
      this.apiKey = localStorage.getItem('hf_api_key') || '';
    }
    return this.apiKey;
  }

  async _callAPI(model, payload, retries = 3) {
    const apiKey = this.getAPIKey();
    if (!apiKey) {
      throw new Error('HuggingFace API key not set. Please configure in settings.');
    }

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(this.baseURL + model, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.status === 503) {
          // Model is loading, wait and retry
          const data = await response.json();
          const waitTime = data.estimated_time || 20;
          console.log(`Model loading, waiting ${waitTime}s...`);
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
          continue;
        }

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`API Error: ${response.status} - ${error}`);
        }

        return await response.json();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // Generate embeddings for text chunks
  async generateEmbedding(text) {
    const result = await this._callAPI(this.embeddingModel, {
      inputs: text
    });

    return Array.isArray(result) ? result[0] : result;
  }

  // Generate embeddings for multiple texts
  async generateEmbeddings(texts) {
    const embeddings = [];

    // Batch process to avoid rate limits
    for (let i = 0; i < texts.length; i += 5) {
      const batch = texts.slice(i, i + 5);
      const batchResults = await Promise.all(
        batch.map(text => this.generateEmbedding(text))
      );
      embeddings.push(...batchResults);

      // Small delay between batches
      if (i + 5 < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return embeddings;
  }

  // Generate a math question based on context
  async generateQuestion(context, difficulty, topic) {
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
    return this._parseQuestionResponse(response);
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
      console.warn('Failed to parse question, using fallback');
      return this._createFallbackQuestion();
    }

    const options = optionsMatch.map(opt => opt.trim().substring(3).trim());
    const correctIndex = correctMatch[1].charCodeAt(0) - 65; // A=0, B=1, etc.

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

    const result = await this._callAPI(this.mathModel, {
      inputs: prompt,
      parameters: {
        max_new_tokens: 300,
        temperature: 0.5,
        return_full_text: false
      }
    });

    return result[0]?.generated_text || result.generated_text || 'Focus on understanding the core concept and try again!';
  }

  // Generate practice problems after failure
  async generatePracticeProblems(topic, count = 4) {
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

    const result = await this._callAPI(this.mathModel, {
      inputs: prompt,
      parameters: {
        max_new_tokens: 600,
        temperature: 0.8,
        return_full_text: false
      }
    });

    const response = result[0]?.generated_text || result.generated_text || '';
    return this._parsePracticeProblems(response);
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
    try {
      const result = await this._callAPI(this.visionModel, {
        inputs: imageBase64
      });

      return result[0]?.generated_text || 'Image analyzed';
    } catch (error) {
      console.warn('Vision model error:', error);
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

    return found.length > 0 ? found[0] : 'algebra';
  }
}

// Global instance
const aiService = new AIService();
