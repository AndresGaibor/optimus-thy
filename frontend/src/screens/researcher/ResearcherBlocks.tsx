import type { ReactNode } from 'react';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../design-system';

export function ResearcherLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </header>
      {children}
    </div>
  );
}
export function MetricTable({ rows }: { rows: { model: string; values: string[] }[] }) {
  return (
    <div className="overflow-x-auto">
      <Table caption="Métricas sintéticas por modelo">
        <TableHeader>
          <TableRow>
            <TableHead>Modelo sintético</TableHead>
            <TableHead>Accuracy</TableHead>
            <TableHead>Precisión</TableHead>
            <TableHead>Recall</TableHead>
            <TableHead>F1</TableHead>
            <TableHead>Casos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.model}>
              <TableCell className="font-medium">{r.model}</TableCell>
              {r.values.map((v, i) => (
                <TableCell key={i}>{v}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
export function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
export function DemoMetricNote() {
  return (
    <p className="text-xs text-muted-foreground">
      Cifras ilustrativas; no representan rendimiento real de modelos.
    </p>
  );
}
export function MetricStats({ items }: { items: { label: string; value: string | number }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((x) => (
        <StatCard key={x.label} label={x.label} value={x.value} />
      ))}
    </div>
  );
}
export function Severity({ value }: { value: string }) {
  return (
    <Badge tone={value === 'Alta' ? 'danger' : value === 'Media' ? 'warning' : 'neutral'}>
      {value}
    </Badge>
  );
}
