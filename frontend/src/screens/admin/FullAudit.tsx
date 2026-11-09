import { useState, type ChangeEvent } from 'react';
import {
  ActivityTypeBadge,
  SearchInput,
  EmptyState,
  FilterBar,
  Input,
  Field,
  Select,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../design-system';
import type { DemoAuditEvent } from '../fixtures/types';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';
import { ResearcherLayout, SectionCard } from '../researcher/ResearcherBlocks';

const ACTIVITY_TYPES = [
  'todos',
  'lectura',
  'exportacion',
  'inferencia',
  'upload',
  'admin',
  'seguridad',
];

export function FullAudit({ events }: { events: DemoAuditEvent[] }) {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('todos');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const rows = events.filter((e) => {
    const matchesText = `${e.usuario} ${e.accion} ${e.detalle} ${e.ip}`
      .toLowerCase()
      .includes(q.toLowerCase());
    const matchesType = kind === 'todos' || e.tipo === kind;
    const matchesFrom = !from || e.fecha >= from;
    const matchesTo = !to || e.fecha <= to;
    return matchesText && matchesType && matchesFrom && matchesTo;
  });
  return (
    <DemoRoleLayout role="administrador">
      <ScreenFrame
        title="Auditoría completa"
        description="Registro sintético de actividad. Las direcciones usan rangos reservados para documentación."
      >
        <ResearcherLayout
          title="Eventos de demostración"
          description="Datos ficticios, sin actividad real del sistema."
        >
          <FilterBar
            label="Filtros de auditoría"
            onReset={() => {
              setQ('');
              setKind('todos');
              setFrom('');
              setTo('');
            }}
          >
            <SearchInput
              label="Buscar eventos"
              value={q}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
              onClear={() => setQ('')}
              containerClassName="sm:flex-1"
            />
            <Field label="Tipo de actividad">
              <Select value={kind} onChange={(e) => setKind(e.target.value)}>
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t === 'todos' ? 'Todos' : t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Desde">
              <Input
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="2026-04-12"
              />
            </Field>
            <Field label="Hasta">
              <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="2026-04-13" />
            </Field>
          </FilterBar>
          <SectionCard title={`${rows.length} eventos visibles`}>
            {rows.length ? (
              <div className="overflow-x-auto">
                <Table caption="Registro sintético de auditoría">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Marca temporal</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Recurso</TableHead>
                      <TableHead>Resultado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{e.fecha}</TableCell>
                        <TableCell>{e.usuario}</TableCell>
                        <TableCell>{e.accion}</TableCell>
                        <TableCell>{e.detalle}</TableCell>
                        <TableCell className="flex gap-2">
                          <ActivityTypeBadge type={e.tipo} />
                          <StatusBadge kind="user" status="Activo" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState title="Sin eventos" description="No se encontraron eventos sintéticos." />
            )}
          </SectionCard>
        </ResearcherLayout>
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
