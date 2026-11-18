import base64

import pytest
from fastapi.testclient import TestClient

# PNG de 1x1 px
PNG = base64.b64encode(
    bytes.fromhex(
        "89504e470d0a1a0a0000000d4948445200000001000000010806000000"
        "1f15c4890000000d49444154789c6360000002000001e221bc330000000049454e44ae426082"
    )
).decode()
DATA_URL = f"data:image/png;base64,{PNG}"

JUEGO = {
    "nombre": "Catan",
    "duracion_min": 90,
    "edad_recomendada": 10,
    "jugadores_min": 3,
    "jugadores_max": 4,
}


def crear(client: TestClient, **extra):
    return client.post("/api/juegos", json={**JUEGO, **extra})


def test_juego_sin_imagen(client: TestClient):
    response = crear(client)
    assert response.status_code == 201
    assert response.json()["imagen"] is None


@pytest.mark.parametrize("imagen", [DATA_URL, "https://example.com/catan.jpg"])
def test_crear_con_imagen_y_verla_en_catalogo_y_detalle(client: TestClient, imagen):
    juego = crear(client, imagen=imagen).json()
    assert juego["imagen"] == imagen

    assert client.get("/api/juegos").json()[0]["imagen"] == imagen
    assert client.get(f"/api/juegos/{juego['id']}").json()["imagen"] == imagen


@pytest.mark.parametrize(
    "imagen",
    [
        "no es una imagen",
        "ftp://example.com/catan.jpg",
        "data:image/gif;base64," + PNG,
        "data:image/png;base64,@@@",
        "https://example.com/" + "a" * 500,
    ],
)
def test_rechazar_imagen_invalida(client: TestClient, imagen):
    response = crear(client, imagen=imagen)
    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"][-1] == "imagen"


def test_rechazar_imagen_de_mas_de_2_mb(client: TestClient):
    grande = base64.b64encode(b"\0" * (2 * 1024 * 1024 + 1)).decode()
    response = crear(client, imagen=f"data:image/jpeg;base64,{grande}")
    assert response.status_code == 422


def test_modificar_conserva_cambia_y_quita_la_imagen(client: TestClient):
    juego_id = crear(client, imagen=DATA_URL).json()["id"]

    # Si no se envía, se conserva
    response = client.put(f"/api/juegos/{juego_id}", json={"nombre": "Catan Junior"})
    assert response.json()["imagen"] == DATA_URL

    response = client.put(f"/api/juegos/{juego_id}", json={"imagen": "https://example.com/otra.png"})
    assert response.json()["imagen"] == "https://example.com/otra.png"

    # Vacía o null la quita
    assert client.put(f"/api/juegos/{juego_id}", json={"imagen": "  "}).json()["imagen"] is None
    assert client.put(f"/api/juegos/{juego_id}", json={"imagen": DATA_URL}).json()["imagen"] == DATA_URL
    assert client.put(f"/api/juegos/{juego_id}", json={"imagen": None}).json()["imagen"] is None
