import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../design-system/components/atoms/Card';
import { LIMITES } from './compartidos';

/** Lo que el sistema no hace y lo que el médico no debe delegar en él (RS-IA-02). */
export function LimitesDelModelo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Límites que debes conocer</CardTitle>
        <CardDescription>
          La predicción es apoyo a la decisión. Estos límites aplican a cualquier resultado que
          muestre el sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3">
          {LIMITES.map((limite) => (
            <li key={limite.titulo} className="flex flex-col gap-1">
              <p className="font-medium text-foreground">{limite.titulo}</p>
              <p className="text-sm text-muted-foreground">{limite.detalle}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
