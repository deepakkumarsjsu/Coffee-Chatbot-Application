# Coffee Shop Customer Service Chatbot

Backend for the CMPE 280 coffee shop project. It provides a serverless API that routes customer messages through specialized agents (guard, classification, details, order-taking, recommendations), plus data pipelines for embeddings, recommendations, and Firebase assets.

---

## What This Backend Does
- Filters out off-topic or unsafe queries before they reach business logic.
- Classifies user intent and routes to the correct agent.
- Answers shop/menu questions using Pinecone vector retrieval.
- Guides users through ordering, validates menu items, and can upsell.
- Generates recommendations via Apriori rules and popularity data.
- Packages everything into a Docker image for RunPod serverless deployment.

---

## Repository Layout
```
python_code/
  api/                       # Serverless API code (agents + controller)
    agents/                  # All agent implementations + utilities
    recommendation_objects/  # Precomputed recommendation data
    Dockerfile               # Container build for deployment
    requirements.txt         # API/runtime dependencies
    agent_controller.py      # Orchestration of agents
    main.py                  # RunPod handler entrypoint
    development_code.py      # CLI loop for local testing
  products/                  # Product data, descriptions, images for retrieval
  dataset/                   # CSV datasets for analytics/recs
  build_vector_database.ipynb# Build embeddings + Pinecone index
  firebase_uploader.ipynb    # Upload assets/data to Firebase
  requirements.txt           # Root data/pipeline deps
```

### API Folder (`api/`)
- `main.py` – Exposes `agent_controller.get_response` as the RunPod handler.
- `agent_controller.py` – Message flow: guard → classify → chosen agent response.
- `agents/`
  - `guard_agent.py` – Blocks unrelated/harmful queries.
  - `classification_agent.py` – Routes to details/order/recommendation.
  - `details_agent.py` – Answers shop/menu questions using Pinecone retrieval.
  - `order_taking_agent.py` – Conversational ordering with menu validation and optional recs.
  - `recommendation_agent.py` – Apriori + popularity recommendations; can tailor by category.
  - `utils.py` – LLM chat wrapper, embeddings helper, JSON validation.
  - `agent_protocol.py` – Protocol definition for agent interface.
- `recommendation_objects/` – `apriori_recommendations.json`, `popularity_recommendation.csv`.
- `Dockerfile` – Builds a minimal image ready for RunPod.
- `requirements.txt` – API/runtime packages.
- `development_code.py` – Local CLI harness for quick testing without RunPod.

---

## Setup
1) **Python**: Use Python 3.10+.  
2) **Virtualenv** (recommended):
```bash
python -m venv .venv
.\.venv\Scripts\activate    # Windows
# or
source .venv/bin/activate   # macOS/Linux
```
3) **Install root deps** (data/pipelines):
```bash
pip install -r requirements.txt
```
4) **Install API deps**:
```bash
pip install -r api/requirements.txt
```
5) **Environment variables**: Create `.env` inside `api/`:
```
RUNPOD_TOKEN=...              # API key for your RunPod/OpenAI-compatible endpoint
RUNPOD_CHATBOT_URL=...        # Base URL for chat completions
RUNPOD_EMBEDDING_URL=...      # Base URL for embeddings
MODEL_NAME=...                # Model ID deployed on RunPod
PINECONE_API_KEY=...          # Pinecone API key
PINECONE_INDEX_NAME=...       # Pinecone index name
```

---

## Local Development (CLI Loop)
From `api/`:
```bash
python development_code.py
```
Type messages; the controller runs guard → classification → chosen agent. Assistant replies include a `memory` field indicating the agent and any state (e.g., order progress).

---

## RunPod / Serverless Handler
- `main.py` exposes `agent_controller.get_response`.
- Expected request payload:
```json
{
  "input": {
    "messages": [
      {"role": "user", "content": "Hi, what are your hours?"}
    ]
  }
}
```
- Typical response:
```json
{
  "role": "assistant",
  "content": "...",
  "memory": {
    "agent": "details_agent"
  }
}
```

Deployment steps (high level):
1) Build/push Docker image (see Docker section).  
2) Create RunPod serverless endpoint pointing to the image.  
3) Add `.env` values as RunPod environment variables.  
4) Invoke with the payload shape above.

---

## Docker (API)
From `api/`:
```bash
docker build -t coffee-chatbot-api .
docker run --env-file .env -p 8080:8080 coffee-chatbot-api
```
- Adjust port or entrypoint per hosting needs.
- For production, push the image to a registry (e.g., Docker Hub) and reference it in RunPod.

---

## Data & Pipelines
- `build_vector_database.ipynb`
  - Loads product/about text, generates embeddings with `RUNPOD_EMBEDDING_URL` + `MODEL_NAME`.
  - Pushes vectors to Pinecone (namespace `ns1` by default).
- `firebase_uploader.ipynb`
  - Uploads product assets/data to Firebase storage.
  - Reads `.env` for Firebase credentials if configured.
- `products/`
  - Descriptions and images used for retrieval and recommendations.
- `dataset/`
  - CSVs for analytics and to derive `recommendation_objects/` inputs.
- `recommendation_objects/`
  - `apriori_recommendations.json`: frequent itemset-based recs.
  - `popularity_recommendation.csv`: popularity-ranked products (with categories).

---

## How the Agents Work (at a glance)
1) **GuardAgent**: Filters messages that are not coffee-shop related or unsafe.  
2) **ClassificationAgent**: Chooses `details_agent`, `order_taking_agent`, or `recommendation_agent`.  
3) **DetailsAgent**: Uses Pinecone to retrieve relevant context and answer shop/menu questions.  
4) **OrderTakingAgent**: Conversational ordering; validates against a static menu, keeps order state in `memory`, can trigger recommendations mid-flow.  
5) **RecommendationAgent**: Classifies rec type (apriori, popular, popular by category) and crafts a friendly, concise list of suggestions.  
6) **Utils**: Shared helpers for LLM calls, embeddings, and JSON validation.

---

## Testing Tips
- Provide 2–3 recent messages for better intent classification.
- Ensure `PINECONE_INDEX_NAME` matches the index populated by `build_vector_database.ipynb`.
- If RunPod returns 401/404/500, re-check `.env` values and base URLs (see `api/agents/utils.py` logging).
- In `development_code.py`, press Ctrl+C to exit the loop.

---

## Troubleshooting
- **Auth errors (401/403)**: Verify `RUNPOD_TOKEN`, URLs, and that the model name matches the deployed model.  
- **Vector lookup issues**: Confirm Pinecone index exists, namespace matches (`ns1`), and embeddings were generated with the same model.  
- **JSON parsing errors from agents**: The utils retry/repair JSON; check logs for malformed model outputs.  
- **Docker build failures**: Ensure internet access to download deps; rebuild after cleaning Docker cache if needed.

---

## License
Academic/class project use for CMPE 280. Update if redistributing.

