# Docker + TypeScript Architecture

## Overview

This branch contains a refactored architecture with:
- **Backend**: Node.js/Express REST API running in Docker
- **Frontend**: React + TypeScript + Vite running in Docker
- **Communication**: REST APIs between frontend and backend

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DOCKER COMPOSE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────┐     ┌─────────────────────────────┐       │
│  │     Frontend Container      │     │     Backend Container       │       │
│  │                             │     │                             │       │
│  │  ┌───────────────────────┐  │     │  ┌───────────────────────┐  │       │
│  │  │   React + TypeScript  │  │     │  │   Express + Node.js   │  │       │
│  │  │   (Vite Build)        │  │     │  │                       │  │       │
│  │  └───────────────────────┘  │     │  │   REST API Endpoints: │  │       │
│  │                             │     │  │   /api/health         │  │       │
│  │  ┌───────────────────────┐  │     │  │   /api/tools          │  │       │
│  │  │       Nginx           │──┼─────┼─▶│   /api/tools/*        │  │       │
│  │  │   (Reverse Proxy)     │  │     │  │                       │  │       │
│  │  └───────────────────────┘  │     │  └───────────────────────┘  │       │
│  │                             │     │             │               │       │
│  │  Port: 3000                 │     │  Port: 3001 │               │       │
│  └─────────────────────────────┘     └─────────────┼───────────────┘       │
│                                                    │                        │
│                                                    ▼                        │
│                                      ┌─────────────────────────────┐       │
│                                      │    HuggingFace API          │       │
│                                      │    (External Service)       │       │
│                                      └─────────────────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Set up environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your HuggingFace API key
nano .env
```

### 2. Start with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 3. Access the application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## Development Mode (Without Docker)

### Backend

```bash
cd backend
npm install
HF_API_KEY=your_key npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## File Structure

```
Algebra-2/
├── docker-compose.yml          # Docker orchestration
├── .env.example                # Environment template
│
├── backend/
│   ├── Dockerfile              # Backend container config
│   ├── package.json            # Dependencies
│   ├── .env.example            # Backend env template
│   └── src/
│       └── server.js           # Express API server
│
└── frontend/
    ├── Dockerfile              # Frontend container config
    ├── nginx.conf              # Nginx reverse proxy config
    ├── package.json            # Dependencies
    ├── tsconfig.json           # TypeScript config
    ├── vite.config.ts          # Vite bundler config
    ├── index.html              # HTML entry point
    └── src/
        ├── main.tsx            # React entry point
        ├── App.tsx             # Main app component
        ├── index.css           # Global styles
        ├── components/
        │   ├── index.ts
        │   ├── GenerateQuestion.tsx
        │   ├── GenerateEmbedding.tsx
        │   └── ExplainMistake.tsx
        ├── services/
        │   └── api.ts          # REST API client
        └── types/
            └── index.ts        # TypeScript types
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/tools` | List available tools |
| POST | `/api/tools/generate-question` | Generate math question |
| POST | `/api/tools/generate-embedding` | Generate text embedding |
| POST | `/api/tools/explain-mistake` | Explain wrong answer |

### Example API Calls

```bash
# Health check
curl http://localhost:3001/api/health

# Generate question
curl -X POST http://localhost:3001/api/tools/generate-question \
  -H "Content-Type: application/json" \
  -d '{"topic": "factoring", "difficulty": 2}'

# Generate embedding
curl -X POST http://localhost:3001/api/tools/generate-embedding \
  -H "Content-Type: application/json" \
  -d '{"text": "Factor x² + 5x + 6"}'

# Explain mistake
curl -X POST http://localhost:3001/api/tools/explain-mistake \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is (x+2)(x+3)?",
    "wrongAnswer": "x² + 5x + 5",
    "correctAnswer": "x² + 5x + 6"
  }'
```

## Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up --build

# Remove volumes and clean up
docker-compose down -v --rmi all
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `HF_API_KEY` | HuggingFace API key | Yes |
| `PORT` | Backend port (default: 3001) | No |

## Technology Stack

### Backend
- Node.js 20
- Express.js
- node-fetch for HTTP requests
- CORS enabled

### Frontend
- React 18
- TypeScript 5
- Vite 5
- CSS (no framework)

### Infrastructure
- Docker & Docker Compose
- Nginx (reverse proxy)
- Multi-stage builds

## Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 3001 | http://localhost:3001 |

## Troubleshooting

### Backend not starting
```bash
# Check logs
docker-compose logs backend

# Verify API key is set
docker-compose exec backend printenv HF_API_KEY
```

### Frontend can't connect to backend
```bash
# Check if backend is healthy
curl http://localhost:3001/api/health

# Check nginx logs
docker-compose logs frontend
```

### Rebuild from scratch
```bash
docker-compose down -v --rmi all
docker-compose up --build
```
