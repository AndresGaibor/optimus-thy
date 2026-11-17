import {
  ActionsMenu,
  Button,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../design-system';
import type { InstitucionAdmin } from '../../api/instituciones';

export interface InstitucionesTablaProps {
  instituciones: InstitucionAdmin[];
  onEditar: (institucion: InstitucionAdmin) => void;
  onActivar: (institucion: InstitucionAdmin) => void;
  onSolicitarDesactivar: (institucion: InstitucionAdmin) => void;
}

/** Listado de instituciones con edición y cambio de estado. */
export function InstitucionesTabla({
  instituciones,
  onEditar,
  onActivar,
  onSolicitarDesactivar,
}: InstitucionesTablaProps) {
  return (
    <Table caption="Listado de instituciones">
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Código</TableHead>
          <TableHead>Usuarios activos</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="w-40 px-2 sm:px-4">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {instituciones.map((institucion) => (
          <TableRow key={institucion.id}>
            <TableCell className="font-medium text-foreground">{institucion.nombre}</TableCell>
            <TableCell>{institucion.codigo}</TableCell>
            <TableCell>
              {institucion.usuarios_activos > 0 ? institucion.usuarios_activos : '-'}
            </TableCell>
            <TableCell>
              <StatusBadge kind="user" status={institucion.activa ? 'Activo' : 'Inactivo'} />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Editar institución ${institucion.codigo}`}
                  onClick={() => onEditar(institucion)}
                >
                  Editar
                </Button>
                <ActionsMenu
                  label={`Acciones de ${institucion.codigo}`}
                  items={
                    institucion.activa
                      ? [
                          {
                            label: 'Desactivar',
                            tone: 'danger' as const,
                            onSelect: () => onSolicitarDesactivar(institucion),
                          },
                        ]
                      : [{ label: 'Activar', onSelect: () => onActivar(institucion) }]
                  }
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
