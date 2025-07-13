import chatWithOllama from "@/lib/chatWithOllama";
import getEmbedding from "@/lib/getEmbedding";
import searchQdrant from "@/lib/searchQdrant";
import { NextRequest, NextResponse } from "next/server";

function containsBurmese(text: string) {
  return /[\u1000-\u109F]/.test(text);
}

export async function POST(req: NextRequest) {
  const { question } = await req.json();
  console.log("Received question:", question);

  const isBurmese = containsBurmese(question);
  console.log("Is question in Burmese?", isBurmese);

  // Get user question embedding
  const userVector = await getEmbedding(question);
  console.log("Question vector:", userVector);
  

  // Search in Qdrant
  const match = await searchQdrant(userVector);
  console.log("Qdrant match:", match); // [{}, {}, {}, ....] or just []

  let answer: string;
  

  if (Array.isArray(match) && match.length > 0) {
    let context = "";
    match?.forEach((item) => {
      const entries = Object.entries(item.payload);
      entries.forEach(([key, value]) => {
        context += `${key}: ${value ?? ""}\n\n`;
      });
      context += "----------------------\n"; // Separator for multiple matches
    });

    answer = isBurmese
      ? await chatWithOllama(
          ` ${context}  မေးခွန်း : ${question}. မြန်မာဘာသာဖြင့် ဖြေကြားပါ။`
        )
      : await chatWithOllama(
            `Context:\n${context}
             Question: ${question}`
        );
  } else {
    answer = isBurmese
      ? await chatWithOllama(
          ` မေးခွန်း : ${question}. မြန်မာဘာသာဖြင့် ဖြေကြားပါ။`
        )
      : await chatWithOllama(
            `Question: ${question}`
        );
  }

  return NextResponse.json({
    source: Array.isArray(match) && match.length > 0 ? "qdrant" : "ollama",
    answer,
      similarity: Array.isArray(match) && match.length > 0 ? match[0]?.score ?? null : null,
  });
}
