package api

import (
	"context"
	"feedback-funnel/models"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type IngestHandler struct {
	DB    *gorm.DB
	Redis *redis.Client
}

func (h *IngestHandler) IngestFeedback(c *gin.Context) {
	var input struct {
		Content string `json:"content" binding:"required"`
		Source  string `json:"source" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Save to DB immediately as unprocessed
	fb := models.Feedback{
		Content:     input.Content,
		Source:      input.Source,
		IsProcessed: false,
	}
	h.DB.Create(&fb)

	// 2. Push the ID to Redis Queue
	h.Redis.LPush(context.Background(), "feedback_queue", fb.ID)

	// 3. Respond immediately to the user/webhook
	c.JSON(http.StatusAccepted, gin.H{"message": "Feedback received and queued for analysis"})
}
