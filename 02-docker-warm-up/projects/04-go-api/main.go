package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"runtime"
	"time"
)

type Task struct {
	ID      int    `json:"id"`
	Title   string `json:"title"`
	IsDone  bool   `json:"is_done"`
	Created string `json:"created"`
}

var startTime = time.Now()

// Pure static mock task (stateless - no database or in-memory state manipulation)
var staticTask = Task{
	ID:      1,
	Title:   "Learn Kubernetes in Production",
	IsDone:  false,
	Created: "2026-10-26T07:00:00Z",
}

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func getSystemUsage() map[string]interface{} {
	var mem runtime.MemStats
	runtime.ReadMemStats(&mem)

	return map[string]interface{}{
		"status":          "healthy",
		"uptime_seconds":  int(time.Since(startTime).Seconds()),
		"memory_alloc_mb": float64(mem.Alloc) / 1024 / 1024,
		"memory_sys_mb":   float64(mem.Sys) / 1024 / 1024,
		"goroutines":      runtime.NumGoroutine(),
		"cpu_cores":       runtime.NumCPU(),
		"os_arch":         runtime.GOOS + "/" + runtime.GOARCH,
	}
}

func main() {
	mux := http.NewServeMux()

	// 1. GET / for {message, data: {techstack, version}}
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"message": "Service information",
			"data": map[string]interface{}{
				"techstack": "Go 1.22 net/http",
				"version":   "1.0.0",
			},
		})
	})

	// 2. POST /health (and GET /health) for {message, data: {system_resource_usage}}
	healthHandler := func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"message": "Service is healthy",
			"data":    getSystemUsage(),
		})
	}
	mux.HandleFunc("POST /health", healthHandler)
	mux.HandleFunc("GET /health", healthHandler)

	// 3. /tasks and /tasts (GET) - pure static data
	handleGetTasks := func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"message": "Tasks retrieved successfully",
			"data":    []Task{staticTask},
		})
	}
	mux.HandleFunc("GET /tasks", handleGetTasks)
	mux.HandleFunc("GET /tasts", handleGetTasks)

	// 4. /tasks and /tasts (POST) - pure static data
	handlePostTasks := func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"message": "Task created successfully",
			"data":    staticTask,
		})
	}
	mux.HandleFunc("POST /tasks", handlePostTasks)
	mux.HandleFunc("POST /tasts", handlePostTasks)

	// 5. /tasks and /tasts (PUT) - pure static data
	handlePutTasks := func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"message": "Task updated successfully",
			"data":    staticTask,
		})
	}
	mux.HandleFunc("PUT /tasks", handlePutTasks)
	mux.HandleFunc("PUT /tasts", handlePutTasks)

	// 6. /tasks and /tasts (PATCH) - pure static data
	handlePatchTasks := func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"message": "Task patched successfully",
			"data":    staticTask,
		})
	}
	mux.HandleFunc("PATCH /tasks", handlePatchTasks)
	mux.HandleFunc("PATCH /tasts", handlePatchTasks)

	// 7. /tasks and /tasts (DELETE) - pure static data
	handleDeleteTasks := func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"message": "Task deleted successfully",
			"data":    staticTask,
		})
	}
	mux.HandleFunc("DELETE /tasks", handleDeleteTasks)
	mux.HandleFunc("DELETE /tasts", handleDeleteTasks)

	port := ":8080"
	fmt.Printf("🚀 Go API listening on http://0.0.0.0%s\n", port)
	if err := http.ListenAndServe(port, mux); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
