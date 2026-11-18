from fastapi.testclient import TestClient

JUEGO = {
    "nombre": "Catan",
    "duracion_min": 90,
    "edad_recomendada": 10,
    "jugadores_min": 3,
    "jugadores_max": 4,
}


def crear_juego(client: TestClient) -> int:
    return client.post("/api/juegos", json=JUEGO).json()["id"]


def crear_regla(client: TestClient, juego_id: int, titulo: str, orden: int):
    return client.post(
        "/api/reglas",
        json={"juego_id": juego_id, "titulo": titulo, "contenido": f"Texto de {titulo}", "orden": orden},
    )


def ordenes(client: TestClient, juego_id: int) -> list[tuple[str, int]]:
    reglas = client.get(f"/api/juegos/{juego_id}/reglas").json()
    return [(regla["titulo"], regla["orden"]) for regla in reglas]


def test_crear_en_un_orden_ocupado_corre_esa_y_las_siguientes(client: TestClient):
    juego_id = crear_juego(client)
    for orden, titulo in enumerate(["Preparación", "Turno", "Fin"], start=1):
        crear_regla(client, juego_id, titulo, orden)

    response = crear_regla(client, juego_id, "Comercio", 2)

    assert response.status_code == 201
    assert response.json()["orden"] == 2
    assert ordenes(client, juego_id) == [
        ("Preparación", 1),
        ("Comercio", 2),
        ("Turno", 3),
        ("Fin", 4),
    ]


def test_crear_en_un_orden_libre_no_mueve_las_demas(client: TestClient):
    juego_id = crear_juego(client)
    crear_regla(client, juego_id, "Preparación", 1)
    crear_regla(client, juego_id, "Fin", 5)

    crear_regla(client, juego_id, "Turno", 3)

    assert ordenes(client, juego_id) == [("Preparación", 1), ("Turno", 3), ("Fin", 5)]


def test_el_corrimiento_no_afecta_a_otros_juegos(client: TestClient):
    juego_id = crear_juego(client)
    otro_id = client.post("/api/juegos", json={**JUEGO, "nombre": "Dixit"}).json()["id"]
    crear_regla(client, juego_id, "Preparación", 1)
    crear_regla(client, otro_id, "Narrador", 1)

    crear_regla(client, juego_id, "Introducción", 1)

    assert ordenes(client, juego_id) == [("Introducción", 1), ("Preparación", 2)]
    assert ordenes(client, otro_id) == [("Narrador", 1)]


def test_si_el_alta_falla_no_se_corre_nada(client: TestClient):
    juego_id = crear_juego(client)
    crear_regla(client, juego_id, "Preparación", 1)
    crear_regla(client, juego_id, "Turno", 2)

    # Título repetido: el alta se rechaza y los órdenes quedan como estaban
    response = crear_regla(client, juego_id, "Turno", 1)

    assert response.status_code == 400
    assert ordenes(client, juego_id) == [("Preparación", 1), ("Turno", 2)]
