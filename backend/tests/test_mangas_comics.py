from fastapi.testclient import TestClient


def manga_data() -> dict:
    """Datos de prueba para crear un manga."""
    return {
        "title": "Spy x Family",
        "volume_number": 1,
        "pages": 200,
        "copies": 3,
        "synopsis": "Una familia falsa para una misión secreta.",
    }


def test_crear_manga(client: TestClient, admin_headers: dict[str, str]):
    response = client.post(
        "/api/mangas-comics/",
        json=manga_data(),
        headers=admin_headers,
    )

    assert response.status_code == 201

    data = response.json()
    assert data["title"] == "Spy x Family"
    assert data["volume_number"] == 1
    assert data["copies"] == 3
    assert data["is_active"] is True
    assert "id" in data


def test_listar_mangas(client: TestClient, admin_headers: dict[str, str]):
    client.post(
        "/api/mangas-comics/",
        json=manga_data(),
        headers=admin_headers,
    )

    response = client.get("/api/mangas-comics/")

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["title"] == "Spy x Family"


def test_consultar_detalle_manga(
    client: TestClient,
    admin_headers: dict[str, str],
):
    creado = client.post(
        "/api/mangas-comics/",
        json=manga_data(),
        headers=admin_headers,
    ).json()

    response = client.get(f"/api/mangas-comics/{creado['id']}")

    assert response.status_code == 200
    assert response.json()["id"] == creado["id"]


def test_rechazar_titulo_y_volumen_duplicados(
    client: TestClient,
    admin_headers: dict[str, str],
):
    client.post(
        "/api/mangas-comics/",
        json=manga_data(),
        headers=admin_headers,
    )

    response = client.post(
        "/api/mangas-comics/",
        json=manga_data(),
        headers=admin_headers,
    )

    assert response.status_code == 409


def test_rechazar_cero_copias(
    client: TestClient,
    admin_headers: dict[str, str],
):
    datos = manga_data()
    datos["copies"] = 0

    response = client.post(
        "/api/mangas-comics/",
        json=datos,
        headers=admin_headers,
    )

    assert response.status_code == 422


def test_modificar_manga(client: TestClient, admin_headers: dict[str, str]):
    creado = client.post(
        "/api/mangas-comics/",
        json=manga_data(),
        headers=admin_headers,
    ).json()

    datos_actualizados = manga_data()
    datos_actualizados["copies"] = 5

    response = client.put(
        f"/api/mangas-comics/{creado['id']}",
        json=datos_actualizados,
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["copies"] == 5


def test_baja_logica_y_catalogo(
    client: TestClient,
    admin_headers: dict[str, str],
):
    creado = client.post(
        "/api/mangas-comics/",
        json=manga_data(),
        headers=admin_headers,
    ).json()

    manga_id = creado["id"]

    response_baja = client.patch(
        f"/api/mangas-comics/{manga_id}/baja",
        headers=admin_headers,
    )

    assert response_baja.status_code == 200
    assert response_baja.json()["is_active"] is False

    response_catalogo = client.get("/api/mangas-comics/")

    assert response_catalogo.status_code == 200
    assert all(
        manga["id"] != manga_id
        for manga in response_catalogo.json()
    )

    response_detalle = client.get(f"/api/mangas-comics/{manga_id}")

    assert response_detalle.status_code == 404


def test_reutilizar_volumen_dado_de_baja(
    client: TestClient,
    admin_headers: dict[str, str],
):
    client.post(
        "/api/mangas-comics/",
        json=manga_data(),
        headers=admin_headers,
    )

    listado = client.get("/api/mangas-comics/").json()
    manga_id = listado[0]["id"]

    response_baja = client.patch(
        f"/api/mangas-comics/{manga_id}/baja",
        headers=admin_headers,
    )
    assert response_baja.status_code == 200

    # El mismo título y volumen deberían poder registrarse de nuevo.
    response_alta = client.post(
        "/api/mangas-comics/",
        json=manga_data(),
        headers=admin_headers,
    )

    assert response_alta.status_code == 201
    assert response_alta.json()["id"] != manga_id


def test_rechazar_titulo_vacio_o_con_espacios(
    client: TestClient,
    admin_headers: dict[str, str],
):
    for titulo in ["", "   "]:
        datos = manga_data()
        datos["title"] = titulo

        response = client.post(
            "/api/mangas-comics/",
            json=datos,
            headers=admin_headers,
        )

        assert response.status_code == 422


def test_rechazar_paginas_y_volumen_invalidos(
    client: TestClient,
    admin_headers: dict[str, str],
):
    datos = manga_data()
    datos["pages"] = 0

    response_paginas = client.post(
        "/api/mangas-comics/",
        json=datos,
        headers=admin_headers,
    )
    assert response_paginas.status_code == 422

    datos = manga_data()
    datos["volume_number"] = 0

    response_volumen = client.post(
        "/api/mangas-comics/",
        json=datos,
        headers=admin_headers,
    )
    assert response_volumen.status_code == 422


def test_modificar_manga_inexistente(
    client: TestClient,
    admin_headers: dict[str, str],
):
    response = client.put(
        "/api/mangas-comics/9999",
        json=manga_data(),
        headers=admin_headers,
    )

    assert response.status_code == 404


def test_modificar_con_titulo_y_volumen_duplicados(
    client: TestClient,
    admin_headers: dict[str, str],
):
    primer_manga = manga_data()

    client.post(
        "/api/mangas-comics/",
        json=primer_manga,
        headers=admin_headers,
    )

    segundo_manga = manga_data()
    segundo_manga["title"] = "Batman"

    segundo = client.post(
        "/api/mangas-comics/",
        json=segundo_manga,
        headers=admin_headers,
    )
    assert segundo.status_code == 201

    # Intentamos cambiar Batman para que duplique Spy x Family, tomo 1.
    response = client.put(
        f"/api/mangas-comics/{segundo.json()['id']}",
        json=primer_manga,
        headers=admin_headers,
    )

    assert response.status_code == 409


def test_rechazar_segunda_baja(
    client: TestClient,
    admin_headers: dict[str, str],
):
    creado = client.post(
        "/api/mangas-comics/",
        json=manga_data(),
        headers=admin_headers,
    ).json()

    manga_id = creado["id"]

    primera_baja = client.patch(
        f"/api/mangas-comics/{manga_id}/baja",
        headers=admin_headers,
    )
    assert primera_baja.status_code == 200

    segunda_baja = client.patch(
        f"/api/mangas-comics/{manga_id}/baja",
        headers=admin_headers,
    )
    assert segunda_baja.status_code == 404