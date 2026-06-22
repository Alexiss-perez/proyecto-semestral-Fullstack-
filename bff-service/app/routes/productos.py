from fastapi import APIRouter, HTTPException
import httpx
from app.config import PRODUCTOS_SERVICE_URL

router = APIRouter(tags=["Productos"])

@router.get("/productos")
async def listar_productos():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{PRODUCTOS_SERVICE_URL}/productos")
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError:
        raise HTTPException(status_code=503, detail="No fue posible conectar con productos-service")

@router.get("/productos/{producto_id}")
async def obtener_producto(producto_id: int):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{PRODUCTOS_SERVICE_URL}/productos/{producto_id}")
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError:
        raise HTTPException(status_code=503, detail="No fue posible conectar con productos-service")