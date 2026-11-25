import { useState } from 'react';
import { Badge, Button, Callout } from '../../design-system';
import type { ImagenCaso } from '../../api/imagenes';
import { descargarReporte, type Inferencia } from '../../api/resultados';
import { ResultadoNodulo } from './ResultadoNodulo';

const FORMATO_FECHA = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' });
const RESULTADOS: Record<string, { etiqueta: string; tono: 'success' | 'danger' | 'neutral' }> = {
  benigno: { etiqueta: 'Benigno', tono: 'success' },
  maligno: { etiqueta: 'Maligno', tono: 'danger' },
  sin_nodulo: { etiqueta: 'Normal (sin nódulo)', tono: 'neutral' },
};
const SIN_CLASIFICAR = { etiqueta: 'Sin clasificar', tono: 'neutral' as const };

/** Una inferencia con su fecha, modelo, resultado y descarga del reporte PDF. */
export function ResultadoInferencia({
  inferencia,
  casoId,
  imagen,
}: {
  inferencia: Inferencia;
  casoId: string;
  /** Imagen del caso con la que se ejecutó la inferencia. */
  imagen?: ImagenCaso | undefined;
}) {
  const resultado = RESULTADOS[inferencia.resultado] ?? SIN_CLASIFICAR;
  const [descargando, setDescargando] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState(false);

  async function descargar() {
    setErrorDescarga(false);
    setDescargando(true);
    try {
      const { contenido, nombre } = await descargarReporte(casoId, inferencia.id);
      const url = URL.createObjectURL(contenido);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = nombre;
      enlace.click();
      URL.revokeObjectURL(url);
    } catch {
      setErrorDescarga(true);
    } finally {
      setDescargando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold">
          {FORMATO_FECHA.format(new Date(inferencia.creado_en))}
        </h3>
        <Badge tone={resultado.tono}>{resultado.etiqueta}</Badge>
        <span className="text-sm text-muted-foreground">
          {inferencia.modelo.nombre} {inferencia.modelo.version}
        </span>
        <Button variant="outline" size="sm" loading={descargando} onClick={() => void descargar()}>
          Descargar reporte
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {imagen
          ? `Imagen usada: ${imagen.formato.toUpperCase()} ${imagen.ancho}×${imagen.alto} del ${FORMATO_FECHA.format(new Date(imagen.creado_en))}`
          : `Imagen usada: #${inferencia.imagen_id.slice(0, 8)}`}
      </p>
      {errorDescarga ? (
        <Callout tone="danger" title="No se pudo descargar el reporte">
          Inténtalo de nuevo; la descarga queda registrada cuando se completa.
        </Callout>
      ) : null}
      {inferencia.nodulos.length === 0 ? (
        <Callout tone="success" title="Normal: sin nódulo detectado">
          La inferencia no encontró nódulos en esta ecografía.
        </Callout>
      ) : (
        inferencia.nodulos.map((nodulo) => (
          <ResultadoNodulo
            key={`${inferencia.id}-${nodulo.indice}`}
            nodulo={nodulo}
            modelo={inferencia.modelo}
            creadoEn={inferencia.creado_en}
          />
        ))
      )}
    </div>
  );
}
