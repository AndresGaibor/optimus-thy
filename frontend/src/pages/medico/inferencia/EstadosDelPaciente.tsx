import { Link } from 'react-router-dom';
import {
  Button,
  Callout,
  EmptyState,
  PageHeader,
  Spinner,
  SupportNotice,
} from '../../../design-system';
import type { PacienteDetalle } from '../../../api/pacientes';

/** Estado de carga del paciente. */
export function CargandoPaciente() {
  return (
    <section className="mx-auto w-full max-w-(--content-max-width) px-4 py-6">
      <Spinner size="lg" label="Cargando el paciente" />
    </section>
  );
}

/** Error al cargar el paciente, con reintento y vuelta al listado. */
export function PacienteNoDisponible({
  mensaje,
  onReintentar,
}: {
  mensaje: string | null;
  onReintentar: () => void;
}) {
  return (
    <section className="mx-auto w-full max-w-(--content-max-width) space-y-6 px-4 py-6">
      <PageHeader
        title="Inferencia del paciente"
        description="Revisa las ecografías del caso y el resultado de la inferencia."
      />
      <Callout tone="danger" title="No se pudo cargar el paciente" role="alert">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>{mensaje ?? 'No se pudo cargar el paciente.'}</span>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={onReintentar}>
              Reintentar
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/medico/pacientes">Volver a pacientes</Link>
            </Button>
          </div>
        </div>
      </Callout>
    </section>
  );
}

/** Estado del paciente que todavía no tiene casos. */
export function PacienteSinCasos({ paciente }: { paciente: PacienteDetalle }) {
  return (
    <section className="mx-auto w-full max-w-(--content-max-width) space-y-6 px-4 py-6">
      <PageHeader
        title="Inferencia del paciente"
        eyebrow={`Paciente ${paciente.codigo}`}
        description="Revisa las ecografías del caso y el resultado de la inferencia."
        actions={
          <Button asChild variant="outline">
            <Link to="/medico/pacientes">Volver a pacientes</Link>
          </Button>
        }
      />
      <SupportNotice context="inferencia" />
      <EmptyState
        as="h2"
        title="Sin casos registrados"
        description="Este paciente aún no tiene un caso con ecografías para analizar."
      />
    </section>
  );
}

/** Transición mientras se resuelve el caso seleccionado. */
export function SeleccionandoCaso() {
  return (
    <section className="mx-auto w-full max-w-(--content-max-width) px-4 py-6">
      <Spinner size="lg" label="Seleccionando el caso" />
    </section>
  );
}
