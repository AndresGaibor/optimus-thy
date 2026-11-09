import { Callout } from './Callout';

/** Contexto textual del aviso de apoyo. */
export type SupportNoticeContext = 'inferencia' | 'informe';

export interface SupportNoticeProps {
  /** Superficie de uso para elegir el texto del aviso. */
  context: SupportNoticeContext;
  /** Clases adicionales para el aviso. */
  className?: string;
}

const NOTICE_COPY: Record<SupportNoticeContext, { title: string; description: string }> = {
  inferencia: {
    title: 'Resultado de IA: apoyo, no diagnóstico',
    description: 'La inferencia orienta la revisión profesional y no constituye un diagnóstico.',
  },
  informe: {
    title: 'Informe de IA: apoyo para la revisión profesional',
    description:
      'La información generada por IA no constituye un diagnóstico; debe interpretarla un profesional.',
  },
};

/**
 * Aviso explícito de que la inferencia de IA es apoyo, no diagnóstico.
 *
 * ## Cuándo usarlo
 * Junto a una inferencia o informe generado por IA.
 * ## Cuándo no usarlo
 * No usarlo como conclusión clínica ni como sustituto de interpretación profesional.
 * ## Anatomía
 * - Título y descripción predefinidos dentro de un `Callout` de advertencia.
 * ## Accesibilidad
 * El `Callout` usa `role="note"` y expone título y descripción como texto; no agrega controles ni foco.
 * ## Responsive
 * Hereda el layout fluido de `Callout`, sin cambios definidos por viewport.
 */
export function SupportNotice({ context, className }: SupportNoticeProps) {
  const copy = NOTICE_COPY[context];

  return (
    <Callout role="note" tone="warning" title={copy.title} className={className}>
      {copy.description}
    </Callout>
  );
}
