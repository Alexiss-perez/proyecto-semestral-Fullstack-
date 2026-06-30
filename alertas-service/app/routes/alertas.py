from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/alertas", tags=["Alertas"])

class Alerta(BaseModel):
    email: str
    mensaje: str

alertas_registradas = []

@router.post("/")
def crear_alerta(alerta: Alerta):
    alertas_registradas.append(alerta.dict())

    # Simulación de envío de correo
    email_enviado = True

    return {
        "mensaje": "Alerta registrada correctamente",
        "alerta": alerta,
        "email_enviado": email_enviado,
        "detalle_email": f"Correo simulado enviado a {alerta.email}"
    }

@router.get("/")
def listar_alertas():
    return alertas_registradas
