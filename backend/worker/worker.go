package worker

import (
	"context"
	"log"
	"your_module/models"
	"your_module/services"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func StartWorker(db *gorm.DB, rdb *redis.Client, apiKey string) {
	log.Println("Worker started: Waiting for feedback...")

	for {
		result, err := rdb.BLPop(context.Background(), 0, "feedback_queue").Result()
		if err != nil {
			continue
		}

		feedbackID := result[1]
		log.Printf("Processing feedback ID: %s", feedbackID)

		var fb models.Feedback
		db.First(&fb, feedbackID)

		// Call AI Service
		sentiment, category, summary, err := services.AnalyzeFeedback(fb.Content, apiKey)
		if err != nil {
			log.Printf("AI Error: %v", err)
			continue
		}

		// Update DB with processed data
		fb.Sentiment = sentiment
		fb.Category = category
		fb.Summary = summary
		fb.IsProcessed = true
		db.Save(&fb)

		log.Printf("Successfully processed ID: %s", feedbackID)
	}
}
