import { Badge, Card, CardContent, CardHeader, CardTitle } from '../../design-system';
import type { DemoRocScenario } from '../fixtures/investigador-extra';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';
import { ResearcherLayout } from './ResearcherBlocks';

function RocPlot({ scenario }: { scenario: DemoRocScenario }) {
  const points = scenario.curva
    .map(({ fpr, tpr }) => `${40 + fpr * 300},${250 - tpr * 220}`)
    .join(' ');
  return (
    <svg
      viewBox="0 0 380 300"
      role="img"
      aria-label={`Curva ROC ilustrativa; AUC ${scenario.auc.toFixed(2)}`}
      className="w-full max-w-xl"
    >
      <title>Curva ROC ilustrativa</title>
      <path
        d="M40 250 L340 30"
        fill="none"
        stroke="var(--border)"
        strokeDasharray="5 5"
        strokeWidth="2"
      />
      <path
        d="M40 250 V30 M40 250 H340"
        fill="none"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
      />
      <polyline
        points={points}
        fill="none"
        stroke="var(--brand)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x="190" y="290" textAnchor="middle" className="fill-muted-foreground text-xs">
        Tasa de falsos positivos
      </text>
      <text
        x="14"
        y="145"
        textAnchor="middle"
        transform="rotate(-90 14 145)"
        className="fill-muted-foreground text-xs"
      >
        Tasa de verdaderos positivos
      </text>
      <text x="38" y="270" className="fill-muted-foreground text-xs">
        0
      </text>
      <text x="333" y="270" className="fill-muted-foreground text-xs">
        1
      </text>
      <text x="24" y="35" className="fill-muted-foreground text-xs">
        1
      </text>
    </svg>
  );
}

export function RocScreen({ scenarios }: { scenarios: DemoRocScenario[] }) {
  const scenario = scenarios[0];
  if (!scenario) return null;
  const max = Math.max(...scenario.distribucion.map((bin) => bin.negativos + bin.positivos), 1);
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
              <RocPlot scenario={scenario} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Distribución de probabilidades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 text-sm">
                <span>
                  <span
                    aria-hidden="true"
                    className="mr-2 inline-block size-3 rounded-sm bg-info"
                  />
                  Negativos
                </span>
                <span>
                  <span
                    aria-hidden="true"
                    className="mr-2 inline-block size-3 rounded-sm bg-brand"
                  />
                  Positivos
                </span>
              </div>
              <div
                className="space-y-3"
                role="list"
                aria-label="Distribución sintética por rango de probabilidad"
              >
                {scenario.distribucion.map((bin) => {
                  const negative = (bin.negativos / max) * 100;
                  const positive = (bin.positivos / max) * 100;
                  return (
                    <div
                      key={bin.rango}
                      className="flex items-center gap-3 text-sm"
                      role="listitem"
                    >
                      <span className="w-20 shrink-0">{bin.rango}</span>
                      <svg
                        viewBox="0 0 100 12"
                        role="img"
                        aria-label={`${bin.rango}: ${bin.negativos} negativos, ${bin.positivos} positivos`}
                        className="h-4 w-full"
                      >
                        <rect x="0" y="1" width={negative} height="10" rx="2" fill="var(--info)" />
                        <rect
                          x={negative}
                          y="1"
                          width={positive}
                          height="10"
                          rx="2"
                          fill="var(--brand)"
                        />
                      </svg>
                      <span className="w-16 shrink-0 text-right tabular-nums text-muted-foreground">
                        {bin.negativos} / {bin.positivos}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">{scenario.nota}</p>
            </CardContent>
          </Card>
        </ResearcherLayout>
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
