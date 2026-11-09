import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { TONE_CLASSES, type BadgeTone } from '../../tones';
import { Card } from '../atoms/Card';

export interface StatCardProps {
  /** Etiqueta de la métrica. */
  label: string;
  /** Valor que se presenta. */
  value: ReactNode;
  /** Contexto del valor, p. ej. “Demostración sintética”. */
  description?: ReactNode;
  /** Icono decorativo opcional. */
  icon?: LucideIcon;
  /** Tono del icono; lo aporta quien muestra el dato, no se deduce del valor. Predeterminado `neutral`. */
  tone?: BadgeTone;
  /** Clases adicionales para la tarjeta. */
  className?: string;
}

/**
 * Presenta una métrica con etiqueta, valor y contexto opcional.
 *
 * ## Cuándo usarlo
 * Para resumir una cifra en paneles de métricas.
 * ## Cuándo no usarlo
 * No usarlo para mostrar resultados clínicos o una operación interactiva.
 * ## Anatomía
 * - Etiqueta y valor en una lista de descripción; detalle e icono opcionales.
 * ## Accesibilidad
 * La métrica se estructura con `dl`, `dt` y `dd`; el icono se oculta con `aria-hidden="true"`. No añade controles ni teclado.
 * ## Responsive
 * La tarjeta conserva fila de contenido e icono y permite que el texto reduzca su ancho (`min-w-0`); no define cambios por viewport.
 */
export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = 'neutral',
  className,
}: StatCardProps) {
  return (
    <Card className={cn('flex items-start justify-between gap-4 p-5', className)}>
      <dl className="flex min-w-0 flex-col gap-1">
        <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
        <dd className="text-3xl font-bold tracking-tight text-foreground">{value}</dd>
        {description ? <dd className="text-xs text-muted-foreground">{description}</dd> : null}
      </dl>
      {Icon ? (
        <span
          aria-hidden="true"
          className={cn(
            'inline-flex size-10 shrink-0 items-center justify-center rounded-card border',
            TONE_CLASSES[tone].soft,
          )}
        >
          <Icon className="size-5" />
        </span>
      ) : null}
    </Card>
  );
}
