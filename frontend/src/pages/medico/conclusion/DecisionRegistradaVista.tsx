import type { DecisionRegistrada } from '../../../api/decisiones';
import { Badge, Callout } from '../../../design-system';
import { CATEGORIAS, FORMATO_FECHA, type ResultadoInferencia } from './compartidos';

interface DecisionRegistradaVistaProps {
  decision: DecisionRegistrada;
  resultado: ResultadoInferencia;
}

/** Conclusión ya guardada: solo lectura, sin controles de envío. */
export function DecisionRegistradaVista({ decision, resultado }: DecisionRegistradaVistaProps) {
  const etiqueta = CATEGORIAS.find((opcion) => opcion.valor === decision.decision)?.etiqueta ?? '—';

  return (
    <div className="flex flex-col gap-4">
      <Callout tone="success" title="Conclusión ya registrada">
        Esta inferencia ya tiene una conclusión médica; no se puede registrar otra.
      </Callout>

      <dl className="grid gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Categoría</dt>
          <dd>{etiqueta}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Observaciones</dt>
          <dd className="whitespace-pre-wrap">
            {decision.observaciones?.trim() || 'Sin observaciones.'}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Fecha</dt>
          <dd>{FORMATO_FECHA.format(new Date(decision.creado_en))}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Autor</dt>
          <dd className="break-all">{decision.autor.id}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Rol</dt>
          <dd>{decision.autor.rol ?? 'Sin rol registrado'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Predicción (sin cambios)</dt>
          <dd>
            <Badge tone={resultado.tono}>{resultado.texto}</Badge>
          </dd>
        </div>
      </dl>
    </div>
  );
}
