import pytest
from fastapi.testclient import TestClient

URL = "https://example.com/catan.jpg"

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


def test_crear_con_imagen_y_verla_en_catalogo_y_detalle(client: TestClient):
    juego = crear(client, imagen=f"  {URL}  ").json()
    assert juego["imagen"] == URL

    assert client.get("/api/juegos").json()[0]["imagen"] == URL
    assert client.get(f"/api/juegos/{juego['id']}").json()["imagen"] == URL


@pytest.mark.parametrize(
    "imagen",
    [
        "no es una imagen",
        "ftp://example.com/catan.jpg",
        "data:image/png;base64,iVBORw0KGgo=",
        "https://example.com/" + "a" * 500,
    ],
)
def test_rechazar_imagen_que_no_es_url_web(client: TestClient, imagen):
    response = crear(client, imagen=imagen)
    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"][-1] == "imagen"


def test_modificar_conserva_cambia_y_quita_la_imagen(client: TestClient):
    juego_id = crear(client, imagen=URL).json()["id"]

    # Si no se envía, se conserva
    response = client.put(f"/api/juegos/{juego_id}", json={"nombre": "Catan Junior"})
    assert response.json()["imagen"] == URL

    response = client.put(f"/api/juegos/{juego_id}", json={"imagen": "https://example.com/otra.png"})
    assert response.json()["imagen"] == "https://example.com/otra.png"

    # Vacía o null la quita
    assert client.put(f"/api/juegos/{juego_id}", json={"imagen": "  "}).json()["imagen"] is None
    assert client.put(f"/api/juegos/{juego_id}", json={"imagen": URL}).json()["imagen"] == URL
    assert client.put(f"/api/juegos/{juego_id}", json={"imagen": None}).json()["imagen"] is None
