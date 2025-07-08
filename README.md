# AI Bot Project

This project is an AI-powered chatbot using Ollama, Qdrant, and Prisma. It supports semantic search and context-aware answers using vector embeddings.

## Setup Instructions

### 1. Install dependencies

```bash
npm install
```

### 2. Setup environment variables

Copy the example environment file and edit as needed:

```bash
cp .env.example .env
```

### 3. Install Ollama

Follow instructions at [Ollama](https://ollama.com/) to install Ollama on your machine.

### 4. Download AI models

Pull the required chat and embedding models:

```bash
ollama pull llama3.2
ollama pull nomic-embed-text
```

- `deepseek`, `llama3.2` are chat models.
- `nomic-embed-text` is the embedding model.

### 5. Setup Qdrant

- [Sign up for Qdrant Cloud](https://cloud.qdrant.io/) or run locally.
- Set `QDRANT_API_URL` and `QDRANT_API_KEY` in your `.env`.

#### Create the Qdrant collection

You must create a collection before uploading vectors. Example (adjust URL and API key as needed):

```bash
curl -X PUT "https://<your-qdrant-url>/collections/chatbot" \
  -H "Content-Type: application/json" \
  -H "api-key: <your-qdrant-api-key>" \
  -d '{
    "vectors": {
      "size": 768,
      "distance": "Cosine"
    }
  }'
```

### 6. Setup Prisma

- Make sure your database is running and `DATABASE_URL` is set in `.env`.

```bash
DATABASE_URL="mysql://root:1234@localhost:3306/my_database"
```

- And then, tell Prisma to introspect

```bash
npx prisma db pull
```

- This will read your database schema and generate the models in prisma/schema.prisma

- Generate the Prisma client:

```bash
npx prisma generate
```

### 7. Start services

- Start Ollama:

```bash
ollama serve
```

- Start the Next.js dev server:

```bash
npm run dev
```

## Usage

### Preload knowledge base

To upload your knowledge base to Qdrant, call the preload API:

```bash
curl -X POST http://localhost:3000/api/preload
```

### Ask questions

Send a POST request to the ask API with a JSON body:

```json
{
  "question": "Explain Programming Basic With Javascript Course"
}
```

Example using curl:

```bash
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Explain Programming Basic With Javascript Course"}'
```

## Testing

- Use Postman or curl to test `/api/preload` and `/api/ask` endpoints.
- Ensure that `/api/preload` is called before asking questions, so the vector database is populated.

---

**Note:**  
- Make sure all services (Ollama, Qdrant, database) are running before starting the app.
- Adjust vector size in Qdrant collection to match your embedding model (e.g., 768 for `nomic-embed-text`).
