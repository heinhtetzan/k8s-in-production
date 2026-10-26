package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

type AreaRequest struct {
	Width  float64 `json:"width"`
	Height float64 `json:"height"`
}

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func reverseString(s string) string {
	runes := []rune(s)
	for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
		runes[i], runes[j] = runes[j], runes[i]
	}
	return string(runes)
}

func setupMux() *http.ServeMux {
	mux := http.NewServeMux()

	// 1. GET /
	mux.HandleFunc("GET /{$}", func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusOK, map[string]string{
			"message": "Hello Go",
		})
	})

	// 2. GET /reverse/{word}
	mux.HandleFunc("GET /reverse/{word}", func(w http.ResponseWriter, r *http.Request) {
		word := r.PathValue("word")
		respondJSON(w, http.StatusOK, map[string]string{
			"message": reverseString(word),
		})
	})

	// 3. POST /area
	mux.HandleFunc("POST /area", func(w http.ResponseWriter, r *http.Request) {
		var req AreaRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondJSON(w, http.StatusBadRequest, map[string]string{
				"message": "Invalid JSON body",
			})
			return
		}
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"message": req.Width * req.Height,
		})
	})

	// 4. Catch-all fallback for 404 Not Found
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusNotFound, map[string]string{
			"message": "Route not found",
		})
	})

	return mux
}

func main() {
	mux := setupMux()
	port := ":8080"
	fmt.Printf("🚀 Go API listening on http://0.0.0.0%s\n", port)
	if err := http.ListenAndServe(port, mux); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
