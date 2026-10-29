from fastapi.testclient import TestClient


def test_crear_y_listar_dificultad(client: TestClient):
    # Crear
    resp = client.post("/api/dificultades", json={"nombre": "Fácil"})
    assert resp.status_code == 201
    datos = resp.json()
    assert datos["nombre"] == "Fácil"
    dificultad_id = datos["id"]

    # Listar
    resp_list = client.get("/api/dificultades")
    assert resp_list.status_code == 200
    assert len(resp_list.json()) == 1
    assert resp_list.json()[0]["id"] == dificultad_id


def test_crear_dificultad_duplicada(client: TestClient):
    client.post("/api/dificultades", json={"nombre": "Media"})
    resp = client.post("/api/dificultades", json={"nombre": "Media"})
    assert resp.status_code == 400
    assert "Ya existe" in resp.json()["detail"]


def test_obtener_dificultad_inexistente(client: TestClient):
    resp = client.get("/api/dificultades/999")
    assert resp.status_code == 404


def test_actualizar_y_eliminar_dificultad(client: TestClient):
    crear_resp = client.post("/api/dificultades", json={"nombre": "Dificil"})
    dif_id = crear_resp.json()["id"]

    # Actualizar
    update_resp = client.put(f"/api/dificultades/{dif_id}", json={"nombre": "Muy Difícil"})
    assert update_resp.status_code == 200
    assert update_resp.json()["nombre"] == "Muy Difícil"

    # Eliminar
    del_resp = client.delete(f"/api/dificultades/{dif_id}")
    assert del_resp.status_code == 204

    # Verificar que ya no existe
    assert client.get(f"/api/dificultades/{dif_id}").status_code == 404
