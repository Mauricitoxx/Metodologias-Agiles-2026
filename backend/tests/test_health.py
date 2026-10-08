from fastapi.testclient import TestClient


def test_health(client: TestClient):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_db(client: TestClient):
    response = client.get("/api/health/db")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


def test_cors_permite_frontend(client: TestClient):
    response = client.get("/api/health", headers={"Origin": "http://localhost:5173"})
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_cors_rechaza_origen_desconocido(client: TestClient):
    response = client.get("/api/health", headers={"Origin": "http://otro-sitio.com"})
    assert "access-control-allow-origin" not in response.headers
