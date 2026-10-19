import json
import os
import urllib.request

from dotenv import load_dotenv

load_dotenv()

# URL del Incoming Webhook de Slack (se guarda en .env y en Render, nunca en GitHub)
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL")


def enviar_alerta(texto: str):
    """Envía un mensaje al canal de Slack. Si no hay webhook o Slack falla, la API sigue funcionando."""
    if not SLACK_WEBHOOK_URL:
        return
    try:
        datos = json.dumps({"text": texto}).encode("utf-8")
        peticion = urllib.request.Request(SLACK_WEBHOOK_URL, data=datos, headers={"Content-Type": "application/json"})
        urllib.request.urlopen(peticion, timeout=5)
    except Exception as e:
        print(f"No se pudo enviar la alerta a Slack: {e}")
