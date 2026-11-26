import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { instanteDeExpiracion, RENOVAR_CADA_MS, sesionPorExpirar } from './expiry';
import {
  login as loginApi,
  logout as logoutApi,
  me as meApi,
  setRolActivo as setRolActivoApi,
  type MeResult,
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
  permisos: string[];
  login: (
    correo: string,
    password: string,
  ) => Promise<{ ok: true; rol: Role } | { ok: false; mensaje: string }>;
  logout: () => Promise<void>;
  cambiarRolActivo: (rol: Role) => Promise<void>;
  /** Aviso de HU-005: la sesión está por expirar por inactividad. */
  sesionPorExpirar: boolean;
  /** Renueva la actividad de la sesión; si ya expiró, pasa a anónimo. */
  renovarSesion: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<'cargando' | 'anonimo' | 'autenticado'>('cargando');
  const [usuario, setUsuario] = useState<SessionUsuario | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolActivo, setRolActivo] = useState<Role | null>(null);
  const [permisos, setPermisos] = useState<string[]>([]);
  const [expiraEn, setExpiraEn] = useState<number | null>(null);
  const [avisoExpirar, setAvisoExpirar] = useState(false);
  const ultimaRenovacion = useRef(0);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      let res: MeResult;
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
        setPermisos([]);
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
        setPermisos([]);
        setEstado('anonimo');
        return;
      }
      setUsuario({
        id: session.usuario.id,
        correo: session.usuario.correo,
        nombre: session.usuario.nombre,
      });
      setRoles(rolesUi);
      setPermisos(session.permisos ?? []);
      setRolActivo(rolActivoUi);
      setEstado('autenticado');
      setExpiraEn(instanteDeExpiracion(session.segundos_para_expirar));
      ultimaRenovacion.current = Date.now();
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
      setPermisos(session.permisos ?? []);
      setRolActivo(rolActivoUi);
      setEstado('autenticado');
      setExpiraEn(instanteDeExpiracion(session.segundos_para_expirar));
      ultimaRenovacion.current = Date.now();
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
    setPermisos([]);
    setRolActivo(null);
    setExpiraEn(null);
    setAvisoExpirar(false);
    setEstado('anonimo');
  }, []);
  const renovarSesion = useCallback(async () => {
    let res: MeResult;
    try {
      res = await meApi();
    } catch {
      res = { ok: false, status: 0 };
    }
    if (!res.ok) {
      setUsuario(null);
      setRoles([]);
      setPermisos([]);
      setRolActivo(null);
      setExpiraEn(null);
      setAvisoExpirar(false);
      setEstado('anonimo');
      return;
    }
    setPermisos(res.session.permisos ?? []);
    setExpiraEn(instanteDeExpiracion(res.session.segundos_para_expirar));
    ultimaRenovacion.current = Date.now();
    setAvisoExpirar(false);
  }, []);

  // HU-005: solo la actividad real del usuario mantiene viva la sesión; si se aleja, expira.
  useEffect(() => {
    if (estado !== 'autenticado') return;
    const alUsar = () => {
      if (Date.now() - ultimaRenovacion.current < RENOVAR_CADA_MS) return;
      void renovarSesion();
    };
    window.addEventListener('pointerdown', alUsar);
    window.addEventListener('keydown', alUsar);
    return () => {
      window.removeEventListener('pointerdown', alUsar);
      window.removeEventListener('keydown', alUsar);
    };
  }, [estado, renovarSesion]);

  useEffect(() => {
    setAvisoExpirar(sesionPorExpirar(expiraEn));
    if (expiraEn === null) return;
    const id = window.setInterval(() => setAvisoExpirar(sesionPorExpirar(expiraEn)), 5000);
    return () => window.clearInterval(id);
  }, [expiraEn]);

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
    setPermisos(session.permisos ?? []);
  }, []);

  const value = useMemo(
    () => ({
      estado,
      usuario,
      roles,
      rolActivo,
      permisos,
      login,
      logout,
      cambiarRolActivo,
      sesionPorExpirar: avisoExpirar,
      renovarSesion,
    }),
    [
      estado,
      usuario,
      roles,
      rolActivo,
      permisos,
      login,
      logout,
      cambiarRolActivo,
      avisoExpirar,
      renovarSesion,
    ],
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

export function usePermisosSesion(): string[] {
  return useContext(SessionContext)?.permisos ?? [];
}

export { homePathFor };
