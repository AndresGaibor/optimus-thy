import type { ModeloIA } from '../../api/modelos';
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../design-system';

function fechaModelo(fecha: string) {
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(new Date(fecha));
}

interface ModelosTablaProps {
  modelos: ModeloIA[];
  onActivar: (modelo: ModeloIA) => void;
}

/** Tabla de versiones de modelos de IA con la acción de activar. */
export function ModelosTabla({ modelos, onActivar }: ModelosTablaProps) {
  return (
    <Table caption="Modelos de IA">
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Versión</TableHead>
          <TableHead>SHA-256</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {modelos.map((modelo) => (
          <TableRow key={modelo.id}>
            <TableCell>{modelo.nombre}</TableCell>
            <TableCell>{modelo.version}</TableCell>
            <TableCell>{modelo.hash_pesos.slice(0, 12)}</TableCell>
            <TableCell>
              <Badge tone={modelo.activo ? 'success' : 'neutral'}>
                {modelo.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </TableCell>
            <TableCell>{fechaModelo(modelo.creado_en)}</TableCell>
            <TableCell>
              {modelo.activo ? null : (
                <Button variant="outline" size="sm" onClick={() => onActivar(modelo)}>
                  Activar
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
