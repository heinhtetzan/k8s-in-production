from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_get_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello Python"}

def test_get_reverse():
    response = client.get("/reverse/fastapi")
    assert response.status_code == 200
    assert response.json() == {"message": "ipatsaf"}

def test_post_area():
    response = client.post("/area", json={"width": 4, "height": 5})
    assert response.status_code == 200
    assert response.json() == {"message": 20.0}

def test_post_area_invalid():
    response = client.post("/area", json={"width": "not-a-number", "height": 5})
    assert response.status_code == 422

def test_unknown_route():
    response = client.get("/unknown")
    assert response.status_code == 404
    assert response.json() == {"message": "Route not found"}
