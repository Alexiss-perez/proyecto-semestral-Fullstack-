from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_bff():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["service"] == "bff-service"


def test_home_bff():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["mensaje"] == "BFF funcionando correctamente"

def test_listar_productos_bff():
    response = client.get("/api/productos")

    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_producto_no_encontrado_bff():
    response = client.get("/api/productos/999999")

    assert response.status_code == 200
    assert response.json()["detail"] == "Producto no encontrado"