from fastapi import FastAPI
from app.routes.alertas import router as alertas_router

app = FastAPI(
    title="Alertas Service",
    description="Microservicio de alertas",
    version="1.0.0"
)

app.include_router(alertas_router)

@app.get("/")
def root():
    return {"mensaje": "Alertas Service funcionando correctamente"}

@app.get("/health")
def health():
    return {"status": "ok"}