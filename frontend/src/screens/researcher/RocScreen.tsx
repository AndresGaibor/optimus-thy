import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ProbabilityDistribution,
  RocCurve,
} from '../../design-system';
import type { DemoRocScenario } from '../fixtures/investigador-extra';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';
import { ResearcherLayout } from './ResearcherBlocks';

export function RocScreen({ scenarios }: { scenarios: DemoRocScenario[] }) {
  const scenario = scenarios[0];
  if (!scenario) return null;
  return (
    <DemoRoleLayout role="investigador">
      <ScreenFrame
        title="Curva ROC"
        description="Visualización ilustrativa de discriminación y probabilidades."
      >
        <ResearcherLayout
          title="Evaluación de clasificación"
          description="Curva ROC y distribución de probabilidades por clase."
        >
          <p className="text-sm text-muted-foreground">
            Curva y distribución ilustrativas; no representan métricas reales.
          </p>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Curva ROC <Badge tone="info">AUC {scenario.auc.toFixed(2)}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RocCurve
                points={scenario.curva}
                auc={scenario.auc}
                caption="Curva ROC ilustrativa"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Distribución de probabilidades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProbabilityDistribution
                bins={scenario.distribucion}
                caption="Distribución de probabilidades"
              />
              <p className="text-xs text-muted-foreground">{scenario.nota}</p>
            </CardContent>
          </Card>
        </ResearcherLayout>
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
