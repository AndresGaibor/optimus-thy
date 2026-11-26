import type { AuthSession } from '../api/auth';
import { mapBackendRoleToUi, type Role } from './roles';

/** Sesión del backend ya traducida a los tipos que usa la interfaz. */
export interface SesionUi {
  usuario: { id: string; correo: string; nombre: string };
  roles: Role[];
  rolActivo: Role;
  permisos: string[];
  segundosParaExpirar: number | null | undefined;
}

/** Devuelve `null` cuando la cuenta no tiene un rol activo reconocible. */
export function mapearSesion(session: AuthSession): SesionUi | null {
  const rolActivo = mapBackendRoleToUi(session.rol_activo);
  if (!rolActivo) return null;
  return {
    usuario: {
      id: session.usuario.id,
      correo: session.usuario.correo,
      nombre: session.usuario.nombre,
    },
    roles: (session.roles || [])
      .map((r) => mapBackendRoleToUi(r))
      .filter((r): r is Role => r !== null),
    rolActivo,
    permisos: session.permisos ?? [],
    segundosParaExpirar: session.segundos_para_expirar,
  };
}
