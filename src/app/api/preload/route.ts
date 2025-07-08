import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import getEmbedding from "@/lib/getEmbedding";

const QDRANT_API_URL = process.env.QDRANT_API_URL!;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY!;

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