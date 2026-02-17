# Feedback Funnel Backend

A Go-based backend service for collecting, analyzing, and processing customer feedback using AI.

## Features

- **Feedback Ingestion API**: Accept feedback from multiple sources (Twitter, Email, App, etc.)
- **GitHub Webhook Integration**: Automatically process GitHub issues as feedback
- **AI-Powered Analysis**: Uses OpenAI to analyze sentiment, categorize, and summarize feedback
- **Async Processing**: Background worker for non-blocking AI analysis
- **Redis Queue**: Efficient job queue for feedback processing
- **PostgreSQL Storage**: Persistent storage for feedback and analysis results

## Prerequisites

- Go 1.21 or higher
- PostgreSQL database
- Redis server
- OpenAI API key

## Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
go mod download
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your actual configuration
```

4. Run database migrations (auto-migrates on startup)

## Configuration

Configure the application using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `host=localhost user=postgres password=postgres dbname=feedback_db port=5432 sslmode=disable` |
| `REDIS_URL` | Redis server address | `localhost:6379` |
| `OPENAI_API_KEY` | OpenAI API key for AI analysis | (required) |
| `GITHUB_WEBHOOK_SECRET` | GitHub webhook secret for validation | (optional) |
| `PORT` | Server port | `8080` |

## Running the Application

### Development
```bash
go run main.go
```

### Production
```bash
go build -o feedback-funnel
./feedback-funnel
```

## API Endpoints

### POST /api/ingest
Ingest new feedback for processing.

**Request Body:**
```json
{
  "content": "The new UI is amazing!",
  "source": "Twitter"
}
```

**Response:**
```json
{
  "message": "Feedback received and queued for analysis"
}
```

### POST /api/webhooks/github
Webhook endpoint for GitHub issues.

**Headers:**
- `X-Hub-Signature-256`: GitHub webhook signature (if secret is configured)

**Request Body:** GitHub webhook payload

### GET /api/feedback
Retrieve all processed feedback, ordered by creation date (newest first).

**Response:**
```json
[
  {
    "ID": 1,
    "CreatedAt": "2026-02-17T20:00:00Z",
    "UpdatedAt": "2026-02-17T20:00:05Z",
    "content": "The new UI is amazing!",
    "source": "Twitter",
    "sentiment": "positive",
    "category": "praise",
    "summary": "User expresses strong appreciation for the new UI",
    "is_processed": true
  }
]
```

## Architecture

The application consists of several components:

1. **API Layer** (`api/`): HTTP handlers for ingestion and webhooks
2. **Models** (`models/`): Data structures and database schemas
3. **Services** (`services/`): Business logic, including AI analysis
4. **Worker** (`worker/`): Background job processor for async AI analysis
5. **Main** (`main.go`): Application entry point and initialization

### Processing Flow

1. Feedback is received via API endpoint or webhook
2. Feedback is saved to PostgreSQL with `is_processed=false`
3. Feedback ID is pushed to Redis queue
4. Background worker picks up the ID from queue
5. Worker calls OpenAI API to analyze the feedback
6. Analysis results (sentiment, category, summary) are saved to database
7. Feedback is marked as `is_processed=true`

## Error Handling

- If OpenAI API key is not set, the service will log a warning and feedback will be marked as "uncategorized" with neutral sentiment
- Failed AI analyses are logged but don't block the ingestion pipeline
- Database and Redis connection errors will prevent server startup

## CORS

The API includes CORS middleware that allows all origins (`*`). In production, configure this to only allow your frontend domain.

## Development

### Testing
```bash
go test ./...
```

### Building
```bash
go build -o feedback-funnel
```

### Linting
```bash
golangci-lint run
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT
