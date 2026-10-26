# 05-python-api: Python FastAPI REST API

An asynchronous REST API built with [FastAPI](https://fastapi.tiangolo.com/), [Pydantic](https://docs.pydantic.dev/), and [Uvicorn](https://www.uvicorn.org/) running inside a hardened, non-root Debian Slim container.

---

## 📁 Project Structure

```text
05-python-api/
├── Dockerfile          # Python 3.12-slim container with non-root user
├── requirements.txt    # Dependencies (fastapi, uvicorn, pydantic, pytest, httpx)
├── main.py             # FastAPI routes, schemas, and custom 404 handler
├── test_main.py        # Automated test suite using pytest and TestClient
├── .dockerignore       # Excludes __pycache__, .pytest_cache, virtualenvs
└── README.md           # This guide
```

---

## 📡 API Endpoints Specification

| Method | Endpoint | Request Payload | Response Example | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | *None* | `{"message":"Hello Python"}` | Root greeting |
| `GET` | `/reverse/{word}` | Path param (`{word}`) | `{"message":"nohtyp"}` | Reverses characters |
| `POST` | `/area` | `{"width": 12, "height": 6}` | `{"message": 72.0}` | Area calculation |
| *Any* | `/*` (Fallback) | *None* | `{"message":"Route not found"}` | Custom 404 handler |
| `GET` | `/docs` | *None* | Interactive Swagger UI | Interactive API documentation |

---

## 🐳 Dockerfile Explained

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Cache Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Run container as non-root user for security
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

* **Slim Base**: `python:3.12-slim` strips unnecessary development packages while maintaining glibc compatibility.
* **`--no-cache-dir`**: Avoids storing temporary wheel caches in the image layer.
* **Non-Root Execution**: Creates and switches to unprivileged `appuser`.
* **Host Binding**: Uvicorn binds to `0.0.0.0` so traffic forwarded through Docker's bridge network is accepted.

---

## 🛠️ Step 1: Build the Docker Image

From this directory (`02-docker-warm-up/projects/05-python-api`):

```bash
docker build -t my-python-api:1.0 .
```

---

## 🚀 Step 2: Run the Docker Container

```bash
docker run -d -p 8000:8000 --name python-api my-python-api:1.0
```

### Run Flags Explained:
* `-d`: Run in background (detached).
* `-p 8000:8000`: Maps host port `8000` to container port `8000`.
* `--name python-api`: Sets container name to `python-api`.

---

## 🧪 Step 3: Test with `curl` & Browser

### 1. Interactive Swagger UI
Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser to inspect the OpenAPI schema and interactively test endpoints.

### 2. Verify with `curl`
```bash
# 1. Root greeting
curl http://localhost:8000/

# 2. String reversal
curl http://localhost:8000/reverse/production

# 3. Valid Area Calculation
curl -X POST http://localhost:8000/area \
  -H "Content-Type: application/json" \
  -d '{"width": 12, "height": 6}'

# 4. Invalid Area Calculation (Pydantic validation failure returns HTTP 422)
curl -i -X POST http://localhost:8000/area \
  -H "Content-Type: application/json" \
  -d '{"width": "bad", "height": 6}'

# 5. Non-existent Route (Returns HTTP 404)
curl -i http://localhost:8000/unknown-path
```

---

## 🚦 Step 4: Run Automated Tests

The project includes test cases using `pytest` and Starlette's `TestClient`:

```bash
# If Python and dependencies are installed on your host:
pytest -v

# Or run tests directly inside a Docker container:
docker run --rm -v "$(pwd):/app" -w /app python:3.12-slim sh -c "pip install -r requirements.txt && pytest -v"
```

---

## 🛑 Step 5: Container Management

```bash
# Check container status
docker ps --filter "name=python-api"

# View access logs
docker logs -f python-api

# Enter container shell
docker exec -it python-api sh

# Stop and remove container
docker stop python-api
docker rm python-api
```
