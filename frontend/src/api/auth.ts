export interface AuthUsuario {
  id: string;
  correo: string;
  nombre: string;
}

export interface AuthSession {
  usuario: AuthUsuario;
  roles: string[];
  rol_activo: string;
  permisos?: string[];
  segundos_para_expirar?: number | null;
  segundo_factor_activo?: boolean;
}

export type LoginChallenge = { desafio: string; segundos_para_expirar: number };

export type LoginResult =
  { ok: true; session: AuthSession } | { ok: false; status: number; challenge?: LoginChallenge };

export type MeResult = { ok: true; session: AuthSession } | { ok: false; status: number };

export type LogoutResult = { ok: true } | { ok: false; status: number };

export type SetRolActivoResult = { ok: true; session: AuthSession } | { ok: false; status: number };

export async function loginWithCredentials(correo: string, password: string): Promise<LoginResult> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ correo, password }),
  });

  if (res.status === 202) {
    const challenge = (await res.json()) as {
      requiere_otp: true;
      desafio: string;
      segundos_para_expirar: number;
    };
    return {
      ok: false,
      status: res.status,
      challenge: {
        desafio: challenge.desafio,
        segundos_para_expirar: challenge.segundos_para_expirar,
      },
    };
  }
  if (!res.ok) {
    if (res.status === 401 || res.status === 403 || res.status === 422) {
      return { ok: false, status: res.status };
    }
    return { ok: false, status: res.status };
  }

  const data = (await res.json()) as AuthSession;
  return { ok: true, session: data };
}

export async function me(): Promise<MeResult> {
  const res = await fetch('/api/auth/me', {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      return { ok: false, status: res.status };
    }
    return { ok: false, status: res.status };
  }

  const data = (await res.json()) as AuthSession;
  return { ok: true, session: data };
}

export async function logout(): Promise<LogoutResult> {
  const res = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });

  if (res.status === 204 || res.ok) {
    return { ok: true };
  }

  if (res.status === 401) {
    return { ok: false, status: res.status };
  }
  return { ok: true };
}

export async function setRolActivo(rol: string): Promise<SetRolActivoResult> {
  const res = await fetch('/api/auth/rol-activo', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ rol }),
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403 || res.status === 422) {
      return { ok: false, status: res.status };
    }
    return { ok: false, status: res.status };
  }

  const data = (await res.json()) as AuthSession;
  return { ok: true, session: data };
}

export const login = loginWithCredentials;

export type CambioPasswordResultado = { ok: true } | { ok: false; codigo: string; mensaje: string };

/** Cambia la contraseña propia; el servidor exige la actual y cierra las demás sesiones. */
export async function cambiarPassword(
  passwordActual: string,
  passwordNueva: string,
): Promise<CambioPasswordResultado> {
  const res = await fetch('/api/auth/password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ password_actual: passwordActual, password_nueva: passwordNueva }),
  });

  if (res.ok) {
    return { ok: true };
  }

  let codigo = 'error';
  let mensaje = 'No se pudo cambiar la contraseña. Reintenta en un momento.';
  try {
    const data = (await res.json()) as { error?: { code?: string; message?: string } };
    codigo = data.error?.code ?? codigo;
    mensaje = data.error?.message ?? mensaje;
  } catch {
    // Sin cuerpo JSON se conserva el mensaje genérico.
  }
  return { ok: false, codigo, mensaje };
}

export type AuthApiError = { ok: false; status: number; codigo: string };

async function apiError(res: Response): Promise<AuthApiError> {
  let codigo = 'error';
  try {
    const data = (await res.json()) as { error?: { code?: string } };
    codigo = data.error?.code ?? codigo;
  } catch {
    // La respuesta puede no tener cuerpo JSON.
  }
  return { ok: false, status: res.status, codigo };
}

export async function loginOtp(desafio: string, codigo: string) {
  const res = await fetch('/api/auth/login/otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ desafio, codigo }),
  });
  if (!res.ok) return apiError(res);
  return { ok: true as const, session: (await res.json()) as AuthSession };
}

export async function iniciarSegundoFactor() {
  const res = await fetch('/api/auth/2fa/iniciar', { method: 'POST', credentials: 'include' });
  if (!res.ok) return apiError(res);
  return {
    ok: true as const,
    ...((await res.json()) as { secreto: string; uri: string }),
  };
}

export async function confirmarSegundoFactor(codigo: string) {
  const res = await fetch('/api/auth/2fa/confirmar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ codigo }),
  });
  if (!res.ok) return apiError(res);
  return {
    ok: true as const,
    ...((await res.json()) as { segundo_factor_activo: true; codigos_recuperacion: string[] }),
  };
}

export async function desactivarSegundoFactor(password: string) {
  const res = await fetch('/api/auth/2fa/desactivar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ password }),
  });
  return res.ok ? { ok: true as const } : apiError(res);
}
