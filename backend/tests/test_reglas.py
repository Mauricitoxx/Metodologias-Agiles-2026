from fastapi.testclient import TestClient


def test_crud_regla(client: TestClient):
    # 1. Crear juego
    juego = client.post(
        "/api/juegos",
        json={
            "nombre": "Ajedrez",
            "duracion_min": 60,
            "edad_recomendada": 6,
            "jugadores_min": 2,
            "jugadores_max": 2,
        },
    ).json()
    juego_id = juego["id"]

    # 2. Crear regla vía endpoint directo /api/reglas
    resp = client.post(
        "/api/reglas",
        json={
            "titulo": "Movimiento del Peón",
            "contenido": "Avanza una casilla hacia adelante",
            "orden": 1,
            "juego_id": juego_id,
        },
    )
    assert resp.status_code == 201
    regla_id = resp.json()["id"]

    # 3. Obtener regla por id
    get_resp = client.get(f"/api/reglas/{regla_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["titulo"] == "Movimiento del Peón"

    # 4. Actualizar regla
    put_resp = client.put(
        f"/api/reglas/{regla_id}",
        json={"contenido": "Avanza una casilla o dos en su primer movimiento"},
    )
    assert put_resp.status_code == 200
    assert "dos en su primer movimiento" in put_resp.json()["contenido"]

    # 5. Eliminar regla
    del_resp = client.delete(f"/api/reglas/{regla_id}")
    assert del_resp.status_code == 204
    assert client.get(f"/api/reglas/{regla_id}").status_code == 404
