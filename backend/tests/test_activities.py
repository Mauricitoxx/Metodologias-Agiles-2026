from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.actividad import Actividad, EstadoActividad, FrecuenciaActividad
from app.models.tipo_actividad import TipoActividad

REQUIRED_FIELDS = [
    "nombre",
    "descripcion",
    "fecha_hora",
    "duracion",
    "cupo",
    "imagen",
    "frecuencia",
    "estado",
    "edad_minima",
    "tipo_id",
]


def in_days(days: float) -> datetime:
    return (datetime.now() + timedelta(days=days)).replace(microsecond=0)


@pytest.fixture
def tipos(db: Session) -> dict[str, int]:
    db.add_all([TipoActividad(nombre="Taller"), TipoActividad(nombre="Torneo")])
    db.commit()
    return {t.nombre: t.id for t in db.query(TipoActividad)}


@pytest.fixture
def payload(tipos: dict[str, int]) -> dict:
    return {
        "nombre": "Torneo de Catan",
        "descripcion": "Torneo suizo a 3 rondas",
        "fecha_hora": in_days(5).isoformat(),
        "duracion": 120,
        "cupo": 16,
        "imagen": "https://example.com/catan.png",
        "frecuencia": "unica",
        "estado": "activa",
        "edad_minima": 12,
        "tipo_id": tipos["Torneo"],
    }


def create(client: TestClient, payload: dict, **changes) -> dict:
    response = client.post("/api/activities", json={**payload, **changes})
    assert response.status_code == 201, response.json()
    return response.json()


def edit_payload(activity: dict, **changes) -> dict:
    """Builds a PUT body from a read activity (without estado, so the current one is kept)."""
    body = {field: activity[field] for field in REQUIRED_FIELDS if field not in ("estado", "tipo_id")}
    return {**body, "tipo_id": activity["tipo"]["id"], **changes}


def add_past_activity(db: Session, tipo_id: int, **fields) -> Actividad:
    """Inserts directly in the DB: the API does not allow past dates."""
    defaults = {
        "nombre": "Pasada",
        "descripcion": "d",
        "duracion": 120,
        "cupo": 10,
        "imagen": "https://example.com/a.png",
        "edad_minima": 0,
        "estado": EstadoActividad.activa,
        "frecuencia": FrecuenciaActividad.unica,
    }
    activity = Actividad(tipo_id=tipo_id, **{**defaults, **fields})
    db.add(activity)
    db.commit()
    return activity


def error_fields(response) -> set[str]:
    return {error["loc"][-1] for error in response.json()["detail"]}


# --- HU-15: register and modify activities ---


def test_create_activity(client: TestClient, payload: dict):
    activity = create(client, payload)

    assert activity["nombre"] == "Torneo de Catan"
    assert activity["estado"] == "activa"
    assert activity["tipo"]["nombre"] == "Torneo"
    assert activity["fecha_hora_postergada"] is None


def test_create_with_empty_body_reports_every_required_field(client: TestClient):
    response = client.post("/api/activities", json={})

    assert response.status_code == 422
    assert error_fields(response) == set(REQUIRED_FIELDS)
    assert client.get("/api/activities").json() == []


@pytest.mark.parametrize("field", ["nombre", "descripcion"])
def test_create_with_blank_text_is_rejected(client: TestClient, payload: dict, field: str):
    response = client.post("/api/activities", json={**payload, field: "   "})

    assert response.status_code == 422
    assert error_fields(response) == {field}


def test_create_with_past_date_is_rejected(client: TestClient, payload: dict):
    response = client.post("/api/activities", json={**payload, "fecha_hora": in_days(-1).isoformat()})

    assert response.status_code == 422
    assert error_fields(response) == {"fecha_hora"}


@pytest.mark.parametrize(
    ("field", "value"),
    [("duracion", 0), ("cupo", 0), ("edad_minima", -1), ("imagen", "tutorial en youtube")],
)
def test_create_with_invalid_values_is_rejected(client: TestClient, payload: dict, field, value):
    response = client.post("/api/activities", json={**payload, field: value})

    assert response.status_code == 422
    assert error_fields(response) == {field}


@pytest.mark.parametrize("estado", ["cancelada", "postergada"])
def test_create_cannot_set_action_only_statuses(client: TestClient, payload: dict, estado: str):
    response = client.post("/api/activities", json={**payload, "estado": estado})

    assert response.status_code == 422


def test_create_with_unknown_type_is_rejected(client: TestClient, payload: dict):
    response = client.post("/api/activities", json={**payload, "tipo_id": 999})

    assert response.status_code == 422
    assert error_fields(response) == {"tipo_id"}


def test_moving_start_one_hour_earlier_is_reflected_in_schedule(client: TestClient, payload: dict):
    activity = create(client, payload)
    earlier = datetime.fromisoformat(activity["fecha_hora"]) - timedelta(hours=1)

    response = client.put(
        f"/api/activities/{activity['id']}", json=edit_payload(activity, fecha_hora=earlier.isoformat())
    )

    assert response.status_code == 200
    schedule = client.get("/api/activities/schedule").json()
    assert schedule[0]["fecha_hora"] == earlier.isoformat()


def test_edit_without_status_keeps_cancelled_status(client: TestClient, payload: dict):
    activity = create(client, payload)
    client.patch(f"/api/activities/{activity['id']}/cancel")

    response = client.put(
        f"/api/activities/{activity['id']}", json=edit_payload(activity, descripcion="Nueva")
    )

    assert response.json()["descripcion"] == "Nueva"
    assert response.json()["estado"] == "cancelada"


def test_edit_keeping_a_past_date_is_allowed(client: TestClient, db: Session, tipos):
    activity = add_past_activity(db, tipos["Taller"], fecha_hora=in_days(-3))
    read = client.get(f"/api/activities/{activity.id}").json()

    response = client.put(f"/api/activities/{activity.id}", json=edit_payload(read, cupo=20))

    assert response.status_code == 200
    assert response.json()["cupo"] == 20


def test_edit_to_a_new_past_date_is_rejected(client: TestClient, payload: dict):
    activity = create(client, payload)

    response = client.put(
        f"/api/activities/{activity['id']}",
        json=edit_payload(activity, fecha_hora=in_days(-1).isoformat()),
    )

    assert response.status_code == 422
    assert error_fields(response) == {"fecha_hora"}


def test_reactivating_a_postponed_activity_clears_postponed_date(client: TestClient, payload: dict):
    activity = create(client, payload)
    client.patch(
        f"/api/activities/{activity['id']}/postpone",
        json={"fecha_hora_postergada": in_days(8).isoformat()},
    )

    response = client.put(
        f"/api/activities/{activity['id']}", json=edit_payload(activity, estado="activa")
    )

    assert response.json()["estado"] == "activa"
    assert response.json()["fecha_hora_postergada"] is None


def test_edit_unknown_activity_returns_404(client: TestClient, payload: dict):
    response = client.put("/api/activities/999", json=payload)

    assert response.status_code == 404


# --- HU-16: list, cancel and delete activities ---


def test_list_shows_name_date_type_and_status(client: TestClient, payload: dict):
    create(client, payload)

    activity = client.get("/api/activities").json()[0]

    assert {"nombre", "fecha_hora", "tipo", "estado"} <= activity.keys()


def test_list_includes_every_status(client: TestClient, db: Session, payload: dict, tipos):
    create(client, payload)
    cancelled = create(client, payload, nombre="Cancelada")
    client.patch(f"/api/activities/{cancelled['id']}/cancel")
    create(client, payload, nombre="Inactiva", estado="inactiva")

    estados = {a["estado"] for a in client.get("/api/activities").json()}

    assert estados == {"activa", "cancelada", "inactiva"}


def test_list_sorts_by_date(client: TestClient, payload: dict):
    create(client, payload, nombre="Tercera", fecha_hora=in_days(9).isoformat())
    create(client, payload, nombre="Primera", fecha_hora=in_days(1).isoformat())
    create(client, payload, nombre="Segunda", fecha_hora=in_days(4).isoformat())

    asc = client.get("/api/activities").json()
    desc = client.get("/api/activities", params={"order": "desc"}).json()

    assert [a["nombre"] for a in asc] == ["Primera", "Segunda", "Tercera"]
    assert [a["nombre"] for a in desc] == ["Tercera", "Segunda", "Primera"]


def test_list_sorts_postponed_activities_by_their_new_date(client: TestClient, payload: dict):
    first = create(client, payload, nombre="Postergada", fecha_hora=in_days(1).isoformat())
    create(client, payload, nombre="Normal", fecha_hora=in_days(3).isoformat())
    client.patch(
        f"/api/activities/{first['id']}/postpone",
        json={"fecha_hora_postergada": in_days(6).isoformat()},
    )

    names = [a["nombre"] for a in client.get("/api/activities").json()]

    assert names == ["Normal", "Postergada"]


def test_list_rejects_invalid_order(client: TestClient):
    assert client.get("/api/activities", params={"order": "random"}).status_code == 422


def test_search_by_name_is_case_insensitive(client: TestClient, payload: dict):
    create(client, payload, nombre="Torneo de Catan")
    create(client, payload, nombre="Taller de pintura")

    response = client.get("/api/activities", params={"search": "CATAN"})

    assert [a["nombre"] for a in response.json()] == ["Torneo de Catan"]


def test_filter_by_type(client: TestClient, payload: dict, tipos):
    create(client, payload, nombre="Torneo", tipo_id=tipos["Torneo"])
    create(client, payload, nombre="Taller", tipo_id=tipos["Taller"])

    response = client.get("/api/activities", params={"tipo_id": tipos["Taller"]})

    assert [a["nombre"] for a in response.json()] == ["Taller"]


def test_filter_by_status(client: TestClient, payload: dict):
    create(client, payload, nombre="Activa")
    cancelled = create(client, payload, nombre="Cancelada")
    client.patch(f"/api/activities/{cancelled['id']}/cancel")

    response = client.get("/api/activities", params={"estado": "cancelada"})

    assert [a["nombre"] for a in response.json()] == ["Cancelada"]


def test_cancelled_activity_is_shown_as_cancelled_to_clients(client: TestClient, payload: dict):
    activity = create(client, payload)

    response = client.patch(f"/api/activities/{activity['id']}/cancel")

    assert response.json()["estado"] == "cancelada"
    schedule = client.get("/api/activities/schedule").json()
    assert [(a["id"], a["estado"]) for a in schedule] == [(activity["id"], "cancelada")]


def test_cancel_twice_is_rejected(client: TestClient, payload: dict):
    activity = create(client, payload)
    client.patch(f"/api/activities/{activity['id']}/cancel")

    response = client.patch(f"/api/activities/{activity['id']}/cancel")

    assert response.status_code == 409


def test_cancel_inactive_activity_is_rejected(client: TestClient, payload: dict):
    activity = create(client, payload, estado="inactiva")

    assert client.patch(f"/api/activities/{activity['id']}/cancel").status_code == 409


def test_delete_removes_activity_permanently(client: TestClient, db: Session, payload: dict):
    activity = create(client, payload)

    response = client.delete(f"/api/activities/{activity['id']}")

    assert response.status_code == 204
    assert client.get(f"/api/activities/{activity['id']}").status_code == 404
    assert db.get(Actividad, activity["id"]) is None


def test_delete_unknown_activity_returns_404(client: TestClient):
    assert client.delete("/api/activities/999").status_code == 404


# --- Postpone ---


def test_postpone_activity(client: TestClient, payload: dict):
    activity = create(client, payload)
    new_date = in_days(8)

    response = client.patch(
        f"/api/activities/{activity['id']}/postpone",
        json={"fecha_hora_postergada": new_date.isoformat()},
    )

    assert response.status_code == 200
    assert response.json()["estado"] == "postergada"
    assert response.json()["fecha_hora_postergada"] == new_date.isoformat()
    assert response.json()["fecha_hora"] == activity["fecha_hora"]


def test_postpone_to_a_date_before_the_original_is_rejected(client: TestClient, payload: dict):
    activity = create(client, payload)

    response = client.patch(
        f"/api/activities/{activity['id']}/postpone",
        json={"fecha_hora_postergada": in_days(1).isoformat()},
    )

    assert response.status_code == 422
    assert error_fields(response) == {"fecha_hora_postergada"}


def test_postpone_cancelled_activity_is_rejected(client: TestClient, payload: dict):
    activity = create(client, payload)
    client.patch(f"/api/activities/{activity['id']}/cancel")

    response = client.patch(
        f"/api/activities/{activity['id']}/postpone",
        json={"fecha_hora_postergada": in_days(8).isoformat()},
    )

    assert response.status_code == 409


# --- Public schedule ---


def test_schedule_hides_inactive_and_finished_activities(
    client: TestClient, db: Session, payload: dict, tipos
):
    create(client, payload, nombre="Visible")
    create(client, payload, nombre="Inactiva", estado="inactiva")
    add_past_activity(db, tipos["Taller"], nombre="Terminada", fecha_hora=in_days(-2))
    add_past_activity(db, tipos["Taller"], nombre="En curso", fecha_hora=datetime.now() - timedelta(minutes=30))

    names = [a["nombre"] for a in client.get("/api/activities/schedule").json()]

    assert names == ["En curso", "Visible"]


def test_schedule_search_and_type_filter(client: TestClient, payload: dict, tipos):
    create(client, payload, nombre="Torneo de Catan", tipo_id=tipos["Torneo"])
    create(client, payload, nombre="Taller de Catan", tipo_id=tipos["Taller"])
    create(client, payload, nombre="Torneo de Magic", tipo_id=tipos["Torneo"])

    response = client.get(
        "/api/activities/schedule", params={"search": "catan", "tipo_id": tipos["Torneo"]}
    )

    assert [a["nombre"] for a in response.json()] == ["Torneo de Catan"]


def test_public_detail_hides_inactive_activity(client: TestClient, payload: dict):
    active = create(client, payload)
    inactive = create(client, payload, estado="inactiva")

    assert client.get(f"/api/activities/schedule/{active['id']}").status_code == 200
    assert client.get(f"/api/activities/schedule/{inactive['id']}").status_code == 404


# --- Recurring activities ---


def test_finished_weekly_activity_moves_to_next_week(client: TestClient, db: Session, tipos):
    start = in_days(-10)
    activity = add_past_activity(
        db, tipos["Torneo"], fecha_hora=start, frecuencia=FrecuenciaActividad.semanal
    )

    read = client.get(f"/api/activities/{activity.id}").json()

    new_date = datetime.fromisoformat(read["fecha_hora"])
    assert new_date > datetime.now()
    assert new_date - start == timedelta(weeks=2)  # 10 days ago -> 4 days from now
    assert read["estado"] == "activa"


def test_postponed_weekly_activity_returns_to_its_usual_day(client: TestClient, db: Session, tipos):
    start = in_days(-20)
    activity = add_past_activity(
        db,
        tipos["Torneo"],
        fecha_hora=start,
        fecha_hora_postergada=start + timedelta(days=2),
        estado=EstadoActividad.postergada,
        frecuencia=FrecuenciaActividad.semanal,
    )

    read = client.get(f"/api/activities/{activity.id}").json()

    new_date = datetime.fromisoformat(read["fecha_hora"])
    assert new_date.weekday() == start.weekday()
    assert read["estado"] == "activa"
    assert read["fecha_hora_postergada"] is None


def test_cancelled_weekly_activity_does_not_move(client: TestClient, db: Session, tipos):
    start = in_days(-10)
    activity = add_past_activity(
        db,
        tipos["Torneo"],
        fecha_hora=start,
        estado=EstadoActividad.cancelada,
        frecuencia=FrecuenciaActividad.semanal,
    )

    read = client.get(f"/api/activities/{activity.id}").json()

    assert read["fecha_hora"] == start.isoformat()
    assert read["estado"] == "cancelada"
