import { Fragment, useMemo } from 'react';
import { Checkbox } from '../../design-system/components/atoms/Checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../design-system/components/atoms/Table';
import type { Permiso, RolMatriz } from '../../api/roles';
import { mapBackendRoleToUi, ROLE_LABEL } from '../../session/roles';

const GRUPOS: Record<string, string> = {
  ajustes: 'Ajustes',
  auditoria: 'Auditoría',
  caso: 'Casos',
  documento: 'Documentos',
  ficha: 'Ficha clínica',
  imagen: 'Imágenes',
  inferencia: 'Inferencia',
  investigacion: 'Investigación',
  paciente: 'Pacientes',
  reporte: 'Reportes',
  rol: 'Roles',
  usuario: 'Usuarios',
};

function etiquetaRol(rol: RolMatriz): string {
  const rolUi = mapBackendRoleToUi(rol.nombre);
  return rolUi ? ROLE_LABEL[rolUi] : rol.nombre;
}

export interface RolesTablaProps {
  roles: RolMatriz[];
  permisos: Permiso[];
  seleccion: Record<string, string[]>;
  onAlternar: (rolId: string, codigo: string) => void;
}

/** Matriz de permisos agrupada por recurso, con casillas por rol. */
export function RolesTabla({ roles, permisos, seleccion, onAlternar }: RolesTablaProps) {
  const grupos = useMemo(() => {
    const mapa = new Map<string, { etiqueta: string; permisos: Permiso[] }>();
    for (const permiso of permisos) {
      const prefijo = permiso.codigo.split(/[.:]/)[0] ?? permiso.codigo;
      const grupo = mapa.get(prefijo) ?? { etiqueta: GRUPOS[prefijo] ?? prefijo, permisos: [] };
      grupo.permisos.push(permiso);
      mapa.set(prefijo, grupo);
    }
    return [...mapa.values()].sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es'));
  }, [permisos]);

  return (
    <Table caption="Matriz de permisos por rol">
      <TableHeader>
        <TableRow>
          <TableHead className="sticky top-0 z-10 bg-background">Permiso</TableHead>
          {roles.map((rol) => (
            <TableHead key={rol.id} className="sticky top-0 z-10 w-36 bg-background text-center">
              {etiquetaRol(rol)}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {grupos.map((grupo) => (
          <Fragment key={grupo.etiqueta}>
            <TableRow className="bg-border-subtle/60 hover:bg-border-subtle/60">
              <TableCell
                colSpan={1 + roles.length}
                className="py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {grupo.etiqueta}
              </TableCell>
            </TableRow>
            {grupo.permisos.map((permiso) => (
              <TableRow key={permiso.codigo}>
                <TableCell className="py-3">
                  <span className="block font-medium text-foreground">
                    {permiso.descripcion ?? permiso.codigo}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{permiso.codigo}</span>
                </TableCell>
                {roles.map((rol) => {
                  const aplica = (rol.asignables ?? []).includes(permiso.codigo);
                  const marcado = (seleccion[rol.id] ?? []).includes(permiso.codigo);
                  return (
                    <TableCell key={`${rol.id}-${permiso.codigo}`} className="py-3 text-center">
                      {aplica ? (
                        <Checkbox
                          checked={marcado}
                          onChange={() => onAlternar(rol.id, permiso.codigo)}
                          aria-label={`Permiso «${permiso.descripcion ?? permiso.codigo}» para ${etiquetaRol(rol)}`}
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">No aplica</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
}
