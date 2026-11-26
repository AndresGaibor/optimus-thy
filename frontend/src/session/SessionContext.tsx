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
import { mapearSesion } from './mapearSesion';
import {
  login as loginApi,
  loginOtp,
  logout as logoutApi,
  me as meApi,
  type AuthSession,
  type LoginChallenge,
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
  ) => Promise<
    { ok: true; rol: Role } | { ok: false; mensaje: string; challenge?: LoginChallenge }
  >;
  /** Completa el segundo factor con un código TOTP o de recuperación. */
  verificarOtp: (
    desafio: string,
    codigo: string,
  ) => Promise<{ ok: true; rol: Role } | { ok: false; mensaje: string; codigo: string }>;
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

  const aplicarSesion = useCallback((session: AuthSession): Role | null => {
    const datos = mapearSesion(session);
    if (!datos) return null;
    setUsuario(datos.usuario);
    setRoles(datos.roles);
    setPermisos(datos.permisos);
    setRolActivo(datos.rolActivo);
    setEstado('autenticado');
    setExpiraEn(instanteDeExpiracion(datos.segundosParaExpirar));
    ultimaRenovacion.current = Date.now();
    return datos.rolActivo;
  }, []);

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
      const datos = mapearSesion(res.session);
      if (!datos) {
        setUsuario(null);
        setRoles([]);
        setRolActivo(null);
        setPermisos([]);
        setEstado('anonimo');
        return;
      }
      aplicarSesion(res.session);
    })();
    return () => {
      cancelado = true;
    };
  }, [aplicarSesion]);

  const login = useCallback(
    async (
      correo: string,
      password: string,
    ): Promise<
      { ok: true; rol: Role } | { ok: false; mensaje: string; challenge?: LoginChallenge }
    > => {
      const res = await loginApi(correo, password);
      if (!res.ok) {
        if (res.challenge) {
          return {
            ok: false,
            mensaje: 'Escribe el código de seis dígitos de tu aplicación de autenticación.',
            challenge: res.challenge,
          };
        }
        return { ok: false, mensaje: 'No pudimos iniciar sesión. Revisa tu correo y contraseña.' };
      }
      const rol = aplicarSesion(res.session);
      if (!rol) {
        return { ok: false, mensaje: 'No pudimos iniciar sesión. Revisa tu correo y contraseña.' };
      }
      return { ok: true, rol };
    },
    [aplicarSesion],
  );

  const verificarOtp = useCallback(
    async (
      desafio: string,
      codigo: string,
    ): Promise<{ ok: true; rol: Role } | { ok: false; mensaje: string; codigo: string }> => {
      const res = await loginOtp(desafio, codigo);
      if (!res.ok) {
        return {
          ok: false,
          codigo: res.codigo,
          mensaje:
            res.codigo === 'desafio_expirado'
              ? 'La verificación expiró. Vuelve a iniciar sesión.'
              : 'El código no es válido.',
        };
      }
      const rol = aplicarSesion(res.session);
      if (!rol) {
        return { ok: false, codigo: 'sin_rol', mensaje: 'Tu cuenta no tiene un rol activo.' };
      }
      return { ok: true, rol };
    },
    [aplicarSesion],
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
      verificarOtp,
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
      verificarOtp,
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
