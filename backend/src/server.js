import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const HF_API_BASE = 'https://router.huggingface.co/hf-inference/models/';
const HF_API_KEY = process.env.HF_API_KEY || '';

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasApiKey: !!HF_API_KEY
  });
});

// List available tools
app.get('/api/tools', (req, res) => {
  res.json({
    tools: [
      {
        name: 'generate_question',
        description: 'Generate an Algebra 2 math question',
        parameters: {
          topic: { type: 'string', required: true, description: 'Math topic (e.g., polynomials, factoring)' },
          difficulty: { type: 'number', required: true, description: 'Difficulty level 1-4' }
        }
      },
      {
        name: 'generate_embedding',
        description: 'Generate vector embedding for text',
        parameters: {
          text: { type: 'string', required: true, description: 'Text to embed' }
        }
      },
      {
        name: 'explain_mistake',
        description: 'Explain why an answer is wrong',
        parameters: {
          question: { type: 'string', required: true, description: 'The question asked' },
          wrongAnswer: { type: 'string', required: true, description: 'The wrong answer given' },
          correctAnswer: { type: 'string', required: true, description: 'The correct answer' }
        }
      }
    ]
  });
});

// Helper function to call HuggingFace API
async function callHF(model, payload) {
  const response = await fetch(`${HF_API_BASE}${model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HF API error (${response.status}): ${error}`);
  }

  return response.json();
}

// Generate Question
app.post('/api/tools/generate-question', async (req, res) => {
  try {
    const { topic, difficulty } = req.body;

    if (!topic || !difficulty) {
      return res.status(400).json({ error: 'topic and difficulty are required' });
    }

    const difficultyDesc = { 1: 'very simple', 2: 'moderate', 3: 'challenging', 4: 'advanced' };

    const prompt = `Create a ${difficultyDesc[difficulty]} Algebra 2 question about ${topic}.

Format:
QUESTION: [question text]
A) [option A]
B) [option B]
C) [option C]
D) [option D]
CORRECT: [A/B/C/D]
SOLUTION: [step-by-step solution]`;

    const result = await callHF('Qwen/Qwen2.5-Math-72B-Instruct', {
      inputs: prompt,
      parameters: { max_new_tokens: 500, temperature: 0.7 },
    });

    const response = result[0]?.generated_text || result.generated_text || '';

    res.json({
      success: true,
      data: {
        raw: response,
        topic,
        difficulty
      }
    });
  } catch (error) {
    console.error('Generate question error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate Embedding
app.post('/api/tools/generate-embedding', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const result = await callHF('sentence-transformers/all-MiniLM-L6-v2', {
      inputs: text,
      options: { wait_for_model: true },
    });

    const embedding = Array.isArray(result[0]) ? result[0] : result;

    res.json({
      success: true,
      data: {
        embedding,
        dimensions: embedding.length,
        textLength: text.length
      }
    });
  } catch (error) {
    console.error('Generate embedding error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Explain Mistake
app.post('/api/tools/explain-mistake', async (req, res) => {
  try {
    const { question, wrongAnswer, correctAnswer } = req.body;

    if (!question || !wrongAnswer || !correctAnswer) {
      return res.status(400).json({ error: 'question, wrongAnswer, and correctAnswer are required' });
    }

    const prompt = `Question: ${question}
Student's answer: ${wrongAnswer}
Correct answer: ${correctAnswer}

Explain why the student's answer is wrong and how to solve it correctly. Be encouraging and educational.`;

    const result = await callHF('Qwen/Qwen2.5-Math-72B-Instruct', {
      inputs: prompt,
      parameters: { max_new_tokens: 300, temperature: 0.5 },
    });

    const explanation = result[0]?.generated_text || result.generated_text || '';

    res.json({
      success: true,
      data: {
        explanation,
        question,
        wrongAnswer,
        correctAnswer
      }
    });
  } catch (error) {
    console.error('Explain mistake error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generic tool endpoint (for backwards compatibility)
app.post('/api/tool', async (req, res) => {
  const { tool, args } = req.body;

  if (!tool || !args) {
    return res.status(400).json({ error: 'tool and args are required' });
  }

  // Route to specific endpoint
  const routes = {
    'generate_question': '/api/tools/generate-question',
    'generate_embedding': '/api/tools/generate-embedding',
    'explain_mistake': '/api/tools/explain-mistake'
  };

  if (!routes[tool]) {
    return res.status(400).json({ error: `Unknown tool: ${tool}` });
  }

  // Forward to specific handler
  req.url = routes[tool];
  req.body = args;
  app.handle(req, res);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║         Algebra Tutor Backend API Server                  ║
╠═══════════════════════════════════════════════════════════╣
║  URL:     http://localhost:${PORT}                           ║
║  Health:  http://localhost:${PORT}/api/health                ║
║  Tools:   http://localhost:${PORT}/api/tools                 ║
║  API Key: ${HF_API_KEY ? 'Configured' : 'NOT SET - Add HF_API_KEY'}                       ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
