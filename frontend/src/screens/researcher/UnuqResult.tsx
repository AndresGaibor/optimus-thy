import { useMemo } from 'react';
import {
  Badge,
  Callout,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../design-system';
import { calcularPuntajeUnuq, resumirAtributosUnuq, unuqFormula } from '../fixtures/unuq-extra';

export function UnuqResult({ values }: { values: number[] }) {
  const score = calcularPuntajeUnuq(values);
  const resumen = resumirAtributosUnuq(values);
  const ok = score >= 70;
  const suma = useMemo(() => values.reduce((t, v) => t + v, 0), [values]);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          Resultado UnUQ{' '}
          <Badge tone={ok ? 'success' : 'warning'}>
            {score}/100 · {ok ? 'Sobre la meta' : 'Bajo la meta'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <Callout
          tone={ok ? 'success' : 'warning'}
          title={ok ? 'Cumple la meta de referencia' : 'No alcanza la meta de referencia'}
        >
          Puntuación {score}/100 comparada con la meta ≥70. Demostración con datos sintéticos; no
          representa evaluación real.
        </Callout>
        <p className="text-sm">
          <strong>Fórmula:</strong> {unuqFormula}. Cálculo: ({suma} / (22 × 5)) × 100 = {score}.
        </p>
        <Progress
          label={`Puntuación total ${score} de 100`}
          value={score}
          tone={ok ? 'success' : 'warning'}
        />
        <Table caption="Desglose por 7 atributos UnUQ">
          <TableHeader>
            <TableRow>
              <TableHead>Atributo</TableHead>
              <TableHead>Peso</TableHead>
              <TableHead>Promedio (1–5)</TableHead>
              <TableHead>Puntaje</TableHead>
              <TableHead>Visual</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resumen.map((r) => (
              <TableRow key={r.atributo}>
                <TableCell>{r.atributo}</TableCell>
                <TableCell>{(r.peso * 100).toFixed(1)}%</TableCell>
                <TableCell>{r.promedio.toFixed(2)}</TableCell>
                <TableCell>{r.puntaje}/100</TableCell>
                <TableCell className="min-w-36">
                  <Progress
                    label={`${r.atributo}: ${r.puntaje}`}
                    value={r.puntaje}
                    tone={r.puntaje >= 70 ? 'success' : 'warning'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
