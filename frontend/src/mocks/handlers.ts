import { delay, http, HttpResponse } from 'msw';

/**
 * Handlers MSW con la forma real de contracts/openapi.json / backend.
 * - GET /auth/me       -> LoginResponse { usuario, roles, rol_activo, segundos_para_expirar }
 * - GET /pacientes     -> PacientesListOut { total, items: PacienteOut[] }
 * - GET /roles         -> MatrizOut { roles, permisos }
 * - GET /usuarios      -> { total, items }
 * - GET /instituciones -> Institucion[]
 */

export type EscenarioApi =
  | 'ok'
  | 'vacio'
  | 'cargando'
  | 'lento'
  | 'parcial'
  | 'validacion'
  | 'noAutenticado'
  | 'sesionExpirada'
  | 'sinPermiso'
  | 'error';

export interface UsuarioOut {
  id: string;
  correo: string;
  nombre: string;
}

export interface IdentidadResponse {
  usuario: UsuarioOut;
  roles: string[];
  rol_activo: string | null;
  segundos_para_expirar: number | null;
}

export interface PacienteOut {
  id: string;
  codigo: string;
  creado_en: string;
  total_casos: number;
}

export interface PacientesListResponse {
  total: number;
  items: PacienteOut[];
}

export interface PermisoOut {
  codigo: string;
  descripcion: string | null;
}

export interface RolMatrizOut {
  id: string;
  nombre: string;
  descripcion: string | null;
  permisos: string[];
}

export interface MatrizRolesResponse {
  roles: RolMatrizOut[];
  permisos: PermisoOut[];
}

export interface InstitucionOut {
  id: string;
  nombre: string;
}

export interface UsuarioOutAdmin {
  id: string;
  correo: string;
  nombre: string | null;
  activo: boolean;
  institucion: InstitucionOut;
  roles: string[];
}

export interface UsuariosListResponse {
  total: number;
  items: UsuarioOutAdmin[];
}

export interface ErrorResponse {
  error: { code: string; message: string };
  request_id: string;
}

// Datos sintéticos (sin datos reales). Literales escalares puntuales con `as const`; arrays normales.
export const identidadOk: IdentidadResponse = {
  usuario: { id: 'usr-demo-001', correo: 'medico.demo@optimus.test', nombre: 'Médica Demo' },
  roles: ['medico', 'investigador'],
  rol_activo: 'medico',
  segundos_para_expirar: 3600,
};

export const pacientesOk: PacientesListResponse = {
  total: 3,
  items: [
    { id: 'pac-001', codigo: 'PAC-0001', creado_en: '2026-03-10T10:15:00Z', total_casos: 3 },
    { id: 'pac-002', codigo: 'PAC-0002', creado_en: '2026-04-22T08:40:00Z', total_casos: 1 },
    { id: 'pac-003', codigo: 'PAC-0003', creado_en: '2026-05-01T14:05:00Z', total_casos: 0 },
  ],
};

export const pacientesVacios: PacientesListResponse = { total: 0, items: [] };

export const matrizRolesOk: MatrizRolesResponse = {
  roles: [
    {
      id: 'rol-admin',
      nombre: 'admin',
      descripcion: 'Administración del sistema',
      permisos: ['usuarios:leer', 'usuarios:escribir', 'roles:administrar'],
    },
    {
      id: 'rol-medico',
      nombre: 'medico',
      descripcion: 'Atención clínica',
      permisos: ['pacientes:leer', 'pacientes:escribir', 'casos:leer'],
    },
  ],
  permisos: [
    { codigo: 'usuarios:leer', descripcion: 'Ver usuarios' },
    { codigo: 'usuarios:escribir', descripcion: 'Gestionar usuarios' },
    { codigo: 'roles:administrar', descripcion: 'Administrar roles y permisos' },
    { codigo: 'pacientes:leer', descripcion: 'Ver pacientes' },
    { codigo: 'pacientes:escribir', descripcion: 'Gestionar pacientes' },
    { codigo: 'casos:leer', descripcion: 'Ver casos' },
  ],
};

export const matrizRolesVacia: MatrizRolesResponse = { roles: [], permisos: [] };

export const institucionDemoOk: InstitucionOut = { id: 'inst-demo-1', nombre: 'Hospital Demo' };

export const institucionesOk: InstitucionOut[] = [institucionDemoOk];

// Datos sintéticos (sin datos reales).
export const usuariosOk: UsuarioOutAdmin[] = [
  {
    id: 'u-ana',
    correo: 'ana.garcia@example.test',
    nombre: 'Ana García',
    activo: true,
    institucion: institucionDemoOk,
    roles: ['admin'],
  },
  {
    id: 'u-luis',
    correo: 'luis.perez@example.test',
    nombre: 'Luis Pérez',
    activo: true,
    institucion: institucionDemoOk,
    roles: ['doctor'],
  },
];

export const usuariosVacios: UsuariosListResponse = { total: 0, items: [] };

export function errorApi(code: string, message: string, requestId = 'req-demo-msw'): ErrorResponse {
  return { error: { code, message }, request_id: requestId };
}

function respuestaError(escenario: EscenarioApi, detalleSinPermiso: string): Response | null {
  if (escenario === 'noAutenticado') {
    return HttpResponse.json<ErrorResponse>(errorApi('unauthenticated', 'No autenticado'), {
      status: 401,
    });
  }
  if (escenario === 'sesionExpirada') {
    return HttpResponse.json<ErrorResponse>(errorApi('session_expired', 'Sesión expirada'), {
      status: 401,
    });
  }
  if (escenario === 'sinPermiso') {
    return HttpResponse.json<ErrorResponse>(errorApi('forbidden', detalleSinPermiso), {
      status: 403,
    });
  }
  if (escenario === 'error') {
    return HttpResponse.json<ErrorResponse>(errorApi('internal_error', 'Error interno simulado'), {
      status: 500,
    });
  }
  return null;
}

// Acepta el prefijo /api de desarrollo y la URL directa usada por Vitest.
const API = {
  identidad: /\/(?:api\/)?auth\/me(?:\?.*)?$/,
  pacientes: /\/(?:api\/)?pacientes(?:\?.*)?$/,
  roles: /\/(?:api\/)?roles(?:\?.*)?$/,
  usuarios: /\/(?:api\/)?usuarios(?:\?.*)?$/,
  instituciones: /\/(?:api\/)?instituciones(?:\?.*)?$/,
};

// Handlers de datos (sin identidad). Reutilizable por flujos con sesión propia.
export function crearHandlersDatos(escenario: EscenarioApi = 'ok') {
  const demorar = async () => {
    if (escenario === 'cargando') await delay('infinite');
    if (escenario === 'lento') await delay(1500);
  };
  const resultadoCrear: HttpResponse<PacienteOut | ErrorResponse> =
    escenario === 'validacion'
      ? HttpResponse.json<PacienteOut | ErrorResponse>(
          errorApi('validation_error', 'Hay campos con errores'),
          {
            status: 422,
          },
        )
      : HttpResponse.json<PacienteOut | ErrorResponse>(
          {
            id: 'pac-004',
            codigo: 'PAC-0004',
            creado_en: '2026-06-01T09:00:00Z',
            total_casos: 0,
          },
          { status: 201 },
        );

  return [
    http.get<never, never, PacientesListResponse | ErrorResponse>(API.pacientes, async () => {
      const error = respuestaError(escenario, 'Permiso insuficiente');
      if (error) return error;
      await demorar();
      if (escenario === 'vacio') return HttpResponse.json<PacientesListResponse>(pacientesVacios);
      if (escenario === 'parcial') {
        return HttpResponse.json<PacientesListResponse>({ total: 45, items: pacientesOk.items });
      }
      return HttpResponse.json<PacientesListResponse>(pacientesOk);
    }),
    http.get<never, never, MatrizRolesResponse | ErrorResponse>(API.roles, async () => {
      const error = respuestaError(escenario, 'Permiso insuficiente');
      if (error) return error;
      await demorar();
      if (escenario === 'vacio') return HttpResponse.json<MatrizRolesResponse>(matrizRolesVacia);
      return HttpResponse.json<MatrizRolesResponse>(matrizRolesOk);
    }),
    http.post<never, never, PacienteOut | ErrorResponse>(API.pacientes, () => resultadoCrear),
    http.get<never, never, UsuariosListResponse | ErrorResponse>(API.usuarios, async () => {
      const error = respuestaError(escenario, 'Permiso insuficiente');
      if (error) return error;
      await demorar();
      if (escenario === 'vacio') return HttpResponse.json<UsuariosListResponse>(usuariosVacios);
      return HttpResponse.json<UsuariosListResponse>({
        total: usuariosOk.length,
        items: usuariosOk,
      });
    }),
    http.get<never, never, InstitucionOut[] | ErrorResponse>(API.instituciones, async () => {
      const error = respuestaError(escenario, 'Permiso insuficiente');
      if (error) return error;
      await demorar();
      if (escenario === 'vacio') return HttpResponse.json<InstitucionOut[]>([]);
      return HttpResponse.json<InstitucionOut[]>(institucionesOk);
    }),
  ];
}

export function crearHandlers(escenario: EscenarioApi = 'ok') {
  const demorar = async () => {
    if (escenario === 'cargando') await delay('infinite');
    if (escenario === 'lento') await delay(1500);
  };
  return [
    http.get<never, never, IdentidadResponse | ErrorResponse>(API.identidad, async () => {
      const error = respuestaError(escenario, 'No autenticado o sin permiso');
      if (error) return error;
      await demorar();
      return HttpResponse.json<IdentidadResponse>(identidadOk);
    }),
    ...crearHandlersDatos(escenario),
  ];
}

// Conjunto base usado por defecto (ok).
export const handlers = crearHandlers('ok');
