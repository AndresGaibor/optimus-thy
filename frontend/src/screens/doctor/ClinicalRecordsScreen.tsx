import { useId, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  Badge,
  Button,
  Callout,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  ConfidenceBadge,
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
  cn,
} from '../../design-system';
import type { BadgeTone, RecordStatus } from '../../design-system';
import { TONE_CLASSES } from '../../design-system/tones';
import type { DemoPatient, DemoRecord } from '../fixtures/types';
import { DemoRoleLayout } from '../shared/DemoRoleLayout';
import { ScreenFrame } from '../shared/ScreenFrame';
export interface ClinicalRecordsScreenProps {
  records: DemoRecord[];
  patients: DemoPatient[];
  /** Se invoca sin datos al validar el formulario de demostración; no se guarda nada. */
  onCreateRecord: () => void;
  /** Se invoca con el identificador de la ficha al confirmar la revisión de demostración. */
  onReviewRecord: (id: string) => void;
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

interface OcrDemoField {
  id: string;
  label: string;
  /** Texto impreso en el documento fuente sintético. */
  fuente: string;
  /** Texto que «leyó» el OCR ilustrativo; puede diferir de la fuente. */
  leido: string;
  confianza: number;
  /** El tono y la marca de revisión los aporta este dato de demostración, no un umbral. */
  tone: BadgeTone;
  revisar: boolean;
}

const OCR_DEMO_FIELDS: OcrDemoField[] = [
  {
    id: 'fecha',
    label: 'Fecha de laboratorio',
    fuente: '2026-03-18',
    leido: '2026-03-18',
    confianza: 97,
    tone: 'success',
    revisar: false,
  },
  {
    id: 'tsh',
    label: 'TSH',
    fuente: '3,1',
    leido: '3,1',
    confianza: 94,
    tone: 'success',
    revisar: false,
  },
  {
    id: 't3',
    label: 'T3',
    fuente: '1,4',
    leido: '1,4',
    confianza: 90,
    tone: 'success',
    revisar: false,
  },
  {
    id: 't4',
    label: 'T4',
    fuente: '8,1',
    leido: 'B,1',
    confianza: 58,
    tone: 'warning',
    revisar: true,
  },
  {
    id: 'tamano',
    label: 'Tamaño del nódulo (mm)',
    fuente: '11',
    leido: '1l',
    confianza: 63,
    tone: 'warning',
    revisar: true,
  },
  {
    id: 'bethesda',
    label: 'Bethesda',
    fuente: 'No realizada',
    leido: 'No realizada',
    confianza: 92,
    tone: 'success',
    revisar: false,
  },
];

/** Estados de ficha con lectura OCR ilustrativa disponible para revisar. */
const OCR_REVIEWABLE: RecordStatus[] = ['Revisión', 'Completa'];

function OcrReview({ record, onValid }: { record: DemoRecord; onValid: () => void }) {
  const [error, setError] = useState<string>();
  const errorId = useId();
  const reviewable = OCR_REVIEWABLE.includes(record.estado) && record.ocrConfianza > 0;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (new FormData(form).get('verificado') !== 'on') {
      setError('Confirma que verificaste los campos contra el documento fuente.');
      const control = form.elements.namedItem('verificado');
      if (control instanceof HTMLElement) control.focus();
      return;
    }
    setError(undefined);
    onValid();
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">{record.pacienteNombre}</span>
        <span className="text-muted-foreground">
          {record.tipo} · {record.fecha} · {record.paginas} pág.
        </span>
        <StatusBadge kind="record" status={record.estado} />
        {record.ocrConfianza > 0 && (
          <ConfidenceBadge value={record.ocrConfianza} label="Confianza global demo" />
        )}
      </div>
      <Callout tone="ai" title="Lectura OCR ilustrativa">
        No se ejecutó OCR ni se leyó ningún archivo. La extracción es una
        ayuda; verifica cada campo contra la fuente. No es un diagnóstico.
      </Callout>
      {reviewable ? (
        <form noValidate onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <figure className="space-y-2">
              <h3 className="text-sm font-semibold">Documento fuente</h3>
              {record.src && (
                <img
                  src={record.src}
                  alt={`Documento de ${record.tipo} de ${record.pacienteNombre}`}
                  className="w-full rounded-card border border-border object-contain"
                />
              )}
              <div className="space-y-1 rounded-card border border-border bg-background p-4 font-mono text-xs">
                <p className="font-semibold">DEMO · Informe sintético</p>
                <p className="text-muted-foreground">
                  Página 1 de {record.paginas} · {record.id}
                </p>
                {OCR_DEMO_FIELDS.map((f) => (
                  <p key={f.id}>
                    {f.label}: {f.fuente}
                  </p>
                ))}
              </div>
              <figcaption className="text-xs text-muted-foreground">
                Fuente ilustrativa generada para la demostración; no es un documento real.
              </figcaption>
            </figure>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Campos leídos</h3>
              <ul className="space-y-3">
                {OCR_DEMO_FIELDS.map((f) => (
                  <li
                    key={f.id}
                    className={cn(
                      'space-y-2 rounded-card border p-3',
                      f.revisar ? TONE_CLASSES.warning.surface : 'border-border-subtle',
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <ConfidenceBadge value={f.confianza} tone={f.tone} label="Confianza demo" />
                      {f.revisar && <Badge tone="warning">Baja confianza: revisar</Badge>}
                    </div>
                    <Field label={`${f.label} (valor corregido)`} hint={`Valor leído: ${f.leido}`}>
                      <Input name={f.id} defaultValue={f.leido} autoComplete="off" />
                    </Field>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="space-y-1">
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                name="verificado"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                className="mt-0.5"
              />
              <span>Verifiqué los campos contra el documento fuente.</span>
            </label>
            {error && (
              <p id={errorId} role="alert" className="text-sm font-medium text-danger">
                {error}
              </p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Nada se guarda en la ficha: la acción solo avisa a la demostración con el identificador
            de la ficha.
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit">Solicitar revisión clínica</Button>
          </div>
        </form>
      ) : (
        <>
          <Callout tone="warning" title="Sin lectura OCR para revisar">
            {record.estado === 'En OCR'
              ? 'La lectura de esta ficha sigue en curso en la demostración; aún no hay campos que revisar.'
              : 'Esta ficha todavía no tiene una lectura OCR ilustrativa.'}
          </Callout>
          <div className="flex justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cerrar
              </Button>
            </DialogClose>
          </div>
        </>
      )}
    </div>
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
  onReviewRecord,
}: ClinicalRecordsScreenProps) {
  const [query, setQuery] = useState(''),
    [status, setStatus] = useState('Todos'),
    [selected, setSelected] = useState<DemoRecord | null>(null),
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
        description="Registros sintéticos con revisión humana para campos extraídos."
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
          {['Completa', 'En OCR', 'Revisión', 'Pendiente'].map((s) => (
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
                <option>En OCR</option>
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
                    <TableHead>OCR ilustrativo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shown.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.id}</TableCell>
                      <TableCell>{r.pacienteNombre}</TableCell>
                      <TableCell>{r.tipo}</TableCell>
                      <TableCell>{r.fecha}</TableCell>
                      <TableCell>{r.ocrConfianza ? `${r.ocrConfianza}% demo` : '—'}</TableCell>
                      <TableCell>
                        <StatusBadge kind="record" status={r.estado} />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label={`Revisar ficha ${r.id}`}
                          onClick={() => {
                            setNotice(null);
                            setSelected(r);
                          }}
                        >
                          Revisar
                        </Button>
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
        <Dialog
          open={Boolean(selected)}
          onOpenChange={(open) => !open && setSelected(null)}
          size="wide"
          title={selected ? `Revisión de ficha ${selected.id}` : 'Revisión de ficha'}
          description="Los campos reconocidos requieren validación profesional."
        >
          {selected && (
            <OcrReview
              key={selected.id}
              record={selected}
              onValid={() => {
                setSelected(null);
                setNotice('review');
                onReviewRecord(selected.id);
              }}
            />
          )}
        </Dialog>
        <p className="text-sm text-muted-foreground">
          Pacientes disponibles en esta demostración: {patients.length}.
        </p>
      </ScreenFrame>
    </DemoRoleLayout>
  );
}
