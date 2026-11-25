import { Link } from 'react-router-dom';
import { Badge } from '../../../design-system/components/atoms/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../design-system/components/atoms/Table';
import {
  etiquetaResultado,
  formatearConfianza,
  formatearFecha,
  type FilaHistorial,
} from './compartidos';

interface TablaHistorialProps {
  filas: FilaHistorial[];
  /** En el historial de un caso no se repiten paciente ni caso en cada fila. */
  modo: 'institucional' | 'caso';
}

/** Tabla ordenada de inferencias con fecha, imagen, resultado y versión del modelo. */
export function TablaHistorial({ filas, modo }: TablaHistorialProps) {
  const institucional = modo === 'institucional';
  return (
    <Table caption="Historial de inferencias">
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          {institucional ? <TableHead>Paciente</TableHead> : null}
          {institucional ? <TableHead>Caso</TableHead> : null}
          <TableHead>Imagen</TableHead>
          <TableHead>Resultado</TableHead>
          <TableHead>Confianza</TableHead>
          <TableHead>Modelo</TableHead>
          {institucional ? <TableHead>Acciones</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {filas.map((fila) => {
          const etiqueta = etiquetaResultado(fila.resultado);
          return (
            <TableRow key={fila.id}>
              <TableCell>{formatearFecha(fila.creado_en)}</TableCell>
              {institucional ? <TableCell>{fila.paciente_codigo ?? '—'}</TableCell> : null}
              {institucional ? (
                <TableCell>
                  <Link className="underline" to={`/medico/casos/${fila.caso_id}`}>
                    {fila.caso_codigo ?? 'Ver caso'}
                  </Link>
                </TableCell>
              ) : null}
              <TableCell>
                <span
                  className="inline-block max-w-40 truncate align-middle"
                  title={fila.imagen_id}
                >
                  Imagen {fila.imagen_id}
                </span>
              </TableCell>
              <TableCell>
                <Badge tone={etiqueta.tono}>{etiqueta.texto}</Badge>
              </TableCell>
              <TableCell>{formatearConfianza(fila.confianza)}</TableCell>
              <TableCell>
                <span>{fila.modelo.nombre}</span>{' '}
                <span className="text-muted-foreground">v{fila.modelo.version}</span>
              </TableCell>
              {institucional ? (
                <TableCell>
                  <Link className="underline" to={`/medico/casos/${fila.caso_id}`}>
                    Ver caso
                  </Link>
                </TableCell>
              ) : null}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
