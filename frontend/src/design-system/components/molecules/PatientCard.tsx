import { ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/cn';
import type { RecordStatus } from '../../tones';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../atoms/Card';
import { StatusBadge } from './StatusBadge';

export interface PatientCardProps {
  /** Seudónimo sintético; no se admiten nombres ni identificadores personales. */
  pseudonym: string;
  /** Rango de edad, nunca fecha de nacimiento ni edad exacta. */
  ageRange: string;
  /** Nombre de la institución en el resumen. */
  institution: string;
  /** Estado textual de la ficha. */
  caseStatus: RecordStatus;
  /** Clases adicionales para la tarjeta. */
  className?: string;
}

/**
 * Tarjeta de resumen con datos de paciente sintéticos y estado de ficha.
 *
 * ## Cuándo usarlo
 * Para identificar una ficha mediante seudónimo, rango de edad, institución y estado.
 * ## Cuándo no usarlo
 * No usarlo con identificadores personales ni con edad exacta o fecha de nacimiento.
 * ## Anatomía
 * - Seudónimo, estado, rango de edad, institución y aviso de privacidad.
 * ## Accesibilidad
 * El seudónimo ocupa un encabezado `h3`; el estado incluye texto y el icono de privacidad usa `aria-hidden="true"`. No incluye controles propios.
 * ## Responsive
 * Encabezado permite envolver; los datos se apilan a 360 px y pasan a dos columnas desde `sm` (640 px), también en 768 y 1366 px.
 */
export function PatientCard({
  pseudonym,
  ageRange,
  institution,
  caseStatus,
  className,
}: PatientCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <CardTitle as="h3">{pseudonym}</CardTitle>
          <CardDescription>Ficha de paciente sintética</CardDescription>
        </div>
        <StatusBadge kind="record" status={caseStatus} />
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <dt className="text-sm font-medium text-muted-foreground">Rango de edad</dt>
            <dd className="text-sm text-foreground">{ageRange}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-sm font-medium text-muted-foreground">Institución</dt>
            <dd className="text-sm text-foreground">{institution}</dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter className="items-start border-t border-border pt-4 text-sm text-muted-foreground">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>No se muestran datos identificatorios.</span>
      </CardFooter>
    </Card>
  );
}
