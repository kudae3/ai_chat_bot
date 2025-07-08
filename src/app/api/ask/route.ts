import { NextRequest, NextResponse } from "next/server";

const QDRANT_API_URL = process.env.QDRANT_API_URL!;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY!;
const OLLAMA_EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL!;
const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL!;

// Get embedding vector from Ollama
async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch("http://localhost:11434/api/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: OLLAMA_EMBEDDING_MODEL, prompt: text }),
  });
  const data = await response.json();
  return data.embedding;
}

// Search for similar vector in Qdrant
async function searchQdrant(vector: number[]) {
  const response = await fetch(`${QDRANT_API_URL}/collections/chatbot/points/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": QDRANT_API_KEY,
    },
    body: JSON.stringify({
      vector,
      top: 1, // top 1 closest match
      score_threshold: 0.75, // similarity threshold
      with_payload: true, // include payload in response
    }),
  });
  const data = await response.json();
  return data.result[0]; // return best match
}

// Get answer from Ollama
async function chatWithOllama(prompt: string): Promise<string> {
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_CHAT_MODEL,
      prompt,
      stream: false,
    }),
  });
  const data = await response.json();
  return data.response.trim();
}

export async function POST(req: NextRequest) {
  const { question } = await req.json();

  // Get user question embedding
  const userVector = await getEmbedding(question);
  console.log("User vector:", userVector);
  

  // Search in Qdrant
  const match = await searchQdrant(userVector);
  console.log("Qdrant match:", match);
  

  let answer: string;
  
  if (match &&  match.score > 0.4) {
    const context = `${match.payload.title}\n${match.payload.body}`;
    answer = await chatWithOllama(
      `Answer the user's question using this context: "${context}". Question: ${question}`
    );
    console.log("Using Qdrant answer:", answer);
    
  } else {
    answer = await chatWithOllama(
      `No context found. Answer the user's question as best you can. Question: ${question}`
    );
    console.log("Using Ollama answer:", answer);
  }

  return NextResponse.json({
    source: match ? "qdrant" : "ollama",
    answer,
    similarity: match ? match.score : null,
  });
}
