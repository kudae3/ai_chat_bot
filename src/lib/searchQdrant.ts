const QDRANT_API_KEY = process.env.QDRANT_API_KEY!;
const QDRANT_API_URL = process.env.QDRANT_API_URL!;

async function searchQdrant(vector: number[]) {
  const response = await fetch(`${QDRANT_API_URL}/collections/chatbot/points/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": QDRANT_API_KEY,
    },
    body: JSON.stringify({
      query: vector,
      limit: 5,
      score_threshold: 0.7,
      with_payload: true, // include payload in response
    }),
  });
  const data = await response.json();
  console.log("All Qdrant responses:", data?.result?.points);
  
  
  return data?.result?.points;
}

export default searchQdrant;