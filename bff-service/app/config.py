import os
from dotenv import load_dotenv

load_dotenv()

PRODUCTOS_SERVICE_URL = os.getenv(
    "PRODUCTOS_SERVICE_URL",
    "http://localhost:8001"
)

ALERTAS_SERVICE_URL = os.getenv(
    "ALERTAS_SERVICE_URL",
    "http://localhost:8002"
)