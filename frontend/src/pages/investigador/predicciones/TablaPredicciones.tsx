import { Badge } from '../../../design-system/components/atoms/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../design-system/components/atoms/Table';
import type { PrediccionAuditada } from '../../../api/predicciones';
import {
  FORMATO_FECHA,
  etiquetaDiferencia,
  etiquetaResultado,
  huellaCorta,
  lanzadorDe,
  referenciaDe,
} from './compartidos';

export interface TablaPrediccionesProps {
  predicciones: PrediccionAuditada[];
}

/** Una línea por predicción con su referencia clínica y la diferencia calculada. */
export function TablaPredicciones({ predicciones }: TablaPrediccionesProps) {
  return (
    <Table caption="Predicciones auditadas">
      <TableHeader>
        <TableRow>
          <TableHead className="whitespace-nowrap">Fecha y hora (UTC)</TableHead>
          <TableHead>Caso</TableHead>
          <TableHead className="whitespace-nowrap">Modelo</TableHead>
          <TableHead>Resultado</TableHead>
          <TableHead>Lanzó</TableHead>
          <TableHead>Huella de la imagen</TableHead>
          <TableHead>Referencia clínica</TableHead>
          <TableHead>Diferencia</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {predicciones.map((prediccion) => {
          const resultado = etiquetaResultado(prediccion.resultado);
          const diferencia = etiquetaDiferencia(prediccion.diferencia);
          const referencia = prediccion.referencia_clinica;
          return (
            <TableRow key={prediccion.id}>
              <TableCell className="whitespace-nowrap tabular-nums">
                {FORMATO_FECHA.format(new Date(prediccion.creado_en))}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <span className="font-medium text-foreground">{prediccion.caso_codigo}</span>
                <span className="block text-xs text-muted-foreground">
                  {prediccion.paciente_codigo}
                </span>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {prediccion.modelo.nombre}
                <span className="block text-xs text-muted-foreground">
                  v{prediccion.modelo.version}
                </span>
              </TableCell>
              <TableCell>
                <Badge tone={resultado.tono}>{resultado.texto}</Badge>
                {prediccion.confianza === null ? null : (
                  <span className="mt-1 block text-xs text-muted-foreground tabular-nums">
                    {Math.round(prediccion.confianza * 100)} % de confianza
                  </span>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap">{lanzadorDe(prediccion)}</TableCell>
              <TableCell className="whitespace-nowrap font-mono text-xs">
                <span title={prediccion.imagen.hash_sha256}>
                  {huellaCorta(prediccion.imagen.hash_sha256)}
                </span>
              </TableCell>
              <TableCell className="max-w-56">
                <span className="block truncate">{referenciaDe(prediccion)}</span>
                {referencia ? (
                  <span className="block text-xs text-muted-foreground tabular-nums">
                    {FORMATO_FECHA.format(new Date(referencia.creado_en))}
                  </span>
                ) : (
                  <span className="block text-xs text-muted-foreground">
                    Aún sin decisión médica
                  </span>
                )}
              </TableCell>
              <TableCell>
                <Badge tone={diferencia.tono}>{diferencia.texto}</Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
