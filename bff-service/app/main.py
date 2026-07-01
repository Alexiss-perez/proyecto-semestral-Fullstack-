from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.productos import router as productos_router
from app.routes.alertas import router as alertas_router

app = FastAPI(
    title="BFF Service",
    description="Backend For Frontend del proyecto",
    version="1.0.0"
)

# Configuración de CORS
# Permite que Frontend se comunique con el BFF sin bloqueos del navegador
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permite todas las URLs de origen
    allow_credentials=True,
    allow_methods=["*"],  # Permite GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],  # Permite todas las cabeceras estándar
)

@app.get("/")
def home():
    return {"mensaje": "BFF funcionando correctamente"}

@app.get("/health")
def health():
    return {"status": "ok", "service": "bff-service"}

app.include_router(productos_router, prefix="/api")
app.include_router(alertas_router, prefix="/api")