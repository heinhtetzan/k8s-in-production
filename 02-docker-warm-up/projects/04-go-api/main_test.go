package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestAppRoutes(t *testing.T) {
	mux := setupMux()

	// 1. GET /
	t.Run("GET / returns a greeting", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/", nil)
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d", rec.Code)
		}
		var body map[string]string
		if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
			t.Fatalf("failed to parse json: %v", err)
		}
		if body["message"] != "Hello Go" {
			t.Fatalf("expected message 'Hello Go', got '%s'", body["message"])
		}
	})

	// 2. GET /reverse/{word}
	t.Run("GET /reverse/{word} reverses the word", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/reverse/golang", nil)
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d", rec.Code)
		}
		var body map[string]string
		if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
			t.Fatalf("failed to parse json: %v", err)
		}
		if body["message"] != "gnalog" {
			t.Fatalf("expected message 'gnalog', got '%s'", body["message"])
		}
	})

	// 3. POST /area
	t.Run("POST /area multiplies width by height", func(t *testing.T) {
		payload := bytes.NewBufferString(`{"width": 4, "height": 5}`)
		req := httptest.NewRequest("POST", "/area", payload)
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d", rec.Code)
		}
		var body map[string]float64
		if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
			t.Fatalf("failed to parse json: %v", err)
		}
		if body["message"] != 20 {
			t.Fatalf("expected message 20, got %v", body["message"])
		}
	})

	// 4. POST /area rejects invalid input
	t.Run("POST /area rejects invalid input", func(t *testing.T) {
		payload := bytes.NewBufferString(`{"width": "4", "height": 5}`)
		req := httptest.NewRequest("POST", "/area", payload)
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected status 400, got %d", rec.Code)
		}
	})

	// 5. unknown routes return 404
	t.Run("unknown routes return a 404 message", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/unknown", nil)
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusNotFound {
			t.Fatalf("expected status 404, got %d", rec.Code)
		}
		var body map[string]string
		if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
			t.Fatalf("failed to parse json: %v", err)
		}
		if body["message"] != "Route not found" {
			t.Fatalf("expected 'Route not found', got '%s'", body["message"])
		}
	})
}
