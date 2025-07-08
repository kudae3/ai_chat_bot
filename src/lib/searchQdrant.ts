const QDRANT_API_KEY = process.env.QDRANT_API_KEY!;
const QDRANT_API_URL = process.env.QDRANT_API_URL!;

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

export default searchQdrant;