import { useState } from 'react';
import type { EstadoSolicitud } from '../../api/solicitudes-derechos';
import { Button } from '../../design-system/components/atoms/Button';
import { Select } from '../../design-system/components/atoms/Select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../design-system/components/atoms/Card';
import { Callout } from '../../design-system/components/molecules/Callout';
import { EmptyState } from '../../design-system/components/molecules/EmptyState';
import { Field } from '../../design-system/components/molecules/Field';
import { PageHeader } from '../../design-system/components/molecules/PageHeader';
import { FormularioSolicitud } from './solicitudes/FormularioSolicitud';
import { TablaSolicitudes } from './solicitudes/TablaSolicitudes';
import { useSolicitudes } from './solicitudes/useSolicitudes';

/**
 * ## Cuándo usarlo
 * Para registrar y atender solicitudes de derechos de acceso, rectificación, cancelación u oposición.
 * ## Cuándo no usarlo
 * No registrar nombres ni datos clínicos; usar solo referencias internas del titular.
 * ## Anatomía
 * - Encabezado, contadores, formulario de registro, filtro y tabla de solicitudes.
 * ## Accesibilidad
 * Los controles tienen etiquetas visibles; la carga se anuncia y los errores se exponen con `role="alert"`.
 * ## Responsive
 * El formulario y los contadores se apilan en pantallas estrechas; la tabla permite desplazamiento horizontal.
 */
export function SolicitudesDerechosPage() {
  const [filtro, setFiltro] = useState<EstadoSolicitud | undefined>();
  const solicitudes = useSolicitudes(filtro);
  const datos = solicitudes.estado === 'datos' ? solicitudes.datos : null;

  return (
    <main className="space-y-6">
      <PageHeader
        title="Solicitudes de derechos"
        description="Registra y atiende solicitudes de titulares de forma segura, sin datos clínicos."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold" aria-live="polite">
              <strong>{datos?.pendientes ?? '—'}</strong>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold" aria-live="polite">
              <strong>{datos?.vencidas ?? '—'}</strong>
            </p>
          </CardContent>
        </Card>
      </div>

      <FormularioSolicitud onCreada={solicitudes.recargar} />

      <Card>
        <CardHeader>
          <CardTitle>Solicitudes registradas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:max-w-xs">
            <Field label="Filtrar por estado">
              <Select
                value={filtro ?? 'todas'}
                onChange={(evento) => {
                  const valor = evento.target.value;
                  setFiltro(valor === 'todas' ? undefined : (valor as EstadoSolicitud));
                }}
              >
                <option value="todas">Todos los estados</option>
                <option value="pendiente">Pendientes</option>
                <option value="atendida">Atendidas</option>
                <option value="rechazada">Rechazadas</option>
              </Select>
            </Field>
          </div>
          {solicitudes.estado === 'cargando' ? (
            <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
              Cargando solicitudes…
            </p>
          ) : null}
          {solicitudes.estado === 'error' ? (
            <Callout tone="danger" role="alert" title="No se pudo cargar el listado">
              <p>{solicitudes.error}</p>
              <Button className="mt-3" variant="outline" onClick={solicitudes.recargar}>
                Reintentar
              </Button>
            </Callout>
          ) : null}
          {solicitudes.estado === 'datos' && solicitudes.datos.items.length === 0 ? (
            <EmptyState
              title={
                filtro ? 'No hay solicitudes con ese estado' : 'No hay solicitudes de derechos'
              }
              description={
                filtro
                  ? 'Cambia el filtro para ver otras solicitudes.'
                  : 'Registra una solicitud para comenzar su seguimiento.'
              }
            />
          ) : null}
          {solicitudes.estado === 'datos' && solicitudes.datos.items.length > 0 ? (
            <TablaSolicitudes items={solicitudes.datos.items} onCerrada={solicitudes.recargar} />
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
