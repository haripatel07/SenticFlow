package services

import (
	"context"
	"fmt"
	"strings"

	"github.com/sashabaranov/go-openai"
)

func AnalyzeFeedback(content string, apiKey string) (sentiment, category, summary string, err error) {
	if apiKey == "" {
		// Return default values if no API key is set
		return "neutral", "uncategorized", content, nil
	}

	client := openai.NewClient(apiKey)

	prompt := fmt.Sprintf(`Analyze the following customer feedback. 
	Provide the result in exactly this format:
	Sentiment: [Positive/Negative/Neutral]
	Category: [Bug/Feature Request/Praise]
	Summary: [One sentence summary]

	Feedback: "%s"`, content)

	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model:    openai.GPT3Dot5Turbo,
			Messages: []openai.ChatCompletionMessage{{Role: "user", Content: prompt}},
		},
	)
	if err != nil {
		return "", "", "", err
	}

	// Parse the AI response
	if len(resp.Choices) == 0 {
		return "", "", "", fmt.Errorf("no response from AI")
	}

	responseText := resp.Choices[0].Message.Content
	lines := strings.Split(responseText, "\n")

	sentiment = "neutral"
	category = "uncategorized"
	summary = content

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(strings.ToLower(line), "sentiment:") {
			sentiment = strings.ToLower(strings.TrimSpace(strings.TrimPrefix(line, "Sentiment:")))
			sentiment = strings.TrimSpace(strings.TrimPrefix(sentiment, "sentiment:"))
		} else if strings.HasPrefix(strings.ToLower(line), "category:") {
			category = strings.ToLower(strings.TrimSpace(strings.TrimPrefix(line, "Category:")))
			category = strings.TrimSpace(strings.TrimPrefix(category, "category:"))
			category = strings.ReplaceAll(category, " ", "_")
		} else if strings.HasPrefix(strings.ToLower(line), "summary:") {
			summary = strings.TrimSpace(strings.TrimPrefix(line, "Summary:"))
			summary = strings.TrimSpace(strings.TrimPrefix(summary, "summary:"))
		}
	}

	return sentiment, category, summary, nil
}
