import { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  Field,
  Input,
  Pagination,
  Select,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../design-system';
import type { InferenceHistoryRecord } from '../fixtures/inferencias-extra';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';

export function InferenceHistoryScreen({ inferences }: { inferences: InferenceHistoryRecord[] }) {
  const [patient, setPatient] = useState('');
  const [date, setDate] = useState('');
  const [kind, setKind] = useState('');
  const [offset, setOffset] = useState(0);
  const pageSize = 5;
  const patients = [...new Set(inferences.map((item) => item.pacienteNombre))];
  const classes = [...new Set(inferences.map((item) => item.clase))];
  const filtered = useMemo(
    () =>
      inferences.filter(
        (item) =>
          (!patient || item.pacienteNombre === patient) &&
          (!date || item.fecha === date) &&
          (!kind || item.clase === kind),
      ),
    [inferences, patient, date, kind],
  );
  const page = filtered.slice(offset, offset + pageSize);
  const reset = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setOffset(0);
  };
  return (
    <DemoRoleLayout role="medico">
      <ScreenFrame
        title="Historial de inferencias"
        description="Consulta de resultados y estados de inferencias; valores demostrativos."
      >
        <Card>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
            <Field label="Paciente">
              <Select value={patient} onChange={(event) => reset(setPatient)(event.target.value)}>
                <option value="">Todos</option>
                {patients.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </Select>
            </Field>
            <Field label="Fecha">
              <Input
                aria-label="Fecha"
                type="date"
                value={date}
                onChange={(event) => reset(setDate)(event.target.value)}
              />
            </Field>
            <Field label="Clase">
              <Select value={kind} onChange={(event) => reset(setKind)(event.target.value)}>
                <option value="">Todas</option>
                {classes.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </Select>
            </Field>
          </CardContent>
        </Card>
        <div className="overflow-x-auto">
          <Table caption="Historial de inferencias">
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Confianza</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {page.length ? (
                page.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.fecha}</TableCell>
                    <TableCell>{item.pacienteNombre}</TableCell>
                    <TableCell>{item.modelo}</TableCell>
                    <TableCell>{item.resultado}</TableCell>
                    <TableCell>{item.confianza}%</TableCell>
                    <TableCell>
                      <StatusBadge kind="inference" status={item.estado} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6}>No hay inferencias para estos filtros.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <Pagination
          total={filtered.length}
          limit={pageSize}
          offset={offset}
          onOffsetChange={setOffset}
          itemLabel="inferencia"
        />
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
