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


def test_dar_de_baja_oculta_el_producto_de_la_carta(
    client: TestClient,
    admin_headers: dict[str, str],
):
    producto = crear_producto(client, admin_headers)

    response = client.patch(f"/api/productos/{producto['id']}/baja", headers=admin_headers)

    assert response.status_code == 200
    assert response.json()["activo"] is False
    # Baja lógica: deja de verse en la carta pero sigue guardado
    assert client.get("/api/productos").json() == []
    detalle = client.get(f"/api/productos/{producto['id']}", headers=admin_headers)
    assert detalle.json()["activo"] is False


def test_listado_admin_incluye_inactivos_ordenados(
    client: TestClient,
    admin_headers: dict[str, str],
):
    crear_producto(client, admin_headers, nombre="Pizza", tipo="comida")
    agua = crear_producto(client, admin_headers, nombre="Agua", tipo="bebida")
    crear_producto(client, admin_headers, nombre="Empanada", tipo="comida")
    client.patch(f"/api/productos/{agua['id']}/baja", headers=admin_headers)

    response = client.get("/api/productos/admin/todos", headers=admin_headers)

    assert response.status_code == 200
    assert [(p["nombre"], p["activo"]) for p in response.json()] == [
        ("Agua", False),
        ("Empanada", True),
        ("Pizza", True),
    ]


def test_reactivar_vuelve_a_mostrar_el_producto(
    client: TestClient,
    admin_headers: dict[str, str],
):
    producto = crear_producto(client, admin_headers)
    client.patch(f"/api/productos/{producto['id']}/baja", headers=admin_headers)

    response = client.patch(f"/api/productos/{producto['id']}/reactivar", headers=admin_headers)

    assert response.status_code == 200
    assert response.json()["activo"] is True
    assert [p["id"] for p in client.get("/api/productos").json()] == [producto["id"]]


def test_rechaza_baja_o_reactivacion_repetida(
    client: TestClient,
    admin_headers: dict[str, str],
):
    producto = crear_producto(client, admin_headers)
    url = f"/api/productos/{producto['id']}"

    assert client.patch(f"{url}/reactivar", headers=admin_headers).status_code == 409
    assert client.patch(f"{url}/baja", headers=admin_headers).status_code == 200
    assert client.patch(f"{url}/baja", headers=admin_headers).status_code == 409


def test_baja_de_producto_inexistente(client: TestClient, admin_headers: dict[str, str]):
    assert client.patch("/api/productos/999/baja", headers=admin_headers).status_code == 404
    assert client.patch("/api/productos/999/reactivar", headers=admin_headers).status_code == 404


def test_listado_admin_y_baja_requieren_sesion(
    client: TestClient,
    admin_headers: dict[str, str],
):
    producto = crear_producto(client, admin_headers)

    assert client.get("/api/productos/admin/todos").status_code == 401
    assert client.patch(f"/api/productos/{producto['id']}/baja").status_code == 401
    assert client.patch(f"/api/productos/{producto['id']}/reactivar").status_code == 401


@pytest.mark.parametrize("nombre", ["Hamburguesa La Friki-Doble", "hamburguesa la friki-doble"])
def test_rechaza_nombre_repetido(client: TestClient, admin_headers: dict[str, str], nombre: str):
    crear_producto(client, admin_headers)

    response = client.post("/api/productos", json=producto_data(nombre=nombre), headers=admin_headers)

    assert response.status_code == 422
    error = response.json()["detail"][0]
    assert error["loc"] == ["body", "nombre"]
    assert error["msg"] == "Ya existe un producto con ese nombre"


def test_modificar_conserva_su_nombre_pero_no_toma_uno_ajeno(
    client: TestClient,
    admin_headers: dict[str, str],
):
    producto = crear_producto(client, admin_headers)
    crear_producto(client, admin_headers, nombre="Pizza")
    url = f"/api/productos/{producto['id']}"

    assert client.put(url, json=producto_data(precio=9000), headers=admin_headers).status_code == 200
    assert client.put(url, json=producto_data(nombre="PIZZA"), headers=admin_headers).status_code == 422


@pytest.mark.parametrize(("campo", "largo"), [("nombre", 51), ("descripcion", 501)])
def test_rechaza_textos_demasiado_largos(
    client: TestClient,
    admin_headers: dict[str, str],
    campo: str,
    largo: int,
):
    response = client.post(
        "/api/productos",
        json=producto_data(**{campo: "a" * largo}),
        headers=admin_headers,
    )

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", campo]


def test_registrar_producto_inactivo(client: TestClient, admin_headers: dict[str, str]):
    producto = crear_producto(client, admin_headers, activo=False)

    assert producto["activo"] is False
    assert client.get("/api/productos").json() == []


def test_modificar_estado_desde_el_formulario(client: TestClient, admin_headers: dict[str, str]):
    producto = crear_producto(client, admin_headers)
    url = f"/api/productos/{producto['id']}"

    response = client.put(url, json=producto_data(activo=False), headers=admin_headers)
    assert response.json()["activo"] is False

    # Sin "activo" en el cuerpo, el producto conserva su estado
    response = client.put(url, json=producto_data(precio=100), headers=admin_headers)
    assert response.json()["activo"] is False


# --- HU-13: precio de oferta ---


def test_producto_sin_oferta_por_defecto(client: TestClient, admin_headers: dict[str, str]):
    producto = crear_producto(client, admin_headers)

    assert producto["precio_oferta"] is None


def test_registrar_oferta_se_muestra_en_la_carta(
    client: TestClient,
    admin_headers: dict[str, str],
):
    producto = crear_producto(client, admin_headers, precio_oferta="7500.25")

    assert producto["precio_oferta"] == 7500.25
    carta = client.get("/api/productos").json()
    assert [(p["precio"], p["precio_oferta"]) for p in carta] == [(8500.50, 7500.25)]


def test_agregar_oferta_al_modificar(client: TestClient, admin_headers: dict[str, str]):
    producto = crear_producto(client, admin_headers)

    response = client.put(
        f"/api/productos/{producto['id']}",
        json=producto_data(precio_oferta=6999.99),
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["precio_oferta"] == 6999.99


@pytest.mark.parametrize("precio_oferta", [0, -10, "0.00"])
def test_rechaza_oferta_cero_o_negativa(
    client: TestClient,
    admin_headers: dict[str, str],
    precio_oferta,
):
    response = client.post(
        "/api/productos",
        json=producto_data(precio_oferta=precio_oferta),
        headers=admin_headers,
    )

    assert response.status_code == 422
    error = response.json()["detail"][0]
    assert error["loc"] == ["body", "precio_oferta"]
    assert "El precio de oferta debe ser mayor a cero" in error["msg"]


@pytest.mark.parametrize("precio_oferta", [8500.50, 9000])
def test_rechaza_oferta_mayor_o_igual_al_precio(
    client: TestClient,
    admin_headers: dict[str, str],
    precio_oferta,
):
    response = client.post(
        "/api/productos",
        json=producto_data(precio_oferta=precio_oferta),
        headers=admin_headers,
    )

    assert response.status_code == 422
    error = response.json()["detail"][0]
    assert error["loc"] == ["body", "precio_oferta"]
    assert "El precio de oferta debe ser menor al precio actual" in error["msg"]
    assert client.get("/api/productos").json() == []


def test_oferta_invalida_al_modificar_no_cambia_el_producto(
    client: TestClient,
    admin_headers: dict[str, str],
):
    producto = crear_producto(client, admin_headers, precio_oferta=7000)

    response = client.put(
        f"/api/productos/{producto['id']}",
        json=producto_data(precio_oferta=8500.50),
        headers=admin_headers,
    )

    assert response.status_code == 422
    assert "El precio de oferta debe ser menor al precio actual" in response.json()["detail"][0]["msg"]
    assert client.get("/api/productos").json()[0]["precio_oferta"] == 7000


def test_eliminar_oferta_deja_solo_el_precio_original(
    client: TestClient,
    admin_headers: dict[str, str],
):
    producto = crear_producto(client, admin_headers, precio_oferta=7000)

    response = client.put(
        f"/api/productos/{producto['id']}",
        json=producto_data(precio_oferta=None),
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["precio_oferta"] is None
    carta = client.get("/api/productos").json()
    assert [(p["precio"], p["precio_oferta"]) for p in carta] == [(8500.50, None)]


def test_modificar_sin_enviar_oferta_la_conserva(
    client: TestClient,
    admin_headers: dict[str, str],
):
    producto = crear_producto(client, admin_headers, precio_oferta=7000)
    datos = producto_data(nombre="Hamburguesa Triple")

    response = client.put(f"/api/productos/{producto['id']}", json=datos, headers=admin_headers)

    assert response.status_code == 200
    assert response.json()["precio_oferta"] == 7000


def test_bajar_el_precio_por_debajo_de_la_oferta_vigente(
    client: TestClient,
    admin_headers: dict[str, str],
):
    producto = crear_producto(client, admin_headers, precio_oferta=7000)

    response = client.put(
        f"/api/productos/{producto['id']}",
        json=producto_data(precio=6500),
        headers=admin_headers,
    )

    assert response.status_code == 422
    error = response.json()["detail"][0]
    assert error["loc"] == ["body", "precio_oferta"]
    assert error["msg"] == "El precio de oferta debe ser menor al precio actual"
    assert client.get("/api/productos").json()[0]["precio"] == 8500.50
