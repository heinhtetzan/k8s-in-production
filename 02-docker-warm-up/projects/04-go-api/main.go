package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"runtime"
	"time"
)

// Helper to write JSON responses
func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func main() {
	mux := http.NewServeMux()

	// 1. Root welcome
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"service":   "go-sample-api",
			"runtime":   runtime.Version(),
			"status":    "running",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		})
	})

	// 2. Health check endpoint (for Kubernetes probes)
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"status":     "healthy",
			"goroutines": runtime.NumGoroutine(),
			"num_cpu":    runtime.NumCPU(),
		})
	})

	// 3. Sample Users endpoint
	mux.HandleFunc("GET /api/users", func(w http.ResponseWriter, r *http.Request) {
		users := []map[string]interface{}{
			{"id": 1, "name": "John Doe", "role": "Platform Engineer", "active": true},
			{"id": 2, "name": "Jane Smith", "role": "Backend Developer", "active": true},
			{"id": 3, "name": "Alex Johnson", "role": "DevOps Architect", "active": false},
		}
		respondJSON(w, http.StatusOK, users)
	})

	// 4. Sample Products endpoint
	mux.HandleFunc("GET /api/products", func(w http.ResponseWriter, r *http.Request) {
		products := []map[string]interface{}{
			{"id": 101, "title": "Cloud Server 4-Core", "price": 40.00, "region": "us-east-1"},
			{"id": 102, "title": "Managed PostgreSQL 16", "price": 65.00, "region": "eu-central-1"},
			{"id": 103, "title": "Redis In-Memory Cache", "price": 15.00, "region": "ap-southeast-1"},
		}
		respondJSON(w, http.StatusOK, products)
	})

	// 5. Sample System Metrics endpoint
	mux.HandleFunc("GET /api/metrics", func(w http.ResponseWriter, r *http.Request) {
		var mem runtime.MemStats
		runtime.ReadMemStats(&mem)
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"memory_alloc_kb": mem.Alloc / 1024,
			"total_alloc_kb":  mem.TotalAlloc / 1024,
			"gc_cycles":       mem.NumGC,
		})
	})

	port := ":8080"
	fmt.Printf("🚀 Go API listening on http://0.0.0.0%s\n", port)
	if err := http.ListenAndServe(port, mux); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
