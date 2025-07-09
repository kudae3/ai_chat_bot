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
  console.log("Qdrant match:", match); 

  let answer: string;
  
  if (match) {
    const context = `${match.payload.title ?? ""}\n\n${match.payload.body ?? ""}\n\n${match.payload.guarantee ?? ""}`;
    
    answer = isBurmese
      ? await chatWithOllama(
          ` အောက်ပါအကြောင်းအရာအပေါ်မူတည်၍ မေးခွန်းကို ဖြေပါ။
            အ ေကြာင်းအရာ:\n${context}
             ေမးခွန်း : ${question}`
        )
      : await chatWithOllama(
          ` Based on the following context, answer the user's question.
            Context:\n${context}
            Question: ${question}`
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
