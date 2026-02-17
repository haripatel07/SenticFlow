# Feedback Funnel: AI-Powered Data Pipeline

Feedback Funnel is a high-performance, asynchronous data pipeline designed to ingest, analyze, and visualize customer feedback at scale. Instead of performing heavy AI tasks synchronously in request handlers, the system pushes work to a Redis-backed job queue and processes it asynchronously with a worker pool, ensuring sub-second ingestion times and high availability.

Key features

- Asynchronous ingestion with Redis-backed FIFO queue (BLPop)
- Producer-consumer worker pool to offload AI analysis from request cycle
- Secure GitHub webhook handling with HMAC SHA-256 validation
- AI analysis via OpenAI (sentiment, category, and summarization)
- Dashboard built with Next.js + Recharts for visualization

Tech stack

- Backend: Go (Gin) — HTTP API, webhook endpoints, worker
- Frontend: TypeScript, Next.js 14 (App Router), Tailwind CSS
- Database: PostgreSQL
- Queue / Broker: Redis
- AI: OpenAI GPT-4 API

Architecture & workflow

1. Ingestion layer: The API accepts feedback from manual API calls and GitHub webhooks. Incoming requests are validated and stored in the database, then the feedback ID is pushed to a Redis list for processing.

2. Immediate response: The API returns HTTP 202 Accepted after enqueueing the job so clients are not blocked by AI latency.

3. Worker pool: A separate Go process polls Redis with `BLPop` and processes items using goroutines. Workers call OpenAI to run:
	- Sentiment analysis (Positive / Neutral / Negative)
	- Categorization (Bug / Feature Request / Praise)
	- Short summarization (one-line actionable summary)

4. Results are saved back to the database and surfaced to the frontend dashboard.

Getting started

Prerequisites

- Go 1.21+
- Node.js 18+
- PostgreSQL
- Redis (local or Docker)
- OpenAI API key

Backend (local)

1. Change into the backend folder and create a `.env` file from the example:

```bash
cd backend
cp .env.example .env
# Edit .env to set real values (do NOT commit real secrets)
```

2. Run the server:

```bash
go run ./
```

Frontend (local)

1. Install dependencies and run:

```bash
cd frontend
npm install
npm run dev
```

2. Open `http://localhost:3000` (frontend) and `http://localhost:8080` (backend) by default.

Configuration notes

- Keep real secrets (OpenAI key, DB credentials, webhook secret) in local env files like `.env` or `.env.local` and ensure those are ignored by `.gitignore`.
- The project includes `backend/.env.example` as a template for required variables.

Security

- GitHub webhook handling validates `X-Hub-Signature-256` using `GITHUB_WEBHOOK_SECRET` when set.

Future roadmap

- Slack integration: forward high-priority / negative sentiment feedback to a triage channel
- Batch processing: aggregate feedback and batch calls to OpenAI to reduce cost
- Support for self-hosted / custom models (e.g., Llama 3 via Ollama)

License

This project is licensed under the MIT License — see the `LICENSE` file. Replace the copyright holder in `LICENSE`.

