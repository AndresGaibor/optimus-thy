import {
  AiResultCard,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  type ClinicalClass,
} from '../../design-system';
import type { NoduloInferencia } from '../../api/resultados';

const CLASES: Record<string, ClinicalClass> = {
  benigno: 'benigno',
  maligno: 'maligno',
  normal: 'normal',
  sin_nodulo: 'normal',
};

const ETIQUETAS: Record<string, string> = {
  benigno: 'Benigno',
  maligno: 'Maligno',
  normal: 'Normal (sin nódulo)',
  sin_nodulo: 'Normal (sin nódulo)',
};

interface ResultadoNoduloProps {
  nodulo: NoduloInferencia;
  modelo: { nombre: string; version: string };
  creadoEn: string;
}

const FORMATO_PORCENTAJE = new Intl.NumberFormat('es', {
  style: 'percent',
  maximumFractionDigits: 1,
});

/** Nódulo inferido: clase, probabilidad y artefactos, siempre como apoyo. */
export function ResultadoNodulo({ nodulo, modelo, creadoEn }: ResultadoNoduloProps) {
  const clase = CLASES[nodulo.clase ?? ''] ?? 'normal';
  const probabilidad =
    clase === 'maligno' ? nodulo.probabilidad_maligno : nodulo.probabilidad_benigno;
  const fecha = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(creadoEn),
  );
  const artefactos = nodulo.artefactos;
  const derivadas: Array<[string, string | null]> = [
    ['Máscara', artefactos.mascara_url],
    ['MGAC', artefactos.mgac_url],
    ['Superposición', artefactos.superposicion_url],
  ];

  return (
    <div className="flex flex-col gap-3">
      <AiResultCard
        classification={clase}
        probability={probabilidad ?? 0}
        modelVersion={`${modelo.nombre} ${modelo.version}`}
        date={fecha}
        dateTime={creadoEn}
      />
      <Card>
        <CardHeader>
          <CardTitle>
            Nódulo {nodulo.indice}: {ETIQUETAS[nodulo.clase ?? ''] ?? nodulo.clase}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Probabilidad benigno</dt>
              <dd>
                {nodulo.probabilidad_benigno === null
                  ? '—'
                  : FORMATO_PORCENTAJE.format(nodulo.probabilidad_benigno)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Probabilidad maligno</dt>
              <dd>
                {nodulo.probabilidad_maligno === null
                  ? '—'
                  : FORMATO_PORCENTAJE.format(nodulo.probabilidad_maligno)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Confianza del detector</dt>
              <dd>
                {nodulo.confianza === null ? '—' : FORMATO_PORCENTAJE.format(nodulo.confianza)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Caja</dt>
              <dd>
                x {nodulo.caja.x ?? '—'}, y {nodulo.caja.y ?? '—'}, w {nodulo.caja.w ?? '—'}, h{' '}
                {nodulo.caja.h ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Píxeles de máscara</dt>
              <dd>{nodulo.pixeles_mascara ?? '—'}</dd>
            </div>
            {nodulo.region_analizada ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Región analizada</dt>
                <dd>
                  x {nodulo.region_analizada.xmin ?? '—'}, y {nodulo.region_analizada.ymin ?? '—'},
                  x2 {nodulo.region_analizada.xmax ?? '—'}, y2 {nodulo.region_analizada.ymax ?? '—'}
                </dd>
              </div>
            ) : null}
          </dl>
          {derivadas.some(([, url]) => url !== null) || artefactos.xml_url !== null ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                {derivadas.map(([etiqueta, url]) =>
                  url ? (
                    <figure key={etiqueta} className="flex flex-col gap-2">
                      <img
                        src={url}
                        alt={`${etiqueta} del nódulo ${nodulo.indice}`}
                        className="w-full rounded-md border border-border"
                      />
                      <figcaption className="text-xs text-muted-foreground">{etiqueta}</figcaption>
                    </figure>
                  ) : null,
                )}
              </div>
              {artefactos.xml_url ? (
                <div>
                  <Button asChild variant="outline" size="sm">
                    <a href={artefactos.xml_url} target="_blank" rel="noreferrer">
                      Descargar XML del nódulo {nodulo.indice}
                    </a>
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sin artefactos para este nódulo.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
