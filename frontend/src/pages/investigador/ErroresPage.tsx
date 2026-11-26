import { useState } from 'react';
import { type ErrorPrediccion, type TipoError } from '../../api/errores';
import { Badge } from '../../design-system/components/atoms/Badge';
import { Button } from '../../design-system/components/atoms/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../design-system/components/atoms/Card';
import { Select } from '../../design-system/components/atoms/Select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../design-system/components/atoms/Table';
import { Callout } from '../../design-system/components/molecules/Callout';
import { EmptyState } from '../../design-system/components/molecules/EmptyState';
import { Field } from '../../design-system/components/molecules/Field';
import { PageHeader } from '../../design-system/components/molecules/PageHeader';
import { useErrores } from './errores/useErrores';

const FORMATO_FECHA = new Intl.DateTimeFormat('es-EC', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

const ETIQUETA_TIPO: Record<ErrorPrediccion['tipo'], string> = {
  falso_positivo: 'Falso positivo',
  falso_negativo: 'Falso negativo',
};

function TonoTipo({ tipo }: { tipo: ErrorPrediccion['tipo'] }) {
  return (
    <Badge tone={tipo === 'falso_positivo' ? 'warning' : 'danger'}>{ETIQUETA_TIPO[tipo]}</Badge>
  );
}

/**
 * ## Cuándo usarlo
 * Para revisar dónde falla el modelo, separando falsos positivos y negativos.
 * ## Cuándo no usarlo
 * No sustituye a la auditoría de una predicción concreta ni a las métricas agregadas.
 * ## Anatomía
 * - Encabezado, filtro por tipo, contadores y tabla de predicciones corregidas.
 * ## Accesibilidad
 * El filtro lleva etiqueta visible; el estado de carga se anuncia y los errores usan `role="alert"`.
 * ## Responsive
 * La tabla se desplaza horizontalmente; los contadores se apilan en 360 px.
 */
export function ErroresPage() {
  const [tipo, setTipo] = useState<TipoError>('todos');
  const { datos, cargando, error, recargar } = useErrores(tipo);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Análisis de errores"
        description="Predicciones que el médico corrigió: falsos positivos y falsos negativos."
      />
      <Card>
        <CardHeader>
          <CardTitle as="h2" className="text-lg">
            Correcciones registradas
          </CardTitle>
          <CardDescription>
            {datos
              ? `${datos.falsos_positivos} falsos positivos · ${datos.falsos_negativos} falsos negativos`
              : 'Cargando el reparto de errores.'}
          </CardDescription>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <Field label="Tipo de error" className="w-52">
              <Select value={tipo} onChange={(evento) => setTipo(evento.target.value as TipoError)}>
                <option value="todos">Todos</option>
                <option value="falso_positivo">Falsos positivos</option>
                <option value="falso_negativo">Falsos negativos</option>
              </Select>
            </Field>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <Callout tone="danger" role="alert">
              {error}
              <div className="mt-3">
                <Button variant="secondary" size="sm" onClick={recargar}>
                  Reintentar
                </Button>
              </div>
            </Callout>
          ) : cargando ? (
            <p role="status" className="text-sm text-muted-foreground">
              Cargando errores…
            </p>
          ) : !datos || datos.items.length === 0 ? (
            <EmptyState
              title="Sin errores registrados"
              description="Las predicciones corregidas por un médico aparecerán aquí."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table caption="Predicciones corregidas por el médico">
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Caso</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Predicción</TableHead>
                    <TableHead>Corrección</TableHead>
                    <TableHead>Confianza</TableHead>
                    <TableHead>Fecha (UTC)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datos.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <TonoTipo tipo={item.tipo} />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{item.caso_codigo}</TableCell>
                      <TableCell className="font-mono text-xs">{item.paciente_codigo}</TableCell>
                      <TableCell>
                        {item.modelo.nombre} {item.modelo.version}
                      </TableCell>
                      <TableCell>{item.resultado}</TableCell>
                      <TableCell>{item.resultado_corregido}</TableCell>
                      <TableCell className="tabular-nums">
                        {item.confianza === null ? '—' : item.confianza.toFixed(2)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {FORMATO_FECHA.format(new Date(item.creado_en))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
