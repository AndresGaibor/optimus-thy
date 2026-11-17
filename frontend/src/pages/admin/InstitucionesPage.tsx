import { useCallback, useEffect, useState } from 'react';
import { Button, Callout, EmptyState, PageHeader, Spinner } from '../../design-system';
import {
  actualizarInstitucion,
  crearInstitucion,
  listarInstitucionesAdmin,
  type InstitucionAdmin,
} from '../../api/instituciones';
import { InstitucionDesactivarDialog } from './InstitucionDesactivarDialog';
import {
  InstitucionFormularioDialog,
  type FormularioInstitucion,
} from './InstitucionFormularioDialog';
import { InstitucionesTabla } from './InstitucionesTabla';
import { mensajeDelServidor } from './mensajeDelServidor';

const FORMULARIO_VACIO: FormularioInstitucion = { nombre: '', codigo: '' };

export function InstitucionesPage() {
  const [instituciones, setInstituciones] = useState<InstitucionAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [errorOperacion, setErrorOperacion] = useState<string | null>(null);
  const [aviso, setAviso] = useState('');

  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [editando, setEditando] = useState<InstitucionAdmin | null>(null);
  const [formulario, setFormulario] = useState<FormularioInstitucion>(FORMULARIO_VACIO);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [porDesactivar, setPorDesactivar] = useState<InstitucionAdmin | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    const resultado = await listarInstitucionesAdmin();
    setCargando(false);
    if (!resultado.ok) {
      setErrorCarga('No se pudieron cargar las instituciones. Reintenta la operación.');
      return;
    }
    setInstituciones(resultado.data);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const abrirCrear = useCallback(() => {
    setEditando(null);
    setFormulario(FORMULARIO_VACIO);
    setErrores({});
    setErrorFormulario(null);
    setDialogoAbierto(true);
  }, []);

  const abrirEditar = useCallback((institucion: InstitucionAdmin) => {
    setEditando(institucion);
    setFormulario({ nombre: institucion.nombre, codigo: institucion.codigo });
    setErrores({});
    setErrorFormulario(null);
    setDialogoAbierto(true);
  }, []);

  const guardar = useCallback(async () => {
    const nombre = formulario.nombre.trim();
    const codigo = formulario.codigo.trim();
    const nuevosErrores: Record<string, string> = {};
    if (nombre === '') nuevosErrores.nombre = 'El nombre es obligatorio.';
    if (codigo === '') nuevosErrores.codigo = 'El código es obligatorio.';
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    setGuardando(true);
    setErrorFormulario(null);
    const resultado = editando
      ? await actualizarInstitucion(editando.id, { nombre, codigo })
      : await crearInstitucion({ nombre, codigo });
    setGuardando(false);

    if (!resultado.ok) {
      setErrorFormulario(
        mensajeDelServidor(resultado.error) ??
          (resultado.status === 409
            ? 'Ya existe una institución con ese código.'
            : 'No se pudo guardar la institución. Reintenta la operación.'),
      );
      return;
    }

    setDialogoAbierto(false);
    setAviso(`Institución ${nombre} ${editando ? 'actualizada' : 'creada'}.`);
    void cargar();
  }, [formulario, editando, cargar]);

  const cambiarEstado = useCallback(
    async (institucion: InstitucionAdmin, activa: boolean) => {
      setErrorOperacion(null);
      const resultado = await actualizarInstitucion(institucion.id, { activa });
      if (!resultado.ok) {
        setErrorOperacion(
          mensajeDelServidor(resultado.error) ??
            'No se pudo cambiar la institución. Reintenta la operación.',
        );
        return;
      }
      setAviso(`Institución ${institucion.nombre} ${activa ? 'activada' : 'desactivada'}.`);
      void cargar();
    },
    [cargar],
  );

  const confirmarDesactivacion = useCallback(async () => {
    if (!porDesactivar) return;
    const objetivo = porDesactivar;
    setPorDesactivar(null);
    await cambiarEstado(objetivo, false);
  }, [porDesactivar, cambiarEstado]);

  return (
    <section className="mx-auto w-full max-w-(--content-max-width) space-y-6 px-4 py-6">
      <PageHeader
        title="Instituciones"
        description="Administra las instituciones y sus asignaciones de usuarios."
        actions={<Button onClick={abrirCrear}>Nueva institución</Button>}
      />

      <p role="status" className="sr-only">
        {aviso}
      </p>

      {errorOperacion ? (
        <Callout tone="danger" role="alert">
          <p>{errorOperacion}</p>
        </Callout>
      ) : null}

      {cargando ? (
        <div className="flex items-center justify-center py-12">
          <Spinner aria-label="Cargando instituciones" />
        </div>
      ) : null}

      {!cargando && errorCarga ? (
        <Callout tone="danger" title="Error">
          <div className="flex flex-col gap-3">
            <p>{errorCarga}</p>
            <div>
              <Button variant="secondary" size="sm" onClick={() => void cargar()}>
                Reintentar
              </Button>
            </div>
          </div>
        </Callout>
      ) : null}

      {!cargando && !errorCarga && instituciones.length === 0 ? (
        <EmptyState
          as="h2"
          title="Sin instituciones"
          description="Todavía no hay instituciones registradas."
          action={
            <Button variant="secondary" size="sm" onClick={abrirCrear}>
              Nueva institución
            </Button>
          }
        />
      ) : null}

      {!cargando && !errorCarga && instituciones.length > 0 ? (
        <div className="flex flex-col gap-3">
          <InstitucionesTabla
            instituciones={instituciones}
            onEditar={abrirEditar}
            onActivar={(institucion) => void cambiarEstado(institucion, true)}
            onSolicitarDesactivar={setPorDesactivar}
          />
          <p className="text-sm text-muted-foreground">
            {`Mostrando ${instituciones.length} de ${instituciones.length} ${
              instituciones.length === 1 ? 'institución' : 'instituciones'
            }`}
          </p>
        </div>
      ) : null}

      <InstitucionFormularioDialog
        abierto={dialogoAbierto}
        onAbiertoChange={setDialogoAbierto}
        editando={editando}
        formulario={formulario}
        onFormulario={setFormulario}
        errores={errores}
        errorFormulario={errorFormulario}
        guardando={guardando}
        onGuardar={() => void guardar()}
      />

      <InstitucionDesactivarDialog
        abierto={porDesactivar !== null}
        onAbiertoChange={(abierto) => {
          if (!abierto) setPorDesactivar(null);
        }}
        codigo={porDesactivar?.codigo}
        onConfirmar={() => void confirmarDesactivacion()}
      />
    </section>
  );
}
