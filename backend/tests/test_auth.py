from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select

from app.models.administrador import Administrador, SesionAdministrador
from app.services.auth import hash_password, verify_password


@pytest.fixture
def admin(db):
    admin = Administrador(nombre="Bautista", email="admin@frikioteca.test", password_hash=hash_password("UnaClaveSegura2026!"))
    db.add(admin)
    db.commit()
    return admin


def login(client, email="admin@frikioteca.test", password="UnaClaveSegura2026!"):
    return client.post("/api/auth/login", json={"email": email, "password": password})


def test_login_me_logout(client, db, admin):
    response = login(client, " ADMIN@FRIKIOTECA.TEST ")
    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    data = response.json()
    assert data["administrador"] == {"id": admin.id, "nombre": "Bautista", "email": admin.email}
    assert "password_hash" not in data["administrador"]
    token = data["access_token"]
    stored = db.scalar(select(SesionAdministrador))
    assert stored.token_hash != token
    headers = {"Authorization": f"Bearer {token}"}
    assert client.get("/api/auth/me", headers=headers).json()["id"] == admin.id
    assert client.post("/api/auth/logout", headers=headers).status_code == 204
    assert client.get("/api/auth/me", headers=headers).status_code == 401


@pytest.mark.parametrize("email,password", [("admin@frikioteca.test", "incorrecta"), ("nadie@frikioteca.test", "UnaClaveSegura2026!")])
def test_invalid_credentials(client, db, admin, email, password):
    assert login(client, email, password).status_code == 401
    assert db.scalar(select(SesionAdministrador)) is None


def test_inactive_admin(client, db, admin):
    admin.activo = False
    db.commit()
    assert login(client).status_code == 401


def test_expired_and_disabled_sessions(client, db, admin):
    token = login(client).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    admin.activo = False
    db.commit()
    assert client.get("/api/auth/me", headers=headers).status_code == 401
    admin.activo = True
    stored = db.scalar(select(SesionAdministrador))
    stored.expires_at = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(seconds=1)
    db.commit()
    assert client.get("/api/auth/me", headers=headers).status_code == 401


def test_missing_and_fake_token(client):
    assert client.get("/api/auth/me").status_code in (401, 403)
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer inventado"}).status_code == 401


@pytest.mark.parametrize("payload", [{}, {"email": "sin-correo", "password": "abc"}, {"email": "a@b.test", "password": ""}, {"email": "a@b.test", "password": "x" * 257}])
def test_invalid_request(client, payload):
    assert client.post("/api/auth/login", json=payload).status_code == 422


def test_password_hash_is_salted():
    first = hash_password("UnaClaveSegura2026!")
    assert first != hash_password("UnaClaveSegura2026!")
    assert verify_password("UnaClaveSegura2026!", first)
    assert not verify_password("incorrecta", first)
    assert not verify_password("abc", "hash-invalido")
