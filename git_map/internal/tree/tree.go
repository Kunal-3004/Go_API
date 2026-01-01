package tree

import (
	"path"
	"strings"
)

type Node struct {
	Name         string           `json:"name"`
	Children     map[string]*Node `json:"children"`
	CommitCount  int              `json:"commitCount"`
	LastModified string           `json:"lastModified"`
	TimeFactor   float64          `json:"timeFactor"`
}

type FileMetadata struct {
	Path         string
	CommitCount  int
	LastModified string
}

func NewNode(name string) *Node {
	return &Node{Name: name, Children: make(map[string]*Node)}
}

func BuildTree(files []FileMetadata) *Node {
	root := NewNode("root")
	if len(files) == 0 {
		return root
	}

	for _, f := range files {
		current := root
		cleanPath := strings.TrimPrefix(path.Clean(f.Path), "/")
		parts := strings.Split(cleanPath, "/")

		for j, part := range parts {
			if part == "" || part == "." {
				continue
			}
			if _, exists := current.Children[part]; !exists {
				current.Children[part] = NewNode(part)
			}
			current = current.Children[part]
			if j == len(parts)-1 {
				current.CommitCount = 0
				current.LastModified = ""
				current.TimeFactor = 1.0
			}
		}
	}
	return root
}
