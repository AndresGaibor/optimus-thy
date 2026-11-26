import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  Select,
  Spinner,
} from '../../design-system';
import { Callout } from '../../design-system/components/molecules/Callout';
import { EmptyState } from '../../design-system/components/molecules/EmptyState';
import { PageHeader } from '../../design-system/components/molecules/PageHeader';
import {
  borrarCohorte,
  crearCohorte,
  listarCohortes,
  type CohorteInvestigacion,
  type FiltrosCohorte,
} from '../../api/cohortes';
import { CohorteFormulario } from './CohorteFormulario';

export function CohortesPage() {
  const [items, setItems] = useState<CohorteInvestigacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [seleccionada, setSeleccionada] = useState('');
  const cargar = useCallback(async () => {
    setCargando(true);
    const resultado = await listarCohortes();
    if (resultado.ok) {
      setItems(resultado.data.items);
      setSeleccionada((actual) =>
        resultado.data.items.some((item) => item.id === actual) ? actual : '',
      );
      setError(null);
    } else {
      setItems([]);
      setError(resultado.error);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar, intento]);

  async function crear(nombre: string, filtros: FiltrosCohorte): Promise<string | null> {
    setErrorAccion(null);
    const resultado = await crearCohorte(nombre, filtros);
    if (!resultado.ok) return resultado.error;
    setSeleccionada(resultado.data.id);
    setItems((actuales) => [resultado.data, ...actuales]);
    return null;
  }

  async function borrar(cohorte: CohorteInvestigacion) {
    if (!window.confirm(`¿Borrar la cohorte «${cohorte.nombre}»?`)) return;
    setErrorAccion(null);
    const resultado = await borrarCohorte(cohorte.id);
    if (!resultado.ok) {
      setErrorAccion(resultado.error);
      return;
    }
    setItems((actuales) => actuales.filter((item) => item.id !== cohorte.id));
    if (seleccionada === cohorte.id) setSeleccionada('');
  }

  return (
    <section className="mx-auto w-full max-w-(--content-max-width) space-y-6 px-4 py-6">
      <PageHeader
        title="Cohortes de investigación"
        description="Guarda filtros clínicos para reutilizarlos en consultas agregadas de tu institución."
      />
      {error ? (
        <Callout tone="danger" role="alert">
          {error}
          <div className="mt-3">
            <Button variant="secondary" size="sm" onClick={() => setIntento((valor) => valor + 1)}>
              Reintentar
            </Button>
          </div>
        </Callout>
      ) : null}
      {errorAccion ? (
        <Callout tone="danger" role="alert">
          {errorAccion}
        </Callout>
      ) : null}
      <CohorteFormulario onCrear={crear} />
      <Card>
        <CardHeader>
          <CardTitle>Cohortes guardadas</CardTitle>
        </CardHeader>
        <CardContent>
          {cargando ? <Spinner label="Cargando cohortes" /> : null}
          {!cargando && !error && items.length === 0 ? (
            <EmptyState
              title="Sin cohortes"
              description="Crea una cohorte para reutilizar sus criterios en métricas."
            />
          ) : null}
          {!cargando && !error && items.length > 0 ? (
            <div className="space-y-4">
              <div className="space-y-3">
                {items.map((cohorte) => (
                  <article
                    key={cohorte.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border p-4"
                  >
                    <div>
                      <h3 className="font-semibold">{cohorte.nombre}</h3>
                      <p className="text-sm text-muted-foreground">
                        {cohorte.total_casos} casos · creada{' '}
                        {new Date(cohorte.creado_en).toLocaleDateString('es-EC')}
                      </p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => void borrar(cohorte)}>
                      Borrar
                    </Button>
                  </article>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cohorte-metricas">Cohorte para métricas</Label>
                <Select
                  id="cohorte-metricas"
                  value={seleccionada}
                  onChange={(e) => setSeleccionada(e.target.value)}
                >
                  <option value="">Selecciona una cohorte</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre}
                    </option>
                  ))}
                </Select>
                {seleccionada ? (
                  <Button asChild>
                    <Link
                      to={`/investigador/metricas?cohorte_id=${encodeURIComponent(seleccionada)}`}
                    >
                      Ver métricas
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
