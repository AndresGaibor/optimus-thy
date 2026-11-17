"""Envío de correo por SMTP con plantillas editables.

Usa ``smtplib`` de la biblioteca estándar: no hace falta una dependencia nueva
y el servidor se configura desde la aplicación, no desde el repositorio.

El mensaje sale siempre en dos partes (texto plano y HTML) para que ningún
cliente quede sin contenido, y los valores del contexto se escapan antes de
entrar en el HTML: la plantilla la escribe un administrador, los datos no.
"""

from __future__ import annotations

import html as html_lib
import re
import smtplib
import ssl
from collections.abc import Mapping
from email.message import EmailMessage
from email.utils import formataddr

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.correo import CLAVE_RECUPERACION, ConfiguracionCorreo, PlantillaCorreo
from app.security.encryption import PiiDecryptionError, get_cipher

VARIABLES: frozenset[str] = frozenset({"nombre", "enlace", "expira_en"})
"""Marcadores admitidos en las plantillas."""

_VARIABLE = re.compile(r"\{\{\s*([a-z_]+)\s*\}\}")

PLANTILLA_RECUPERACION = """<div style="margin:0;padding:24px;background:#f6f7f9;color:#1f2937">
  <div style="max-width:520px;margin:0 auto;background:#fff;padding:32px">
    <h1 style="margin:0 0 16px;font-size:20px">Restablece tu contraseña</h1>
    <p style="margin:0 0 12px">Hola {{nombre}},</p>
    <p style="margin:0 0 16px">
      Recibimos una solicitud para restablecer la contraseña de tu cuenta en OPTIMUS-THY.
    </p>
    <p style="margin:0 0 24px">
      <a href="{{enlace}}" style="background:#4f46e5;color:#fff;padding:12px 20px">
        Elegir una contraseña nueva
      </a>
    </p>
    <p style="margin:0 0 12px;font-size:14px;color:#4b5563">
      El enlace caduca en {{expira_en}} y solo puede usarse una vez.
    </p>
    <p style="margin:0;font-size:14px;color:#4b5563">
      Si no fuiste tú, ignora este mensaje: tu contraseña no cambia.
    </p>
  </div>
</div>"""

ASUNTO_RECUPERACION = "Restablece tu contraseña en OPTIMUS-THY"


class CorreoNoConfigurado(Exception):
    """No hay servidor SMTP activo o le falta la contraseña."""


class EnvioError(Exception):
    """El servidor rechazó el mensaje o no se pudo alcanzar.

    Su texto es apto para el cliente: nunca incluye credenciales ni la traza.
    """


def variables_no_permitidas(texto: str) -> set[str]:
    """Devuelve los marcadores que la plantilla usa y no existen."""
    return {nombre for nombre in _VARIABLE.findall(texto) if nombre not in VARIABLES}


def render(texto: str, contexto: Mapping[str, str]) -> str:
    """Sustituye los marcadores conocidos; los valores se escapan para HTML."""

    def reemplazo(coincidencia: re.Match[str]) -> str:
        nombre = coincidencia.group(1)
        if nombre not in contexto:
            return ""
        return html_lib.escape(str(contexto[nombre]))

    return _VARIABLE.sub(reemplazo, texto)


def _texto_plano(html: str) -> str:
    """Alternativa legible para clientes que no muestran HTML."""
    sin_etiquetas = re.sub(r"<[^>]+>", " ", html)
    return re.sub(r"[ \t]{2,}", " ", html_lib.unescape(sin_etiquetas)).strip()


def cargar(db: Session) -> ConfiguracionCorreo | None:
    """Configuración guardada, o ``None`` si nunca se guardó."""
    return db.get(ConfiguracionCorreo, 1)


def plantilla(db: Session, clave: str) -> PlantillaCorreo | None:
    """Plantilla guardada; la de recuperación tiene una de fábrica como respaldo."""
    fila = db.get(PlantillaCorreo, clave)
    if fila is None and clave == CLAVE_RECUPERACION:
        return PlantillaCorreo(
            clave=CLAVE_RECUPERACION, asunto=ASUNTO_RECUPERACION, html=PLANTILLA_RECUPERACION
        )
    return fila


def _secreto(config: ConfiguracionCorreo) -> str:
    if config.password_cifrado is None:
        raise CorreoNoConfigurado("Falta la contraseña del servidor de correo.")
    try:
        return get_cipher().decrypt(config.password_cifrado)
    except PiiDecryptionError as exc:
        raise CorreoNoConfigurado(
            "No se pudo leer la contraseña guardada; vuelve a escribirla."
        ) from exc


def enviar(db: Session, *, destinatario: str, asunto: str, html: str) -> None:
    """Envía un mensaje con la configuración guardada."""
    settings = get_settings()
    config = cargar(db)
    if config is None or not config.activo:
        raise CorreoNoConfigurado("El servidor de correo no está configurado o está inactivo.")
    secreto = _secreto(config)

    mensaje = EmailMessage()
    mensaje["Subject"] = asunto
    mensaje["From"] = formataddr((config.remitente_nombre or "OPTIMUS-THY", config.remitente))
    mensaje["To"] = destinatario
    mensaje.set_content(_texto_plano(html))
    mensaje.add_alternative(html, subtype="html")

    contexto_tls = ssl.create_default_context()
    try:
        if config.seguridad == "ssl":
            with smtplib.SMTP_SSL(
                config.host,
                config.puerto,
                timeout=settings.correo_timeout_segundos,
                context=contexto_tls,
            ) as cliente:
                cliente.login(config.usuario, secreto)
                cliente.send_message(mensaje)
        else:
            with smtplib.SMTP(
                config.host, config.puerto, timeout=settings.correo_timeout_segundos
            ) as cliente:
                cliente.ehlo()
                cliente.starttls(context=contexto_tls)
                cliente.ehlo()
                cliente.login(config.usuario, secreto)
                cliente.send_message(mensaje)
    except (smtplib.SMTPException, OSError) as exc:
        raise EnvioError(
            "No se pudo entregar el correo. Revisa el servidor, el usuario y la contraseña."
        ) from exc


def mostrar_ttl(minutos: int) -> str:
    """Texto humano de la vigencia del enlace."""
    if minutos < 60:
        return f"{minutos} minutos"
    horas = minutos // 60
    return f"{horas} hora{'s' if horas != 1 else ''}"


def enviar_recuperacion(
    db: Session, *, destinatario: str, nombre: str, enlace: str, expira_en: str
) -> None:
    """Aplica la plantilla de recuperación y envía el enlace."""
    fila = plantilla(db, CLAVE_RECUPERACION)
    if fila is None:  # pragma: no cover - la de fábrica siempre existe
        raise CorreoNoConfigurado("No hay plantilla de recuperación.")
    contexto = {"nombre": nombre, "enlace": enlace, "expira_en": expira_en}
    enviar(
        db,
        destinatario=destinatario,
        asunto=render(fila.asunto, contexto),
        html=render(fila.html, contexto),
    )
