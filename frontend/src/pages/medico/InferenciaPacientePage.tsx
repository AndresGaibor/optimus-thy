import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Callout,
  ConfidenceBadge,
  Dialog,
  DialogClose,
  EmptyState,
  Field,
  FileDropzone,
  PageHeader,
  Select,
  Spinner,
  SupportNotice,
} from '../../design-system';
import { listarConsentimientos, type Consentimiento } from '../../api/consentimientos';
import { listarImagenes, subirImagen, type ImagenCaso } from '../../api/imagenes';
import {
  listarPacientes,
  obtenerPaciente,
  type Paciente,
  type PacienteDetalle,
} from '../../api/pacientes';
import { listarResultados, type Inferencia } from '../../api/resultados';
import { consultarTrabajo, encolarInferencia } from '../../api/trabajos';
import { GaleriaImagenes } from './GaleriaImagenes';
import { ResultadoInferencia } from './ResultadoInferencia';

const INTERVALO_MS = 3000;
const TAMANO_MAXIMO_BYTES = 15 * 1024 * 1024;
const FORMATO_FECHA = new Intl.DateTimeFormat('es-EC', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function fecha(iso: string): string {
  const valor = new Date(iso);
  return Number.isNaN(valor.getTime()) ? iso : FORMATO_FECHA.format(valor);
}

function esImagenAceptada(archivo: File): boolean {
  const nombre = archivo.name.toLowerCase();
  return (
    archivo.type === 'image/png' ||
    archivo.type === 'image/jpeg' ||
    nombre.endsWith('.png') ||
    nombre.endsWith('.jpg') ||
    nombre.endsWith('.jpeg')
  );
}

/**
 * Entrada a la inferencia cuando la URL no trae paciente: elige uno y abre su caso.
 *
 * ## Cuándo usarlo
 * En `/medico/inferencia`, como puerta de entrada a la inferencia por paciente.
 * ## Cuándo no usarlo
 * No lo uses dentro de una pantalla que ya tiene un paciente seleccionado.
 * ## Anatomía
 * Encabezado, aviso de apoyo, selector de paciente y acción para continuar.
 * ## Accesibilidad
 * El selector va asociado a su etiqueta mediante `Field`; el error es `role="alert"` y la carga se anuncia con `Spinner` etiquetado.
 * ## Responsive
 * El formulario se limita a un ancho de lectura y fluye sin breakpoints; las acciones se envuelven en pantallas estrechas.
 */
function SelectorPaciente() {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [seleccionado, setSeleccionado] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    const resultado = await listarPacientes({ limite: 100 });
    if (!resultado.ok) {
      setPacientes([]);
      setError('No se pudieron cargar los pacientes. Reintenta la operación.');
      setCargando(false);
      return;
    }
    setPacientes(resultado.data.items);
    const primero = resultado.data.items[0]?.id ?? '';
    setSeleccionado((actual) =>
      resultado.data.items.some((paciente) => paciente.id === actual) ? actual : primero,
    );
    setCargando(false);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (cargando) {
    return (
      <section className="mx-auto w-full max-w-(--content-max-width) px-4 py-6">
        <Spinner size="lg" label="Cargando pacientes" />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-(--content-max-width) space-y-6 px-4 py-6">
      <PageHeader
        title="Inferencia de IA"
        description="Elige un paciente para revisar las ecografías de su caso más reciente."
        actions={
          <Button asChild variant="outline">
            <Link to="/medico/pacientes">Ver pacientes</Link>
          </Button>
        }
      />
      <SupportNotice context="inferencia" />
      {error ? (
        <Callout tone="danger" title="No se pudieron cargar los pacientes" role="alert">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button variant="secondary" size="sm" onClick={() => void cargar()}>
              Reintentar
            </Button>
          </div>
        </Callout>
      ) : pacientes.length === 0 ? (
        <EmptyState
          title="Todavía no hay pacientes"
          description="Registra un paciente y su caso para poder analizar ecografías."
          action={
            <Button asChild>
              <Link to="/medico/pacientes">Ir a pacientes</Link>
            </Button>
          }
        />
      ) : (
        <div className="flex max-w-xl flex-col gap-4">
          <Field label="Paciente" hint="Se abre el caso más reciente del paciente.">
            <Select
              value={seleccionado}
              onChange={(evento) => setSeleccionado(evento.currentTarget.value)}
            >
              {pacientes.map((paciente) => (
                <option key={paciente.id} value={paciente.id}>
                  {paciente.codigo} ·{' '}
                  {paciente.total_casos === 1 ? '1 caso' : `${paciente.total_casos} casos`}
                </option>
              ))}
            </Select>
          </Field>
          <div>
            <Button
              onClick={() => navigate(`/medico/pacientes/${seleccionado}/inferencia`)}
              disabled={seleccionado === ''}
            >
              Continuar
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * Pantalla de inferencia de un paciente: ecografías, ejecución en cola y resultados.
 *
 * ## Cuándo usarlo
 * En `/medico/pacientes/:id/inferencia` para revisar el caso del paciente y solicitar la inferencia.
 * ## Cuándo no usarlo
 * No lo uses para gestionar consentimientos ni para el historial global de resultados.
 * ## Anatomía
 * Encabezado del paciente, aviso de apoyo, selector de caso, galería de ecografías, resultados y diálogo de carga.
 * ## Accesibilidad
 * Los estados se anuncian con `role="status"` o `role="alert"`; los botones y el selector conservan foco y teclado; el aviso de apoyo es una nota permanente.
 * ## Responsive
 * Galería y acciones se apilan en pantallas estrechas y se distribuyen en rejilla desde `sm`; el contenido respeta el ancho máximo de lectura.
 */
function InferenciaDePaciente({ pacienteId }: { pacienteId: string }) {
  const [paciente, setPaciente] = useState<PacienteDetalle | null>(null);
  const [cargandoPaciente, setCargandoPaciente] = useState(true);
  const [errorPaciente, setErrorPaciente] = useState<string | null>(null);
  const [casoId, setCasoId] = useState('');
  const [imagenes, setImagenes] = useState<ImagenCaso[]>([]);
  const [resultados, setResultados] = useState<Inferencia[]>([]);
  const [consentimientos, setConsentimientos] = useState<Consentimiento[]>([]);
  const [cargandoCaso, setCargandoCaso] = useState(false);
  const [errorCaso, setErrorCaso] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [subidaAbierta, setSubidaAbierta] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [errorSubida, setErrorSubida] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [analizando, setAnalizando] = useState<string | null>(null);
  const [errorAnalisis, setErrorAnalisis] = useState<string | null>(null);
  const [imagenReintento, setImagenReintento] = useState<ImagenCaso | null>(null);
  const intervalo = useRef<number | null>(null);
  const solicitudPaciente = useRef(0);
  const solicitudCaso = useRef(0);
  const casoActual = useRef('');

  const detener = useCallback(() => {
    if (intervalo.current !== null) {
      window.clearInterval(intervalo.current);
      intervalo.current = null;
    }
  }, []);

  const cargarPaciente = useCallback(async () => {
    const solicitud = solicitudPaciente.current + 1;
    solicitudPaciente.current = solicitud;
    setCargandoPaciente(true);
    setErrorPaciente(null);
    const resultado = await obtenerPaciente(pacienteId);
    if (solicitud !== solicitudPaciente.current) return;
    if (!resultado.ok) {
      setPaciente(null);
      setCasoId('');
      let mensaje = 'No se pudo cargar el paciente. Reintenta la operación.';
      if (resultado.status === 404) {
        mensaje = 'No se encontró el paciente o no pertenece a tu institución.';
      } else if (resultado.status === 403) {
        mensaje = 'Tu rol no permite consultar este paciente.';
      }
      setErrorPaciente(mensaje);
      setCargandoPaciente(false);
      return;
    }
    setPaciente(resultado.data);
    setCasoId((actual) => {
      if (actual !== '' && resultado.data.casos.some((caso) => caso.id === actual)) {
        return actual;
      }
      return resultado.data.casos[resultado.data.casos.length - 1]?.id ?? '';
    });
    setCargandoPaciente(false);
  }, [pacienteId]);

  useEffect(() => {
    void cargarPaciente();
  }, [cargarPaciente]);

  const cargarCaso = useCallback(async (caso: string) => {
    const solicitud = solicitudCaso.current + 1;
    solicitudCaso.current = solicitud;
    if (caso === '') {
      setImagenes([]);
      setResultados([]);
      setConsentimientos([]);
      setCargandoCaso(false);
      setErrorCaso(null);
      return;
    }
    setCargandoCaso(true);
    setErrorCaso(null);
    try {
      const [imagenesDelCaso, resultadosDelCaso, consentimientosDelCaso] = await Promise.all([
        listarImagenes(caso),
        listarResultados(caso),
        listarConsentimientos(caso),
      ]);
      if (solicitud !== solicitudCaso.current) return;
      setImagenes(imagenesDelCaso);
      setResultados(resultadosDelCaso);
      setConsentimientos(consentimientosDelCaso);
    } catch {
      if (solicitud !== solicitudCaso.current) return;
      setImagenes([]);
      setResultados([]);
      setConsentimientos([]);
      setAviso(null);
      setErrorCaso('No se pudo cargar el caso. Reintenta la operación.');
    } finally {
      if (solicitud === solicitudCaso.current) {
        setCargandoCaso(false);
      }
    }
  }, []);

  useEffect(() => {
    detener();
    casoActual.current = casoId;
    setAnalizando(null);
    setErrorAnalisis(null);
    setImagenReintento(null);
    setAviso(null);
    void cargarCaso(casoId);
    return () => {
      detener();
      casoActual.current = '';
    };
  }, [casoId, cargarCaso, detener]);

  const subir = async () => {
    if (archivo === null || casoId === '') return;
    setGuardando(true);
    setErrorSubida(null);
    try {
      await subirImagen(casoId, archivo);
      setSubidaAbierta(false);
      setArchivo(null);
      setErrorAnalisis(null);
      setImagenReintento(null);
      setAviso('Ecografía cargada y saneada.');
      await cargarCaso(casoId);
    } catch {
      setErrorSubida(
        'No se pudo subir la ecografía. Comprueba que sea PNG o JPEG de hasta 15 MB y que tu rol permita cargarla.',
      );
    } finally {
      setGuardando(false);
    }
  };

  function abrirSubida() {
    setArchivo(null);
    setErrorSubida(null);
    setSubidaAbierta(true);
  }

  function elegirArchivo(files: File[]) {
    const seleccionado = files[0];
    if (seleccionado === undefined) return;
    if (!esImagenAceptada(seleccionado)) {
      setArchivo(null);
      setErrorSubida('Selecciona una imagen PNG o JPEG.');
      return;
    }
    if (seleccionado.size > TAMANO_MAXIMO_BYTES) {
      setArchivo(null);
      setErrorSubida('La imagen supera los 15 MB. Reduce su tamaño antes de subirla.');
      return;
    }
    setArchivo(seleccionado);
    setErrorSubida(null);
  }

  const esperar = useCallback(
    (trabajoId: string, casoDelTrabajo: string) => {
      detener();
      intervalo.current = window.setInterval(() => {
        void (async () => {
          if (casoActual.current !== casoDelTrabajo) {
            detener();
            return;
          }
          try {
            const trabajo = await consultarTrabajo(trabajoId);
            if (casoActual.current !== casoDelTrabajo) {
              detener();
              return;
            }
            if (trabajo.estado === 'completado') {
              detener();
              setAnalizando(null);
              setAviso('Inferencia completada.');
              await cargarCaso(casoDelTrabajo);
            } else if (trabajo.estado === 'error') {
              detener();
              setAnalizando(null);
              setAviso(null);
              setErrorAnalisis(
                'La inferencia falló. Revisa el estado del servicio de IA e inténtalo de nuevo.',
              );
            }
          } catch {
            detener();
            setAnalizando(null);
            setAviso(null);
            setErrorAnalisis('No se pudo consultar el trabajo de inferencia.');
          }
        })();
      }, INTERVALO_MS);
    },
    [cargarCaso, detener],
  );

  const analizar = async (imagen: ImagenCaso) => {
    if (casoId === '') return;
    setAnalizando(imagen.id);
    setErrorAnalisis(null);
    setImagenReintento(imagen);
    setAviso('Inferencia en cola…');
    try {
      const trabajo = await encolarInferencia(imagen.id);
      esperar(trabajo.id, casoId);
    } catch {
      setAnalizando(null);
      setAviso(null);
      setErrorAnalisis(
        'No se pudo encolar la inferencia. Comprueba que el caso tenga consentimiento vigente, que la imagen siga disponible y que tu rol permita ejecutarla.',
      );
    }
  };

  const casos = paciente?.casos ?? [];
  const casoSeleccionado = casos.find((caso) => caso.id === casoId) ?? casos[0] ?? null;
  const tieneConsentimiento = consentimientos.some(
    (consentimiento) => consentimiento.vigente && consentimiento.base_legal === 'atencion_de_salud',
  );

  if (cargandoPaciente) {
    return (
      <section className="mx-auto w-full max-w-(--content-max-width) px-4 py-6">
        <Spinner size="lg" label="Cargando el paciente" />
      </section>
    );
  }

  if (paciente === null) {
    return (
      <section className="mx-auto w-full max-w-(--content-max-width) space-y-6 px-4 py-6">
        <PageHeader
          title="Inferencia del paciente"
          description="Revisa las ecografías del caso y el resultado de la inferencia."
        />
        <Callout tone="danger" title="No se pudo cargar el paciente" role="alert">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{errorPaciente ?? 'No se pudo cargar el paciente.'}</span>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => void cargarPaciente()}>
                Reintentar
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/medico/pacientes">Volver a pacientes</Link>
              </Button>
            </div>
          </div>
        </Callout>
      </section>
    );
  }

  if (casos.length === 0) {
    return (
      <section className="mx-auto w-full max-w-(--content-max-width) space-y-6 px-4 py-6">
        <PageHeader
          title="Inferencia del paciente"
          eyebrow={`Paciente ${paciente.codigo}`}
          description="Revisa las ecografías del caso y el resultado de la inferencia."
          actions={
            <Button asChild variant="outline">
              <Link to="/medico/pacientes">Volver a pacientes</Link>
            </Button>
          }
        />
        <SupportNotice context="inferencia" />
        <EmptyState
          title="Sin casos registrados"
          description="Este paciente aún no tiene un caso con ecografías para analizar."
        />
      </section>
    );
  }

  if (casoSeleccionado === null) {
    return (
      <section className="mx-auto w-full max-w-(--content-max-width) px-4 py-6">
        <Spinner size="lg" label="Seleccionando el caso" />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-(--content-max-width) space-y-6 px-4 py-6">
      <PageHeader
        title="Inferencia del paciente"
        eyebrow={`Paciente ${paciente.codigo}`}
        description={`Caso ${casoSeleccionado.codigo} · ${fecha(casoSeleccionado.creado_en)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to={`/medico/casos/${casoSeleccionado.id}`}>Abrir el caso</Link>
            </Button>
            <Button onClick={abrirSubida} disabled={cargandoCaso || errorCaso !== null}>
              Subir ecografía
            </Button>
          </div>
        }
      />
      <SupportNotice context="inferencia" />

      {casos.length > 1 ? (
        <Field
          label="Caso clínico"
          hint="Las ecografías y el resultado corresponden al caso seleccionado."
        >
          <Select value={casoId} onChange={(evento) => setCasoId(evento.currentTarget.value)}>
            {casos.map((caso) => (
              <option key={caso.id} value={caso.id}>
                {caso.codigo} · {fecha(caso.creado_en)}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      {aviso ? (
        <Callout tone="success" title="Estado" role="status">
          {aviso}
        </Callout>
      ) : null}

      {errorCaso ? (
        <Callout tone="danger" title="No se pudo cargar el caso" role="alert">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{errorCaso}</span>
            <Button variant="secondary" size="sm" onClick={() => void cargarCaso(casoId)}>
              Reintentar
            </Button>
          </div>
        </Callout>
      ) : cargandoCaso ? (
        <div className="flex items-center justify-center py-10">
          <Spinner size="lg" label="Cargando el caso" />
        </div>
      ) : (
        <>
          {tieneConsentimiento ? null : (
            <Callout tone="warning" title="Falta el consentimiento para inferir">
              <div className="flex flex-col gap-3">
                <span>
                  La inferencia necesita un consentimiento vigente de atención de salud. Puedes
                  cargar ecografías, pero no analizarlas hasta registrarlo.
                </span>
                <div>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/medico/casos/${casoSeleccionado.id}`}>
                      Abrir el caso para registrar el consentimiento
                    </Link>
                  </Button>
                </div>
              </div>
            </Callout>
          )}

          {errorAnalisis ? (
            <Callout tone="danger" title="La inferencia no se completó" role="alert">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>{errorAnalisis}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (imagenReintento !== null) {
                      void analizar(imagenReintento);
                    }
                  }}
                  disabled={analizando !== null || imagenReintento === null}
                >
                  Reintentar inferencia
                </Button>
              </div>
            </Callout>
          ) : null}

          <section className="flex flex-col gap-4" aria-labelledby="ecografias-title">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="ecografias-title" className="text-lg font-semibold">
                Ecografías
              </h2>
              {imagenes.length > 0 ? (
                <Button variant="outline" size="sm" onClick={abrirSubida}>
                  Subir otra
                </Button>
              ) : null}
            </div>
            {imagenes.length === 0 ? (
              <EmptyState
                title="Sin ecografías"
                description="Sube una imagen PNG o JPEG para poder analizarla."
                action={<Button onClick={abrirSubida}>Subir ecografía</Button>}
              />
            ) : (
              <GaleriaImagenes
                imagenes={imagenes}
                analizando={analizando}
                puedeAnalizar={tieneConsentimiento}
                onAnalizar={(imagen) => void analizar(imagen)}
              />
            )}
          </section>

          <section className="flex flex-col gap-4" aria-labelledby="resultados-title">
            <h2 id="resultados-title" className="text-lg font-semibold">
              Resultados
            </h2>
            {resultados.length === 0 ? (
              <EmptyState
                title="Sin inferencias"
                description="Analiza una ecografía para ver el resultado por nódulo."
              />
            ) : (
              resultados.map((inferencia) => {
                const confianza =
                  inferencia.confianza === null
                    ? null
                    : Math.min(100, Math.max(0, inferencia.confianza * 100));
                return (
                  <article key={inferencia.id} className="flex flex-col gap-3">
                    {confianza === null ? null : (
                      <div className="flex flex-wrap items-center gap-2">
                        <ConfidenceBadge
                          value={confianza}
                          tone="ai"
                          label="Confianza del resultado"
                        />
                      </div>
                    )}
                    <ResultadoInferencia inferencia={inferencia} casoId={casoSeleccionado.id} />
                  </article>
                );
              })
            )}
          </section>
        </>
      )}

      <Dialog
        open={subidaAbierta}
        onOpenChange={(abierto) => {
          setSubidaAbierta(abierto);
          if (!abierto) {
            setArchivo(null);
            setErrorSubida(null);
          }
        }}
        title="Subir ecografía"
        description="Se guarda una copia saneada, sin metadatos EXIF ni ICC."
        footer={
          <>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={() => void subir()} disabled={archivo === null} loading={guardando}>
              Subir ecografía
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {errorSubida ? (
            <Callout tone="danger" title="No se pudo subir" role="alert">
              {errorSubida}
            </Callout>
          ) : null}
          <FileDropzone
            accept="image/png,image/jpeg"
            label="Selecciona una ecografía PNG o JPEG"
            hint="Máximo 15 MB. La copia se guarda sin metadatos."
            onFiles={elegirArchivo}
          />
          {archivo ? (
            <p className="text-sm text-muted-foreground">Archivo seleccionado: {archivo.name}</p>
          ) : null}
        </div>
      </Dialog>
    </section>
  );
}

/**
 * Ruta de inferencia del paciente; sin `id` muestra el selector de paciente.
 *
 * ## Cuándo usarlo
 * Como componente de ruta bajo `/medico/inferencia` y `/medico/pacientes/:id/inferencia`.
 * ## Cuándo no usarlo
 * No lo montes fuera de una sesión con rol médico.
 * ## Anatomía
 * Deriva al selector de paciente o a la pantalla del paciente según el parámetro de ruta.
 * ## Accesibilidad
 * Hereda las garantías de las dos vistas que compone; no añade controles propios.
 * ## Responsive
 * Ambas vistas respetan el ancho máximo de lectura y fluyen a 360, 768 y 1366 px.
 */
export function InferenciaPacientePage() {
  const { id } = useParams<{ id: string }>();
  if (id === undefined || id === '') {
    return <SelectorPaciente />;
  }
  return <InferenciaDePaciente pacienteId={id} />;
}
