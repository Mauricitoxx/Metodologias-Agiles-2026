import pytest
from fastapi.testclient import TestClient


def producto_data(**cambios) -> dict:
    """Datos válidos de un producto de la carta."""
    return {
        "nombre": "Hamburguesa La Friki-Doble",
        "descripcion": "Doble carne smash, cheddar y bacon.",
        "tipo": "comida",
        "precio": 8500.50,
        **cambios,
    }


def crear_producto(client: TestClient, headers: dict[str, str], **cambios) -> dict:
    response = client.post("/api/productos", json=producto_data(**cambios), headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def test_registrar_producto(client: TestClient, admin_headers: dict[str, str]):
    producto = crear_producto(client, admin_headers)

    assert producto["nombre"] == "Hamburguesa La Friki-Doble"
    assert producto["tipo"] == "comida"
    assert producto["precio"] == 8500.50
    assert producto["activo"] is True
    assert "id" in producto


def test_precio_acepta_decimales(client: TestClient, admin_headers: dict[str, str]):
    producto = crear_producto(client, admin_headers, precio="1250.75")

    assert producto["precio"] == 1250.75


@pytest.mark.parametrize("campo", ["nombre", "descripcion", "tipo", "precio"])
def test_campos_obligatorios(
    client: TestClient,
    admin_headers: dict[str, str],
    campo: str,
):
    datos = producto_data()
    del datos[campo]

    response = client.post("/api/productos", json=datos, headers=admin_headers)

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", campo]


@pytest.mark.parametrize("campo", ["nombre", "descripcion"])
def test_rechaza_texto_en_blanco(
    client: TestClient,
    admin_headers: dict[str, str],
    campo: str,
):
    response = client.post(
        "/api/productos",
        json=producto_data(**{campo: "   "}),
        headers=admin_headers,
    )

    assert response.status_code == 422


@pytest.mark.parametrize("precio", [0, -100, "0.00"])
def test_rechaza_precio_cero_o_negativo(
    client: TestClient,
    admin_headers: dict[str, str],
    precio,
):
    response = client.post(
        "/api/productos",
        json=producto_data(precio=precio),
        headers=admin_headers,
    )

    assert response.status_code == 422
    error = response.json()["detail"][0]
    assert error["loc"] == ["body", "precio"]
    assert "El precio debe ser mayor a cero" in error["msg"]
    # No se guardó nada
    assert client.get("/api/productos").json() == []


def test_rechaza_tipo_invalido(client: TestClient, admin_headers: dict[str, str]):
    response = client.post(
        "/api/productos",
        json=producto_data(tipo="mueble"),
        headers=admin_headers,
    )

    assert response.status_code == 422


def test_modificar_producto_se_refleja_en_la_carta(
    client: TestClient,
    admin_headers: dict[str, str],
):
    producto = crear_producto(client, admin_headers)

    response = client.put(
        f"/api/productos/{producto['id']}",
        json=producto_data(nombre="Hamburguesa Triple", precio=9900.99),
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["nombre"] == "Hamburguesa Triple"
    assert response.json()["precio"] == 9900.99

    carta = client.get("/api/productos").json()
    assert [(p["nombre"], p["precio"]) for p in carta] == [("Hamburguesa Triple", 9900.99)]


def test_modificar_con_precio_invalido_no_cambia_el_producto(
    client: TestClient,
    admin_headers: dict[str, str],
):
    producto = crear_producto(client, admin_headers)

    response = client.put(
        f"/api/productos/{producto['id']}",
        json=producto_data(precio=0),
        headers=admin_headers,
    )

    assert response.status_code == 422
    assert client.get("/api/productos").json()[0]["precio"] == 8500.50


def test_modificar_producto_inexistente(client: TestClient, admin_headers: dict[str, str]):
    response = client.put("/api/productos/999", json=producto_data(), headers=admin_headers)

    assert response.status_code == 404


def test_carta_ordenada_por_tipo_y_nombre(client: TestClient, admin_headers: dict[str, str]):
    crear_producto(client, admin_headers, nombre="Pizza", tipo="comida")
    crear_producto(client, admin_headers, nombre="Agua", tipo="bebida")
    crear_producto(client, admin_headers, nombre="Empanada", tipo="comida")

    carta = client.get("/api/productos").json()

    assert [p["nombre"] for p in carta] == ["Agua", "Empanada", "Pizza"]


def test_consultar_producto_para_editar(client: TestClient, admin_headers: dict[str, str]):
    producto = crear_producto(client, admin_headers)

    response = client.get(f"/api/productos/{producto['id']}", headers=admin_headers)

    assert response.status_code == 200
    assert response.json() == producto


def test_alta_y_modificacion_requieren_sesion(
    client: TestClient,
    admin_headers: dict[str, str],
):
    producto = crear_producto(client, admin_headers)

    assert client.post("/api/productos", json=producto_data()).status_code == 401
    assert client.put(f"/api/productos/{producto['id']}", json=producto_data()).status_code == 401
    assert client.get(f"/api/productos/{producto['id']}").status_code == 401
