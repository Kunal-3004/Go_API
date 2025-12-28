package main

import (
	"os"

	"github.com/Kunal-3004/google-test-to-speech/cmd"
)

func main() {
	cli := &cmd.CLI{ErrStream: os.Stderr}
	os.Exit(cli.Run(os.Args))
}
