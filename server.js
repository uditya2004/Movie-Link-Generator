import express from "express";
import cors from "cors";
import { processQuery } from "./index.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(".")); // Serve static files from current directory

// Store conversation histories per session
const sessions = new Map();

// API endpoint to process queries
app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get or create session conversation history
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, []);
    }
    const conversationHistory = sessions.get(sessionId);

    // Process the query
    const result = await processQuery(message, conversationHistory);

    if (result.success) {
      // Update conversation history
      conversationHistory.push({ role: "user", content: message });
      conversationHistory.push({ role: "assistant", content: result.output });

      // Keep only last 10 messages to prevent memory issues
      if (conversationHistory.length > 10) {
        conversationHistory.splice(0, conversationHistory.length - 10);
      }

      return res.json({
        success: true,
        message: result.output,
      });
    } else if (result.rejected) {
      return res.json({
        success: false,
        rejected: true,
        message: result.reason,
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || "An error occurred processing your request",
      });
    }
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// API endpoint to reset conversation
app.post("/api/reset", (req, res) => {
  const { sessionId } = req.body;
  if (sessionId && sessions.has(sessionId)) {
    sessions.delete(sessionId);
  }
  res.json({ success: true, message: "Conversation reset" });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🎬 Movie & TV Series Streaming Server 📺`);
  console.log(`${"=".repeat(60)}`);
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Open http://localhost:${PORT}/index.html in your browser\n`);
  console.log(`${"=".repeat(60)}\n`);
});
