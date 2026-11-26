import { useId } from 'react';
import { cn } from '../../lib/cn';

export interface RocPoint {
  fpr: number;
  tpr: number;
}

export interface RocCurveProps {
  points: RocPoint[];
  auc: number;
  caption: string;
  className?: string;
}

/**
 * ## Cuándo usarlo
 * Para mostrar la sensibilidad frente a la tasa de falsos positivos.
 * ## Cuándo no usarlo
 * No lo uses para presentar métricas clínicas sin datos de validación.
 * ## Anatomía
 * Figura con AUC, curva ROC, diagonal de referencia y tabla plegable.
 * ## Accesibilidad
 * El SVG tiene título accesible y los puntos están disponibles en una tabla nativa.
 * ## Responsive
 * El SVG conserva su proporción de 380×300 y ocupa el ancho disponible.
 */
export function RocCurve({ points, auc, caption, className }: RocCurveProps) {
  const titleId = useId();
  const coordinates = points
    .map(({ fpr, tpr }) => `${40 + fpr * 300},${250 - tpr * 220}`)
    .join(' ');
  return (
    <figure className={cn('flex flex-col gap-3', className)}>
      <figcaption className="text-sm font-medium text-foreground">{caption}</figcaption>
      <p className="text-sm tabular-nums text-foreground">AUC {auc.toFixed(2)}</p>
      {points.length === 0 && <p className="text-sm text-muted-foreground">Sin datos de curva</p>}
      <svg viewBox="0 0 380 300" role="img" aria-labelledby={titleId} className="w-full max-w-xl">
        <title id={titleId}>{`${caption}; AUC ${auc.toFixed(2)}`}</title>
        <path
          d="M40 250 L340 30"
          fill="none"
          stroke="currentColor"
          strokeDasharray="5 5"
          strokeWidth="2"
          className="text-muted-foreground"
        />
        <path
          d="M40 250 V30 M40 250 H340"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-muted-foreground"
        />
        {points.length > 0 && (
          <polyline
            points={coordinates}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-brand"
          />
        )}
        <text
          x="190"
          y="290"
          textAnchor="middle"
          fill="currentColor"
          className="text-xs text-muted-foreground"
        >
          Tasa de falsos positivos
        </text>
        <text
          x="14"
          y="145"
          textAnchor="middle"
          transform="rotate(-90 14 145)"
          fill="currentColor"
          className="text-xs text-muted-foreground"
        >
          Tasa de verdaderos positivos
        </text>
        <text x="38" y="270" fill="currentColor" className="text-xs text-muted-foreground">
          0
        </text>
        <text x="333" y="270" fill="currentColor" className="text-xs text-muted-foreground">
          1
        </text>
        <text x="24" y="35" fill="currentColor" className="text-xs text-muted-foreground">
          1
        </text>
      </svg>
      <details>
        <summary className="cursor-pointer text-sm font-medium text-primary">
          Ver tabla equivalente
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="sr-only">{caption}</caption>
            <thead>
              <tr>
                <th scope="col" className="border-b border-border px-3 py-2">
                  Falsos positivos
                </th>
                <th scope="col" className="border-b border-border px-3 py-2">
                  Verdaderos positivos
                </th>
              </tr>
            </thead>
            <tbody>
              {points.map(({ fpr, tpr }, index) => (
                <tr key={`${fpr}-${tpr}-${index}`}>
                  <td className="border-b border-border px-3 py-2 tabular-nums">
                    {fpr.toFixed(2)}
                  </td>
                  <td className="border-b border-border px-3 py-2 tabular-nums">
                    {tpr.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
