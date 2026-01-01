#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';

// Configuration from environment variables
const HF_API_KEY = process.env.HF_API_KEY || '';
const HF_BASE_URL = 'https://router.huggingface.co/hf-inference/models/';

// Create MCP server
const server = new Server(
  {
    name: 'algebra-tutor-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper function to call HuggingFace API
async function callHuggingFace(model, payload) {
  const response = await fetch(`${HF_BASE_URL}${model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HuggingFace API error: ${error}`);
  }

  return await response.json();
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'generate_question',
        description: 'Generate an Algebra 2 math question',
        inputSchema: {
          type: 'object',
          properties: {
            topic: {
              type: 'string',
              description: 'Math topic (e.g., polynomials, factoring)',
            },
            difficulty: {
              type: 'number',
              description: 'Difficulty level 1-4',
              minimum: 1,
              maximum: 4,
            },
          },
          required: ['topic', 'difficulty'],
        },
      },
      {
        name: 'generate_embedding',
        description: 'Generate vector embedding for text',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Text to embed',
            },
          },
          required: ['text'],
        },
      },
      {
        name: 'explain_mistake',
        description: 'Explain why an answer is wrong',
        inputSchema: {
          type: 'object',
          properties: {
            question: {
              type: 'string',
              description: 'The question asked',
            },
            wrongAnswer: {
              type: 'string',
              description: 'The wrong answer given',
            },
            correctAnswer: {
              type: 'string',
              description: 'The correct answer',
            },
          },
          required: ['question', 'wrongAnswer', 'correctAnswer'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'generate_question') {
      const { topic, difficulty } = args;

      const difficultyDesc = {
        1: 'very simple',
        2: 'moderate',
        3: 'challenging',
        4: 'advanced',
      };

      const prompt = `Create a ${difficultyDesc[difficulty]} Algebra 2 question about ${topic}.

Format:
QUESTION: [question text]
A) [option A]
B) [option B]
C) [option C]
D) [option D]
CORRECT: [A/B/C/D]
SOLUTION: [step-by-step solution]`;

      const result = await callHuggingFace('Qwen/Qwen2.5-Math-72B-Instruct', {
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
        },
      });

      const response = result[0]?.generated_text || result.generated_text || '';

      return {
        content: [{ type: 'text', text: response }],
      };
    }

    if (name === 'generate_embedding') {
      const { text } = args;

      const result = await callHuggingFace('sentence-transformers/all-MiniLM-L6-v2', {
        inputs: text,
        options: { wait_for_model: true },
      });

      let embedding = Array.isArray(result[0]) ? result[0] : result;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ embedding, dimensions: embedding.length }),
          },
        ],
      };
    }

    if (name === 'explain_mistake') {
      const { question, wrongAnswer, correctAnswer } = args;

      const prompt = `Question: ${question}
Student's answer: ${wrongAnswer}
Correct answer: ${correctAnswer}

Explain why the student's answer is wrong and how to solve it correctly. Be encouraging and educational.`;

      const result = await callHuggingFace('Qwen/Qwen2.5-Math-72B-Instruct', {
        inputs: prompt,
        parameters: {
          max_new_tokens: 300,
          temperature: 0.5,
        },
      });

      const explanation = result[0]?.generated_text || result.generated_text || '';

      return {
        content: [{ type: 'text', text: explanation }],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Algebra Tutor MCP server running');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
