import { http, HttpResponse, type HttpHandler } from 'msw';
import type { EscenarioApi } from './handlers';

/**
 * Handlers del correo saliente: configuración SMTP, plantilla y vista previa.
 *
 * Reciben las ayudas del catálogo para no duplicar el manejo de escenarios ni
 * el formato de errores.
 */
const RUTAS = {
  configuracion: /\/configuracion-correo(?:\?.*)?$/,
  prueba: /\/configuracion-correo\/probar$/,
  plantilla: /\/plantillas-correo\/recuperacion(?:\?.*)?$/,
  restaurar: /\/plantillas-correo\/recuperacion\/restaurar$/,
  preview: /\/plantillas-correo\/recuperacion\/preview$/,
};

export const configuracionCorreoOk = {
  host: 'smtp.gmail.com',
  puerto: 587,
  seguridad: 'starttls',
  usuario: 'ana.garcia@example.test',
  remitente: 'ana.garcia@example.test',
  remitente_nombre: 'OPTIMUS-THY',
  activo: true,
  tiene_password: true,
};

export const camposCorreoOk = {
  titulo: 'Restablece tu contraseña',
  mensaje: 'Recibimos una solicitud para restablecer la contraseña de tu cuenta.',
  boton: 'Elige una contraseña nueva',
  nota: 'El enlace caduca en {{expira_en}} y solo puede usarse una vez.',
  pie: 'Si no fuiste tú, ignora este mensaje.',
};

export const plantillaCorreoOk = {
  clave: 'recuperacion',
  asunto: 'Restablece tu contraseña en OPTIMUS-THY',
  html: '<p>Hola {{nombre}},</p><p><a href="{{enlace}}">Elige una contraseña nueva</a></p><p>Caduca en {{expira_en}}.</p>',
  modo: 'visual' as const,
  campos: camposCorreoOk,
  variables: ['enlace', 'expira_en', 'nombre'],
  de_fabrica: true,
};

const DATOS_EJEMPLO = {
  nombre: 'Ana Pérez',
  enlace: 'https://ejemplo.test/restablecer/x',
  expira_en: '30 minutos',
};

function sustituir(texto: string): string {
  return texto.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_todo, clave: string) =>
    clave in DATOS_EJEMPLO ? DATOS_EJEMPLO[clave as keyof typeof DATOS_EJEMPLO] : '',
  );
}

/** Maqueta del correo tal como lo compone el backend en modo Diseño. */
function tarjeta(campos: Record<string, string>): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0;padding:24px;background:#f4f5f7">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
      <tr><td style="padding:32px 32px 8px">
        <p style="margin:0 0 20px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280">OPTIMUS-THY</p>
        <h1 style="margin:0 0 16px;font-size:21px;line-height:1.3;font-weight:600;color:#111827">${sustituir(campos.titulo ?? '')}</h1>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.6">Hola ${DATOS_EJEMPLO.nombre},</p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6">${sustituir(campos.mensaje ?? '')}</p>
      </td></tr>
      <tr><td style="padding:0 32px 24px">
        <a href="${DATOS_EJEMPLO.enlace}" style="display:inline-block;background:#4f46e5;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 22px;border-radius:8px">${sustituir(campos.boton ?? '')}</a>
      </td></tr>
      <tr><td style="padding:0 32px 28px">
        <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280">${sustituir(campos.nota ?? '')}</p>
      </td></tr>
      <tr><td style="padding:18px 32px 26px;border-top:1px solid #e5e7eb">
        <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280">${sustituir(campos.pie ?? '')}</p>
      </td></tr>
    </table>
  </td></tr>
</table>`;
}

/** Handlers de `/configuracion-correo` y `/plantillas-correo`. */
export function crearHandlersCorreo(
  escenario: EscenarioApi,
  demorar: () => Promise<void>,
  respuestaError: (detalle: string) => Response | null,
): HttpHandler[] {
  return [
    http.get(RUTAS.configuracion, async () => {
      const error = respuestaError('Permiso insuficiente');
      if (error) return error;
      await demorar();
      if (escenario === 'vacio') {
        return HttpResponse.json({
          ...configuracionCorreoOk,
          usuario: '',
          remitente: '',
          activo: false,
          tiene_password: false,
        });
      }
      return HttpResponse.json(configuracionCorreoOk);
    }),
    http.put(RUTAS.configuracion, async ({ request }) => {
      const cuerpo = (await request.json()) as Record<string, unknown>;
      await demorar();
      return HttpResponse.json({
        ...configuracionCorreoOk,
        ...cuerpo,
        password: undefined,
        tiene_password: Boolean(cuerpo.password) || configuracionCorreoOk.tiene_password,
      });
    }),
    http.post(RUTAS.prueba, async () => {
      const error = respuestaError('El servidor de correo rechazó el envío');
      if (error) return error;
      await demorar();
      return HttpResponse.json({ destinatario: 'ana.garcia@example.test' });
    }),
    http.get(RUTAS.plantilla, async () => {
      const error = respuestaError('Permiso insuficiente');
      if (error) return error;
      await demorar();
      return HttpResponse.json(plantillaCorreoOk);
    }),
    http.put(RUTAS.plantilla, async ({ request }) => {
      const cuerpo = (await request.json()) as {
        asunto?: string;
        modo?: 'visual' | 'html';
        campos?: Record<string, string>;
        html?: string;
      };
      await demorar();
      return HttpResponse.json({
        ...plantillaCorreoOk,
        ...cuerpo,
        html: cuerpo.html ?? plantillaCorreoOk.html,
        campos: cuerpo.campos ?? plantillaCorreoOk.campos,
        de_fabrica: false,
      });
    }),
    http.post(RUTAS.preview, async ({ request }) => {
      const cuerpo = (await request.json()) as {
        asunto?: string;
        html?: string;
        campos?: Record<string, string>;
      };
      await demorar();
      const html = cuerpo.campos ? tarjeta(cuerpo.campos) : sustituir(cuerpo.html ?? '');
      return HttpResponse.json({
        asunto: sustituir(cuerpo.asunto ?? plantillaCorreoOk.asunto),
        html,
      });
    }),
    http.post(RUTAS.restaurar, async () => {
      await demorar();
      return HttpResponse.json(plantillaCorreoOk);
    }),
  ];
}
