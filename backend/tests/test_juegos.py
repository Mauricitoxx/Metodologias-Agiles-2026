from fastapi.testclient import TestClient


def test_crear_y_listar_juego_completo(client: TestClient):
    # 1. Crear dificultad y categoría previa
    dif_resp = client.post("/api/dificultades", json={"nombre": "Media"})
    dif_id = dif_resp.json()["id"]

    cat_resp = client.post("/api/categorias-juego", json={"nombre": "Estrategia"})
    cat_id = cat_resp.json()["id"]

    # 2. Crear juego
    juego_payload = {
        "nombre": "Catan",
        "descripcion": "Juego de comercio y colonización de la isla de Catan",
        "cantidad": 3,
        "disponibilidad": True,
        "duracion_min": 75,
        "edad_recomendada": 10,
        "jugadores_min": 3,
        "jugadores_max": 4,
        "video_url": "https://www.youtube.com/watch?v=catan",
        "dificultad_id": dif_id,
        "categoria_ids": [cat_id],
    }
    create_resp = client.post("/api/juegos", json={**juego_payload})
    assert create_resp.status_code == 201
    juego_data = create_resp.json()
    assert juego_data["nombre"] == "Catan"
    assert juego_data["activo"] is True
    assert juego_data["dificultad"]["id"] == dif_id
    assert len(juego_data["categorias"]) == 1
    assert juego_data["categorias"][0]["id"] == cat_id
    juego_id = juego_data["id"]

    # 3. Listar juegos
    list_resp = client.get("/api/juegos")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1
    assert list_resp.json()[0]["id"] == juego_id


def test_validacion_jugadores_min_mayor_que_max(client: TestClient):
    payload = {
        "nombre": "Juego Invalido",
        "duracion_min": 30,
        "edad_recomendada": 8,
        "jugadores_min": 5,
        "jugadores_max": 2,  # Inválido: min > max
    }
    resp = client.post("/api/juegos", json=payload)
    assert resp.status_code == 422


def test_crear_juego_con_dificultad_o_categoria_inexistente(client: TestClient):
    payload = {
        "nombre": "Carcassonne",
        "duracion_min": 40,
        "edad_recomendada": 7,
        "jugadores_min": 2,
        "jugadores_max": 5,
        "dificultad_id": 999,
    }
    resp = client.post("/api/juegos", json=payload)
    assert resp.status_code == 400
    assert "dificultad con id 999 no existe" in resp.json()["detail"]

    # Ahora con categoría inexistente
    payload_cat = {
        "nombre": "Carcassonne",
        "duracion_min": 40,
        "edad_recomendada": 7,
        "jugadores_min": 2,
        "jugadores_max": 5,
        "categoria_ids": [999],
    }
    resp2 = client.post("/api/juegos", json=payload_cat)
    assert resp2.status_code == 400
    assert "categoría con id 999 no existe" in resp2.json()["detail"]


def test_filtros_catalogo_juegos(client: TestClient):
    dif = client.post("/api/dificultades", json={"nombre": "Fácil"}).json()
    cat1 = client.post("/api/categorias-juego", json={"nombre": "Cartas"}).json()
    cat2 = client.post("/api/categorias-juego", json={"nombre": "Tablero"}).json()

    client.post(
        "/api/juegos",
        json={
            "nombre": "Exploding Kittens",
            "duracion_min": 15,
            "edad_recomendada": 7,
            "jugadores_min": 2,
            "jugadores_max": 5,
            "dificultad_id": dif["id"],
            "categoria_ids": [cat1["id"]],
        },
    )
    client.post(
        "/api/juegos",
        json={
            "nombre": "Dixit",
            "duracion_min": 30,
            "edad_recomendada": 8,
            "jugadores_min": 3,
            "jugadores_max": 6,
            "categoria_ids": [cat2["id"]],
        },
    )

    # Filtrar por nombre
    resp_nom = client.get("/api/juegos?nombre=kittens")
    assert resp_nom.status_code == 200
    assert len(resp_nom.json()) == 1
    assert resp_nom.json()[0]["nombre"] == "Exploding Kittens"

    # Filtrar por categoría
    resp_cat = client.get(f"/api/juegos?categoria_id={cat2['id']}")
    assert resp_cat.status_code == 200
    assert len(resp_cat.json()) == 1
    assert resp_cat.json()[0]["nombre"] == "Dixit"

    # Filtrar por dificultad
    resp_dif = client.get(f"/api/juegos?dificultad_id={dif['id']}")
    assert resp_dif.status_code == 200
    assert len(resp_dif.json()) == 1
    assert resp_dif.json()[0]["nombre"] == "Exploding Kittens"


def test_baja_logica_y_detalle_con_reglas(client: TestClient):
    # 1. Crear juego
    juego = client.post(
        "/api/juegos",
        json={
            "nombre": "Virus",
            "duracion_min": 20,
            "edad_recomendada": 8,
            "jugadores_min": 2,
            "jugadores_max": 6,
        },
    ).json()
    juego_id = juego["id"]

    # 2. Agregar reglas
    regla_resp = client.post(
        f"/api/juegos/{juego_id}/reglas",
        json={
            "titulo": "Objetivo",
            "contenido": "Ser el primer jugador en tener 4 órganos sanos",
            "orden": 1,
        },
    )
    assert regla_resp.status_code == 201
    assert regla_resp.json()["titulo"] == "Objetivo"

    # 3. Consultar detalle con reglas
    detalle_resp = client.get(f"/api/juegos/{juego_id}")
    assert detalle_resp.status_code == 200
    detalle = detalle_resp.json()
    assert len(detalle["reglas"]) == 1
    assert detalle["reglas"][0]["titulo"] == "Objetivo"

    # 4. Modificar juego
    update_resp = client.put(
        f"/api/juegos/{juego_id}",
        json={"descripcion": "Divertido juego de cartas de contagio"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["descripcion"] == "Divertido juego de cartas de contagio"

    # 5. Baja lógica
    del_resp = client.delete(f"/api/juegos/{juego_id}")
    assert del_resp.status_code == 204

    # No debe aparecer en catálogo de activos
    assert len(client.get("/api/juegos").json()) == 0

    # No debe encontrarse en detalle estándar
    assert client.get(f"/api/juegos/{juego_id}").status_code == 404

    # Sí debe encontrarse si se incluye inactivos
    inactivo_resp = client.get(f"/api/juegos/{juego_id}?incluir_inactivos=true")
    assert inactivo_resp.status_code == 200
    assert inactivo_resp.json()["activo"] is False
