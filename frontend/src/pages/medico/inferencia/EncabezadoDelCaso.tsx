import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Callout,
  Field,
  PageHeader,
  Select,
  Spinner,
  SupportNotice,
} from '../../../design-system';
import type { CasoResumen, PacienteDetalle } from '../../../api/pacientes';
import { fecha } from './compartidos';

interface EncabezadoDelCasoProps {
  /** Paciente del que se muestra el caso. */
  paciente: PacienteDetalle;
  /** Caso actualmente seleccionado. */
  casoSeleccionado: CasoResumen;
  /** Casos disponibles del paciente. */
  casos: CasoResumen[];
  /** Identificador del caso seleccionado. */
  casoId: string;
  /** Aviso de estado de la operación en curso. */
  aviso: string | null;
  /** Error al cargar el contenido del caso. */
  errorCaso: string | null;
  /** Indica si el contenido del caso está cargando. */
  cargandoCaso: boolean;
  /** Cambia el caso seleccionado. */
  onCambiarCaso: (id: string) => void;
  /** Reintenta la carga del caso. */
  onReintentarCaso: () => void;
  /** Abre el diálogo para subir una ecografía. */
  onAbrirSubida: () => void;
  /** Contenido del caso cuando ya está disponible. */
  children: ReactNode;
}

/** Encabezado del caso, avisos y contenedor del contenido cargado. */
export function EncabezadoDelCaso({
  paciente,
  casoSeleccionado,
  casos,
  casoId,
  aviso,
  errorCaso,
  cargandoCaso,
  onCambiarCaso,
  onReintentarCaso,
  onAbrirSubida,
  children,
}: EncabezadoDelCasoProps) {
  return (
    <>
      <PageHeader
        title="Inferencia del paciente"
        eyebrow={`Paciente ${paciente.codigo}`}
        description={`Caso ${casoSeleccionado.codigo} · ${fecha(casoSeleccionado.creado_en)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to={`/medico/casos/${casoSeleccionado.id}`}>Abrir el caso</Link>
            </Button>
            <Button onClick={onAbrirSubida} disabled={cargandoCaso || errorCaso !== null}>
              Subir ecografía
            </Button>
          </div>
        }
      />
      <SupportNotice context="inferencia" />

      {casos.length > 1 ? (
        <Field
          label="Caso clínico"
          hint="Las ecografías y el resultado corresponden al caso seleccionado."
        >
          <Select value={casoId} onChange={(evento) => onCambiarCaso(evento.currentTarget.value)}>
            {casos.map((caso) => (
              <option key={caso.id} value={caso.id}>
                {caso.codigo} · {fecha(caso.creado_en)}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      {aviso ? (
        <Callout tone="success" title="Estado" role="status">
          {aviso}
        </Callout>
      ) : null}

      {errorCaso ? (
        <Callout tone="danger" title="No se pudo cargar el caso" role="alert">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{errorCaso}</span>
            <Button variant="secondary" size="sm" onClick={onReintentarCaso}>
              Reintentar
            </Button>
          </div>
        </Callout>
      ) : cargandoCaso ? (
        <div className="flex items-center justify-center py-10">
          <Spinner size="lg" label="Cargando el caso" />
        </div>
      ) : (
        children
      )}
    </>
  );
}
