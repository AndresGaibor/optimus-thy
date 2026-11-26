import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Callout,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
  Spinner,
} from '../../design-system';
import { obtenerTablero, type TableroAdministrador } from '../../api/tablero';

const ETIQUETAS_VOLUMEN = {
  pacientes: 'Pacientes',
  casos: 'Casos',
  imagenes: 'Imágenes',
  inferencias: 'Inferencias',
  usuarios: 'Usuarios',
} as const;
const ETIQUETAS_SERVICIO = {
  base_datos: 'Base de datos',
  servicio_ia: 'Servicio de IA',
  almacenamiento: 'Almacenamiento',
} as const;
const ETIQUETAS_ESTADO = { ok: 'Operativo', degradado: 'Degradado', caido: 'Caído' } as const;

function fechaRelativa(fecha: string): string {
  const segundos = Math.round((new Date(fecha).getTime() - Date.now()) / 1000);
  const unidades: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ];
  const unidad = unidades.find(([, duracion]) => Math.abs(segundos) >= duracion);
  const formato = new Intl.RelativeTimeFormat('es-EC', { numeric: 'auto' });
  if (!unidad) return formato.format(segundos, 'second');
  return formato.format(Math.round(segundos / unidad[1]), unidad[0]);
}

export function TableroPage() {
  const [tablero, setTablero] = useState<TableroAdministrador | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(false);
    try {
      setTablero(await obtenerTablero());
    } catch {
      setError(true);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <main className="flex flex-col gap-6">
      <PageHeader
        title="Tablero del administrador"
        description="Volumen de datos, actividad reciente y estado de los servicios."
      />
      {error ? (
        <Callout tone="danger" title="Error" role="alert">
          No se pudo cargar el tablero. Inténtalo de nuevo.
          <Button variant="outline" size="sm" onClick={() => void cargar()}>
            Reintentar
          </Button>
        </Callout>
      ) : null}
      {cargando ? <Spinner size="lg" label="Cargando el tablero" /> : null}
      {!cargando && tablero ? (
        <>
          <section aria-labelledby="volumen-titulo" className="flex flex-col gap-4">
            <h2 id="volumen-titulo" className="text-lg font-semibold">
              Volumen de datos
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {Object.entries(ETIQUETAS_VOLUMEN).map(([clave, etiqueta]) => (
                <Card key={clave}>
                  <CardHeader>
                    <CardTitle>{etiqueta}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">
                      {tablero.volumen[clave as keyof typeof tablero.volumen]}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
          <section aria-labelledby="actividad-titulo" className="flex flex-col gap-4">
            <h2 id="actividad-titulo" className="text-lg font-semibold">
              Actividad reciente
            </h2>
            {tablero.actividad.length ? (
              <ul className="divide-y rounded-lg border">
                {tablero.actividad.map((evento) => (
                  <li
                    key={evento.accion}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                  >
                    <span>
                      {evento.accion}{' '}
                      <span className="text-muted-foreground">· {evento.total}</span>
                    </span>
                    <time
                      dateTime={evento.ultima}
                      title={new Date(evento.ultima).toLocaleString('es-EC')}
                    >
                      {fechaRelativa(evento.ultima)}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No hay actividad registrada en los últimos siete días.</p>
            )}
          </section>
          <section aria-labelledby="servicios-titulo" className="flex flex-col gap-4">
            <h2 id="servicios-titulo" className="text-lg font-semibold">
              Estado de los servicios
            </h2>
            <ul className="grid gap-4 sm:grid-cols-3">
              {tablero.servicios.map((servicio) => (
                <li key={servicio.nombre}>
                  <Card>
                    <CardHeader>
                      <CardTitle>{ETIQUETAS_SERVICIO[servicio.nombre]}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{ETIQUETAS_ESTADO[servicio.estado]}</p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </main>
  );
}
