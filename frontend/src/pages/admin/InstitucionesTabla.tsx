import { Pencil, Power, PowerOff } from 'lucide-react';
import {
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
    <Table caption="Listado de instituciones" className="table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead className="w-32">Código</TableHead>
          <TableHead className="w-40 text-right">Usuarios activos</TableHead>
          <TableHead className="w-28">Estado</TableHead>
          <TableHead className="w-64 px-2">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {instituciones.map((institucion) => (
          <TableRow key={institucion.id}>
            <TableCell className="py-7 font-medium text-foreground">{institucion.nombre}</TableCell>
            <TableCell className="py-7">{institucion.codigo}</TableCell>
            <TableCell className="py-7 text-right tabular-nums">
              {institucion.usuarios_activos}
            </TableCell>
            <TableCell className="py-7">
              <StatusBadge kind="user" status={institucion.activa ? 'Activo' : 'Inactivo'} />
            </TableCell>
            <TableCell className="px-2 py-5">
              <div className="flex flex-nowrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={`Editar institución ${institucion.codigo}`}
                  onClick={() => onEditar(institucion)}
                >
                  <Pencil aria-hidden className="size-4" />
                  Editar
                </Button>
                {institucion.activa ? (
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Desactivar institución ${institucion.codigo}`}
                    onClick={() => onSolicitarDesactivar(institucion)}
                    className="border-danger/40 text-danger hover:bg-danger/10"
                  >
                    <PowerOff aria-hidden className="size-4" />
                    Desactivar
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Activar institución ${institucion.codigo}`}
                    onClick={() => onActivar(institucion)}
                    className="border-success/40 text-success hover:bg-success/10"
                  >
                    <Power aria-hidden className="size-4" />
                    Activar
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
