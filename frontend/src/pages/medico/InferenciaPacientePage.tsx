import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { listarConsentimientos, type Consentimiento } from '../../api/consentimientos';
import { listarImagenes, type ImagenCaso } from '../../api/imagenes';
import { obtenerPaciente, type PacienteDetalle } from '../../api/pacientes';
import { listarResultados, type Inferencia } from '../../api/resultados';
import { encolarInferencia } from '../../api/trabajos';
import {
  CargandoPaciente,
  PacienteNoDisponible,
  PacienteSinCasos,
  SeleccionandoCaso,
} from './inferencia/EstadosDelPaciente';
import { SelectorPaciente } from './inferencia/SelectorPaciente';
import { VistaDelCaso } from './inferencia/VistaDelCaso';
import { useSeguimientoTrabajo } from './inferencia/useSeguimientoTrabajo';
import { useSubidaEcografia } from './inferencia/useSubidaEcografia';

/** Pantalla de inferencia de un paciente: ecografías, ejecución en cola y resultados. */
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
  const [analizando, setAnalizando] = useState<string | null>(null);
  const [errorAnalisis, setErrorAnalisis] = useState<string | null>(null);
  const [imagenReintento, setImagenReintento] = useState<ImagenCaso | null>(null);
  const solicitudPaciente = useRef(0);
  const solicitudCaso = useRef(0);
  const casoActual = useRef('');

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

  const { detener, esperar } = useSeguimientoTrabajo({
    casoActual,
    alCompletar: async (casoDelTrabajo) => {
      setAnalizando(null);
      setAviso('Inferencia completada.');
      await cargarCaso(casoDelTrabajo);
    },
    alFallar: (mensaje) => {
      setAnalizando(null);
      setAviso(null);
      setErrorAnalisis(mensaje);
    },
  });

  const subida = useSubidaEcografia({
    casoId,
    alSubir: async (subidas) => {
      setErrorAnalisis(null);
      setImagenReintento(null);
      setAviso(subidas === 1 ? 'Ecografía cargada y saneada.' : 'Ecografías cargadas y saneadas.');
      await cargarCaso(casoId);
    },
  });

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

  if (cargandoPaciente) return <CargandoPaciente />;
  if (paciente === null) {
    return (
      <PacienteNoDisponible mensaje={errorPaciente} onReintentar={() => void cargarPaciente()} />
    );
  }
  if (casos.length === 0) return <PacienteSinCasos paciente={paciente} />;
  if (casoSeleccionado === null) return <SeleccionandoCaso />;

  return (
    <VistaDelCaso
      paciente={paciente}
      casoSeleccionado={casoSeleccionado}
      casos={casos}
      casoId={casoId}
      aviso={aviso}
      errorCaso={errorCaso}
      cargandoCaso={cargandoCaso}
      subida={subida}
      imagenes={imagenes}
      resultados={resultados}
      analizando={analizando}
      errorAnalisis={errorAnalisis}
      puedeReintentar={imagenReintento !== null}
      tieneConsentimiento={tieneConsentimiento}
      onCambiarCaso={setCasoId}
      onReintentarCaso={() => void cargarCaso(casoId)}
      onAnalizar={(imagen) => void analizar(imagen)}
      onReintentarAnalisis={() => {
        if (imagenReintento !== null) void analizar(imagenReintento);
      }}
    />
  );
}

/** Ruta de inferencia; sin `id` muestra el selector de paciente. */
export function InferenciaPacientePage() {
  const { id } = useParams<{ id: string }>();
  if (id === undefined || id === '') {
    return <SelectorPaciente />;
  }
  return <InferenciaDePaciente pacienteId={id} />;
}
