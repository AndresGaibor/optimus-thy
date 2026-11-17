import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../../design-system/components/atoms/Button';
import { Checkbox } from '../../design-system/components/atoms/Checkbox';
import { Input } from '../../design-system/components/atoms/Input';
import { Label } from '../../design-system/components/atoms/Label';
import { Select } from '../../design-system/components/atoms/Select';
import { Spinner } from '../../design-system/components/atoms/Spinner';
import { Callout } from '../../design-system/components/molecules/Callout';
import { EmptyState } from '../../design-system/components/molecules/EmptyState';
import { Field } from '../../design-system/components/molecules/Field';
import { PageHeader } from '../../design-system/components/molecules/PageHeader';
import { Pagination } from '../../design-system/components/molecules/Pagination';
import { Dialog, DialogClose } from '../../design-system/components/organisms/Dialog';
import {
  actualizarUsuario,
  crearUsuario,
  listarInstituciones,
  listarUsuarios,
  reemplazarRoles,
  type Institucion,
  type OrdenUsuarios,
  type Usuario,
} from '../../api/usuarios';
import { obtenerEtiquetaRol } from './etiquetas-rol';
import { useCambioEstadoUsuario } from './useCambioEstadoUsuario';
import { UsuariosFiltros } from './UsuariosFiltros';
import { UsuariosTabla } from './UsuariosTabla';
import { type BackendRole } from '../../session/roles';
import { useSession } from '../../session/SessionContext';

const ROLES_BACKEND = ['admin', 'doctor', 'researcher'] as const;

const LIMITE_POR_PAGINA = 25;

type RolBackend = BackendRole;
interface FormularioCrear {
  correo: string;
  nombre: string;
  institucion_id: string;
  roles: RolBackend[];
  password: string;
}

interface FormularioEditar {
  nombre: string;
  institucion_id: string;
}

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [filtroInstitucion, setFiltroInstitucion] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'' | 'activo' | 'inactivo'>('');
  const [orden, setOrden] = useState<OrdenUsuarios>('creado');
  const [direccion, setDireccion] = useState<'asc' | 'desc'>('asc');
  const [desplazamiento, setDesplazamiento] = useState(0);

  const [dialogoCrearAbierto, setDialogoCrearAbierto] = useState(false);
  const [formCrear, setFormCrear] = useState<FormularioCrear>({
    correo: '',
    nombre: '',
    institucion_id: '',
    roles: [],
    password: '',
  });
  const [erroresCrear, setErroresCrear] = useState<Record<string, string>>({});
  const [guardandoCrear, setGuardandoCrear] = useState(false);
  const [errorCrear, setErrorCrear] = useState<string | null>(null);

  const [dialogoEditarAbierto, setDialogoEditarAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [formEditar, setFormEditar] = useState<FormularioEditar>({
    nombre: '',
    institucion_id: '',
  });
  const [erroresEditar, setErroresEditar] = useState<Record<string, string>>({});
  const [guardandoEditar, setGuardandoEditar] = useState(false);
  const [errorEditar, setErrorEditar] = useState<string | null>(null);

  const { usuario: usuarioSesion } = useSession();

  const [dialogoRolesAbierto, setDialogoRolesAbierto] = useState(false);
  const [usuarioRoles, setUsuarioRoles] = useState<Usuario | null>(null);
  const [rolesSeleccion, setRolesSeleccion] = useState<RolBackend[]>([]);
  const [errorRoles, setErrorRoles] = useState<string | null>(null);
  const [guardandoRoles, setGuardandoRoles] = useState(false);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);
    const [resUsuarios, resInstituciones] = await Promise.all([
      listarUsuarios({
        q: busquedaAplicada || null,
        institucionId: filtroInstitucion || null,
        activo: filtroEstado === '' ? null : filtroEstado === 'activo',
        orden,
        direccion,
        limite: LIMITE_POR_PAGINA,
        desplazamiento,
      }),
      listarInstituciones(),
    ]);

    if (!resUsuarios.ok) {
      setError('No se pudieron cargar los usuarios. Reintenta la operación.');
      setUsuarios([]);
      setTotal(0);
      setCargando(false);
      return;
    }

    setUsuarios(resUsuarios.data.items || []);
    setTotal(resUsuarios.data.total || 0);

    if (resInstituciones.ok) {
      setInstituciones(Array.isArray(resInstituciones.data) ? resInstituciones.data : []);
    } else {
      setInstituciones([]);
    }

    setCargando(false);
  }, [busquedaAplicada, filtroInstitucion, filtroEstado, orden, direccion, desplazamiento]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const cambiarBusqueda = useCallback((valor: string) => {
    setBusqueda(valor);
  }, []);

  // Espera 300 ms para no pedir el listado en cada pulsación.
  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      setBusquedaAplicada(busqueda.trim());
      setDesplazamiento(0);
    }, 300);
    return () => window.clearTimeout(temporizador);
  }, [busqueda]);

  const cambiarFiltroInstitucion = useCallback((valor: string) => {
    setFiltroInstitucion(valor);
    setDesplazamiento(0);
  }, []);

  const cambiarFiltroEstado = useCallback((valor: '' | 'activo' | 'inactivo') => {
    setFiltroEstado(valor);
    setDesplazamiento(0);
  }, []);

  const cambiarOrden = useCallback(
    (campo: OrdenUsuarios) => {
      setDireccion(orden === campo && direccion === 'asc' ? 'desc' : 'asc');
      setOrden(campo);
      setDesplazamiento(0);
    },
    [orden, direccion],
  );

  const limpiarFiltros = useCallback(() => {
    setBusqueda('');
    setBusquedaAplicada('');
    setFiltroInstitucion('');
    setFiltroEstado('');
    setDesplazamiento(0);
  }, []);

  const abrirCrear = useCallback(() => {
    setFormCrear({
      correo: '',
      nombre: '',
      institucion_id: instituciones[0]?.id || '',
      roles: [],
      password: '',
    });
    setErroresCrear({});
    setErrorCrear(null);
    setDialogoCrearAbierto(true);
  }, [instituciones]);

  const toggleRolCrear = useCallback((rol: RolBackend) => {
    setFormCrear((anterior) => {
      const existe = anterior.roles.includes(rol);
      if (existe) {
        return { ...anterior, roles: anterior.roles.filter((r) => r !== rol) };
      }
      return { ...anterior, roles: [...anterior.roles, rol] };
    });
  }, []);

  const validarCrear = useCallback((): boolean => {
    const errores: Record<string, string> = {};
    if (!formCrear.correo.trim()) {
      errores.correo = 'El correo es obligatorio.';
    }
    if (!formCrear.institucion_id) {
      errores.institucion_id = 'La institución es obligatoria.';
    }
    if (formCrear.roles.length === 0) {
      errores.roles = 'Selecciona al menos un rol.';
    }
    if (formCrear.password.length < 12) {
      errores.password = 'La contraseña temporal debe tener al menos 12 caracteres.';
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
    const resultado = await crearUsuario({
      correo: formCrear.correo.trim(),
      nombre: formCrear.nombre.trim() === '' ? null : formCrear.nombre.trim(),
      institucionId: formCrear.institucion_id,
      roles: formCrear.roles,
      password: formCrear.password,
    });
    if (!resultado.ok) {
      if (resultado.status === 409) {
        setErrorCrear('Ya existe un usuario con ese correo electrónico.');
      } else if (resultado.status === 422) {
        setErrorCrear('Revisa los datos introducidos. Hay campos con errores.');
      } else {
        setErrorCrear('No se pudo crear el usuario. Reintenta la operación.');
      }
      setGuardandoCrear(false);
      return;
    }
    setGuardandoCrear(false);
    setDialogoCrearAbierto(false);
    setDesplazamiento(0);
    void cargarDatos();
  }, [validarCrear, formCrear, cargarDatos]);

  const abrirEditar = useCallback((usuario: Usuario) => {
    setUsuarioEditando(usuario);
    setFormEditar({
      nombre: usuario.nombre || '',
      institucion_id: usuario.institucion.id,
    });
    setErroresEditar({});
    setErrorEditar(null);
    setDialogoEditarAbierto(true);
  }, []);

  const validarEditar = useCallback((): boolean => {
    const errores: Record<string, string> = {};
    if (!formEditar.institucion_id) {
      errores.institucion_id = 'La institución es obligatoria.';
    }
    setErroresEditar(errores);
    return Object.keys(errores).length === 0;
  }, [formEditar]);

  const guardarEditar = useCallback(async () => {
    if (!usuarioEditando) {
      return;
    }
    if (!validarEditar()) {
      return;
    }
    setGuardandoEditar(true);
    setErrorEditar(null);
    const resultado = await actualizarUsuario(usuarioEditando.id, {
      nombre: formEditar.nombre.trim() === '' ? null : formEditar.nombre.trim(),
      institucionId: formEditar.institucion_id,
    });
    if (!resultado.ok) {
      if (resultado.status === 422) {
        setErrorEditar('Revisa los datos introducidos. Hay campos con errores.');
      } else {
        setErrorEditar('No se pudo actualizar el usuario. Reintenta la operación.');
      }
      setGuardandoEditar(false);
      return;
    }
    setGuardandoEditar(false);
    setDialogoEditarAbierto(false);
    void cargarDatos();
  }, [usuarioEditando, validarEditar, formEditar, cargarDatos]);

  const abrirRoles = useCallback((usuario: Usuario) => {
    setUsuarioRoles(usuario);
    setRolesSeleccion(
      (usuario.roles || []).filter((rol): rol is RolBackend =>
        (ROLES_BACKEND as readonly string[]).includes(rol),
      ),
    );
    setErrorRoles(null);
    setDialogoRolesAbierto(true);
  }, []);

  const alternarRolSeleccion = useCallback((rol: RolBackend) => {
    setRolesSeleccion((anteriores) =>
      anteriores.includes(rol) ? anteriores.filter((r) => r !== rol) : [...anteriores, rol],
    );
    setErrorRoles(null);
  }, []);

  const guardarRoles = useCallback(async () => {
    if (!usuarioRoles) {
      return;
    }
    if (rolesSeleccion.length === 0) {
      setErrorRoles('Asigna al menos un rol.');
      return;
    }
    setGuardandoRoles(true);
    setErrorRoles(null);
    const resultado = await reemplazarRoles(usuarioRoles.id, rolesSeleccion);
    if (!resultado.ok) {
      setErrorRoles(
        resultado.status === 409
          ? 'El sistema requiere al menos un administrador activo. Asigna el rol a otra cuenta antes de quitarlo aquí.'
          : resultado.status === 422
            ? 'Revisa los roles seleccionados.'
            : 'No se pudieron guardar los roles. Reintenta la operación.',
      );
      setGuardandoRoles(false);
      return;
    }
    setGuardandoRoles(false);
    setDialogoRolesAbierto(false);
    setUsuarioRoles(null);
    void cargarDatos();
  }, [usuarioRoles, rolesSeleccion, cargarDatos]);

  const estado = useCambioEstadoUsuario(cargarDatos);

  const hayFiltrosActivos = busqueda !== '' || filtroInstitucion !== '' || filtroEstado !== '';

  const contenido = useMemo(() => {
    if (cargando) {
      return (
        <div className="flex items-center justify-center py-12">
          <Spinner aria-label="Cargando usuarios" />
        </div>
      );
    }

    if (error) {
      return (
        <Callout tone="danger" title="Error">
          <div className="flex flex-col gap-3">
            <p>{error}</p>
            <div>
              <Button variant="secondary" size="sm" onClick={() => void cargarDatos()}>
                Reintentar
              </Button>
            </div>
          </div>
        </Callout>
      );
    }

    if (usuarios.length === 0) {
      return (
        <EmptyState
          as="h2"
          title={hayFiltrosActivos ? 'Sin resultados' : 'Sin usuarios'}
          description={
            hayFiltrosActivos
              ? 'Ningún usuario coincide con los filtros aplicados.'
              : 'Todavía no hay usuarios registrados.'
          }
          {...(hayFiltrosActivos
            ? {
                action: (
                  <Button variant="secondary" size="sm" onClick={limpiarFiltros}>
                    Limpiar filtros
                  </Button>
                ),
              }
            : {})}
        />
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <UsuariosTabla
          usuarios={usuarios}
          orden={orden}
          direccion={direccion}
          onOrden={cambiarOrden}
          onCambiarEstado={estado.solicitar}
          onEditar={abrirEditar}
          onRoles={abrirRoles}
          errorEstado={estado.error}
          avisoEstado={estado.aviso}
          correoSesion={usuarioSesion?.correo}
          cambiandoEstadoId={estado.enCursoId}
        />

        <Pagination
          total={total}
          limit={LIMITE_POR_PAGINA}
          offset={desplazamiento}
          onOffsetChange={setDesplazamiento}
          itemLabel="usuario"
        />
      </div>
    );
  }, [
    cargando,
    error,
    estado.error,
    estado.aviso,
    estado.enCursoId,
    estado.solicitar,
    usuarioSesion?.correo,
    hayFiltrosActivos,
    limpiarFiltros,
    usuarios,
    orden,
    direccion,
    cambiarOrden,
    total,
    desplazamiento,
    cargarDatos,
    abrirEditar,
    abrirRoles,
  ]);

  return (
    <section className="mx-auto w-full max-w-(--content-max-width) space-y-6 px-4 py-6">
      <PageHeader
        title="Usuarios"
        description="Gestión de usuarios, roles y asignación de institución."
        actions={<Button onClick={abrirCrear}>Nuevo usuario</Button>}
      />

      <div className="space-y-4">
        <UsuariosFiltros
          busqueda={busqueda}
          onBusqueda={cambiarBusqueda}
          filtroEstado={filtroEstado}
          onEstado={cambiarFiltroEstado}
          filtroInstitucion={filtroInstitucion}
          onInstitucion={cambiarFiltroInstitucion}
          instituciones={Array.isArray(instituciones) ? instituciones : []}
          hayFiltrosActivos={hayFiltrosActivos}
          onLimpiar={limpiarFiltros}
        />

        {contenido}
      </div>

      <Dialog
        open={dialogoCrearAbierto}
        onOpenChange={setDialogoCrearAbierto}
        title="Nuevo usuario"
        description="Crear un usuario con rol e institución."
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button onClick={() => void guardarCrear()} disabled={guardandoCrear}>
              {guardandoCrear ? 'Guardando...' : 'Crear'}
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
          <Field label="Correo" required error={erroresCrear.correo}>
            <Input
              value={formCrear.correo}
              onChange={(evento) => setFormCrear((a) => ({ ...a, correo: evento.target.value }))}
            />
          </Field>
          <Field label="Nombre">
            <Input
              value={formCrear.nombre}
              onChange={(evento) => setFormCrear((a) => ({ ...a, nombre: evento.target.value }))}
            />
          </Field>
          <Field label="Institución" required error={erroresCrear.institucion_id}>
            <Select
              value={formCrear.institucion_id}
              onChange={(evento) =>
                setFormCrear((a) => ({ ...a, institucion_id: evento.target.value }))
              }
            >
              <option value="">Selecciona una institución</option>
              {(Array.isArray(instituciones) ? instituciones : []).map((institucion) => (
                <option key={institucion.id} value={institucion.id}>
                  {institucion.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex flex-col gap-2">
            <Label requiredMark>Roles</Label>
            <div className="flex flex-col gap-2">
              {ROLES_BACKEND.map((rol) => (
                <label key={rol} className="flex items-center gap-2">
                  <Checkbox
                    checked={formCrear.roles.includes(rol)}
                    onChange={() => toggleRolCrear(rol)}
                  />
                  <span className="text-sm text-foreground">{obtenerEtiquetaRol(rol)}</span>
                </label>
              ))}
            </div>
            {erroresCrear.roles ? (
              <p className="text-sm font-medium text-danger">{erroresCrear.roles}</p>
            ) : null}
          </div>
          <Field label="Contraseña temporal" required error={erroresCrear.password}>
            <Input
              type="password"
              value={formCrear.password}
              onChange={(evento) => setFormCrear((a) => ({ ...a, password: evento.target.value }))}
            />
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={dialogoEditarAbierto}
        onOpenChange={setDialogoEditarAbierto}
        title="Editar usuario"
        description="Modificar los datos del usuario."
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button onClick={() => void guardarEditar()} disabled={guardandoEditar}>
              {guardandoEditar ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {errorEditar ? (
            <Callout tone="danger" role="alert">
              {errorEditar}
            </Callout>
          ) : null}
          <Field label="Nombre">
            <Input
              value={formEditar.nombre}
              onChange={(evento) => setFormEditar((a) => ({ ...a, nombre: evento.target.value }))}
            />
          </Field>
          <Field label="Institución" required error={erroresEditar.institucion_id}>
            <Select
              value={formEditar.institucion_id}
              onChange={(evento) =>
                setFormEditar((a) => ({ ...a, institucion_id: evento.target.value }))
              }
            >
              <option value="">Selecciona una institución</option>
              {(Array.isArray(instituciones) ? instituciones : []).map((institucion) => (
                <option key={institucion.id} value={institucion.id}>
                  {institucion.nombre}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={dialogoRolesAbierto}
        onOpenChange={setDialogoRolesAbierto}
        title="Roles del usuario"
        description="Un usuario puede tener varios roles; el rol activo se elige al entrar."
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button onClick={() => void guardarRoles()} disabled={guardandoRoles}>
              {guardandoRoles ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-foreground">{usuarioRoles?.correo}</p>
          {errorRoles ? (
            <Callout tone="danger" role="alert">
              {errorRoles}
            </Callout>
          ) : null}
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-foreground">Roles asignados</legend>
            {ROLES_BACKEND.map((rol) => (
              <label key={rol} className="flex items-center gap-2">
                <Checkbox
                  checked={rolesSeleccion.includes(rol)}
                  onChange={() => alternarRolSeleccion(rol)}
                />
                <span className="text-sm text-foreground">{obtenerEtiquetaRol(rol)}</span>
              </label>
            ))}
          </fieldset>
          <p className="text-sm text-muted-foreground">
            Sin otro rol asignado, el usuario administrador no ve datos clínicos.
          </p>
        </div>
      </Dialog>

      <Dialog
        open={estado.dialogoAbierto}
        onOpenChange={estado.setDialogoAbierto}
        title="Desactivar usuario"
        description="Al desactivar el usuario se conservará su historial y no podrá iniciar sesión."
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => void estado.confirmar()}
              disabled={estado.confirmando}
            >
              {estado.confirmando ? 'Desactivando...' : 'Desactivar'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-foreground">
          ¿Confirmas desactivar a {estado.pendiente?.correo}?
        </p>
      </Dialog>
    </section>
  );
}
