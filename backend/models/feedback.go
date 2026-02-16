package models

import "gorm.io/gorm"

type Feedback struct {
	gorm.Model
	Content string `json:"content"`
	Source  string `json:"source"` // e.g., "Twitter", "Email", "App"

	// AI Generated Fields
	Sentiment   string `json:"sentiment"` // "positive", "negative", "neutral"
	Category    string `json:"category"`  // "bug", "feature_request", "praise"
	Summary     string `json:"summary"`
	IsProcessed bool   `json:"is_processed" gorm:"default:false"`
}
