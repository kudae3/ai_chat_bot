import chatWithOllama from "@/lib/chatWithOllama";
import getEmbedding from "@/lib/getEmbedding";
import searchQdrant from "@/lib/searchQdrant";
import { NextRequest, NextResponse } from "next/server";

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
