import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  Button,
  Callout,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  EmptyState,
  Field,
  FilterBar,
  Input,
  SearchInput,
  Select,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '../../design-system';
import type { DemoPatient, DemoRecord } from '../fixtures/types';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';
export interface ClinicalRecordsScreenProps {
  records: DemoRecord[];
  patients: DemoPatient[];
  /** Se invoca sin datos al validar el formulario de demostración; no se guarda nada. */
  onCreateRecord: () => void;
}

type NewRecordField = 'paciente' | 'fecha' | 'tsh' | 't3' | 't4' | 'tamano' | 'cie10';
type NewRecordErrors = Partial<Record<NewRecordField, string>>;
const NEW_RECORD_FIELD_ORDER: NewRecordField[] = [
  'paciente',
  'fecha',
  'tsh',
  't3',
  't4',
  'tamano',
  'cie10',
];
const DECIMAL_PATTERN = /^\d+([.,]\d+)?$/;
const CIE10_PATTERN = /^[A-Za-z]\d{2}(\.\d{1,2})?$/;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-3 rounded-card border border-border-subtle p-4">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

function NewRecordForm({ patients, onValid }: { patients: DemoPatient[]; onValid: () => void }) {
  const [errors, setErrors] = useState<NewRecordErrors>({});
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const text = (name: string) => String(data.get(name) ?? '').trim();
    const next: NewRecordErrors = {};
    if (!text('paciente')) next.paciente = 'Selecciona un paciente demo.';
    if (!text('fecha')) next.fecha = 'Indica la fecha de la ficha.';
    const decimals: [NewRecordField, string][] = [
      ['tsh', 'TSH'],
      ['t3', 'T3'],
      ['t4', 'T4'],
      ['tamano', 'Tamaño del nódulo'],
    ];
    for (const [name, label] of decimals) {
      const value = text(name);
      if (value && !DECIMAL_PATTERN.test(value))
        next[name] = `${label}: escribe un número positivo con coma o punto decimal.`;
    }
    const cie10 = text('cie10');
    if (cie10 && !CIE10_PATTERN.test(cie10))
      next.cie10 = 'El código CIE-10 tiene el formato A00 o A00.0.';
    setErrors(next);
    const firstInvalid = NEW_RECORD_FIELD_ORDER.find((name) => next[name]);
    if (firstInvalid) {
      const control = form.elements.namedItem(firstInvalid);
      if (control instanceof HTMLElement) control.focus();
      return;
    }
    onValid();
  };
  const errorCount = Object.keys(errors).length;
  return (
    <form noValidate onSubmit={submit} className="space-y-4">
      {errorCount > 0 && (
        <Callout tone="danger" role="alert" title="Revisa los campos marcados">
          {errorCount === 1
            ? 'Hay 1 campo que requiere corrección.'
            : `Hay ${errorCount} campos que requieren corrección.`}
        </Callout>
      )}
      <Section title="Consulta">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Paciente" required error={errors.paciente}>
            <Select name="paciente" defaultValue="">
              <option value="">Selecciona un paciente demo</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} · {p.id}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tipo de ficha">
            <Select name="tipo" defaultValue="Consulta general">
              <option>Consulta general</option>
              <option>Ecografía</option>
              <option>Laboratorio</option>
            </Select>
          </Field>
          <Field label="Fecha" required error={errors.fecha}>
            <Input name="fecha" type="date" />
          </Field>
        </div>
        <Field label="Motivo de consulta">
          <Textarea name="motivo" placeholder="Texto ficticio de demostración" />
        </Field>
      </Section>
      <Section title="Laboratorio">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="TSH" error={errors.tsh}>
            <Input name="tsh" inputMode="decimal" autoComplete="off" placeholder="3,1" />
          </Field>
          <Field label="T3" error={errors.t3}>
            <Input name="t3" inputMode="decimal" autoComplete="off" placeholder="1,4" />
          </Field>
          <Field label="T4" error={errors.t4}>
            <Input name="t4" inputMode="decimal" autoComplete="off" placeholder="8,1" />
          </Field>
        </div>
      </Section>
      <Section title="Ecografía">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tamaño del nódulo (mm)" error={errors.tamano}>
            <Input name="tamano" inputMode="decimal" autoComplete="off" placeholder="11" />
          </Field>
          <Field label="TI-RADS">
            <Select name="tirads" defaultValue="">
              <option value="">Sin dato</option>
              {['1', '2', '3', '4', '5'].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </Select>
          </Field>
        </div>
      </Section>
      <Section title="PAAF y Bethesda">
        <Field label="Categoría Bethesda">
          <Select name="bethesda" defaultValue="">
            <option value="">No realizada</option>
            {['I', 'II', 'III', 'IV', 'V', 'VI'].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </Select>
        </Field>
      </Section>
      <Section title="Antecedentes">
        <Field label="Antecedentes relevantes">
          <Textarea name="antecedentes" placeholder="Texto ficticio de demostración" />
        </Field>
      </Section>
      <Section title="Diagnóstico (CIE-10)">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Código CIE-10"
            hint="Lo registra el profesional; la IA no propone diagnósticos."
            error={errors.cie10}
          >
            <Input name="cie10" autoComplete="off" placeholder="A00.0" />
          </Field>
          <Field label="Descripción del diagnóstico">
            <Input name="diagnostico" autoComplete="off" placeholder="Texto ficticio" />
          </Field>
        </div>
      </Section>
      <div className="flex flex-wrap justify-end gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit">Crear ficha demo</Button>
      </div>
    </form>
  );
}

const NOTICES = {
  create:
    'Se llamó a la acción de demostración; no se creó ninguna ficha ni se guardó ningún dato.',
  review:
    'Se llamó a la acción de demostración; no se modificó ninguna ficha ni se guardó ningún dato.',
} as const;

export function ClinicalRecordsScreen({
  records,
  patients,
  onCreateRecord,
}: ClinicalRecordsScreenProps) {
  const [query, setQuery] = useState(''),
    [status, setStatus] = useState('Todos'),
    [creating, setCreating] = useState(false),
    [notice, setNotice] = useState<keyof typeof NOTICES | null>(null);
  const shown = useMemo(
    () =>
      records.filter(
        (r) =>
          (status === 'Todos' || r.estado === status) &&
          `${r.id} ${r.pacienteNombre} ${r.tipo}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [records, status, query],
  );
  return (
    <DemoRoleLayout role="medico">
      <ScreenFrame
        title="Fichas clínicas"
        description="Registros clínicos sintéticos para consulta y seguimiento."
        actions={
          <Button
            onClick={() => {
              setNotice(null);
              setCreating(true);
            }}
          >
            Nueva ficha
          </Button>
        }
      >
        <div role="status" className="empty:hidden">
          {notice && (
            <Callout tone="info" title="Formulario de demostración validado">
              {NOTICES[notice]}
            </Callout>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {['Completa', 'Revisión', 'Pendiente'].map((s) => (
            <Card key={s}>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{s}</p>
                <p className="mt-1 text-2xl font-semibold">
                  {records.filter((r) => r.estado === s).length}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {shown.map((r) => (
            <Card key={r.id}>
              <CardHeader>
                <CardTitle as="h2" className="flex items-center justify-between">
                  <span>{r.id}</span>
                  <StatusBadge kind="record" status={r.estado} />
                </CardTitle>
                <p className="text-sm text-muted-foreground">{r.pacienteNombre}</p>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>Profesional responsable: Médico de demostración</p>
                <p>Fecha de inicio: {r.fecha}</p>
                <p>Documentos: {r.paginas}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="space-y-4 p-5">
            <FilterBar label="Filtros">
              <SearchInput
                label="Buscar fichas clínicas"
                placeholder="Buscar ficha o paciente"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Select
                aria-label="Filtrar por estado"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>Todos</option>
                <option>Completa</option>
                <option>Revisión</option>
                <option>Pendiente</option>
              </Select>
            </FilterBar>
            <div className="overflow-x-auto">
              <Table caption="Datos sintéticos">
                <TableHeader>
                  <TableRow>
                    <TableHead>Ficha</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shown.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.id}</TableCell>
                      <TableCell>{r.pacienteNombre}</TableCell>
                      <TableCell>{r.tipo}</TableCell>
                      <TableCell>{r.fecha}</TableCell>
                      <TableCell>
                        <StatusBadge kind="record" status={r.estado} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {!shown.length && (
              <EmptyState
                title="No hay fichas con estos filtros"
                description="Ajusta la búsqueda o selecciona otro estado."
              />
            )}
          </CardContent>
        </Card>
        <Dialog
          open={creating}
          onOpenChange={setCreating}
          size="lg"
          title="Nueva ficha clínica demo"
          description="Secciones de la ficha: consulta, laboratorio, ecografía, PAAF y Bethesda, antecedentes y diagnóstico."
        >
          <NewRecordForm
            patients={patients}
            onValid={() => {
              setCreating(false);
              setNotice('create');
              onCreateRecord();
            }}
          />
        </Dialog>
        <p className="text-sm text-muted-foreground">
          Pacientes disponibles en esta demostración: {patients.length}.
        </p>
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
