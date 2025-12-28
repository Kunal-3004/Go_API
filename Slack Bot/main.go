package main

import (
	"fmt"
	"os"

	"github.com/slack-go/slack"
)

func main() {
	botToken := os.Getenv("SLACK_AUTH_TOKEN")
	channelID := "C0A5P1ASRT2"

	api := slack.New(botToken)

	fileArr := []string{"Resume.pdf"}

	for _, fileName := range fileArr {
		file, err := os.Open(fileName)
		if err != nil {
			fmt.Printf("Error opening file %s: %s\n", fileName, err)
			continue
		}
		defer file.Close()

		stat, err := file.Stat()
		if err != nil {
			fmt.Printf("Error getting stats for %s: %s\n", fileName, err)
			continue
		}

		params := slack.UploadFileV2Parameters{
			Channel:  channelID,
			Reader:   file,
			FileSize: int(stat.Size()),
			Filename: fileName,
			Title:    "Kunal's Resume",
		}

		uploadedFile, err := api.UploadFileV2(params)
		if err != nil {
			fmt.Printf("Error uploading %s: %s\n", fileName, err)
			continue
		}

		fmt.Printf("Success! File Name: %s, ID: %s\n", uploadedFile.Title, uploadedFile.ID)
	}
}
