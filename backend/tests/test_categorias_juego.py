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
