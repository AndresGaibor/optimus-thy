import { useMemo, useState } from 'react';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from '../../design-system';
import { TONE_CLASSES } from '../../design-system/tones';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';
import type { VersionFicha } from '../fixtures/fichas-extra';

export interface RecordsHistoryScreenProps {
  fichaId: string;
  versiones: VersionFicha[];
}

export function RecordsHistoryScreen({ fichaId, versiones }: RecordsHistoryScreenProps) {
  const [izq, setIzq] = useState(versiones[0]?.id ?? '');
  const [der, setDer] = useState(versiones[1]?.id ?? versiones[0]?.id ?? '');
  const va = versiones.find((v) => v.id === izq) ?? versiones[0];
  const vb = versiones.find((v) => v.id === der) ?? versiones[1] ?? versiones[0];
  const filas = useMemo(() => {
    if (!va || !vb) return [];
    return va.campos.map((c, i) => {
      const nuevo = vb.campos[i]?.valor ?? '—';
      return { campo: c.campo, anterior: c.valor, nuevo, cambio: c.valor !== nuevo };
    });
  }, [va, vb]);

  return (
    <DemoRoleLayout role="medico">
      <ScreenFrame
        title={`Historial de ficha ${fichaId}`}
        description="Quién, cuándo y qué cambió, con comparación entre versiones."
      >
        <Card>
          <CardHeader>
            <CardTitle as="h2">Versiones</CardTitle>
          </CardHeader>
          <CardContent>
            <Table caption="Historial de versiones de la ficha">
              <TableHeader>
                <TableRow>
                  <TableHead>Versión</TableHead>
                  <TableHead>Quién</TableHead>
                  <TableHead>Cuándo</TableHead>
                  <TableHead>Qué cambió</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versiones.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>v{v.version}</TableCell>
                    <TableCell>{v.autor}</TableCell>
                    <TableCell>{v.fecha}</TableCell>
                    <TableCell>{v.resumen}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle as="h2">Comparación lado a lado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Versión anterior</span>
                <Select
                  aria-label="Versión anterior"
                  value={izq}
                  onChange={(e) => setIzq(e.target.value)}
                >
                  {versiones.map((v) => (
                    <option key={v.id} value={v.id}>
                      v{v.version} · {v.fecha}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Versión nueva</span>
                <Select
                  aria-label="Versión nueva"
                  value={der}
                  onChange={(e) => setDer(e.target.value)}
                >
                  {versiones.map((v) => (
                    <option key={v.id} value={v.id}>
                      v{v.version} · {v.fecha}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
            <Table caption="Comparación entre versiones">
              <TableHeader>
                <TableRow>
                  <TableHead>Campo</TableHead>
                  <TableHead>Valor anterior</TableHead>
                  <TableHead>Valor nuevo</TableHead>
                  <TableHead>Cambio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filas.map((f) => (
                  <TableRow
                    key={f.campo}
                    className={cn(f.cambio ? TONE_CLASSES.warning.surface : undefined)}
                  >
                    <TableCell>{f.campo}</TableCell>
                    <TableCell>{f.anterior}</TableCell>
                    <TableCell>{f.nuevo}</TableCell>
                    <TableCell>
                      {f.cambio ? (
                        <Badge tone="warning">Modificado</Badge>
                      ) : (
                        <Badge tone="neutral">Sin cambio</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
