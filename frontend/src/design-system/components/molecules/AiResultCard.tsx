import { cn } from '../../lib/cn';
import { Badge } from '../atoms/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../atoms/Card';

/** Clase estimada que se presenta siempre como apoyo y no como diagnóstico. */
export type ClinicalClass = 'normal' | 'benigno' | 'maligno';

/** Datos sintéticos de resultado de inferencia para la tarjeta. */
export interface AiResultCardProps {
  /** Clase estimada del resultado. */
  classification: ClinicalClass;
  /** Probabilidad entre 0 y 1. */
  probability: number;
  /** Identificador visible de la versión del modelo. */
  modelVersion: string;
  /** Fecha presentada para el resultado. */
  date: string;
  /** Valor ISO opcional para el atributo datetime. */
  dateTime?: string;
  /** Clases adicionales de presentación para la tarjeta. */
  className?: string;
}

const CLASS_LABELS: Record<ClinicalClass, string> = {
  normal: 'Normal',
  benigno: 'Benigno',
  maligno: 'Maligno',
};

const CLASS_BADGE_CLASSES: Record<ClinicalClass, string> = {
  normal: 'border-class-normal bg-class-normal text-class-normal-foreground',
  benigno: 'border-class-benigno bg-class-benigno text-class-benigno-foreground',
  maligno: 'border-class-maligno bg-class-maligno text-class-maligno-foreground',
};

const CLASS_BAR_CLASSES: Record<ClinicalClass, string> = {
  normal: 'bg-class-normal',
  benigno: 'bg-class-benigno',
  maligno: 'bg-class-maligno',
};

const PERCENT_FORMAT = new Intl.NumberFormat('es', {
  style: 'percent',
  maximumFractionDigits: 1,
});

/**
 * Tarjeta que resume una inferencia como apoyo para la revisión profesional.
 *
 * ## Cuándo usarlo
 * Para presentar una clase estimada, su probabilidad y la versión/fecha del modelo.
 * ## Cuándo no usarlo
 * No usarlo como diagnóstico definitivo ni reemplazo de la valoración profesional.
 * ## Anatomía
 * - Título, distintivo de clase, barra de probabilidad, versión del modelo y fecha.
 * ## Accesibilidad
 * La probabilidad expone `role="progressbar"`, `aria-label`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow` y `aria-valuetext`; no agrega controles de teclado o foco.
 * ## Responsive
 * El encabezado permite envolver el contenido. Los detalles se apilan a 360 px y pasan a dos columnas desde `sm` (640 px), también a 768 y 1366 px.
 */
export function AiResultCard({
  classification,
  probability,
  modelVersion,
  date,
  dateTime,
  className,
}: AiResultCardProps) {
  const normalizedProbability = Math.min(Math.max(probability, 0), 1);
  const percent = normalizedProbability * 100;
  const label = CLASS_LABELS[classification];

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
        <CardTitle as="h3">Resultado de IA</CardTitle>
        <Badge className={CLASS_BADGE_CLASSES[classification]}>{label}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium">Probabilidad</span>
            <span>{PERCENT_FORMAT.format(normalizedProbability)}</span>
          </div>
          <div
            role="progressbar"
            aria-label={`Probabilidad de la clase ${label}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-valuetext={PERCENT_FORMAT.format(normalizedProbability)}
            className="h-2 w-full overflow-hidden rounded-full bg-border"
          >
            <div
              aria-hidden="true"
              className={cn('h-full rounded-full', CLASS_BAR_CLASSES[classification])}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <dt className="font-medium text-muted-foreground">Versión del modelo</dt>
            <dd className="font-mono text-foreground">{modelVersion}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-medium text-muted-foreground">Fecha</dt>
            <dd className="text-foreground">
              <time dateTime={dateTime}>{date}</time>
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
