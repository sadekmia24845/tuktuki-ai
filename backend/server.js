/* ==========================================================================
   Tuktuki AI — Backend Server (Express + Google Gemini API)
   ========================================================================== */

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

if (!GEMINI_API_KEY) {
  console.warn(
    "\n⚠️  WARNING: GEMINI_API_KEY is not set in your .env file.\n" +
    "   Create a backend/.env file with: GEMINI_API_KEY=your_key_here\n"
  );
}

/* ---------------- Middleware ---------------- */

app.use(
  cors({
    origin: ALLOWED_ORIGIN === "*" ? "*" : ALLOWED_ORIGIN.split(","),
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
  })
);

app.use(express.json({ limit: "2mb" }));

/* ---------------- Helpers ---------------- */

function buildGeminiContents(message, history) {
  const contents = [];

  if (Array.isArray(history)) {
    history.forEach((item) => {
      if (!item || !item.content) return;
      const role = item.role === "assistant" ? "model" : "user";
      contents.push({
        role,
        parts: [{ text: String(item.content) }]
      });
    });
  }

  contents.push({
    role: "user",
    parts: [{ text: String(message) }]
  });

  return contents;
}

async function callGeminiAPI(contents) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
      ]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    const errMessage =
      (data && data.error && data.error.message) ||
      `Gemini API request failed with status ${response.status}`;
    throw new Error(errMessage);
  }

  const candidate = data.candidates && data.candidates[0];

  if (!candidate) {
    const blockReason =
      data.promptFeedback && data.promptFeedback.blockReason
        ? ` (${data.promptFeedback.blockReason})`
        : "";
    throw new Error(`No response generated from Gemini${blockReason}`);
  }

  const parts = candidate.content && candidate.content.parts;
  const text = Array.isArray(parts)
    ? parts.map((p) => p.text || "").join("")
    : "";

  return text || "I couldn't generate a response for that. Please try rephrasing.";
}

/* ---------------- Routes ---------------- */

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Tuktuki AI backend is running.",
    endpoints: ["POST /chat", "GET /health"]
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", model: GEMINI_MODEL });
});

app.post("/chat", async (req, res) => {
  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "A valid 'message' field is required." });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        error:
          "Server is missing GEMINI_API_KEY. Please configure backend/.env with a valid Gemini API key."
      });
    }

    const contents = buildGeminiContents(message, history);
    const replyText = await callGeminiAPI(contents);

    res.json({ reply: replyText });
  } catch (error) {
    console.error("Error in /chat route:", error.message);
    res.status(500).json({
      error: error.message || "An unexpected error occurred while contacting the AI service."
    });
  }
});

/* ---------------- 404 handler ---------------- */

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

/* ---------------- Global error handler ---------------- */

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
});

/* ---------------- Start server ---------------- */

app.listen(PORT, () => {
  console.log(`\n🐦 Tuktuki AI backend running on http://localhost:${PORT}`);
  console.log(`   Model: ${GEMINI_MODEL}`);
  console.log(`   POST http://localhost:${PORT}/chat\n`);
});
