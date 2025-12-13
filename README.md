<div align="center">

# 🎬 Movie & TV Streaming Link Generator

### AI-Powered Multi-Provider Streaming Links for Movies & TV Series

[![Node.js](https://img.shields.io/badge/Node.js-v16+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.22.1-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![OpenAI Agents](https://img.shields.io/badge/AI-OpenAI%20Agents-412991?logo=openai&logoColor=white)](https://platform.openai.com/)
[![Groq](https://img.shields.io/badge/Groq-gpt--oss--120b-FF6B00?logo=groq&logoColor=white)](https://groq.com/)
[![TMDB](https://img.shields.io/badge/API-TMDB-01D277?logo=themoviedatabase&logoColor=white)](https://www.themoviedb.org/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

[Features](#-features) • [Quick Start](#-quick-start) • [Usage](#-usage) • [Tech Stack](#️-tech-stack) • [API Endpoints](#-api-endpoints)

</div>

---

An AI-powered chat application that instantly provides streaming links from multiple providers for movies and TV series using natural language queries.

## ✨ Features

- **Multi-Provider Links** - Get 5 streaming options: VidKing, Vidsrc, Vidlink, Multi-Embed, Embed Master
- **Smart TV Series Navigation** - Guided season/episode selection with conversation context
- **Intelligent Guardrails** - Accepts media queries, rejects off-topic requests
- **iOS-Style UI** - Modern design with dark mode support and mobile optimization
- **Real-time Responses** - Powered by OpenAI Agents SDK with Groq inference

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- [TMDB API Key](https://www.themoviedb.org/settings/api)
- [Groq API Key](https://console.groq.com/)

### Installation

```bash
# Clone and install
npm install

# Configure environment
cp .env.example .env
# Add your GROQ_API_KEY and TMDB_API_KEY
```

### Run Locally

```bash
npm start
# Open http://localhost:3000
```

### Deploy to Vercel

```bash
vercel deploy
```

## 🎯 Usage

Simply type the media name:
- `Inception` → Returns 5 movie streaming links
- `Breaking Bad` → Asks for season/episode
- `Game of Thrones S5 E1` → Returns episode links

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **AI** | OpenAI Agents SDK, Groq (gpt-oss-120b) |
| **Backend** | Node.js, Express.js |
| **Frontend** | Vanilla JS, Marked.js, DOMPurify |
| **APIs** | TMDB v3 |
| **Deployment** | Vercel (Serverless) |

## 📁 Project Structure

```
├── index.js         # AI agent logic & streaming tools
├── server.js        # Express API server
├── index.html       # Chat UI
├── vercel.json      # Deployment config
└── .env            # Environment variables
```

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Send message, get streaming links |
| `/api/reset` | POST | Clear conversation history |
| `/api/health` | GET | Health check |

## 🔐 Environment Variables

```env
GROQ_API_KEY=gsk_...
TMDB_API_KEY=...
PORT=3000
```

## 📄 License

ISC
