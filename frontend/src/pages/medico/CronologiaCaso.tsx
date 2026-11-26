import { useCallback, useEffect, useState } from 'react';
import { Button, Callout, EmptyState, Spinner } from '../../design-system';
import { obtenerCronologia, type HitoCronologia } from '../../api/cronologia';

export function CronologiaCaso({ casoId }: { casoId: string }) {
  const [items, setItems] = useState<HitoCronologia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(false);
    try {
      setItems(await obtenerCronologia(casoId));
    } catch {
      setError(true);
    } finally {
      setCargando(false);
    }
  }, [casoId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <section className="flex flex-col gap-4" aria-labelledby="cronologia-titulo">
      <h2 id="cronologia-titulo" className="text-lg font-semibold">
        Cronología
      </h2>
      {cargando ? <Spinner label="Cargando la cronología" /> : null}
      {!cargando && error ? (
        <Callout tone="danger" title="No se pudo cargar la cronología" role="alert">
          <Button onClick={() => void cargar()}>Reintentar</Button>
        </Callout>
      ) : null}
      {!cargando && !error && items.length === 0 ? (
        <EmptyState title="Aún no hay hitos" description="Los eventos del caso aparecerán aquí." />
      ) : null}
      {!cargando && !error && items.length > 0 ? (
        <ol className="flex flex-col gap-3">
          {items.map((item, indice) => (
            <li key={`${item.tipo}-${item.ocurrido_en}-${indice}`} className="border-s border-border ps-4">
              <p className="font-medium">{item.titulo}</p>
              <time dateTime={item.ocurrido_en} className="text-sm text-muted-foreground">
                {new Date(item.ocurrido_en).toLocaleString('es-EC')}
              </time>
              {item.detalle ? <p className="text-sm">{item.detalle}</p> : null}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
