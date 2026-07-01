from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_alertas():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["mensaje"] == "Alertas Service funcionando correctamente"

def test_health_alertas():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_crear_alerta():
    alerta = {
        "email": "fernanda@duoc.cl",
        "mensaje": "Stock bajo en producto"
    }

    response = client.post("/alertas/", json=alerta)

    assert response.status_code == 200
    assert response.json()["mensaje"] == "Alerta registrada correctamente"
    assert response.json()["email_enviado"] == True

def test_listar_alertas():
    response = client.get("/alertas/")

    assert response.status_code == 200
    assert isinstance(response.json(), list)