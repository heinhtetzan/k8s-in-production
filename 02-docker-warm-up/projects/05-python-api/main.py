from fastapi import FastAPI
import os
import sys
import time
import resource

app = FastAPI(
    title="Python FastAPI Sample API",
    description="Stateless container API with static data and resource usage",
    version="1.0.0"
)

start_time = time.time()

# Pure static mock task (stateless - no database or in-memory state manipulation)
STATIC_TASK = {
    "id": 1,
    "title": "Learn Kubernetes in Production",
    "is_done": False,
    "created": "2026-10-26T07:00:00Z"
}

def get_system_usage():
    # ru_maxrss is in KB on Linux
    usage = resource.getrusage(resource.RUSAGE_SELF)
    mem_mb = round(usage.ru_maxrss / 1024, 2)
    return {
        "status": "healthy",
        "uptime_seconds": round(time.time() - start_time, 2),
        "memory_rss_mb": mem_mb,
        "cpu_cores": os.cpu_count() or 1,
        "platform": sys.platform
    }

# 1. GET / for {message, data: {techstack, version}}
@app.get("/")
def get_root():
    return {
        "message": "Service information",
        "data": {
            "techstack": "Python 3.12 / FastAPI",
            "version": "1.0.0"
        }
    }

# 2. POST /health (and GET /health) for {message, data: {system_resource_usage}}
@app.post("/health")
@app.get("/health")
def get_health():
    return {
        "message": "Service is healthy",
        "data": get_system_usage()
    }

# 3. GET /tasks & /tasts (pure static data)
@app.get("/tasks")
@app.get("/tasts")
def get_tasks():
    return {
        "message": "Tasks retrieved successfully",
        "data": [STATIC_TASK]
    }

# 4. POST /tasks & /tasts (pure static data)
@app.post("/tasks")
@app.post("/tasts")
def create_task():
    return {
        "message": "Task created successfully",
        "data": STATIC_TASK
    }

# 5. PUT /tasks & /tasts (pure static data)
@app.put("/tasks")
@app.put("/tasts")
def update_task():
    return {
        "message": "Task updated successfully",
        "data": STATIC_TASK
    }

# 6. PATCH /tasks & /tasts (pure static data)
@app.patch("/tasks")
@app.patch("/tasts")
def patch_task():
    return {
        "message": "Task patched successfully",
        "data": STATIC_TASK
    }

# 7. DELETE /tasks & /tasts (pure static data)
@app.delete("/tasks")
@app.delete("/tasts")
def delete_task():
    return {
        "message": "Task deleted successfully",
        "data": STATIC_TASK
    }
