from fastapi.testclient import TestClient


def test_create_and_list_activity_types_sorted(client: TestClient):
    for nombre in ("Torneo", "Feria", "Taller"):
        assert client.post("/api/activity-types", json={"nombre": nombre}).status_code == 201

    response = client.get("/api/activity-types")

    assert [t["nombre"] for t in response.json()] == ["Feria", "Taller", "Torneo"]


def test_duplicate_activity_type_is_rejected_ignoring_case_and_spaces(client: TestClient):
    client.post("/api/activity-types", json={"nombre": "Taller"})

    response = client.post("/api/activity-types", json={"nombre": "  taller "})

    assert response.status_code == 409
    assert response.json()["detail"] == "El tipo de actividad ya existe"


def test_empty_activity_type_name_is_rejected(client: TestClient):
    response = client.post("/api/activity-types", json={"nombre": "   "})

    assert response.status_code == 422
