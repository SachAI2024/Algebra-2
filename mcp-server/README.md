# Algebra Tutor MCP Server

**Simple MCP server for AI-powered Algebra 2 tutoring**

## 📁 Files (Only 3!)
```
mcp-server/
├── package.json    # Dependencies
├── server.js       # MCP server code (all-in-one)
└── .env.example    # Environment variables template
```

## 🚀 Quick Setup (3 Steps)

### 1. Install Dependencies
```bash
cd mcp-server
npm install
```

### 2. Set HuggingFace API Key
```bash
# Get your key from: https://huggingface.co/settings/tokens
export HF_API_KEY="hf_your_key_here"
```

### 3. Test the Server
```bash
npm start
```

## 🔧 Use with Claude Code

Add to your Claude Code MCP config (`~/.claude/mcp.json`):

```json
{
  "mcpServers": {
    "algebra-tutor": {
      "command": "node",
      "args": ["/full/path/to/Algebra-2/mcp-server/server.js"],
      "env": {
        "HF_API_KEY": "hf_your_key_here"
      }
    }
  }
}
```

Then restart Claude Code and you'll have these tools available:

## 🛠️ Available Tools

### 1. `generate_question`
Generate math questions
```javascript
{
  "topic": "polynomials",
  "difficulty": 2  // 1-4
}
```

### 2. `generate_embedding`
Create text embeddings for RAG
```javascript
{
  "text": "Your text here"
}
```

### 3. `explain_mistake`
Explain wrong answers
```javascript
{
  "question": "What is 2+2?",
  "wrongAnswer": "5",
  "correctAnswer": "4"
}
```

## 💡 Example Usage in Claude Code

```
You: Generate a medium difficulty question about factoring polynomials

Claude: I'll use the generate_question tool...
[Calls MCP server and returns question]
```

## 🐛 Troubleshooting

**Server won't start?**
- Check Node.js version: `node --version` (need v18+)
- Check HF_API_KEY is set: `echo $HF_API_KEY`

**Claude can't find server?**
- Check path in mcp.json is absolute (not relative)
- Restart Claude Code after config changes

**API errors?**
- Verify HuggingFace API key is valid
- Check internet connection
- Some models may take 20-30s to load first time

## 📝 That's It!

This is the simplest possible MCP implementation. One file, three tools, ready to go!
