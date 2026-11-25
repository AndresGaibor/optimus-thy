import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../design-system/components/atoms/Card';
import { PASOS_DE_LA_DECISION, REGISTROS_DE_AUDITORIA } from './compartidos';

/** Cómo se registra la decisión del médico y qué deja en la bitácora. */
export function DecisionYAuditoria() {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Tu decisión y la bitácora</CardTitle>
        <CardDescription>
          El modelo propone; la conclusión clínica la registras tú y queda separada de la
          predicción.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold text-foreground">Cómo se registra tu decisión</h3>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-muted-foreground">
            {PASOS_DE_LA_DECISION.map((paso) => (
              <li key={paso}>{paso}</li>
            ))}
          </ol>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold text-foreground">Qué queda auditado</h3>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-muted-foreground">
            {REGISTROS_DE_AUDITORIA.map((registro) => (
              <li key={registro}>{registro}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
