import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    // 1. Fetch blogs from DB
    const blogs = await prisma.posts.findMany({
      select: { id: true, title: true, body: true },
    });

    // 2. Generate embeddings and prepare Qdrant points
    const points = await Promise.all(
      blogs.map(async (blog) => ({
        id: Number(blog.id),
        vector: await getEmbedding(`${blog.title}\n${blog.body}`),
        payload: { title: blog.title, body: blog.body },
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