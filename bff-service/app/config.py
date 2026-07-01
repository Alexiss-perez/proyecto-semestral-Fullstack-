import os
from dotenv import load_dotenv

load_dotenv()
# Se ajuta al puerto 4002 para el servicio de productos
PRODUCTOS_SERVICE_URL = os.getenv(
    "PRODUCTOS_SERVICE_URL",
    "http://localhost:4002"
)
# Se ajusta a puerto 8000 para el servicio de alertas
ALERTAS_SERVICE_URL = os.getenv(
    "ALERTAS_SERVICE_URL",
    "http://localhost:8000"
)