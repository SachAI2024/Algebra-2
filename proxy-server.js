// Lightweight proxy server to call Hugging Face Inference API from the browser without CORS errors.
// Usage:
//   HF_API_KEY=your_key node proxy-server.js
// Optional env vars:
//   PORT (default 8787)
//   HF_API_BASE (default https://api-inference.huggingface.co/models/)

const http = require('http');

const PORT = process.env.PORT || 8787;
const HF_API_BASE = process.env.HF_API_BASE || 'https://api-inference.huggingface.co/models/';

function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

const server = http.createServer(async (req, res) => {
  setCORSHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.method !== 'POST' || req.url !== '/api/inference') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Not found' }));
  }

  try {
    const body = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => (data += chunk.toString()));
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });

    const parsed = body ? JSON.parse(body) : {};
    const { model, payload } = parsed;

    if (!model || !payload) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'model and payload are required' }));
    }

    const apiKey = process.env.HF_API_KEY || '';
    if (!apiKey && !req.headers.authorization) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'HF_API_KEY env var or Authorization header required' }));
    }

    const response = await fetch(HF_API_BASE + model, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization || `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    res.writeHead(response.status, { 'Content-Type': 'application/json' });
    res.end(text);
  } catch (error) {
    console.error('Proxy error', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
  }
});

server.listen(PORT, () => {
  console.log(`HF proxy server listening on http://localhost:${PORT}/api/inference`);
});
