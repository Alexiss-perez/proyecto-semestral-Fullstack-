from fastapi import APIRouter, HTTPException
import httpx
from app.config import PRODUCTOS_SERVICE_URL

router = APIRouter(tags=["Productos"])

productos_mock = [
    {
        "id": 1,
        "nombre": "Omega 3",
        "marca": "Natural Life",
        "categoria": "Suplementos",
        "precio_normal": 19990,
        "precio_oferta": 12990,
        "porcentaje_descuento": 35,
        "link_tienda": "https://ejemplo.com/omega-3"
    },
]

@router.get("/productos")
async def listar_productos():
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(f"{PRODUCTOS_SERVICE_URL}/api/productos")
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        print(f"Error conectando a servicio de productos: {e}. Usando Mock")
        return productos_mock

@router.get("/productos/{producto_id}")
async def obtener_producto(producto_id: int):
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(f"{PRODUCTOS_SERVICE_URL}/api/productos")
            response.raise_for_status()
            productos = response.json() # Guardamos la lista completa primero
            
            # Buscamos el producto con el ID solicitado
            for producto in productos:
                if producto["id"] == producto_id:
                    return producto
                
            raise HTTPException(status_code=404, detail="Producto no encontrado en Supabase")
    except httpx.HTTPError as e:
        print(f"Error de conexión: {e}. Buscando en Mock...")
        for producto in productos_mock:
            if producto["id"] == producto_id:
                return producto
        raise HTTPException(status_code=404, detail="Producto no encontrado en Mock")