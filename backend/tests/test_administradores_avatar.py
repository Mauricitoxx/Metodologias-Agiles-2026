import pytest

from app.models.administrador import Administrador
from app.schemas.administrador import AVATARES
from app.services.auth import hash_password


@pytest.fixture
def auth_header(client, db):
    db.add(
        Administrador(
            nombre="Super Admin",
            email="superadmin@frikioteca.test",
            password_hash=hash_password("SuperClave2026!"),
        )
    )
    db.commit()
    token = client.post(
        "/api/auth/login", json={"email": "superadmin@frikioteca.test", "password": "SuperClave2026!"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def crear(client, auth_header, **extra):
    return client.post(
        "/api/administradores",
        headers=auth_header,
        json={"nombre": "Kira", "email": "kira@frikioteca.test", "password": "Frikio-AbCd-EfGh", **extra},
    )


def test_sin_avatar_queda_el_escudo(client, auth_header):
    response = crear(client, auth_header)
    assert response.status_code == 201
    assert response.json()["avatar"] == "🛡️"


@pytest.mark.parametrize("avatar", AVATARES)
def test_crear_con_cada_avatar_disponible(client, auth_header, avatar):
    response = crear(client, auth_header, avatar=avatar)
    assert response.status_code == 201
    assert response.json()["avatar"] == avatar


@pytest.mark.parametrize("avatar", ["😀", "", "https://example.com/foto.jpg", "🛡️🛡️"])
def test_rechazar_avatar_fuera_de_la_lista(client, auth_header, avatar):
    response = crear(client, auth_header, avatar=avatar)
    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"][-1] == "avatar"


def test_modificar_conserva_o_cambia_el_avatar(client, auth_header):
    admin_id = crear(client, auth_header, avatar="🎮").json()["id"]

    # Si no se envía, se conserva
    response = client.put(f"/api/administradores/{admin_id}", headers=auth_header, json={"nombre": "Kira V"})
    assert response.json()["avatar"] == "🎮"

    response = client.put(f"/api/administradores/{admin_id}", headers=auth_header, json={"avatar": "👾"})
    assert response.json()["avatar"] == "👾"
    assert client.get(f"/api/administradores/{admin_id}", headers=auth_header).json()["avatar"] == "👾"


def test_la_sesion_devuelve_el_avatar(client, auth_header):
    crear(client, auth_header, avatar="⚡")

    login = client.post("/api/auth/login", json={"email": "kira@frikioteca.test", "password": "Frikio-AbCd-EfGh"})
    assert login.json()["administrador"]["avatar"] == "⚡"

    token = login.json()["access_token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.json()["avatar"] == "⚡"
