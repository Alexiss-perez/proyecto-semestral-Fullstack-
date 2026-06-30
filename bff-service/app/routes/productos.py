from fastapi import APIRouter
import httpx
from app.config import PRODUCTOS_SERVICE_URL

router = APIRouter(tags=["Productos"])

productos_mock = [
    {
        "id": 1,
        "nombre": "Omega 3",
        "marca": "Natural Life",
        "categoria": "Suplementos",
        "precio_original": 19990,
        "precio_oferta": 12990,
        "descuento": 35,
        "fecha_vencimiento": "2026-08-30",
        "link_tienda": "https://ejemplo.com/omega-3"
    },
    {
        "id": 2,
        "nombre": "Vitamina D3",
        "marca": "Healthy Plus",
        "categoria": "Vitaminas",
        "precio_original": 14990,
        "precio_oferta": 8990,
        "descuento": 40,
        "fecha_vencimiento": "2026-07-15",
        "link_tienda": "https://ejemplo.com/vitamina-d3"
    }
]

@router.get("/productos")
async def listar_productos():
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(f"{PRODUCTOS_SERVICE_URL}/productos")
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError:
        return productos_mock

@router.get("/productos/{producto_id}")
async def obtener_producto(producto_id: int):
    for producto in productos_mock:
        if producto["id"] == producto_id:
            return producto

    return {"detail": "Producto no encontrado"}