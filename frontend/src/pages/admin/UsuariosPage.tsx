import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../../design-system/components/atoms/Button';
import { Checkbox } from '../../design-system/components/atoms/Checkbox';
import { Input } from '../../design-system/components/atoms/Input';
import { Label } from '../../design-system/components/atoms/Label';
import { Select } from '../../design-system/components/atoms/Select';
import { Spinner } from '../../design-system/components/atoms/Spinner';
import { Switch } from '../../design-system/components/atoms/Switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../design-system/components/atoms/Table';
import { Badge } from '../../design-system/components/atoms/Badge';
import { Callout } from '../../design-system/components/molecules/Callout';
import { EmptyState } from '../../design-system/components/molecules/EmptyState';
import { Field } from '../../design-system/components/molecules/Field';
import { FilterBar } from '../../design-system/components/molecules/FilterBar';
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
  type Usuario,
} from '../../api/usuarios';
import { mapBackendRoleToUi, ROLE_LABEL, type BackendRole } from '../../session/roles';

const ROLES_BACKEND = ['admin', 'doctor', 'researcher'] as const;

const LIMITE_POR_PAGINA = 25;

function obtenerEtiquetaRol(rol: string): string {
  const rolUi = mapBackendRoleToUi(rol);
  return rolUi ? ROLE_LABEL[rolUi] : rol;
}
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
  const [filtroInstitucion, setFiltroInstitucion] = useState('');
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

  const [dialogoConfirmarActivo, setDialogoConfirmarActivo] = useState(false);
  const [usuarioParaCambiarEstado, setUsuarioParaCambiarEstado] = useState<Usuario | null>(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

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
        q: busqueda || null,
        institucionId: filtroInstitucion || null,
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
  }, [busqueda, filtroInstitucion, desplazamiento]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const cambiarBusqueda = useCallback((valor: string) => {
    setBusqueda(valor);
    setDesplazamiento(0);
  }, []);

  const cambiarFiltroInstitucion = useCallback((valor: string) => {
    setFiltroInstitucion(valor);
    setDesplazamiento(0);
  }, []);

  const limpiarFiltros = useCallback(() => {
    setBusqueda('');
    setFiltroInstitucion('');
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
        resultado.status === 422
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

  const solicitarCambioEstado = useCallback((usuario: Usuario) => {
    setUsuarioParaCambiarEstado(usuario);
    setDialogoConfirmarActivo(true);
  }, []);

  const confirmarCambioEstado = useCallback(async () => {
    if (!usuarioParaCambiarEstado) {
      return;
    }
    setCambiandoEstado(true);
    const nuevoEstado = !usuarioParaCambiarEstado.activo;
    const resultado = await actualizarUsuario(usuarioParaCambiarEstado.id, {
      activo: nuevoEstado,
    });
    if (!resultado.ok) {
      setCambiandoEstado(false);
      setDialogoConfirmarActivo(false);
      setError('No se pudo cambiar el estado del usuario. Reintenta la operación.');
      return;
    }
    setCambiandoEstado(false);
    setDialogoConfirmarActivo(false);
    setUsuarioParaCambiarEstado(null);
    void cargarDatos();
  }, [usuarioParaCambiarEstado, cargarDatos]);

  const hayFiltrosActivos = busqueda !== '' || filtroInstitucion !== '';

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
          title="Sin usuarios"
          description="No hay usuarios que coincidan con los filtros aplicados."
        />
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <Table caption="Listado de usuarios">
          <TableHeader>
            <TableRow>
              <TableHead>Correo</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Institución</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell>{usuario.correo}</TableCell>
                <TableCell>{usuario.nombre || '-'}</TableCell>
                <TableCell>{usuario.institucion?.nombre || '-'}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(usuario.roles || []).map((rol) => (
                      <Badge key={rol} tone="neutral">
                        {obtenerEtiquetaRol(rol)}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={usuario.activo}
                      onCheckedChange={() => solicitarCambioEstado(usuario)}
                      aria-label={usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}
                    />
                    <span className="text-sm text-muted-foreground">
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => abrirEditar(usuario)}>
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => abrirRoles(usuario)}>
                      Roles
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

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
    usuarios,
    total,
    desplazamiento,
    cargarDatos,
    solicitarCambioEstado,
    abrirEditar,
    abrirRoles,
  ]);

  return (
    <section className="mx-auto w-full max-w-(--content-max-width) space-y-6 px-4 py-6">
      <PageHeader
        title="Usuarios"
        description="Gestión de usuarios, roles e instituciones."
        actions={<Button onClick={abrirCrear}>Nuevo usuario</Button>}
      />

      <FilterBar
        label="Filtros de usuarios"
        {...(hayFiltrosActivos ? { onReset: limpiarFiltros } : {})}
      >
        {/* ui-excepcion: ancho mínimo de filtros sin refactor de FilterBar */}
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[16rem]">
          <Label htmlFor="filtro-busqueda">Buscar por correo o nombre</Label>
          <Input
            id="filtro-busqueda"
            value={busqueda}
            onChange={(evento) => cambiarBusqueda(evento.target.value)}
            placeholder="Buscar..."
          />
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[16rem]">
          <Label htmlFor="filtro-institucion">Institución</Label>
          <Select
            id="filtro-institucion"
            value={filtroInstitucion}
            onChange={(evento) => cambiarFiltroInstitucion(evento.target.value)}
          >
            <option value="">Todas las instituciones</option>
            {(Array.isArray(instituciones) ? instituciones : []).map((institucion) => (
              <option key={institucion.id} value={institucion.id}>
                {institucion.nombre}
              </option>
            ))}
          </Select>
        </div>
      </FilterBar>

      {contenido}

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
        open={dialogoConfirmarActivo}
        onOpenChange={setDialogoConfirmarActivo}
        title={usuarioParaCambiarEstado?.activo ? 'Desactivar usuario' : 'Activar usuario'}
        description={
          usuarioParaCambiarEstado?.activo
            ? 'Al desactivar el usuario se conservará su historial.'
            : 'Se activará el usuario para acceder al sistema.'
        }
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button onClick={() => void confirmarCambioEstado()} disabled={cambiandoEstado}>
              {cambiandoEstado ? 'Guardando...' : 'Confirmar'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-foreground">
          ¿Confirmas el cambio de estado de {usuarioParaCambiarEstado?.correo}?
        </p>
      </Dialog>
    </section>
  );
}
