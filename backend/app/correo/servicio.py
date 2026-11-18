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

CAMPOS_RECUPERACION: dict[str, str] = {
    "titulo": "Restablece tu contraseña",
    "mensaje": (
        "Recibimos una solicitud para restablecer la contraseña de tu cuenta en OPTIMUS-THY."
    ),
    "boton": "Elegir una contraseña nueva",
    "nota": "El enlace caduca en {{expira_en}} y solo puede usarse una vez.",
    "pie": "Si no fuiste tú, ignora este mensaje: tu contraseña no cambia.",
}
"""Textos de fábrica del modo Diseño."""

CAMPOS_ORDEN: tuple[str, ...] = ("titulo", "mensaje", "boton", "nota", "pie")
"""Campos que componen el correo, en el orden en que se leen."""

MODOS = ("visual", "html")
"""Formas de editar la plantilla."""

_FUENTE = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"


def html_desde_campos(campos: Mapping[str, str]) -> str:
    """Compone el correo con el diseño del sistema a partir de texto plano.

    Las tablas y los estilos en línea son lo único que los clientes de correo
    respetan de forma parecida; el diseño es fijo a propósito.
    """
    valor = {clave: html_lib.escape(campos.get(clave, "")).strip() for clave in CAMPOS_ORDEN}
    return f"""\
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" \
style="margin:0;padding:24px;background:#f4f5f7">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" \
style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;\
font-family:{_FUENTE};color:#1f2937">
        <tr>
          <td style="padding:32px 32px 8px">
            <p style="margin:0 0 20px;font-size:12px;letter-spacing:.08em;\
text-transform:uppercase;color:#6b7280">
              OPTIMUS-THY
            </p>
            <h1 style="margin:0 0 16px;font-size:21px;line-height:1.3;\
font-weight:600;color:#111827">
              {valor["titulo"]}
            </h1>
            <p style="margin:0 0 12px;font-size:15px;line-height:1.6">Hola {{{{nombre}}}},</p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6">{valor["mensaje"]}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 24px">
            <a href="{{{{enlace}}}}" style="display:inline-block;background:#4f46e5;color:#ffffff;\
font-size:15px;font-weight:600;text-decoration:none;padding:12px 22px;border-radius:8px">
              {valor["boton"]}
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 28px">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280">{valor["nota"]}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 32px 26px;border-top:1px solid #e5e7eb">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280">{valor["pie"]}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>"""


PLANTILLA_RECUPERACION = html_desde_campos(CAMPOS_RECUPERACION)

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


def campos_validos(campos: Mapping[str, str] | None) -> dict[str, str] | None:
    """Campos recortados y completos, o ``None`` si falta alguno o es demasiado largo."""
    if not campos:
        return None
    limpios: dict[str, str] = {}
    for clave in CAMPOS_ORDEN:
        valor = campos.get(clave, "")
        if not isinstance(valor, str):
            return None
        valor = valor.strip()
        if not valor or len(valor) > 400:
            return None
        limpios[clave] = valor
    return limpios


def contexto_prueba(nombre: str) -> dict[str, str]:
    """Datos de la prueba de envío: la plantilla real con un enlace a la página pública."""
    settings = get_settings()
    return {
        "nombre": nombre,
        "enlace": f"{settings.public_url_base}/login/recuperar",
        "expira_en": mostrar_ttl(settings.recuperacion_ttl_minutos),
    }


def contexto_ejemplo() -> dict[str, str]:
    """Datos sintéticos de la vista previa: nunca de una persona real."""
    settings = get_settings()
    return {
        "nombre": "Ana Pérez",
        "enlace": f"{settings.public_url_base}/restablecer/ejemplo",
        "expira_en": mostrar_ttl(settings.recuperacion_ttl_minutos),
    }


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
