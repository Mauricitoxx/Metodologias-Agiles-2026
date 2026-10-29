import pytest
from app.models.administrador import Administrador
from app.services.auth import hash_password


@pytest.fixture
def auth_header(client, db):
    admin = Administrador(
        nombre="Super Admin",
        email="superadmin@frikioteca.test",
        password_hash=hash_password("SuperClave2026!"),
        activo=True,
    )
    db.add(admin)
    db.commit()

    resp = client.post("/api/auth/login", json={"email": "superadmin@frikioteca.test", "password": "SuperClave2026!"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_listar_administradores(client, auth_header):
    resp = client.get("/api/administradores", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1
    assert data[0]["email"] == "superadmin@frikioteca.test"
    assert "password_hash" not in data[0]


def test_crear_administrador_y_login_con_clave_temporal(client, auth_header):
    # 1. Crear nuevo administrador
    payload = {
        "nombre": "Kira Valkyrie",
        "email": "kira.v@lafrikioteca.com",
        "password": "Frikio-TempKey123",
    }
    resp = client.post("/api/administradores", json=payload, headers=auth_header)
    assert resp.status_code == 201
    created = resp.json()
    assert created["nombre"] == "Kira Valkyrie"
    assert created["email"] == "kira.v@lafrikioteca.com"
    assert created["activo"] is True
    assert "password_hash" not in created

    # 2. Iniciar sesión directamente con la clave temporal
    login_resp = client.post("/api/auth/login", json={
        "email": "kira.v@lafrikioteca.com",
        "password": "Frikio-TempKey123",
    })
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert login_data["administrador"]["email"] == "kira.v@lafrikioteca.com"
    assert "access_token" in login_data


def test_crear_administrador_email_duplicado(client, auth_header):
    payload = {
        "nombre": "Admin Duplicado",
        "email": "superadmin@frikioteca.test",
        "password": "Frikio-Clave123",
    }
    resp = client.post("/api/administradores", json=payload, headers=auth_header)
    assert resp.status_code == 400
    assert "Ya existe un administrador" in resp.json()["detail"]


def test_desactivar_y_activar_administrador(client, auth_header):
    # Crear un segundo admin para poder desactivarlo
    resp = client.post("/api/administradores", json={
        "nombre": "Staff Auxiliar",
        "email": "auxiliar@frikioteca.test",
        "password": "Frikio-Clave123",
    }, headers=auth_header)
    admin_id = resp.json()["id"]

    # Desactivar
    resp_des = client.patch(f"/api/administradores/{admin_id}/desactivar", headers=auth_header)
    assert resp_des.status_code == 200
    assert resp_des.json()["activo"] is False

    # Intento de login mientras está inactivo debe fallar
    login_fail = client.post("/api/auth/login", json={
        "email": "auxiliar@frikioteca.test",
        "password": "Frikio-Clave123",
    })
    assert login_fail.status_code == 401

    # Reactivar
    resp_act = client.patch(f"/api/administradores/{admin_id}/activar", headers=auth_header)
    assert resp_act.status_code == 200
    assert resp_act.json()["activo"] is True

    # Login ahora debe funcionar
    login_ok = client.post("/api/auth/login", json={
        "email": "auxiliar@frikioteca.test",
        "password": "Frikio-Clave123",
    })
    assert login_ok.status_code == 200


def test_no_se_puede_desactivar_al_unico_administrador_activo(client, auth_header):
    # Obtenemos el id del superadmin
    me_resp = client.get("/api/auth/me", headers=auth_header)
    me_id = me_resp.json()["id"]

    resp = client.patch(f"/api/administradores/{me_id}/desactivar", headers=auth_header)
    assert resp.status_code == 400
    assert "único administrador activo" in resp.json()["detail"]
