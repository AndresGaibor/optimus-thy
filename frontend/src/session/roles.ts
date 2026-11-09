export const ROLES = ['medico', 'investigador', 'administrador'] as const;
export type Role = (typeof ROLES)[number];

export type BackendRole = 'admin' | 'doctor' | 'researcher';

export const ROL_BACKEND_A_UI: Record<BackendRole, Role> = {
  admin: 'administrador',
  doctor: 'medico',
  researcher: 'investigador',
};

export const ROL_UI_A_BACKEND: Record<Role, BackendRole> = {
  administrador: 'admin',
  medico: 'doctor',
  investigador: 'researcher',
};

export interface SessionUser {
  id: string;
  correo?: string;
  nombre?: string;
  role: Role;
}

export function homePathFor(role: Role): string {
  return `/${role}`;
}

export const ROLE_LABEL: Record<Role, string> = {
  medico: 'Médico',
  investigador: 'Investigador',
  administrador: 'Administrador',
};

export function mapBackendRoleToUi(rolBackend: string): Role | null {
  if (rolBackend === 'admin') return 'administrador';
  if (rolBackend === 'doctor') return 'medico';
  if (rolBackend === 'researcher') return 'investigador';
  return null;
}

export function mapUiRoleToBackend(rolUi: Role): BackendRole {
  return ROL_UI_A_BACKEND[rolUi];
}
