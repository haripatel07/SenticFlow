package api

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"feedback-funnel/models"
	"io"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type WebhookHandler struct {
	DB    *gorm.DB
	Redis *redis.Client
}

type GitHubPayload struct {
	Action string `json:"action"`
	Issue  struct {
		Body  string `json:"body"`
		Title string `json:"title"`
	} `json:"issue"`
}

func (h *WebhookHandler) HandleGitHub(c *gin.Context) {
	// 1. Security: Validate GitHub Signature (Optional but highly recommended)
	// GitHub sends an 'X-Hub-Signature-256' header if a secret is set
	if !validateGitHubSignature(c) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid signature"})
		return
	}

	var payload GitHubPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}

	if payload.Action != "opened" && payload.Action != "created" {
		c.JSON(http.StatusOK, gin.H{"status": "ignored"})
		return
	}

	// 2. Reuse our ingestion logic
	content := "Title: " + payload.Issue.Title + "\nBody: " + payload.Issue.Body
	fb := models.Feedback{
		Content:     content,
		Source:      "GitHub",
		IsProcessed: false,
	}
	h.DB.Create(&fb)

	// 3. Queue for AI processing
	h.Redis.LPush(c.Request.Context(), "feedback_queue", fb.ID)

	c.JSON(http.StatusAccepted, gin.H{"status": "queued"})
}

func validateGitHubSignature(c *gin.Context) bool {
	secret := os.Getenv("GITHUB_WEBHOOK_SECRET")
	if secret == "" {
		return true // Skip validation if secret isn't set for local testing
	}

	signature := c.GetHeader("X-Hub-Signature-256")
	body, _ := io.ReadAll(c.Request.Body)
	c.Request.Body = io.NopCloser(bytes.NewBuffer(body))

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	expectedSignature := "sha256=" + hex.EncodeToString(mac.Sum(nil))

	return hmac.Equal([]byte(signature), []byte(expectedSignature))
}
