import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  login as loginApi,
  logout as logoutApi,
  me as meApi,
  setRolActivo as setRolActivoApi,
} from '../api/auth';
import { homePathFor, mapBackendRoleToUi, mapUiRoleToBackend, type Role } from './roles';

export interface SessionUsuario {
  id: string;
  correo: string;
  nombre: string;
}

interface SessionValue {
  estado: 'cargando' | 'anonimo' | 'autenticado';
  usuario: SessionUsuario | null;
  roles: Role[];
  rolActivo: Role | null;
  login: (
    correo: string,
    password: string,
  ) => Promise<{ ok: true; rol: Role } | { ok: false; mensaje: string }>;
  logout: () => Promise<void>;
  cambiarRolActivo: (rol: Role) => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<'cargando' | 'anonimo' | 'autenticado'>('cargando');
  const [usuario, setUsuario] = useState<SessionUsuario | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolActivo, setRolActivo] = useState<Role | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      let res: Awaited<ReturnType<typeof meApi>>;
      try {
        res = await meApi();
      } catch {
        // Red caída o respuesta que no es JSON: sin sesión, no "cargando" para siempre.
        res = { ok: false, status: 0 };
      }
      if (cancelado) return;
      if (!res.ok) {
        setUsuario(null);
        setRoles([]);
        setRolActivo(null);
        setEstado('anonimo');
        return;
      }
      const session = res.session;
      const rolesUi = (session.roles || [])
        .map((r) => mapBackendRoleToUi(r))
        .filter((r): r is Role => r !== null);
      const rolActivoUi = mapBackendRoleToUi(session.rol_activo);
      if (!rolActivoUi) {
        setUsuario(null);
        setRoles([]);
        setRolActivo(null);
        setEstado('anonimo');
        return;
      }
      setUsuario({
        id: session.usuario.id,
        correo: session.usuario.correo,
        nombre: session.usuario.nombre,
      });
      setRoles(rolesUi);
      setRolActivo(rolActivoUi);
      setEstado('autenticado');
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  const login = useCallback(
    async (
      correo: string,
      password: string,
    ): Promise<{ ok: true; rol: Role } | { ok: false; mensaje: string }> => {
      const res = await loginApi(correo, password);
      if (!res.ok) {
        return { ok: false, mensaje: 'No pudimos iniciar sesión. Revisa tu correo y contraseña.' };
      }
      const session = res.session;
      const rolesUi = (session.roles || [])
        .map((r) => mapBackendRoleToUi(r))
        .filter((r): r is Role => r !== null);
      const rolActivoUi = mapBackendRoleToUi(session.rol_activo);
      if (!rolActivoUi) {
        return { ok: false, mensaje: 'No pudimos iniciar sesión. Revisa tu correo y contraseña.' };
      }
      setUsuario({
        id: session.usuario.id,
        correo: session.usuario.correo,
        nombre: session.usuario.nombre,
      });
      setRoles(rolesUi);
      setRolActivo(rolActivoUi);
      setEstado('autenticado');
      return { ok: true, rol: rolActivoUi };
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // ignore
    }
    setUsuario(null);
    setRoles([]);
    setRolActivo(null);
    setEstado('anonimo');
  }, []);

  const cambiarRolActivo = useCallback(async (rol: Role) => {
    const res = await setRolActivoApi(mapUiRoleToBackend(rol));
    if (!res.ok) {
      return;
    }
    const session = res.session;
    const rolesUi = (session.roles || [])
      .map((r) => mapBackendRoleToUi(r))
      .filter((r): r is Role => r !== null);
    const rolActivoUi = mapBackendRoleToUi(session.rol_activo);
    if (!rolActivoUi) {
      return;
    }
    setRoles(rolesUi);
    setRolActivo(rolActivoUi);
  }, []);

  const value = useMemo(
    () => ({ estado, usuario, roles, rolActivo, login, logout, cambiarRolActivo }),
    [estado, usuario, roles, rolActivo, login, logout, cambiarRolActivo],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession debe usarse dentro de SessionProvider');
  }
  return value;
}

export { homePathFor };
