package main

import (
	"encoding/json"
	"html/template"
	"log"
	"net/http"
	"os"

	"git_map/internal/github"
	"git_map/internal/tree"
)

// var (
// 	repoCache = make(map[string][]tree.FileMetadata)
// 	cacheLock sync.RWMutex
// )

func main() {

	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))
	token := os.Getenv("token")
	http.HandleFunc("/", handleHome)

	http.HandleFunc("/visualize", handleVisualize)

	log.Printf("🚀 Server starting on http://localhost:8080/visualize?owner=OWNER&repo=REPO&token=%s\n", token)
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func handleHome(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	tmpl, _ := template.ParseFiles("templates/home.html")
	tmpl.Execute(w, nil)
}

func handleVisualize(w http.ResponseWriter, r *http.Request) {
	owner := r.URL.Query().Get("owner")
	repo := r.URL.Query().Get("repo")
	token := os.Getenv("token")
	// cacheKey := owner + "/" + repo

	// cacheLock.RLock()
	// cachedData, exists := repoCache[cacheKey]
	// cacheLock.RUnlock()

	if token == "" {
		token = r.URL.Query().Get("token")
	}

	branch, _ := github.GetDefaultBranch(owner, repo, token)

	var files []tree.FileMetadata
	var err error

	// if exists {
	// 	files = cachedData
	// } else {
	files, err = github.GetDetailedRepoStructure(owner, repo, token)
	if err != nil {
		http.Error(w, "GitHub Error or Rate Limit", 500)
		return
	}
	// cacheLock.Lock()
	// repoCache[cacheKey] = files
	// cacheLock.Unlock()

	root := tree.BuildTree(files)
	jsonData, _ := json.Marshal(root)

	tmpl, _ := template.ParseFiles("templates/index.html")
	tmpl.Execute(w, map[string]interface{}{
		"Owner":    owner,
		"Repo":     repo,
		"Branch":   branch,
		"TreeJSON": template.JS(jsonData),
	})
}
