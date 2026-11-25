import { Badge, Callout } from '../../../design-system';
import type { ResultadoInferencia } from './compartidos';

interface ResumenConfirmacionProps {
  resultado: ResultadoInferencia;
  etiquetaCategoria: string;
  nota: string;
}

export function ResumenConfirmacion({
  resultado,
  etiquetaCategoria,
  nota,
}: ResumenConfirmacionProps) {
  return (
    <div className="flex flex-col gap-4">
      <Callout tone="info" title="Se registrará como tu conclusión">
        La inferencia original no cambia; la conclusión se guarda con tu usuario y la fecha del
        servidor.
      </Callout>

      <dl className="grid gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Categoría</dt>
          <dd>{etiquetaCategoria}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Nota</dt>
          <dd className="whitespace-pre-wrap">{nota.trim()}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Fecha</dt>
          <dd>Se asigna al guardar, en el servidor.</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Autor</dt>
          <dd>Tu usuario de la sesión.</dd>
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
