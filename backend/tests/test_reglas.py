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


def test_hu07_bloquear_regla_con_contenido_vacio_o_espacios(client: TestClient):
    """HU-07: El sistema bloquea guardar si el cuerpo del texto está vacío o solo contiene espacios."""
    juego = client.post(
        "/api/juegos",
        json={
            "nombre": "Catan",
            "duracion_min": 90,
            "edad_recomendada": 10,
            "jugadores_min": 3,
            "jugadores_max": 4,
        },
    ).json()
    juego_id = juego["id"]

    # 1. Intentar crear regla con contenido de solo espacios en blanco
    resp_espacios = client.post(
        "/api/reglas",
        json={
            "titulo": "Comercio",
            "contenido": "   ",
            "orden": 1,
            "juego_id": juego_id,
        },
    )
    assert resp_espacios.status_code == 422
    assert "El cuerpo del texto no puede estar vacío" in resp_espacios.text

    # 2. Intentar crear regla con contenido de cadena vacía
    resp_vacio = client.post(
        "/api/reglas",
        json={
            "titulo": "Construcción",
            "contenido": "",
            "orden": 2,
            "juego_id": juego_id,
        },
    )
    assert resp_vacio.status_code == 422


def test_hu07_bloquear_titulos_duplicados_mismo_juego(client: TestClient):
    """HU-07: No puede haber dos secciones con el mismo título para un mismo juego."""
    juego = client.post(
        "/api/juegos",
        json={
            "nombre": "Carcassonne",
            "duracion_min": 45,
            "edad_recomendada": 7,
            "jugadores_min": 2,
            "jugadores_max": 5,
        },
    ).json()
    juego_id = juego["id"]

    # 1. Crear primera regla
    regla_1 = client.post(
        "/api/reglas",
        json={
            "titulo": "Colocación de Fichas",
            "contenido": "Cada turno se debe robar y colocar una ficha de terreno.",
            "orden": 1,
            "juego_id": juego_id,
        },
    )
    assert regla_1.status_code == 201

    # 2. Intentar crear segunda regla con el mismo título para el mismo juego
    regla_duplicada = client.post(
        "/api/reglas",
        json={
            "titulo": "Colocación de Fichas",
            "contenido": "Intento de registrar una sección con título repetido.",
            "orden": 2,
            "juego_id": juego_id,
        },
    )
    assert regla_duplicada.status_code in (400, 409, 422)