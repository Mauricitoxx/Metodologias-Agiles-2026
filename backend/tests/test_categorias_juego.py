from fastapi.testclient import TestClient


def test_crear_y_listar_categoria(client: TestClient):
    resp = client.post(
        "/api/categorias-juego",
        json={"nombre": "Estrategia", "descripcion": "Juegos de planificación y táctica"},
    )
    assert resp.status_code == 201
    datos = resp.json()
    assert datos["nombre"] == "Estrategia"
    cat_id = datos["id"]

    resp_list = client.get("/api/categorias-juego")
    assert resp_list.status_code == 200
    assert len(resp_list.json()) == 1
    assert resp_list.json()[0]["id"] == cat_id


def test_crear_categoria_duplicada(client: TestClient):
    client.post("/api/categorias-juego", json={"nombre": "Party"})
    resp = client.post("/api/categorias-juego", json={"nombre": "Party"})
    assert resp.status_code == 400
    assert "Ya existe" in resp.json()["detail"]


def test_obtener_categoria_inexistente(client: TestClient):
    resp = client.get("/api/categorias-juego/999")
    assert resp.status_code == 404


def test_actualizar_y_eliminar_categoria(client: TestClient):
    crear_resp = client.post("/api/categorias-juego", json={"nombre": "Familiar"})
    cat_id = crear_resp.json()["id"]

    update_resp = client.put(
        f"/api/categorias-juego/{cat_id}",
        json={"nombre": "Eurogame", "descripcion": "Gestión de recursos"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["nombre"] == "Eurogame"

    del_resp = client.delete(f"/api/categorias-juego/{cat_id}")
    assert del_resp.status_code == 204

    assert client.get(f"/api/categorias-juego/{cat_id}").status_code == 404


def test_rechazar_nombre_en_uso(client: TestClient):
    client.post(
        "/api/categorias-juego",
        json={"nombre": "Cooperativo", "descripcion": "Juegos donde todos ganan o pierden juntos"},
    )
    # Intento con el mismo nombre en minúsculas
    resp = client.post(
        "/api/categorias-juego",
        json={"nombre": "cooperativo", "descripcion": "Otra descripcion"},
    )
    assert resp.status_code == 400
    assert "nombre ya está en uso" in resp.json()["detail"].lower()


def test_bloquear_eliminacion_categoria_con_juegos(client: TestClient):
    # 1. Crear categoría
    cat_resp = client.post(
        "/api/categorias-juego",
        json={"nombre": "Rol", "descripcion": "Juegos de rol y aventura"},
    )
    assert cat_resp.status_code == 201
    cat_id = cat_resp.json()["id"]

    # 2. Crear un juego asignado a esta categoría
    juego_resp = client.post(
        "/api/juegos",
        json={
            "nombre": "Dungeons & Dragons",
            "descripcion": "Juego de rol de fantasía heroica",
            "duracion_min": 120,
            "edad_recomendada": 12,
            "jugadores_min": 2,
            "jugadores_max": 6,
            "categoria_ids": [cat_id],
        },
    )
    assert juego_resp.status_code == 201

    # 3. Intentar eliminar la categoría asociada al juego
    del_resp = client.delete(f"/api/categorias-juego/{cat_id}")
    assert del_resp.status_code == 400
    assert del_resp.json()["detail"] == "No se puede eliminar esta categoría porque hay juegos usándola"
