# Movie & TV Series Streaming Link Provider

A web-based chat application that provides streaming links for movies and TV series using AI agents.

## Architecture

### Files Structure

- **`index.js`** - Contains the AI agent logic with tools for searching movies/TV series and generating streaming links
- **`server.js`** - Express API server that handles HTTP requests and manages chat sessions
- **`index.html`** - Frontend chat interface with WhatsApp-like design

## Features

- 🎬 Search for movies and get streaming links
- 📺 Search for TV series with season and episode support
- 💬 WhatsApp-like chat interface
- 📝 Assistant responses rendered as Markdown (links, lists, code blocks)
- 🔄 Conversation history tracking
- 🚫 Input guardrails to reject non-streaming queries
- 🎨 Beautiful gradient UI with animations

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Create a `.env` file with:
   ```
   GROQ_API_KEY=your_groq_api_key
   TMDB_API_KEY=your_tmdb_api_key
   PORT=3000
   ```

3. **Start the Server**
   ```bash
   npm start
   ```

4. **Open the Application**
   Navigate to `http://localhost:3000/index.html` in your browser

## Usage Examples

### Movies
- "Inception"
- "The Dark Knight"
- "Interstellar"

### TV Series
- "Breaking Bad Season 1 Episode 1"
- "Game of Thrones Season 5" (gets all episodes)
- "Stranger Things" (shows available seasons)

## API Endpoints

### POST `/api/chat`
Send a message to the agent
```json
{
  "message": "Breaking Bad Season 1",
  "sessionId": "unique_session_id"
}
```

### POST `/api/reset`
Reset conversation history
```json
{
  "sessionId": "unique_session_id"
}
```

### GET `/api/health`
Health check endpoint

## Technologies Used

- **Backend**: Node.js, Express.js
- **AI**: OpenAI Agents SDK with Groq
- **APIs**: TMDB (The Movie Database)
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Styling**: Custom CSS with gradient themes

## Input Guardrails

The application includes input guardrails that:
- ✅ Accept queries about movies and TV series streaming
- ❌ Reject queries about general topics (math, science, etc.)
- ❌ Reject queries about non-streaming media info (reviews, cast, etc.)

## Session Management

Each browser session gets a unique session ID to maintain conversation history. Histories are kept in memory and automatically limited to the last 10 messages per session.
