import { Badge } from '../../../design-system/components/atoms/Badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../design-system/components/atoms/Card';
import { SIGNIFICADOS } from './compartidos';

/** Lectura correcta de las tres etiquetas del contrato de inferencia. */
export function SignificadoDeResultados() {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Qué significan maligno, benigno y normal</CardTitle>
        <CardDescription>
          Son etiquetas del modelo para una imagen concreta, no categorías clínicas definitivas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-4">
          {SIGNIFICADOS.map((significado) => (
            <div key={significado.etiqueta} className="flex flex-col gap-1">
              <dt>
                <Badge tone={significado.tono}>{significado.etiqueta}</Badge>
              </dt>
              <dd className="text-sm text-muted-foreground">{significado.descripcion}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
