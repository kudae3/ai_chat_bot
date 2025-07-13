const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL!;

async function chatWithOllama(prompt: string): Promise<string> {
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_CHAT_MODEL,
      prompt: `Think of yourself as the Ai Assistant of Creative Coder Myanmar Learning Platform, https://creativecodermm.com/, ${prompt}`,
      stream: false,
    }),
  });
  const data = await response.json();
  return data.response.trim();
}

export default chatWithOllama;