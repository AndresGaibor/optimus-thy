import { Badge } from '../../design-system/components/atoms/Badge';
import { Button } from '../../design-system/components/atoms/Button';
import { TableCell, TableRow } from '../../design-system/components/atoms/Table';
import type { Paciente } from '../../api/pacientes';
import { formatearFecha } from './formato';

interface FilaPacienteProps {
  paciente: Paciente;
  onVerDetalle: (paciente: Paciente) => void;
  onArchivar: (paciente: Paciente) => void;
}

/** Fila del listado de pacientes: código, casos, alta, estado y acciones. */
export function FilaPaciente({ paciente, onVerDetalle, onArchivar }: FilaPacienteProps) {
  const archivado = paciente.archivado_en != null;

  return (
    <TableRow>
      <TableCell className="font-medium">{paciente.codigo}</TableCell>
      <TableCell>{paciente.total_casos}</TableCell>
      <TableCell>{formatearFecha(paciente.creado_en)}</TableCell>
      <TableCell>
        <Badge tone={archivado ? 'warning' : 'success'}>{archivado ? 'Archivado' : 'Activo'}</Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => onVerDetalle(paciente)}>
            Ver detalle
          </Button>
          <Button
            variant="secondary"
            size="sm"
            aria-label={`${archivado ? 'Desarchivar' : 'Archivar'} ${paciente.codigo}`}
            onClick={() => onArchivar(paciente)}
          >
            {archivado ? 'Desarchivar' : 'Archivar'}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
