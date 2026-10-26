from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import BaseModel

app = FastAPI(title="Python FastAPI API", version="1.0.0")

class AreaRequest(BaseModel):
    width: float
    height: float

# 1. GET /
@app.get("/")
def get_root():
    return {"message": "Hello Python"}

# 2. GET /reverse/{word}
@app.get("/reverse/{word}")
def reverse_word(word: str):
    return {"message": word[::-1]}

# 3. POST /area
@app.post("/area")
def calculate_area(body: AreaRequest):
    return {"message": body.width * body.height}

# 4. Custom 404 handler for Route not found
@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404:
        return JSONResponse(status_code=404, content={"message": "Route not found"})
    return JSONResponse(status_code=exc.status_code, content={"message": str(exc.detail)})
