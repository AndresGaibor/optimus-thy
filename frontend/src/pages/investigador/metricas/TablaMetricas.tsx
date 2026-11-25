import type { MetricasModelo } from '../../../api/metricas';
import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../design-system';
import { etiquetaResultado } from './compartidos';

interface TablaMetricasProps {
  metricas: MetricasModelo;
}

function formatearAcuerdo(acuerdo: number | null): string {
  if (acuerdo === null) return 'No calculable';
  return new Intl.NumberFormat('es-EC', {
    style: 'percent',
    maximumFractionDigits: 2,
  }).format(acuerdo);
}

/** Resumen del modelo y conteos de decisiones desglosados por clase inferida. */
export function TablaMetricas({ metricas }: TablaMetricasProps) {
  const { modelo } = metricas;
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-foreground">{modelo.nombre}</h2>
        <p className="text-sm text-muted-foreground">Versión {modelo.version}</p>
        <p className="break-all text-xs text-muted-foreground">
          Huella de pesos: <code>{modelo.hash_pesos}</code>
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Table caption={`Desglose por resultado del modelo ${modelo.nombre}`}>
          <TableHeader>
            <TableRow>
              <TableHead>Resultado</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Acepta</TableHead>
              <TableHead>Corrige</TableHead>
              <TableHead>Descarta</TableHead>
              <TableHead>Pendiente</TableHead>
              <TableHead>Acuerdo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-surface-subtle font-semibold">
              <TableHead scope="row">Total del modelo</TableHead>
              <TableCell>{metricas.total}</TableCell>
              <TableCell>{metricas.acepta}</TableCell>
              <TableCell>{metricas.corrige}</TableCell>
              <TableCell>{metricas.descarta}</TableCell>
              <TableCell>{metricas.pendiente}</TableCell>
              <TableCell>{formatearAcuerdo(metricas.acuerdo)}</TableCell>
            </TableRow>
            {metricas.por_resultado.map((conteo) => (
              <TableRow key={conteo.resultado}>
                <TableHead scope="row">{etiquetaResultado(conteo.resultado)}</TableHead>
                <TableCell>{conteo.total}</TableCell>
                <TableCell>{conteo.acepta}</TableCell>
                <TableCell>{conteo.corrige}</TableCell>
                <TableCell>{conteo.descarta}</TableCell>
                <TableCell>{conteo.pendiente}</TableCell>
                <TableCell aria-label="No aplica al desglose">—</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground">
          El acuerdo es acepta / total; los casos pendientes se incluyen en el denominador.
        </p>
      </CardContent>
    </Card>
  );
}
