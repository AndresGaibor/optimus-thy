import { Badge } from '../../../design-system/components/atoms/Badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../design-system/components/atoms/Card';
import { PASOS_DEL_MODELO } from './compartidos';

/** Flujo real de la inferencia, del detector al clasificador. */
export function PasosDelModelo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Cómo se obtiene la predicción</CardTitle>
        <CardDescription>
          La misma cadena se ejecuta para cada imagen y deja un resultado trazable: versión del
          modelo, huella de los pesos y umbrales usados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-5">
          {PASOS_DEL_MODELO.map((paso, indice) => (
            <li key={paso.titulo} className="flex flex-col gap-1 border-l-2 border-border pl-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-foreground">
                  {indice + 1}. {paso.titulo}
                </p>
                <Badge tone="ai">{paso.modelo}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{paso.descripcion}</p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
