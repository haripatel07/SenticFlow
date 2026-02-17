package main

import (
	"context"
	"feedback-funnel/api"
	"feedback-funnel/models"
	"feedback-funnel/worker"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Database connection
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=postgres dbname=feedback_db port=5432 sslmode=disable"
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Auto migrate models
	db.AutoMigrate(&models.Feedback{})

	// Redis connection
	redisAddr := os.Getenv("REDIS_URL")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}

	rdb := redis.NewClient(&redis.Options{
		Addr: redisAddr,
	})

	// Test Redis connection
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		log.Fatal("Failed to connect to Redis:", err)
	}

	// Start background worker
	openAIKey := os.Getenv("OPENAI_API_KEY")
	if openAIKey == "" {
		log.Println("Warning: OPENAI_API_KEY not set")
	}
	go worker.StartWorker(db, rdb, openAIKey)

	// Setup Gin router
	r := gin.Default()

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Setup routes
	SetupRoutes(r, db, rdb)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func SetupRoutes(r *gin.Engine, db *gorm.DB, rdb *redis.Client) {
	ingestHandler := &api.IngestHandler{DB: db, Redis: rdb}
	webhookHandler := &api.WebhookHandler{DB: db, Redis: rdb}

	r.POST("/api/ingest", ingestHandler.IngestFeedback)

	// New Webhook Route
	r.POST("/api/webhooks/github", webhookHandler.HandleGitHub)

	// Existing route to get feedback for the dashboard
	r.GET("/api/feedback", func(c *gin.Context) {
		var feedbacks []models.Feedback
		db.Order("created_at desc").Find(&feedbacks)
		c.JSON(200, feedbacks)
	})
}
