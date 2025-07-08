const OLLAMA_EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL!;

async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch("http://localhost:11434/api/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: OLLAMA_EMBEDDING_MODEL, prompt: text }),
  });
  const data = await response.json();
  return data.embedding;
}

export default getEmbedding;