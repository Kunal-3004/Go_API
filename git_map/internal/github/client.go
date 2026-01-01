package github

import (
	"encoding/json"
	"fmt"
	"git_map/internal/tree"
	"net/http"
)

type TreeItem struct {
	Path string `json:"path"`
	Type string `json:"type"`
}

type GitHubResponse struct {
	Tree []TreeItem `json:"tree"`
}

type RepoMetadata struct {
	DefaultBranch string `json:"default_branch"`
}

func GetDetailedRepoStructure(owner, repo, token string) ([]tree.FileMetadata, error) {
	defaultBranch, err := GetDefaultBranch(owner, repo, token)
	if err != nil {
		return nil, fmt.Errorf("failed to get default branch: %v", err)
	}

	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/git/trees/%s?recursive=1", owner, repo, defaultBranch)
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("User-Agent", "GitMap-App")
	if token != "" {
		req.Header.Set("Authorization", "token "+token)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("GitHub API Error: %d", resp.StatusCode)
	}

	var res GitHubResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, err
	}

	var results []tree.FileMetadata
	for _, item := range res.Tree {
		if item.Type == "blob" {
			results = append(results, tree.FileMetadata{
				Path:         item.Path,
				CommitCount:  0,
				LastModified: "",
			})
		}
	}

	return results, nil
}

func GetDefaultBranch(owner, repo, token string) (string, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s", owner, repo)
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("User-Agent", "GitMap-App")
	if token != "" {
		req.Header.Set("Authorization", "token "+token)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("status %d", resp.StatusCode)
	}

	var meta RepoMetadata
	json.NewDecoder(resp.Body).Decode(&meta)
	if meta.DefaultBranch == "" {
		return "main", nil
	}
	return meta.DefaultBranch, nil
}
