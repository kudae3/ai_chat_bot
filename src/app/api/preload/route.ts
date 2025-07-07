import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const QDRANT_API_URL = process.env.QDRANT_API_URL!;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY!;
const OLLAMA_EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL!;

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

export async function POST() {
  try {
    const filePath = path.join(process.cwd(), "data", "knowledge.json");
    const fileContents = await fs.readFile(filePath, "utf8");
    const knowledgeBase = JSON.parse(fileContents);

    type KnowledgeItem = { question: string; answer: string };

    const points = await Promise.all(
      (knowledgeBase as KnowledgeItem[]).map(async (item: KnowledgeItem, index: number) => ({
        id: index,
        vector: await getEmbedding(item.question),
        payload: { question: item.question, answer: item.answer },
      }))
    );

    // Upload to Qdrant
    const response = await fetch(`${QDRANT_API_URL}/collections/chatbot/points?wait=true`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "api-key": QDRANT_API_KEY,
      },
      body: JSON.stringify({ points }),
    });

    const qdrantData = await response.json();

    return NextResponse.json({
      message: "Knowledge base uploaded to Qdrant",
      qdrant: qdrantData,
    });
  } catch (error) {
    console.error("Error in preload POST:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal Server Error" },
      { status: 500 }
    );
  }
}