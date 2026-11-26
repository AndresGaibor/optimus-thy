import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../design-system/components/atoms/Button';
import { Checkbox } from '../../design-system/components/atoms/Checkbox';
import { Input } from '../../design-system/components/atoms/Input';
import { Label } from '../../design-system/components/atoms/Label';
import { Spinner } from '../../design-system/components/atoms/Spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../design-system/components/atoms/Table';
import { Callout } from '../../design-system/components/molecules/Callout';
import { EmptyState } from '../../design-system/components/molecules/EmptyState';
import { Field } from '../../design-system/components/molecules/Field';
import { PageHeader } from '../../design-system/components/molecules/PageHeader';
import { Pagination } from '../../design-system/components/molecules/Pagination';
import { SearchInput } from '../../design-system/components/molecules/SearchInput';
import { Toast } from '../../design-system/components/molecules/Toast';
import { Dialog, DialogClose } from '../../design-system/components/organisms/Dialog';
import {
  listarPacientes,
  obtenerPaciente,
  type Paciente,
  type PacienteDetalle,
} from '../../api/pacientes';
import { DialogoArchivadoPaciente } from './DialogoArchivadoPaciente';
import { DialogoDetallePaciente } from './DialogoDetallePaciente';
import { FilaPaciente } from './FilaPaciente';
import { useAltaPaciente } from './useAltaPaciente';
import { useArchivadoPaciente } from './useArchivadoPaciente';

const LIMITE_POR_PAGINA = 20;

export function PacientesPage() {
  const [busqueda, setBusqueda] = useState('');
  const [q, setQ] = useState('');
  const [desplazamiento, setDesplazamiento] = useState(0);
  const [total, setTotal] = useState(0);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorListado, setErrorListado] = useState<string | null>(null);
  const [incluirArchivados, setIncluirArchivados] = useState(false);

  const [avisoExito, setAvisoExito] = useState<string | null>(null);

  const [dialogoDetalleAbierto, setDialogoDetalleAbierto] = useState(false);
  const [pacienteDetalle, setPacienteDetalle] = useState<PacienteDetalle | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      setQ(busqueda.trim());
      setDesplazamiento(0);
    }, 300);
    return () => clearTimeout(temporizador);
  }, [busqueda]);

  const cargarPacientes = useCallback(async () => {
    setCargando(true);
    setErrorListado(null);
    const resultado = await listarPacientes({
      limite: LIMITE_POR_PAGINA,
      desplazamiento,
      incluir_archivados: incluirArchivados,
      ...(q === '' ? {} : { q }),
    });
    if (!resultado.ok) {
      setErrorListado('No se pudieron cargar los pacientes. Reintenta la operación.');
      setPacientes([]);
      setTotal(0);
      setCargando(false);
      return;
    }
    setPacientes(resultado.data.items);
    setTotal(resultado.data.total);
    setCargando(false);
  }, [incluirArchivados, q, desplazamiento]);

  useEffect(() => {
    void cargarPacientes();
  }, [cargarPacientes]);

  const alta = useAltaPaciente(
    useCallback(() => {
      setDesplazamiento(0);
      setAvisoExito('Paciente creado correctamente.');
      void cargarPacientes();
    }, [cargarPacientes]),
  );

  const archivado = useArchivadoPaciente({
    cargarPacientes,
    desplazamiento,
    incluirArchivados,
    irAlInicio: useCallback(() => setDesplazamiento(0), []),
    avisar: setAvisoExito,
  });

  useEffect(() => {
    if (!avisoExito) {
      return;
    }
    const temporizador = setTimeout(() => setAvisoExito(null), 4000);
    return () => clearTimeout(temporizador);
  }, [avisoExito]);

  const verDetalle = useCallback(async (paciente: Paciente) => {
    setDialogoDetalleAbierto(true);
    setPacienteDetalle(null);
    setCargandoDetalle(true);
    setErrorDetalle(null);
    const resultado = await obtenerPaciente(paciente.id);
    if (!resultado.ok) {
      setErrorDetalle('No se pudo cargar el detalle del paciente.');
      setCargandoDetalle(false);
      return;
    }
    const datos = resultado.data as Partial<PacienteDetalle>;
    const detalle: PacienteDetalle = { ...paciente, casos: datos.casos ?? [] };
    setPacienteDetalle(detalle);
    setCargandoDetalle(false);
  }, []);
  return (
    <section className="mx-auto w-full max-w-(--content-max-width) space-y-6 px-4 py-6">
      <PageHeader
        title="Pacientes"
        description="Se muestran códigos internos, no identidad. Use el buscador para localizar pacientes."
        actions={<Button onClick={alta.abrir}>Nuevo paciente</Button>}
      />

      {avisoExito ? <Toast title={avisoExito} tone="success" /> : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          placeholder="Buscar por código..."
          label="Buscar pacientes"
        />
        <div className="flex items-center gap-2">
          <Checkbox
            id="incluir-archivados"
            checked={incluirArchivados}
            onChange={(evento) => {
              setIncluirArchivados(evento.target.checked);
              setDesplazamiento(0);
            }}
          />
          <Label htmlFor="incluir-archivados">Incluir archivados</Label>
        </div>
      </div>

      {errorListado ? (
        <Callout tone="danger" role="alert">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>No se pudo cargar la lista</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void cargarPacientes()}
              disabled={cargando}
            >
              Reintentar
            </Button>
          </div>
        </Callout>
      ) : null}

      <div className="overflow-hidden rounded-panel border border-border bg-surface">
        <Table caption="Pacientes registrados">
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Casos</TableHead>
              <TableHead>Alta</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargando ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="flex items-center justify-center py-6">
                    <Spinner aria-label="Cargando pacientes" />
                  </div>
                </TableCell>
              </TableRow>
            ) : pacientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  {q === '' ? (
                    <EmptyState
                      as="h2"
                      title="Todavía no hay pacientes"
                      description="Registra el primer paciente para empezar."
                      action={<Button onClick={alta.abrir}>Registrar el primero</Button>}
                    />
                  ) : (
                    <EmptyState
                      as="h2"
                      title="No se encontraron pacientes"
                      description="Prueba con otro término de búsqueda."
                      action={
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setBusqueda('');
                            setQ('');
                            setDesplazamiento(0);
                          }}
                        >
                          Limpiar búsqueda
                        </Button>
                      }
                    />
                  )}
                </TableCell>
              </TableRow>
            ) : (
              pacientes.map((paciente) => (
                <FilaPaciente
                  key={paciente.id}
                  paciente={paciente}
                  onVerDetalle={verDetalle}
                  onArchivar={archivado.abrir}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > 0 && !cargando ? (
        <Pagination
          total={total}
          limit={LIMITE_POR_PAGINA}
          offset={desplazamiento}
          onOffsetChange={setDesplazamiento}
          itemLabel="paciente"
        />
      ) : null}

      <Dialog
        open={alta.abierto}
        onOpenChange={alta.setAbierto}
        title="Nuevo paciente"
        description="Introduce los datos mínimos para dar de alta al paciente."
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </DialogClose>
            {alta.duplicado ? (
              <Button onClick={() => void alta.guardar(true)} disabled={alta.guardando}>
                {alta.guardando ? 'Guardando...' : 'Registrar igualmente'}
              </Button>
            ) : (
              <Button onClick={() => void alta.guardar()} disabled={alta.guardando}>
                {alta.guardando ? 'Guardando...' : 'Guardar'}
              </Button>
            )}
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {alta.error ? (
            <Callout tone="danger" role="alert">
              {alta.error}
            </Callout>
          ) : null}
          <Field label="Nombres" required error={alta.errores.nombres}>
            <Input
              value={alta.formulario.nombres}
              onChange={(evento) => alta.cambiar('nombres', evento.target.value)}
            />
          </Field>
          <Field label="Apellidos" required error={alta.errores.apellidos}>
            <Input
              value={alta.formulario.apellidos}
              onChange={(evento) => alta.cambiar('apellidos', evento.target.value)}
            />
          </Field>
          <Field label="Documento" required error={alta.errores.documento}>
            <Input
              value={alta.formulario.documento}
              onChange={(evento) => alta.cambiar('documento', evento.target.value)}
            />
          </Field>
          <Field label="Fecha de nacimiento" required error={alta.errores.fecha_nacimiento}>
            <Input
              type="date"
              value={alta.formulario.fecha_nacimiento}
              onChange={(evento) => alta.cambiar('fecha_nacimiento', evento.target.value)}
            />
          </Field>
        </div>
      </Dialog>

      <DialogoDetallePaciente
        abierto={dialogoDetalleAbierto}
        onAbiertoChange={setDialogoDetalleAbierto}
        cargando={cargandoDetalle}
        error={errorDetalle}
        paciente={pacienteDetalle}
      />
      <DialogoArchivadoPaciente
        paciente={archivado.paciente}
        cargando={archivado.cargando}
        error={archivado.error}
        onConfirmar={() => void archivado.confirmar()}
        onCerrar={archivado.cerrar}
      />
    </section>
  );
}
