import { http, HttpResponse, type HttpHandler } from 'msw';
import { crearHandlersDatos, errorApi, type ErrorResponse } from './handlers';

/**
 * Handlers de flujo con sesión en memoria para historias interactivas de Storybook.
 * - Cada llamada a `crearHandlersFlujo` reinicia la sesión: no depende del orden.
 * - Datos y credenciales son sintéticos, solo para demostración; no representan
 *   personas ni cuentas reales.
 * - Acepta `/api/...` y `.../auth/...` como el resto de mocks del catálogo.
 */

export type RolBackendFlujo = 'doctor' | 'admin' | 'researcher';

export interface OpcionesFlujo {
  roles?: RolBackendFlujo[];
  rolActivo?: RolBackendFlujo;
  correo?: string;
  nombre?: string;
}

interface SesionFlujo {
  usuario: { id: string; correo: string; nombre: string };
  roles: RolBackendFlujo[];
  rol_activo: RolBackendFlujo;
  segundos_para_expirar: number | null;
}

interface CuentaDemo {
  correo: string;
  nombre: string;
  roles: RolBackendFlujo[];
  rolActivo: RolBackendFlujo;
}

const CUENTAS_DEMO: Record<string, CuentaDemo> = {
  'medico@demo.test': {
    correo: 'medico@demo.test',
    nombre: 'Médica Demo',
    roles: ['doctor'],
    rolActivo: 'doctor',
  },
  'admin@demo.test': {
    correo: 'admin@demo.test',
    nombre: 'Administración Demo',
    roles: ['admin'],
    rolActivo: 'admin',
  },
  'dual@demo.test': {
    correo: 'dual@demo.test',
    nombre: 'Persona Demo Multirrol',
    roles: ['doctor', 'admin'],
    rolActivo: 'doctor',
  },
};

const AUTH_ME = /\/(?:api\/)?auth\/me(?:\?.*)?$/;
const AUTH_LOGIN = /\/(?:api\/)?auth\/login(?:\?.*)?$/;
const AUTH_ROL = /\/(?:api\/)?auth\/rol-activo(?:\?.*)?$/;
const AUTH_LOGOUT = /\/(?:api\/)?auth\/logout(?:\?.*)?$/;

function sesionInicial(opciones?: OpcionesFlujo): SesionFlujo | null {
  if (!opciones || (!opciones.roles && !opciones.rolActivo && !opciones.correo)) return null;
  const roles = opciones.roles ?? (opciones.rolActivo ? [opciones.rolActivo] : ['doctor']);
  const rol_activo =
    opciones.rolActivo && roles.includes(opciones.rolActivo)
      ? opciones.rolActivo
      : (roles[0] as RolBackendFlujo);
  return {
    usuario: {
      id: 'usr-flujo-demo',
      correo: opciones.correo ?? 'demo@demo.test',
      nombre: opciones.nombre ?? 'Persona Demo',
    },
    roles,
    rol_activo,
    segundos_para_expirar: 3600,
  };
}

function respuestaSesion(sesion: SesionFlujo): SesionFlujo {
  return { ...sesion, usuario: { ...sesion.usuario }, roles: [...sesion.roles] };
}

function noAutenticado(): HttpResponse<ErrorResponse> {
  return HttpResponse.json(errorApi('not_authenticated', 'No autenticado', 'req-demo-msw'), {
    status: 401,
  });
}

/** Crea handlers de autenticación con estado y datos de demostración. */
export function crearHandlersFlujo(opciones?: OpcionesFlujo): HttpHandler[] {
  let sesion = sesionInicial(opciones);

  const identidad = http.get(AUTH_ME, () => {
    if (!sesion) return noAutenticado();
    return HttpResponse.json(respuestaSesion(sesion));
  });

  const login = http.post(AUTH_LOGIN, async ({ request }) => {
    const cuerpo = (await request.json().catch(() => ({}))) as {
      correo?: string;
      password?: string;
    };
    const correo = typeof cuerpo.correo === 'string' ? cuerpo.correo : '';
    const password = typeof cuerpo.password === 'string' ? cuerpo.password : '';
    const cuenta = CUENTAS_DEMO[correo];
    if (!cuenta || password === '') {
      return HttpResponse.json(
        errorApi('invalid_credentials', 'Credenciales inválidas', 'req-demo-msw'),
        { status: 401 },
      );
    }
    sesion = {
      usuario: { id: `usr-${correo}`, correo: cuenta.correo, nombre: cuenta.nombre },
      roles: [...cuenta.roles],
      rol_activo: cuenta.rolActivo,
      segundos_para_expirar: 3600,
    };
    return HttpResponse.json(respuestaSesion(sesion));
  });

  const rolActivo = http.put(AUTH_ROL, async ({ request }) => {
    if (!sesion) return noAutenticado();
    const cuerpo = (await request.json().catch(() => ({}))) as { rol?: string };
    const rol = cuerpo.rol as RolBackendFlujo | undefined;
    if (!rol || !sesion.roles.includes(rol)) {
      return HttpResponse.json(errorApi('forbidden', 'Rol no permitido', 'req-demo-msw'), {
        status: 403,
      });
    }
    sesion = { ...sesion, rol_activo: rol };
    return HttpResponse.json(respuestaSesion(sesion));
  });

  const logout = http.post(AUTH_LOGOUT, () => {
    sesion = null;
    return new HttpResponse(null, { status: 204 });
  });

  return [identidad, login, rolActivo, logout, ...crearHandlersDatos('ok')];
}
