import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../design-system/components/atoms/Button';
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
  crearPaciente,
  listarPacientes,
  obtenerPaciente,
  type Paciente,
} from '../../api/pacientes';

const LIMITE_POR_PAGINA = 20;

interface FormularioCrearPaciente {
  nombres: string;
  apellidos: string;
  documento: string;
  fecha_nacimiento: string;
}

function formatearFecha(fechaIso: string): string {
  try {
    const fecha = new Date(fechaIso);
    return new Intl.DateTimeFormat('es-EC').format(fecha);
  } catch {
    return fechaIso;
  }
}

interface PacienteDetalle extends Paciente {
  casos?: Array<{
    id: string;
    codigo: string;
    paciente_id: string;
    paciente_codigo: string;
    creado_en: string;
  }>;
}

function esPacienteDetalle(valor: unknown): valor is PacienteDetalle {
  if (!valor || typeof valor !== 'object') {
    return false;
  }
  const obj = valor as Record<string, unknown>;
  return typeof obj.id === 'string' && typeof obj.codigo === 'string';
}

export function PacientesPage() {
  const [busqueda, setBusqueda] = useState('');
  const [q, setQ] = useState('');
  const [desplazamiento, setDesplazamiento] = useState(0);
  const [total, setTotal] = useState(0);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorListado, setErrorListado] = useState<string | null>(null);

  const [dialogoCrearAbierto, setDialogoCrearAbierto] = useState(false);
  const [formCrear, setFormCrear] = useState<FormularioCrearPaciente>({
    nombres: '',
    apellidos: '',
    documento: '',
    fecha_nacimiento: '',
  });
  const [erroresCrear, setErroresCrear] = useState<Record<string, string>>({});
  const [errorCrear, setErrorCrear] = useState<string | null>(null);
  const [guardandoCrear, setGuardandoCrear] = useState(false);
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
  }, [q, desplazamiento]);

  useEffect(() => {
    void cargarPacientes();
  }, [cargarPacientes]);

  useEffect(() => {
    if (!avisoExito) {
      return;
    }
    const temporizador = setTimeout(() => setAvisoExito(null), 4000);
    return () => clearTimeout(temporizador);
  }, [avisoExito]);

  const abrirCrear = useCallback(() => {
    setFormCrear({
      nombres: '',
      apellidos: '',
      documento: '',
      fecha_nacimiento: '',
    });
    setErroresCrear({});
    setErrorCrear(null);
    setDialogoCrearAbierto(true);
  }, []);

  const validarCrear = useCallback((): boolean => {
    const errores: Record<string, string> = {};
    const nombres = formCrear.nombres.trim();
    const apellidos = formCrear.apellidos.trim();
    const documento = formCrear.documento.trim();
    const fechaNacimiento = formCrear.fecha_nacimiento;

    if (nombres === '') {
      errores.nombres = 'El nombre es obligatorio.';
    } else if (nombres.length > 120) {
      errores.nombres = 'El nombre no puede superar los 120 caracteres.';
    }

    if (apellidos === '') {
      errores.apellidos = 'Los apellidos son obligatorios.';
    } else if (apellidos.length > 120) {
      errores.apellidos = 'Los apellidos no pueden superar los 120 caracteres.';
    }

    if (documento === '') {
      errores.documento = 'El documento es obligatorio.';
    } else if (!/^[A-Za-z0-9-]{5,20}$/.test(documento)) {
      errores.documento =
        'El documento debe tener entre 5 y 20 caracteres alfanuméricos o guiones.';
    }

    if (fechaNacimiento === '') {
      errores.fecha_nacimiento = 'La fecha de nacimiento es obligatoria.';
    } else {
      const fecha = new Date(fechaNacimiento);
      const hoy = new Date();
      if (Number.isNaN(fecha.getTime())) {
        errores.fecha_nacimiento = 'La fecha de nacimiento no es válida.';
      } else {
        if (fecha > hoy) {
          errores.fecha_nacimiento = 'La fecha de nacimiento no puede ser futura.';
        }
        const año = fecha.getFullYear();
        if (año < 1900) {
          errores.fecha_nacimiento = 'El año de nacimiento debe ser mayor o igual a 1900.';
        }
      }
    }

    setErroresCrear(errores);
    return Object.keys(errores).length === 0;
  }, [formCrear]);

  const guardarCrear = useCallback(async () => {
    if (!validarCrear()) {
      return;
    }
    setGuardandoCrear(true);
    setErrorCrear(null);
    const resultado = await crearPaciente({
      nombres: formCrear.nombres.trim(),
      apellidos: formCrear.apellidos.trim(),
      documento: formCrear.documento.trim(),
      fecha_nacimiento: formCrear.fecha_nacimiento,
    });
    if (!resultado.ok) {
      if (resultado.status === 422) {
        setErrorCrear('Revisa los datos introducidos. Hay campos con errores.');
      } else {
        setErrorCrear('No se pudo crear el paciente. Reintenta la operación.');
      }
      setGuardandoCrear(false);
      return;
    }
    setGuardandoCrear(false);
    setDialogoCrearAbierto(false);
    setDesplazamiento(0);
    setAvisoExito('Paciente creado correctamente.');
    void cargarPacientes();
  }, [validarCrear, formCrear, cargarPacientes]);

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
    const detalle = esPacienteDetalle(resultado.data)
      ? (resultado.data as PacienteDetalle)
      : paciente;
    setPacienteDetalle(detalle);
    setCargandoDetalle(false);
  }, []);
  return (
    <section className="mx-auto w-full max-w-(--content-max-width) space-y-6 px-4 py-6">
      <PageHeader
        title="Pacientes"
        description="Se muestran códigos internos, no identidad. Use el buscador para localizar pacientes."
        actions={<Button onClick={abrirCrear}>Nuevo paciente</Button>}
      />

      {avisoExito ? <Toast title={avisoExito} tone="success" /> : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          placeholder="Buscar por código..."
          label="Buscar pacientes"
        />
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
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargando ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <div className="flex items-center justify-center py-6">
                    <Spinner aria-label="Cargando pacientes" />
                  </div>
                </TableCell>
              </TableRow>
            ) : pacientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  {q === '' ? (
                    <EmptyState
                      title="Todavía no hay pacientes"
                      description="Registra el primer paciente para empezar."
                      action={<Button onClick={abrirCrear}>Registrar el primero</Button>}
                    />
                  ) : (
                    <EmptyState
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
                <TableRow key={paciente.id}>
                  <TableCell className="font-medium">{paciente.codigo}</TableCell>
                  <TableCell>{paciente.total_casos}</TableCell>
                  <TableCell>{formatearFecha(paciente.creado_en)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="secondary" onClick={() => void verDetalle(paciente)}>
                      Ver detalle
                    </Button>
                  </TableCell>
                </TableRow>
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
        open={dialogoCrearAbierto}
        onOpenChange={setDialogoCrearAbierto}
        title="Nuevo paciente"
        description="Introduce los datos mínimos para dar de alta al paciente."
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button onClick={() => void guardarCrear()} disabled={guardandoCrear}>
              {guardandoCrear ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {errorCrear ? (
            <Callout tone="danger" role="alert">
              {errorCrear}
            </Callout>
          ) : null}
          <Field label="Nombres" required error={erroresCrear.nombres}>
            <Input
              value={formCrear.nombres}
              onChange={(evento) =>
                setFormCrear((anterior) => ({ ...anterior, nombres: evento.target.value }))
              }
            />
          </Field>
          <Field label="Apellidos" required error={erroresCrear.apellidos}>
            <Input
              value={formCrear.apellidos}
              onChange={(evento) =>
                setFormCrear((anterior) => ({ ...anterior, apellidos: evento.target.value }))
              }
            />
          </Field>
          <Field label="Documento" required error={erroresCrear.documento}>
            <Input
              value={formCrear.documento}
              onChange={(evento) =>
                setFormCrear((anterior) => ({ ...anterior, documento: evento.target.value }))
              }
            />
          </Field>
          <Field label="Fecha de nacimiento" required error={erroresCrear.fecha_nacimiento}>
            <Input
              type="date"
              value={formCrear.fecha_nacimiento}
              onChange={(evento) =>
                setFormCrear((anterior) => ({ ...anterior, fecha_nacimiento: evento.target.value }))
              }
            />
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={dialogoDetalleAbierto}
        onOpenChange={setDialogoDetalleAbierto}
        title="Detalle del paciente"
        description="Información del paciente y sus casos asociados."
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button variant="secondary">Cerrar</Button>
            </DialogClose>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {cargandoDetalle ? (
            <div className="flex items-center justify-center py-6">
              <Spinner aria-label="Cargando detalle" />
            </div>
          ) : errorDetalle ? (
            <Callout tone="danger" role="alert">
              {errorDetalle}
            </Callout>
          ) : pacienteDetalle ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <Label>Código</Label>
                  <div className="text-sm text-foreground">{pacienteDetalle.codigo}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Casos</Label>
                  <div className="text-sm text-foreground">{pacienteDetalle.total_casos}</div>
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <Label>Alta</Label>
                  <div className="text-sm text-foreground">
                    {formatearFecha(pacienteDetalle.creado_en)}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-sm font-medium text-foreground">Casos</div>
                {pacienteDetalle.casos && pacienteDetalle.casos.length > 0 ? (
                  <div className="overflow-hidden rounded-panel border border-border">
                    <Table caption="Listado de casos del paciente">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pacienteDetalle.casos.map((caso) => (
                          <TableRow key={caso.id}>
                            <TableCell className="font-medium">{caso.codigo}</TableCell>
                            <TableCell>{formatearFecha(caso.creado_en)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <EmptyState
                    title="Sin casos registrados"
                    description="Este paciente aún no tiene casos asociados."
                  />
                )}
              </div>
            </>
          ) : null}
        </div>
      </Dialog>
    </section>
  );
}
