from fastapi import FastAPI
from datetime import datetime

app = FastAPI(
    title="Python Sample REST API",
    description="Sample JSON responses for Docker warmup",
    version="1.0.0"
)

# 1. Root welcome endpoint
@app.get("/")
def read_root():
    return {
        "service": "python-fastapi-sample",
        "framework": "FastAPI",
        "status": "online",
        "timestamp": datetime.utcnow().isoformat()
    }

# 2. Health check endpoint (for Kubernetes probes)
@app.get("/api/health")
def read_health():
    return {
        "status": "healthy",
        "checks": {
            "database": "mock_connected",
            "redis_cache": "mock_connected"
        }
    }

# 3. Sample Users endpoint
@app.get("/api/users")
def read_users():
    return [
        {"id": 1, "username": "sarah_connor", "role": "Lead Architect", "status": "active"},
        {"id": 2, "username": "neo_anderson", "role": "Software Engineer", "status": "active"},
        {"id": 3, "username": "trinity_moss", "role": "Site Reliability Engineer", "status": "active"}
    ]

# 4. Sample Products endpoint
@app.get("/api/products")
def read_products():
    return [
        {"sku": "CLOUD-VM-01", "name": "General Purpose Compute 2 vCPU", "price_per_hr": 0.048},
        {"sku": "CLOUD-DB-02", "name": "High Availability PostgreSQL", "price_per_hr": 0.120},
        {"sku": "CLOUD-NET-03", "name": "VPC NAT Gateway", "price_per_hr": 0.045}
    ]

# 5. Sample Orders endpoint
@app.get("/api/orders")
def read_orders():
    return [
        {"order_id": "ORD-9821", "customer_id": 1, "total": 144.50, "status": "completed"},
        {"order_id": "ORD-9822", "customer_id": 2, "total": 89.00, "status": "processing"},
        {"order_id": "ORD-9823", "customer_id": 3, "total": 230.10, "status": "shipped"}
    ]
