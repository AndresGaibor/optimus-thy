import { Card, CardContent, CardHeader, CardTitle } from '../components/atoms/Card';
import { Spinner } from '../components/atoms/Spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/atoms/Table';
import { Callout } from '../components/molecules/Callout';
import { StatCard } from '../components/molecules/StatCard';
import { TrendBars, type TrendBarItem } from '../components/organisms/TrendBars';

export interface PanelMetricasDato {
  label: string;
  value: string;
}

export interface PanelMetricasProps {
  metricas: PanelMetricasDato[];
  panelError?: boolean;
  cargando?: boolean;
}

const TENDENCIA: TrendBarItem[] = [
  { label: 'Lun', value: 12 },
  { label: 'Mar', value: 18 },
  { label: 'Mié', value: 14 },
  { label: 'Jue', value: 22 },
  { label: 'Vie', value: 17 },
];

const COLUMNAS = ['Área', 'Registros', 'Estado'];

const FILAS = [
  ['Consulta externa', '42', 'Revisado'],
  ['Seguimiento', '18', 'Pendiente'],
  ['Laboratorio', '31', 'Revisado'],
];

function Cargando({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <Spinner label={label} />
      Cargando…
    </p>
  );
}

export function PanelMetricas({
  metricas,
  panelError = false,
  cargando = false,
}: PanelMetricasProps) {
  return (
    <div className="space-y-6">
      <section
        aria-label="Indicadores"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metricas.map((metrica) => (
          <StatCard key={metrica.label} label={metrica.label} value={metrica.value} />
        ))}
      </section>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Tendencia semanal</CardTitle>
          </CardHeader>
          <CardContent>
            {cargando ? (
              <Cargando label="Cargando tendencia" />
            ) : (
              <TrendBars caption="Revisiones por día" items={TENDENCIA} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent>
            {cargando ? (
              <Cargando label="Cargando actividad" />
            ) : panelError ? (
              <Callout tone="danger" role="alert" title="No se pudo cargar la actividad">
                El resto del panel sigue disponible. Reintenta en unos minutos.
              </Callout>
            ) : (
              <Table caption="Actividad reciente">
                <TableHeader>
                  <TableRow>
                    {COLUMNAS.map((columna) => (
                      <TableHead key={columna}>{columna}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {FILAS.map((fila) => (
                    <TableRow key={fila[0]}>
                      {fila.map((celda, indice) => (
                        <TableCell key={`${indice}-${celda}`}>{celda}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
