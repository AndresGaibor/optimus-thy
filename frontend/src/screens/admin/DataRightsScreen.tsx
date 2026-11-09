import { useMemo, useState } from 'react';
import { AlertTriangle, Clock3 } from 'lucide-react';
import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  Field,
  Input,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../design-system';
import type { DerechoTipo, SolicitudDerecho } from '../fixtures/casos-extra';
import { ScreenFrame } from '../shared/ScreenFrame';

const TIPOS: DerechoTipo[] = ['Acceso', 'Rectificación', 'Supresión', 'Oposición'];
const DIA_MS = 24 * 60 * 60 * 1000;

function diasRestantes(fecha: string, hoy: Date) {
  const inicio = new Date(`${fecha}T00:00:00`);
  const limite = new Date(inicio.getTime() + 15 * DIA_MS);
  return Math.ceil((limite.getTime() - hoy.getTime()) / DIA_MS);
}

function etiquetaPlazo(restante: number) {
  if (restante < 0)
    return `Vencido hace ${Math.abs(restante)} día${Math.abs(restante) === 1 ? '' : 's'}`;
  if (restante === 0) return 'Vence hoy';
  return `${restante} día${restante === 1 ? '' : 's'} restantes`;
}

export interface DataRightsScreenProps {
  solicitudes: SolicitudDerecho[];
  hoy?: string;
}

export function DataRightsScreen({ solicitudes, hoy = '2026-11-08' }: DataRightsScreenProps) {
  const base = useMemo(() => new Date(`${hoy}T00:00:00`), [hoy]);
  const [rows, setRows] = useState(solicitudes);
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState({
    tipo: 'Acceso' as DerechoTipo,
    responsable: '',
    fecha: hoy,
    titular: '',
  });
  const invalido = !form.responsable.trim() || !form.titular.trim() || !form.fecha;

  const registrar = () => {
    if (invalido) return;
    setRows((current) => [
      {
        id: `DER-${String(current.length + 1).padStart(3, '0')}`,
        ...form,
        responsable: form.responsable.trim(),
        titular: form.titular.trim(),
      },
      ...current,
    ]);
    setAbierto(false);
    setForm({ tipo: 'Acceso', responsable: '', fecha: hoy, titular: '' });
  };

  return (
    <ScreenFrame
      title="Derechos de titulares"
      description="Solicitudes registradas con fecha, tipo, responsable y plazo de respuesta de 15 días."
      actions={<Button onClick={() => setAbierto(true)}>Registrar solicitud</Button>}
    >
      {rows.length ? (
        <Table caption="Solicitudes de derechos de titulares">
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Titular</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Plazo restante</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const restante = diasRestantes(row.fecha, base);
              const vencido = restante < 0;
              return (
                <TableRow key={row.id}>
                  <TableCell>{row.fecha}</TableCell>
                  <TableCell>{row.tipo}</TableCell>
                  <TableCell>{row.titular}</TableCell>
                  <TableCell>{row.responsable}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={vencido ? 'danger' : restante <= 3 ? 'warning' : 'info'}>
                        {vencido ? (
                          <AlertTriangle aria-hidden="true" className="size-3.5" />
                        ) : (
                          <Clock3 aria-hidden="true" className="size-3.5" />
                        )}
                        {vencido ? 'Vencido' : 'En plazo'}
                      </Badge>
                      <span className="text-sm text-foreground">{etiquetaPlazo(restante)}</span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          title="Sin solicitudes"
          description="No hay solicitudes registradas. Usa “Registrar solicitud” para crear la primera."
        />
      )}

      <Dialog
        open={abierto}
        onOpenChange={setAbierto}
        title="Registrar solicitud"
        description="Registra la solicitud con responsable y fecha para calcular el plazo de 15 días."
        footer={
          <>
            <Button variant="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={registrar} disabled={invalido}>
              Guardar solicitud
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Tipo de solicitud">
            <Select
              aria-label="Tipo de solicitud"
              value={form.tipo}
              onChange={(event) => setForm({ ...form, tipo: event.target.value as DerechoTipo })}
            >
              {TIPOS.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Titular" hint="Usa un identificador demostrativo." required>
            <Input
              aria-label="Titular"
              value={form.titular}
              onChange={(event) => setForm({ ...form, titular: event.target.value })}
            />
          </Field>
          <Field label="Responsable" required>
            <Input
              aria-label="Responsable"
              value={form.responsable}
              onChange={(event) => setForm({ ...form, responsable: event.target.value })}
            />
          </Field>
          <Field label="Fecha de solicitud" required>
            <Input
              aria-label="Fecha de solicitud"
              type="date"
              value={form.fecha}
              onChange={(event) => setForm({ ...form, fecha: event.target.value })}
            />
          </Field>
          {invalido ? (
            <p className="text-sm text-muted-foreground">
              Completa titular, responsable y fecha para guardar la solicitud.
            </p>
          ) : null}
        </div>
      </Dialog>
    </ScreenFrame>
  );
}
