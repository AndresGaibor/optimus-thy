import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  Callout,
  EmptyState,
  Field,
  PageHeader,
  Select,
  Spinner,
  SupportNotice,
} from '../../../design-system';
import { listarPacientes, type Paciente } from '../../../api/pacientes';

/**
 * Entrada a la inferencia cuando la URL no trae paciente: elige uno y abre su caso.
 *
 * El selector va asociado a su etiqueta mediante `Field`; el error es `role="alert"`
 * y la carga se anuncia con `Spinner` etiquetado.
 */
export function SelectorPaciente() {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [seleccionado, setSeleccionado] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    const resultado = await listarPacientes({ limite: 100 });
    if (!resultado.ok) {
      setPacientes([]);
      setError('No se pudieron cargar los pacientes. Reintenta la operación.');
      setCargando(false);
      return;
    }
    setPacientes(resultado.data.items);
    const primero = resultado.data.items[0]?.id ?? '';
    setSeleccionado((actual) =>
      resultado.data.items.some((paciente) => paciente.id === actual) ? actual : primero,
    );
    setCargando(false);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (cargando) {
    return (
      <section className="mx-auto w-full max-w-(--content-max-width) px-4 py-6">
        <Spinner size="lg" label="Cargando pacientes" />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-(--content-max-width) space-y-6 px-4 py-6">
      <PageHeader
        title="Inferencia de IA"
        description="Elige un paciente para revisar las ecografías de su caso más reciente."
        actions={
          <Button asChild variant="outline">
            <Link to="/medico/pacientes">Ver pacientes</Link>
          </Button>
        }
      />
      <SupportNotice context="inferencia" />
      {error ? (
        <Callout tone="danger" title="No se pudieron cargar los pacientes" role="alert">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button variant="secondary" size="sm" onClick={() => void cargar()}>
              Reintentar
            </Button>
          </div>
        </Callout>
      ) : pacientes.length === 0 ? (
        <EmptyState
          as="h2"
          title="Todavía no hay pacientes"
          description="Registra un paciente y su caso para poder analizar ecografías."
          action={
            <Button asChild>
              <Link to="/medico/pacientes">Ir a pacientes</Link>
            </Button>
          }
        />
      ) : (
        <div className="flex max-w-xl flex-col gap-4">
          <Field label="Paciente" hint="Se abre el caso más reciente del paciente.">
            <Select
              value={seleccionado}
              onChange={(evento) => setSeleccionado(evento.currentTarget.value)}
            >
              {pacientes.map((paciente) => (
                <option key={paciente.id} value={paciente.id}>
                  {paciente.codigo} ·{' '}
                  {paciente.total_casos === 1 ? '1 caso' : `${paciente.total_casos} casos`}
                </option>
              ))}
            </Select>
          </Field>
          <div>
            <Button
              onClick={() => navigate(`/medico/pacientes/${seleccionado}/inferencia`)}
              disabled={seleccionado === ''}
            >
              Continuar
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
