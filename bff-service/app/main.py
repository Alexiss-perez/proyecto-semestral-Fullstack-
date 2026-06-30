from fastapi import FastAPI
from app.routes.productos import router as productos_router
from app.routes.alertas import router as alertas_router

app = FastAPI(
    title="BFF Service",
    description="Backend For Frontend del proyecto",
    version="1.0.0"
)

@app.get("/")
def home():
    return {"mensaje": "BFF funcionando correctamente"}

@app.get("/health")
def health():
    return {"status": "ok", "service": "bff-service"}

app.include_router(productos_router, prefix="/api")
app.include_router(alertas_router, prefix="/api")