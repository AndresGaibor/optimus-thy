export interface AuthUsuario {
  id: string;
  correo: string;
  nombre: string;
}

export interface AuthSession {
  usuario: AuthUsuario;
  roles: string[];
  rol_activo: string;
}

export type LoginResult = { ok: true; session: AuthSession } | { ok: false; status: number };

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
