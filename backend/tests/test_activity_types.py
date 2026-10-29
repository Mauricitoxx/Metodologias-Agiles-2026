from datetime import datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.actividad import Actividad, FrecuenciaActividad


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


def create_type(client: TestClient, nombre: str) -> dict:
    response = client.post("/api/activity-types", json={"nombre": nombre})
    assert response.status_code == 201, response.json()
    return response.json()


def test_rename_activity_type(client: TestClient):
    activity_type = create_type(client, "Taler")

    response = client.put(f"/api/activity-types/{activity_type['id']}", json={"nombre": " Taller "})

    assert response.status_code == 200
    assert response.json() == {"id": activity_type["id"], "nombre": "Taller"}


def test_rename_keeping_the_same_name_with_other_case_is_allowed(client: TestClient):
    activity_type = create_type(client, "taller")

    response = client.put(f"/api/activity-types/{activity_type['id']}", json={"nombre": "Taller"})

    assert response.status_code == 200


def test_rename_to_an_existing_name_is_rejected(client: TestClient):
    create_type(client, "Taller")
    torneo = create_type(client, "Torneo")

    response = client.put(f"/api/activity-types/{torneo['id']}", json={"nombre": "TALLER"})

    assert response.status_code == 409


def test_rename_unknown_activity_type_returns_404(client: TestClient):
    assert client.put("/api/activity-types/999", json={"nombre": "Taller"}).status_code == 404


def test_delete_unused_activity_type(client: TestClient):
    activity_type = create_type(client, "Feria")

    response = client.delete(f"/api/activity-types/{activity_type['id']}")

    assert response.status_code == 204
    assert client.get("/api/activity-types").json() == []


def test_delete_activity_type_in_use_is_rejected(client: TestClient, db: Session):
    activity_type = create_type(client, "Torneo")
    db.add(
        Actividad(
            nombre="Torneo de Catan",
            descripcion="d",
            fecha_hora=datetime.now() + timedelta(days=3),
            duracion=60,
            cupo=10,
            imagen="https://example.com/a.png",
            frecuencia=FrecuenciaActividad.unica,
            edad_minima=0,
            tipo_id=activity_type["id"],
        )
    )
    db.commit()

    response = client.delete(f"/api/activity-types/{activity_type['id']}")

    assert response.status_code == 409
    assert response.json()["detail"] == "No se puede eliminar: el tipo está en uso por 1 actividad"


def test_delete_unknown_activity_type_returns_404(client: TestClient):
    assert client.delete("/api/activity-types/999").status_code == 404
