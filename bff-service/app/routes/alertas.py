from fastapi import APIRouter, HTTPException
import httpx
from app.config import ALERTAS_SERVICE_URL

router = APIRouter(tags=["Alertas"])

@router.post("/alertas")
async def crear_alerta(alerta: dict):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{ALERTAS_SERVICE_URL}/alertas", json=alerta)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError:
        raise HTTPException(status_code=503, detail="No fue posible conectar con alertas-service")