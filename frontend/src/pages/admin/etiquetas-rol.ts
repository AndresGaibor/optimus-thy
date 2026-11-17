import { mapBackendRoleToUi, ROLE_LABEL } from '../../session/roles';

export function obtenerEtiquetaRol(rol: string): string {
  const rolUi = mapBackendRoleToUi(rol);
  return rolUi ? ROLE_LABEL[rolUi] : rol;
}
