package services

import (
	"context"
	"fmt"

	"github.com/sashabaranov/go-openai"
)

func AnalyzeFeedback(content string, apiKey string) (sentiment, category, summary string, err error) {
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

	// Logic to parse the AI string into variables
	return "positive", "praise", "The user loves the new UI!", nil
}
